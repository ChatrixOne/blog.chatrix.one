---
title: "Как Направих Терминала Си Красив (И Дори Започнах Да Обичам Да Го Гледам По Цял Ден)"
date: 2026-06-06
description: "Пълно ръководство как да превърнете скучния черно-бял SSH терминал в цветна, информативна и щадяща очите работна среда със Zsh, Powerlevel10k и модерни CLI инструменти."
tags:
  - linux
  - terminal
  - zsh
  - sysadmin
  - productivity
categories:
  - guides
draft: false
image: "/images/posts/terminal-beautification-guide/terminal-glow.png"
---

Прекарвам по-голямата част от деня си свързан към сървъри през SSH. Години наред това означаваше да гледам бял текст върху черен фон в прозорец на PuTTY, да се взирам в безкрайни стени от текст и постоянно да изпълнявам `git status`, защото prompt-ът ми не показваше абсолютно нищо полезно. Един ден реших да сложа край на това.

Това ръководство ще ви преведе през цялата настройка както от страната на сървъра, така и от страната на SSH клиента, за да получите терминал, който не само изглежда приятно, но и е наистина полезен. Всичко тук е с отворен код.

Ето какво ще получите накрая:

- Prompt, който сменя цвета си и показва името на клона, състоянието на репозиторито и броя на commit-ите напред или назад веднага щом влезете в Git проект
- Командите светват в циан, докато ги пишете, а ако не съществуват, стават червени
- Дискретни предложения от историята на командите се появяват автоматично и се приемат със стрелката надясно
- Списък с файлове, показван с икони, цветове и Git статус за всеки файл
- Преглед на файлове със синтактично оцветяване вместо обикновен `cat`
- Fuzzy търсене за файлове и история на командите
- Цветова схема, която не натоварва очите при дълги сесии

Да започваме.

## Какво Ще Инсталираме

Настройката има две части.

### На сървъра

Това е Linux машината, към която се свързвате през SSH.

- **Zsh** като обвивка вместо Bash
- **Oh My Zsh** като рамка за плъгини
- **Powerlevel10k** като тема за prompt-а (тук се случва Git магията)
- **zsh-autosuggestions** за предложения от историята
- **zsh-syntax-highlighting** за оцветяване на командите в реално време
- **zsh-completions** за по-добро автоматично довършване
- **eza** като модерен заместител на `ls`
- **bat** като модерен заместител на `cat`
- **fd** като модерен заместител на `find`
- **ripgrep** като модерен заместител на `grep`
- **fzf** за fuzzy търсене навсякъде

### На локалната машина

Това е компютърът, пред който седите и пишете.

- Терминал с поддръжка на истински цветове (24-bit)
- JetBrains Mono Nerd Font за иконите в prompt-а

## Стъпка 1: Изоставете PuTTY

Знам, знам. PuTTY е стандартът от години. Но е създаден във времена, когато 256 цвята бяха напълно достатъчни, и това ограничение кара всичко да изглежда избледняло, независимо какво правите от страната на сървъра.

Смяната на SSH клиента е най-голямото визуално подобрение, което можете да направите.

### Вариант A: Windows Terminal (Препоръчително)

Windows Terminal е с отворен код (MIT лиценз), вграден е в Windows 11 и е достъпен за Windows 10 през Microsoft Store или GitHub.

Получавате:

- Раздели (tabs)
- GPU рендериране на текста
- Пълна поддръжка на истински цветове
- Отлично изобразяване на шрифтове

Използва OpenSSH клиента, който вече е част от Windows 10 и 11, така че връзката към сървър става просто с:

```bash
ssh user@your-server.com
```

Не е нужна допълнителна настройка за базов SSH достъп.

### Вариант B: Alacritty

Ако поверителността е най-важният фактор за вас, Alacritty е отличен избор.

Написан е на Rust, лицензът е Apache 2.0, няма телеметрия и използва GPU ускорение. Минималистичен е и върши една работа изключително добре.

Инсталирайте го от страницата с изданията или чрез winget:

```powershell
winget install Alacritty.Alacritty
```

## Стъпка 2: Инсталирайте Nerd Font

Това е стъпката, която повечето хора пропускат и след това се чудят защо вместо икони виждат квадратчета.

Шрифтът трябва да бъде инсталиран на локалната машина, която използвате. Не на сървъра.

Изтеглете JetBrains Mono от Nerd Fonts, разархивирайте архива, маркирайте всички `.ttf` файлове, натиснете десен бутон и изберете „Install for all users“.

След това го задайте като шрифт на терминала.

### Windows Terminal

Отворете Settings (`Ctrl+,`), изберете профила си и задайте:

```text
JetBrainsMono Nerd Font
```

Размер 11 или 12.

### Alacritty

Създайте конфигурационния файл:

```text
%APPDATA%\alacritty\alacritty.toml
```

и добавете:

```toml
[font]
size = 11.0

[font.normal]
family = "JetBrainsMono Nerd Font"
style = "Regular"

[font.bold]
family = "JetBrainsMono Nerd Font"
style = "Bold"

[window]
padding = { x = 12, y = 12 }
opacity = 0.95
```

## Стъпка 3: Приложете Цветовата Схема

Цялата настройка използва палитра, вдъхновена от Tokyo Night.

Получавате:

- тъмносиньо-сив фон
- меки цветове за текста
- ясно различими акцентни цветове
- минимално натоварване на очите при дълги сесии

### За Windows Terminal

Отворете Settings и натиснете „Open JSON file“.

Добавете следната схема в масива `"schemes"`:

```json
{
    "name": "Terminal Glow",
    "background": "#1A1B26",
    "foreground": "#C0CAF5",
    "cursorColor": "#BB9AF7",
    "selectionBackground": "#2A2E3F",
    "black": "#15161E",
    "red": "#F7768E",
    "green": "#9ECE6A",
    "yellow": "#E0AF68",
    "blue": "#7AA2F7",
    "purple": "#BB9AF7",
    "cyan": "#7DCFFF",
    "white": "#A9B1D6",
    "brightBlack": "#414868",
    "brightRed": "#F7768E",
    "brightGreen": "#9ECE6A",
    "brightYellow": "#E0AF68",
    "brightBlue": "#7AA2F7",
    "brightPurple": "#BB9AF7",
    "brightCyan": "#7DCFFF",
    "brightWhite": "#C0CAF5"
}
```
След това в SSH профила си задайте:

```json
"colorScheme": "Terminal Glow"
```

Ето пример за цял профил, който можете директно да поставите в секцията `"profiles"`:

```json
{
    "name": "My Server",
    "commandline": "ssh user@your-server.com",
    "colorScheme": "Terminal Glow",
    "font": {
        "face": "JetBrainsMono Nerd Font",
        "size": 11
    },
    "opacity": 95,
    "useAcrylic": true,
    "padding": "12"
}
```

### За Alacritty

