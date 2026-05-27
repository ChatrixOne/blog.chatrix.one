---
title: "Running a Hardened ejabberd XMPP Server with Bot-Proof Registration"
date: "2026-05-21"
author: "Chatrix.One"
tags: ["ejabberd", "xmpp", "self-hosting", "privacy", "linux", "nginx", "security", "hardening"]
description: "A complete guide to spinning up a production-ready ejabberd XMPP server on Debian/Ubuntu, with DNS, SSL, nginx reverse proxy, firewall hardening, and hCaptcha-protected invite-based registration."
image: "/images/posts/running-a-hardened-ejabberd-xmpp-server/running-a-hardened-ejabberd-xmpp-server.jpg"
draft: true
---

So you want to run your own XMPP server. Not because it is trendy, but because you want a communication platform you actually control, with no ads, no telemetry, and no terms of service that change every six months. Good reasons all of them.

This guide walks through the entire process from a fresh VPS to a fully working, hardened ejabberd server with bot-proof registration. Every configuration file is shown in full. Every command is ready to copy and paste.

The end result is a server that:

- Runs ejabberd 26.x with modern XMPP extensions
- Uses nginx as a reverse proxy with proper TLS
- Protects registration with hCaptcha and AbuseIPDB checks
- Issues single-use invite tokens instead of open registration
- Blocks bots at multiple layers before they ever touch ejabberd
- Keeps the Erlang runtime locked to localhost
- Routes all admin access through nginx with IP restrictions
- Passes a full security audit out of the box

This guide assumes a fresh Debian 12 or Ubuntu 24.04 VPS. A 2 core / 2 GB RAM machine is plenty for a community server of a few hundred users.

---

## Part 1: DNS Records

Before touching the server, get your DNS right. XMPP relies heavily on SRV records for client and server discovery. Without them, other servers cannot federate with yours and clients cannot auto-configure.

Replace `domain.tld` with your actual domain everywhere below.

### A and AAAA Records

```
domain.tld.               A      YOUR_SERVER_IPV4
domain.tld.               AAAA   YOUR_SERVER_IPV6
conference.domain.tld.    A      YOUR_SERVER_IPV4
conference.domain.tld.    AAAA   YOUR_SERVER_IPV6
upload.domain.tld.        A      YOUR_SERVER_IPV4
upload.domain.tld.        AAAA   YOUR_SERVER_IPV6
proxy.domain.tld.         A      YOUR_SERVER_IPV4
proxy.domain.tld.         AAAA   YOUR_SERVER_IPV6
pubsub.domain.tld.        A      YOUR_SERVER_IPV4
pubsub.domain.tld.        AAAA   YOUR_SERVER_IPV6
```

### SRV Records for Client Connections (c2s)

```
_xmpp-client._tcp.domain.tld.   SRV   0 5 5222 domain.tld.
_xmpps-client._tcp.domain.tld.  SRV   0 5 5223 domain.tld.
```

### SRV Records for Server Federation (s2s)

```
_xmpp-server._tcp.domain.tld.            SRV   0 5 5269 domain.tld.
_xmpps-server._tcp.domain.tld.           SRV   0 5 5270 domain.tld.
_xmpp-server._tcp.conference.domain.tld. SRV   0 5 5269 domain.tld.
```

### TXT Records

```
domain.tld.   TXT   "v=spf1 ip4:YOUR_SERVER_IPV4 -all"
```

If you plan to send email from the server (for notifications), also add a DMARC record:

```
_dmarc.domain.tld.   TXT   "v=DMARC1; p=reject; rua=mailto:admin@domain.tld"
```

### SRV for STUN/TURN (voice and video calls)

```
_stun._udp.domain.tld.   SRV   0 5 3478 domain.tld.
_turn._udp.domain.tld.   SRV   0 5 3478 domain.tld.
_stun._tcp.domain.tld.   SRV   0 5 3478 domain.tld.
_turn._tcp.domain.tld.   SRV   0 5 3478 domain.tld.
_turns._tcp.domain.tld.  SRV   0 5 5349 domain.tld.
```

Give DNS changes 10-15 minutes to propagate before continuing.

---

## Part 2: OS Install and Hardening

### Update the system

```bash
apt update && apt full-upgrade -y
apt install -y curl wget git unzip ufw fail2ban vim htop
```

### Create a non-root admin user

```bash
adduser admin
usermod -aG sudo admin
```

### Harden SSH

Open the SSH config:

```bash
vim /etc/ssh/sshd_config
```

Set these values (add or change existing lines):

```
Port 2222
PermitRootLogin prohibit-password
PasswordAuthentication no
PubkeyAuthentication yes
X11Forwarding no
AllowTcpForwarding no
MaxAuthTries 3
LoginGraceTime 20
KbdInteractiveAuthentication no
```

A note on `PermitRootLogin`: the original guide used `no`, which is fine if you never need root SSH access. Using `prohibit-password` is a good middle ground. It allows root login with SSH keys only (no password), which keeps your options open while still preventing brute force attacks. Whatever you choose, make it explicit. The compiled default varies between distributions and relying on it is asking for surprises.

Copy your public key to the server before restarting SSH:

```bash
# Run this on your LOCAL machine, not the server
ssh-copy-id -p 22 admin@YOUR_SERVER_IP
```

Validate the config before restarting. A typo in sshd_config that locks you out is no fun:

```bash
sshd -t && echo "Config OK"
```

Then restart SSH:

```bash
systemctl restart sshd
```

Open a second terminal and test login before closing your current session. This is not optional. Always keep two sessions open when making SSH changes.

### Disable unnecessary services

Services you do not need are services that can be exploited. On an XMPP server you typically do not need any of these:

```bash
systemctl disable --now rpcbind rpcbind.socket
systemctl disable --now ModemManager
systemctl disable --now avahi-daemon
```

Check what else is running:

```bash
systemctl list-units --type=service --state=running
```

