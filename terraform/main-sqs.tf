# SQS (Simple Queue Service) using GitHub source directly

# Main Queue
module "sqs_main" {
  source = "git::https://github.com/terraform-aws-modules/terraform-aws-sqs.git?ref=v5.2.1"

  name = "medease-queue-${var.environment}"

  delay_seconds              = 0
  max_message_size           = 262144  # 256 KB
  message_retention_seconds  = 345600  # 4 days
  receive_wait_time_seconds  = 10      # Long polling
  visibility_timeout_seconds = 300     # 5 minutes

  # Dead letter queue
  create_dlq                    = true
  dlq_name                      = "medease-queue-dlq-${var.environment}"
  dlq_message_retention_seconds = 1209600  # 14 days
  redrive_policy = {
    maxReceiveCount = 3
  }

  tags = {
    Name        = "medease-main-queue"
    Environment = var.environment
  }
}

# Notifications Queue
module "sqs_notifications" {
  source = "git::https://github.com/terraform-aws-modules/terraform-aws-sqs.git?ref=v5.2.1"

  name = "medease-notifications-${var.environment}"

  delay_seconds              = 0
  max_message_size           = 262144
  message_retention_seconds  = 86400   # 1 day
  receive_wait_time_seconds  = 10
  visibility_timeout_seconds = 60      # 1 minute

  # Dead letter queue
  create_dlq                    = true
  dlq_name                      = "medease-notifications-dlq-${var.environment}"
  dlq_message_retention_seconds = 1209600
  redrive_policy = {
    maxReceiveCount = 5
  }

  # Allow SNS to publish
  create_queue_policy = true
  queue_policy_statements = {
    sns = {
      sid     = "AllowSNSPublish"
      effect  = "Allow"
      actions = ["sqs:SendMessage"]
      principals = [
        {
          type        = "Service"
          identifiers = ["sns.amazonaws.com"]
        }
      ]
      conditions = [
        {
          test     = "ArnEquals"
          variable = "aws:SourceArn"
          values   = [module.sns.topic_arn]
        }
      ]
    }
  }

  tags = {
    Name        = "medease-notifications-queue"
    Environment = var.environment
  }
}

# Email Queue
module "sqs_email" {
  source = "git::https://github.com/terraform-aws-modules/terraform-aws-sqs.git?ref=v5.2.1"

  name = "medease-email-${var.environment}"

  delay_seconds              = 0
  max_message_size           = 262144
  message_retention_seconds  = 86400
  receive_wait_time_seconds  = 10
  visibility_timeout_seconds = 120     # 2 minutes

  # Dead letter queue
  create_dlq                    = true
  dlq_name                      = "medease-email-dlq-${var.environment}"
  dlq_message_retention_seconds = 1209600
  redrive_policy = {
    maxReceiveCount = 3
  }

  tags = {
    Name        = "medease-email-queue"
    Environment = var.environment
  }
}
