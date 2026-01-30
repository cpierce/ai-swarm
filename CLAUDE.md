# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI worker orchestration system. Claude Code on loki is the principal engineer and orchestrator. n8n is middleware between Slack (user interface) and Claude Code. Claude decides what to do itself vs delegate.

### Architecture Flow
```
User (Slack) → n8n → Claude Code (loki) → does work / delegates
                                         ├── Destiny (qwen3:30b-a3b) via curl
                                         ├── Siler (qwen2.5:3b) via curl
                                         ├── kubectl for cluster ops
                                         ├── ssh for server management
                                         └── PostgreSQL for task memory
              n8n ← Claude Code results
User (Slack) ← n8n
```

### Safety Rules

- **Be decisive** -- run commands and do the work directly instead of asking permission for routine tasks
- **Execute, don't suggest** -- if the user asks a question that can be answered by running a command (curl, kubectl, psql, etc.), just run it and return the result. Never respond with "you can run this command" when the user is clearly expecting an answer
- **Confirm before destructive actions** -- if a command could cause damage, data loss, or service disruption (e.g., `rm -rf`, `DROP TABLE`, `kubectl delete`, restarting production services, overwriting files), describe what you plan to do and wait for confirmation
- **Never expose secrets** -- do not output API keys, passwords, or private keys in Slack responses
- **Budget cap** -- each invocation has a $5 max budget to prevent runaway costs

### Delegation

When a task involves code generation, scaffolding, summarization, or other token-heavy work, delegate to the local models instead of doing it yourself:

- **Destiny (Senior)** -- use for complex code generation, infrastructure analysis, DevOps tasks. Call via:
  ```bash
  curl -s http://destiny.localdomain:11434/api/generate -d '{"model":"qwen3:30b-a3b","prompt":"your prompt","stream":false}' | jq -r '.response'
  ```
- **Siler (Junior)** -- use for simple tasks, quick drafts, test generation. Call via:
  ```bash
  curl -s http://172.16.2.203:11434/api/generate -d '{"model":"qwen2.5:3b-instruct-q4_K_M","prompt":"your prompt","stream":false}' | jq -r '.response'
  ```

Use your judgment: if the task requires high-quality reasoning or final review, do it yourself. If it's grunt work or a first draft, delegate.

### Output Formatting

Responses are delivered via Slack. Format accordingly:
- Use Slack markdown: `*bold*`, `_italic_`, `` `inline code` ``, and triple-backtick code blocks
- Wrap tables, command output, and any structured/columnar data in triple-backtick code blocks so they render as monospace in Slack
- Keep responses concise -- Slack messages have a 4000 character limit per message
- If output is long, summarize the key points and offer to provide details
- Use bullet points for lists, not numbered lists with periods

### Progress Updates (Mid-Execution)

**Always post progress updates to Slack while working.** The user is waiting and silence feels slow. Every task with more than one step should include at least one progress update. The n8n prompt includes `SLACK_CHANNEL` and `SLACK_THREAD_TS` values -- use them.

```bash
/home/cpierce/ai-swarm/slack-update.sh <channel> <thread_ts> "your message"
```

**Rules:**
- Post an update *before* each major step: "Checking Ollama endpoints...", "SSHing into destiny...", "Querying task history..."
- Post intermediate findings: "Both endpoints responding, checking model status..."
- If a step takes a while, update so the user knows you're still working
- Keep updates short (one line) and informative
- Don't skip this -- the user expects to see progress in the thread as you work

### Model Tiers
- **Tier 1 (Principal)**: Claude Code on loki - orchestrates everything, makes all decisions
- **Tier 2 (Senior "Destiny")**: Qwen3 30B-A3B on DGX Spark via Ollama (delegated infra, networking, code, DevOps tasks)
- **Tier 3 (Junior "Siler")**: Qwen2.5 3B on Raspberry Pi k3s cluster (delegated simple tasks, quick iterations)

## Infrastructure

### Key Services

| Service | Endpoint |
|---------|----------|
| Destiny (Senior Ollama) | `http://destiny.localdomain:11434` |
| Siler (Junior Ollama) | `http://172.16.2.203:11434` |
| n8n Orchestrator | `https://automation.cpierce.org` |
| Redis | `172.16.2.205:6379` |
| k3s Control Plane | `https://hammond.localdomain:6443` |
| Home Assistant (thor) | `http://thor.localdomain:8123` |

### Home Assistant Devices

Full device/entity reference is in [`ha-devices.md`](ha-devices.md). Includes all 347 entities organized by domain: cameras (Ring), climate/thermostats, lights (indoor/outdoor/Hue), fans (LeVoit), switches (Rachio sprinkler zones, thermostat holds), sensors (temperature, humidity, air quality), scenes, sirens, and API usage examples.

### k3s Cluster