Question anything unfamiliar. Cloud providers often install agents and tools you did not ask for. Review them.

### Configure the firewall

This guide uses raw iptables rather than ufw for more precise control. The key difference from basic firewall guides is that we use a default DROP policy, add explicit blocks for dangerous ports, and save the rules to survive a reboot.

```bash
# Set default policies first
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT ACCEPT

# Loopback
iptables -A INPUT -i lo -j ACCEPT

# Established connections
iptables -A INPUT -m state --state RELATED,ESTABLISHED -j ACCEPT

# ICMP with rate limiting (prevents use as DDoS amplifier)
iptables -A INPUT -p icmp --icmp-type any -m limit --limit 10/s --limit-burst 20 -j ACCEPT
iptables -A INPUT -p icmp -j DROP

# NTP responses
iptables -A INPUT -p udp --sport 123 -j ACCEPT

# SSH - from your trusted IP only
iptables -A INPUT -s YOUR_TRUSTED_IP/32 -p tcp --dport 2222 -j ACCEPT

# Web
iptables -A INPUT -p tcp -m multiport --dports 80,443 -j ACCEPT

# XMPP client connections
iptables -A INPUT -p tcp -m multiport --dports 5222,5223 -j ACCEPT

# XMPP server federation
iptables -A INPUT -p tcp -m multiport --dports 5269,5270 -j ACCEPT

# XMPP HTTPS (BOSH, WebSocket, file upload)
iptables -A INPUT -p tcp --dport 5443 -j ACCEPT

# STUN/TURN for voice and video
iptables -A INPUT -p udp --dport 3478 -j ACCEPT
iptables -A INPUT -p tcp --dport 5349 -j ACCEPT
iptables -A INPUT -p udp --dport 5349 -j ACCEPT

# TURN relay ports
iptables -A INPUT -p tcp -m multiport --dports 49152:65535 -j ACCEPT
iptables -A INPUT -p udp -m multiport --dports 49152:65535 -j ACCEPT

# Explicit blocks for ports that should never be reachable
iptables -A INPUT -p tcp --dport 4369 -j DROP   # Erlang epmd
iptables -A INPUT -p tcp --dport 1883 -j DROP   # MQTT plaintext
iptables -A INPUT -p tcp --dport 111  -j DROP   # rpcbind
iptables -A INPUT -p udp --dport 111  -j DROP

# Final deny
iptables -A INPUT -j REJECT --reject-with icmp-host-prohibited
iptables -A FORWARD -j REJECT --reject-with icmp-host-prohibited
```

The explicit DROP rules for ports like 4369 and 1883 are there because a default DROP policy can accidentally be reset, particularly on some cloud providers that manage their own firewall rules. The explicit DROP stays even if someone fumbles the default policy.

Save the rules so they survive a reboot:

```bash
apt install -y iptables-persistent
iptables-save > /etc/iptables/rules.v4
```

Or if you prefer crontab:

```bash
iptables-save > /opt/iptables-rules

# Add to root crontab:
crontab -e
# Add this line:
@reboot /usr/sbin/iptables-restore < /opt/iptables-rules
```

Test that rules survive reboot before going further. A server with no firewall after a reboot is a real risk.

### Check IPv6

Even if your VPS does not have a public IPv6 address, check:

```bash
ip -6 addr show
ip6tables -L INPUT -n
```

If you only see loopback (`::1`) and link-local addresses (`fe80::`) then you have no public IPv6 exposure and do not need ip6tables rules. If you have a public IPv6 address, apply equivalent rules with ip6tables. The most common mistake is setting up solid IPv4 rules and forgetting IPv6 entirely.

### Configure fail2ban

Create a custom jail for SSH:

```bash
vim /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
bantime  = 3600
findtime = 600
maxretry = 5
backend  = systemd

[sshd]
enabled  = true
port     = 2222
logpath  = %(sshd_log)s
maxretry = 3
bantime  = 86400
```

```bash
systemctl enable fail2ban
systemctl restart fail2ban
```

### Set the hostname

```bash
hostnamectl set-hostname domain.tld
echo "YOUR_SERVER_IPV4 domain.tld" >> /etc/hosts
```

### Kernel hardening

```bash
vim /etc/sysctl.d/99-hardening.conf
```

```ini
# Disable IP forwarding
net.ipv4.ip_forward = 0

# Ignore ICMP broadcast requests (prevents Smurf amplification attacks)
net.ipv4.icmp_echo_ignore_broadcasts = 1

# Disable source routing (prevents path manipulation attacks)
net.ipv4.conf.all.accept_source_route = 0
net.ipv6.conf.all.accept_source_route = 0

# Enable SYN flood protection
net.ipv4.tcp_syncookies = 1

# Ignore bogus ICMP errors
net.ipv4.icmp_ignore_bogus_error_responses = 1

# Do not accept ICMP redirects (prevents man-in-the-middle via fake router messages)
net.ipv4.conf.all.accept_redirects = 0
net.ipv6.conf.all.accept_redirects = 0
net.ipv4.conf.all.send_redirects = 0

# Log packets with impossible source addresses
net.ipv4.conf.all.log_martians = 1

# Full ASLR (address space randomization)
kernel.randomize_va_space = 2

# No core dumps from SUID programs (prevents memory leaks of credentials)
fs.suid_dumpable = 0

# Restrict ptrace (prevents processes from reading each other's memory)
kernel.yama.ptrace_scope = 1
```

```bash
sysctl -p /etc/sysctl.d/99-hardening.conf
```

### Enable automatic security updates

```bash
apt install -y unattended-upgrades
systemctl enable --now unattended-upgrades
```

This quietly applies security patches without you having to remember to run `apt upgrade`. Check occasionally that it is still running.

### Review users and orphaned files

After setup, verify no unexpected accounts have login shells or sudo access:

```bash
grep -v "nologin\|false" /etc/passwd | grep -v "^#"
getent group sudo
```

Check for files with no valid owner (can indicate leftover accounts or past intrusions):

