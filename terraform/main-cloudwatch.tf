# CloudWatch Monitoring using native AWS resources

# CloudWatch Alarms

# ALB - Unhealthy Targets
resource "aws_cloudwatch_metric_alarm" "alb_unhealthy_targets" {
  alarm_name          = "medease-alb-unhealthy-targets-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Average"
  threshold           = 0
  alarm_description   = "ALB has unhealthy targets"
  alarm_actions       = [module.sns_alarms.topic_arn]

  dimensions = {
    LoadBalancer = module.alb.arn_suffix
  }

  tags = {
    Name        = "alb-unhealthy-targets"
    Environment = var.environment
  }
}

# ALB - 5xx Errors
resource "aws_cloudwatch_metric_alarm" "alb_5xx_errors" {
  alarm_name          = "medease-alb-5xx-errors-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "ALB is receiving too many 5xx errors"
  alarm_actions       = [module.sns_alarms.topic_arn]

  dimensions = {
    LoadBalancer = module.alb.arn_suffix
  }

  tags = {
    Name        = "alb-5xx-errors"
    Environment = var.environment
  }
}

# RDS - High CPU
resource "aws_cloudwatch_metric_alarm" "rds_high_cpu" {
  alarm_name          = "medease-rds-high-cpu-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "RDS CPU utilization is too high"
  alarm_actions       = [module.sns_alarms.topic_arn]

  dimensions = {
    DBInstanceIdentifier = module.rds.db_instance_identifier
  }

  tags = {
    Name        = "rds-high-cpu"
    Environment = var.environment
  }
}

# RDS - Low Storage
resource "aws_cloudwatch_metric_alarm" "rds_low_storage" {
  alarm_name          = "medease-rds-low-storage-${var.environment}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 10737418240 # 10 GB in bytes
  alarm_description   = "RDS free storage space is low"
  alarm_actions       = [module.sns_alarms.topic_arn]

  dimensions = {
    DBInstanceIdentifier = module.rds.db_instance_identifier
  }

  tags = {
    Name        = "rds-low-storage"
    Environment = var.environment
  }
}

# ECS Backend - High CPU
resource "aws_cloudwatch_metric_alarm" "ecs_backend_high_cpu" {
  alarm_name          = "medease-backend-high-cpu-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "ECS Backend CPU utilization is too high"
  alarm_actions       = [module.sns_alarms.topic_arn]

  dimensions = {
    ClusterName = module.ecs_backend_cluster.name
    ServiceName = aws_ecs_service.backend.name
  }

  tags = {
    Name        = "ecs-backend-high-cpu"
    Environment = var.environment
  }
}

# ECS Backend - High Memory
resource "aws_cloudwatch_metric_alarm" "ecs_backend_high_memory" {
  alarm_name          = "medease-backend-high-memory-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "ECS Backend memory utilization is too high"
  alarm_actions       = [module.sns_alarms.topic_arn]

  dimensions = {
    ClusterName = module.ecs_backend_cluster.name
    ServiceName = aws_ecs_service.backend.name
  }

  tags = {
    Name        = "ecs-backend-high-memory"
    Environment = var.environment
  }
}

# ECS Frontend - High CPU
resource "aws_cloudwatch_metric_alarm" "ecs_frontend_high_cpu" {
  alarm_name          = "medease-frontend-high-cpu-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "ECS Frontend CPU utilization is too high"
  alarm_actions       = [module.sns_alarms.topic_arn]

  dimensions = {
    ClusterName = module.ecs_frontend_cluster.name
    ServiceName = aws_ecs_service.frontend.name
  }

  tags = {
    Name        = "ecs-frontend-high-cpu"
    Environment = var.environment
  }
}

# ECS Frontend - High Memory
resource "aws_cloudwatch_metric_alarm" "ecs_frontend_high_memory" {
  alarm_name          = "medease-frontend-high-memory-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "ECS Frontend memory utilization is too high"
  alarm_actions       = [module.sns_alarms.topic_arn]

  dimensions = {
    ClusterName = module.ecs_frontend_cluster.name
    ServiceName = aws_ecs_service.frontend.name
  }

  tags = {
    Name        = "ecs-frontend-high-memory"
    Environment = var.environment
  }
}

# ElastiCache - High CPU
resource "aws_cloudwatch_metric_alarm" "redis_high_cpu" {
  alarm_name          = "medease-redis-high-cpu-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ElastiCache"
  period              = 300
  statistic           = "Average"
  threshold           = 75
  alarm_description   = "Redis CPU utilization is too high"
  alarm_actions       = [module.sns_alarms.topic_arn]

  dimensions = {
    CacheClusterId = "medease-redis-${var.environment}"
  }

  tags = {
    Name        = "redis-high-cpu"
    Environment = var.environment
  }
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "medease-${var.environment}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", { stat = "Average", label = "ALB Response Time" }],
            [".", "RequestCount", { stat = "Sum", label = "Request Count" }],
            [".", "HTTPCode_Target_5XX_Count", { stat = "Sum", label = "5XX Errors" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Application Load Balancer"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", { DBInstanceIdentifier = module.rds.db_instance_identifier, stat = "Average" }],
            [".", "DatabaseConnections", { DBInstanceIdentifier = module.rds.db_instance_identifier, stat = "Average" }],
            [".", "FreeStorageSpace", { DBInstanceIdentifier = module.rds.db_instance_identifier, stat = "Average" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "RDS Database"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", { ClusterName = module.ecs_backend_cluster.name, ServiceName = aws_ecs_service.backend.name }],
            [".", "MemoryUtilization", { ClusterName = module.ecs_backend_cluster.name, ServiceName = aws_ecs_service.backend.name }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "ECS Backend Service"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ElastiCache", "CPUUtilization", { CacheClusterId = "medease-redis-${var.environment}" }],
            [".", "NetworkBytesIn", { CacheClusterId = "medease-redis-${var.environment}" }],
            [".", "NetworkBytesOut", { CacheClusterId = "medease-redis-${var.environment}" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "ElastiCache Redis"
        }
      }
    ]
  })
}
