#!/usr/bin/env bash
# Oyunu derleyip GitHub Pages'e (gh-pages dalı) yükler.
# Kullanım: npm run deploy
set -euo pipefail
cd "$(dirname "$0")/.."

npm run build
REMOTE=$(git remote get-url origin)

cd dist
touch .nojekyll            # GitHub Pages'in dosyaları Jekyll ile işlemesini kapatır
rm -rf .git
git init -q -b gh-pages
git add -A
git commit -q -m "Yayın: $(date -u +%Y-%m-%dT%H:%MZ)"
git push -q -f "$REMOTE" gh-pages
rm -rf .git
echo "Yüklendi. Birkaç dakika içinde Pages adresinde görünür."