```bash
find / -xdev -nouser 2>/dev/null
```

---

## Part 3: SSL Certificates

Install acme.sh for certificate management:

```bash
curl https://get.acme.sh | sh -s email=admin@domain.tld
source ~/.bashrc
```

Use EC-384 (elliptic curve) certificates. They are smaller and faster than RSA while being equally secure. Modern clients all support them.

Issue a certificate covering all your subdomains:

```bash
acme.sh --issue \
  -d domain.tld \
  -d conference.domain.tld \
  -d upload.domain.tld \
  -d proxy.domain.tld \
  -d pubsub.domain.tld \
  --keylength ec-384 \
  --webroot /var/www/html \
  --server letsencrypt
```

Install the certificate:

```bash
mkdir -p /etc/ssl/live/domain.tld

acme.sh --install-cert -d domain.tld \
  --ecc \
  --cert-file      /etc/ssl/live/domain.tld/cert_ecc.pem \
  --key-file       /etc/ssl/live/domain.tld/privkey_ecc.pem \
  --fullchain-file /etc/ssl/live/domain.tld/fullchain_ecc.pem \
  --reloadcmd      "systemctl reload nginx && ejabberdctl reload_config"
```

The `--reloadcmd` reloads both nginx and ejabberd automatically after each renewal so you never end up with a renewed certificate that the services are not actually using.

Generate DH parameters. This takes a few minutes but you only do it once:

```bash
openssl dhparam -out /etc/ssl/certs/dhparam.pem 4096
```

4096-bit DH params are overkill for some, but the generation cost is paid once at setup time and never again. It is worth it.

---

## Part 4: nginx

### Install nginx

```bash
apt install -y nginx
systemctl enable nginx
```

### Global nginx config

```bash
vim /etc/nginx/nginx.conf
```

```nginx
user www-data;
worker_processes auto;
pid /run/nginx.pid;

events {
    worker_connections 1024;
    multi_accept on;
    use epoll;
}

http {
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_names_hash_bucket_size 64;
    server_tokens off;

    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    real_ip_header X-Forwarded-For;
    real_ip_recursive on;

    access_log /var/log/nginx/access.log;
    error_log  /var/log/nginx/error.log;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Rate limiting zone for registration and invite endpoints
    limit_req_zone $binary_remote_addr zone=invites:10m rate=20r/m;

    include /etc/nginx/conf.d/*.conf;
}
```

### Main site config

```bash
vim /etc/nginx/conf.d/domain.tld.conf
```

```nginx
server {
    listen 80 default_server;
    server_name domain.tld conference.domain.tld proxy.domain.tld pubsub.domain.tld upload.domain.tld;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl default_server;
    http2 on;

    server_name domain.tld conference.domain.tld proxy.domain.tld pubsub.domain.tld upload.domain.tld;

    root /var/www/domain.tld/site/;
    index index.html index.htm;

    access_log /var/log/nginx/access.log;
    error_log  /var/log/nginx/error.log;

    client_max_body_size 2M;

    # TLS
    ssl_certificate     /etc/ssl/live/domain.tld/fullchain_ecc.pem;
    ssl_certificate_key /etc/ssl/live/domain.tld/privkey_ecc.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers   ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-ECDSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    ssl_ecdh_curve secp384r1;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;

    ssl_dhparam /etc/ssl/certs/dhparam.pem;

    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate /etc/ssl/live/domain.tld/fullchain_ecc.pem;
    resolver 1.1.1.1 8.8.8.8 valid=300s;
    resolver_timeout 5s;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;
    add_header Permissions-Policy "interest-cohort=()";
    add_header Referrer-Policy "no-referrer" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Download-Options "noopen" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Robots-Tag "none" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.hcaptcha.com https://newassets.hcaptcha.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https://*.hcaptcha.com; connect-src 'self' https://hcaptcha.com https://*.hcaptcha.com; frame-src https://newassets.hcaptcha.com; worker-src 'self' blob:; media-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; upgrade-insecure-requests;" always;

    # Note: do not add X-XSS-Protection. It was deprecated years ago, removed
    # from Chrome, and can actually cause problems in old IE. Your CSP header
    # does the real work here.

    # Common proxy headers
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # hCaptcha gate
    location = /invites/_check {
        internal;
        proxy_pass              http://127.0.0.1:5555;
        proxy_pass_request_body off;
        proxy_set_header        Content-Length "";
        proxy_set_header        X-Original-URI $request_uri;
    }

    location /invites/_challenge {
        limit_req zone=invites burst=20 nodelay;
        limit_req_status 429;
        proxy_pass http://127.0.0.1:5555;
    }

    location /invites/_verify {
        limit_req zone=invites burst=20 nodelay;
        limit_req_status 429;
        proxy_pass http://127.0.0.1:5555;
    }

    # Protected invites area
    location /invites/ {
        limit_req zone=invites burst=20 nodelay;
        limit_req_status 429;
        auth_request /invites/_check;
        error_page 401 = @invites_challenge;

        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_pass https://127.0.0.1:8444;
    }

    location @invites_challenge {
        return 302 /invites/_challenge?next=$request_uri;
    }

    # Registration entry point
    location = /join {
        limit_req zone=invites burst=20 nodelay;
        limit_req_status 429;
        return 302 /invites/_challenge;
    }

    # User registration (proxied to ejabberd)
    location /user/ {
        limit_req zone=invites burst=20 nodelay;
        limit_req_status 429;
        auth_request /invites/_check;
        error_page 401 = @invites_challenge;
        proxy_pass https://127.0.0.1:8444/register/;
    }

    # ejabberd HTTP endpoints
    location /captcha {
        proxy_pass https://127.0.0.1:8444/captcha/;
    }

    location /share {
        proxy_pass https://127.0.0.1:8444/share/;
    }

    # File uploads - proxied through nginx so the port never appears in URLs
    # Without this, upload URLs would show as aesgcm://domain.tld:5443/upload/...
    # With this, they are clean: aesgcm://domain.tld/upload/...
    location /upload {
        proxy_pass https://127.0.0.1:5443/upload;
        proxy_ssl_verify off;

        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_request_buffering off;
        client_max_body_size 105M;
    }

    # ejabberd admin panel - restricted to trusted IPs
    # Bound to localhost in ejabberd so it cannot be reached directly
    location /xmpp-admin {
        allow YOUR_TRUSTED_IP_1/32;
        allow YOUR_TRUSTED_IP_2/32;
        deny all;

        limit_req zone=invites burst=10 nodelay;
        limit_req_status 429;

        proxy_pass https://127.0.0.1:8444/admin;
        proxy_ssl_verify off;

        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location = /favicon.ico {
        log_not_found off;
        access_log off;
    }

    location = /robots.txt {
        allow all;
        log_not_found off;
        access_log off;
    }

    location /.well-known/host-meta {
        default_type application/xrd+xml;
        add_header Access-Control-Allow-Origin '*' always;
    }

    location /.well-known/host-meta.json {
        default_type application/jrd+json;
        add_header Access-Control-Allow-Origin '*' always;
    }
}

# Stub status for monitoring - localhost only
server {
    listen 127.0.0.1:80;
    server_name 127.0.0.1;
    location /nginx_status {
        stub_status on;
        allow 127.0.0.1;
        deny all;
    }
}
```

