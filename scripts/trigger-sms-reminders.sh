#!/bin/bash
# SMS Reminders Cron Script
# Run every 30 minutes via system cron or GitHub Actions
#
# Usage:
#   ./scripts/trigger-sms-reminders.sh
#
# Environment variables required:
#   APP_URL     - Base URL of the app (e.g. https://app.citaliks.com)
#   CRON_SECRET - Secret token to authorize the cron endpoint

APP_URL="${APP_URL:-https://app.citaliks.com}"
CRON_SECRET="${CRON_SECRET:-}"

if [ -z "$CRON_SECRET" ]; then
  echo "[cron] WARNING: CRON_SECRET not set. Endpoint may reject the request."
fi

echo "[cron] Triggering SMS reminders at $(date -u +%Y-%m-%dT%H:%M:%SZ)"

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  -H "Content-Type: application/json" \
  "${APP_URL}/api/sms/reminders")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "[cron] HTTP ${HTTP_CODE}: ${BODY}"

if [ "$HTTP_CODE" -eq 200 ]; then
  echo "[cron] ✓ SMS reminders processed successfully"
  exit 0
else
  echo "[cron] ✗ Failed with HTTP ${HTTP_CODE}"
  exit 1
fi
