#!/usr/bin/env bash
# Builds public/base/index.html (🏰 Study Base, admin test version) from src/base/page.html,
# with the shared rules (src/base/rules.js, minus the `export` words) and the page code (src/base/client.js) inlined.
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=public/base; mkdir -p "$OUT"
python3 - <<'PY'
import re, time
page = open('src/base/page.html').read()
rules = re.sub(r'^export ', '', open('src/base/rules.js').read(), flags=re.M)
rules = re.sub(r'^\{?\s*N\s*\};?$', '', rules, flags=re.M)
client = open('src/base/client.js').read()
html = page.replace('<!--GAME-->', '<script>\n' + rules + '\n' + client + '\n</script>')
html = re.sub(r'<html lang="en"( data-build="\d+")?>', '<html lang="en" data-build="%d">' % int(time.time()), html)
open('public/base/index.html', 'w').write(html)
PY
echo "Built public/base/index.html"
