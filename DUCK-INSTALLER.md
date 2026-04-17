# 🦆 Duck Installer

The Duck Installer (`scripts/duck-installer.sh`) is a charming, animated bash installer that makes dependency installation delightful.

---

## Features

### 🎨 ASCII Duck Banner

On startup the installer displays a large `DUCK MAIL` banner rendered in ANSI cyan, followed by a yellow subtitle line.

### 🦆 Animated Duck — `animate_duck()`

A four-frame ASCII animation of a waddling duck is played in the terminal. The duck flaps its wings and wobbles between frames using ANSI cursor movement — no external dependencies required.

```
    _           _           _           _
  <(.)___     <(.)___     =(.)___     =(.)___
   ( ._> /     ( ._> \     ( ._> /     ( ._> \
    `---'       `---'       `---'       `---'
 Frame 1      Frame 2     Frame 3     Frame 4
```

Call signature: `animate_duck "message" [cycles]`

### 📊 Duck Progress Bar — `progress_bar_with_duck()`

A 20-character wide progress bar rendered with block characters (`█` / `░`). A duck emoji 🦆 walks along the bar as it fills, showing the current percentage.

```
  [████████████🦆░░░░░░░░] 62%
```

Call signature: `progress_bar_with_duck "label" [steps]`

### 💬 Duck Speech Bubble — `speak_duck()`

Displays a bordered ASCII speech bubble with the duck below it, used for milestone messages and completion notices.

```
  .---------------------------------.
  | 🦆  Quack! Installation done!  |
  '---------------------------------'
       |
    _  |
  <(.)_|
   ( ._> /
    `---'
```

Call signature: `speak_duck "message"`

---

## Usage

### Demo mode — show all animations without installing anything

```bash
bash scripts/duck-installer.sh --demo
# or via Make:
make duck-demo
```

### Real install — installs backend and frontend npm dependencies

```bash
bash scripts/duck-installer.sh
```

What it does:
1. Prints the banner and welcome speech bubble.
2. Runs `npm ci` in `backend/` with duck animation.
3. Runs `npm ci` in `frontend/` with duck animation.
4. Shows completion progress bars and a final speech bubble.

### Help

```bash
bash scripts/duck-installer.sh --help
```

---

## Colour Palette

| Colour  | Used for                              |
|---------|---------------------------------------|
| Cyan    | Banner, duck art frames               |
| Yellow  | Speech bubbles, progress duck emoji   |
| Green   | Progress bar fill, success messages   |
| White   | Percentage labels, bold text          |
| Reset   | All other text                        |

---

## Requirements

- Bash 4+
- A terminal that supports ANSI escape codes (virtually all modern terminals)
- No external tools required

---

## Integration in Build Scripts

Both `scripts/build-deb-with-duck.sh` and `scripts/deploy.sh` reuse the `duck_say` and `progress` helper functions (inline versions) so every script in the project has consistent Duck-flavoured output.
