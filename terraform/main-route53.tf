# Route 53 DNS using native resources to break circular dependency
# Zone is created first, then ACM can reference it, then CloudFront, then records

# Hosted Zone (created independently - no dependencies)
resource "aws_route53_zone" "main" {
  name    = var.domain_name
  comment = "MedEase hosted zone for ${var.environment}"

  tags = {
    Name        = "medease-zone"
    Environment = var.environment
  }
}

# DNS Records (created after CloudFront and ALB exist)
# Root domain → CloudFront
resource "aws_route53_record" "root" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = module.cloudfront.cloudfront_distribution_domain_name
    zone_id                = module.cloudfront.cloudfront_distribution_hosted_zone_id
    evaluate_target_health = false
  }

  depends_on = [module.cloudfront]
}

# www subdomain → CloudFront
resource "aws_route53_record" "www" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "www.${var.domain_name}"
  type    = "A"

  alias {
    name                   = module.cloudfront.cloudfront_distribution_domain_name
    zone_id                = module.cloudfront.cloudfront_distribution_hosted_zone_id
    evaluate_target_health = false
  }

  depends_on = [module.cloudfront]
}

# api subdomain → ALB
resource "aws_route53_record" "api" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api.${var.domain_name}"
  type    = "A"

  alias {
    name                   = module.alb.dns_name
    zone_id                = module.alb.zone_id
    evaluate_target_health = true
  }

  depends_on = [module.alb]
}
