# TASK-504: 本番環境構築 - 要件定義

## 概要

こえポン！アプリケーションの本番環境を構築し、99.5%の可用性を確保できるスケーラブルで運用しやすいインフラストラクチャを実装する。

## NFR要件マッピング

### NFR-301: 運用・保守要件
- **可用性**: 99.5%以上 (月間ダウンタイム3.6時間以内)
- **復旧時間**: 障害発生から4時間以内
- **バックアップ**: 日次自動バックアップ、30日間保持
- **監視**: 24時間365日監視体制

### NFR-404: デプロイ・配信要件
- **CI/CD**: Git push から本番反映まで20分以内
- **ロールバック**: 緊急時3分以内でロールバック可能
- **ブルーグリーン**: ゼロダウンタイムデプロイ実現
- **CDN**: 静的コンテンツ配信最適化

## インフラストラクチャ設計

### 1. AWS アーキテクチャ

#### 基本構成
```yaml
# AWS インフラ全体構成
Region: ap-northeast-1 (東京)
Availability Zones: ap-northeast-1a, ap-northeast-1c, ap-northeast-1d

Network:
  VPC: koepon-vpc (10.0.0.0/16)
  Public Subnets: 
    - koepon-public-1a (10.0.1.0/24)
    - koepon-public-1c (10.0.2.0/24) 
  Private Subnets:
    - koepon-private-1a (10.0.11.0/24)
    - koepon-private-1c (10.0.12.0/24)
    - koepon-private-1d (10.0.13.0/24)

Internet Gateway: koepon-igw
NAT Gateways: 
  - koepon-nat-1a (in public subnet 1a)
  - koepon-nat-1c (in public subnet 1c)
```

#### コンピュートリソース
```yaml
# EKS Kubernetes クラスター
EKS Cluster: koepon-production
  Version: 1.28
  Endpoint: Private + Public
  Logging: API server, Audit, Authenticator

Node Groups:
  koepon-app-nodes:
    Instance Type: t3.medium (2vCPU, 4GB RAM)
    Min Size: 2
    Max Size: 10
    Desired: 3
    Subnets: Private subnets
    
  koepon-db-nodes:
    Instance Type: r5.large (2vCPU, 16GB RAM) 
    Min Size: 1
    Max Size: 3
    Desired: 2
    Subnets: Private subnets
```

#### データベース
```yaml
# Supabase PostgreSQL (Production)
Supabase Project: koepon-production
  Database: PostgreSQL 15
  Region: ap-northeast-1 (Tokyo)
  Plan: Pro Plan (Production)
  Connection Pooling: Enabled (Max 500 connections)
  Row Level Security: Enabled
  Point-in-Time Recovery: 30 days
  Real-time: Enabled for critical tables
  Custom Domain: db.koepon.com
  
# Upstash Redis (Production)
Upstash Redis:
  Instance: koepon-production-redis
  Region: ap-northeast-1 
  Plan: Pro Plan (99.99% uptime SLA)
  Memory: 2GB
  TLS: Enabled
  Failover: Multi-region backup
```

#### ストレージ・CDN
```yaml
# Amazon S3
S3 Buckets:
  koepon-assets-prod:
    Purpose: 静的アセット (images, audio files)
    Versioning: enabled
    Lifecycle: IA after 30 days, Glacier after 90 days
    
  koepon-backups-prod:
    Purpose: データベース・アプリケーションバックアップ
    Versioning: enabled
    Encryption: AES-256
    
# Amazon CloudFront CDN
CloudFront Distribution:
  Origins: 
    - S3 bucket (static assets)
    - ALB (dynamic content)
  Cache Behaviors:
    - /assets/* : Cache for 1 year
    - /api/* : No cache
    - /* : Cache for 1 hour
  SSL: Custom certificate (*.koepon.com)
  HTTP/2: enabled
  Compression: enabled
```

### 2. Kubernetes デプロイメント構成

#### アプリケーションデプロイメント
```yaml
# koepon-app deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: koepon-app
  namespace: production
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    spec:
      containers:
      - name: koepon-app
        image: koepon/app:latest
        resources:
          requests:
            memory: "256Mi"
            cpu: "200m"
          limits:
            memory: "512Mi" 
            cpu: "500m"
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: koepon-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: koepon-secrets
              key: redis-url
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /api/health/ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
```

#### サービス・Ingress構成
```yaml
# Load Balancer Service
apiVersion: v1
kind: Service
metadata:
  name: koepon-app-service
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: "nlb"
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 3000
    protocol: TCP
  - port: 443
    targetPort: 3000
    protocol: TCP
  selector:
    app: koepon-app

# Ingress for HTTPS termination
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: koepon-ingress
  annotations:
    kubernetes.io/ingress.class: "alb"
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/ssl-policy: "ELBSecurityPolicy-TLS-1-2-2017-01"
    alb.ingress.kubernetes.io/certificate-arn: "arn:aws:acm:ap-northeast-1:ACCOUNT:certificate/CERT-ID"
spec:
  rules:
  - host: koepon.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: koepon-app-service
            port:
              number: 80
```

