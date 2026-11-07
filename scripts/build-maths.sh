#!/usr/bin/env bash
# Builds public/maths/ (the logged-in web version) from the parts in src/maths/.
set -euo pipefail
cd "$(dirname "$0")/.."
SRC=src/maths; OUT=public/maths; mkdir -p "$OUT"
BUILD=$(date +%s)
ACCOUNT='<span class="acct"><span class="acct-name" id="acctName"></span><span class="small muted" id="syncStatus" aria-live="polite"></span></span><a class="btn quiet sm" href="/feedback/?from=maths">Feedback</a><a class="btn quiet sm" href="/">Subjects</a><button id="logoutBtn" class="btn quiet sm" type="button">Log out</button>'
{
  echo '<!DOCTYPE html>'
  echo "<html lang=\"en\" data-build=\"$BUILD\">"
  echo '<head>'
  echo '<meta charset="utf-8">'
  echo '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'
  echo '<meta name="robots" content="noindex">'
  sed -e 's#<title>Year 8 Maths Revision Hub</title>#<title>EC Revisions Maths</title>#' "$SRC/head.html"
  echo '<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}[hidden]{display:none!important}.top-tools{flex-wrap:wrap;justify-content:flex-end}.acct{display:flex;flex-direction:column;align-items:flex-end;line-height:1.2}.acct-name{font-weight:600}</style>'
  echo '</head>'
  echo '<body>'
  sed -e "s#<!--ACCOUNT-->#$ACCOUNT#" \
      -e 's#<section id="v-home" class="view"></section>#<section id="v-home" class="view"><p class="muted">Loading your progress…</p></section>#' \
      -e 's#Your progress is saved in this browser only.#Your progress is saved to your account, so it follows you to any device. Beau, who runs EC Revisions, can see your name, when you study and for how long, and your scores.#' \
      -e 's#<span class="brand-mark">y = mx + c</span>#<span class="brand-mark">EC Revisions · maths</span>#' \
      "$SRC/body.html"
  echo '<script>'; cat "$SRC/gate.js"; echo '</script>'
  echo '<script src="/help.js" defer></script>'
  echo '</body>'
  echo '</html>'
} > "$OUT/index.html"
cat "$SRC/engine.js" "$SRC/data.js" "$SRC/ui.js" > "$OUT/app.js"
echo "Built $OUT/index.html and $OUT/app.js"
