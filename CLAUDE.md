# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AI worker orchestration system that coordinates multiple LLM tiers for task completion:

- **Tier 1 (Principal)**: Cloud APIs - Claude Opus 4.5, GPT-4o, Gemini 2.5 (final review, complex reasoning)
- **Tier 2 (Senior "Destiny")**: Qwen3 30B-A3B on DGX Spark via Ollama (infra, networking, code, DevOps)
- **Tier 3 (Junior "Siler")**: Qwen2.5 3B on Raspberry Pi k3s cluster (simple tasks, quick iterations)

n8n workflows orchestrate task routing between tiers based on complexity and cost considerations.

## Infrastructure

### Key Services

| Service | Endpoint |
|---------|----------|
| Destiny (Senior Ollama) | `http://destiny.localdomain:11434` |
| Siler (Junior Ollama) | `http://172.16.2.203:11434` |
| n8n Orchestrator | `http://172.16.2.204:5678` |
| Redis | `172.16.2.205:6379` |
| k3s Control Plane | `https://hammond.localdomain:6443` |

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

Every completed task gets a human-readable `summary` and searchable `tags`. This is how Claude recalls past work across sessions:

```sql
-- "Remember last time we updated servers?"
SELECT objective, summary, completed_at FROM tasks
WHERE tags @> '{update,servers}' ORDER BY created_at DESC LIMIT 3;

-- "What code have we generated?"
SELECT objective, summary, completed_at FROM tasks
WHERE tags @> '{code-generation}' ORDER BY created_at DESC LIMIT 5;
```

**On task completion, always:** write a `summary` (what happened, what worked, what failed) and add `tags` for future recall.

#### n8n Credentials (already configured)

| Credential | n8n ID | Target |
|------------|--------|--------|
| Redis (ai-workers) | `4GLRkyS2xk2B2roE` | 172.16.2.205:6379 |
| PostgreSQL (ai-workers) | `a1FtLvC6cJrb9Pmv` | felger:5432/ai_workers |

### kubectl

kubectl is configured locally via `~/.kube/config` pointing to `https://hammond.localdomain:6443`. No SSH needed — run `kubectl` commands directly.

### API Key Convention

All API keys stored as plaintext files in project root: `.{service}_api-key`

Current keys: `.unifi_api-key`, `.n8n_api-key`

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

## SSH Access

- LXC containers use `root` user: `ssh root@hammond`, `ssh root@carter`, `ssh root@felger`
- Physical/VM hosts use `cpierce` user: `ssh cpierce@destiny`, `ssh cpierce@daedalus`, etc.

### Claude Code on loki

Claude Code v2.1.22 is installed on loki (172.16.2.7, `ssh cpierce@loki`). This is the always-on orchestrator host — not dependent on a laptop being open. Node.js 22 is installed.

## Querying Task Memory

At the start of a session or when the user references past work, query PostgreSQL for context:

```bash
# Recall recent tasks
ssh root@felger "sudo -u postgres psql -d ai_workers -c \"SELECT objective, summary, tags, completed_at FROM tasks ORDER BY created_at DESC LIMIT 5;\""

# Search by tags
ssh root@felger "sudo -u postgres psql -d ai_workers -c \"SELECT objective, summary, completed_at FROM tasks WHERE tags @> '{servers}' ORDER BY created_at DESC LIMIT 3;\""

# Full audit trail for a task
ssh root@felger "sudo -u postgres psql -d ai_workers -c \"SELECT event_type, actor, details, created_at FROM task_events WHERE task_id='00000000-0000-0000-0000-000000000001' ORDER BY created_at;\""
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
curl -H "X-N8N-API-KEY: $(cat .n8n_api-key)" http://172.16.2.204:5678/api/v1/workflows

# UniFi API
curl -k -H "X-API-Key: $(cat .unifi_api-key)" \
  https://unifi.localdomain/proxy/network/api/s/default/stat/sta
```
