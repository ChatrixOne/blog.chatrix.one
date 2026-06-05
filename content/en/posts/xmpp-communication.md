---
title:       "XMPP - Communicate Freely!"
date:        2019-04-05
weight:      2
description: "XMPP (also known as Jabber) is a well-established instant messaging protocol used by millions of people every day."
tags:        ["xmpp", "communication", "guide"]
image:       "/images/posts/xmpp_communication/xmpp.jpg"
---

XMPP (also known as Jabber) is a well-established instant messaging protocol that millions of people have used and continue to use every day, often without even realizing it. Several popular messaging applications started out as XMPP chat clients before evolving into isolated, polished, and proprietary platforms.

There are many reasons why you might consider chatting through an XMPP client instead of joining yet another trendy messaging platform.

## What is XMPP?

XMPP, short for **Ex**tensible **M**essaging and **P**resence **P**rotocol, is a decentralized messaging standard similar to email. Anyone can create an XMPP account on one server and communicate with someone registered on another server. Just like email, no single company has access to or control over the data of all users worldwide. You can choose from a variety of XMPP providers, just as you can choose between different email providers.

Originally known as Jabber, XMPP serves as an internet standard that reduces the need for people to constantly "reinvent the wheel." The code and specifications are open for anyone who wants to study and implement them. It is also relatively easy to set up an XMPP server that allows people to create accounts and communicate with one another through messages. This is why Google Talk, Facebook Messenger, and WhatsApp all used XMPP to one extent or another. Although those companies chose to isolate their platforms, there are many open XMPP providers available today. One example is the Bulgarian XMPP provider [Chatrix.One](https://docs.chatrix.one/).

XMPP has been around since 1999 and remains a standard that people actively develop and use. Many websites and services that include chat functionality still rely on XMPP, such as the modern video conferencing platform [Jitsi Meet](https://meet.jit.si/).

## How Can I Use XMPP?

As mentioned earlier, XMPP works much like email. You create an account with a provider and can send messages to other XMPP users regardless of which provider they use.

The first step is to find a provider that suits your needs. Many are free, while others may charge a fee to support server maintenance. A list of XMPP servers can be found at [providers.xmpp.net](https://providers.xmpp.net/).

Let's say you've chosen a provider. The next step is to register an account. The process may vary depending on the provider. Some offer registration through a website, while others allow you to register directly through a mobile or desktop application.

When creating your account, you'll need to choose a username. Usernames work much like email addresses. For example: `john@chatrix.one` or `emma.smith@chatrix.one`. Everything after the `@` symbol indicates the server where that username can be found.

At this point, if you haven't already done so, you'll need to choose an XMPP client. Similar to email clients such as Mozilla Thunderbird or Microsoft Outlook, XMPP clients come in many forms. You can find a complete list of XMPP clients on the official XMPP website at [xmpp.org](https://xmpp.org/software/?platform=all-platforms). Some of the most commonly used XMPP clients are listed below.

### Windows

| Client    | Free | Open Source | Link |
| :-------- | :--: | :---------: | :--: |
| **Gajim** | ✅ | ✅ | [**Gajim.org**](https://gajim.org/download) |

### Linux

| Client    | Free | Open Source | Link |
| :-------- | :--: | :---------: | :--: |
| **Gajim** | ✅ | ✅ | [**Gajim.org**](https://gajim.org/download) |
| **Dino**  | ✅ | ✅ | [**Dino.im**](https://dino.im/#download) |

### macOS

| Client        | Free | Open Source | Link |
| :------------ | :--: | :---------: | :--: |
| **Gajim**     | ✅ | ✅ | [**Gajim.org**](https://dev.gajim.org/gajim/gajim/-/wikis/help/Gajim-on-macOS) |
| **Beagle IM** | ✅ | ✅ | [**Mac App Store**](https://apps.apple.com/us/app/beagleim-by-tigase-inc/id1445349494) |

### Android

| Client            | Free | Open Source | Link |
| :---------------- | :--: | :---------: | :--: |
| **Conversations** | ✅ | ✅ | [**F-Droid**](https://f-droid.org/packages/eu.siacs.conversations/) |
| **Conversations** | **€4.99** | ✅ | [**Google Play**](https://play.google.com/store/apps/details?id=eu.siacs.conversations) |

### iOS

| Client    | Free | Open Source | Link |
| :-------- | :--: | :---------: | :--: |
| **Monal** | ✅ | ✅ | [**App Store**](https://apps.apple.com/us/app/monal-xmpp-chat/id317711500) |

### Web-Based

| Client          | Free | Open Source | Link |
| :-------------- | :--: | :---------: | :--: |
| **Converse.js** | ✅ | ✅ | [**Conversejs.org**](https://conversejs.org/fullscreen.html) |

### Terminal / CLI

| Client        | Free | Open Source | Link |
| :------------ | :--: | :---------: | :--: |
| **Profanity** | ✅ | ✅ | [**Profanity-IM**](https://profanity-im.github.io/) |

### I Installed a Client. Now What?

Once you've installed a client, it's time to log in using your username and password. You can add contacts and start sending messages to other XMPP users. The experience will feel familiar to anyone who remembers AIM or Yahoo Messenger.

XMPP communication is not limited to text messages. You can exchange:

- [x] Emojis
- [x] Images
- [x] Audio clips
- [x] Video clips
- [x] Files of various types
- [x] Location sharing
- [x] Audio and video calls
- [x] Voice messages

The following features are available:

- [x] Message delivery receipts
- [x] Read receipts
- [x] Typing indicators
- [x] Group chat
- [x] Encrypted communication
- [x] Contact avatars
- [x] Desktop synchronization
- [x] Compatibility with the most popular operating systems

The interface may not look as polished as mainstream messaging platforms, but most of the core features are there. Your experience will largely depend on the client you choose. If you're looking for a modern interface and all the latest features, my personal recommendation is [Conversations](https://conversations.im/), currently available only on Android.

## Reasons to Use XMPP

Using XMPP is fairly straightforward. The more interesting question may be: why use XMPP at all? Open standards and decentralization offer many advantages that mainstream platforms, despite their popularity, simply cannot provide.

### Privacy

XMPP is as private as you want it to be. Just like email, your provider can potentially read all messages you send as well as the associated metadata. Fortunately, you can protect the content of your conversations by enabling encryption. Several options exist, but the most modern and secure solution currently available is [OMEMO](https://conversations.im/omemo/). It is based on the Signal protocol used by the well-known private messaging application.

Most XMPP server operators are small organizations with no interest in scanning or monetizing your conversations. However, if you want complete control, you can always run your own XMPP server.

When encryption is enabled, the keys responsible for encrypting traffic are stored on your device rather than on the server. This is important because it ensures that even someone with physical access to the server cannot read or analyze your messages.

If you prefer, you can disable message history storage on the server. This feature is known as MAM (Message Archive Management). It's simply a setting in your client application that can be turned on or off. When disabled, messages that have been successfully delivered to your device are removed from the server. The downside is that you'll lose synchronization if you use more than one client. Still, having the choice is what matters.

### Decentralization

Centralized services come with many conveniences. It's easy to find contacts, everyone shares the same experience, and updates can be rolled out to everyone at the same time. Yet we're increasingly becoming aware of the downsides. Centralized services give a single company complete control over important questions such as:

- What counts as acceptable speech?
- Who gets blocked?
- Who is allowed to create an account?
- What happens to user communications?
- What happens to metadata?
- What happens to shared files and photos?

One thing is certain. The data will be processed. Analyzed repeatedly, carefully labeled, and sold countless times to marketing companies eager to profit from it. And nobody will ask whether you agree.

Or perhaps they already did.

Remember that little button labeled <kbd>I Agree</kbd>?

*Did you actually read what you agreed to before accepting yet another privacy policy?*

*Probably not.*

Who has time to read dozens of pages filled with legal jargon? That's precisely the point. These agreements are written by teams of lawyers to be as long, boring, and difficult to understand as possible. The goal is simple: get you to click the button without thinking about the consequences.

You can read more about this at [biggestlieonline.com](https://www.biggestlieonline.com/).

> **Homework Assignment**
>
> If you use Viber, tap the three dots labeled `More`, then go to `Settings`, `Privacy`, `Personal data`, and finally `Manage ad preferences`.
>
> You'll discover a seemingly endless list of marketing companies receiving your data every day, perhaps every minute.
>
> *I can already imagine your eyes widening. Welcome to the real world.*

With XMPP, things work very differently. Nobody can stop you from creating an XMPP account, just as nobody can stop you from using email. There are no ads, promotional offers, or marketing companies. There are no endless end-user license agreements either.

If usage rules exist, they are usually published on the provider's website and can often be read in less than a minute. As an example, you can review the terms provided by [Chatrix.One](https://docs.chatrix.one/terms/).

### Flexibility and Freedom of Choice

Most chat platforms limit your choice of software. You're expected to use either the official application or the official website. Companies decide whether third-party developers are allowed to build compatible software, and even when they are, those applications may not support every feature.

As a standard rather than a platform, XMPP allows you to use whichever client you prefer, just as you can choose any email application. Whether your software supports the latest features depends on the developer of your chosen client, not on whether a company grants permission.

## Drawbacks of XMPP

One downside of XMPP is that many applications lack the addictive polish and highly optimized user interfaces found in mainstream messaging apps. It also lacks the gossip-driven social element common to today's social networks.

XMPP communication tends to be more practical and purpose-driven. You spend less time staring at your screen and more time focusing on things that actually matter in your life.

## The Test of Time

Chat platforms come and go. At one point people primarily used AOL Instant Messenger, then moved to Google Talk, Facebook Messenger, WhatsApp, or Discord. These migrations often happen because services shut down, undergo radical redesigns, or implement controversial policy changes.

Like email, XMPP has been around for a very long time and has proven itself to be a reliable technology. With more than two decades of history behind it, it has clearly stood the test of time. If you can convince your contacts to make the switch, all of you can continue using it for as long as you wish.

## Should You Use XMPP?

Despite its age, or perhaps because of it, XMPP remains a reliable option for people looking for an alternative way to communicate online with family, friends, and colleagues. In fact, entire organizations have adopted XMPP for their internal communications.

Mainstream messaging platforms increasingly track and monetize our conversations. XMPP providers offer a quieter corner of the internet where, thanks to modern encryption methods, you can chat without constant surveillance.

If you're looking for a Bulgarian server, [Chatrix.One](https://chatrix.one/) might be exactly the place you're looking for.
