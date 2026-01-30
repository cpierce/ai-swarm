# MCP Integration Report: Home Assistant + Claude Code

## Executive Summary

Adding a Home Assistant MCP server to Claude Code on loki would give Claude native smart home tools instead of hand-crafted curl commands. This report evaluates the available options, recommends an approach, and provides implementation steps.

**Current state:** Claude controls HA via raw REST API calls (`curl` to `http://thor.localdomain:8123/api/services/...`). This works but requires Claude to know entity IDs, construct JSON payloads, and parse raw API responses every time.

**Target state:** Claude has structured MCP tools like `call_service`, `get_entity`, `search_entities`, and `list_entities` that handle the HA API natively. Claude can discover devices, check states, and control them through typed tool interfaces.

---

## What is MCP?

Model Context Protocol is an open standard for connecting AI tools to external systems. Instead of Claude constructing curl commands, an MCP server exposes structured **tools** (functions Claude can call), **resources** (data Claude can reference), and **prompts** (pre-built workflows). Claude Code has native MCP support built in.

---

## Current HA Environment

| Detail | Value |
|--------|-------|
| HA Version | 2026.1.2 |
| Host | thor.localdomain (172.16.2.15:8123) |
| Auth | Long-lived access token (`.ha_api-key`) |
| Entities | 347 across all domains |
| MCP Integration | **Not enabled** (404 on `/api/mcp`) |
| Domains | lights, climate, fans, switches, cameras, sensors, scenes, sirens, automations |

---

## Available Options

### Option 1: Official HA MCP Server Integration (Built-in)

The official `mcp_server` integration was added in HA 2025.2. It exposes `/api/mcp` as a Streamable HTTP endpoint.

**Pros:**
- Native to HA, no external dependencies
- Maintained by the HA core team
- Supports OAuth and long-lived access tokens
- Uses the Assist API, so entity exposure is controlled through HA's UI

**Cons:**
- Must be enabled through the HA UI (Settings > Devices & Services > Add Integration > "Model Context Protocol Server")
- Currently only supports Tools and Prompts (no Resources, Sampling, or Notifications)
- Exposes the Assist API (conversation-based), not raw service calls -- may be less granular
- Requires HTTP transport from Claude Code to HA (`--transport http`)
- You'd need to configure which entities are "exposed" to the MCP server through HA's entity exposure settings

**Claude Code setup (after enabling in HA):**
```bash
claude mcp add --transport http home-assistant \
  --header "Authorization: Bearer $(cat .ha_api-key)" \
  http://thor.localdomain:8123/api/mcp
```

---

### Option 2: `voska/hass-mcp` (Community, Docker/Python)

Third-party MCP server with the most comprehensive tool set. Runs as a stdio process via Docker or `uvx`.

**Tools exposed:**
- `get_entity` -- get state of any entity
- `entity_action` -- turn on/off/toggle with parameters
- `list_entities` -- list all entities, optionally filtered by domain
- `search_entities_tool` -- fuzzy search entities by name
- `call_service_tool` -- call any HA service with arbitrary data
- `domain_summary_tool` -- summarize all entities in a domain
- `get_history` -- historical state data
- `get_version` -- HA version info
- `get_error_log` -- HA error log
- `list_automations` -- list all automations
- `restart_ha` -- restart Home Assistant

**Resources exposed:**
- `hass://entities/{entity_id}` -- entity state
- `hass://entities/domain/{domain}` -- all entities in a domain
- `hass://search/{query}/{limit}` -- search entities

**Pros:**
- Richest tool set of all options
- Direct service calls (not just Assist API)
- Entity search and discovery built in
- Docker image available, stdio transport (no proxy needed)
- Resources for entity data access
- Guided prompts for automation creation, debugging, etc.

**Cons:**
- Third-party, not officially maintained by HA
- Docker adds a container per invocation (stdio mode runs `docker run -i --rm`)
- Needs network access from Docker container to HA (may need `--network host` or explicit IP)
- Python 3.13+ required if running without Docker; `uv`/`uvx` not currently installed on loki

**Claude Code setup (Docker):**
```bash
claude mcp add --transport stdio hass-mcp \
  --env HA_URL=http://172.16.2.15:8123 \
  --env HA_TOKEN="$(cat .ha_api-key)" \
  -- docker run -i --rm -e HA_URL -e HA_TOKEN voska/hass-mcp
```

---

### Option 3: `tevonsb/homeassistant-mcp` (Community, Node.js/Docker)

Another third-party server, Node.js-based. More focused on device control and add-on/package management.

**Tools exposed:**
- `control` -- turn on/off/toggle with brightness, color temp, RGB, climate modes
- `addon` -- list/install/start/stop/restart add-ons
- `package` -- HACS integration management
- `automation_config` -- create/duplicate/enable/disable/trigger automations

**Pros:**
- Node.js-based (Node 22 already installed on loki)
- Docker Compose setup available
- Add-on and HACS management (unique to this option)

**Cons:**
- Fewer core tools than `voska/hass-mcp`
- Requires Docker Compose or manual Node setup
- Needs WebSocket URL in addition to REST URL
- Supervisor/HACS access needed for advanced features (may not apply to your setup)

**Claude Code setup (Docker Compose):**
```bash
# Clone repo, configure .env, docker compose up -d
# Then add as stdio server pointing to the container
```

---

### Option 4: Official HA Integration + HTTP Transport (Simplest)

Use the built-in HA MCP server with Claude Code's HTTP transport. This is the lowest-friction option.

**Claude Code setup:**
```bash
claude mcp add --transport http ha http://thor.localdomain:8123/api/mcp \
  --header "Authorization: Bearer $(cat /home/cpierce/ai-swarm/.ha_api-key)"
```

