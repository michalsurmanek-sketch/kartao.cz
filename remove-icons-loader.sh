#!/bin/bash

# Odstranit icons-loader.js ze všech HTML souborů

count=0
for file in *.html; do
  if [ -f "$file" ]; then
    # Odstranit řádek s icons-loader.js
    sed -i '/<script defer src="icons-loader.js"><\/script>/d' "$file"
    count=$((count + 1))
  fi
done

echo "✅ Odstraněno icons-loader.js z $count souborů"
