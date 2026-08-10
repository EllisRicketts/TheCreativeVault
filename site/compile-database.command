#!/bin/sh
cd "$(dirname "$0")"
node tools/compile-database.js
read -p "Press enter to close..."
