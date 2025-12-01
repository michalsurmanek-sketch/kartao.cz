#!/bin/bash

# Přidej compatibility layer do HTML souborů které mají Firebase ale ne Supabase
for file in *.html; do
  if grep -q "firebase" "$file" && ! grep -q "db-compatibility.js" "$file"; then
    echo "Přidávám compatibility do $file"
    # Najdi první <script src= řádek a vlož před něj
    sed -i '0,/<script src=/s|<script src=|  <script src="db-compatibility.js"></script>\n  <script src=|' "$file"
  fi
done

echo "✅ Compatibility layer přidán!"
