# SNS (Simple Notification Service) using GitHub source directly
module "sns" {
  source = "git::https://github.com/terraform-aws-modules/terraform-aws-sns.git?ref=v7.1.0"

  name         = "medease-notifications-${var.environment}"
  display_name = "MedEase Notifications"

  # Email subscriptions for notifications
  subscriptions = {
    for idx, email in var.notification_emails : "email-${idx}" => {
      protocol = "email"
      endpoint = email
    }
  }

  tags = {
    Name        = "medease-notifications"
    Environment = var.environment
  }
}

# SNS Topic for CloudWatch Alarms
module "sns_alarms" {
  source = "git::https://github.com/terraform-aws-modules/terraform-aws-sns.git?ref=v7.1.0"

  name         = "medease-alarms-${var.environment}"
  display_name = "MedEase CloudWatch Alarms"

  # Email subscriptions for alarms
  subscriptions = {
    for idx, email in var.admin_emails : "email-${idx}" => {
      protocol = "email"
      endpoint = email
    }
  }

  tags = {
    Name        = "medease-alarms"
    Environment = var.environment
  }
}
