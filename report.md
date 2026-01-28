# AI-Workers: Unified Task Focus Implementation Report
**Date**: January 27, 2026
**Prepared for**: Tomorrow's Review

---

## Executive Summary

The ai-workers project has established a solid foundation for multi-model AI orchestration. The infrastructure is production-ready with n8n workflows coordinating between Destiny (senior worker on DGX Spark) and Siler (junior workers on Raspberry Pi cluster). However, to achieve true "common task focus" where all workers collaborate on a unified objective, several architectural enhancements are needed.

---

## Current State Assessment

### What's Working Well

| Component | Status | Notes |
|-----------|--------|-------|
| k3s Cluster | Production | 6 nodes operational |
| Destiny (DGX Spark) | Production | qwen3:30b-a3b at 14.5 tok/s |
| Siler (Pi Cluster) | Production | DaemonSet on 4 nodes |
| n8n Orchestration | Production | 3 workflow patterns deployed |
| MetalLB Networking | Production | Services reachable cluster-wide |
| PostgreSQL Backend | Production | Running on felger |

### Existing Workflow Patterns

1. **Destiny Manager** - Intelligent task delegation with review loop
2. **Siler Worker** - Direct junior execution endpoint
3. **Consensus Pattern** - Dual Siler + Destiny confirmation

### Current Limitations for Common Task Focus

1. **No Persistent Task Queue** - Tasks exist only within active workflow executions
2. **No Shared State** - Workers don't have access to a common "project state"
3. **No Task Decomposition** - Large tasks aren't automatically broken into subtasks
4. **No Progress Tracking** - No mechanism to track completion across workers
5. **Stateless Workers** - Each request is independent; no memory between calls
6. **No Priority System** - All tasks treated equally

---

## Proposed Architecture: Common Task Focus System

### Phase 1: Task Registry & Shared State

**Objective**: Create a central task registry that all workers can read/write

#### 1.1 Deploy Redis for Shared State
```
Purpose: Fast key-value store for task state, work queues, and inter-worker communication
Location: New MetalLB service at 172.16.2.205:6379
Namespace: ai-workers
```

**Data Structures Needed**:
- `task:active` - Hash of current common task metadata
- `task:subtasks` - Sorted set of subtasks by priority
- `task:progress` - Hash tracking completion percentage per subtask
- `task:context` - String containing shared context/learnings
- `worker:heartbeats` - Hash of worker last-seen timestamps

#### 1.2 Task Schema Design
```json
{
  "task_id": "uuid",
  "objective": "Build a user authentication system",
  "decomposed_by": "destiny",
  "created_at": "2026-01-28T00:00:00Z",
  "status": "in_progress",
  "subtasks": [
    {
      "id": "subtask-1",
      "description": "Design database schema for users table",
      "assigned_to": "siler",
      "status": "completed",
      "output": "...",
      "reviewed_by": "destiny",
      "review_status": "approved"
    }
  ],
  "shared_context": {
    "decisions": [],
    "learnings": [],
    "blockers": []
  }
}
```

---

### Phase 2: Task Decomposition Workflow

**Objective**: Automatically break large tasks into worker-appropriate subtasks

#### 2.1 New n8n Workflow: "Task Intake"
```
Trigger: POST /task/new
Flow:
1. Receive high-level task description
2. Send to Destiny for decomposition
3. Destiny analyzes and creates subtask list
4. Store task + subtasks in Redis
5. Return task_id to client
```

#### 2.2 Decomposition Prompt Template for Destiny
```
You are Destiny, the senior engineer. Break down this task into subtasks that can be:
- JUNIOR: Simple, well-defined, suitable for Siler (drafts, scaffolding, tests)
- SENIOR: Complex, requiring judgment, architectural decisions

For each subtask specify:
1. Description (clear, actionable)
2. Level (JUNIOR or SENIOR)
3. Dependencies (which subtasks must complete first)
4. Acceptance criteria (how to know it's done)
5. Estimated complexity (1-5)

Task to decompose: {task_description}
```

---

### Phase 3: Worker Coordination Loop

**Objective**: Workers continuously pull and process subtasks from the shared queue

#### 3.1 New n8n Workflow: "Worker Loop - Siler"
```
Trigger: Cron every 30 seconds OR webhook
Flow:
1. Check Redis for available JUNIOR subtasks (status=pending, dependencies=met)
2. If none available, sleep and retry
3. Claim subtask (set status=in_progress, assigned_to=siler)
4. Fetch shared context from Redis
5. Execute subtask with context
6. Store output in Redis
7. Set status=pending_review
8. Trigger Destiny review webhook
```

