# S3 Bucket using GitHub source directly
module "s3_bucket" {
  source = "git::https://github.com/terraform-aws-modules/terraform-aws-s3-bucket.git?ref=v5.9.1"

  bucket = "medease-profile-images-${data.aws_caller_identity.current.account_id}"

  # Versioning
  versioning = {
    enabled = true
  }

  # Server-side encryption
  server_side_encryption_configuration = {
    rule = {
      apply_server_side_encryption_by_default = {
        sse_algorithm = "AES256"
      }
    }
  }

  # Lifecycle rules
  lifecycle_rule = [
    {
      id      = "delete-old-versions"
      enabled = true

      noncurrent_version_expiration = {
        days = 30
      }
    }
  ]

  # CORS
  cors_rule = [
    {
      allowed_headers = ["*"]
      allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
      allowed_origins = ["https://${var.domain_name}", "https://www.${var.domain_name}"]
      expose_headers  = ["ETag"]
      max_age_seconds = 3000
    }
  ]

  # Block public access
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true

  tags = {
    Name        = "medease-profile-images"
    Environment = var.environment
  }
}