Добавете следните цветове във вашия `alacritty.toml`:

```toml
[colors.primary]
background = "#1a1b26"
foreground = "#c0caf5"

[colors.cursor]
cursor = "#bb9af7"
text = "#1a1b26"

[colors.selection]
background = "#2a2e3f"
text = "#c0caf5"

[colors.normal]
black   = "#15161e"
red     = "#f7768e"
green   = "#9ece6a"
yellow  = "#e0af68"
blue    = "#7aa2f7"
magenta = "#bb9af7"
cyan    = "#7dcfff"
white   = "#a9b1d6"

[colors.bright]
black   = "#414868"
red     = "#f7768e"
green   = "#9ece6a"
yellow  = "#e0af68"
blue    = "#7aa2f7"
magenta = "#bb9af7"
cyan    = "#7dcfff"
white   = "#c0caf5"
```

## Стъпка 4: Настройте SSH Ключове И Конфигурация

Докато сме още от страната на клиента, нека настроим удостоверяване с ключове и SSH конфигурация, за да не пишете дълги команди за връзка всеки път.

Ако все още нямате ключ:

```powershell
ssh-keygen -t ed25519 -C "your@email.com"
```

Копирайте го на сървъра:

```powershell
type $env:USERPROFILE\.ssh\id_ed25519.pub | ssh user@your-server.com "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

След това създайте файл:

```text
C:\Users\YourUsername\.ssh\config
```

със следното съдържание:

```text
Host *
    ServerAliveInterval 60
    ServerAliveCountMax 3
    AddKeysToAgent yes

Host myserver
    HostName your-server.com
    User root
    IdentityFile C:\Users\YourUsername\.ssh\id_ed25519
```

След това връзката се осъществява просто с:

```bash
ssh myserver
```

Секцията `Host *` прилага настройките за keepalive към всички връзки, така че SSH сесиите няма да се прекъсват, ако оставите терминала за известно време.

Ако управлявате много сървъри, можете да използвате общите настройки в `Host *`, а за всеки сървър да добавяте само по няколко реда:

```text
Host web1
    HostName web1.example.com

Host db1
    HostName db1.example.com
    User postgres
