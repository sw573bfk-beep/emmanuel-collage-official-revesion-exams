#!/usr/bin/env bash
# Builds the question bundles for /play/ (the live game with friends) from the subject question makers.
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=public/play; mkdir -p "$OUT"
cat src/science/core.js src/science/gens.js src/science/long.js src/science/data.js src/shared/practice.js > "$OUT/sci.js"
cat src/maths/engine.js src/maths/data.js src/maths/long.js src/shared/practice.js > "$OUT/maths.js"
# stamp the build so browsers fetch fresh bundles after a change
sed -i -E "s#<html lang=\"en\"( data-build=\"[0-9]+\")?>#<html lang=\"en\" data-build=\"$(date +%s)\">#" "$OUT/index.html"
echo "Built $OUT/sci.js and $OUT/maths.js"
