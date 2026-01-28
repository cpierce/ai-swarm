Summary
	•	Gemini 2.5 delivers the longest context and native multimodality, making it ideal for huge documents or multimedia tasks.
	•	Claude 3.5 Sonnet offers high‑quality reasoning and speed with a large context window at moderate cost; useful for final code reviews and complex reasoning.
	•	GPT‑4o provides strong general reasoning with a large context and full audio‑visual support, plus lower prices than Claude for many tasks.
	•	Qwen 3 (local) is free, supports tool‑calling and hybrid reasoning, and runs on your own hardware.  It's well suited for exploratory tasks, code scaffolding, summarisation and token‑intensive analysis.

---

# PROJECT CONVENTIONS

## API Key Management

**Standard pattern:** `.{service}_api-key`

All API keys and tokens for this project are stored as plaintext files in the project root following this naming convention. This keeps credentials:
- Out of environment variables (which can leak in logs)
- Out of code (no hardcoded secrets)
- Easy to rotate (just replace the file contents)
- Automatically gitignored via `.*_api-key` pattern

**When adding a new service:**
1. Create `.{service}_api-key` in the project root
2. Add the service to the table in "Credential & access management" section
3. Use `$(cat .{service}_api-key)` in scripts/commands

**Current key files:**
- `.unifi_api-key` - UniFi Network controller
- `.n8n_api-key` - n8n workflow automation

---

# INFRASTRUCTURE STATUS (Updated 2026-01-27)

## DGX Spark (destiny) - Senior Dev Model Host

### Hardware Specs
| Resource | Value |
|----------|-------|
| GPU | NVIDIA GB10 Blackwell (SM 12.1, unified memory) |
| Total Memory | 120GB unified (CPU+GPU shared) |
| Available for inference | ~115 GiB |
| CPU | 20 ARM cores |
| Storage | 3.7TB NVMe (3.3TB free) |
| CUDA | 13.0 |
| OS | Ubuntu 24.04.3 LTS |

### Ollama Configuration (PRODUCTION READY)
```bash
docker run -d --gpus all --restart always \
  -v ollama:/root/.ollama \
  -p 11434:11434 \
  --name ollama \
  -e OLLAMA_NUM_PARALLEL=8 \
  -e OLLAMA_CONTEXT_LENGTH=8192 \
  -e OLLAMA_FLASH_ATTENTION=true \
  -e OLLAMA_KEEP_ALIVE=30m \
  ollama/ollama:latest
```

### Model Performance Benchmarks (GB10)
| Model | Size | tok/s (single) | tok/s (8 parallel) | Verdict |
|-------|------|----------------|--------------------| --------|
| Qwen3 30B-A3B | 18GB | 14.5 | TBD | **CURRENT - Senior Dev** (MoE: 3B active) |
| Qwen3 14B | 9.3GB | 22.1 | 85 aggregate | Removed - replaced by 30B-A3B |
| Qwen2.5 32B Q4 | 19GB | ~8 | untested | Too slow |
| Qwen2.5 72B Q8 | 77GB | 2.5-2.9 | untested | Unusable - ggml not optimized for Blackwell |

### Key Findings
- vLLM standard Docker image incompatible with ARM64 GB10 (needs CUDA 13 ARM64 wheels)
- Ollama works but ggml backend not optimized for Blackwell architecture
- OLLAMA_NUM_PARALLEL=8 was optimal for 14B (85 tok/s aggregate) - retest needed for 30B-A3B
- MoE models (like 30B-A3B) should perform well due to sparse activation (only 3B active params)

### Available Models on destiny
```
qwen3:30b-a3b                 18 GB   <- SENIOR DEV (14.5 tok/s, MoE: 30B total, 3B active)
qwen2.5:32b-instruct-q4_K_M   19 GB
qwen2.5:72b-instruct-q8_0     77 GB
```

---

## k3s Cluster

### Nodes (as of 2026-01-27)
| Node | Role | IP | OS | Notes |
|------|------|----|----|-------|
| hammond | control-plane, master | 172.16.3.16 | Ubuntu 24.04.3 (LXC) | kubectl access via `ssh root@hammond` |
| destiny | worker | 172.16.3.133 | Ubuntu 24.04.3 | DGX Spark, NVIDIA kernel |
| daedalus | worker | 172.16.3.249 | Ubuntu 24.04.3 | Raspberry Pi |
| korolev | worker | 172.16.3.250 | Ubuntu 24.04.3 | Raspberry Pi |
| prometheus | worker | 172.16.3.247 | Ubuntu 24.04.3 | Raspberry Pi |
| tria | worker | 172.16.3.171 | Ubuntu 24.04.3 | Raspberry Pi |

