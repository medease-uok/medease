# RDS PostgreSQL using GitHub source directly
module "rds" {
  source = "git::https://github.com/terraform-aws-modules/terraform-aws-rds.git?ref=v7.2.0"

  identifier = "medease-${var.environment}"

  # Engine
  engine               = "postgres"
  engine_version       = "15.4"
  family               = "postgres15"
  major_engine_version = "15"
  instance_class       = var.db_instance_class

  # Storage
  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_allocated_storage * 2
  storage_encrypted     = true
  storage_type          = "gp3"

  # Database
  db_name     = var.db_name
  username    = var.db_username
  password_wo = var.db_password
  port        = 5432

  # Network
  db_subnet_group_name   = module.vpc.database_subnet_group_name
  vpc_security_group_ids = [module.rds_security_group.security_group_id]
  publicly_accessible    = false

  # High Availability
  multi_az = var.db_multi_az

  # Backup
  backup_retention_period        = var.db_backup_retention_period
  backup_window                  = var.db_backup_window
  maintenance_window             = var.db_maintenance_window
  skip_final_snapshot            = var.environment != "production"
  final_snapshot_identifier_prefix = var.environment == "production" ? "medease-final-snapshot" : null

  # Enhanced Monitoring
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  create_cloudwatch_log_group     = true

  # Performance Insights
  performance_insights_enabled          = true
  performance_insights_retention_period = 7

  # Deletion Protection
  deletion_protection = var.environment == "production"

  # Parameters
  parameters = [
    {
      name  = "autovacuum"
      value = "1"
    },
    {
      name  = "client_encoding"
      value = "utf8"
    },
    {
      name  = "timezone"
      value = "UTC"
    }
  ]

  tags = {
    Name        = "medease-rds"
    Environment = var.environment
  }
}
