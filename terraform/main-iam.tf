# IAM Roles using native resources (simpler and more transparent)

# ECS Task Execution Role (for pulling images, writing logs)
resource "aws_iam_role" "ecs_task_execution" {
  name = "medease-ecs-task-execution-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name        = "medease-ecs-task-execution"
    Environment = var.environment
  }
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# ECS Task Role (for application permissions)
resource "aws_iam_role" "ecs_task" {
  name = "medease-ecs-task-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name        = "medease-ecs-task"
    Environment = var.environment
  }
}

# IAM Policy for ECS Task (S3, SNS, SQS, Secrets Manager)
module "ecs_task_policy" {
  source = "git::https://github.com/terraform-aws-modules/terraform-aws-iam.git//modules/iam-policy?ref=v6.4.0"

  name        = "medease-ecs-task-policy-${var.environment}"
  path        = "/"
  description = "IAM policy for MedEase ECS tasks"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          module.s3_bucket.s3_bucket_arn,
          "${module.s3_bucket.s3_bucket_arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = [
          module.sns.topic_arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage",
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = [
          module.sqs_main.queue_arn,
          module.sqs_notifications.queue_arn,
          module.sqs_email.queue_arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          "arn:aws:secretsmanager:${var.aws_region}:${data.aws_caller_identity.current.account_id}:secret:medease/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = [
          "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/ecs/medease-*"
        ]
      }
    ]
  })

  tags = {
    Name        = "medease-ecs-task-policy"
    Environment = var.environment
  }
}

# Attach policy to ECS Task Role
resource "aws_iam_role_policy_attachment" "ecs_task_policy_attachment" {
  role       = aws_iam_role.ecs_task.name
  policy_arn = module.ecs_task_policy.arn
}

# CI/CD User for GitHub Actions (using native resources)
resource "aws_iam_user" "cicd" {
  name = "medease-cicd-${var.environment}"

  tags = {
    Name        = "medease-github-actions"
    Environment = var.environment
  }
}

resource "aws_iam_access_key" "cicd" {
  user = aws_iam_user.cicd.name
}

# CI/CD Policy
module "cicd_policy" {
  source = "git::https://github.com/terraform-aws-modules/terraform-aws-iam.git//modules/iam-policy?ref=v6.4.0"

  name        = "medease-cicd-policy-${var.environment}"
  path        = "/"
  description = "IAM policy for MedEase CI/CD (GitHub Actions)"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ecs:UpdateService",
          "ecs:DescribeServices",
          "ecs:DescribeTaskDefinition",
          "ecs:RegisterTaskDefinition"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "iam:PassRole"
        ]
        Resource = [
          aws_iam_role.ecs_task_execution.arn,
          aws_iam_role.ecs_task.arn
        ]
      }
    ]
  })

  tags = {
    Name        = "medease-cicd-policy"
    Environment = var.environment
  }
}

# Attach policy to CI/CD User
resource "aws_iam_user_policy_attachment" "cicd_policy_attachment" {
  user       = aws_iam_user.cicd.name
  policy_arn = module.cicd_policy.arn
}
