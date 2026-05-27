---
title: "How to Install Dino and Get Started with XMPP on Linux"
date: 2026-05-27
description: "A simple, step-by-step guide to installing the Dino XMPP chat client on Linux, creating a free account, and starting your first conversation."
tags: ["linux", "xmpp", "dino", "privacy", "chat", "tutorial"]
image: "/images/posts/dino-tutorial/dino-xmpp-tutorial.png"
---

So you've heard about XMPP and want to give it a try. Good call. It's open, decentralized, and no one owns your messages. This guide walks you through the whole thing from zero: installing Dino, creating a free account, and sending your first message. No command line needed.

---

## Step 1 - Open your Software Center

Open the Software Center (also called Software Manager depending on your distro).

{{< figure src="/images/posts/dino-tutorial/01-open-software-center.png" alt="Linux Mint Software Manager main screen" caption="The Software Manager on Linux Mint. Other distros look a bit different but work the same way." >}}

---

## Step 2 - Search for Dino

Type **dino** in the search box. Two results will probably show up: `dino-im` and `Dino`. You want **Dino**, the one with the little dinosaur icon and the Flathub badge.

{{< figure src="/images/posts/dino-tutorial/02-search-for-dino.png" alt="Search results showing Dino and Dino-im" caption="Pick the one from Flathub. It tends to be a newer version than the system package." >}}

---

## Step 3 - Install and launch it

Click on Dino to open its page, then hit **Install**. Once it finishes, click **Launch** (or **Open**, same thing).

{{< figure src="/images/posts/dino-tutorial/03-install-and-launch.png" alt="Dino app page in Software Manager with Launch and Remove buttons" caption="The Flathub version is usually more up to date than what ships with your distro." >}}

---

## Step 4 - Welcome screen

Dino opens to a clean welcome screen. Click **Set up account** to get started.

{{< figure src="/images/posts/dino-tutorial/04-welcome-screen.png" alt="Dino welcome screen with Set up account button" caption="Nothing to do here except press that button." >}}

---

## Part A - Creating a new account

If you already have an XMPP account, skip ahead to Part B. If not, follow along here.

---

### Step 5.1 - Click "Create account"

A sign-in window pops up. Since you don't have an account yet, click **Create account** at the bottom.

{{< figure src="/images/posts/dino-tutorial/05-create-account.png" alt="Dino sign-in dialog with Create account option" caption="Create account is right there at the bottom." >}}

---

### Step 5.2 - Choose a server

You need to pick an XMPP server. Think of it like picking an email provider. It doesn't matter much which one you choose, you can still talk to everyone. For this guide we'll use **chatrix.one**, a free Bulgarian server with no ads and end-to-end encryption. Type `chatrix.one` in the field at the bottom and click **Next**.

{{< figure src="/images/posts/dino-tutorial/06-choose-server.png" alt="Create account dialog with chatrix.one typed in the server field" caption="You can use any public server you like. chatrix.one is a solid free option." >}}

---

### Step 5.3 - Open the registration website

Chatrix.one handles registration through its website. Click **Open website** and your browser will open.

{{< figure src="/images/posts/dino-tutorial/07-open-registration-website.png" alt="Dino dialog saying the server requires sign-up through a website" caption="Some servers register directly in Dino. Others, like this one, use a webpage." >}}

---

### Step 5.4 - Prove you're human

The website asks you to complete a quick hCaptcha challenge. Read through the short terms of service, tick the box, and click **Continue**.

{{< figure src="/images/posts/dino-tutorial/08-hcaptcha-verification.png" alt="Chatrix.one human verification page with hCaptcha" caption="Standard stuff. Tick the box and carry on." >}}

---

### Step 5.5 - Select Dino as your client

The next page shows you a couple of app options. Click **Select** under **Dino**.

{{< figure src="/images/posts/dino-tutorial/09-select-dino-client.png" alt="Chatrix.one invite page showing Dino and Gajim options" caption="Since you're using Dino, click Select under it." >}}

---

### Step 5.6 - Pick a username and a strong password

Now fill in the registration form. Your username becomes the first part of your XMPP address, so `yourname@chatrix.one`. Use a password you don't use anywhere else, then click **Submit**.

{{< figure src="/images/posts/dino-tutorial/10-registration-form.png" alt="Chatrix.one registration form with username and password fields" caption="Your full XMPP address will be username@chatrix.one. Write down your password somewhere safe." >}}

---

### Step 5.7 - Registration success

If everything went fine, you'll see a congratulations page with your new address and a reminder that your password is only shown here once. Keep it safe.

{{< figure src="/images/posts/dino-tutorial/11-registration-success.png" alt="Chatrix.one registration success page" caption="Your account is created. Note down the JID and password before closing this tab." >}}