A few things worth explaining in this config:

**`ssl_session_tickets off`** is important for forward secrecy. Session tickets allow TLS sessions to be resumed using a server-side key. If that key is ever compromised, past sessions could be decrypted. Disabling tickets means each session stands alone.

**`ssl_prefer_server_ciphers off`** is correct for TLS 1.3. In TLS 1.3 the client and server negotiate ciphers differently, and letting the client pick is fine because all TLS 1.3 ciphers are strong.

**`proxy_ssl_verify off`** on the localhost proxy connections is intentional and safe. nginx is connecting to ejabberd on 127.0.0.1, so there is no network between them for anyone to intercept. Certificate verification is there to protect against man-in-the-middle attacks over the network, which cannot happen on loopback.

**The `/upload` proxy** routes file uploads through nginx on port 443, so the port number never appears in file URLs. Without this, clients would generate URLs like `aesgcm://domain.tld:5443/upload/...`. With this proxy in place they are clean: `aesgcm://domain.tld/upload/...`.

Enable the site:

```bash
mkdir -p /var/www/domain.tld/site
nginx -t
systemctl reload nginx
```

---

## Part 5: ejabberd

### Install ejabberd

Download the latest release from the ProcessOne website rather than using the distribution package, which is often outdated:

```bash
wget https://www.process-one.net/downloads/ejabberd/26.04/ejabberd_26.04-0_amd64.deb
apt install -y ./ejabberd_26.04-0_amd64.deb
systemctl enable ejabberd
```

### Harden the Erlang runtime

This is one of the most overlooked steps in ejabberd hardening. Erlang uses a port mapper daemon (epmd on port 4369) and a separate distribution port for inter-node communication. By default both listen on all interfaces.

The distribution port in particular is dangerous. If an attacker can reach it and knows your Erlang cookie, they have full remote code execution on the server. By default the port is random, which makes it harder to firewall reliably.

Fix this before starting ejabberd:

```bash
vim /opt/ejabberd/conf/ejabberdctl.cfg
```

Find and uncomment these three lines:

```bash
INET_DIST_INTERFACE=127.0.0.1
ERL_DIST_PORT=5210
ERL_EPMD_ADDRESS=127.0.0.1
```

With `ERL_DIST_PORT` set, epmd is no longer needed at all. Erlang uses the fixed port directly and epmd never starts. The distribution port is on localhost at a known fixed port rather than a random public one.

### Generate DH parameters for ejabberd

```bash
openssl dhparam -out /opt/ejabberd/conf/dh4096.pem 4096
```

### Full ejabberd.yml

This is a complete, production-ready configuration. Replace every instance of `domain.tld` with your actual domain and `YOUR_SERVER_IPV4` with your server's public IP address.

```bash
vim /opt/ejabberd/conf/ejabberd.yml
```

