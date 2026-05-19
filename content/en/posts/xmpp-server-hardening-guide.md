---
title:          "How to Harden an XMPP Server: A Practical Step-by-Step Guide"
date:           2026-05-19
draft:          false
tags:           ["xmpp", "security", "ejabberd", "linux", "hardening", "sysadmin"]
categories:     ["Guides"]
description:   "A practical guide to securing a self-hosted XMPP server, covering OS hardening, firewall rules, TLS configuration, ejabberd settings, and PostgreSQL security."
image:        "/images/posts/xmpp-server-hardening/xmpp-server-hardening.jpg"

---

Running your own XMPP server is one of the better decisions you can make if you care about private communication. No ads, no telemetry, no company reading your messages. But a poorly configured server can be worse than using a commercial service, because you are now responsible for security yourself.

This guide covers what actually matters when hardening an XMPP server. It is based on a real audit of a production ejabberd server running on Ubuntu 22.04 with nginx, PostgreSQL, and Let's Encrypt certificates. The steps are ordered by importance, so if you run out of time, at least the critical things are done first.

---

## Before You Start

You will need root or sudo access to the server. Work from two SSH sessions at the same time when making firewall or SSH changes. If one session breaks, you have the other one to recover.

Always take a backup of any config file before editing it:

```bash
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak
```

---

## Step 1: Lock Down SSH

SSH is the door to your server. Everything else depends on this being solid.

### Disable password authentication

If an attacker can try passwords over SSH, your server will be hit with constant brute-force attempts. Key-based auth only.

```bash
# /etc/ssh/sshd_config
PasswordAuthentication no
KbdInteractiveAuthentication no
```

### Make PermitRootLogin explicit

The default compiled value varies between distributions. Don't rely on it. Set it explicitly.

```bash
PermitRootLogin prohibit-password
```

This allows root login with SSH keys but not with a password. If you never log in as root directly, set it to `no`.

### Reduce MaxAuthTries

The default is 6 attempts per connection. Reduce it to make brute force slower.

```bash
MaxAuthTries 3
```

### Disable X11 forwarding

X11 forwarding is not needed on a server and can be abused for credential theft via xauth cookie hijacking.

```bash
X11Forwarding no
```

### Validate and reload

Always test the config before reloading, so a typo does not lock you out.

```bash
sshd -t && systemctl reload ssh
```

Then confirm you can still log in from a second terminal before closing your current session.

---

## Step 2: Harden the Firewall

A good firewall has a default deny policy and only opens exactly what is needed. Anything not listed is blocked.

### Set default DROP policy

The difference between DROP and ACCEPT as a default policy is the difference between a locked door and an open one.

```bash
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT ACCEPT
```

### Allow only what you need

For a typical ejabberd server:

```
# Loopback (always allow)
iptables -A INPUT -i lo -j ACCEPT

# Established connections
iptables -A INPUT -m state --state RELATED,ESTABLISHED -j ACCEPT

# ICMP with rate limiting
iptables -A INPUT -p icmp --icmp-type any -m limit --limit 10/s -j ACCEPT

# SSH - from your trusted IP only
iptables -A INPUT -s YOUR_IP/32 -p tcp --dport 22 -j ACCEPT

# Web
iptables -A INPUT -p tcp -m multiport --dports 80,443 -j ACCEPT

# XMPP client-to-server
iptables -A INPUT -p tcp -m multiport --dports 5222,5223 -j ACCEPT

# XMPP server-to-server (federation)
iptables -A INPUT -p tcp -m multiport --dports 5269,5270 -j ACCEPT

# XMPP HTTPS API and file upload
iptables -A INPUT -p tcp --dport 5443 -j ACCEPT

# STUN/TURN for voice and video
iptables -A INPUT -p udp --dport 3478 -j ACCEPT
iptables -A INPUT -p tcp --dport 5349 -j ACCEPT
iptables -A INPUT -p udp --dport 5349 -j ACCEPT

# TURN relay ports
iptables -A INPUT -p tcp -m multiport --dports 49152:65535 -j ACCEPT
iptables -A INPUT -p udp -m multiport --dports 49152:65535 -j ACCEPT

# Final deny
iptables -A INPUT -j REJECT --reject-with icmp-host-prohibited
```

### Explicitly block dangerous ports

Even if your default policy is DROP, add explicit blocks for ports that should never be reachable. This protects you if the default policy is ever accidentally reset.