### MetalLB Configuration (UPDATED)
- **Pool Name**: rancher-pool
- **IP Range**: 172.16.2.200-172.16.2.250 (changed from 172.16.3.x)
- **L2Advertisement**: rancher-l2

### Current LoadBalancer Services
| Namespace | Service | External IP | Port |
|-----------|---------|-------------|------|
| kube-system | traefik | 172.16.2.201 | 80, 443 |
| grafana | grafana | 172.16.2.200 | 3000 |
| monitoring | prometheus-external | 172.16.2.202 | 9090 |

### Network Notes
- Subnet changed to /23 (172.16.2.0-172.16.3.255)
- 172.16.2.x is NOT in DHCP pool (reserved for static/MetalLB)
- Nodes currently on 172.16.3.x/24 - **NEED DHCP RENEW OR REBOOT**
- MetalLB IPs (172.16.2.200-202) NOT reachable until nodes get /23 subnet

**To fix (after DHCP server updated):**
```bash
# Option 1: Reboot nodes (recommended)
ssh root@hammond "kubectl drain <node> --ignore-daemonsets && reboot"

# Option 2: Force DHCP renew on each node
dhclient -r eth0 && dhclient eth0
```

---

## Junior Dev Model (DEPLOYED)

### Model: qwen2.5:3b-instruct-q4_K_M
**Why this model:**
- Same Qwen family as senior - consistent prompting
- Native tool calling - critical for n8n agent nodes
- ~2GB size - fast enough for junior tasks (~50-80 tok/s expected)
- Better reasoning than 0.5B/1.5B alternatives

### Deployment (COMPLETE)
Deployed as DaemonSet on 4 Raspberry Pi nodes at `172.16.2.203:11434`

**API Usage:**
```bash
curl -s http://172.16.2.203:11434/api/generate -d '{
  "model": "qwen2.5:3b-instruct-q4_K_M",
  "prompt": "Your prompt here",
  "stream": false
}' | jq -r '.response'
```

```yaml
# Example k3s deployment (to be created)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: qwen-junior
  namespace: ai-workers
spec:
  replicas: 1
  selector:
    matchLabels:
      app: qwen-junior
  template:
    spec:
      containers:
      - name: ollama
        image: ollama/ollama:latest
        ports:
        - containerPort: 11434
        env:
        - name: OLLAMA_NUM_PARALLEL
          value: "2"
        - name: OLLAMA_CONTEXT_LENGTH
          value: "4096"
```

---

## Model Hierarchy

| Role | Model | Location | Speed | Use Case |
|------|-------|----------|-------|----------|
| Principal Engineer | Claude Opus 4.5 / GPT-4o | API | N/A | Final review, complex reasoning |
| Senior Dev | Qwen3 30B-A3B | destiny (Ollama @ :11434) | 14.5 tok/s | Infra, networking, code, DevOps |
| Junior Dev "Siler" | qwen2.5:3b-instruct-q4_K_M | k3s DaemonSet (172.16.2.203:11434) | ~50-80 tok/s | Simple tasks, quick iterations |

---

## TODO / Next Steps

1. [x] **Deploy Junior Dev model** - "Siler" (qwen2.5:3b-instruct-q4_K_M) deployed as DaemonSet on 4 Pis (172.16.2.203:11434)
2. [x] **Deploy n8n** - Running at 172.16.2.204:5678 (PostgreSQL on felger)
3. [x] **Install Claude CLI on destiny** - Installed v2.1.20 at /usr/local/bin/claude
4. [x] **Verify node subnet** - Nodes rebooted, /23 working, MetalLB IPs reachable
5. [x] **Test connectivity** - Verify 172.16.2.x IPs reachable from all nodes
6. [x] **Create n8n workflows** - Route between senior/junior/API models
7. [x] **Deploy Redis** - Running at 172.16.2.205:6379 with AOF persistence on destiny `/opt/redis-data`
8. [x] **Create ai_workers PostgreSQL database** - Schema on felger with tasks, subtasks, task_events tables (user: ai_worker)
9. [x] **Configure local kubectl** - `~/.kube/config` pointing to `hammond.localdomain:6443` with proper TLS (SAN added)
10. [ ] **Configure n8n Redis credentials** - Connect n8n to Redis at 172.16.2.205
11. [ ] **Configure n8n PostgreSQL credentials** - Connect n8n to ai_workers DB on felger
12. [ ] **Build Task Intake workflow** - POST /task/new → Destiny decomposes → store in Redis
13. [ ] **Build Worker Loop workflows** - Siler/Destiny poll Redis for subtasks
14. [ ] **Build Cloud Escalation workflow** - Route to Claude/GPT-4o/Gemini for critical decisions

