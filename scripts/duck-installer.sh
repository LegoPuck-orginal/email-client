#!/usr/bin/env bash
# 🦆 Duck Installer — installs the Email Client with quacking good animations.
set -euo pipefail

# ── ANSI colours ──────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
BOLD='\033[1m'
RESET='\033[0m'

# ── Duck art ──────────────────────────────────────────────────────────────────
DUCK_FRAME_1='
    _
  <(.)___
   ( ._> /
    `---'"'"'
'

DUCK_FRAME_2='
    _
  <(.)___
   ( ._> \
    `---'"'"'
'

DUCK_FRAME_3='
    _
  =(.)___
   ( ._> /
    `---'"'"'
'

DUCK_FRAME_4='
    _
  =(.)___
   ( ._> \
    `---'"'"'
'

# ── Functions ─────────────────────────────────────────────────────────────────

print_banner() {
    echo -e "${CYAN}"
    echo '  ██████╗ ██╗   ██╗ ██████╗██╗  ██╗    ███╗   ███╗ █████╗ ██╗██╗     '
    echo '  ██╔══██╗██║   ██║██╔════╝██║ ██╔╝    ████╗ ████║██╔══██╗██║██║     '
    echo '  ██║  ██║██║   ██║██║     █████╔╝     ██╔████╔██║███████║██║██║     '
    echo '  ██║  ██║██║   ██║██║     ██╔═██╗     ██║╚██╔╝██║██╔══██║██║██║     '
    echo '  ██████╔╝╚██████╔╝╚██████╗██║  ██╗    ██║ ╚═╝ ██║██║  ██║██║███████╗'
    echo '  ╚═════╝  ╚═════╝  ╚═════╝╚═╝  ╚═╝    ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝╚══════╝'
    echo -e "${YELLOW}"
    echo '                    🦆  Powered by Duck Technology  🦆'
    echo -e "${RESET}"
}

animate_duck() {
    local message="${1:-Installing...}"
    local frames=("$DUCK_FRAME_1" "$DUCK_FRAME_2" "$DUCK_FRAME_3" "$DUCK_FRAME_4")
    local cycles="${2:-3}"

    echo -e "${YELLOW}${message}${RESET}"
    for (( c=0; c<cycles; c++ )); do
        for frame in "${frames[@]}"; do
            echo -e "${CYAN}${frame}${RESET}"
            sleep 0.2
            # Move cursor up to overwrite previous frame (5 lines of duck art)
            printf '\033[6A'
        done
    done
    # Move down past the duck
    printf '\033[6B'
    echo ""
}

progress_bar_with_duck() {
    local label="${1:-Progress}"
    local total="${2:-10}"
    local bar_width=20

    echo -e "${BOLD}${label}${RESET}"
    for (( i=0; i<=total; i++ )); do
        local filled=$(( i * bar_width / total ))
        local empty=$(( bar_width - filled ))
        local bar=""
        for (( f=0; f<filled; f++ )); do bar+="█"; done
        # Duck emoji walks along the bar
        for (( e=0; e<empty; e++ )); do bar+="░"; done
        local pct=$(( i * 100 / total ))
        printf "\r  [${GREEN}%s${RESET}${YELLOW}🦆${RESET}${bar:filled}] ${WHITE}%3d%%${RESET}" \
            "${bar:0:$filled}" "$pct"
        sleep 0.1
    done
    echo -e "\n  ${GREEN}✔ Done!${RESET}\n"
}

speak_duck() {
    local message="$1"
    local len=${#message}
    local border
    border=$(printf '%*s' "$((len+2))" '' | tr ' ' '-')

    echo -e "${YELLOW}"
    echo "  .-${border}-."
    echo "  | 🦆  ${message} |"
    echo "  '-${border}-'"
    echo "       |"
    echo "    _  |"
    echo "  <(.)_|"
    echo "   ( ._> /"
    echo "    \`---'"
    echo -e "${RESET}"
}

# ── Demo mode ─────────────────────────────────────────────────────────────────

run_demo() {
    clear
    print_banner
    sleep 1

    speak_duck "Quack! Welcome to the Email Client installer!"
    sleep 1

    animate_duck "🦆  Doing duck things..." 4

    progress_bar_with_duck "Downloading dependencies" 20
    progress_bar_with_duck "Configuring services" 15
    progress_bar_with_duck "Compiling frontend assets" 25

    speak_duck "Installation complete! Run 'make up' to start."
    echo -e "${GREEN}${BOLD}  🎉  Demo finished — the real install is even quicker!${RESET}\n"
}

# ── Real install ──────────────────────────────────────────────────────────────

run_install() {
    clear
    print_banner

    speak_duck "Quack! Let's install the Email Client!"

    # Detect repo root (script lives in scripts/)
    REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

    echo -e "${BOLD}Installing backend dependencies...${RESET}"
    animate_duck "🦆  npm ci (backend)" 2
    (cd "$REPO_ROOT/backend" && npm ci)
    progress_bar_with_duck "Backend install" 10

    echo -e "${BOLD}Installing frontend dependencies...${RESET}"
    animate_duck "🦆  npm ci (frontend)" 2
    (cd "$REPO_ROOT/frontend" && npm ci)
    progress_bar_with_duck "Frontend install" 10

    speak_duck "All done! Run 'make up' to launch the app 🚀"
    echo -e "${GREEN}${BOLD}  ✔  Installation complete!${RESET}\n"
}

# ── Entry point ───────────────────────────────────────────────────────────────

case "${1:-}" in
    --demo)
        run_demo
        ;;
    --help|-h)
        echo "Usage: $0 [--demo|--help]"
        echo "  --demo   Show all duck animations without installing anything."
        echo "  (no arg) Run the full installation."
        ;;
    *)
        run_install
        ;;
esac
