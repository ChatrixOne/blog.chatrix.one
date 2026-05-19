---
title:        "Как да защитите XMPP сървър: Практическо ръководство стъпка по стъпка"
date:         2026-05-19
draft:        false
tags:         ["xmpp", "security", "ejabberd", "linux", "hardening", "sysadmin"]
categories:   ["Guides"]
description:  "Практическо ръководство за защита на self-hosted XMPP сървър, включващо OS hardening, firewall правила, TLS конфигурация, настройки на ejabberd и защита на PostgreSQL."
image:        "/images/posts/xmpp-server-hardening/xmpp-server-hardening.jpg"
---

Да поддържате собствен XMPP сървър е едно от най-добрите решения, които можете да вземете, ако държите на личната комуникация. Няма реклами, няма телеметрия, няма компания, която да чете съобщенията ви. Но лошо конфигуриран сървър може да е по-опасен от комерсиална услуга, защото вече Вие носите отговорност за сигурността.

Това ръководство покрива нещата, които наистина имат значение при защитата на XMPP сървър. Базирано е на реален одит на production ejabberd сървър върху Ubuntu 22.04 с nginx, PostgreSQL и Let's Encrypt сертификати. Стъпките са подредени по важност, така че ако нямате време за всичко, поне критичните неща ще бъдат направени първо.

## Преди да започнете

Ще Ви трябва root или sudo достъп до сървъра. Работете от две SSH сесии едновременно, когато правите промени по firewall-а или SSH. Ако едната сесия прекъсне, ще имате резервна за възстановяване.

Винаги правете backup на конфигурационните файлове преди редакция:

```bash
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak
```

## Стъпка 1: Заключете SSH

SSH е входната врата към сървъра ви. Всичко останало зависи от това той да е добре защитен.

### Изключете password authentication

Ако атакуващ може да пробва пароли през SSH, сървърът Ви постоянно ще бъде подложен на brute-force опити. Използвайте само key-based authentication.

```bash
# /etc/ssh/sshd_config
PasswordAuthentication no
KbdInteractiveAuthentication no
```

### Задайте PermitRootLogin изрично

Стойността по подразбиране варира между различните дистрибуции. Не разчитайте на нея. Задайте я ръчно.

```bash
PermitRootLogin prohibit-password
```

Това позволява root login чрез SSH ключове, но не и с парола. Ако никога не влизате директно като root, задайте `no`.

### Намалете MaxAuthTries

По подразбиране има 6 опита на връзка. Намалете ги, за да забавите brute-force атаките.

```bash
MaxAuthTries 3
```

### Изключете X11 forwarding

X11 forwarding не е нужен на сървър и може да бъде използван за кражба на credentials чрез xauth cookie hijacking.

```bash
X11Forwarding no
```

### Валидирайте и презаредете

Винаги тествайте конфигурацията преди reload, за да не се заключите навън заради печатна грешка.

```bash
sshd -t && systemctl reload ssh
```

След това потвърдете, че все още можете да влезете от втори терминал, преди да затворите текущата сесия.

## Стъпка 2: Защитете firewall-а

Добрият firewall има default deny policy и отваря само това, което реално е нужно. Всичко останало се блокира.

### Задайте default DROP policy

Разликата между DROP и ACCEPT като default policy е разликата между заключена и отворена врата.

```bash
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT ACCEPT
```

### Разрешете само необходимото

За типичен ejabberd сървър:

```bash
# Loopback (винаги разрешен)
iptables -A INPUT -i lo -j ACCEPT

# Established connections
iptables -A INPUT -m state --state RELATED,ESTABLISHED -j ACCEPT

# ICMP с rate limiting
iptables -A INPUT -p icmp --icmp-type any -m limit --limit 10/s -j ACCEPT

# SSH - само от trusted IP
iptables -A INPUT -s YOUR_IP/32 -p tcp --dport 22 -j ACCEPT

# Web
iptables -A INPUT -p tcp -m multiport --dports 80,443 -j ACCEPT

# XMPP client-to-server
iptables -A INPUT -p tcp -m multiport --dports 5222,5223 -j ACCEPT

# XMPP server-to-server (federation)
iptables -A INPUT -p tcp -m multiport --dports 5269,5270 -j ACCEPT

# XMPP HTTPS API и file upload
iptables -A INPUT -p tcp --dport 5443 -j ACCEPT

# STUN/TURN за voice и video
iptables -A INPUT -p udp --dport 3478 -j ACCEPT
iptables -A INPUT -p tcp --dport 5349 -j ACCEPT
iptables -A INPUT -p udp --dport 5349 -j ACCEPT

# TURN relay ports
iptables -A INPUT -p tcp -m multiport --dports 49152:65535 -j ACCEPT
iptables -A INPUT -p udp -m multiport --dports 49152:65535 -j ACCEPT

# Финален deny
iptables -A INPUT -j REJECT --reject-with icmp-host-prohibited
```

### Блокирайте опасните портове изрично

Дори default policy-то Ви да е DROP, добавете изрични блокове за портове, които никога не трябва да бъдат достъпни. Това Ви пази, ако policy-то случайно бъде reset-нато.

```bash
# Erlang Port Mapper - никога не го expose-вайте
iptables -A INPUT -p tcp --dport 4369 -j DROP

# MQTT plaintext - блокирайте го, освен ако не Ви трябва
iptables -A INPUT -p tcp --dport 1883 -j DROP

# RPC portmapper - ненужен за XMPP сървър
iptables -A INPUT -p tcp --dport 111 -j DROP
iptables -A INPUT -p udp --dport 111 -j DROP
```

### Проверете IPv6

Дори да нямате публичен IPv6 адрес, проверете дали ip6tables правилата са настроени. Честа грешка е да има добри IPv4 правила и IPv6 да бъде забравен напълно.

```bash
ip -6 addr show
ip6tables -L INPUT -n
```

Ако имате публични IPv6 адреси, приложете еквивалентни правила с ip6tables. Ако имате само link-local адреси (`fe80::`), нямате публичен IPv6 exposure.

### Запазете и направете правилата persistent

Правилата в паметта се губят след reboot. Запазете ги и ги restore-вайте при стартиране.

```bash
iptables-save > /opt/iptables-rules

# В root crontab:
@reboot /usr/sbin/iptables-restore < /opt/iptables-rules
```

## Стъпка 3: Защитете операционната система

Тези промени отнемат няколко минути и значително намаляват attack surface-а.

### Изключете ненужните услуги

Услугите, които не използвате, са услуги, които могат да бъдат exploit-нати. На XMPP сървър обикновено не са Ви нужни:

```bash
systemctl disable --now rpcbind rpcbind.socket
systemctl disable --now ModemManager
systemctl disable --now avahi-daemon
```

Проверете какво работи:

```bash
systemctl list-units --type=service --state=running
```

Поставяйте под въпрос всичко непознато.

### Kernel hardening параметри

Добавете това в `/etc/sysctl.d/99-hardening.conf`:

```ini
# Изключва IP source routing - предотвратява path manipulation атаки
net.ipv4.conf.all.accept_source_route = 0
net.ipv6.conf.all.accept_source_route = 0

# Изключва ICMP redirects - предотвратява man-in-the-middle чрез фалшиви router съобщения
net.ipv4.conf.all.accept_redirects = 0
net.ipv6.conf.all.accept_redirects = 0
net.ipv4.conf.all.send_redirects = 0

# Логва пакети с невъзможни source адреси
net.ipv4.conf.all.log_martians = 1

# SYN flood защита
net.ipv4.tcp_syncookies = 1

# Игнорира broadcast ping - предотвратява използване като DDoS amplifier
net.ipv4.icmp_echo_ignore_broadcasts = 1

# Пълен ASLR
kernel.randomize_va_space = 2

# Без core dumps от SUID програми - предотвратява изтичане на credentials от паметта
fs.suid_dumpable = 0

# Ограничен ptrace - предотвратява процесите да четат паметта си взаимно
kernel.yama.ptrace_scope = 1
```