```yaml
hosts:
  - domain.tld

loglevel: 3
log_rotate_count: 0

hide_sensitive_log_data: true

certfiles:
  - /etc/ssl/live/domain.tld/fullchain_ecc.pem
  - /etc/ssl/live/domain.tld/privkey_ecc.pem

ca_file: /opt/ejabberd/conf/cacert.pem
s2s_cafile: /etc/ssl/certs/ca-certificates.crt

s2s_dhfile: /opt/ejabberd/conf/dh4096.pem
c2s_dhfile: /opt/ejabberd/conf/dh4096.pem

s2s_use_starttls: required

s2s_ciphers: "ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256"

# Database
sql_type: pgsql
sql_server: 127.0.0.1
sql_database: ejabberd
sql_username: ejabberd
sql_password: 'YourStrongDatabasePassword'

auth_method: sql
update_sql_schema: true
update_sql_schema_timeout: 300

# Disable weak authentication mechanisms
disable_sasl_mechanisms:
  - "digest-md5"
  - "X-OAUTH2"

# Store passwords as SCRAM hashes, never plaintext
auth_password_format: scram

# Captcha
captcha_cmd: /opt/ejabberd/conf/captcha.sh
captcha_url: https://domain.tld/captcha
captcha_limit: 5

# Limit registration frequency from a single IP
registration_timeout: 3600

trusted_proxies:
  - 127.0.0.1

listen:
  - port: 5222
    ip: "::"
    module: ejabberd_c2s
    max_stanza_size: 262144
    shaper: c2s_shaper
    access: c2s
    starttls_required: true

  - port: 5223
    ip: "::"
    module: ejabberd_c2s
    max_stanza_size: 262144
    shaper: c2s_shaper
    access: c2s
    tls: true

  - port: 5269
    ip: "::"
    module: ejabberd_s2s_in
    max_stanza_size: 524288
    protocol_options:
      - no_sslv2
      - no_sslv3
      - no_tlsv1
      - no_tlsv1_1

  - port: 5270
    ip: "::"
    tls: true
    module: ejabberd_s2s_in
    max_stanza_size: 524288
    protocol_options:
      - no_sslv2
      - no_sslv3
      - no_tlsv1
      - no_tlsv1_1

  - port: 5443
    ip: "::"
    module: ejabberd_http
    tls: true
    request_handlers:
      /bosh: mod_bosh
      /upload: mod_http_upload
      /websocket: ejabberd_http_ws

  # Internal HTTP listeners bound to localhost only
  # These are proxied through nginx and must not be publicly reachable
  - port: 8444
    ip: "127.0.0.1"
    module: ejabberd_http
    tls: true
    request_handlers:
      /captcha: ejabberd_captcha
      /register: mod_register_web
      /invites: mod_invites
      /share: mod_http_fileserver
      /admin: ejabberd_web_admin

  # STUN/TURN for voice and video calls
  - port: 3478
    transport: udp
    module: ejabberd_stun
    use_turn: true
    turn_min_port: 49152
    turn_max_port: 65535
    turn_ipv4_address: YOUR_SERVER_IPV4

  - port: 5349
    transport: tcp
    module: ejabberd_stun
    use_turn: true
    tls: true
    turn_min_port: 49152
    turn_max_port: 65535
    ip: YOUR_SERVER_IPV4
    turn_ipv4_address: YOUR_SERVER_IPV4

acl:
  admin:
    user:
      - "admin@domain.tld"
  local:
    user_regexp: ""
  loopback:
    ip:
      - 127.0.0.0/8
      - ::1/128

access_rules:
  local:
    allow: local
  c2s:
    deny: blocked
    allow: all
  announce:
    allow: admin
  configure:
    allow: admin
  muc_create:
    allow: local
  pubsub_createnode:
    allow: local
  trusted_network:
    allow: loopback

api_permissions:
  "webadmin commands":
    from: ejabberd_web_admin
    who: admin
    what: "*"
  "console commands":
    from:
      - ejabberd_ctl
    who: all
    what: "*"
  "admin access":
    who:
      access:
        allow:
          - acl: loopback
          - acl: admin
      oauth:
        scope: "ejabberd:admin"
        access:
          allow:
            - acl: loopback
            - acl: admin
    what:
      - "*"
      - "!stop"
      - "!start"
  "public commands":
    who:
      ip: 127.0.0.1/8
    what:
      - status
      - connected_users_number

shaper:
  normal:
    rate: 3000
    burst_size: 20000
  fast: 100000

shaper_rules:
  max_user_sessions: 10
  max_user_offline_messages:
    - 5000: admin
    - 100: all
  soft_upload_quota:
    859: all
  hard_upload_quota:
    954: all
  c2s_shaper:
    none: admin
    normal: all
  s2s_shaper: fast

modules:
  mod_adhoc: {}
  mod_admin_extra: {}
  mod_announce:
    access: announce
  mod_antispam:
    rtbl_services:
      - xmppbl.org
  mod_auth_fast:
    token_lifetime: 14days
  mod_avatar: {}
  mod_blocking: {}
  mod_bosh: {}
  mod_caps: {}
  mod_carboncopy: {}
  mod_client_state: {}
  mod_configure: {}
  mod_disco:
    server_info:
      - name: abuse-addresses
        modules: all
        urls:
          - mailto:admin@domain.tld
          - xmpp:admin@domain.tld
  mod_fail2ban:
    c2s_auth_ban_lifetime: 6h
    c2s_max_auth_failures: 5
  mod_http_api: {}
  mod_http_fileserver:
    docroot: /usr/share/javascript
  mod_http_upload:
    # No port in the URL because nginx proxies /upload on port 443
    put_url: https://@HOST_URL_ENCODE@/upload
    docroot: /var/www/domain.tld/upload
    secret_length: 40
    custom_headers:
      "Access-Control-Allow-Origin": "https://domain.tld"
      "Access-Control-Allow-Methods": "GET,HEAD,PUT,OPTIONS"
      "Access-Control-Allow-Headers": "Content-Type"
    max_size: 104857600
    rm_on_unregister: true
  mod_http_upload_quota:
    max_days: 28
  mod_invites:
    landing_page: https://{{ host }}/invites/{{ invite.token }}/registration
    site_name: domain.tld
    token_expire_seconds: 7200
    max_invites: 10
  mod_last: {}
  mod_mam:
    db_type: sql
    assume_mam_usage: true
    default: always
  mod_muc:
    access:
      - allow
    access_admin:
      - allow: admin
    access_create: muc_create
    access_persistent: muc_create
    access_mam:
      - allow
    default_room_options:
      mam: true
  mod_muc_admin: {}
  mod_offline:
    access_max_user_messages: max_user_offline_messages
  mod_ping: {}
  mod_pres_counter:
    count: 5
    interval: 30 secs
  mod_privacy: {}
  mod_private: {}
  mod_proxy65:
    access: local
    max_connections: 5
  mod_pubsub:
    access_createnode: pubsub_createnode
    plugins:
      - flat
      - pep
    force_node_config:
      storage:bookmarks:
        access_model: whitelist
  mod_push: {}
  mod_push_keepalive: {}
  mod_register:
    redirect_url: https://domain.tld/join
    password_strength: 64
    captcha_protected: true
    registration_watchers:
      - "admin@domain.tld"
    welcome_message:
      subject: "Welcome to domain.tld!"
      body: |-
        Hello and welcome to domain.tld!
        A privacy-focused XMPP server with no ads and no telemetry.
        Website: https://domain.tld
        Support: admin@domain.tld
    ip_access: all
  mod_roster:
    versioning: true
  mod_s2s_bidi: {}
  mod_s2s_dialback: {}
  mod_shared_roster: {}
  mod_stream_mgmt:
    resend_on_timeout: if_offline
  mod_stun_disco:
    credentials_lifetime: 12h
    services:
      - host: YOUR_SERVER_IPV4
        port: 3478
        type: stun
        transport: udp
        restricted: false
      - host: YOUR_SERVER_IPV4
        port: 3478
        type: turn
        transport: udp
        restricted: true
      - host: domain.tld
        port: 5349
        type: stuns
        transport: tcp
        restricted: false
      - host: domain.tld
        port: 5349
        type: turns
        transport: tcp
        restricted: true
  mod_vcard:
    search: false
  mod_vcard_xupdate: {}
  mod_version:
    show_os: false
```

