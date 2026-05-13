#!/bin/bash
# AWS Infrastructure Setup Script for ECS Deployment
# Usage: chmod +x setup-infrastructure.sh && ./setup-infrastructure.sh

set -e  # Exit on error

# Configuration - Thay đổi các giá trị này nếu cần
REGION="ap-southeast-1"
PROJECT_NAME="person-api-v3"
ENVIRONMENT="prod"

echo "🚀 Setting up AWS infrastructure for $PROJECT_NAME..."

# 1. Create ECR Repository
echo "📦 Creating ECR repository..."
aws ecr create-repository \
  --repository-name "$PROJECT_NAME" \
  --region "$REGION" \
  --image-scanning-configuration scanOnPush=true \
  --encryption-configuration encryptionType=KMS \
  --query 'repository.repositoryUri' \
  --output text

REPOSITORY_URI=$(aws ecr describe-repositories \
  --repository-names "$PROJECT_NAME" \
  --region "$REGION" \
  --query 'repositories[0].repositoryUri' \
  --output text)

echo "✅ ECR Repository: $REPOSITORY_URI"

# 2. Get Default VPC
echo "🌐 Getting VPC information..."
VPC_ID=$(aws ec2 describe-vpcs \
  --filters Name=isDefault,Values=true \
  --region "$REGION" \
  --query 'Vpcs[0].VpcId' \
  --output text)

echo "✅ Using VPC: $VPC_ID"

# 3. Get Subnets (2 AZs for high availability)
echo "🔍 Finding subnets..."
  SUBNET_IDS=($(aws ec2 describe-subnets \
    --filters Name=vpc-id,Values=$VPC_ID \
    --region "$REGION" \
    --query 'Subnets[?AvailabilityZone==`ap-southeast-1a` || AvailabilityZone==`ap-southeast-1b`].SubnetId' \
    --output text))

  if [ ${#SUBNET_IDS[@]} -eq 0 ]; then
    SUBNET_IDS=($(aws ec2 describe-subnets \
      --filters Name=vpc-id,Values=$VPC_ID \
      --region "$REGION" \
      --query 'Subnets[0:2].SubnetId' \
      --output text))
  fi

SUBNETS="${SUBNET_IDS[@]}"  # Convert array to space-separated string
echo "✅ Found subnets: ${SUBNET_IDS[@]}"

# 4. Create Security Group for ECS Tasks
echo "🛡️  Creating security group for ECS tasks..."
SG_ECS_ID=$(aws ec2 create-security-group \
  --group-name "$PROJECT_NAME-ecs-sg" \
  --description "Security group for ECS tasks" \
  --vpc-id "$VPC_ID" \
  --region "$REGION" \
  --query 'GroupId' \
  --output text)

# Allow outbound to RDS (port 5432)
aws ec2 authorize-security-group-egress \
  --group-id "$SG_ECS_ID" \
  --protocol tcp \
  --port 5432 \
  --cidr 0.0.0.0/0 \
  --region "$REGION" \
  --query 'Return' \
  --output text || true

# Allow outbound to internet (for pulling images, external APIs)
aws ec2 authorize-security-group-egress \
  --group-id "$SG_ECS_ID" \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0 \
  --region "$REGION" \
  --query 'Return' \
  --output text || true

echo "✅ ECS Security Group: $SG_ECS_ID"

# 5. Create Security Group for ALB
echo "🛡️  Creating security group for ALB..."
SG_ALB_ID=$(aws ec2 create-security-group \
  --group-name "$PROJECT_NAME-alb-sg" \
  --description "Security group for ALB" \
  --vpc-id "$VPC_ID" \
  --region "$REGION" \
  --query 'GroupId' \
  --output text)

# Allow inbound HTTP (80) and HTTPS (443) from internet
aws ec2 authorize-security-group-ingress \
  --group-id "$SG_ALB_ID" \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0 \
  --region "$REGION" || true

aws ec2 authorize-security-group-ingress \
  --group-id "$SG_ALB_ID" \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0 \
  --region "$REGION" || true

# Allow ALB to talk to ECS tasks on port 3000
aws ec2 authorize-security-group-egress \
  --group-id "$SG_ALB_ID" \
  --protocol tcp \
  --port 3000 \
  --cidr 0.0.0.0/0 \
  --region "$REGION" \
  --query 'Return' \
  --output text || true

# Allow ECS tasks to receive traffic from ALB
aws ec2 authorize-security-group-ingress \
  --group-id "$SG_ECS_ID" \
  --protocol tcp \
  --port 3000 \
  --source-group "$SG_ALB_ID" \
  --region "$REGION" || true

echo "✅ ALB Security Group: $SG_ALB_ID"

# 6. Create IAM Role for ECS Tasks
echo "🔐 Creating IAM role for ECS tasks..."
ROLE_NAME="$PROJECT_NAME-ecs-task-role"

# Delete existing role if it exists (to avoid conflicts)
aws iam delete-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-name "$PROJECT_NAME-ecs-task-policy" 2>/dev/null || true
aws iam detach-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-arn "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy" 2>/dev/null || true
aws iam delete-role \
  --role-name "$ROLE_NAME" 2>/dev/null || true

# Wait a moment for deletion
sleep 3

# Create trust policy
cat > trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

aws iam create-role \
  --role-name "$ROLE_NAME" \
  --assume-role-policy-document file://trust-policy.json \
  --region "$REGION" \
  --query 'Role.Arn' \
  --output text

# Attach AWS managed policy
aws iam attach-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-arn "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy" \
  --region "$REGION"

# Create custom policy for CloudWatch logs
cat > ecs-task-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:CreateLogGroup"
      ],
      "Resource": "*"
    }
  ]
}
EOF