Приложете настройките:

```bash
sysctl -p /etc/sysctl.d/99-hardening.conf
```

### Проверете потребителите и sudo достъпа

Проверете кой има login shell и кой има sudo:

```bash
grep -v "nologin\|false" /etc/passwd | grep -v "^#"
getent group sudo
```

Премахнете sudo от акаунти, които не се нуждаят от него. Заключете неизползваните акаунти:

```bash
usermod -s /usr/sbin/nologin unused_account
passwd -l unused_account
```

Проверете за файлове без валиден owner:

```bash
find / -xdev -nouser 2>/dev/null
```

### Активирайте автоматичните security updates

```bash
apt install unattended-upgrades
systemctl enable --now unattended-upgrades
```

## Стъпка 4: Конфигурирайте TLS правилно

### Използвайте ECC сертификати

Elliptic curve (ECC/ECDSA) сертификатите са по-малки, по-бързи и също толкова сигурни спрямо RSA при еквивалентна сила. Използвайте acme.sh или certbot за EC-384 сертификат.

```bash
acme.sh --issue -d yourdomain.tld --keylength ec-384 \
  -d conference.yourdomain.tld \
  -d upload.yourdomain.tld \
  -d proxy.yourdomain.tld
```

Ако издавате и RSA сертификат за съвместимост, 2048-bit е минимумът, а 4096-bit е за предпочитане. Но за нов сървър ECC-only е по-чистият вариант.

### Генерирайте силни DH параметри

```bash
openssl dhparam -out /etc/ssl/certs/dhparam.pem 4096
```

Това отнема няколко минути. Прави се веднъж и файлът може да се използва както от nginx, така и от ejabberd.

### nginx TLS конфигурация

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

`ssl_prefer_server_ciphers off` е правилната настройка за TLS 1.3. `ssl_session_tickets off` е важно за forward secrecy.

## Стъпка 5: Защитете nginx

### Security headers

```nginx
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header Referrer-Policy "no-referrer" always;
add_header Permissions-Policy "interest-cohort=()" always;
add_header Content-Security-Policy "default-src 'self'; ..." always;
```

Не добавяйте `X-XSS-Protection`. Той беше deprecated преди години и премахнат от Chrome. Модерните браузъри го игнорират, а старите версии на IE дори могат да се държат по-зле с него. Реалната защита идва от Content-Security-Policy.

### Скрийте nginx версията

```nginx
server_tokens off;
```

### Пренасочете HTTP към HTTPS

```nginx
server {
    listen 80 default_server;
    server_name _;
    return 301 https://$host$request_uri;
}
```

### Добавете rate limiting за чувствителни endpoints

Ако имате registration или invite endpoints, защитете ги от ботове с rate limiting в nginx. Това стои пред application logic-а и е много по-евтино като натоварване.

```nginx
# В http {} блока:
limit_req_zone $binary_remote_addr zone=invites:10m rate=20r/m;

# В location блоковете:
location /invites/ {
    limit_req zone=invites burst=20 nodelay;
    limit_req_status 429;
    ...
}
```

### Не expose-вайте internal портове през nginx

Ако nginx proxy-ва към ejabberd на порт 8444 или подобен, backend портът трябва да бъде bind-нат само към localhost. Всеки порт, към който nginx proxy-ва, не трябва да е публично достъпен.

```yaml
# ejabberd - bind-вайте internal HTTP listeners само към localhost
port: 8444
ip: "127.0.0.1"
```

## Стъпка 6: Защитете ejabberd

### Изисквайте TLS за всички връзки

Client-to-server връзките трябва задължително да използват STARTTLS. Plain връзките трябва да бъдат отказвани.

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

Изисквайте TLS и за server-to-server federation:

```yaml
s2s_use_starttls: required
```

### Използвайте SCRAM за съхранение на пароли

Никога не съхранявайте пароли в plaintext. Използвайте SCRAM, който пази salted hash, от който оригиналната парола не може да бъде възстановена.

