#!/usr/bin/env bash

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if ! command -v node >/dev/null 2>&1; then
  printf '%s\n' 'Node.js is required. See package.json for the supported version.' >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  printf '%s\n' 'npm is required to install project dependencies.' >&2
  exit 1
fi

npm ci
npm run sanitize

printf '%s\n' 'Local setup complete. Start the app with: npm run dev'