```bash
# Erlang Port Mapper - never expose this
iptables -A INPUT -p tcp --dport 4369 -j DROP

# MQTT plaintext - block unless you specifically need it
iptables -A INPUT -p tcp --dport 1883 -j DROP

# RPC portmapper - unneeded on an XMPP server
iptables -A INPUT -p tcp --dport 111 -j DROP
iptables -A INPUT -p udp --dport 111 -j DROP
```

### Check IPv6

Even if you do not have a public IPv6 address, check whether your ip6tables rules are in place. A common mistake is setting up solid IPv4 rules and forgetting IPv6 entirely.

```bash
ip -6 addr show
ip6tables -L INPUT -n
```

If you have public IPv6 addresses, apply equivalent rules with ip6tables. If you only have link-local addresses (fe80::) then you have no public IPv6 exposure.

### Save and persist the rules

Rules in memory are lost on reboot. Save them and restore on startup.

```bash
iptables-save > /opt/iptables-rules

# In root crontab:
@reboot /usr/sbin/iptables-restore < /opt/iptables-rules
```

---

## Step 3: Harden the OS

These changes take a few minutes and significantly reduce the attack surface.

### Disable unnecessary services

Services you do not need are services that can be exploited. On an XMPP server you typically do not need:

```bash
systemctl disable --now rpcbind rpcbind.socket
systemctl disable --now ModemManager
systemctl disable --now avahi-daemon
```

Check what is running:

```bash
systemctl list-units --type=service --state=running
```

Question anything unfamiliar.

### Kernel hardening parameters

Add these to `/etc/sysctl.d/99-hardening.conf`:

```ini
# Disable IP source routing - prevents path manipulation attacks
net.ipv4.conf.all.accept_source_route = 0
net.ipv6.conf.all.accept_source_route = 0

# Disable ICMP redirects - prevents man-in-the-middle via fake router messages
net.ipv4.conf.all.accept_redirects = 0
net.ipv6.conf.all.accept_redirects = 0
net.ipv4.conf.all.send_redirects = 0

# Log packets with impossible source addresses
net.ipv4.conf.all.log_martians = 1

# SYN flood protection
net.ipv4.tcp_syncookies = 1

# Ignore broadcast pings - prevents use as DDoS amplifier
net.ipv4.icmp_echo_ignore_broadcasts = 1

# Full ASLR
kernel.randomize_va_space = 2

# No core dumps from SUID programs - prevents memory leaks of credentials
fs.suid_dumpable = 0

# Restrict ptrace - prevents processes from reading each other's memory
kernel.yama.ptrace_scope = 1
```

Apply:

```bash
sysctl -p /etc/sysctl.d/99-hardening.conf
```

### Review users and sudo access

Check who has a login shell and who has sudo:

```bash
grep -v "nologin\|false" /etc/passwd | grep -v "^#"
getent group sudo
```

Remove sudo from any account that does not need it. Lock accounts that are not used:

```bash
usermod -s /usr/sbin/nologin unused_account
passwd -l unused_account
```

Check for files with no valid owner (leftover from deleted users):

```bash
find / -xdev -nouser 2>/dev/null
```

### Enable automatic security updates

```bash
apt install unattended-upgrades
systemctl enable --now unattended-upgrades
```

---

## Step 4: Configure TLS Properly

### Use ECC certificates

Elliptic curve (ECC/ECDSA) certificates are smaller, faster, and equally secure compared to RSA at equivalent strength. Use acme.sh or certbot to issue an EC-384 certificate.

```bash
acme.sh --issue -d yourdomain.tld --keylength ec-384 \
  -d conference.yourdomain.tld \
  -d upload.yourdomain.tld \
  -d proxy.yourdomain.tld
```

If you are also issuing an RSA cert for compatibility, 2048-bit is the minimum and 4096-bit is preferred. But for a new server, ECC-only is cleaner.

### Generate strong DH parameters

```bash
openssl dhparam -out /etc/ssl/certs/dhparam.pem 4096
```

This takes a few minutes. Do it once and reuse the file across nginx and ejabberd.

### nginx TLS configuration

```nginx
ssl_certificate     /path/to/fullchain_ecc.pem;
ssl_certificate_key /path/to/privkey_ecc.pem;

ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers   ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-ECDSA-AES128-GCM-SHA256;
ssl_prefer_server_ciphers off;

ssl_ecdh_curve secp384r1;
ssl_dhparam /etc/ssl/certs/dhparam.pem;

ssl_session_cache shared:SSL:10m;
ssl_session_timeout 1d;
ssl_session_tickets off;
```

`ssl_prefer_server_ciphers off` is correct for TLS 1.3. `ssl_session_tickets off` is important for forward secrecy.

