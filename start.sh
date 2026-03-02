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

read -rp "Do you want to seed the database with sample data? (y/N): " SEED_CHOICE

PROFILE_FLAG=""
if [[ "${SEED_CHOICE,,}" == "y" || "${SEED_CHOICE,,}" == "yes" ]]; then
  PROFILE_FLAG="--profile seed"
  echo ""
  echo "Database will be seeded with sample data."
fi

echo ""
echo "Starting all services..."
echo ""

docker compose $PROFILE_FLAG up --build "$@"