A few things worth highlighting in this config:

**`auth_password_format: scram`** stores passwords as SCRAM hashes. This means that even if your database is compromised, the attacker gets hashes that cannot be reversed to recover the original passwords.

**`disable_sasl_mechanisms`** removes DIGEST-MD5, which requires reversible password storage and defeats the point of SCRAM. Remove it.

**`mod_fail2ban`** is ejabberd's built-in brute force protection. Five failed logins results in a six-hour ban. This runs inside ejabberd and catches attacks at the XMPP protocol level, before they hit your system auth.

**`show_os: false`** on `mod_version` means clients that query your server version do not get your operating system name and version in the response. No reason to give that away.

**`put_url`** has no port number because nginx proxies `/upload` on port 443. Without this, file URLs in chat clients would show the port: `aesgcm://domain.tld:5443/upload/...`. With it they are clean.

**All internal HTTP listeners are bound to `127.0.0.1`**, not `::`. Port 8444 handles registration, invites, file sharing, and the admin panel, all proxied through nginx. Binding to localhost means even if your firewall is misconfigured, these endpoints cannot be reached directly.

Start ejabberd and create your admin account:

```bash
systemctl start ejabberd
ejabberdctl register admin domain.tld YourStrongPasswordHere
```

Verify the Erlang distribution is correctly locked down after startup:

```bash
ss -tlnp | grep -E "4369|5210"
# Should show only: 127.0.0.1:5210
# Port 4369 (epmd) should not appear at all
```

---

## Part 6: PostgreSQL

### Install PostgreSQL

```bash
apt install -y postgresql
systemctl enable postgresql
```

### Create the ejabberd database and user

```bash
sudo -u postgres psql << 'EOF'
CREATE USER ejabberd WITH PASSWORD 'YourStrongDatabasePassword';
CREATE DATABASE ejabberd OWNER ejabberd;
GRANT CONNECT ON DATABASE ejabberd TO ejabberd;
EOF
```

### Configure pg_hba.conf

```bash
vim /etc/postgresql/14/main/pg_hba.conf
```

Find the connection rules at the bottom and make sure they look like this:

```
local   all   postgres                  peer
local   all   all                       peer
host    all   all   127.0.0.1/32        scram-sha-256
host    all   all   ::1/128             scram-sha-256
```

Use `scram-sha-256` rather than `md5`. MD5 has been deprecated and scram is stronger. Never use `trust`, which allows connections with no password at all.

Remove or comment out the replication entries if you are not running a replica:

```
# local   replication   all               peer
# host    replication   all   127.0.0.1/32   scram-sha-256
# host    replication   all   ::1/128        scram-sha-256
```

### Verify PostgreSQL is not externally accessible

```bash
ss -tlnp | grep postgres
# Should show only: 127.0.0.1:5432
```

If it shows `0.0.0.0:5432` then check `listen_addresses` in `postgresql.conf` and set it to `localhost`.

```bash
systemctl reload postgresql
```

---

## Part 7: hCaptcha Gate

This is the Python service that sits between nginx and ejabberd. It validates hCaptcha, checks the visitor's IP against AbuseIPDB, rate limits invites to one per IP per hour, and then calls ejabberd's API to generate a unique single-use registration token.

### Sign up for hCaptcha

Go to https://www.hcaptcha.com and create a free account. Add your domain and note down the **Site Key** and **Secret Key**.

### Sign up for AbuseIPDB

Go to https://www.abuseipdb.com/register and create a free account (1000 checks/day on the free plan). Create an API key under your account settings.

### Set up the Python environment

```bash
mkdir -p /opt/hcaptcha-gate
cd /opt/hcaptcha-gate
python3 -m venv venv
venv/bin/pip install flask requests
```

### Create the app

```bash
vim /opt/hcaptcha-gate/app.py
```