---

## Access Commands

```bash
# SSH to DGX Spark
ssh destiny

# SSH to k3s control plane
ssh root@hammond

# Test Ollama on destiny
curl http://destiny.localdomain:11434/api/tags

# Test Ollama on k3s
curl http://172.16.2.203:11434/api/tags

# kubectl (runs locally)
kubectl get nodes -o wide

# kubectl via hammond (alternative)
ssh root@hammond "kubectl get nodes"
```

### API Access (using local key files)

```bash
# n8n - List workflows
curl -H "Authorization: Bearer $(cat .n8n_api-key)" \
  http://172.16.2.204:5678/api/v1/workflows

# n8n - Get workflow by ID
curl -H "Authorization: Bearer $(cat .n8n_api-key)" \
  http://172.16.2.204:5678/api/v1/workflows/{id}

# n8n - Execute workflow
curl -X POST -H "Authorization: Bearer $(cat .n8n_api-key)" \
  -H "Content-Type: application/json" \
  http://172.16.2.204:5678/api/v1/workflows/{id}/run

# UniFi - Get connected clients
curl -k -H "X-API-Key: $(cat .unifi_api-key)" \
  https://unifi.localdomain/proxy/network/api/s/default/stat/sta

# UniFi - Get device list
curl -k -H "X-API-Key: $(cat .unifi_api-key)" \
  https://unifi.localdomain/proxy/network/api/s/default/stat/device
```

---

Proposed architecture

1. Local inference layer (Spark box)
	1.	Deploy Qwen 3 locally using vLLM or Ollama on your Kubernetes cluster.  Qwen's MoE variants deliver strong performance while keeping active parameters low ￼.  Use a coder‑oriented model (e.g., Qwen2.5‑Coder or Qwen3‑A3B) for code tasks.
	2.	Expose the local model via an OpenAI‑compatible API (vLLM supports this natively; Ollama can as well) so that n8n and other tools can call it just like GPT endpoints.
	3.	Ensure GPU access on your Kubernetes nodes (install NVIDIA device plugin if not already present).  Choose model size based on available VRAM (e.g., 7 B or 8 B models for 16 GB VRAM; 30 B MoE for ~24 GB VRAM ￼).
	4.	Run the model in a dedicated namespace for easy scaling and updating.  Use a service such as local-llm.default.svc.cluster.local:8000 for API access.

2. Orchestration & workflow layer
	1.	Use n8n's AI Agent/Basic LLM Chain nodes to build workflows.  n8n already provides native integrations for OpenAI, Claude, Google Gemini and even local LLMs via the Ollama model sub‑node ￼.  You can also call any model via the HTTP Request node.
	2.	Create a routing function in n8n (or an intermediate microservice) that decides which model to call based on the task.  Start with simple rules:
	•	Use Qwen (local) for token‑hungry tasks: reading files, summarising modules, drafting tests, generating scaffold code, producing hand‑off summaries.
	•	Use Gemini 2.5 for multimodal tasks or when you need to ingest huge documents or code bases (1 M token context).  Also use it for tasks that require image or audio understanding ￼.
	•	Use GPT‑4o for general chat, code suggestions and quick multimodal interactions when cost is a concern; its 128 k context window supports lengthy conversations ￼.
	•	Reserve Claude 3.5 Sonnet for high‑stakes reasoning tasks, code reviews and any scenario where you need the best accuracy.  Claude achieved 64 % success on Anthropic's agentic coding evaluation and is twice as fast as Claude 3 Opus ￼ ￼.
	3.	Implement an MCP or tool‑calling layer if your agents need real‑time data.  The Model Context Protocol (MCP) standardises tool access and can be used to connect to web scraping tools or other APIs.  Articles on building MCP agents show how to integrate an MCP client node into n8n workflows ￼.  Using Qwen 3 with an MCP server allows your agent to call external tools, scrape websites, fetch product data and more ￼.
	4.	Leverage memory and planning: n8n's AI Agent node supports memory and planning components ￼.  Configuring memory helps the agent maintain context across steps, and planning allows it to decide when to call which tool.

3. Credential & access management

