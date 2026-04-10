# ACM (AWS Certificate Manager) using GitHub source directly
# Note: CloudFront requires certificates in us-east-1
module "acm" {
  source = "git::https://github.com/terraform-aws-modules/terraform-aws-acm.git?ref=v6.3.0"

  providers = {
    aws = aws.us_east_1
  }

  domain_name = var.domain_name
  zone_id     = aws_route53_zone.main.zone_id

  subject_alternative_names = [
    "*.${var.domain_name}",
    "www.${var.domain_name}",
    "api.${var.domain_name}"
  ]

  validation_method   = "DNS"
  wait_for_validation = true

  tags = {
    Name        = "medease-cert-cloudfront"
    Environment = var.environment
  }
}

# Regional certificate for ALB (in ap-southeast-1)
module "acm_regional" {
  source = "git::https://github.com/terraform-aws-modules/terraform-aws-acm.git?ref=v6.3.0"

  domain_name = var.domain_name
  zone_id     = aws_route53_zone.main.zone_id

  subject_alternative_names = [
    "*.${var.domain_name}",
    "api.${var.domain_name}"
  ]

  validation_method   = "DNS"
  wait_for_validation = true

  tags = {
    Name        = "medease-cert-alb"
    Environment = var.environment
  }
}