```python
import os, secrets, time, hashlib, requests
from collections import defaultdict
import threading
from flask import Flask, request, make_response, redirect, render_template_string

app = Flask(__name__)

HCAPTCHA_SITE_KEY   = os.environ["HCAPTCHA_SITE_KEY"]
HCAPTCHA_SECRET_KEY = os.environ["HCAPTCHA_SECRET_KEY"]
COOKIE_SECRET       = os.environ["COOKIE_SECRET"]
COOKIE_NAME         = "inv_pass"
COOKIE_TTL          = 300
XMPP_HOST           = os.environ["XMPP_HOST"]
EJABBERD_API        = os.environ.get("EJABBERD_API", "http://127.0.0.1:5281/api")
ABUSEIPDB_API_KEY   = os.environ["ABUSEIPDB_API_KEY"]
ABUSEIPDB_THRESHOLD = 50

_invite_times = defaultdict(float)
_invite_lock  = threading.Lock()

def is_rate_limited(ip: str) -> bool:
    now = time.time()
    with _invite_lock:
        last = _invite_times[ip]
        if now - last < 3600:
            return True
        _invite_times[ip] = now
        return False

def is_malicious_ip(ip: str) -> bool:
    try:
        resp = requests.get(
            "https://api.abuseipdb.com/api/v2/check",
            headers={"Key": ABUSEIPDB_API_KEY, "Accept": "application/json"},
            params={"ipAddress": ip, "maxAgeInDays": 90},
            timeout=5,
        )
        return resp.json()["data"]["abuseConfidenceScore"] >= ABUSEIPDB_THRESHOLD
    except Exception:
        return False

CHALLENGE_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Human Verification</title>
  <script src="https://js.hcaptcha.com/1/api.js" async defer></script>
  <style>
    body { font-family: sans-serif; display: flex; flex-direction: column;
           align-items: center; justify-content: center; min-height: 100vh;
           margin: 0; background: #f5f5f5; }
    .box { background: white; padding: 2rem 2.5em; border-radius: 12px;
           box-shadow: 0 2px 16px rgba(0,0,0,.12); text-align: center;
           max-width: 420px; width: 100%; }
    h1 { font-size: 1.2rem; margin-bottom: 0.25rem; color: #1a1a1a; }
    .subtitle { color: #888; font-size: .85rem; margin-bottom: 1.25rem; }
    .error { color: #c0392b; font-size: .85rem; margin-bottom: 0.75rem; font-weight: bold; }
    button { margin-top: 1rem; padding: .65rem 1.6rem; font-size: 1rem;
             background: #0070f3; color: white; border: none; border-radius: 6px;
             cursor: pointer; font-weight: 500; }
    button:hover { background: #005fd1; }
  </style>
</head>
<body>
  <div class="box">
    <h1>Please verify you are human</h1>
    <p class="subtitle">Complete the challenge to continue to registration.</p>
    {% if error %}<p class="error">{{ error }}</p>{% endif %}
    <form method="POST" action="/invites/_verify">
      <input type="hidden" name="next" value="{{ next }}">
      <div class="h-captcha" data-sitekey="{{ site_key }}"></div>
      <button type="submit">Continue</button>
    </form>
  </div>
</body>
</html>
"""

def make_cookie_value(remote_ip: str) -> str:
    expires = int(time.time()) + COOKIE_TTL
    payload = f"{remote_ip}:{expires}"
    sig = hashlib.sha256(f"{COOKIE_SECRET}:{payload}".encode()).hexdigest()[:16]
    return f"{expires}:{sig}"

def is_cookie_valid(value: str, remote_ip: str) -> bool:
    try:
        expires_str, sig = value.split(":", 1)
        expires = int(expires_str)
        if time.time() > expires:
            return False
        payload = f"{remote_ip}:{expires_str}"
        expected_sig = hashlib.sha256(
            f"{COOKIE_SECRET}:{payload}".encode()
        ).hexdigest()[:16]
        return secrets.compare_digest(sig, expected_sig)
    except Exception:
        return False

@app.route("/invites/_challenge")
def challenge():
    next_url = request.args.get("next", "/invites/")
    return render_template_string(
        CHALLENGE_HTML, site_key=HCAPTCHA_SITE_KEY, next=next_url, error=None)

@app.route("/invites/_verify", methods=["POST"])
def verify():
    next_url = request.form.get("next", "/invites/")
    h_token  = request.form.get("h-captcha-response", "")

    if not h_token:
        return render_template_string(
            CHALLENGE_HTML, site_key=HCAPTCHA_SITE_KEY,
            next=next_url, error="Please complete the captcha."), 400

    resp = requests.post(
        "https://hcaptcha.com/siteverify",
        data={"secret": HCAPTCHA_SECRET_KEY, "response": h_token},
        timeout=5,
    )
    if not resp.json().get("success"):
        return render_template_string(
            CHALLENGE_HTML, site_key=HCAPTCHA_SITE_KEY,
            next=next_url, error="Verification failed. Please try again."), 400

    if is_rate_limited(request.remote_addr):
        return render_template_string(
            CHALLENGE_HTML, site_key=HCAPTCHA_SITE_KEY,
            next=next_url,
            error="You already requested an invite recently. Please try again in an hour."), 429

    if is_malicious_ip(request.remote_addr):
        return render_template_string(
            CHALLENGE_HTML, site_key=HCAPTCHA_SITE_KEY,
            next=next_url,
            error="Registration is not available from your network."), 403

    try:
        invite_resp = requests.post(
            f"{EJABBERD_API}/generate_invite",
            json={"host": XMPP_HOST},
            timeout=5,
        )
        invite_resp.raise_for_status()
        landing_page = invite_resp.json()["landing_page"]
    except Exception:
        return render_template_string(
            CHALLENGE_HTML, site_key=HCAPTCHA_SITE_KEY,
            next=next_url,
            error="Could not generate invite. Please try again later."), 503

    cookie_val = make_cookie_value(request.remote_addr)
    response   = make_response(redirect(landing_page))
    response.set_cookie(
        COOKIE_NAME, cookie_val,
        max_age=COOKIE_TTL, secure=True, httponly=True, samesite="Lax")
    return response

@app.route("/invites/_check")
def check():
    cookie_val = request.cookies.get(COOKIE_NAME, "")
    if is_cookie_valid(cookie_val, request.remote_addr):
        return "", 200
    return "", 401

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5555)
```

### Generate a cookie secret

```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

Save the output, you will need it in the next step.

### Create the systemd service

```bash
vim /etc/systemd/system/hcaptcha-gate.service
```

```ini
[Unit]
Description=hCaptcha Gate for ejabberd invites
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/hcaptcha-gate
Environment="HCAPTCHA_SITE_KEY=your_hcaptcha_site_key"
Environment="HCAPTCHA_SECRET_KEY=your_hcaptcha_secret_key"
Environment="COOKIE_SECRET=your_generated_cookie_secret"
Environment="XMPP_HOST=domain.tld"
Environment="ABUSEIPDB_API_KEY=your_abuseipdb_api_key"
ExecStart=/opt/hcaptcha-gate/venv/bin/python app.py
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
systemctl daemon-reload
systemctl enable hcaptcha-gate
systemctl start hcaptcha-gate
systemctl status hcaptcha-gate
```

---

## Part 8: CrowdSec

CrowdSec is a modern intrusion prevention system that detects attacks in your logs and blocks attackers automatically. It also shares anonymized attack data with a community threat feed, so you benefit from blocks other servers have already discovered.

```bash
curl -s https://install.crowdsec.net | bash
apt install -y crowdsec-firewall-bouncer-iptables
systemctl enable crowdsec
systemctl start crowdsec
```

Check what it has blocked:

```bash
cscli decisions list
```

CrowdSec works well alongside fail2ban. They operate independently and cover different log sources.

---

## Part 9: Testing Everything

### Verify Erlang is locked down

```bash
ss -tlnp | grep -E "4369|5210"
# Expect: 127.0.0.1:5210 only. No 4369 at all.
```

### Test the ejabberd API

```bash
curl -s -X POST http://127.0.0.1:5281/api/generate_invite \
  -H "Content-Type: application/json" \
  -d '{"host": "domain.tld"}'
