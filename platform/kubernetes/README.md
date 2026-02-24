# Jade Data Aggregator — Kubernetes Deployment Guide

This directory contains **two deployment paths**:

| Path | Description |
|------|-------------|
| `production/` | Raw Kubernetes manifests — apply directly with `kubectl` |
| `../helm/data-aggregator/` | Helm chart — recommended for environment-specific configuration |

---

## Prerequisites

- `kubectl` ≥ 1.27 configured with cluster access
- `helm` ≥ 3.12 (Helm path only)
- Namespace `dataaggregator` created (or use `namespace.yaml`)
- NGINX Ingress Controller deployed
- cert-manager deployed with a `letsencrypt-prod` ClusterIssuer
- A `dataaggregator-secrets` K8s Secret created (see Secrets section below)
- A `ghcr-pull-secret` image pull secret for GHCR

---

## Secrets Setup

Before deploying, create the secrets K8s object. **Never commit secret values to git.**

```bash
kubectl create secret generic dataaggregator-secrets \
  --namespace dataaggregator \
  --from-literal=POSTGRES_PASSWORD='<db-password>' \
  --from-literal=SECRET_KEY='<jwt-secret-key>' \
  --from-literal=SENTRY_DSN='<backend-sentry-dsn>' \
  --from-literal=NEXT_PUBLIC_SENTRY_DSN='<frontend-sentry-dsn>'
```

Create the GHCR image pull secret:

```bash
kubectl create secret docker-registry ghcr-pull-secret \
  --namespace dataaggregator \
  --docker-server=ghcr.io \
  --docker-username=<github-username> \
  --docker-password=<github-pat>
```

---

## Option A: Raw kubectl (production/)

### Initial deploy

```bash
# 1. Create namespace
kubectl apply -f platform/kubernetes/production/namespace.yaml

# 2. Apply configuration
kubectl apply -f platform/kubernetes/production/configmap.yaml

# 3. Deploy workloads
kubectl apply -f platform/kubernetes/production/deployment-backend.yaml
kubectl apply -f platform/kubernetes/production/deployment-frontend.yaml

# 4. Expose services
kubectl apply -f platform/kubernetes/production/services.yaml

# 5. Configure ingress, autoscaling, and disruption budgets
kubectl apply -f platform/kubernetes/production/ingress.yaml
kubectl apply -f platform/kubernetes/production/hpa.yaml
kubectl apply -f platform/kubernetes/production/pdb.yaml
```

Or apply everything at once:

```bash
kubectl apply -f platform/kubernetes/production/
```

### Update image tag

```bash
kubectl set image deployment/dataaggregator-backend \
  backend=ghcr.io/jade-biz-1/jade-data-aggregator/backend:<new-tag> \
  -n dataaggregator

kubectl set image deployment/dataaggregator-frontend \
  frontend=ghcr.io/jade-biz-1/jade-data-aggregator/frontend:<new-tag> \
  -n dataaggregator
```

### Rollback

```bash
# View rollout history
kubectl rollout history deployment/dataaggregator-backend -n dataaggregator
kubectl rollout history deployment/dataaggregator-frontend -n dataaggregator

# Roll back to previous revision
kubectl rollout undo deployment/dataaggregator-backend -n dataaggregator
kubectl rollout undo deployment/dataaggregator-frontend -n dataaggregator

# Roll back to a specific revision
kubectl rollout undo deployment/dataaggregator-backend \
  --to-revision=<revision-number> -n dataaggregator
```

### Check rollout status

```bash
kubectl rollout status deployment/dataaggregator-backend -n dataaggregator
kubectl rollout status deployment/dataaggregator-frontend -n dataaggregator
```

---

## Option B: Helm Chart (helm/data-aggregator/)

### Initial install

```bash
helm install dataaggregator platform/helm/data-aggregator \
  --namespace dataaggregator \
  --create-namespace \
  -f platform/helm/data-aggregator/values.production.yaml \
  --set backend.image.tag=<git-sha> \
  --set frontend.image.tag=<git-sha>
```

### Upgrade

```bash
helm upgrade dataaggregator platform/helm/data-aggregator \
  --namespace dataaggregator \
  -f platform/helm/data-aggregator/values.production.yaml \
  --set backend.image.tag=<new-git-sha> \
  --set frontend.image.tag=<new-git-sha>
```

### Rollback

```bash
# List Helm release history
helm history dataaggregator -n dataaggregator

# Roll back to the previous release
helm rollback dataaggregator -n dataaggregator

# Roll back to a specific release revision
helm rollback dataaggregator <revision-number> -n dataaggregator
```

### Dry-run / diff

```bash
# Preview what would change before applying
helm upgrade dataaggregator platform/helm/data-aggregator \
  --namespace dataaggregator \
  -f platform/helm/data-aggregator/values.production.yaml \
  --set backend.image.tag=<new-tag> \
  --dry-run

# With helm-diff plugin
helm diff upgrade dataaggregator platform/helm/data-aggregator \
  -f platform/helm/data-aggregator/values.production.yaml \
  --set backend.image.tag=<new-tag>
```

### Uninstall

```bash
helm uninstall dataaggregator -n dataaggregator
```

---

## Monitoring Rollouts

```bash
# Watch pod status
kubectl get pods -n dataaggregator -w

# Tail backend logs
kubectl logs -l app=dataaggregator-backend -n dataaggregator -f --tail=100

# Tail frontend logs
kubectl logs -l app=dataaggregator-frontend -n dataaggregator -f --tail=100

# Describe a pod for events
kubectl describe pod -l app=dataaggregator-backend -n dataaggregator
```

---

## Health Checks

```bash
# Port-forward and hit health endpoints
kubectl port-forward svc/dataaggregator-backend 8001:8001 -n dataaggregator

curl http://localhost:8001/api/v1/health/live
curl http://localhost:8001/api/v1/health/ready
```

---

## Helm Values Reference

| Key | Default | Description |
|-----|---------|-------------|
| `backend.replicaCount` | `2` | Backend pod replicas |
| `backend.image.tag` | `latest` | Backend image tag |
| `backend.resources.requests.cpu` | `250m` | Backend CPU request |
| `backend.resources.limits.memory` | `1Gi` | Backend memory limit |
| `frontend.replicaCount` | `2` | Frontend pod replicas |
| `frontend.image.tag` | `latest` | Frontend image tag |
| `autoscaling.enabled` | `false` | Enable HPA (`true` in production) |
| `autoscaling.backend.maxReplicas` | `8` | Backend max replicas |
| `autoscaling.frontend.maxReplicas` | `6` | Frontend max replicas |
| `podDisruptionBudget.enabled` | `true` | Enable PDBs |
| `ingress.enabled` | `true` | Enable ingress |