#### 3.2 New n8n Workflow: "Worker Loop - Destiny"
```
Trigger: Cron every 60 seconds OR webhook
Flow:
1. Check for subtasks pending review
2. Review Siler's work against acceptance criteria
3. If approved: set status=completed, update shared context with learnings
4. If rejected: set status=pending with feedback, increment retry count
5. Check for SENIOR subtasks needing direct work
6. Execute SENIOR subtasks directly
7. Update progress metrics
8. Check if all subtasks complete → Mark main task complete
```

#### 3.3 Progress Webhook for External Monitoring
```
Endpoint: GET /task/{task_id}/progress
Response:
{
  "task_id": "...",
  "objective": "...",
  "total_subtasks": 8,
  "completed": 5,
  "in_progress": 2,
  "pending": 1,
  "estimated_completion": "62.5%",
  "current_blockers": [],
  "recent_activity": [...]
}
```

---

### Phase 4: Shared Context Evolution

**Objective**: Workers build on each other's knowledge throughout the task

#### 4.1 Context Update Protocol

When a subtask completes, the reviewing worker (Destiny) should:

1. **Extract Learnings**: What was discovered that other workers need?
2. **Record Decisions**: What architectural choices were made?
3. **Note Blockers**: What issues need attention?
4. **Update Shared Context**: Append to Redis `task:context`

#### 4.2 Context Injection in Prompts

Every worker prompt should include:
```
## Shared Project Context
{fetch from Redis task:context}

## Your Subtask
{subtask description}

## Acceptance Criteria
{from subtask definition}

## Work from Other Workers
{relevant completed subtask outputs}
```

---

### Phase 5: Cloud Model Escalation

**Objective**: Integrate Tier 1 models (Claude, GPT-4, Gemini) for critical decisions

#### 5.1 Escalation Triggers

Destiny should escalate to cloud models when:
- Subtask has failed review 3+ times
- Security-sensitive decisions needed
- Architectural choices with long-term impact
- Destiny confidence score below threshold

#### 5.2 New n8n Workflow: "Cloud Escalation"
```
Trigger: Internal call from Destiny workflow
Flow:
1. Package context: task objective, subtask history, failure reasons
2. Route to appropriate cloud model based on task type:
   - Code review → Claude Opus 4.5
   - General reasoning → GPT-4o
   - Multi-modal tasks → Gemini 2.5
3. Parse cloud response
4. Return decision to Destiny for implementation
5. Log usage for cost tracking
```

#### 5.3 API Key Management

Verify/acquire these keys (store as `.{service}_api-key`):
- [ ] `.anthropic_api-key` - Claude API
- [ ] `.openai_api-key` - OpenAI API
- [ ] `.gemini_api-key` - Google AI API

---

## Implementation Roadmap

### Week 1: Foundation

| Day | Task | Owner |
|-----|------|-------|
| 1-2 | Deploy Redis to k3s cluster | DevOps |
| 2-3 | Create Redis n8n credentials | DevOps |
| 3-4 | Build Task Intake workflow | n8n |
| 4-5 | Test task decomposition with Destiny | Testing |

### Week 2: Worker Loops

| Day | Task | Owner |
|-----|------|-------|
| 1-2 | Build Siler Worker Loop workflow | n8n |
| 2-3 | Build Destiny Worker Loop workflow | n8n |
| 3-4 | Implement review/approval flow | n8n |
| 4-5 | Test end-to-end subtask execution | Testing |

### Week 3: Context & Polish

| Day | Task | Owner |
|-----|------|-------|
| 1-2 | Implement shared context system | n8n |
| 3-4 | Build progress monitoring endpoint | n8n |
| 4-5 | Add cloud escalation workflow | n8n |
| 5 | Documentation and testing | All |

---

## Technical Specifications

### Redis Deployment Manifest
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: ai-workers
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        ports:
        - containerPort: 6379
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "500m"
        volumeMounts:
        - name: redis-data
          mountPath: /data
      volumes:
      - name: redis-data
        emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
  name: redis
  namespace: ai-workers
spec:
  type: LoadBalancer
  loadBalancerIP: 172.16.2.205
  ports:
  - port: 6379
    targetPort: 6379
  selector:
    app: redis
