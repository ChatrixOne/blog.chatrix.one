---
title:       "SSH-Audit - Инструмент за проверка на сигурността"
date:        2024-01-23
description: "Лошо конфигурираният SSH сървър е сигурна рецепта за предстоящо бедствие. Как да използваме SSH-Audit за подобряване на сигурността."
tags:        ["linux", "сигурност", "инструменти", "ssh"]
image:       "/images/posts/ssh_audit/ssh-audit.jpg"
---

## Въведение

Във времена на непрестанно нарастваща киберпрестъпност, гарантирането на сигурността на сървърите е от първостепенно значение. Един критичен аспект от защитата на системите, е управлението и осигуряването на отдалечен достъп, а **SSH** (**Secure Shell**) е често използван протокол за тази цел. За да подобрите сигурността на вашите **SSH** конфигурации съществува безценен инструмент, наречен **SSH-Audit**. В тази статия ще разгледаме възможностите, функции и как може да използваме този софтуер за укрепване сигурността на комуникацията посредством **SSH** протокола за отдалечена връзка.

## Разбиране на **SSH** и неговото значение:

**SSH** е криптографски мрежови протокол, който улеснява сигурната комуникация между две системи, през несигурна мрежа. Той се използва широко за отдалечен достъп и изпълнение на команди, осигурявайки сигурна алтернатива на традиционните, уязвими протоколи, какъвто е например **Telnet**. Сигурността на **SSH** се крие в криптирането на данните, предавани между клиента и сървъра, както и в стабилни механизми за удостоверяване.

Въпреки сигурния си дизайн по подразбиране, неправилните **SSH** конфигурации могат да доведат до уязвимости, от които злонамерени участници да се възползват. В тези ситуации **SSH-Audit** се оказва безценен инструмент.

## Какво е **SSH-Audit**?

**SSH-Audit** представлява софтуер с отворен код, предназначен за проверка на конфигурацията на **SSH** сървъри. Той анализира конфигурацията на **OpenSSH** сървъра и идентифицира потенциални проблеми със сигурността или неправилни конфигурации, които биха могли да компрометират сигурността на системата. Разработен на програмния език **Python**, **SSH-Audit** е лесен за използване, предоставяйки бърз и ефективен начин за оценка на състоянието на сигурността на вашите **SSH** сървъри.

## Основни характеристики на **SSH-Audit**

### Анализ на шифър и обмен на ключове

**SSH-Audit** проверява поддържаните шифри и алгоритми за обмен на ключове на **SSH** сървъра, дава представа за нивата на сигурност на тези алгоритми и предлага по-сигурни алтернативи, ако е необходимо.

### Откриване на уязвимост

Инструментът може да идентифицира уязвимости и слабости в **SSH** конфигурацията на сървъра, като проверява за наличието на такива, а именно слаби алгоритми или отхвърлени настройки.

### Препоръки за конфигурация

**SSH-Audit** предлага практически препоръки за подобряване на конфигурацията на **SSH** сървъра, като включва указания за това кои шифри, алгоритми за обмен на ключове и други настройки да се използват за подобрена сигурност.

### Персонализиране на изхода

Потребителите могат да персонализират изходния формат според предпочитанията си.
**SSH-Audit** предоставя опции за показване на резултатите по кратък или подробен начин, което го прави адаптивен към различни потребителски нужди.

## Как да използваме **SSH-Audit**?

Използването на **SSH-Audit** е лесно. Просто инсталирайте инструмента на вашата система и след това го стартирайте срещу **SSH** сървъра, който искате да анализирате.

### Инсталация

#### Посредством пакетния мениджър на **Python**

```bash
pip3 install ssh-audit
```

#### Под формата на **Snap** пакет

```bash
snap install ssh-audit
```

#### Посредством хранилището **Dockerhub**

```bash
docker pull positronsecurity/ssh-audit
```

### Команди за изпълнение

Стартирането на **SSH-Audit** зависи от това, по кой начин е инсталиран на нашата система. Стига да не е от хранилището **Dockerhub**, командата е:

```bash
ssh-audit example.com
```

За инсталация посредством хранилището **Dockerhub** командата е:

```bash
docker run -it -p 2222:2222 positronsecurity/ssh-audit example.com
```

> Заменете `example.com` с името на хоста или **IP** адреса на вашия **SSH** сървър.