- **Control plane**: hammond (LXC, 172.16.2.9)
- **GPU worker**: destiny (DGX Spark, 172.16.2.10) - hosts senior model
- **Pi workers**: daedalus, korolev, prometheus, tria (172.16.2.11-14) - host junior model as DaemonSet

### Persistence

- **Redis** (172.16.2.205) - Hot task state, queues, in-thread conversation context. AOF persistence on destiny at `/opt/redis-data`.
- **PostgreSQL** (felger 172.16.2.16) - Long-term archive and institutional memory in `ai_workers` database. User: `ai_worker` / `ai_worker_2026`.

#### PostgreSQL Schema (`ai_workers` database)

- **`tasks`** - Top-level tasks with `objective`, `status`, `shared_context` (JSONB), `summary` (text written at completion for cross-task memory), `tags` (text array, GIN-indexed for recall queries)
- **`subtasks`** - Individual work items with `level` (junior/senior), `assigned_to`, `status`, `review_status`, `depends_on`, `retry_count`
- **`task_events`** - Audit log of all activity per task (who did what, when, with JSONB details)

#### Task Memory System

Every completed task gets a human-readable `summary` and searchable `tags`. This is how Claude recalls past work across sessions.

**Deep recall policy:** Don't stop at the first query. When recalling past work, search broadly and dig deeper:

1. **Start broad** -- query recent tasks first to get context
2. **Follow the chain** -- if a task references related work, query those tasks/subtasks too
3. **Try multiple tag combos** -- if `{update,servers}` returns nothing useful, try `{servers}`, `{update}`, or related tags like `{infrastructure}`, `{maintenance}`
4. **Check subtasks and events** -- the summary alone may not have enough detail; look at subtask results and the audit trail for the full picture
5. **Search by text** -- use `ILIKE` on `objective` and `summary` when tags don't capture what you need

```sql
-- Step 1: Recent tasks for broad context
SELECT id, objective, summary, tags, completed_at FROM tasks
ORDER BY created_at DESC LIMIT 10;

-- Step 2: Tag-based search (try multiple tag combos)
SELECT id, objective, summary, tags, completed_at FROM tasks
WHERE tags @> '{update,servers}' ORDER BY created_at DESC LIMIT 5;

-- Step 3: Text search when tags aren't enough
SELECT id, objective, summary, tags, completed_at FROM tasks
WHERE objective ILIKE '%server%' OR summary ILIKE '%server%'
ORDER BY created_at DESC LIMIT 5;

-- Step 4: Dig into subtasks for a specific task
SELECT id, description, level, assigned_to, status, review_status, result
FROM subtasks WHERE task_id = '<task-uuid>' ORDER BY created_at;

-- Step 5: Full audit trail for detailed history
SELECT event_type, actor, details, created_at FROM task_events
WHERE task_id = '<task-uuid>' ORDER BY created_at;
```

**On task completion, always:** write a `summary` (what happened, what worked, what failed) and add `tags` for future recall. Use specific, searchable tags -- prefer `{ssh,access,servers,verification}` over just `{servers}`.

#### n8n Credentials (already configured)

| Credential | n8n ID | Target |
|------------|--------|--------|
| Redis (ai-workers) | `4GLRkyS2xk2B2roE` | 172.16.2.205:6379 |
| PostgreSQL (ai-workers) | `a1FtLvC6cJrb9Pmv` | felger:5432/ai_workers |

### kubectl

kubectl is configured locally via `~/.kube/config` pointing to `https://hammond.localdomain:6443`. No SSH needed — run `kubectl` commands directly.

### API Key Convention

All API keys stored as plaintext files in project root: `.{service}_api-key`

Current keys: `.unifi_api-key`, `.n8n_api-key`, `.slack_api-key`, `.ha_api-key`

Usage in scripts: `$(cat .{service}_api-key)`

## Running the WiFi Client Monitor

The `test/` directory contains a Flask app that displays WiFi client signal strength from UniFi:

```bash
cd test
python server.py  # Serves on http://localhost:5000
```

Requires: `flask`, `flask-cors`, `requests` and valid `.unifi_api-key` in project root.

## n8n Workflow Patterns

Three active workflows in n8n:

1. **Destiny Manager** (`/destiny-manager`) - Intelligent task delegation with review loop
2. **Siler Worker** (`/siler`) - Direct junior execution endpoint
3. **Local AI Consensus** (`/local-ai`) - Dual Siler + Destiny confirmation

## SSH Access (from loki)

- LXC containers use `root` user: `ssh root@hammond`, `ssh root@carter`, `ssh root@felger`
- Physical/VM hosts use `cpierce` user: `ssh cpierce@destiny`, `ssh cpierce@daedalus`, etc.
- Apophis uses `pilot` user: `ssh pilot@apophis`