```

### n8n Redis Integration

n8n has native Redis nodes for:
- **Redis Get/Set** - Direct key operations
- **Redis Pub/Sub** - Event-driven triggers (future enhancement)

---

## Key Design Decisions

### Why Redis over PostgreSQL for Task State?

| Factor | Redis | PostgreSQL |
|--------|-------|------------|
| Read/Write Speed | Sub-millisecond | Milliseconds |
| Data Structure Flexibility | Native lists, sets, hashes | Requires schema |
| Pub/Sub Capability | Built-in | Requires NOTIFY/LISTEN |
| Persistence | Optional (AOF/RDB) | Always |
| Complexity | Simple | More complex |

**Decision**: Use Redis for hot task state, PostgreSQL for historical logs/analytics.

### Polling vs Event-Driven Workers

**Current Plan**: Polling (cron-based worker loops)
- Simpler to implement in n8n
- Predictable resource usage
- Easy to debug

**Future Enhancement**: Redis Pub/Sub triggers
- Lower latency task pickup
- More efficient resource usage
- Requires n8n Redis Trigger node

### Subtask Granularity Guidelines

| Size | Example | Assigned To |
|------|---------|-------------|
| XS (< 5 min) | "Write unit test for function X" | Siler |
| S (5-15 min) | "Create API endpoint scaffold" | Siler |
| M (15-30 min) | "Implement validation logic" | Siler + Review |
| L (30-60 min) | "Design database schema" | Destiny |
| XL (> 60 min) | Should be decomposed further | Destiny |

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Redis single point of failure | High | Deploy Redis with persistence, backup |
| Worker infinite loops | Medium | Timeout limits, retry counters, alerts |
| Context grows too large | Medium | Summarization, rolling window |
| Cloud API costs | Medium | Strict escalation criteria, caching |
| Deadlocked subtasks | Medium | Dependency cycle detection |

---

## Success Metrics

### Quantitative
- Task completion rate (target: >90%)
- Average time from task intake to completion
- Subtask review pass rate (target: >80% first attempt)
- Cloud escalation rate (target: <10% of subtasks)

### Qualitative
- Workers maintain coherent context throughout task
- Output quality comparable to single-model approach
- System recovers gracefully from failures

---

## Open Questions for Tomorrow

1. **Task Persistence**: Should completed tasks be archived to PostgreSQL?
2. **Multi-Task Support**: Can multiple common tasks run simultaneously?
3. **Human-in-the-Loop**: Where should human approval gates be added?
4. **Cost Tracking**: How detailed should cloud API usage logging be?
5. **MCP Integration**: Should we explore Model Context Protocol for worker communication?

---

## Appendix A: Current n8n Workflow Inventory

| Workflow | Webhook | Purpose | Status |
|----------|---------|---------|--------|
| Destiny Manager | /destiny-manager | Smart delegation | Active |
| Siler Worker | /siler | Direct junior execution | Active |
| Local AI (Consensus) | /local-ai | Dual Siler + Destiny confirm | Active |
| Task Intake | /task/new | **PROPOSED** | - |
| Worker Loop - Siler | (cron) | **PROPOSED** | - |
| Worker Loop - Destiny | (cron) | **PROPOSED** | - |
| Cloud Escalation | (internal) | **PROPOSED** | - |
| Progress Monitor | /task/{id}/progress | **PROPOSED** | - |

---

## Appendix B: Quick Reference - Endpoints

### Current
```
Destiny (Ollama): http://destiny.localdomain:11434/api/generate
Siler (Ollama):   http://172.16.2.203:11434/api/generate
n8n:              http://172.16.2.204:5678
```

### Proposed (after implementation)
```
Redis:            http://172.16.2.205:6379
Task Intake:      POST http://172.16.2.204:5678/webhook/task/new
Task Progress:    GET  http://172.16.2.204:5678/webhook/task/{id}/progress
```

---

## Conclusion

The ai-workers infrastructure provides an excellent foundation. The path forward requires:

1. **Shared state** (Redis) for task coordination
2. **Task decomposition** logic in Destiny
3. **Worker loops** for continuous processing
4. **Shared context** for knowledge accumulation
5. **Cloud escalation** for critical decisions

This architecture will enable multiple workers to collaborate on a common objective while leveraging each tier's strengths appropriately.

---

*Report generated by Claude Code analysis of ai-workers codebase*
