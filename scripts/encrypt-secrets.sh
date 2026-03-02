#!/usr/bin/env bash
set -euo pipefail

#
# Admin-only script: encrypt secrets into secrets.enc (committed to git).
# Team members decrypt them at runtime using the shared password.
#
# Usage:
#   ./scripts/encrypt-secrets.sh
#
# This will prompt for each secret and an encryption password,
# then write secrets.enc in the project root.
#

cd "$(dirname "$0")/.."

echo "==============================="
echo "  MedEase — Encrypt Secrets"
echo "==============================="
echo ""
echo "Enter the real values for each secret."
echo "These will be AES-256 encrypted and saved to secrets.enc."
echo ""

read -rp "  CLOUDFLARE_SECRET_KEY: " CF_SECRET
read -rp "  VITE_CLOUDFLARE_SITE_KEY: " CF_SITE
read -rp "  JWT_SECRET: " JWT

echo ""

# Build the plaintext env content
PLAIN=$(cat <<EOF
CLOUDFLARE_SECRET_KEY=${CF_SECRET}
VITE_CLOUDFLARE_SITE_KEY=${CF_SITE}
JWT_SECRET=${JWT}
EOF
)

# Prompt for encryption password (hidden input)
while true; do
  read -rsp "  Encryption password: " PASS1
  echo ""
  read -rsp "  Confirm password: " PASS2
  echo ""

  if [[ "$PASS1" == "$PASS2" ]]; then
    break
  fi
  echo "  Passwords do not match. Try again."
  echo ""
done

# Encrypt using AES-256-CBC with PBKDF2 key derivation
echo "$PLAIN" | openssl enc -aes-256-cbc -pbkdf2 -salt -pass "pass:${PASS1}" -out secrets.enc

echo ""
echo "secrets.enc written successfully."
echo ""
echo "Next steps:"
echo "  1. Commit secrets.enc to git (it is encrypted and safe)."
echo "  2. Share the encryption password with your team securely."
echo "  3. Team members run ./start.sh — it will ask for the password once."