```

### Test nginx

```bash
nginx -t
systemctl reload nginx
```

### Test the admin panel

Open `https://domain.tld/xmpp-admin` from your trusted IP. You should see the ejabberd admin panel. From any other IP you should get 403.

### Test the full registration flow

Open `https://domain.tld/join` in a browser. You should see the hCaptcha challenge page. After solving it you should be redirected to a unique `https://domain.tld/invites/TOKEN` URL.

### Test file uploads

Send a file in your XMPP client. The URL in the chat should be clean with no port:

```
aesgcm://domain.tld/upload/hash/filename.ext#encryptionkey
```

### Test XMPP compliance

Run your domain through the XMPP compliance tester at https://compliance.conversations.im to verify all extensions are working correctly.

### Check federation

```bash
ejabberdctl s2s_connections
```

---

## Part 10: Ongoing Maintenance

### View live logs

```bash
journalctl -fu ejabberd
journalctl -fu hcaptcha-gate
journalctl -fu nginx
```

### List registered users

```bash
ejabberdctl registered_users domain.tld
```

### Delete a user

```bash
ejabberdctl unregister username domain.tld
```

### Ban a user

```bash
ejabberdctl ban_account username domain.tld "Reason for ban"
```

### Check connected users

```bash
ejabberdctl connected_users
```

### Reload ejabberd config without restart

```bash
ejabberdctl reload_config
```

### Certificate renewal

acme.sh handles this automatically via a cron job it installs itself. The `--reloadcmd` we set earlier handles reloading both nginx and ejabberd after each renewal. Verify the setup is working:

```bash
acme.sh --list
acme.sh --renew -d domain.tld --ecc --force --dry-run
```

### Periodic security checks

Every few months, run through these quickly:

```bash
# Pending security updates
apt list --upgradable 2>/dev/null | grep -i security

# Anything unexpected listening on public interfaces
ss -tlnp | grep -v "127.0.0.1\|::1"

# Users with login shells
grep -v "nologin\|false" /etc/passwd

# Sudo group members
getent group sudo

# Files with no valid owner
find / -xdev -nouser 2>/dev/null
```

---

## Port Reference

Here is a summary of every port the server uses and what it is for. This is useful for auditing your firewall rules.

| Port | Protocol | Purpose | Accessible from |
|------|----------|---------|-----------------|
| 2222 | TCP | SSH admin access | Your trusted IP only |
| 80 | TCP | HTTP to HTTPS redirect | Everyone |
| 443 | TCP | nginx (all web traffic) | Everyone |
| 5222 | TCP | XMPP client connections (STARTTLS) | Everyone |
| 5223 | TCP | XMPP client connections (Direct TLS) | Everyone |
| 5269 | TCP | XMPP federation inbound (STARTTLS) | Everyone |
| 5270 | TCP | XMPP federation inbound (Direct TLS) | Everyone |
| 5443 | TCP | BOSH, WebSocket, file upload | Everyone |
| 3478 | UDP | STUN/TURN | Everyone |
| 5349 | TCP | TURN over TLS | Everyone |
| 49152-65535 | TCP/UDP | TURN relay ports | Everyone |
| 8444 | TCP | ejabberd internal HTTP | Localhost only (nginx proxies it) |
| 5210 | TCP | Erlang distribution (fixed port) | Localhost only |
| 4369 | TCP | Erlang epmd | Blocked (not needed with fixed dist port) |
| 1883 | TCP | MQTT plaintext | Blocked |
| 111 | TCP/UDP | rpcbind | Blocked |

---

## How the Bot Protection Works

Every time someone visits `https://domain.tld/join` and submits the hCaptcha form, the following checks happen in order:

1. **hCaptcha validation** - the token is verified with hCaptcha's servers. Automated submissions without a valid token are rejected immediately.

2. **Rate limit check** - if this IP address already received an invite token within the last hour, the request is rejected. This runs in memory before any external API calls.

3. **AbuseIPDB reputation check** - the visitor's IP is checked against the AbuseIPDB database. If the IP has an abuse confidence score of 50 or higher, registration is denied.

4. **Token generation** - only if all three checks pass does the server call ejabberd's API to generate a unique, single-use invite token valid for 2 hours.

On top of this, nginx rate limits all invite and registration endpoints to 20 requests per minute per IP, and CrowdSec monitors your logs for attack patterns across all services.

Open IBR (in-band registration) is completely disabled. The only way to register an account is through a valid invite token, and the only way to get a token is through the hCaptcha gate.

---

## Recommended XMPP Clients

Send new users to these clients. They all support the invite flow described in this guide and have full OMEMO end-to-end encryption.

- **Android**: Conversations (https://conversations.im) or Moxxy
- **iOS**: Siskin IM or Monal
- **Desktop**: Gajim (Linux/Windows) or Beagle IM (macOS)
- **Web**: your webchat at https://webchat.domain.tld if configured

---

That is the complete setup. A hardened server, bot-proof registration, and a clean invite flow that works with modern XMPP clients. The whole thing runs comfortably on a small VPS and requires very little ongoing maintenance once it is up and running.