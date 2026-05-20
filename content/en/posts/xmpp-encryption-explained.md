---
title: "How Your XMPP Messages Are Protected: Encryption Explained Simply"
date: 2026-05-19
draft: false
tags: ["xmpp", "encryption", "omemo", "privacy", "security"]
categories: ["Privacy"]
description: "A plain-language explanation of how end-to-end encryption protects your text messages, file attachments, voice calls, and video calls on XMPP."
image: "/images/posts/xmpp-encryption-explained/xmpp-encryption-explained.jpg"

---

Most people have heard the phrase "end-to-end encrypted" at some point. It appears on messaging apps, in privacy policies, and in news articles. But what does it actually mean? What is happening to your message between the moment you press send and the moment your friend reads it?

This article explains the whole process in plain language. No mathematics, no cryptography degree required. We will cover text messages, file attachments, voice calls, and video calls separately, because each one works a little differently.

---

## The Problem That Encryption Solves

When you send a message over the internet, that message has to travel through several computers before it reaches its destination. It goes through your phone, your router, your internet provider's network, the server that runs your chat service, and then back through your friend's internet provider and into their phone.

Without encryption, any of those computers along the way could read your message. The company running the server could read everything. A hacker who managed to intercept the traffic could read everything. Your internet provider could theoretically read everything.

Encryption solves this by scrambling the message before it leaves your device, so that even if someone intercepts it along the way, all they see is meaningless noise. Only the intended recipient has what is needed to unscramble it.

End-to-end encryption specifically means that the scrambling happens on your device and the unscrambling happens on your friend's device. The server in the middle, and everyone else along the way, only ever sees the scrambled version. They cannot read it even if they want to.

---

## Text Messages

XMPP uses a system called **OMEMO** for end-to-end encrypted text messages. Here is what happens when you send a message.

### Setting up the keys

Before any messages are exchanged, every device generates two things: a **public key** and a **private key**. These are a matched pair, mathematically linked to each other.

Think of the public key as a padlock that you hand out freely to anyone who wants to send you something. Think of the private key as the only key in existence that can open that padlock. You keep the private key on your device and never share it with anyone.

When you start a conversation with someone, your app fetches their public key from the server. Their app fetches your public key. Neither of you had to meet in person or agree on a password. The key exchange happens automatically.

### Sending a message

When you type a message and press send, your app does this:

1. It generates a brand new random key, called a **session key**, just for this message
2. It uses that session key to scramble your message into unreadable noise
3. It takes the session key and locks it using your friend's public key (their padlock)
4. It sends the scrambled message and the locked session key to the server

The server receives a package containing two things: an unreadable blob of scrambled text, and a session key that is locked in a padlock only your friend can open.

### Receiving a message

When your friend's app receives the package:

1. It uses their private key to unlock the padlock and retrieve the session key
2. It uses the session key to unscramble the message
3. Your original text appears on their screen

The server never had the private key, so the server could never open the padlock. The server could never read the message. Even the people running the server cannot read your conversations.

### Multiple devices

OMEMO handles the situation where someone uses the app on both a phone and a laptop. Each device has its own public and private key pair. When you send a message, your app actually locks the session key once for each of your friend's devices. So the message arrives on all their devices, and each one can unlock its own copy of the session key independently.

### Forward secrecy

OMEMO also has a property called **forward secrecy**. This means that even if someone somehow obtained your private key in the future, they still could not go back and decrypt old messages. Each conversation generates new session keys continuously, and the old ones are discarded after use. There is no master key that unlocks everything.

---

## File Attachments

File attachments work differently from text messages, for practical reasons. A large file cannot be sent directly through the XMPP message system the way a short text can. Instead it gets uploaded to a server and the recipient downloads it from there.

The challenge is doing this in a way that the server still cannot see what the file contains.

### What happens when you send a file

1. Your app generates a random encryption key on your device
2. Your app encrypts the file locally, before uploading it. The result is a blob of unreadable data with no recognizable structure
3. Your app uploads the encrypted blob to the server. The server stores it but cannot read it
4. Your app sends a special message to your friend containing two things: the download address of the encrypted blob, and the encryption key

### The clever part

The encryption key is attached to the download address using a specific technique. It appears after a `#` symbol at the end of the URL, like this:

```
aesgcm://domain.tld/upload/abc123/photo.jpg#a1b2c3d4e5f6...
```