### 3. CI/CD パイプライン設計

#### GitHub Actions ワークフロー
```yaml
# .github/workflows/production-deploy.yml
name: Production Deployment

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: |
          cd client && npm ci
          cd ../security-tests && npm ci
          cd ../performance-tests && npm ci
          
      - name: Run unit tests
        run: cd client && npm run test
        
      - name: Run security tests
        run: cd security-tests && npm run test:security
        
      - name: Run performance tests
        run: cd performance-tests && npm run test:load
        
  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-northeast-1
          
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2
        
      - name: Build and push Docker image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: koepon/app
          IMAGE_TAG: ${{ github.sha }}
        run: |
          cd client
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:latest .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest
          
  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-northeast-1
          
      - name: Deploy to EKS
        run: |
          aws eks update-kubeconfig --region ap-northeast-1 --name koepon-production
          
          # Update deployment with new image
          kubectl set image deployment/koepon-app koepon-app=$ECR_REGISTRY/$ECR_REPOSITORY:${{ github.sha }} -n production
          
          # Wait for rollout to complete
          kubectl rollout status deployment/koepon-app -n production --timeout=600s
          
          # Run smoke tests
          kubectl get pods -n production
          curl -f https://koepon.com/api/health || exit 1
```

### 4. 監視・ログ基盤

#### Amazon CloudWatch 設定
```yaml
# CloudWatch Alarms
Alarms:
  - Name: koepon-high-cpu
    MetricName: CPUUtilization
    Threshold: 80
    ComparisonOperator: GreaterThanThreshold
    Actions: [SNS notification, Auto Scaling trigger]
    
  - Name: koepon-high-memory
    MetricName: MemoryUtilization  
    Threshold: 85
    ComparisonOperator: GreaterThanThreshold
    Actions: [SNS notification]
    
  - Name: koepon-app-errors
    MetricName: 5XXError
    Threshold: 10
    ComparisonOperator: GreaterThanThreshold
    Actions: [SNS notification, PagerDuty alert]
    
  - Name: koepon-response-time
    MetricName: TargetResponseTime
    Threshold: 3000
    ComparisonOperator: GreaterThanThreshold
    Actions: [SNS notification]

# Log Groups
Log Groups:
  - /aws/eks/koepon-production/cluster
  - /aws/rds/instance/koepon-db/postgresql
  - /koepon/application
  - /koepon/security
  
# Custom Metrics
Custom Metrics:
  - koepon.gacha.draws_per_minute
  - koepon.medals.purchases_per_minute
  - koepon.users.active_sessions
  - koepon.api.response_time_p95
```

#### Prometheus + Grafana 統合
```yaml
# Prometheus configuration
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
      evaluation_interval: 15s
    
    scrape_configs:
    - job_name: 'koepon-app'
      kubernetes_sd_configs:
      - role: pod
      relabel_configs:
      - source_labels: [__meta_kubernetes_pod_label_app]
        regex: koepon-app
        action: keep
    
    - job_name: 'koepon-postgres'
      static_configs:
      - targets: ['postgres-exporter:9187']
    
    - job_name: 'koepon-redis'
      static_configs:
      - targets: ['redis-exporter:9121']

# Grafana Dashboards
Dashboards:
  - koepon-application-metrics
  - koepon-infrastructure-metrics
  - koepon-business-metrics
  - koepon-security-metrics
```

### 5. バックアップ・災害復旧

#### バックアップ戦略
```yaml
# Database Backups
RDS Automated Backups:
  Retention: 30 days
  Backup Window: 03:00-04:00 JST
  Multi-AZ: true
  
Manual Snapshots:
  Before: Major deployments
  After: Critical data updates
  Retention: 90 days

# Application Data Backups
S3 Backup:
  Files: Static assets, user uploads
  Frequency: Daily
  Cross-region replication: ap-southeast-1
  
# Configuration Backups
Config Backups:
  Kubernetes manifests: Daily to S3
  Helm charts: Version controlled in Git
  Infrastructure as Code: Terraform state in S3
```

#### 災害復旧計画
```yaml
# Recovery Time Objectives (RTO)
RTO Targets:
  Critical (Auth, Gacha): 15 minutes
  Important (Medals, Exchange): 1 hour
  Normal (Analytics, Logs): 4 hours

# Recovery Point Objectives (RPO)  
RPO Targets:
  Transaction data: 5 minutes (via Multi-AZ)
  User data: 15 minutes (via frequent backups)
  Static content: 1 hour

# Disaster Recovery Procedures
DR Procedures:
  1. Automated failover for Multi-AZ RDS
  2. EKS cluster recreation from Infrastructure as Code
  3. Application deployment from container registry
  4. Data restoration from latest backup
  5. DNS switchover to backup region
```

