# CloudFront CDN using GitHub source directly
module "cloudfront" {
  source = "git::https://github.com/terraform-aws-modules/terraform-aws-cloudfront.git?ref=v6.4.0"

  aliases = [var.domain_name, "www.${var.domain_name}"]

  comment             = "MedEase CDN for ${var.environment}"
  enabled             = true
  is_ipv6_enabled     = true
  price_class         = "PriceClass_All"
  retain_on_delete    = false
  wait_for_deployment = false
  web_acl_id          = aws_wafv2_web_acl.cloudfront.arn

  # Origins
  origin = {
    alb = {
      domain_name = module.alb.dns_name
      custom_origin_config = {
        http_port              = 80
        https_port             = 443
        origin_protocol_policy = "https-only"
        origin_ssl_protocols   = ["TLSv1.2"]
      }
    }
    s3 = {
      domain_name = module.s3_bucket.s3_bucket_bucket_regional_domain_name
      origin_access_control = module.s3_bucket.s3_bucket_id
    }
  }

  # Default cache behavior
  default_cache_behavior = {
    target_origin_id       = "alb"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    query_string           = true
    cookies_forward        = "all"
    headers                = ["Host", "CloudFront-Forwarded-Proto"]

    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 31536000
  }

  # Ordered cache behaviors
  ordered_cache_behavior = [
    {
      path_pattern           = "/api/*"
      target_origin_id       = "alb"
      viewer_protocol_policy = "https-only"
      allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
      cached_methods         = ["GET", "HEAD"]
      compress               = false
      query_string           = true
      cookies_forward        = "all"
      headers                = ["*"]

      min_ttl     = 0
      default_ttl = 0
      max_ttl     = 0
    },
    {
      path_pattern           = "/assets/*"
      target_origin_id       = "s3"
      viewer_protocol_policy = "redirect-to-https"
      allowed_methods        = ["GET", "HEAD"]
      cached_methods         = ["GET", "HEAD"]
      compress               = true
      query_string           = false

      min_ttl     = 86400
      default_ttl = 31536000
      max_ttl     = 31536000
    }
  ]

  # Viewer certificate
  viewer_certificate = {
    acm_certificate_arn = module.acm.acm_certificate_arn
    ssl_support_method  = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  # Restrictions
  restrictions = {
    geo_restriction = {
      restriction_type = "none"
      locations        = []
    }
  }

  tags = {
    Name        = "medease-cdn"
    Environment = var.environment
  }

  depends_on = [aws_wafv2_web_acl.cloudfront, module.acm]
}
