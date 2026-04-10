# ECR (Elastic Container Registry) using GitHub source directly

# Backend ECR Repository
module "ecr_backend" {
  source = "git::https://github.com/terraform-aws-modules/terraform-aws-ecr.git?ref=v3.2.0"

  repository_name = "medease-backend-${var.environment}"

  repository_image_tag_mutability = "MUTABLE"
  repository_image_scan_on_push   = true

  repository_lifecycle_policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 10 tagged images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["v"]
          countType     = "imageCountMoreThan"
          countNumber   = 10
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 2
        description  = "Delete untagged images after 7 days"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 7
        }
        action = {
          type = "expire"
        }
      }
    ]
  })

  repository_force_delete = var.environment != "production"

  tags = {
    Name        = "medease-backend"
    Environment = var.environment
  }
}

# Frontend ECR Repository
module "ecr_frontend" {
  source = "git::https://github.com/terraform-aws-modules/terraform-aws-ecr.git?ref=v3.2.0"

  repository_name = "medease-frontend-${var.environment}"

  repository_image_tag_mutability = "MUTABLE"
  repository_image_scan_on_push   = true

  repository_lifecycle_policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 10 tagged images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["v"]
          countType     = "imageCountMoreThan"
          countNumber   = 10
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 2
        description  = "Delete untagged images after 7 days"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 7
        }
        action = {
          type = "expire"
        }
      }
    ]
  })

  repository_force_delete = var.environment != "production"

  tags = {
    Name        = "medease-frontend"
    Environment = var.environment
  }
}
