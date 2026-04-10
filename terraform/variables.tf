# General Variables
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "ap-southeast-1"
}

variable "environment" {
  description = "Environment name (production, staging, development)"
  type        = string
  default     = "production"
}

variable "domain_name" {
  description = "Root domain name for the application"
  type        = string
}

# VPC Variables
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["ap-southeast-1a", "ap-southeast-1b"]
}

# RDS Variables
variable "db_name" {
  description = "Database name"
  type        = string
  default     = "medease"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "medease_user"
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "db_allocated_storage" {
  description = "Allocated storage for RDS in GB"
  type        = number
  default     = 100
}

variable "db_multi_az" {
  description = "Enable Multi-AZ deployment for RDS"
  type        = bool
  default     = true
}

variable "db_backup_retention_period" {
  description = "Number of days to retain backups"
  type        = number
  default     = 7
}

variable "db_backup_window" {
  description = "Preferred backup window"
  type        = string
  default     = "03:00-04:00"
}

variable "db_maintenance_window" {
  description = "Preferred maintenance window"
  type        = string
  default     = "sun:04:00-sun:05:00"
}

# ElastiCache Redis Variables
variable "redis_node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.t3.medium"
}

variable "redis_num_cache_nodes" {
  description = "Number of cache nodes"
  type        = number
  default     = 2
}

variable "redis_parameter_group" {
  description = "Redis parameter group family"
  type        = string
  default     = "redis7"
}

variable "redis_engine_version" {
  description = "Redis engine version"
  type        = string
  default     = "7.0"
}

variable "redis_automatic_failover" {
  description = "Enable automatic failover for Redis cluster"
  type        = bool
  default     = true
}

# Application Secrets
variable "jwt_secret" {
  description = "JWT secret key"
  type        = string
  sensitive   = true
}

variable "jwt_refresh_secret" {
  description = "JWT refresh token secret"
  type        = string
  sensitive   = true
}

variable "virustotal_api_key" {
  description = "VirusTotal API key for file scanning"
  type        = string
  sensitive   = true
  default     = ""
}

# ECS Backend Variables
variable "backend_desired_count" {
  description = "Desired number of backend containers"
  type        = number
  default     = 2
}

variable "backend_min_capacity" {
  description = "Minimum number of backend containers"
  type        = number
  default     = 2
}

variable "backend_max_capacity" {
  description = "Maximum number of backend containers"
  type        = number
  default     = 10
}

# ECS Frontend Variables
variable "frontend_desired_count" {
  description = "Desired number of frontend containers"
  type        = number
  default     = 2
}

variable "frontend_min_capacity" {
  description = "Minimum number of frontend containers"
  type        = number
  default     = 2
}

variable "frontend_max_capacity" {
  description = "Maximum number of frontend containers"
  type        = number
  default     = 10
}

# Notification Variables
variable "notification_emails" {
  description = "List of email addresses for notifications"
  type        = list(string)
  default     = []
}

variable "admin_emails" {
  description = "List of admin email addresses for alarms"
  type        = list(string)
  default     = []
}
