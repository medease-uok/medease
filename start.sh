#!/usr/bin/env bash
set -euo pipefail

echo "==============================="
echo "  MedEase Development Setup"
echo "==============================="
echo ""

if ! docker info > /dev/null 2>&1; then
  echo "Error: Docker is not running. Please start Docker and try again."
  exit 1
fi

cd "$(dirname "$0")"

PASSWORD_FILE=".vault-password"
SECRETS_FILE="secrets.enc"

# ── 1. Install dependencies ──────────────────────────────────────────────────

echo "Installing dependencies..."
echo ""

echo "[1/2] Backend dependencies..."
(cd backend && npm install)

echo ""
echo "[2/2] Frontend dependencies..."
(cd frontend && npm install)

# ── 2. Seed prompt ───────────────────────────────────────────────────────────

echo ""
read -rp "Do you want to seed the database with sample data? (y/N): " SEED_CHOICE

PROFILE_FLAG=""
if [[ "${SEED_CHOICE,,}" == "y" || "${SEED_CHOICE,,}" == "yes" ]]; then
  PROFILE_FLAG="--profile seed"
  echo ""
  echo "Database will be seeded with sample data."
fi

# ── 3. Decrypt secrets ───────────────────────────────────────────────────────

if [[ -f "$SECRETS_FILE" ]]; then
  echo ""

  # Get password (saved locally or prompt once)
  if [[ -f "$PASSWORD_FILE" ]]; then
    VAULT_PASS=$(cat "$PASSWORD_FILE")
  else
    read -rsp "Enter vault password: " VAULT_PASS
    echo ""

    # Verify the password works before saving
    if ! echo "$VAULT_PASS" | openssl enc -aes-256-cbc -pbkdf2 -d -in "$SECRETS_FILE" -pass "stdin" > /dev/null 2>&1; then
      echo "Error: Incorrect password."
      exit 1
    fi

    echo "$VAULT_PASS" > "$PASSWORD_FILE"
    chmod 600 "$PASSWORD_FILE"
    echo "Password saved to ${PASSWORD_FILE} (gitignored)."
  fi

  # Decrypt and export each secret
  DECRYPTED=$(echo "$VAULT_PASS" | openssl enc -aes-256-cbc -pbkdf2 -d -in "$SECRETS_FILE" -pass "stdin" 2>/dev/null)

  if [[ -z "$DECRYPTED" ]]; then
    echo "Error: Failed to decrypt secrets. Delete ${PASSWORD_FILE} and try again."
    exit 1
  fi

  while IFS='=' read -r key value; do
    [[ -z "$key" || "$key" == \#* ]] && continue
    export "$key=$value"
  done <<< "$DECRYPTED"

  echo "Secrets loaded from ${SECRETS_FILE}."
else
  echo ""
  echo "No secrets.enc found — using test keys."
  echo "An admin can create it with: ./scripts/encrypt-secrets.sh"
fi

# ── 4. Start all services ────────────────────────────────────────────────────

echo ""
echo "Starting all services..."
echo ""

docker compose $PROFILE_FLAG up --build "$@"
