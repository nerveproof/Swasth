#!/usr/bin/env bash

set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT" || exit 1

removed=0
warnings=0

remove_safe_junk() {
  local path
  while IFS= read -r -d '' path; do
    printf 'Removing safe local junk: %s\n' "${path#"$ROOT"/}"
    rm -f -- "$path"
    removed=$((removed + 1))
  done < <(
    find "$ROOT" \
      -path "$ROOT/.git" -prune -o \
      -path "$ROOT/node_modules" -prune -o \
      -type f \( -name '.DS_Store' -o -name '._*' -o -name 'Thumbs.db' -o -name 'Desktop.ini' \) \
      -print0
  )

  for path in "$ROOT/.cache" "$ROOT/.vite" "$ROOT/coverage" "$ROOT/cypress/screenshots" "$ROOT/cypress/videos"; do
    if [ -d "$path" ]; then
      printf 'Removing safe local cache: %s\n' "${path#"$ROOT"/}"
      rm -rf -- "$path"
      removed=$((removed + 1))
    fi
  done
}

warn_paths() {
  local label="$1"
  shift
  local path
  for path in "$@"; do
    if [ -e "$path" ]; then
      printf 'WARNING: %s: %s\n' "$label" "${path#"$ROOT"/}" >&2
      warnings=$((warnings + 1))
    fi
  done
}

remove_safe_junk

warn_paths "personal IDE/editor file" \
  "$ROOT/.idea" "$ROOT/.vscode" "$ROOT/.fleet" "$ROOT/.cursor" "$ROOT/.zed"
warn_paths "personal Git/user file" \
  "$ROOT/.gitconfig" "$ROOT/.git-credentials" "$ROOT/.npmrc" "$ROOT/.netrc"

while IFS= read -r -d '' path; do
  case "$path" in
    "$ROOT/.env.example") ;;
    *) printf 'WARNING: environment or secret-like file: %s\n' "${path#"$ROOT"/}" >&2; warnings=$((warnings + 1)) ;;
  esac
done < <(
  find "$ROOT" \
    -path "$ROOT/.git" -prune -o \
    -path "$ROOT/node_modules" -prune -o \
    -type f \( -name '.env' -o -name '.env.*' -o -name '*.pem' -o -name '*.key' -o -name '*.crt' -o -name '*.p12' -o -name '*.pfx' \) \
    -print0
)

while IFS= read -r -d '' path; do
  case "$path" in
    "$ROOT/.git/"*) ;;
    *) printf 'WARNING: personal or local-only path: %s\n' "${path#"$ROOT"/}" >&2; warnings=$((warnings + 1)) ;;
  esac
done < <(
  git diff --cached --name-only -z -- \
    '.idea/**' '.vscode/**' '.fleet/**' '.cursor/**' '.zed/**' \
    '.env' '.env.*' '*.pem' '*.key' '*.crt' '*.p12' '*.pfx' \
    '.gitconfig' '.git-credentials' '.npmrc' '.netrc'
)

if [ "$removed" -eq 0 ]; then
  printf '%s\n' 'No safe local junk needed removal.'
fi

if [ "$warnings" -gt 0 ]; then
  printf '%s\n' "Sanitize found $warnings local-only or secret-like path(s); do not commit them." >&2
  exit 1
fi

printf '%s\n' 'Local repository hygiene check passed.'
