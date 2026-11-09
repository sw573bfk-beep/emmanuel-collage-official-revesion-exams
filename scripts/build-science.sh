#!/usr/bin/env bash
# Builds public/science/ (the logged-in web version) from the parts in src/science/.
set -euo pipefail
cd "$(dirname "$0")/.."
SRC=src/science; OUT=public/science; mkdir -p "$OUT"
BUILD=$(date +%s)
ACCOUNT='<span class="acct"><span class="acct-name" id="acctName"></span><span class="small muted" id="syncStatus" aria-live="polite"></span></span><a class="btn quiet sm" href="/feedback/?from=science">Feedback</a><a class="btn quiet sm" href="/leaderboard/?from=science">🏆 Leaderboard</a><a class="btn quiet sm" href="/chat/?from=science" data-chat>💬 Chat</a><a class="btn quiet sm" href="/message/?from=science" data-msg><span class="msg-label">Message Beau</span></a><a class="btn quiet sm" href="/">Subjects</a><button id="logoutBtn" class="btn quiet sm" type="button">Log out</button>'
{
  echo '<!DOCTYPE html>'
  echo "<html lang=\"en\" data-build=\"$BUILD\">"
  echo '<head>'
  echo '<meta charset="utf-8">'
  echo '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'
  echo '<meta name="robots" content="noindex">'
  echo '<script src="/acct.js"></script>'
  cat "$SRC/head.html"
  echo '<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}[hidden]{display:none!important}.top-tools{flex-wrap:wrap;justify-content:flex-end}.acct{display:flex;flex-direction:column;align-items:flex-end;line-height:1.2}.acct-name{font-weight:600}</style>'
  echo '</head>'
  echo '<body>'
  sed -e "s#<!--ACCOUNT-->#$ACCOUNT#" \
      -e 's#<section id="v-home" class="view"></section>#<section id="v-home" class="view"><p class="muted">Loading your progress…</p></section>#' \
      -e 's#Your progress is saved in this browser only.#Your progress is saved to your account. Beau, who runs EC Revisions, can see your name, when you study and for how long, and your scores.#' \
      "$SRC/body.html"
  echo '<script>'; cat "$SRC/gate.js"; echo '</script>'
  echo '<script src="/tabbar.js" defer></script>'
  echo '<script src="/msg.js" defer></script>'
  echo '<script src="/help.js" defer></script>'
  echo '</body>'
  echo '</html>'
} > "$OUT/index.html"
cat "$SRC/core.js" "$SRC/gens.js" "$SRC/data.js" "$SRC/ui.js" > "$OUT/app.js"
echo "Built $OUT/index.html and $OUT/app.js"
