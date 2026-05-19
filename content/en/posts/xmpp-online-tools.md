---
title:       "Online Tools for XMPP Server Operators"
date:        2022-06-09
description: "A collection of online tools for testing and checking the configuration of an XMPP server."
tags:        ["xmpp", "tools", "security"]
image:       "/images/posts/xmpp_online_tools/xmpp-tools.jpg"
---

The beauty of XMPP is that there is always a choice. From the architecture and operating system, through the platform, all the way to the app your users will communicate with. At every step you have a set of options. That is why an XMPP server can be built on a credit-card-sized board like a RaspberryPi, or on a cluster of dozens of VPS machines in a data centre.

There is even better news. The leading platforms for building an XMPP server are open source, so we can use them for free. They can also be modified if a specific need calls for it.

The most popular platforms today are:

- [Ejabberd](https://www.ejabberd.im/index.html)
- [Prosody](https://prosody.im/)
- [Openfire](https://www.igniterealtime.org/projects/openfire/)
- [Metronome](https://metronome.im/)
- [MongooseIM](https://esl.github.io/MongooseDocs/latest/)

Each has its own strengths and weaknesses. Personally I started with Prosody in 2018 and migrated to Ejabberd in 2022. The reasons for that switch are described at [docs.chatrix.one](https://docs.chatrix.one/faq/?h=prosody%3F#ejabberd-prosody).

Let us assume you have already installed and configured your XMPP server. Time to test it, because there is a big difference between a running server and a correctly configured one.

## XMPP Compliance Tester

This test has become the gold standard and will answer many of the questions you might have about your XMPP server's configuration. It will also tell you whether your XEPs are set up correctly.

[compliance.conversations.im](https://compliance.conversations.im/)

## XMPP Status Checker

Checks whether C2S (client-to-server) and S2S (server-to-server) communication is working.

[connect.xmpp.net](https://connect.xmpp.net/)

## JMeter

JMeter is open source software written in Java. It lets you test web applications under different levels of load, so you can observe how your service behaves under extreme conditions. To test your XMPP server you need to install a plugin.

[JMeter](https://jmeter.apache.org/)

## XMPP Love

Checks whether the SRV records for your XMPP server are configured correctly.

[xmpp.love](https://xmpp.love/)

## Trickle ICE

If you offer audio and video communication, you can test whether your STUN/TURN server is working with this free online tool.

[Trickle ICE](https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/)

## Hardenize

Automatic discovery and monitoring of your entire network perimeter.

These days there are so many security features to implement and network services to configure that everyone needs a helping hand to understand how their networks behave. Hardenize provides a continuous monitoring, tracking and discovery service. It watches certificates, prevents things from breaking and helps you achieve the security level you need.

[hardenize.com](https://www.hardenize.com/)

## CryptCheck

Lets you test HTTPS, SMTP, XMPP, TLS and SSH protocols.

[cryptcheck.fr](https://cryptcheck.fr/)

## ImmuniWeb

A rich set of tests.

[immuniweb.com](https://www.immuniweb.com/)

## Qualys SSL Labs

This free online service performs a deep analysis of any SSL/TLS web server configuration on the public internet. It will tell you whether your server's SSL/TLS certificate is valid and meets modern requirements.

[ssllabs.com](https://www.ssllabs.com/ssltest/)

## Mozilla Observatory

Helps you find out whether your website is correctly configured and whether traffic to it is secure.

[observatory.mozilla.org](https://observatory.mozilla.org/)

## Security Headers

HTTP response headers provide huge levels of protection and it is important for sites to implement them. Security Headers is a simple tool for evaluating them, along with information on how to add any that are missing.

[Security Headers](https://securityheaders.com/)

## Mail Tester

Alongside XMPP, operators often run an email server too. That is where Mail Tester comes in. This tool checks the configuration and tests whether you can send and receive messages.

[mail-tester.com](https://www.mail-tester.com)