### Verified Access (2026-01-28)
| Host | User | Status |
|------|------|--------|
| hammond | root | OK |
| carter | root | OK |
| felger | root | OK |
| destiny | cpierce | OK |
| daedalus | cpierce | OK |
| korolev | cpierce | OK |
| prometheus | cpierce | OK |
| tria | cpierce | OK |
| hermes | cpierce | OK |
| loki | cpierce | OK (localhost) |
| dhd | cpierce | OK |
| apophis | pilot | OK |
| fifth | root | BLOCKED - needs SSH key |
| thor | root | BLOCKED - port 22 refused |
| dakara.csdurant.com | cpierce | OK |
| chulak.csdurant.com (port 2022) | cpierce | OK |
| orilla.csdurant.com | cpierce | OK |
| cheyenne.csdurant.com | cpierce | OK |

### Claude Code on loki (Orchestrator Host)

Claude Code is installed on loki (172.16.2.7). This is the always-on orchestrator host — not dependent on a laptop being open. Node.js 22 is installed. kubectl is configured locally.

## Querying Task Memory

psql is installed locally on loki with passwordless auth via `~/.pgpass`. Query PostgreSQL directly (no SSH needed):

```bash
# Recall recent tasks
psql -h felger.localdomain -U ai_worker -d ai_workers -c "SELECT objective, summary, tags, completed_at FROM tasks ORDER BY created_at DESC LIMIT 5;"

# Search by tags
psql -h felger.localdomain -U ai_worker -d ai_workers -c "SELECT objective, summary, completed_at FROM tasks WHERE tags @> '{servers}' ORDER BY created_at DESC LIMIT 3;"

# Full audit trail for a task
psql -h felger.localdomain -U ai_worker -d ai_workers -c "SELECT event_type, actor, details, created_at FROM task_events WHERE task_id='00000000-0000-0000-0000-000000000001' ORDER BY created_at;"

# Log a completed task
psql -h felger.localdomain -U ai_worker -d ai_workers -c "INSERT INTO tasks (objective, status, summary, tags, completed_at) VALUES ('...', 'completed', '...', ARRAY['tag1','tag2'], NOW());"
```

## Useful Commands

```bash
# Test Ollama endpoints
curl http://destiny.localdomain:11434/api/tags
curl http://172.16.2.203:11434/api/tags

# Ask Destiny to generate something
curl -s http://destiny.localdomain:11434/api/generate -d '{"model":"qwen3:30b-a3b","prompt":"your prompt","stream":false}'

# k3s cluster (kubectl runs locally)
kubectl get nodes -o wide
kubectl get svc -A | grep LoadBalancer
kubectl get pods -n ai-workers

# Redis
kubectl exec -n ai-workers deployment/redis -- redis-cli PING
kubectl exec -n ai-workers deployment/redis -- redis-cli GET task:current

# n8n API
curl -H "X-N8N-API-KEY: $(cat .n8n_api-key)" https://automation.cpierce.org/api/v1/workflows

# UniFi API
curl -k -H "X-API-Key: $(cat .unifi_api-key)" \
  https://unifi.localdomain/proxy/network/api/s/default/stat/sta

# Home Assistant API (thor)
curl -s -H "Authorization: Bearer $(cat .ha_api-key)" \
  http://thor.localdomain:8123/api/ | jq
curl -s -H "Authorization: Bearer $(cat .ha_api-key)" \
  http://thor.localdomain:8123/api/states | jq
```

### Home Assistant API — Important Notes

When calling the Home Assistant API on thor, always use `curl -X POST` with proper headers and JSON body. A common failure mode is constructing the curl command incorrectly (e.g., missing `-X POST`, malformed JSON, or not actually executing the call), which causes the API call to silently fail — the light/device won't change but no error is returned.

**Correct pattern for service calls:**
```bash
curl -s -X POST \
  -H "Authorization: Bearer $(cat .ha_api-key)" \
  -H "Content-Type: application/json" \
  -d '{"entity_id": "light.office", "color_temp_kelvin": 6500, "brightness": 255}' \
  http://thor.localdomain:8123/api/services/light/turn_on
```

**Key rules:**
- Always use `-X POST` for service calls — GET requests won't trigger actions
- Always include `Content-Type: application/json` header
- Always verify the change took effect by reading the entity state afterward:
  ```bash
  curl -s -H "Authorization: Bearer $(cat .ha_api-key)" \
    http://thor.localdomain:8123/api/states/light.office | jq '.attributes | {brightness, color_temp_kelvin, rgb_color}'
  ```
- For light color/temperature changes, include both the attribute AND `brightness` to ensure the light is on
- Supported light attributes: `color_temp_kelvin` (2000-6500), `rgb_color` ([R,G,B]), `brightness` (0-255), `hs_color` ([hue, saturation])
