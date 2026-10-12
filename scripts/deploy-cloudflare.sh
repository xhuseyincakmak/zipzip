#!/usr/bin/env bash
# Yedek: Cloudflare Pages'e (zipzip-macera.pages.dev) yükler. pages.dev Türkiye'de erişime kapalı.
# İlk kullanımda bir kez: npx wrangler login
# Kullanım: npm run deploy:cloudflare
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

npm run build
COMMIT=$(git rev-parse --short HEAD)
MESSAGE=$(git log -1 --pretty=%s)

# Wrangler proje klasöründe çalışınca Vite ayarlarını değiştirmeye çalışıyor;
# boş bir geçici klasörden çalıştırıp yalnızca dist/ klasörünü yüklüyoruz.
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
cd "$TMP"
npx -y wrangler@4 pages deploy "$ROOT/dist" \
  --project-name zipzip-macera --branch main \
  --commit-hash "$COMMIT" --commit-message "$MESSAGE"