The `#` part of a web address is called a **fragment**. Web browsers and apps have a rule: fragments are never sent to the server. When your friend's app downloads the file, it sends a request to the server for the path before the `#`. The part after the `#` stays on their device.

This means the server that stores the file never receives the encryption key, even during the download. The key travels through XMPP to your friend's device, and the encrypted file travels from the storage server to your friend's device, and only on your friend's device do the two meet and the file is decrypted.

### What the server sees

The server stores a blob of random-looking bytes. It does not know whether it is a photo, a document, an audio clip, or a video. It cannot open it, preview it, or read its contents. If someone broke into the server and stole the files, they would have a hard drive full of encrypted noise they could not use.

A new random key is generated for every single file upload. There is no master key. Each file is independently encrypted with its own unique key that exists only in that one shared URL.

---

## Voice Calls

Voice calls in XMPP clients use a system called **DTLS-SRTP**. The name is technical but the concept is straightforward.

SRTP stands for **Secure Real-time Transport Protocol**. It is a way of encrypting audio as it travels between two devices. DTLS is the handshake that happens at the start of a call to set up the encryption keys.

### How a voice call is protected

When you call someone, before any audio is exchanged, your two devices have a brief automated conversation to agree on encryption keys. This happens in fractions of a second and you never notice it.

Once the keys are agreed on, all the audio is encrypted on your device before it is sent, and decrypted on your friend's device when it arrives. Nobody in between, including the server, can listen to the call.

### The role of TURN servers

Voice and video calls ideally travel directly between the two devices without going through any server at all. This is called a **peer-to-peer** connection.

Sometimes a direct connection is not possible, because of firewalls, certain types of internet connections, or being on different mobile networks. In that case the audio is relayed through a **TURN server**.

Even when going through a TURN server, the audio is still encrypted. The TURN server is just a relay that passes encrypted packets from one side to the other. It cannot decrypt them. It sees the same thing as anyone else in the middle: scrambled data that looks like noise.

### What this means in practice

Nobody can listen to your calls. Not the people running the server, not your internet provider, not someone who has managed to intercept your network traffic. The audio is encrypted before it leaves your device and decrypted only on the other end.

---

## Video Calls

Video calls work almost identically to voice calls. The same DTLS-SRTP system is used, and the same principles apply.

The only practical difference is that video requires significantly more data than audio, which is why video calls are more sensitive to network conditions and why peer-to-peer connections are preferred even more strongly for video.

### What is encrypted

During a video call, everything is encrypted:

- The video stream from your camera
- The audio from your microphone
- Any screen sharing, if your client supports it

All of it is scrambled before leaving your device and unscrambled only on the screen of the person you are calling.

---

## What the Server Actually Sees

It is worth being specific about what the server running an XMPP service can and cannot access, because people often assume that the server operator can read everything.

**What the server can see:**

- Who is connected and when
- Who sent a message to whom and at what time (the metadata)
- The size of messages and files
- Your account information and contact list

**What the server cannot see:**

- The content of any message
- What any file contains
- What is said or shown in a voice or video call

The metadata (who talked to whom and when) is genuinely sensitive information and worth being aware of. A server operator cannot read your messages but they can see patterns of communication. This is a known limitation of the current system and something the XMPP community continues to work on improving.

---

## Why This Matters

There is a meaningful difference between a service that promises not to read your messages and a service that is technically incapable of reading your messages.

A promise can be broken. A company can change its privacy policy, be acquired, receive a legal order, or be hacked. If the keys to decrypt your messages exist somewhere on a server, those keys can be obtained by someone.

With end-to-end encryption the server genuinely does not have the keys. There is nothing to hand over, nothing to leak, nothing to be acquired along with a company. The encryption is not a policy decision, it is a technical reality.

This is why running a self-hosted XMPP server with proper encryption is a fundamentally different thing from using a commercial messaging service, even one that claims to care about privacy. The architecture itself is different.

---

## A Quick Summary

| What you send | How it is protected | Can the server read it? |
|---------------|--------------------|-----------------------|
| Text message | OMEMO end-to-end encryption | No |
| File attachment | AES encryption, key never touches server | No |
| Voice call | DTLS-SRTP, encrypted before leaving device | No |
| Video call | DTLS-SRTP, encrypted before leaving device | No |

The short version: your messages are scrambled on your device before they go anywhere. Only the person you are talking to has what is needed to unscramble them. Everyone in between, including the server, sees noise.

That is what end-to-end encryption means in practice.