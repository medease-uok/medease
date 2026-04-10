# ElastiCache Redis using GitHub source directly
module "elasticache" {
  source = "git::https://github.com/terraform-aws-modules/terraform-aws-elasticache.git?ref=v1.11.0"

  cluster_id           = "medease-redis-${var.environment}"
  engine               = "redis"
  engine_version       = var.redis_engine_version
  node_type            = var.redis_node_type
  num_cache_nodes      = var.redis_num_cache_nodes
  parameter_group_name = var.redis_parameter_group
  port                 = 6379

  subnet_group_name  = module.vpc.elasticache_subnet_group_name
  security_group_ids = [module.redis_security_group.security_group_id]

  automatic_failover_enabled = var.redis_automatic_failover
  multi_az_enabled          = var.redis_automatic_failover

  tags = {
    Name        = "medease-redis"
    Environment = var.environment
  }
}