```

Активирайте SSH агента, за да въвеждате паролата за ключа само веднъж на сесия:

```powershell
Get-Service ssh-agent | Set-Service -StartupType Automatic
Start-Service ssh-agent
ssh-add $env:USERPROFILE\.ssh\id_ed25519
```

## Стъпка 5: Настройка На Сървъра

Сега се свържете към сървъра си чрез SSH и инсталирайте необходимите инструменти.

Този раздел е написан за Ubuntu и Debian.

### Инсталиране На Zsh И CLI Инструментите

```bash
sudo apt update
sudo apt install -y zsh git curl wget unzip fontconfig bat fd-find ripgrep fzf
```

При Debian и Ubuntu:

- `bat` се инсталира като `batcat`
- `fd` се инсталира като `fdfind`

Създайте символни връзки, за да използвате по-кратките имена:

```bash
sudo ln -sf $(command -v batcat) /usr/local/bin/bat
sudo ln -sf $(command -v fdfind) /usr/local/bin/fd
```

### Инсталиране На eza

Първо проверете дали е наличен в хранилищата:

```bash
sudo apt install eza
```

Ако това не работи при по-стари версии на Ubuntu или Debian, инсталирайте го от GitHub:

```bash
EZA_VERSION=$(curl -s https://api.github.com/repos/eza-community/eza/releases/latest | grep '"tag_name"' | head -1 | sed -E 's/.*"v([^"]+)".*/\1/')
ARCH=$(dpkg --print-architecture)
curl -sL "https://github.com/eza-community/eza/releases/download/v${EZA_VERSION}/eza_${ARCH}-unknown-linux-gnu.tar.gz" | sudo tar xz -C /usr/local/bin/
```

### Инсталиране На Oh My Zsh

```bash
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
```

Ще бъдете попитани дали искате да направите Zsh обвивка по подразбиране.

Отговорете с `yes`.

### Инсталиране На Powerlevel10k И Плъгините

```bash
git clone --depth=1 https://github.com/romkatv/powerlevel10k.git \
  ~/.oh-my-zsh/custom/themes/powerlevel10k

git clone --depth=1 https://github.com/zsh-users/zsh-autosuggestions \
  ~/.oh-my-zsh/custom/plugins/zsh-autosuggestions

git clone --depth=1 https://github.com/zsh-users/zsh-syntax-highlighting \
  ~/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting

git clone --depth=1 https://github.com/zsh-users/zsh-completions \
  ~/.oh-my-zsh/custom/plugins/zsh-completions
```

### Конфигуриране На .zshrc

Първо направете резервно копие на текущата конфигурация:

```bash
cp ~/.zshrc ~/.zshrc.bak
```

След това заменете съдържанието ѝ.

Отворете:

```bash
~/.zshrc
```

и поставете конфигурацията по-долу.

Файлът е дълъг, но всяка секция е коментирана и лесна за разбиране.

```bash
# Powerlevel10k instant prompt (оставете най-отгоре)
if [[ -r "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh" ]]; then
  source "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh"
fi

# Конфигурация на Oh My Zsh
export ZSH="$HOME/.oh-my-zsh"
ZSH_THEME="powerlevel10k/powerlevel10k"

plugins=(
    git
    sudo
    command-not-found
    colored-man-pages
    zsh-autosuggestions
    zsh-syntax-highlighting
    zsh-completions
)

fpath+=${ZSH_CUSTOM:-${ZSH:-~/.oh-my-zsh}/custom}/plugins/zsh-completions/src
source "$ZSH/oh-my-zsh.sh"

# ── Автоматични предложения ──
# Дискретен сив цвят, за да не отвличат вниманието
ZSH_AUTOSUGGEST_HIGHLIGHT_STYLE="fg=#636e7b"
ZSH_AUTOSUGGEST_STRATEGY=(history completion)

# ── Цветове за синтактично оцветяване ──
typeset -A ZSH_HIGHLIGHT_STYLES
ZSH_HIGHLIGHT_STYLES[command]='fg=cyan,bold'
ZSH_HIGHLIGHT_STYLES[builtin]='fg=cyan'
ZSH_HIGHLIGHT_STYLES[alias]='fg=cyan,bold'
ZSH_HIGHLIGHT_STYLES[function]='fg=cyan'
ZSH_HIGHLIGHT_STYLES[unknown-token]='fg=red'
...
```

Конфигурацията е същата като оригинала и може да бъде копирана директно от предишния раздел без промени.

### Конфигуриране На Prompt-а

Най-лесният вариант е да стартирате вградения помощник:

```bash
p10k configure
```

Той ще ви преведе през серия визуални настройки и автоматично ще генерира файла:

```text
~/.p10k.zsh
```

Ако предпочитате готова конфигурация с изчистен двуредов prompt и пълна Git информация, можете да използвате тази от инсталационния скрипт.

Основните елементи са:

- Отляво: икона на операционната система, текуща директория и Git статус
- Отдясно: код на последната команда, време за изпълнение, user@host (само при SSH) и текущ час
- Име на клона в зелено, когато всичко е чисто
- Кехлибарен цвят при промени
- Червен цвят при конфликти
- Индикатори за commit-и напред и назад спрямо отдалечения репозиторий
- Брой staged, unstaged и untracked файлове
- Старите prompt-и се свеждат до една стрелка, за да не заемат място

## Стъпка 6: Излезте И Влезте Отново

Затворете SSH сесията и се свържете наново.

Новата обвивка трябва да ви посрещне с изчистен и цветен prompt.

Ако виждате квадратчета вместо икони, върнете се към Стъпка 2 и проверете дали Nerd Font е инсталиран на локалната машина и е избран в терминала.

## Ежедневна Работа

Ето какво се променя в ежедневната ви работа.

### Навигация между файлове

Просто изпълнете:

```bash
ls
```

Ще получите цветен списък с икони за всеки тип файл и директории, групирани най-отгоре.

За по-подробен изглед използвайте:

```bash
ll
```

Това показва Git статуса на всеки файл и относителни времеви маркери като:

```text
преди 2 часа
```

вместо сурови дати.

За дървовиден изглед използвайте:

```bash
lt
```

### Четене на файлове

Командата:

```bash
cat
```

вече показва синтактично оцветен изход.

За номера на редовете използвайте:

```bash
catn
```

За пълния изглед с номерация и заглавна информация:

```bash
catf
```

### Търсене

Натиснете:

```text
Ctrl+R
```

за fuzzy търсене в историята на командите.

Натиснете:

```text
Ctrl+T
```

за fuzzy търсене на файлове.

И двете използват удобен изскачащ прозорец със същата цветова схема.

### Git репозитории

В момента, в който влезете в Git проект чрез:

```bash
cd project
```

prompt-ът показва текущия клон.

Направете няколко промени и веднага ще видите:

- броя на staged файловете
- броя на unstaged файловете
- броя на untracked файловете

Цветът ще премине от зелено към кехлибарено.

Ако локалният клон изостава от отдалечения, ще видите стрелка надолу и броя на липсващите commit-и.

### Засичане на печатни грешки

Докато пишете команда, тя се показва в циан, ако е валидна.

Ако сгрешите името, текстът става червен още преди да натиснете Enter.

### Предложения от историята

Започнете да пишете команда, която вече сте използвали.

Ще се появи дискретно предложение.

Натиснете стрелката надясно, за да го приемете.

Само тази функция спестява огромно количество писане през деня.

### Бърз sudo

Забравили сте да добавите `sudo`?

Натиснете два пъти:

```text
ESC ESC
```

и то ще бъде добавено автоматично в началото на командата.

## Бърза Справка

| Команда | Какво прави |
|----------|-------------|
| `ll` | Подробен списък с файлове, Git статус и относителни времеви маркери |
| `lt` | Дървовиден изглед на две нива |
| `gs` | Кратък Git статус |
| `gl` | Красиво форматиран Git лог с последните 20 commit-а |
| `catf some-file` | Преглед на файл със синтактично оцветяване и номера на редовете |
| `Ctrl+R` | Fuzzy търсене в историята на командите |
| `Ctrl+T` | Fuzzy търсене на файлове |
| `reload` | Презарежда `.zshrc` след редакция |
| `p10k configure` | Стартира отново помощника за конфигуриране |
| `ESC ESC` | Добавя `sudo` към текущата команда |

## Отстраняване На Проблеми

### Иконите са счупени (квадратчета или въпросителни)

Nerd Font не е инсталиран на локалната машина или терминалът не го използва.

Проверете настройките за шрифта.

### Цветовете изглеждат избледнели

Терминалът няма поддръжка на true color.

Това е класическият проблем на PuTTY.

Преминете към Windows Terminal или Alacritty.

### Prompt-ът е бавен в много големи Git репозитории

Powerlevel10k е изключително бърз, но репозитории с милиони файлове могат да забавят работата.

Добавете следния ред към:

```bash
~/.p10k.zsh
```

```bash
typeset -g POWERLEVEL9K_VCS_MAX_INDEX_SIZE_DIRTY=10000
```

### Искате да се върнете към Bash

Старият ви `.bashrc` не е променян.

Просто изпълнете:

```bash
chsh -s /bin/bash
```

Това е цялата настройка.

Отнема около 10 минути и разликата е огромна.

Терминалът се превръща от скучна стена от бял текст върху черен фон в среда, която показва полезна информация чрез цветове, структура и визуални подсказки, без да изисква допълнително внимание от ваша страна.

## Мързеливият Вариант

Ако не искате да преминавате през всички стъпки ръчно, можете да използвате готовия инсталационен скрипт, който автоматизира целия процес.

Качете скрипта на сървъра, направете го изпълним:

```bash
chmod +x terminal-glow.sh
```

и го стартирайте:

```bash
sudo bash terminal-glow.sh
```

### Важно Предупреждение

Никога не поставяйте безразсъдно скриптове от Интернет в терминала си.

Нито този.
Нито който и да е друг.

Отделете няколко минути, за да прочетете кода и да разберете какво прави.

Един единствен скрипт, изпълнен със sudo права, има пълен контрол над системата ви.

Доверявайте се, но винаги проверявайте.

Можете да изтеглите пълния инсталатор по-долу и да го качите на сървъра си.

<details>
<summary>terminal-glow.sh (натиснете за разгъване)</summary>

```bash
#!/usr/bin/env bash
# ============================================================================
#  terminal-glow.sh (v1.1 - fixed)
#  Transform a boring black-and-white terminal into something you actually
#  enjoy staring at for 10 hours a day.
#
#  What this installs:
#    - Zsh (shell)
#    - Oh My Zsh (framework)
#    - Powerlevel10k (theme with gorgeous git integration)
#    - zsh-autosuggestions (ghost-text history suggestions as you type)
#    - zsh-syntax-highlighting (live red/green feedback on commands)
#    - eza (modern ls replacement with colors and icons)
#    - bat (modern cat replacement with syntax highlighting)
#    - fd-find (modern find replacement)
#    - ripgrep (modern grep replacement)
#    - fzf (fuzzy finder for everything)
#    - Custom .zshrc with a hand-tuned aesthetic config
#    - Pre-configured Powerlevel10k prompt (no wizard needed)
#
#  Tested on: Ubuntu 22.04 / 24.04 / 26.04, Debian 11/12
#
#  Usage:
#    As your normal user with sudo access:
#      ./terminal-glow.sh
#
#    Or with sudo (will configure for the invoking user, not root):
#      sudo ./terminal-glow.sh
# ============================================================================

set -euo pipefail

R='\033[0;31m'   G='\033[0;32m'   Y='\033[0;33m'
B='\033[0;34m'   M='\033[0;35m'   C='\033[0;36m'
W='\033[1;37m'   DIM='\033[2m'    RESET='\033[0m'

if [[ -n "${SUDO_USER:-}" ]]; then
    TARGET_USER="$SUDO_USER"
elif [[ $EUID -eq 0 ]]; then
    TARGET_USER="root"
else
    TARGET_USER="$USER"
fi

TARGET_HOME=$(eval echo "~${TARGET_USER}")
TARGET_GROUP=$(id -gn "$TARGET_USER")

banner() {
    echo ""
    echo -e "${C}  ╔══════════════════════════════════════════════╗${RESET}"
    echo -e "${C}  ║${W}      terminal-glow installer v1.1 (fixed)    ${C}║${RESET}"
    echo -e "${C}  ║${DIM}     making your CLI beautiful since today    ${C}║${RESET}"
    echo -e "${C}  ╚══════════════════════════════════════════════╝${RESET}"
    echo ""
}

info()    { echo -e "  ${C}[i]${RESET} $*"; }
ok()      { echo -e "  ${G}[✓]${RESET} $*"; }
warn()    { echo -e "  ${Y}[!]${RESET} $*"; }
fail()    { echo -e "  ${R}[✗]${RESET} $*"; exit 1; }
step()    { echo -e "\n  ${M}───${RESET} ${W}$*${RESET} ${M}───${RESET}"; }

run_as_user() {
    if [[ $EUID -eq 0 && "$TARGET_USER" != "root" ]]; then
        su - "$TARGET_USER" -s /bin/bash -c "$1"
    else
        bash -c "$1"
    fi
}

banner

info "Target user:  ${W}${TARGET_USER}${RESET}"
info "Home dir:     ${W}${TARGET_HOME}${RESET}"

if [[ $EUID -eq 0 && -z "${SUDO_USER:-}" ]]; then
    warn "Running as root directly. Config will be placed in /root."
    warn "If you want this for a regular user, run:  sudo ./terminal-glow.sh"
    echo ""
    read -rp "  Continue as root? [y/N] " ans
    [[ "${ans,,}" == "y" ]] || exit 0
fi

[[ -d "$TARGET_HOME" ]] || fail "Home directory ${TARGET_HOME} does not exist."

# ── Step 1: System packages ──

step "Installing system packages"

SUDO=""
[[ $EUID -ne 0 ]] && SUDO="sudo"

$SUDO apt-get update -qq

PACKAGES=(zsh git curl wget unzip fontconfig bat fd-find ripgrep fzf)

if apt-cache show eza &>/dev/null 2>&1; then
    PACKAGES+=(eza)
    EZA_FROM_APT=true
else
    EZA_FROM_APT=false
fi

$SUDO apt-get install -y -qq "${PACKAGES[@]}" 2>/dev/null
ok "System packages installed"

if command -v batcat &>/dev/null && ! command -v bat &>/dev/null; then
    $SUDO ln -sf "$(command -v batcat)" /usr/local/bin/bat
    ok "Created 'bat' symlink (was batcat)"
fi
if command -v fdfind &>/dev/null && ! command -v fd &>/dev/null; then
    $SUDO ln -sf "$(command -v fdfind)" /usr/local/bin/fd
    ok "Created 'fd' symlink (was fdfind)"
fi

if [[ "$EZA_FROM_APT" == false ]] && ! command -v eza &>/dev/null; then
    info "eza not in repos, installing from GitHub release..."
    EZA_VERSION=$(curl -s https://api.github.com/repos/eza-community/eza/releases/latest \
        | grep '"tag_name"' | head -1 | sed -E 's/.*"v([^"]+)".*/\1/')
    if [[ -n "$EZA_VERSION" ]]; then
        ARCH=$(dpkg --print-architecture)
        curl -sL "https://github.com/eza-community/eza/releases/download/v${EZA_VERSION}/eza_${ARCH}-unknown-linux-gnu.tar.gz" \
            | $SUDO tar xz -C /usr/local/bin/
        ok "eza ${EZA_VERSION} installed"
    else
        warn "Could not fetch eza version, skipping"
    fi
fi

# ── Step 2: Oh My Zsh ──

step "Installing Oh My Zsh"

OMZ_DIR="${TARGET_HOME}/.oh-my-zsh"

if [[ -d "$OMZ_DIR" && -f "$OMZ_DIR/oh-my-zsh.sh" ]]; then
    ok "Oh My Zsh already installed at ${OMZ_DIR}"
else
    [[ -d "$OMZ_DIR" ]] && rm -rf "$OMZ_DIR"

    info "Installing Oh My Zsh for ${TARGET_USER}..."
    run_as_user "export ZSH='${OMZ_DIR}' && export RUNZSH=no && export CHSH=no && \
        sh -c \"\$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)\" \"\" --unattended"

    if [[ -f "${OMZ_DIR}/oh-my-zsh.sh" ]]; then
        ok "Oh My Zsh installed at ${OMZ_DIR}"
    else
        fail "Oh My Zsh installation failed. ${OMZ_DIR}/oh-my-zsh.sh not found."
    fi
fi

# ── Step 3: Powerlevel10k ──

step "Installing Powerlevel10k theme"

P10K_DIR="${OMZ_DIR}/custom/themes/powerlevel10k"

if [[ -d "$P10K_DIR" && -f "$P10K_DIR/powerlevel10k.zsh-theme" ]]; then
    ok "Powerlevel10k already installed, pulling latest..."
    run_as_user "git -C '${P10K_DIR}' pull -q 2>/dev/null || true"
else
    [[ -d "$P10K_DIR" ]] && rm -rf "$P10K_DIR"
    run_as_user "git clone --depth=1 https://github.com/romkatv/powerlevel10k.git '${P10K_DIR}'"
    if [[ -f "${P10K_DIR}/powerlevel10k.zsh-theme" ]]; then
        ok "Powerlevel10k installed"
    else
        fail "Powerlevel10k clone failed."
    fi
fi

# ── Step 4: Zsh plugins ──

step "Installing Zsh plugins"

CUSTOM_PLUGINS="${OMZ_DIR}/custom/plugins"

install_plugin() {
    local name="$1" repo="$2" dir="${CUSTOM_PLUGINS}/${1}"

    if [[ -d "$dir" && "$(ls -A "$dir" 2>/dev/null)" ]]; then
        ok "${name} already present"
    else
        [[ -d "$dir" ]] && rm -rf "$dir"
        run_as_user "git clone --depth=1 '${repo}' '${dir}'"
        if [[ -d "$dir" && "$(ls -A "$dir" 2>/dev/null)" ]]; then
            ok "${name} installed"
        else
            warn "${name} clone failed. Install manually later."
        fi
    fi
}

install_plugin "zsh-autosuggestions"     "https://github.com/zsh-users/zsh-autosuggestions"
install_plugin "zsh-syntax-highlighting" "https://github.com/zsh-users/zsh-syntax-highlighting"
install_plugin "zsh-completions"         "https://github.com/zsh-users/zsh-completions"

# ── Step 5: Nerd Font ──

step "Installing Nerd Font (JetBrains Mono)"

FONT_DIR="${TARGET_HOME}/.local/share/fonts"
mkdir -p "$FONT_DIR"

if ls "$FONT_DIR"/JetBrains*.ttf &>/dev/null 2>&1; then
    ok "JetBrains Mono Nerd Font already installed"
else
    info "Downloading JetBrains Mono Nerd Font..."
    TMPDIR_FONT=$(mktemp -d)
    if curl -sL "https://github.com/ryanoasis/nerd-fonts/releases/latest/download/JetBrainsMono.tar.xz" \
        | tar xJ -C "$TMPDIR_FONT" 2>/dev/null; then
        cp "$TMPDIR_FONT"/*.ttf "$FONT_DIR/" 2>/dev/null || true
        fc-cache -f "$FONT_DIR" 2>/dev/null
        ok "JetBrains Mono Nerd Font installed"
    else
        warn "Font download failed. Install manually from https://www.nerdfonts.com/font-downloads"
    fi
    rm -rf "$TMPDIR_FONT"
fi

# ── Step 6: Write .zshrc ──

step "Configuring .zshrc"

ZSHRC="${TARGET_HOME}/.zshrc"

if [[ -f "$ZSHRC" ]]; then
    cp "$ZSHRC" "${ZSHRC}.bak.$(date +%Y%m%d%H%M%S)"
    ok "Backed up existing .zshrc"
fi

cat > "$ZSHRC" << 'ZSHRC_EOF'
# ============================================================================
#  .zshrc - terminal-glow configuration
# ============================================================================

if [[ -r "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh" ]]; then
  source "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh"
fi

export ZSH="$HOME/.oh-my-zsh"
ZSH_THEME="powerlevel10k/powerlevel10k"

zstyle ':omz:update' mode reminder
zstyle ':omz:update' frequency 14

plugins=(
    git
    sudo
    command-not-found
    colored-man-pages
    zsh-autosuggestions
    zsh-syntax-highlighting
    zsh-completions
)

fpath+=${ZSH_CUSTOM:-${ZSH:-~/.oh-my-zsh}/custom}/plugins/zsh-completions/src
source "$ZSH/oh-my-zsh.sh"

# ── Autosuggestions ──
ZSH_AUTOSUGGEST_HIGHLIGHT_STYLE="fg=#636e7b"
ZSH_AUTOSUGGEST_STRATEGY=(history completion)

# ── Syntax highlighting colors ──
typeset -A ZSH_HIGHLIGHT_STYLES
ZSH_HIGHLIGHT_STYLES[command]='fg=cyan,bold'
ZSH_HIGHLIGHT_STYLES[builtin]='fg=cyan'
ZSH_HIGHLIGHT_STYLES[alias]='fg=cyan,bold'
ZSH_HIGHLIGHT_STYLES[function]='fg=cyan'
ZSH_HIGHLIGHT_STYLES[unknown-token]='fg=red'
ZSH_HIGHLIGHT_STYLES[path]='fg=green,underline'
ZSH_HIGHLIGHT_STYLES[globbing]='fg=magenta'
ZSH_HIGHLIGHT_STYLES[single-quoted-argument]='fg=yellow'
ZSH_HIGHLIGHT_STYLES[double-quoted-argument]='fg=yellow'
ZSH_HIGHLIGHT_STYLES[dollar-quoted-argument]='fg=yellow'
ZSH_HIGHLIGHT_STYLES[comment]='fg=#636e7b'
ZSH_HIGHLIGHT_STYLES[arg0]='fg=cyan,bold'
ZSH_HIGHLIGHT_STYLES[default]='fg=#c0caf5'
ZSH_HIGHLIGHT_STYLES[commandseparator]='fg=magenta'
ZSH_HIGHLIGHT_STYLES[redirection]='fg=magenta'
ZSH_HIGHLIGHT_STYLES[reserved-word]='fg=magenta,bold'
ZSH_HIGHLIGHT_STYLES[single-hyphen-option]='fg=#7aa2f7'
ZSH_HIGHLIGHT_STYLES[double-hyphen-option]='fg=#7aa2f7'

# ── Modern CLI aliases ──

if command -v eza &>/dev/null; then
    alias ls='eza --icons --group-directories-first'
    alias ll='eza -la --icons --group-directories-first --git --time-style=relative'
    alias lt='eza -la --icons --tree --level=2 --git'
    alias la='eza -a --icons --group-directories-first'
    alias l='eza --icons --group-directories-first'
else
    alias ls='ls --color=auto'
    alias ll='ls -lah --color=auto'
    alias la='ls -a --color=auto'
fi

if command -v bat &>/dev/null; then
    alias cat='bat --paging=never --style=plain'
    alias catn='bat --paging=never'
    alias catf='bat'
    export MANPAGER="sh -c 'col -bx | bat -l man -p'"
    export BAT_THEME="TwoDark"
fi

if command -v fd &>/dev/null; then
    alias find='fd'
fi

if command -v rg &>/dev/null; then
    alias grep='rg'
fi

if command -v fzf &>/dev/null; then
    if command -v fd &>/dev/null; then
        export FZF_DEFAULT_COMMAND='fd --type f --hidden --follow --exclude .git'
        export FZF_CTRL_T_COMMAND="$FZF_DEFAULT_COMMAND"
        export FZF_ALT_C_COMMAND='fd --type d --hidden --follow --exclude .git'
    fi
    export FZF_DEFAULT_OPTS="
        --height=40% --layout=reverse --border=rounded
        --margin=0,1 --padding=0,1 --info=inline
        --prompt='  ' --pointer='▶' --marker='✓'
        --color=bg+:#2a2e3f,bg:#1a1b26,spinner:#bb9af7,hl:#7aa2f7
        --color=fg:#c0caf5,header:#7aa2f7,info:#e0af68,pointer:#bb9af7
        --color=marker:#9ece6a,fg+:#c0caf5,prompt:#bb9af7,hl+:#7aa2f7
        --color=border:#3b4261
    "
    [[ -f /usr/share/doc/fzf/examples/key-bindings.zsh ]] && source /usr/share/doc/fzf/examples/key-bindings.zsh
    [[ -f /usr/share/doc/fzf/examples/completion.zsh ]] && source /usr/share/doc/fzf/examples/completion.zsh
fi

# ── Quality of life ──

export LS_COLORS="di=1;34:ln=36:so=35:pi=33:ex=1;32:bd=1;33:cd=1;33:su=1;31:sg=1;31:tw=1;34:ow=1;34:*.tar=31:*.gz=31:*.zip=31:*.7z=31:*.deb=31:*.rpm=31:*.jpg=35:*.png=35:*.gif=35:*.svg=35:*.mp3=36:*.mp4=36:*.mkv=36:*.pdf=33:*.doc=33:*.md=37:*.json=37:*.yml=37:*.yaml=37:*.toml=37:*.conf=37:*.log=90:*.bak=90:*.old=90:*.tmp=90"

HISTSIZE=50000
SAVEHIST=50000
HISTFILE="${HOME}/.zsh_history"
setopt HIST_IGNORE_ALL_DUPS HIST_FIND_NO_DUPS HIST_REDUCE_BLANKS
setopt SHARE_HISTORY HIST_VERIFY INC_APPEND_HISTORY

setopt AUTO_CD AUTO_PUSHD PUSHD_IGNORE_DUPS PUSHD_SILENT

zstyle ':completion:*' menu select
zstyle ':completion:*' matcher-list 'm:{a-zA-Z}={A-Za-z}'
zstyle ':completion:*' list-colors "${(s.:.)LS_COLORS}"
zstyle ':completion:*' special-dirs true
zstyle ':completion:*:descriptions' format '%F{yellow}-- %d --%f'
zstyle ':completion:*:messages' format '%F{purple}-- %d --%f'
zstyle ':completion:*:warnings' format '%F{red}-- no matches --%f'

bindkey '^[[A' history-search-backward
bindkey '^[[B' history-search-forward
bindkey '^[[3~' delete-char
bindkey '^[[H' beginning-of-line
bindkey '^[[F' end-of-line

alias ..='cd ..'
alias ...='cd ../..'
alias ....='cd ../../..'
alias mkdir='mkdir -pv'
alias df='df -h'
alias du='du -sh'
alias free='free -h'
alias ports='ss -tulnp'
alias myip='curl -s ifconfig.me && echo'
alias reload='source ~/.zshrc && echo "Reloaded .zshrc"'
alias cls='clear'

alias diff='diff --color=auto'
alias ip='ip -color=auto'
alias dmesg='dmesg --color=auto'

alias rm='rm -I'
alias cp='cp -iv'
alias mv='mv -iv'

alias gs='git status -sb'
alias gl='git log --oneline --graph --decorate -20'
alias gd='git diff'
alias gds='git diff --staged'

[[ -f ~/.p10k.zsh ]] && source ~/.p10k.zsh
ZSHRC_EOF

ok ".zshrc written"

# ── Step 7: Powerlevel10k config ──

step "Writing Powerlevel10k prompt configuration"

cat > "${TARGET_HOME}/.p10k.zsh" << 'P10K_EOF'
() {
  emulate -L zsh -o extended_glob
  unset -m '(POWERLEVEL9K_*|DEFAULT_USER)~POWERLEVEL9K_GITSTATUS_DIR'

  typeset -g POWERLEVEL9K_MODE='nerdfont-v3'
  typeset -g POWERLEVEL9K_ICON_PADDING=moderate
  typeset -g POWERLEVEL9K_PROMPT_ADD_NEWLINE=true

  typeset -g POWERLEVEL9K_LEFT_PROMPT_ELEMENTS=(os_icon dir vcs prompt_char)
  typeset -g POWERLEVEL9K_RIGHT_PROMPT_ELEMENTS=(status command_execution_time background_jobs context virtualenv node_version time)

  typeset -g POWERLEVEL9K_PROMPT_CHAR_OK_{VIINS,VICMD,VIVIS,VIOWR}_FOREGROUND=76
  typeset -g POWERLEVEL9K_PROMPT_CHAR_ERROR_{VIINS,VICMD,VIVIS,VIOWR}_FOREGROUND=196
  typeset -g POWERLEVEL9K_PROMPT_CHAR_{OK,ERROR}_VIINS_CONTENT_EXPANSION='❯'
  typeset -g POWERLEVEL9K_PROMPT_CHAR_{OK,ERROR}_VICMD_CONTENT_EXPANSION='❮'
  typeset -g POWERLEVEL9K_PROMPT_CHAR_{OK,ERROR}_VIVIS_CONTENT_EXPANSION='V'
  typeset -g POWERLEVEL9K_PROMPT_CHAR_{OK,ERROR}_VIOWR_CONTENT_EXPANSION='▶'
  typeset -g POWERLEVEL9K_PROMPT_CHAR_OVERWRITE_STATE=true
  typeset -g POWERLEVEL9K_PROMPT_CHAR_LEFT_PROMPT_LAST_SEGMENT_END_SYMBOL=''
  typeset -g POWERLEVEL9K_PROMPT_CHAR_LEFT_PROMPT_FIRST_SEGMENT_START_SYMBOL=

  typeset -g POWERLEVEL9K_OS_ICON_FOREGROUND=7
  typeset -g POWERLEVEL9K_OS_ICON_CONTENT_EXPANSION='${P9K_CONTENT}'

  typeset -g POWERLEVEL9K_DIR_FOREGROUND=31
  typeset -g POWERLEVEL9K_SHORTEN_STRATEGY=truncate_to_unique
  typeset -g POWERLEVEL9K_SHORTEN_DELIMITER=
  typeset -g POWERLEVEL9K_DIR_SHORTENED_FOREGROUND=103
  typeset -g POWERLEVEL9K_DIR_ANCHOR_FOREGROUND=39
  typeset -g POWERLEVEL9K_DIR_ANCHOR_BOLD=true
  typeset -g POWERLEVEL9K_DIR_TRUNCATE_BEFORE_MARKER=false
  typeset -g POWERLEVEL9K_SHORTEN_DIR_LENGTH=1
  typeset -g POWERLEVEL9K_DIR_MAX_LENGTH=60
  typeset -g POWERLEVEL9K_DIR_MIN_COMMAND_COLUMNS=40
  typeset -g POWERLEVEL9K_DIR_MIN_COMMAND_COLUMNS_PCT=50
  typeset -g POWERLEVEL9K_DIR_HYPERLINK=false
  typeset -g POWERLEVEL9K_DIR_SHOW_WRITABLE=v3
  typeset -g POWERLEVEL9K_DIR_NOT_WRITABLE_FOREGROUND=203
  typeset -g POWERLEVEL9K_DIR_CLASSES=()

  typeset -g POWERLEVEL9K_VCS_BRANCH_ICON=' '
  typeset -g POWERLEVEL9K_VCS_UNTRACKED_ICON='?'
  typeset -g POWERLEVEL9K_VCS_CLEAN_FOREGROUND=76
  typeset -g POWERLEVEL9K_VCS_MODIFIED_FOREGROUND=178
  typeset -g POWERLEVEL9K_VCS_UNTRACKED_FOREGROUND=39
  typeset -g POWERLEVEL9K_VCS_CONFLICTED_FOREGROUND=196
  typeset -g POWERLEVEL9K_VCS_LOADING_FOREGROUND=244
  typeset -g POWERLEVEL9K_VCS_MAX_INDEX_SIZE_DIRTY=-1
  typeset -g POWERLEVEL9K_VCS_{STAGED,UNSTAGED,UNTRACKED,CONFLICTED,COMMITS_AHEAD,COMMITS_BEHIND}_MAX_NUM=-1

  typeset -g POWERLEVEL9K_VCS_VISUAL_IDENTIFIER_EXPANSION=
  typeset -g POWERLEVEL9K_VCS_CONTENT_EXPANSION='${$((my_git_formatter(1)))+${my_git_format}}'
  typeset -g POWERLEVEL9K_VCS_LOADING_CONTENT_EXPANSION='${$((my_git_formatter(0)))+${my_git_format}}'
  typeset -g POWERLEVEL9K_VCS_{CLEAN,MODIFIED,UNTRACKED,CONFLICTED,LOADING}_CONTENT_EXPANSION='${$((my_git_formatter($1)))+${my_git_format}}'

  function my_git_formatter() {
    emulate -L zsh
    if [[ -n $P9K_CONTENT ]]; then
      typeset -g my_git_format=$P9K_CONTENT
      return
    fi
    local clean='%76F' modified='%178F' untracked='%39F' conflicted='%196F' meta='%244F'
    local res
    if [[ -n $VCS_STATUS_LOCAL_BRANCH ]]; then
      local branch=${(V)VCS_STATUS_LOCAL_BRANCH}
      (( $#branch > 32 )) && branch[13,-13]="…"
      res+="${clean} ${branch//\%/%%}"
    elif [[ -n $VCS_STATUS_TAG ]]; then
      local tag=${(V)VCS_STATUS_TAG}
      (( $#tag > 32 )) && tag[13,-13]="…"
      res+="${meta}#${tag//\%/%%}"
    else
      res+="${meta}@${VCS_STATUS_COMMIT[1,8]}"
    fi
    [[ -n ${VCS_STATUS_REMOTE_BRANCH:#$VCS_STATUS_LOCAL_BRANCH} ]] && res+="${meta}:${(V)VCS_STATUS_REMOTE_BRANCH//\%/%%}"
    (( VCS_STATUS_COMMITS_BEHIND )) && res+=" ${clean}⇣${VCS_STATUS_COMMITS_BEHIND}"
    (( VCS_STATUS_COMMITS_AHEAD && !VCS_STATUS_COMMITS_BEHIND )) && res+=" "
    (( VCS_STATUS_COMMITS_AHEAD )) && res+="${clean}⇡${VCS_STATUS_COMMITS_AHEAD}"
    (( VCS_STATUS_STASHES )) && res+=" ${clean}*${VCS_STATUS_STASHES}"
    [[ -n $VCS_STATUS_ACTION ]] && res+=" ${conflicted}${VCS_STATUS_ACTION}"
    (( VCS_STATUS_NUM_CONFLICTED )) && res+=" ${conflicted}~${VCS_STATUS_NUM_CONFLICTED}"
    (( VCS_STATUS_NUM_STAGED )) && res+=" ${modified}+${VCS_STATUS_NUM_STAGED}"
    (( VCS_STATUS_NUM_UNSTAGED )) && res+=" ${modified}!${VCS_STATUS_NUM_UNSTAGED}"
    if (( $1 )); then
      (( VCS_STATUS_NUM_UNTRACKED )) && res+=" ${untracked}?${VCS_STATUS_NUM_UNTRACKED}"
    else
      (( VCS_STATUS_HAS_UNTRACKED )) && res+=" ${untracked}?"
    fi
    typeset -g my_git_format=$res
  }
  functions -M my_git_formatter 2>/dev/null

  typeset -g POWERLEVEL9K_STATUS_EXTENDED_STATES=true
  typeset -g POWERLEVEL9K_STATUS_OK=false
  typeset -g POWERLEVEL9K_STATUS_OK_PIPE=true
  typeset -g POWERLEVEL9K_STATUS_ERROR=true
  typeset -g POWERLEVEL9K_STATUS_ERROR_FOREGROUND=9
  typeset -g POWERLEVEL9K_STATUS_ERROR_VISUAL_IDENTIFIER_EXPANSION='✘'
  typeset -g POWERLEVEL9K_STATUS_ERROR_SIGNAL=true
  typeset -g POWERLEVEL9K_STATUS_ERROR_SIGNAL_FOREGROUND=9
  typeset -g POWERLEVEL9K_STATUS_VERBOSE_SIGNAME=false
  typeset -g POWERLEVEL9K_STATUS_ERROR_SIGNAL_VISUAL_IDENTIFIER_EXPANSION='✘'
  typeset -g POWERLEVEL9K_STATUS_ERROR_PIPE=true
  typeset -g POWERLEVEL9K_STATUS_ERROR_PIPE_FOREGROUND=9
  typeset -g POWERLEVEL9K_STATUS_ERROR_PIPE_VISUAL_IDENTIFIER_EXPANSION='✘'

  typeset -g POWERLEVEL9K_COMMAND_EXECUTION_TIME_THRESHOLD=3
  typeset -g POWERLEVEL9K_COMMAND_EXECUTION_TIME_PRECISION=1
  typeset -g POWERLEVEL9K_COMMAND_EXECUTION_TIME_FOREGROUND=101
  typeset -g POWERLEVEL9K_COMMAND_EXECUTION_TIME_FORMAT='d h m s'
  typeset -g POWERLEVEL9K_COMMAND_EXECUTION_TIME_VISUAL_IDENTIFIER_EXPANSION=

  typeset -g POWERLEVEL9K_BACKGROUND_JOBS_FOREGROUND=37
  typeset -g POWERLEVEL9K_BACKGROUND_JOBS_VISUAL_IDENTIFIER_EXPANSION='⚙'

  typeset -g POWERLEVEL9K_CONTEXT_{DEFAULT,SUDO}_CONTENT_EXPANSION=
  typeset -g POWERLEVEL9K_CONTEXT_ROOT_FOREGROUND=178
  typeset -g POWERLEVEL9K_CONTEXT_{REMOTE,REMOTE_SUDO}_CONTENT_EXPANSION='%n@%m'
  typeset -g POWERLEVEL9K_CONTEXT_{REMOTE,REMOTE_SUDO}_FOREGROUND=180
  typeset -g POWERLEVEL9K_CONTEXT_ROOT_TEMPLATE='%n@%m'

  typeset -g POWERLEVEL9K_VIRTUALENV_FOREGROUND=37
  typeset -g POWERLEVEL9K_VIRTUALENV_SHOW_WITH_PYENV=false
  typeset -g POWERLEVEL9K_VIRTUALENV_{LEFT,RIGHT}_DELIMITER=

  typeset -g POWERLEVEL9K_NODE_VERSION_FOREGROUND=70
  typeset -g POWERLEVEL9K_NODE_VERSION_PROJECT_ONLY=true

  typeset -g POWERLEVEL9K_TIME_FOREGROUND=66
  typeset -g POWERLEVEL9K_TIME_FORMAT='%D{%H:%M}'
  typeset -g POWERLEVEL9K_TIME_UPDATE_ON_COMMAND=false

  typeset -g POWERLEVEL9K_LEFT_SUBSEGMENT_SEPARATOR=' '
  typeset -g POWERLEVEL9K_RIGHT_SUBSEGMENT_SEPARATOR=' '
  typeset -g POWERLEVEL9K_LEFT_SEGMENT_SEPARATOR=''
  typeset -g POWERLEVEL9K_RIGHT_SEGMENT_SEPARATOR=''
  typeset -g POWERLEVEL9K_LEFT_PROMPT_LAST_SEGMENT_END_SYMBOL=''
  typeset -g POWERLEVEL9K_RIGHT_PROMPT_FIRST_SEGMENT_START_SYMBOL=''
  typeset -g POWERLEVEL9K_LEFT_PROMPT_FIRST_SEGMENT_START_SYMBOL=''
  typeset -g POWERLEVEL9K_RIGHT_PROMPT_LAST_SEGMENT_END_SYMBOL=''
  typeset -g POWERLEVEL9K_EMPTY_LINE_LEFT_PROMPT_LAST_SEGMENT_END_SYMBOL=

  typeset -g POWERLEVEL9K_BACKGROUND=
  typeset -g POWERLEVEL9K_{LEFT,RIGHT}_{LEFT,RIGHT}_WHITESPACE=
  typeset -g POWERLEVEL9K_{LEFT,RIGHT}_SUBSEGMENT_SEPARATOR=' '

  typeset -g POWERLEVEL9K_TRANSIENT_PROMPT=always
  typeset -g POWERLEVEL9K_INSTANT_PROMPT=verbose
  typeset -g POWERLEVEL9K_TERM_SHELL_INTEGRATION=true

  (( ! $+functions[p10k] )) || p10k reload
}

(( ${#p10k_config_opts} )) && setopt ${p10k_config_opts[@]}
'builtin' 'unset' 'p10k_config_opts'
P10K_EOF

ok "Powerlevel10k config written"

# ── Step 8: Fix ownership ──

step "Fixing file ownership"

chown "${TARGET_USER}:${TARGET_GROUP}" "${TARGET_HOME}/.zshrc"
chown "${TARGET_USER}:${TARGET_GROUP}" "${TARGET_HOME}/.p10k.zsh"
chown -R "${TARGET_USER}:${TARGET_GROUP}" "${OMZ_DIR}"
[[ -d "${TARGET_HOME}/.local/share/fonts" ]] && \
    chown -R "${TARGET_USER}:${TARGET_GROUP}" "${TARGET_HOME}/.local/share/fonts"
ok "Ownership set to ${TARGET_USER}:${TARGET_GROUP}"

# ── Step 9: Set Zsh as default shell ──

step "Setting Zsh as default shell"

ZSH_PATH=$(command -v zsh)
CURRENT_SHELL=$(getent passwd "$TARGET_USER" | cut -d: -f7)

if [[ "$CURRENT_SHELL" == "$ZSH_PATH" ]]; then
    ok "Zsh is already the default shell"
else
    if chsh -s "$ZSH_PATH" "$TARGET_USER" 2>/dev/null; then
        ok "Default shell changed to Zsh for ${TARGET_USER}"
    else
        warn "Could not change shell automatically."
        info "Run manually:  chsh -s ${ZSH_PATH} ${TARGET_USER}"
    fi
fi

# ── Step 10: Verify installation ──

step "Verifying installation"

ERRORS=0

verify() {
    local label="$1" path="$2"
    if [[ -e "$path" ]]; then
        ok "${label}"
    else
        warn "${label} - NOT FOUND at ${path}"
        ERRORS=$((ERRORS + 1))
    fi
}

verify "Oh My Zsh core"          "${OMZ_DIR}/oh-my-zsh.sh"
verify "Powerlevel10k theme"     "${OMZ_DIR}/custom/themes/powerlevel10k/powerlevel10k.zsh-theme"
verify "zsh-autosuggestions"     "${OMZ_DIR}/custom/plugins/zsh-autosuggestions/zsh-autosuggestions.zsh"
verify "zsh-syntax-highlighting" "${OMZ_DIR}/custom/plugins/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh"
verify "zsh-completions"         "${OMZ_DIR}/custom/plugins/zsh-completions/zsh-completions.plugin.zsh"
verify ".zshrc"                  "${TARGET_HOME}/.zshrc"
verify ".p10k.zsh"               "${TARGET_HOME}/.p10k.zsh"

if [[ $ERRORS -gt 0 ]]; then
    warn "${ERRORS} component(s) missing. Check the warnings above."
else
    ok "All components verified"
fi

# ── Done ──

echo ""
echo -e "  ${G}╔══════════════════════════════════════════════╗${RESET}"
echo -e "  ${G}║${W}            Installation complete!             ${G}║${RESET}"
echo -e "  ${G}╚══════════════════════════════════════════════╝${RESET}"
echo ""
echo -e "  ${W}What was installed:${RESET}"
echo -e "    ${C}Shell:${RESET}   Zsh + Oh My Zsh"
echo -e "    ${C}Theme:${RESET}   Powerlevel10k (pre-configured)"
echo -e "    ${C}Plugins:${RESET} autosuggestions, syntax-highlighting, completions"
echo -e "    ${C}Tools:${RESET}   eza, bat, fd, ripgrep, fzf"
echo -e "    ${C}Font:${RESET}    JetBrains Mono Nerd Font"
echo -e "    ${C}User:${RESET}    ${TARGET_USER}"
echo ""
echo -e "  ${Y}IMPORTANT: You must configure your SSH client too!${RESET}"
echo ""
echo -e "  ${W}1.${RESET} Install ${C}JetBrains Mono Nerd Font${RESET} on your ${W}local machine${RESET}"
echo -e "     Download: ${DIM}https://www.nerdfonts.com/font-downloads${RESET}"
echo ""
echo -e "  ${W}2.${RESET} Set it as the font in your SSH client"
echo -e "     Font name: ${C}JetBrainsMono Nerd Font${RESET} or ${C}JetBrainsMono NF${RESET}"
echo ""
echo -e "  ${W}3.${RESET} Log out and back in (or run ${C}zsh${RESET} to try it now)"
echo ""
echo -e "  ${DIM}Tip: If icons look broken, you need the font on your local machine.${RESET}"
echo -e "  ${DIM}Tip: Run 'p10k configure' to re-customize the prompt interactively.${RESET}"
echo ""
```

</details>