```yaml
auth_password_format: scram
```

### Изключете слабите SASL механизми

```yaml
disable_sasl_mechanisms:
  - "digest-md5"
  - "X-OAUTH2"
```

DIGEST-MD5 изисква reversible password storage, което обезсмисля SCRAM. Изключете го.

### Конфигурирайте fail2ban

ejabberd има вграден brute-force protection модул. Използвайте го.

```yaml
mod_fail2ban:
  c2s_auth_ban_lifetime: 6h
  c2s_max_auth_failures: 5
```

Пет неуспешни опита водят до шестчасова забрана за свързване.

### Bind-нете admin портовете само към internal IP

Admin web panel-ът и API портовете не трябва да бъдат достъпни от публичния интернет, дори firewall-ът да ги ограничава. Bind-нете ги към internal interface-а.

```yaml
  -
    port: 6443
    ip: "172.16.x.x"   # internal IP на сървъра, не ::
    module: ejabberd_http
    tls: true
    request_handlers:
      /admin: ejabberd_web_admin
```

### Изключете неизползваните модули и listeners

Ако не използвате MQTT, коментирайте го:

```yaml
# mod_mqtt: {}
```

Ако не използвате built-in ACME на ejabberd (защото използвате acme.sh например), коментирайте listener-а на порт 5280 изцяло:

```yaml
# -
#   port: 5280
#   ip: "::"
#   module: ejabberd_http
```

Всеки зареден модул е код, който се изпълнява. Оставете само това, което реално използвате.

### Заключете Erlang distribution порта

Това е един от най-пренебрегваните проблеми при ejabberd сървърите. Erlang използва port mapper daemon (epmd) и отделен distribution порт за inter-node комуникация. По подразбиране слушат на всички interfaces.

В `/opt/ejabberd/conf/ejabberdctl.cfg` uncomment-нете:

```bash
INET_DIST_INTERFACE=127.0.0.1
ERL_DIST_PORT=5210
ERL_EPMD_ADDRESS=127.0.0.1
```

След това рестартирайте ejabberd, не само reload:

```bash
systemctl restart ejabberd
```

След тази промяна epmd вече няма да е нужен и няма да стартира. Distribution портът ще бъде само на localhost и на фиксиран порт, което е много по-лесно за одит.

Проверете:

```bash
ss -tlnp | grep -E "4369|5210"
# Трябва да виждате само 127.0.0.1:5210 или нищо
```

## Стъпка 7: Защитете PostgreSQL

### Слушайте само на localhost

По подразбиране PostgreSQL слуша на localhost. Направете го изрично в `postgresql.conf`:

```ini
listen_addresses = 'localhost'
```

Проверете дали не е expose-нат externally:

```bash
ss -tlnp | grep postgres
# Трябва да показва само 127.0.0.1:5432
```

### Използвайте scram-sha-256 authentication

В `pg_hba.conf` използвайте scram-sha-256 вместо md5 за всички TCP връзки. md5 е слаб и deprecated.

```text
host    all    all    127.0.0.1/32    scram-sha-256
host    all    all    ::1/128         scram-sha-256
```

Никога не използвайте `trust` authentication. `trust` означава, че не се изисква парола.

### Дайте на ejabberd минимални database права

Database user-ът на ejabberd трябва да има достъп само до ejabberd базата. Без superuser, без createdb, без replication права.

```sql
CREATE USER ejabberd WITH PASSWORD 'strong_password';
GRANT CONNECT ON DATABASE ejabberd TO ejabberd;
GRANT USAGE ON SCHEMA public TO ejabberd;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ejabberd;
```

### Премахнете неизползваните pg_hba entries

Ако не използвате PostgreSQL replica, премахнете replication entries от `pg_hba.conf`. Те са там по подразбиране и нямат никаква полза на standalone сървър.

## Стъпка 8: Настройте intrusion detection

### Инсталирайте CrowdSec

