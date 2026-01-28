# Network Configuration

Updated: 2026-01-28

## Subnet

| Property | Value |
|----------|-------|
| Network | 172.16.2.0/23 |
| Range | 172.16.2.0 - 172.16.3.255 |
| Gateway | 172.16.3.1 (UniFi Dream Machine) |
| DHCP Pool | 172.16.3.x (excludes 172.16.2.x) |
| MetalLB Pool | 172.16.2.200 - 172.16.2.250 |

## UniFi Dream Machine API

| Property | Value |
|----------|-------|
| IP | 172.16.3.1 |
| API Key | `9y1Hc54WkzyEA0QixRJzcYd3_5a9EcW4` |
| API Endpoint | `https://172.16.3.1/proxy/network/api/s/default/` |

### Example API Calls
```bash
# Get all devices
curl -s -k https://172.16.3.1/proxy/network/api/s/default/stat/device \
  -H "X-API-KEY: 9y1Hc54WkzyEA0QixRJzcYd3_5a9EcW4"

# Get clients
curl -s -k https://172.16.3.1/proxy/network/api/s/default/stat/sta \
  -H "X-API-KEY: 9y1Hc54WkzyEA0QixRJzcYd3_5a9EcW4"
```

---

## Current Status (2026-01-28)

### MetalLB Services - ALL WORKING

| Service | External IP | Port | Status |
|---------|-------------|------|--------|
| Grafana | 172.16.2.200 | 3000 | OK |
| Traefik | 172.16.2.201 | 80, 443 | OK |
| Prometheus | 172.16.2.202 | 9090 | OK |
| Siler (Qwen 2.5 3B) | 172.16.2.203 | 11434 | OK |
| n8n | 172.16.2.204 | 5678 | OK |
| Redis | 172.16.2.205 | 6379 | OK |

### Recent Changes
- Redis deployed to ai-workers namespace at 172.16.2.205:6379 (AOF persistence on destiny)
- PostgreSQL `ai_workers` database created on felger (tasks, subtasks, task_events)
- k3s TLS SAN updated to include `hammond.localdomain` for remote kubectl
- MetalLB pool changed from 172.16.3.200-250 to 172.16.2.200-250
- Subnet expanded from /24 to /23
- All k3s nodes rebooted and uncordoned
- Hammond control plane now has /23 subnet
- Kiosk on hermes updated to point to 172.16.2.200:3000

---

## Hosts

### k3s Cluster Nodes

| Hostname | Role | IP | Type | SSH User | Notes |
|----------|------|-------|------|----------|-------|
| hammond | control-plane, master | 172.16.2.9 | LXC | root | kubectl access |
| destiny | worker | 172.16.2.10 | DGX Spark | cpierce | NVIDIA GB10 GPU, Ollama host |
| daedalus | worker | 172.16.2.11 | Raspberry Pi5 | cpierce | |
| korolev | worker | 172.16.2.12 | Raspberry Pi5 | cpierce | |
| prometheus | worker | 172.16.2.13 | Raspberry Pi5 | cpierce | |
| tria | worker | 172.16.2.14 | Raspberry Pi5 | cpierce | |

### Other Hosts

| Hostname | IP | Type | Purpose | SSH User |
|----------|-------|------|---------|----------|
| iris | 172.16.2.2 | VM/LXC | Twingate Server | none |
| zelenka | 172.16.2.3 | VM | Windows Machine | cpierce | 
| apophis | 172.16.2.4 | Pi5 | KVM for Laptop | pilot | 
| fifth | 172.16.2.5 | Bare Metal | Proxmox Server | root |  
| carter | 172.16.2.6 | VM/LXC | MySQL Proxmox LXC | root |
| loki | 172.16.2.7 | VM | Linux Server | cpierce |
| hermes | 172.16.2.8 | Pi5 | Kiosk display, Grafana dashboard | cpierce |
| thor | 172.16.2.15 | VM | Home Assistant Server | root |
| felger | 172.16.2.16 | VM/LXC | Postgres Proxmox LXC (n8n db) | root | 
| dhd | 172.16.2.17 | VM | OpenVPN Connect Connector | cpierce | 

---

## MetalLB Configuration

### IP Address Pool
- **Name**: rancher-pool
- **Range**: 172.16.2.200 - 172.16.2.250
- **Protocol**: Layer 2 (L2Advertisement)
- **L2Advertisement Name**: rancher-l2

### LoadBalancer Services

| Namespace | Service | External IP | Port | Status |
|-----------|---------|-------------|------|--------|
| grafana | grafana | 172.16.2.200 | 3000 | OK |
| kube-system | traefik | 172.16.2.201 | 80, 443 | OK |
| monitoring | prometheus-external | 172.16.2.202 | 9090 | OK |
| ai-workers | siler-external | 172.16.2.203 | 11434 | OK |
| ai-workers | n8n-external | 172.16.2.204 | 5678 | OK |
| ai-workers | redis-external | 172.16.2.205 | 6379 | OK |

---

## n8n

