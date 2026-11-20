#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "Instalando Node.js e npm..."
  pkg install -y nodejs
fi
if [ ! -d node_modules/sql.js ]; then
  echo "Instalando dependências..."
  npm install --no-audit --no-fund
fi
node start.js "$@"
