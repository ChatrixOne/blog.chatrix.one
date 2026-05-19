---
title:       "The MITM Attack on Jabber.ru"
date:        2023-10-25
description: "Following a recent incident affecting the public XMPP service provided by jabber.ru and xmpp.ru, we received questions from users asking whether they should be concerned."
tags:        ["xmpp", "security", "news", "mitm"]
image:       "/images/posts/mitm.jpg"
---

Following a recent incident affecting the security of the public **XMPP** service provided by **jabber.ru** and **xmpp.ru**, we received questions from users asking whether they should be concerned about the security of communications made through the **XMPP** service provided by **Chatrix.One**.

The good news is that **Chatrix.One** was not affected by this incident. This was a targeted attack specifically against the **jabber.ru** and **xmpp.ru** domains. Later in this post we will share what steps we have taken to ensure our servers are protected against similar attacks.

## What happened to Jabber.RU?

It became clear that the public **XMPP** services of **jabber.ru** and **xmpp.ru** had likely been subject to interception of their encrypted traffic for at least 90 days, and possibly up to 6 months. It is not clear who carried out the interception or why. The possibilities include law enforcement or a compromise of the infrastructure of the two hosting companies (**Hetzner** and **Linode**) used to provide the **XMPP** services.

This post will not go into the technical details in depth; for those we refer you to the original text published in the link below.

The man-in-the-middle (**MITM**) attack was directed at the **jabber.ru** and **xmpp.ru** domains and ended shortly after it was discovered. We are not aware of any previously documented attacks of this nature on the **XMPP** network.

Although traffic interception is nothing new, previously it was carried out mainly through passive monitoring of traffic as it passed through network devices on the internet. Snowden revealed how widespread this practice was in 2013, which triggered a mass shift to **TLS** encryption by default across the internet. **TLS** protects traffic from observers and today is used to secure everything we do online: chat, email, online banking and so on. In browsers it is indicated by a padlock next to the address bar.

What made this attack different is that it was "active". It did not simply observe traffic, it modified it. Specifically, it decrypted and re-encrypted traffic as it passed through a network device (the man in the middle) placed between the **jabber.ru** server and the rest of the internet.

Normally the presence of **TLS** certificates prevents this kind of attack, as long as you verify the certificates. In this case however, the attacker managed to obtain valid certificates for the target domains, making all connections appear legitimate.

With the emergence of **ACME**-based certificate authorities like **Let's Encrypt**, obtaining certificates is not difficult at all for someone who can intercept and respond to traffic sent to a specific server, and in this case that is exactly what happened.

## How does this relate to Chatrix.One?

In general, it does not. We do not use **Hetzner** or **Linode** to host our servers. That said, this does not mean the service is completely immune. For that reason the service was subjected to a full audit.

We found no unusual behaviour as reported by the **jabber.ru** team, confirming our belief that this was targeted only at their services.

To prevent similar attacks, the following measures have been taken:

- A **CAA DNS** record has been deployed ensuring that only our **Zero SSL** account is authorised to issue certificates for the domains responsible for the **XMPP** service:
  - **chatrix.one**
  - **conference.chatrix.one**
  - **proxy.chatrix.one**
  - **pubsub.chatrix.one**
  - **upload.chatrix.one**
- [**DNSSEC**](https://en.wikipedia.org/wiki/Domain_Name_System_Security_Extensions) has been enabled for additional protection
- We use [**CertWatch**](https://certwatch.xmpp.net/) to monitor certificates
- We use [**crt.sh**](https://crt.sh/) so we are notified immediately of any change to the certificate

## Links

- [Encrypted traffic interception on Hetzner and Linode targeting the largest Russian XMPP service](https://notes.valdikss.org.ru/jabber.ru-mitm/)