| Property | Value |
|----------|-------|
| URL | http://172.16.2.204:5678 |
| API Key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkNGIzMzhkMy0zMmMxLTQ3YjgtYTEwMi04NDJjZWJkMTQwMDAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY5NTM0MDExfQ.ciPAkBEq-4lbc58AVtHGZWsnGZN2vB7iJPaF_TKa8fU` |
| Database | PostgreSQL on felger (172.16.2.16) |
| Namespace | ai-workers |

### API Example
```bash
curl -H "X-N8N-API-KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkNGIzMzhkMy0zMmMxLTQ3YjgtYTEwMi04NDJjZWJkMTQwMDAiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY5NTM0MDExfQ.ciPAkBEq-4lbc58AVtHGZWsnGZN2vB7iJPaF_TKa8fU" \
  http://172.16.2.204:5678/api/v1/workflows
```

---

## Kiosk (hermes)

| Property | Value |
|----------|-------|
| User | kiosk |
| Autostart Config | `/home/kiosk/.config/openbox/autostart` |
| Dashboard URL | `http://172.16.2.200:3000/d/ultrawide-k3s/k3s-cluster-status` |
| Browser | Chromium (kiosk mode) |

### Autostart Script
```bash
# Disable screensaver + power saving
xset s off
xset -dpms
xset s noblank

# Launch Chromium fullscreen kiosk
chromium-browser --noerrdialogs --disable-infobars --kiosk \
  "http://172.16.2.200:3000/d/ultrawide-k3s/k3s-cluster-status?orgId=1&from=now-30m&to=now&timezone=browser&var-Node=$__all&var-Namespace=$__all&refresh=1m&kiosk"
```

---

## DNS / Hostnames

Access via hostname requires local DNS or /etc/hosts entries:

```
# k3s nodes
172.16.2.9     hammond
172.16.2.10    destiny
172.16.2.11    daedalus
172.16.2.12    korolev
172.16.2.13    prometheus
172.16.2.14    tria

# Other hosts
172.16.2.7     loki
172.16.2.8     hermes
# carter - check DHCP

# MetalLB services
172.16.2.200   grafana.local
172.16.2.201   traefik.local
172.16.2.202   prometheus.local
```

---

## SSH Access

**LXC containers use root, all others use cpierce**

```bash
# LXC containers (root user)
ssh root@hammond      # k3s control plane
ssh root@carter       # MySQL database

# Physical/VM hosts (cpierce user)
ssh cpierce@destiny   # DGX Spark
ssh cpierce@daedalus  # Raspberry Pi
ssh cpierce@korolev   # Raspberry Pi
ssh cpierce@prometheus # Raspberry Pi
ssh cpierce@tria      # Raspberry Pi
ssh cpierce@hermes    # Kiosk display
ssh cpierce@loki      # Storage server
```

---

## Quick Test Commands

```bash
# Test MetalLB services
curl -s http://172.16.2.200:3000 | head -1   # Grafana
curl -s http://172.16.2.201                   # Traefik (404 expected)
curl -s http://172.16.2.202:9090              # Prometheus

# Check k3s cluster
ssh root@hammond "kubectl get nodes -o wide"

# Check MetalLB
ssh root@hammond "kubectl get svc -A | grep LoadBalancer"
ssh root@hammond "kubectl get ipaddresspool -n metallb-system"

# Check node subnet
ssh root@hammond "ip addr show eth0 | grep inet"
```

---

## Troubleshooting

### MetalLB IPs not reachable
1. Check nodes have /23 subnet: `ip addr show | grep 172.16`
2. Restart MetalLB speakers: `kubectl rollout restart daemonset speaker -n metallb-system`
3. Check service events: `kubectl describe svc <name> -n <namespace>`
4. Force DHCP renew: `dhclient -r eth0 && dhclient eth0`

### Nodes not picking up new subnet
Nodes use DHCP. After DHCP server update:
```bash
# Option 1: Reboot (recommended)
sudo reboot

# Option 2: DHCP renew
sudo dhclient -r eth0 && sudo dhclient eth0
```

### Kiosk not displaying
1. Check kiosk session: `systemctl status display-manager`
2. Restart kiosk: `sudo pkill -u kiosk`
3. Check autostart: `cat /home/kiosk/.config/openbox/autostart`
4. Check errors: `cat /home/kiosk/.xsession-errors`

---

## Architecture Diagram

```
                    Internet
                        │
                        ▼
                 ┌──────────────┐
                 │   Gateway    │
                 │  172.16.3.1  │
                 └──────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
   ┌─────────┐    ┌──────────┐    ┌──────────┐
   │ hammond │    │  destiny │    │ Pi Nodes │
   │  (LXC)  │    │(DGX Spark)│   │ daedalus │
   │ control │    │  worker   │   │ korolev  │
   │  plane  │    │  + GPU    │   │prometheus│
   │.3.16/23 │    │  .3.133   │   │   tria   │
   └─────────┘    └──────────┘    └──────────┘
        │               │               │
        └───────────────┴───────────────┘
                        │
                   MetalLB L2
                        │
    ┌──────────┬──────────┬──────────┬──────────┬──────────┐
    │          │          │          │          │          │
    ▼          ▼          ▼          ▼          ▼          ▼
┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐
│Grafana ││Traefik ││Prometh.││ Siler  ││  n8n   ││ Redis  │
│.2.200  ││.2.201  ││.2.202  ││.2.203  ││.2.204  ││.2.205  │
│ :3000  ││:80/443 ││ :9090  ││:11434  ││ :5678  ││ :6379  │
└────────┘└────────┘└────────┘└────────┘└────────┘└────────┘
    │
    ▼
┌─────────┐
│ hermes  │
│ (kiosk) │
└─────────┘
```