## セキュリティ要件

### ネットワークセキュリティ
```yaml
# Security Groups
Security Groups:
  koepon-alb-sg:
    Ingress: 
      - Port 80/443 from 0.0.0.0/0
    Egress:
      - All traffic to koepon-app-sg
      
  koepon-app-sg:
    Ingress:
      - Port 3000 from koepon-alb-sg
      - Port 22 from koepon-bastion-sg
    Egress:
      - Port 5432 to koepon-db-sg
      - Port 6379 to koepon-redis-sg
      - HTTPS to internet
      
  koepon-db-sg:
    Ingress:
      - Port 5432 from koepon-app-sg
    Egress: None
    
# Network ACLs
Network ACLs:
  - Deny all by default
  - Allow specific application traffic only
  - Log all denied connections
```

### IAM・アクセス制御
```yaml
# EKS Service Account
Service Accounts:
  koepon-app-sa:
    Annotations:
      eks.amazonaws.com/role-arn: arn:aws:iam::ACCOUNT:role/koepon-app-role
    Permissions:
      - S3 read/write for assets bucket
      - CloudWatch logs write
      - Parameter Store read

# IAM Roles
IAM Roles:
  koepon-eks-cluster-role:
    Policies: [AmazonEKSClusterPolicy]
    
  koepon-eks-node-role:
    Policies: 
      - AmazonEKSWorkerNodePolicy
      - AmazonEKS_CNI_Policy
      - AmazonEC2ContainerRegistryReadOnly
      
  koepon-app-role:
    Policies: [custom koepon-app-policy]
```

## 運用要件

### オートスケーリング
```yaml
# Horizontal Pod Autoscaler
HPA Configuration:
  Min Replicas: 3
  Max Replicas: 10
  Target CPU: 70%
  Target Memory: 80%
  Scale Up: +2 pods when threshold exceeded for 2 minutes
  Scale Down: -1 pod when below threshold for 5 minutes

# Cluster Autoscaler
Cluster Autoscaler:
  Min Nodes: 2
  Max Nodes: 10
  Scale Up: When pods pending for 30 seconds
  Scale Down: When node utilization < 50% for 10 minutes
```

### コスト最適化
```yaml
# Reserved Instances
Reserved Instances:
  RDS: 1-year term, No Upfront
  EKS Nodes: 1-year term, Partial Upfront
  
# Spot Instances
Spot Instance Configuration:
  Non-critical workloads: 50% spot instances
  Development environments: 80% spot instances
  
# Cost Monitoring
Cost Alerts:
  Monthly budget: $2000
  Alert thresholds: 50%, 80%, 100%
  Cost anomaly detection: enabled
```

## 受け入れ基準

### 機能要件
- ✅ アプリケーションが正常にデプロイされる
- ✅ すべてのAPIエンドポイントが正常に動作する
- ✅ データベース接続が確立されている
- ✅ 静的アセットがCDNから配信される
- ✅ SSL証明書が設定されている

### 非機能要件
- ✅ 99.5%の可用性を達成する
- ✅ レスポンス時間がNFR要件以内
- ✅ 1000同時ユーザーに対応可能
- ✅ 4時間以内の障害復旧が可能
- ✅ 20分以内のデプロイメント完了

### セキュリティ要件
- ✅ すべての通信がHTTPS化されている
- ✅ データベースが暗号化されている
- ✅ 適切なIAM権限が設定されている
- ✅ ログが適切に記録されている
- ✅ 脆弱性スキャンに合格している

### 運用要件
- ✅ 監視・アラート体制が整備されている
- ✅ バックアップが正常に実行されている
- ✅ CI/CDパイプラインが動作している
- ✅ ドキュメントが整備されている
- ✅ 運用手順書が作成されている

## 実装スケジュール

### Phase 1: インフラ基盤構築 (1日目)
- AWS VPC・ネットワーク設定
- EKS クラスター構築
- RDS・ElastiCache セットアップ
- S3・CloudFront 設定

### Phase 2: アプリケーション環境構築 (2日目)  
- Docker イメージビルド・ECR プッシュ
- Kubernetes マニフェスト作成
- シークレット・設定管理
- SSL証明書設定

### Phase 3: CI/CD・監視構築 (3日目)
- GitHub Actions ワークフロー設定
- CloudWatch・Prometheus 監視設定
- Grafana ダッシュボード作成
- バックアップ・DR 設定
- 総合テスト・運用開始

## 次のステップ
Phase 1 のインフラ基盤構築から開始し、段階的に本番環境を構築していきます。