CrowdSec е модерен заместител на fail2ban с community threat intelligence feed. Засича атаки в логовете Ви и автоматично блокира атакуващите, като същевременно споделя анонимизирани данни с CrowdSec мрежата.

```bash
curl -s https://install.crowdsec.net | bash
apt install crowdsec-firewall-bouncer-iptables
```

CrowdSec автоматично ще разпознава често срещани атаки срещу SSH, nginx и ejabberd, ако настроите правилните parsers.

### Backup на firewall правилата

Firewall правилата трябва да оцелеят след reboot. Тествайте това като рестартирате сървъра и проверите дали правилата са заредени:

```bash
iptables -L INPUT -n | head -5
```

## Неща, които си струва да проверявате периодично

След като сървърът вече работи, отделяйте време на няколко месеца за следните проверки:

**Изтичане на сертификати.** Дори с автоматично подновяване, проверявайте дали реално работи. Сървър с изтекъл сертификат прекъсва всички client връзки веднага.

```bash
acme.sh --list
openssl x509 -in /path/to/fullchain.pem -noout -enddate
```

**Неуспешни login опити.** Проверявайте какво блокират CrowdSec или fail2ban. Pattern-ите в source IP адресите и времето могат да покажат дали някой таргетира конкретно вашия сървър.

```bash
cscli decisions list
journalctl -u ssh | grep "Failed"
```

**Listening портове.** Пускайте `ss -tlnp` от време на време и сравнявайте резултата с това, което очаквате. Нов порт винаги си струва да бъде проверен.

**Потребители и sudo.** След промени в екипа проверявайте дали sudo групата все още е коректна. Акаунтите на хора, които вече нямат достъп, трябва да бъдат заключени или изтрити.

**OS updates.** `unattended-upgrades` се грижи автоматично за security patches, но все пак проверявайте от време на време дали услугата още работи и дали няма package holds, които блокират критични updates.

## Кратка справка: За какво служи всеки порт

Специално за ejabberd, ето за какво служи всеки порт, за да знаете какво да отворите и какво да оставите затворено:

| Порт | Протокол | Предназначение | Отворен за |
|------|----------|---------|---------|
| 5222 | TCP | XMPP client връзки (STARTTLS) | Всички |
| 5223 | TCP | XMPP client връзки (Direct TLS) | Всички |
| 5269 | TCP | Federation inbound (STARTTLS) | Всички |
| 5270 | TCP | Federation inbound (Direct TLS) | Всички |
| 5443 | TCP | BOSH, WebSocket, file upload | Всички |
| 5280 | TCP | HTTP admin / ACME challenge | Само trusted IP или localhost |
| 6443 | TCP | Admin web panel | Само trusted IP |
| 8444 | TCP | Registration, invites (proxied) | Само localhost |
| 3478 | UDP | STUN | Всички |
| 5349 | TCP/UDP | TURN over TLS | Всички |
| 4369 | TCP | Erlang epmd | Напълно блокиран |
| 1883 | TCP | MQTT (plaintext) | Блокиран, освен ако не е нужен |
| 5210 | TCP | Erlang distribution (fixed) | Само localhost |

## Бележка за **Defense in Depth**

Нито една от тези стъпки не е магическо решение сама по себе си. Целта е всеки layer да бъде защитен независимо, така че ако едно нещо се провали или бъде грешно конфигурирано, друг слой да го компенсира.

Например: bind-нете admin порта на ejabberd към localhost И го ограничете през iptables. Ако някой случайно промени ejabberd конфигурацията, iptables пак ще го блокира. Ако някой случайно премахне iptables правилото, bind address-ът пак ще го ограничава. Две независими защити за един чувствителен порт.

Същото важи и за registration-а. Използвайте hCaptcha на nginx layer-а И настройте rate limiting И използвайте fail2ban модула на ejabberd. Ботовете, които минат през един layer, ще ударят следващия.

Self-hosting на XMPP си заслужава усилието. С правилно конфигуриран сървър получавате истински лична комуникация под ваш контрол. Hardening стъпките по-горе не са optional extras. Те са част от това да поддържате сървър отговорно.