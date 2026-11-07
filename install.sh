#!/usr/bin/env bash

set -e

BOLD="\033[1m"
GREEN="\033[0;32m"
RED="\033[0;31m"
CYAN="\033[0;36m"
YELLOW="\033[1;33m"
RESET="\033[0m"

PANEL_DIR="/var/www/pterodactyl"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${PANEL_DIR}/backups/backup_$(date +%Y%m%d_%H%M%S)"

echo -e "${BOLD}======================================================${RESET}"
echo -e "${BOLD}    PTERODACTYL SUITE: MONOCHROME THEME & AI AGENT   ${RESET}"
echo -e "${CYAN}    Creator: Kyzz / Kyuu (KyuuX444)${RESET}"
echo -e "${CYAN}    Web API: https://api.kyzzz.xyz${RESET}"
echo -e "${YELLOW}    License: Strictly Not For Sale (Free Community)  ${RESET}"
echo -e "${BOLD}======================================================${RESET}"
echo ""

if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}[ERROR] Script ini harus dijalankan sebagai root!${RESET}"
    exit 1
fi

if [ ! -d "$PANEL_DIR" ]; then
    echo -e "${YELLOW}[WARNING] Direktori panel default (${PANEL_DIR}) tidak ditemukan.${RESET}"
    read -p "Masukkan path instalasi Pterodactyl Panel Anda: " USER_DIR
    if [ -d "$USER_DIR" ]; then
        PANEL_DIR="$USER_DIR"
    else
        echo -e "${RED}[ERROR] Direktori $USER_DIR tidak valid! Instalasi dibatalkan.${RESET}"
        exit 1
    fi
fi

echo -e "${CYAN}Target Panel:${RESET} ${PANEL_DIR}"
echo ""
echo "Pilih opsi instalasi:"
echo "  [1] Install Theme Only (Clean Monochrome + Geometric Grid + VS Code File Manager + Login)"
echo "  [2] Install AI Agent Module Only (Antigravity CLI Engine + UI + Backend)"
echo "  [3] Install Everything (Full Package: Theme + File Manager + AI Agent)"
echo "  [4] Keluar"
echo ""
read -p "Masukkan pilihan [1-4]: " CHOICE

backup_file() {
    local file="$1"
    if [ -f "${PANEL_DIR}/${file}" ]; then
        mkdir -p "${BACKUP_DIR}/$(dirname "${file}")"
        cp -f "${PANEL_DIR}/${file}" "${BACKUP_DIR}/${file}"
    fi
}

install_theme() {
    echo -e "\n${CYAN}>>> Menginstall Clean Monochrome Theme & VS Code File Manager...${RESET}"
    
    mkdir -p "${BACKUP_DIR}"
    backup_file "resources/scripts/components/server/files/VsCodeFileManager.tsx"
    backup_file "resources/scripts/components/server/files/FileManagerContainer.tsx"
    backup_file "resources/scripts/components/server/files/FileIcons.tsx"
    backup_file "resources/scripts/components/server/files/FileEditContainer.tsx"
    backup_file "resources/scripts/components/NavigationBar.tsx"
    backup_file "resources/scripts/components/auth/LoginContainer.tsx"
    backup_file "resources/scripts/components/auth/LoginFormContainer.tsx"
    backup_file "resources/views/templates/auth/core.blade.php"
    backup_file "resources/views/layouts/admin.blade.php"
    backup_file "resources/views/admin/index.blade.php"

    cp -rf "${SCRIPT_DIR}/theme/resources/"* "${PANEL_DIR}/resources/"
    mkdir -p "${PANEL_DIR}/public/themes/pterodactyl/css"
    cp -f "${SCRIPT_DIR}/theme/public/themes/pterodactyl/css/admin.css" "${PANEL_DIR}/public/themes/pterodactyl/css/"

    echo -e "${GREEN}[OK] File Theme berhasil disalin.${RESET}"
}

install_ai_agent() {
    echo -e "\n${CYAN}>>> Menginstall AI Agent Module (Antigravity CLI Engine)...${RESET}"
    
    mkdir -p "${BACKUP_DIR}"
    backup_file "app/Http/Controllers/Api/Client/Servers/AIAgentController.php"
    backup_file "app/Services/AIAgent/AIAgentService.php"
    backup_file "resources/scripts/routers/routes.ts"
    backup_file "routes/api-client.php"

    mkdir -p "${PANEL_DIR}/app/Http/Controllers/Api/Client/Servers"
    mkdir -p "${PANEL_DIR}/app/Services/AIAgent"
    mkdir -p "${PANEL_DIR}/resources/scripts/api/server/ai-agent"
    mkdir -p "${PANEL_DIR}/resources/scripts/components/server/ai-agent"

    cp -rf "${SCRIPT_DIR}/ai-agent/app/"* "${PANEL_DIR}/app/"
    cp -rf "${SCRIPT_DIR}/ai-agent/resources/"* "${PANEL_DIR}/resources/"
    cp -f "${SCRIPT_DIR}/ai-agent/routes/api-client.php" "${PANEL_DIR}/routes/api-client.php"

    echo -e "${GREEN}[OK] File AI Agent berhasil disalin.${RESET}"
}

post_install_build() {
    echo -e "\n${CYAN}>>> Membersihkan Cache Laravel...${RESET}"
    cd "${PANEL_DIR}"
    php artisan view:clear || true
    php artisan config:clear || true
    php artisan cache:clear || true

    echo -e "\n${CYAN}>>> Mengompilasi Webpack Assets (yarn build:production)...${RESET}"
    if command -v yarn >/dev/null 2>&1; then
        yarn build:production
    elif command -v npm >/dev/null 2>&1; then
        npm run build:production
    else
        echo -e "${YELLOW}[WARNING] Yarn atau NPM tidak ditemukan. Silakan jalankan 'yarn build:production' secara manual.${RESET}"
    fi

    echo -e "\n${CYAN}>>> Menyesuaikan Hak Akses File (www-data)...${RESET}"
    chown -R www-data:www-data "${PANEL_DIR}/resources" "${PANEL_DIR}/public" "${PANEL_DIR}/storage" "${PANEL_DIR}/bootstrap/cache" 2>/dev/null || true
    chmod -R 755 "${PANEL_DIR}/storage" "${PANEL_DIR}/bootstrap/cache" 2>/dev/null || true

    echo -e "\n${GREEN}${BOLD}======================================================${RESET}"
    echo -e "${GREEN}${BOLD}             INSTALASI BERHASIL SELESAI!              ${RESET}"
    echo -e "${GREEN}${BOLD}======================================================${RESET}"
    if [ -d "${BACKUP_DIR}" ]; then
        echo -e "Backup file lama tersimpan di: ${CYAN}${BACKUP_DIR}${RESET}"
    fi
    echo -e "Buka panel Anda di browser dan lakukan hard refresh (${BOLD}Ctrl + Shift + R${RESET})."
    echo ""
}

case "$CHOICE" in
    1)
        install_theme
        post_install_build
        ;;
    2)
        install_ai_agent
        post_install_build
        ;;
    3)
        install_theme
        install_ai_agent
        post_install_build
        ;;
    4)
        echo "Instalasi dibatalkan."
        exit 0
        ;;
    *)
        echo -e "${RED}[ERROR] Pilihan tidak valid!${RESET}"
        exit 1
        ;;
esac
