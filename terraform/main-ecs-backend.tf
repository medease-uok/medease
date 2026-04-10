# ECS Backend Cluster and Service using GitHub source + native resources

# ECS Cluster using official module
module "ecs_backend_cluster" {
  source = "git::https://github.com/terraform-aws-modules/terraform-aws-ecs.git//modules/cluster?ref=v7.5.0"

  name = "medease-backend-${var.environment}"

  # Fargate capacity providers
  cluster_capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy = {
    fargate = {
      name   = "FARGATE"
      weight = 50
      base   = 20
    }
    fargate_spot = {
      name   = "FARGATE_SPOT"
      weight = 50
    }
  }

  tags = {
    Name        = "medease-backend-cluster"
    Environment = var.environment
  }
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "backend" {
  name              = "/ecs/medease-backend-${var.environment}"
  retention_in_days = 30

  tags = {
    Name        = "medease-backend-logs"
    Environment = var.environment
  }
}

# ECS Task Definition
resource "aws_ecs_task_definition" "backend" {
  family                   = "medease-backend-${var.environment}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 1024  # 1 vCPU
  memory                   = 2048  # 2 GB
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "backend"
      image     = "${module.ecr_backend.repository_url}:latest"
      essential = true

      portMappings = [
        {
          containerPort = 5001
          hostPort      = 5001
          protocol      = "tcp"
        }
      ]

      environment = [
        { name = "NODE_ENV", value = var.environment },
        { name = "PORT", value = "5001" },
        { name = "DATABASE_HOST", value = module.rds.db_instance_address },
        { name = "DATABASE_PORT", value = "5432" },
        { name = "DATABASE_NAME", value = var.db_name },
        { name = "DATABASE_USER", value = var.db_username },
        { name = "DATABASE_PASSWORD", value = var.db_password },
        { name = "REDIS_HOST", value = module.elasticache.cluster_cache_nodes[0].address },
        { name = "REDIS_PORT", value = "6379" },
        { name = "JWT_SECRET", value = var.jwt_secret },
        { name = "JWT_REFRESH_SECRET", value = var.jwt_refresh_secret },
        { name = "S3_BUCKET", value = module.s3_bucket.s3_bucket_id },
        { name = "S3_REGION", value = var.aws_region },
        { name = "VIRUSTOTAL_API_KEY", value = var.virustotal_api_key },
        { name = "SNS_TOPIC_ARN", value = module.sns.topic_arn },
        { name = "SQS_QUEUE_URL", value = module.sqs_main.queue_url }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.backend.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:5001/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = {
    Name        = "medease-backend-task"
    Environment = var.environment
  }
}

# ECS Service
resource "aws_ecs_service" "backend" {
  name            = "medease-backend-${var.environment}"
  cluster         = module.ecs_backend_cluster.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = var.backend_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = module.vpc.intra_subnets
    security_groups  = [module.backend_security_group.security_group_id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = module.alb.target_groups["backend"].arn
    container_name   = "backend"
    container_port   = 5001
  }

  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = 100

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  enable_execute_command = true

  tags = {
    Name        = "medease-backend-service"
    Environment = var.environment
  }

  depends_on = [
    module.alb,
    module.rds,
    module.elasticache
  ]
}

# Auto Scaling Target
resource "aws_appautoscaling_target" "backend" {
  max_capacity       = var.backend_max_capacity
  min_capacity       = var.backend_min_capacity
  resource_id        = "service/${module.ecs_backend_cluster.name}/${aws_ecs_service.backend.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# Auto Scaling Policy - CPU
resource "aws_appautoscaling_policy" "backend_cpu" {
  name               = "medease-backend-cpu-autoscaling-${var.environment}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.backend.resource_id
  scalable_dimension = aws_appautoscaling_target.backend.scalable_dimension
  service_namespace  = aws_appautoscaling_target.backend.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# Auto Scaling Policy - Memory
resource "aws_appautoscaling_policy" "backend_memory" {
  name               = "medease-backend-memory-autoscaling-${var.environment}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.backend.resource_id
  scalable_dimension = aws_appautoscaling_target.backend.scalable_dimension
  service_namespace  = aws_appautoscaling_target.backend.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value       = 80.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}