Ако желаете да се запознаете с възможните опции при изпълнение на програмата, можете да изпълните командата:

```bash
ssh-audit --help
```

или

```bash
docker run -it -p 2222:2222 positronsecurity/ssh-audit --help
```

Изходът изглежда по следния начин:

```
usage: ssh-audit.py [options] <host>

   -h,  --help             print this help
   -1,  --ssh1             force ssh version 1 only
   -2,  --ssh2             force ssh version 2 only
   -4,  --ipv4             enable IPv4 (order of precedence)
   -6,  --ipv6             enable IPv6 (order of precedence)
   -b,  --batch            batch output
   -c,  --client-audit     starts a server on port 2222 to audit client
                               software config (use -p to change port;
                               use -t to change timeout)
   -d,  --debug            debug output
   -g,  --gex-test=<x[,y,...]>  dh gex modulus size test
                   <min1:pref1:max1[,min2:pref2:max2,...]>
                   <x-y[:step]>
   -j,  --json             JSON output (use -jj to enable indents)
   -l,  --level=<level>    minimum output level (info|warn|fail)
   -L,  --list-policies    list all the official, built-in policies
        --lookup=<alg1,alg2,...>    looks up an algorithm(s) without
                                    connecting to a server
   -M,  --make-policy=<policy.txt>  creates a policy based on the target server
                                    (i.e.: the target server has the ideal
                                    configuration that other servers should
                                    adhere to)
   -m,  --manual           print the man page (Windows only)
   -n,  --no-colors        disable colors
   -p,  --port=<port>      port to connect
   -P,  --policy=<policy.txt>  run a policy test using the specified policy
   -t,  --timeout=<secs>   timeout (in seconds) for connection and reading
                               (default: 5)
   -T,  --targets=<hosts.txt>  a file containing a list of target hosts (one
                                   per line, format HOST[:PORT]).  Use --threads
                                   to control concurrent scans.
        --threads=<threads>    number of threads to use when scanning multiple
                                   targets (-T/--targets) (default: 32)
   -v,  --verbose          verbose output
```

### Преглед на резултатите

Анализирайте изхода, генериран от **SSH-Audit**, като обърнете внимание на всички идентифицирани уязвимости или области за подобрение.

```
# algorithm recommendations (for OpenSSH 8.9)
(rec) !rsa-sha2-256                         -- key algorithm to change (increase modulus size to 3072 bits or larger)
(rec) !rsa-sha2-512                         -- key algorithm to change (increase modulus size to 3072 bits or larger)
(rec) -ecdh-sha2-nistp256                   -- kex algorithm to remove
(rec) -ecdh-sha2-nistp384                   -- kex algorithm to remove
(rec) -ecdh-sha2-nistp521                   -- kex algorithm to remove
(rec) -ecdsa-sha2-nistp256                  -- key algorithm to remove
(rec) -hmac-sha1                            -- mac algorithm to remove
(rec) -hmac-sha1-etm@openssh.com            -- mac algorithm to remove
(rec) -diffie-hellman-group14-sha256        -- kex algorithm to remove
(rec) -hmac-sha2-256                        -- mac algorithm to remove
(rec) -hmac-sha2-512                        -- mac algorithm to remove
(rec) -umac-128@openssh.com                 -- mac algorithm to remove
(rec) -umac-64-etm@openssh.com              -- mac algorithm to remove
(rec) -umac-64@openssh.com                  -- mac algorithm to remove

# additional info
(nfo) For hardening guides on common OSes, please see: <https://www.ssh-audit.com/hardening_guides.html>
```

### Прилагане на препоръки

Въз основа на резултатите от одита, направете необходимите корекции в конфигурацията на вашия **SSH** сървър, за да разрешите идентифицираните проблеми.

## Заключение

**SSH-Audit** е мощен инструмент, който добавя допълнителен слой сигурност към вашите **SSH** конфигурации. Чрез редовен одит на вашите **SSH** сървъри можете да идентифицирате и коригирате потенциални уязвимости, като гарантирате, че вашите системи остават устойчиви срещу неоторизиран достъп и други заплахи за сигурността. Включването на **SSH-Audit** във вашата кутия с инструменти за киберсигурност е проактивна стъпка към поддържане на стабилна и сигурна компютърна среда.

* * *

## Линкове

- [PositronSecurity](https://www.positronsecurity.com/)
- [Github](https://github.com/jtesta/ssh-audit)
