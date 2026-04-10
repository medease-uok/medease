# Security Groups using GitHub source directly

# ALB Security Group
module "alb_security_group" {
  source = "git::https://github.com/terraform-aws-modules/terraform-aws-security-group.git?ref=v5.3.1"

  name        = "medease-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = module.vpc.vpc_id

  ingress_with_cidr_blocks = [
    {
      from_port   = 80
      to_port     = 80
      protocol    = "tcp"
      cidr_blocks = "0.0.0.0/0"
      description = "HTTP from internet"
    },
    {
      from_port   = 443
      to_port     = 443
      protocol    = "tcp"
      cidr_blocks = "0.0.0.0/0"
      description = "HTTPS from internet"
    }
  ]

  egress_with_cidr_blocks = [
    {
      from_port   = 0
      to_port     = 0
      protocol    = "-1"
      cidr_blocks = "0.0.0.0/0"
      description = "Allow all outbound"
    }
  ]

  tags = {
    Name        = "medease-alb-sg"
    Environment = var.environment
  }
}

# Frontend Security Group
module "frontend_security_group" {
  source = "git::https://github.com/terraform-aws-modules/terraform-aws-security-group.git?ref=v5.3.1"

  name        = "medease-frontend-sg"
  description = "Security group for frontend ECS tasks"
  vpc_id      = module.vpc.vpc_id

  computed_ingress_with_source_security_group_id = [
    {
      from_port                = 3000
      to_port                  = 3000
      protocol                 = "tcp"
      source_security_group_id = module.alb_security_group.security_group_id
      description              = "Allow traffic from ALB"
    }
  ]
  number_of_computed_ingress_with_source_security_group_id = 1

  egress_with_cidr_blocks = [
    {
      from_port   = 0
      to_port     = 0
      protocol    = "-1"
      cidr_blocks = "0.0.0.0/0"
      description = "Allow all outbound"
    }
  ]

  tags = {
    Name        = "medease-frontend-sg"
    Environment = var.environment
  }
}

# Backend Security Group
module "backend_security_group" {
  source = "git::https://github.com/terraform-aws-modules/terraform-aws-security-group.git?ref=v5.3.1"

  name        = "medease-backend-sg"
  description = "Security group for backend ECS tasks"
  vpc_id      = module.vpc.vpc_id

  computed_ingress_with_source_security_group_id = [
    {
      from_port                = 5001
      to_port                  = 5001
      protocol                 = "tcp"
      source_security_group_id = module.alb_security_group.security_group_id
      description              = "Allow traffic from ALB"
    },
    {
      from_port                = 5001
      to_port                  = 5001
      protocol                 = "tcp"
      source_security_group_id = module.frontend_security_group.security_group_id
      description              = "Allow traffic from frontend"
    }
  ]
  number_of_computed_ingress_with_source_security_group_id = 2

  egress_with_cidr_blocks = [
    {
      from_port   = 0
      to_port     = 0
      protocol    = "-1"
      cidr_blocks = "0.0.0.0/0"
      description = "Allow all outbound"
    }
  ]

  tags = {
    Name        = "medease-backend-sg"
    Environment = var.environment
  }
}

# RDS Security Group
module "rds_security_group" {
  source = "git::https://github.com/terraform-aws-modules/terraform-aws-security-group.git?ref=v5.3.1"

  name        = "medease-rds-sg"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = module.vpc.vpc_id

  computed_ingress_with_source_security_group_id = [
    {
      from_port                = 5432
      to_port                  = 5432
      protocol                 = "tcp"
      source_security_group_id = module.backend_security_group.security_group_id
      description              = "PostgreSQL from backend"
    }
  ]
  number_of_computed_ingress_with_source_security_group_id = 1

  tags = {
    Name        = "medease-rds-sg"
    Environment = var.environment
  }
}

# Redis Security Group
module "redis_security_group" {
  source = "git::https://github.com/terraform-aws-modules/terraform-aws-security-group.git?ref=v5.3.1"

  name        = "medease-redis-sg"
  description = "Security group for ElastiCache Redis"
  vpc_id      = module.vpc.vpc_id

  computed_ingress_with_source_security_group_id = [
    {
      from_port                = 6379
      to_port                  = 6379
      protocol                 = "tcp"
      source_security_group_id = module.backend_security_group.security_group_id
      description              = "Redis from backend"
    }
  ]
  number_of_computed_ingress_with_source_security_group_id = 1

  tags = {
    Name        = "medease-redis-sg"
    Environment = var.environment
  }
}