### API Key File Convention
All API keys are stored in the project root using the pattern: `.{service}_api-key`

| Service | File | Format | Endpoint |
|---------|------|--------|----------|
| UniFi Network | `.unifi_api-key` | Plain API token | `https://unifi.localdomain/api` |
| n8n | `.n8n_api-key` | JWT Bearer token | `http://172.16.2.204:5678/api/v1` |
| Anthropic Claude | `.anthropic_api-key` | Plain API key | `https://api.anthropic.com/v1` |
| OpenAI | `.openai_api-key` | Plain API key | `https://api.openai.com/v1` |
| Google Gemini | `.gemini_api-key` | Plain API key | `https://generativelanguage.googleapis.com/v1` |

### Usage Examples
```bash
# Load API key into environment variable
export UNIFI_API_KEY=$(cat .unifi_api-key)
export N8N_API_KEY=$(cat .n8n_api-key)

# Use with curl
curl -H "Authorization: Bearer $(cat .n8n_api-key)" http://172.16.2.204:5678/api/v1/workflows

# UniFi API example
curl -H "X-API-Key: $(cat .unifi_api-key)" https://unifi.localdomain/api/s/default/stat/sta
```

### Security Notes
- All `.{service}_api-key` files are gitignored
- Keys should have minimal required permissions
- Rotate keys periodically and update the local files

### n8n Credential Setup
1. For local Qwen there are no cloud credentials, but expose the service securely via Kubernetes secrets if gating access.
2. Configure n8n credentials by importing keys from the local files or using the n8n API.
3. Set up quotas: because remote models charge per token, define maximum token limits in your workflow to prevent unexpected costs. Claude's pricing is $3/1M input tokens and $15/1M output tokens; GPT‑4o is $2.50 and $10 respectively.
4. Implement fallback logic: if a provider hits rate limits or returns an error, automatically fall back to another provider or your local model.

4. Development workflow

Here is an end‑to‑end flow that balances cost and quality:
	1.	Initial analysis with local Qwen
	•	Receive the user's problem (e.g., "fix bug X").
	•	Use Qwen to read relevant files, summarise the bug and propose a patch and test plan.  Qwen's hybrid reasoning and tool‑calling capabilities allow it to produce chain‑of‑thought outputs and call external tools when needed ￼.
	•	Have Qwen produce a hand‑off summary: goal, proposed diff, commands to run, and remaining questions.
	2.	Draft execution
	•	Optionally run the patch in CI and collect test outputs.
	3.	High‑quality review
	•	Pass only the diff, failing tests and summary to a premium model:
	•	Use Claude 3.5 Sonnet for in‑depth reasoning and minimal change fixes.  Claude's agentic coding evaluation shows it can independently write and debug code ￼.
	•	For multimodal code (e.g., UI with images/videos) or extremely long context (whole codebase), use Gemini 2.5.
	4.	Final verification
	•	Run the final diff through local Qwen or GPT‑4o for quick sanity checks.
	5.	Routing feedback
	•	Collect quality metrics (time, token usage, success rate) to refine routing rules.  You can even use a small local model to predict which provider will succeed on a given task.

5. Next steps before tomorrow
	1.	Deploy your local model: set up vLLM or Ollama on your Kubernetes cluster and load a coder‑oriented Qwen model.  Test the API endpoint with simple prompts.
	2.	Set up n8n workflows: create a base workflow with an "On Chat Message" trigger and a Basic LLM Chain node, configure OpenAI/Gemini/Claude credentials, and add a custom HTTP node pointing to your local Qwen endpoint.  Include a simple routing function (e.g., a JavaScript Function node) that selects a model based on the message length or task type.
	3.	Acquire API keys: ensure you have valid API keys for Google Gemini, Anthropic Claude and OpenAI GPT‑4o.  Add them to n8n credentials.
	4.	Design a hand‑off template: define the structure of the summary Qwen will produce (goal, constraints, diff, commands, questions).  This makes the high‑end models' job easier.
	5.	Consider MCP integration: decide whether you need real‑time web data.  If yes, set up an MCP server (Bright Data's server or another open server) and add the MCP client tool to n8n.  This enables your agents to call scraping tools and other services through a standard protocol ￼ ￼.

Once these pieces are in place, you'll have an extensible framework: you can add more models (e.g., Groq, DeepSeek, Mistral) by exposing their endpoints and updating your routing rules.  This modular design allows you to combine the strengths of cutting‑edge proprietary models with free, local models to maximise performance while controlling costs.
