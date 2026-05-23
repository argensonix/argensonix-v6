#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="/srv/repos/personal/argensonix/argensonix-v6"
BRANCH="main"
WEB_ROOT="/srv/data/www/staging.argensonix.net"
LOG_DIR="/srv/logs/argensonix-v6"
LOG_FILE="${LOG_DIR}/deploy-staging.log"

mkdir -p "$LOG_DIR"

{
  echo "[$(date --iso-8601=seconds)] Starting staging deploy"

  cd "$REPO_DIR"

  git fetch origin "$BRANCH"
  git reset --hard "origin/${BRANCH}"

  npm ci
  npm run build

  mkdir -p "$WEB_ROOT"
  rsync -a --delete dist/ "${WEB_ROOT}/"

  echo "[$(date --iso-8601=seconds)] Staging deploy finished"
} >> "$LOG_FILE" 2>&1