**Requires:** Enabling the MCP Server integration in HA UI first.

---

## Recommendation

**Primary: Option 2 (`voska/hass-mcp` via Docker)**

Reasons:
- Richest tool set -- Claude gets entity search, service calls, history, automation listing, error logs
- Docker is already installed on loki, so no new dependencies
- stdio transport means Claude Code manages the server lifecycle automatically
- Entity search (`search_entities_tool`) lets Claude discover devices without needing the full entity list in context
- `call_service_tool` gives access to any HA service, not just the Assist API subset
- Resources provide structured entity data access

**Secondary/Future: Option 1 (Official HA Integration)**

Worth enabling in parallel for the road ahead. As the official integration matures (Resources, Notifications support), it may become the better long-term choice. It's also the only option that supports OAuth, which matters if you ever expose HA remotely.

---

## Implementation Plan

### Phase 1: Deploy `voska/hass-mcp`

1. **Pull the Docker image:**
   ```bash
   docker pull voska/hass-mcp
   ```

2. **Test connectivity from Docker to HA:**
   ```bash
   docker run --rm -e HA_URL=http://172.16.2.15:8123 \
     -e HA_TOKEN="$(cat .ha_api-key)" \
     voska/hass-mcp --help
   ```
   Note: Use the IP `172.16.2.15` instead of `thor.localdomain` since Docker containers may not resolve local DNS. Alternatively use `--network host`.

3. **Add to Claude Code:**
   ```bash
   claude mcp add --transport stdio hass-mcp \
     --env HA_URL=http://172.16.2.15:8123 \
     --env HA_TOKEN="$(cat /home/cpierce/ai-swarm/.ha_api-key)" \
     -- docker run -i --rm --network host -e HA_URL -e HA_TOKEN voska/hass-mcp
   ```

4. **Verify in Claude Code:**
   ```
   /mcp
   ```
   Should show `hass-mcp` as connected with its tools listed.

5. **Test basic operations:**
   - "What lights are on right now?"
   - "Turn on the office lights"
   - "What's the thermostat set to?"
   - "Show me the temperature history for today"

### Phase 2: Enable Official HA MCP Server (Optional)

1. In HA UI: Settings > Devices & Services > Add Integration > "Model Context Protocol Server"
2. Configure entity exposure (choose which entities the MCP server can see)
3. Add to Claude Code:
   ```bash
   claude mcp add --transport http ha-official \
     --header "Authorization: Bearer $(cat /home/cpierce/ai-swarm/.ha_api-key)" \
     http://thor.localdomain:8123/api/mcp
   ```
4. Compare tool capabilities between the two servers
5. Decide whether to keep one or both

### Phase 3: Integration with n8n Pipeline

Once the MCP server is working in direct Claude Code sessions, the same configuration applies when n8n invokes Claude Code. The MCP server starts automatically with each Claude Code session (stdio transport), so no additional infrastructure is needed.

Key consideration: The Docker container starts fresh each time Claude Code launches. First-tool-call latency may add ~2-3 seconds for container startup. If this is too slow for the Slack pipeline, consider running the MCP server as a persistent process instead of per-invocation Docker.

---

## Architecture After MCP

```
User (Slack) --> n8n --> Claude Code (loki)
                              |
                              |-- MCP: hass-mcp (Docker, stdio)
                              |     |-- get_entity
                              |     |-- entity_action (turn_on, turn_off, toggle)
                              |     |-- search_entities_tool
                              |     |-- call_service_tool
                              |     |-- list_entities
                              |     |-- get_history
                              |     |-- list_automations
                              |     |-- domain_summary_tool
                              |     |-- get_error_log
                              |     '-- restart_ha
                              |          |
                              |          v
                              |     Home Assistant (thor, 172.16.2.15:8123)
                              |
                              |-- Destiny (qwen3:30b-a3b) via curl
                              |-- Siler (qwen2.5:3b) via curl
                              |-- kubectl for cluster ops
                              |-- ssh for server management
                              '-- PostgreSQL for task memory
```

---

## Security Considerations

- The HA long-lived access token grants full API access. The MCP server inherits whatever permissions that token has.
- `restart_ha` and `get_error_log` tools are powerful -- consider whether you want Claude to have access to these. The `voska/hass-mcp` server exposes them by default.
- stdio transport means the MCP server only runs when Claude Code is active -- no persistent attack surface.
- Docker isolation provides a layer of separation between the MCP server process and the host.
- The token is passed as an environment variable to Docker, which is visible in `docker inspect`. For loki as a single-user orchestrator host this is acceptable.

---

## Cost/Resource Impact

- **Docker image size:** ~200MB (one-time pull)
- **Per-invocation overhead:** ~2-3 seconds for container startup
- **Memory:** ~50-100MB per running container
- **No additional API costs** -- all communication is local (loki -> thor on LAN)
- **No impact on Anthropic API budget** -- MCP tools are just structured function calls, same token cost as the equivalent curl approach

---

## Sources

- [Home Assistant MCP Server Integration (Official)](https://www.home-assistant.io/integrations/mcp_server/)
- [Home Assistant MCP Client Integration (Official)](https://www.home-assistant.io/integrations/mcp/)
- [voska/hass-mcp (GitHub)](https://github.com/voska/hass-mcp)
- [tevonsb/homeassistant-mcp (GitHub)](https://github.com/tevonsb/homeassistant-mcp)
- [allenporter/mcp-server-home-assistant (GitHub, archived)](https://github.com/allenporter/mcp-server-home-assistant)
- [Claude Code MCP Documentation](https://code.claude.com/docs/en/mcp)
- [Model Context Protocol Specification](https://modelcontextprotocol.io/introduction)
