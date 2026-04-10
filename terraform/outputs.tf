# Outputs - Updated for Git source modules

# Network
output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnets
}

output "private_web_subnet_ids" {
  description = "Private web subnet IDs"
  value       = module.vpc.private_subnets[0]
}

output "private_app_subnet_ids" {
  description = "Private app subnet IDs"
  value       = module.vpc.private_subnets[1]
}

output "database_subnet_ids" {
  description = "Database subnet IDs"
  value       = module.vpc.database_subnets
}

# Load Balancer
output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = module.alb.dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the Application Load Balancer"
  value       = module.alb.zone_id
}

output "alb_frontend_target_group_arn" {
  description = "Frontend target group ARN"
  value       = module.alb.target_groups["frontend"].arn
}

output "alb_backend_target_group_arn" {
  description = "Backend target group ARN"
  value       = module.alb.target_groups["backend"].arn
}

# CloudFront
output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = module.cloudfront.cloudfront_distribution_domain_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = module.cloudfront.cloudfront_distribution_id
}

output "cloudfront_hosted_zone_id" {
  description = "CloudFront hosted zone ID"
  value       = module.cloudfront.cloudfront_distribution_hosted_zone_id
}

# Database
output "rds_endpoint" {
  description = "RDS database endpoint"
  value       = module.rds.db_instance_endpoint
  sensitive   = true
}

output "rds_instance_id" {
  description = "RDS instance ID"
  value       = module.rds.db_instance_identifier
}

output "rds_address" {
  description = "RDS database address"
  value       = module.rds.db_instance_address
  sensitive   = true
}

# Redis
output "redis_endpoint" {
  description = "Redis cluster endpoint"
  value       = module.elasticache.cluster_cache_nodes[0].address
  sensitive   = true
}

output "redis_port" {
  description = "Redis port"
  value       = 6379
}

# ECR
output "ecr_backend_url" {
  description = "ECR repository URL for backend"
  value       = module.ecr_backend.repository_url
}

output "ecr_frontend_url" {
  description = "ECR repository URL for frontend"
  value       = module.ecr_frontend.repository_url
}

# ECS
output "ecs_backend_cluster_name" {
  description = "ECS backend cluster name"
  value       = module.ecs_backend_cluster.name
}

output "ecs_backend_cluster_id" {
  description = "ECS backend cluster ID"
  value       = module.ecs_backend_cluster.id
}

output "ecs_backend_service_name" {
  description = "ECS backend service name"
  value       = aws_ecs_service.backend.name
}

output "ecs_frontend_cluster_name" {
  description = "ECS frontend cluster name"
  value       = module.ecs_frontend_cluster.name
}

output "ecs_frontend_cluster_id" {
  description = "ECS frontend cluster ID"
  value       = module.ecs_frontend_cluster.id
}

output "ecs_frontend_service_name" {
  description = "ECS frontend service name"
  value       = aws_ecs_service.frontend.name
}

# S3
output "s3_bucket_name" {
  description = "S3 bucket name for profile images"
  value       = module.s3_bucket.s3_bucket_id
}

output "s3_bucket_arn" {
  description = "S3 bucket ARN"
  value       = module.s3_bucket.s3_bucket_arn
}

output "s3_bucket_domain_name" {
  description = "S3 bucket domain name"
  value       = module.s3_bucket.s3_bucket_bucket_regional_domain_name
}

# SNS
output "sns_notification_topic_arn" {
  description = "SNS notification topic ARN"
  value       = module.sns.topic_arn
}

output "sns_alarm_topic_arn" {
  description = "SNS alarm topic ARN"
  value       = module.sns_alarms.topic_arn
}

# SQS
output "sqs_main_queue_url" {
  description = "Main SQS queue URL"
  value       = module.sqs_main.queue_url
}

output "sqs_main_queue_arn" {
  description = "Main SQS queue ARN"
  value       = module.sqs_main.queue_arn
}

output "sqs_notifications_queue_url" {
  description = "Notifications SQS queue URL"
  value       = module.sqs_notifications.queue_url
}

output "sqs_email_queue_url" {
  description = "Email SQS queue URL"
  value       = module.sqs_email.queue_url
}

# Route 53
output "route53_zone_id" {
  description = "Route 53 hosted zone ID"
  value       = aws_route53_zone.main.zone_id
}

output "route53_name_servers" {
  description = "Route 53 name servers"
  value       = aws_route53_zone.main.name_servers
}

# ACM
output "acm_certificate_arn" {
  description = "ACM certificate ARN (CloudFront - us-east-1)"
  value       = module.acm.acm_certificate_arn
}

output "acm_regional_certificate_arn" {
  description = "ACM certificate ARN (ALB - regional)"
  value       = module.acm_regional.acm_certificate_arn
}

# WAF
output "waf_cloudfront_web_acl_id" {
  description = "WAF Web ACL ID for CloudFront"
  value       = aws_wafv2_web_acl.cloudfront.id
}

output "waf_cloudfront_web_acl_arn" {
  description = "WAF Web ACL ARN for CloudFront"
  value       = aws_wafv2_web_acl.cloudfront.arn
}

output "waf_regional_web_acl_id" {
  description = "WAF Web ACL ID for Regional (ALB)"
  value       = aws_wafv2_web_acl.regional.id
}

output "waf_regional_web_acl_arn" {
  description = "WAF Web ACL ARN for Regional (ALB)"
  value       = aws_wafv2_web_acl.regional.arn
}

# IAM
output "ecs_task_execution_role_arn" {
  description = "ECS task execution role ARN"
  value       = aws_iam_role.ecs_task_execution.arn
}

output "ecs_task_role_arn" {
  description = "ECS task role ARN"
  value       = aws_iam_role.ecs_task.arn
}

output "cicd_user_name" {
  description = "CI/CD IAM user name"
  value       = aws_iam_user.cicd.name
}

output "cicd_user_arn" {
  description = "CI/CD IAM user ARN"
  value       = aws_iam_user.cicd.arn
}

output "cicd_user_access_key_id" {
  description = "CI/CD user access key ID"
  value       = aws_iam_access_key.cicd.id
  sensitive   = true
}

output "cicd_user_secret_access_key" {
  description = "CI/CD user secret access key"
  value       = aws_iam_access_key.cicd.secret
  sensitive   = true
}
