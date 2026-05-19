---
title:       "Working with Text on Windows"
date:        2020-02-26
description: "A look at the best open source tools for working with text, documents, PDFs and notes on Windows."
tags:        ["software", "windows", "tools"]
image:       "/images/posts/text_under_windows/windows-text-editors.jpg"
---

## What is MS Windows?

Microsoft Windows, often simply called Windows, is a closed-source operating system developed by Microsoft. It gained popularity for its versatility and today is the most widely used desktop operating system, with a market share of over 88%.

## How do I choose software?

When I have a choice, I always go with open source software. It usually comes with an extra bonus — it is free! Another important factor is whether it can be installed through a package manager. This saves a lot of time when you need to install several programs in a row. Package managers like Chocolatey let you update all your installed software with a single command.

## Visual Studio Code

I am not a fan of Microsoft products, but this one is just fantastic. Whether you want to edit a plain text file, write a configuration in `YAML` format, or need a full development environment, this editor will not let you down.

### Pros of Visual Studio Code

- [x] Open source
- [x] Huge range of extensions
- [x] Actively developed
- [x] Easy to connect to repositories like GitHub, GitLab etc.
- [x] Low system requirements
- [x] Free

### Cons of Visual Studio Code

- [ ] Telemetry [^1]
- [ ] Installing a large number of extensions can sometimes cause unexpected behaviour

[^1]: Telemetry can be disabled in the settings: `File` -> `Preferences` -> `Settings`. Search for: telemetry. Then uncheck all the boxes and select `off` from the dropdown menu under **Crash Reports, Error Telemetry** and **Usage Data**.

### Installing Visual Studio Code

- Official website: [visualstudio.com](https://code.visualstudio.com/)
- Chocolatey: `choco install vscode`

## LibreOffice

For heavier text editing, creating or editing spreadsheets, or putting together a presentation, this suite is hard to beat. It is compatible with MS Office and is open source. I know people who have published entire books using it.

### Pros of LibreOffice

- [x] Open source
- [x] Full office suite
- [x] A genuine replacement for the expensive MS Office
- [x] Actively developed
- [x] Free

### Cons of LibreOffice

- [ ] Not always perfectly compatible with MS Office, especially with complex formatting
- [ ] Spell checking for some languages is not the best

### Installing LibreOffice

- Official website: [libreoffice.org](https://www.libreoffice.org/)
- Chocolatey: `choco install libreoffice-fresh`

## Sumatra PDF

For viewing documents in portable format — the so-called PDF files — I use Sumatra PDF. It is good for reading PDFs as well as ebooks in `epub` or `mobi` format. Comic book fans will also find it useful, as it supports `cbz`/`cbr` formats. Other supported formats include `DjVu`, `XPS` and `CHM`.

### Pros of Sumatra PDF

- [x] Open source
- [x] Free

### Cons of Sumatra PDF

- [ ] No editing capability

### Installing Sumatra PDF

- Official website: [sumatrapdfreader.org](https://www.sumatrapdfreader.org/free-pdf-reader)
- Chocolatey: `choco install sumatrapdf`

## Joplin

I love taking notes. I have a weakness for the Markdown format, which is why I use Joplin. Hardly a day goes by when I do not open it. Everything is neatly organised in notebooks and tagged, so I can find whatever I am looking for quickly and easily.

### Pros of Joplin

- [x] Open source
- [x] Actively developed
- [x] Extensions
- [x] Encryption support
- [x] Available for desktop and mobile
- [x] Sync across devices
- [x] Export to various formats
- [x] Free

### Cons of Joplin

- [ ] Not ideal for team collaboration

### Installing Joplin

- Official website: [joplinapp.org](https://joplinapp.org/)
- Chocolatey: `choco install joplin`

That is all for now. If something new and interesting comes along, this article will be updated.