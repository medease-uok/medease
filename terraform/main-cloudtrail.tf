# CloudTrail Audit Logging using GitHub source directly
module "cloudtrail" {
  source = "git::https://github.com/cloudposse/terraform-aws-cloudtrail.git?ref=0.24.0"

  name      = "medease-audit-trail-${var.environment}"
  namespace = "medease"
  stage     = var.environment

  enable_logging                = true
  enable_log_file_validation    = true
  include_global_service_events = true
  is_multi_region_trail         = true
  is_organization_trail         = false

  # S3 bucket for CloudTrail logs
  s3_bucket_name = "medease-cloudtrail-${data.aws_caller_identity.current.account_id}-${var.environment}"

  # CloudWatch Logs
  cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail_cloudwatch.arn
  cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"

  # Event selectors for data events
  event_selector = [
    {
      read_write_type           = "All"
      include_management_events = true

      data_resource = [
        {
          type   = "AWS::S3::Object"
          values = ["${module.s3_bucket.s3_bucket_arn}/*"]
        }
      ]
    }
  ]

  # Advanced event selectors for insights
  insight_selector = [
    {
      insight_type = "ApiCallRateInsight"
    }
  ]

  # SNS topic for notifications
  sns_topic_name = module.sns_alarms.topic_arn

  tags = {
    Name        = "medease-cloudtrail"
    Environment = var.environment
  }
}

# CloudWatch Log Group for CloudTrail
resource "aws_cloudwatch_log_group" "cloudtrail" {
  name              = "/aws/cloudtrail/medease-${var.environment}"
  retention_in_days = 90

  tags = {
    Name        = "medease-cloudtrail-logs"
    Environment = var.environment
  }
}

# IAM Role for CloudTrail to write to CloudWatch Logs
resource "aws_iam_role" "cloudtrail_cloudwatch" {
  name = "medease-cloudtrail-cloudwatch-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name        = "medease-cloudtrail-cloudwatch-role"
    Environment = var.environment
  }
}

# IAM Policy for CloudTrail CloudWatch Logs
resource "aws_iam_role_policy" "cloudtrail_cloudwatch" {
  name = "medease-cloudtrail-cloudwatch-policy-${var.environment}"
  role = aws_iam_role.cloudtrail_cloudwatch.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
      }
    ]
  })
}