---

## Part B - Signing in to Dino

Now head back to Dino.

---

### Step 6 - Enter your XMPP address

In the sign-in window, type your full XMPP address (called a **JID**). It looks just like an email address: `yourname@chatrix.one`. Then click **Login**.

{{< figure src="/images/posts/dino-tutorial/12-enter-jid.png" alt="Dino sign-in dialog with XMPP address field" caption="Your JID is your full address including the server part. Don't forget the @chatrix.one." >}}

---

### Step 7 - Enter your password

Dino will ask for your password next. Type it in and click **Login** again.

{{< figure src="/images/posts/dino-tutorial/13-enter-password.png" alt="Dino sign-in dialog with password field" caption="This is the password you just created on the website." >}}

---

### Step 8 - You're in

If the credentials are correct, Dino shows a little party popper and says **All set up!**. Click **Finish**.

{{< figure src="/images/posts/dino-tutorial/14-signin-success.png" alt="Dino all set up success screen" caption="That's the good screen. Click Finish and you're in." >}}

---

## Step 9 - Welcome message from the server

If you just created a new account, you'll probably have one message waiting from the server. Click on it to open it. It usually has useful links like the FAQ, terms of service, and contact for the admin.

{{< figure src="/images/posts/dino-tutorial/15-welcome-message.png" alt="Dino main window with a welcome message from chatrix.one" caption="The server sends a welcome message with handy info. Worth reading." >}}

{{< figure src="/images/posts/dino-tutorial/16-welcome-message-content.png" alt="Welcome message content with links and server info" caption="FAQ, privacy policy, and an admin contact are all in there." >}}

---

## Step 10 - Settings and preferences

Click the **hamburger menu** (the three lines in the top bar) and choose **Preferences** to open the settings.

{{< figure src="/images/posts/dino-tutorial/17-open-preferences.png" alt="Dino hamburger menu with Preferences option" >}}

Preferences has three tabs:

**Accounts** - manage your account, change your avatar, enable or disable the account, or remove it entirely.

{{< figure src="/images/posts/dino-tutorial/18-preferences-accounts.png" alt="Dino Preferences showing Accounts tab with dino@chatrix.one listed" caption="You can add multiple accounts here if you need to." >}}

Click your account to see more options including avatar and account removal.

{{< figure src="/images/posts/dino-tutorial/19-account-management.png" alt="Dino account management screen with avatar and disable/remove options" caption="Disable pauses the account. Remove deletes it from Dino entirely." >}}

**Encryption** - shows your OMEMO key and lets you toggle encryption defaults. It's on by default, which is exactly what you want.

{{< figure src="/images/posts/dino-tutorial/20-preferences-encryption.png" alt="Dino Encryption settings with OMEMO keys and toggles" caption="OMEMO is end-to-end encryption. Leave it on." >}}

**General** - typing notifications, read receipts, desktop notifications, and emoji conversion.

{{< figure src="/images/posts/dino-tutorial/21-preferences-general.png" alt="Dino General settings with toggles for notifications and typing indicators" caption="Turn off typing notifications if you don't want people to know when you're writing." >}}

---

## Step 11 - Keyboard shortcuts

Dino has a clean set of shortcuts that make navigation faster. You can find them in the menu.

{{< figure src="/images/posts/dino-tutorial/22-keyboard-shortcuts.png" alt="Dino keyboard shortcuts window" caption="Ctrl+T starts a new conversation. Ctrl+G joins a group chat. Ctrl+, opens preferences." >}}

---

## Step 12 - Start a conversation

To chat with someone, click the **+** button in the top-left corner. Type their XMPP address (JID) and click **Start**. You can also join a group chat (called a MUC) the same way, just enter the group address instead.

{{< figure src="/images/posts/dino-tutorial/23-start-conversation.png" alt="Start Conversation dialog with a JID typed in" caption="Enter someone's JID and hit Start. It works for both direct messages and group chats." >}}

---

## Step 13 - Chat away

That's it. Messages, images, emoji, everything works as you'd expect. Messages are encrypted end-to-end by default with OMEMO, and you'll see a small lock icon to confirm it.

{{< figure src="/images/posts/dino-tutorial/24-chat-window.png" alt="Dino chat window with a conversation in progress" caption="Clean, fast, private. Enjoy." >}}

---

## That's all

You now have a working XMPP setup with a free account on Chatrix.one and Dino installed on your Linux machine. Your messages are encrypted and no company owns the network you're on.

If you want to find more public servers, our documentation site [docs.chatrix.one](https://docs.chatrix.one/en/faq/#lists-of-free-xmpp-servers) has some for you. And if your friends are on other XMPP servers, you can still message them, that's the whole point of a federated network.
