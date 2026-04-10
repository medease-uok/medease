# VPC Configuration using GitHub source directly
module "vpc" {
  source = "git::https://github.com/terraform-aws-modules/terraform-aws-vpc.git?ref=v6.6.1"

  name = "medease-vpc"
  cidr = var.vpc_cidr

  azs              = var.availability_zones
  private_subnets  = [cidrsubnet(var.vpc_cidr, 4, 0), cidrsubnet(var.vpc_cidr, 4, 1)]  # Private web
  public_subnets   = [cidrsubnet(var.vpc_cidr, 4, 2), cidrsubnet(var.vpc_cidr, 4, 3)]  # Public
  database_subnets = [cidrsubnet(var.vpc_cidr, 4, 4), cidrsubnet(var.vpc_cidr, 4, 5)]  # Database
  intra_subnets    = [cidrsubnet(var.vpc_cidr, 4, 6), cidrsubnet(var.vpc_cidr, 4, 7)]  # Private app

  # Enable NAT Gateway for private subnets
  enable_nat_gateway     = true
  single_nat_gateway     = false
  one_nat_gateway_per_az = true

  # Enable DNS
  enable_dns_hostnames = true
  enable_dns_support   = true

  # VPC Flow Logs
  enable_flow_log                      = true
  create_flow_log_cloudwatch_iam_role  = true
  create_flow_log_cloudwatch_log_group = true

  # Database subnet group
  create_database_subnet_group = true
  database_subnet_group_name   = "medease-db"

  tags = {
    Name        = "medease-vpc"
    Environment = var.environment
    Terraform   = "true"
  }

  vpc_tags = {
    Name = "medease-vpc"
  }

  public_subnet_tags = {
    Tier = "public"
  }

  private_subnet_tags = {
    Tier = "private-web"
  }

  intra_subnet_tags = {
    Tier = "private-app"
  }

  database_subnet_tags = {
    Tier = "database"
  }
}