aws iam put-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-name "$PROJECT_NAME-ecs-task-policy" \
  --policy-document file://ecs-task-policy.json \
  --region "$REGION"

TASK_ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text)
echo "✅ ECS Task Role: $TASK_ROLE_ARN"

# 7. Create ECS Cluster
echo "📦 Creating ECS cluster..."
aws ecs create-cluster \
  --cluster-name "$PROJECT_NAME-cluster" \
  --region "$REGION" \
  --query 'cluster.clusterName' \
  --output text

echo "✅ ECS Cluster created"

# 8. Create Target Group for ALB
echo "🎯 Creating target group..."
TG_ARN=$(aws elbv2 create-target-group \
  --name "$PROJECT_NAME-tg" \
  --protocol HTTP \
  --port 3000 \
  --vpc-id "$VPC_ID" \
  --health-check-path "/health" \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3 \
  --matcher HttpCode=200-299 \
  --region "$REGION" \
  --query 'TargetGroups[0].TargetGroupArn' \
  --output text)

echo "✅ Target Group: $TG_ARN"

# 9. Create Application Load Balancer
echo "⚖️  Creating Application Load Balancer..."
ALB_ARN=$(aws elbv2 create-load-balancer \
  --name "$PROJECT_NAME-alb" \
  --subnets "$SUBNETS" \
  --security-groups "$SG_ALB_ID" \
  --scheme internet-facing \
  --type application \
  --region "$REGION" \
  --query 'LoadBalancers[0].LoadBalancerArn' \
  --output text)

# Wait for ALB to be active
echo "⏳ Waiting for ALB to be active (this may take 2-3 minutes)..."
aws elbv2 wait load-balancers-available \
  --load-balancer-arns "$ALB_ARN" \
  --region "$REGION"

# Create listener on port 80 (HTTP)
aws elbv2 create-listener \
  --load-balancer-arn "$ALB_ARN" \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn="$TG_ARN" \
  --region "$REGION"

echo "✅ ALB created and listener configured"

# Get ALB DNS name
ALB_DNS=$(aws elbv2 describe-load-balancers \
  --load-balancer-arns "$ALB_ARN" \
  --region "$REGION" \
  --query 'LoadBalancers[0].DNSName' \
  --output text)

echo "🌍 ALB DNS: http://$ALB_DNS"

# 10. Create Log Group for CloudWatch
echo "📝 Creating CloudWatch log group..."
aws logs create-log-group \
  --log-group-name "/ecs/$PROJECT_NAME" \
  --region "$REGION" 2>/dev/null || echo "Log group already exists"

echo "✅ Log group created"

# Save configuration for later use
cat > infrastructure-outputs.json << EOF
{
  "region": "$REGION",
  "repository_uri": "$REPOSITORY_URI",
  "vpc_id": "$VPC_ID",
  "subnets": "$SUBNETS",
  "ecs_security_group_id": "$SG_ECS_ID",
  "alb_security_group_id": "$SG_ALB_ID",
  "ecs_cluster": "$PROJECT_NAME-cluster",
  "target_group_arn": "$TG_ARN",
  "alb_arn": "$ALB_ARN",
  "alb_dns": "$ALB_DNS",
  "task_role_arn": "$TASK_ROLE_ARN"
}
EOF

# Save outputs to .env file template
cat > .env.aws << EOF
# AWS Infrastructure Configuration
AWS_REGION=$REGION
ECR_REPOSITORY_URI=$REPOSITORY_URI
ECS_CLUSTER=$PROJECT_NAME-cluster
TASK_ROLE_ARN=$TASK_ROLE_ARN
TARGET_GROUP_ARN=$TG_ARN
ALB_DNS=$ALB_DNS
VPC_ID=$VPC_ID
SUBNETS=$SUBNETS
ECS_SECURITY_GROUP=$SG_ECS_ID
EOF

echo ""
echo "✨ Infrastructure setup complete!"
echo "📄 Configuration saved to: infrastructure-outputs.json"
echo "📄 Environment template saved to: .env.aws"
echo ""
echo "🎯 Next steps:"
echo "  1. docker build -t $PROJECT_NAME ."
echo "  2. ./deploy.sh (sẽ tạo file này tiếp theo)"
echo ""
echo "🌐 Your Application Load Balancer DNS: http://$ALB_DNS"
echo "   (Will serve your app once deployed to ECS)"
