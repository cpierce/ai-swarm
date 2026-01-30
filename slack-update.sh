#!/bin/bash
# Post a progress update to a Slack thread mid-execution
# Usage: slack-update.sh <channel> <thread_ts> <message>
#
# Example:
#   ./slack-update.sh C07XXXXXX 1706000000.000000 "Checking server status..."

CHANNEL="$1"
THREAD_TS="$2"
MESSAGE="$3"

if [ -z "$CHANNEL" ] || [ -z "$THREAD_TS" ] || [ -z "$MESSAGE" ]; then
  echo "Usage: slack-update.sh <channel> <thread_ts> <message>" >&2
  exit 1
fi

curl -s -X POST https://slack.com/api/chat.postMessage \
  -H "Authorization: Bearer $(cat /home/cpierce/ai-swarm/.slack_api-key)" \
  -H "Content-Type: application/json" \
  -d "{\"channel\":\"${CHANNEL}\",\"thread_ts\":\"${THREAD_TS}\",\"text\":\"${MESSAGE}\"}" > /dev/null