---

## Step 5: Harden nginx

### Security headers

```nginx
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header Referrer-Policy "no-referrer" always;
add_header Permissions-Policy "interest-cohort=()" always;
add_header Content-Security-Policy "default-src 'self'; ..." always;
```

Do not add `X-XSS-Protection`. It was deprecated years ago and removed from Chrome. Modern browsers ignore it, and old IE versions can actually behave worse with it enabled. Your Content-Security-Policy does the actual work.

### Hide the nginx version

```nginx
server_tokens off;
```

### Redirect HTTP to HTTPS

```nginx
server {
    listen 80 default_server;
    server_name _;
    return 301 https://$host$request_uri;
}
```

### Rate limit sensitive endpoints

If you have registration or invite endpoints, protect them from bots with rate limiting in nginx. This sits in front of your application logic and is much cheaper to enforce.

```nginx
# In http {} block:
limit_req_zone $binary_remote_addr zone=invites:10m rate=20r/m;

# In location blocks:
location /invites/ {
    limit_req zone=invites burst=20 nodelay;
    limit_req_status 429;
    ...
}
```

### Do not expose internal ports through nginx

If nginx proxies to ejabberd on port 8444 or similar, that backend port should be bound to localhost only. Any port that nginx proxies to should not need to be publicly accessible.

```yaml
# ejabberd - bind internal HTTP listeners to localhost
port: 8444
ip: "127.0.0.1"
```

---

## Step 6: Harden ejabberd

### Require TLS on all connections

Client-to-server connections should require STARTTLS. Plain connections should be rejected.

```yaml
listen:
  -
    port: 5222
    ip: "::"
    module: ejabberd_c2s
    starttls_required: true
  -
    port: 5269
    ip: "::"
    module: ejabberd_s2s_in
    protocol_options:
      - no_sslv2
      - no_sslv3
      - no_tlsv1
      - no_tlsv1_1
```

Also require TLS for server-to-server federation:

```yaml
s2s_use_starttls: required
```

### Use SCRAM password storage

Never store passwords in plaintext. Use SCRAM, which stores a salted hash that cannot be reversed to recover the original password.

```yaml
auth_password_format: scram
```

### Disable weak SASL mechanisms

```yaml
disable_sasl_mechanisms:
  - "digest-md5"
  - "X-OAUTH2"
```

DIGEST-MD5 requires reversible password storage, which defeats the purpose of SCRAM. Disable it.

### Configure fail2ban

ejabberd has a built-in brute force protection module. Use it.

```yaml
mod_fail2ban:
  c2s_auth_ban_lifetime: 6h
  c2s_max_auth_failures: 5
```

Five failed attempts results in a six-hour ban from connecting.

### Bind admin ports to internal IP only

The admin web panel and API ports should not be accessible from the public internet, even if your firewall restricts them. Bind them to your internal interface.

```yaml
  -
    port: 6443
    ip: "172.16.x.x"   # your server's internal IP, not ::
    module: ejabberd_http
    tls: true
    request_handlers:
      /admin: ejabberd_web_admin
```

### Disable unused modules and listeners

If you are not using MQTT, comment it out:

```yaml
# mod_mqtt: {}
```

If you are not using ejabberd's built-in ACME (because you use acme.sh instead), comment out the port 5280 listener entirely:

```yaml
# -
#   port: 5280
#   ip: "::"
#   module: ejabberd_http
```

Every module that is loaded is code that runs. Keep only what you actually use.

### Lock down the Erlang distribution port

This is one of the most overlooked issues on ejabberd servers. Erlang uses a port mapper daemon (epmd) and a separate distribution port for inter-node communication. By default these listen on all interfaces.

In `/opt/ejabberd/conf/ejabberdctl.cfg`, uncomment:

```bash
INET_DIST_INTERFACE=127.0.0.1
ERL_DIST_PORT=5210
ERL_EPMD_ADDRESS=127.0.0.1
```

Then restart ejabberd (not just reload):

```bash
systemctl restart ejabberd
```

After this, epmd is no longer needed and will not start. The distribution port will be on localhost only at a fixed port, which is much easier to audit.

Verify:

```bash
ss -tlnp | grep -E "4369|5210"
# Should only show 127.0.0.1:5210 or nothing at all
```

---

## Step 7: Harden PostgreSQL

### Listen on localhost only

By default PostgreSQL listens on localhost. Make it explicit in `postgresql.conf`:

```ini
listen_addresses = 'localhost'
```

Verify it is not exposed externally:

```bash
ss -tlnp | grep postgres
# Should show 127.0.0.1:5432 only
```

### Use scram-sha-256 authentication

In `pg_hba.conf`, use scram-sha-256 instead of md5 for all TCP connections. md5 is weak and has been deprecated.

```
host    all    all    127.0.0.1/32    scram-sha-256
host    all    all    ::1/128         scram-sha-256
```

Never use `trust` authentication. Trust means no password is required.

### Give ejabberd minimal database privileges

The ejabberd database user should only be able to access the ejabberd database. No superuser, no createdb, no replication rights.

```sql
CREATE USER ejabberd WITH PASSWORD 'strong_password';
GRANT CONNECT ON DATABASE ejabberd TO ejabberd;
GRANT USAGE ON SCHEMA public TO ejabberd;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ejabberd;
```

### Remove unused pg_hba entries

If you are not running a PostgreSQL replica, remove the replication entries from `pg_hba.conf`. They are there by default and serve no purpose on a standalone server.

---

## Step 8: Set Up Intrusion Detection

### Install CrowdSec

CrowdSec is a modern replacement for fail2ban with a community threat intelligence feed. It detects attacks in your logs and blocks attackers automatically, while also sharing anonymized attack data with the CrowdSec network.

```bash
curl -s https://install.crowdsec.net | bash
apt install crowdsec-firewall-bouncer-iptables
```

CrowdSec will automatically detect common attacks on SSH, nginx, and ejabberd if you configure the right parsers.

### Backup your firewall rules

Your firewall rules should survive a reboot. Test this by rebooting and verifying the rules are loaded:

```bash
iptables -L INPUT -n | head -5
```

---

## Things Worth Checking Periodically

Once the server is running, set aside time every few months to go through these:

**Certificate expiry.** Even with automatic renewal, check that it is actually working. A server with an expired certificate breaks all client connections immediately.

```bash
acme.sh --list
openssl x509 -in /path/to/fullchain.pem -noout -enddate
```

**Failed login attempts.** Look at what CrowdSec or fail2ban has been blocking. Patterns in the source IPs and timing can tell you if someone is specifically targeting your server.

```bash
cscli decisions list
journalctl -u ssh | grep "Failed"
```

**Listening ports.** Run `ss -tlnp` occasionally and compare against what you expect. A new port appearing is worth investigating.

**Users and sudo.** After any team changes, verify the sudo group is still correct. Accounts for people who no longer have access should be locked or deleted.

**OS updates.** `unattended-upgrades` handles security patches automatically, but check occasionally that it is still running and that no manual package holds are blocking critical updates.

---

## Quick Reference: What Each Port Does

For ejabberd specifically, here is what each port is for so you know what to open and what to leave closed:

| Port | Protocol | Purpose | Open to |
|------|----------|---------|---------|
| 5222 | TCP | XMPP client connections (STARTTLS) | Everyone |
| 5223 | TCP | XMPP client connections (Direct TLS) | Everyone |
| 5269 | TCP | Federation inbound (STARTTLS) | Everyone |
| 5270 | TCP | Federation inbound (Direct TLS) | Everyone |
| 5443 | TCP | BOSH, WebSocket, file upload | Everyone |
| 5280 | TCP | HTTP admin / ACME challenge | Trusted IP or localhost only |
| 6443 | TCP | Admin web panel | Trusted IP only |
| 8444 | TCP | Registration, invites (proxied) | Localhost only |
| 3478 | UDP | STUN | Everyone |
| 5349 | TCP/UDP | TURN over TLS | Everyone |
| 4369 | TCP | Erlang epmd | Block completely |
| 1883 | TCP | MQTT (plaintext) | Block unless needed |
| 5210 | TCP | Erlang distribution (fixed) | Localhost only |

---

## A Note on Defense in Depth

None of these steps is a magic solution on its own. The goal is to make every layer independently secure, so that if one thing fails or is misconfigured, another layer catches it.

For example: bind ejabberd's admin port to localhost AND restrict it in iptables. If someone accidentally modifies the ejabberd config, iptables still blocks it. If someone accidentally removes the iptables rule, the bind address still restricts it. Two independent controls for one sensitive port.

The same applies to registration. Use hCaptcha at the nginx layer AND configure rate limiting AND use ejabberd's fail2ban module. Bots that get past one layer will hit the next.

Self-hosting XMPP is worth the effort. With a properly configured server you get genuinely private communications under your own control. The hardening steps above are not optional extras. They are part of what it means to run a server responsibly.
