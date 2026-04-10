# Application Load Balancer using GitHub source directly
module "alb" {
  source = "git::https://github.com/terraform-aws-modules/terraform-aws-alb.git?ref=v9.9.0"

  name = "medease-alb"

  load_balancer_type = "application"
  vpc_id             = module.vpc.vpc_id
  subnets            = module.vpc.public_subnets
  security_groups    = [module.alb_security_group.security_group_id]

  # Listeners
  listeners = {
    http = {
      port     = 80
      protocol = "HTTP"

      forward = {
        target_group_key = "frontend"
      }
    }

    https = {
      port            = 443
      protocol        = "HTTPS"
      certificate_arn = module.acm_regional.acm_certificate_arn
      ssl_policy      = "ELBSecurityPolicy-TLS13-1-2-2021-06"

      forward = {
        target_group_key = "frontend"
      }

      rules = {
        api = {
          priority = 10

          actions = [{
            type             = "forward"
            target_group_key = "backend"
          }]

          conditions = [{
            path_pattern = {
              values = ["/api/*"]
            }
          }]
        }
      }
    }
  }

  # Target Groups
  target_groups = {
    frontend = {
      name_prefix      = "fe-"
      backend_protocol = "HTTP"
      backend_port     = 3000
      target_type      = "ip"

      health_check = {
        enabled             = true
        healthy_threshold   = 2
        interval            = 30
        matcher             = "200"
        path                = "/"
        port                = "traffic-port"
        protocol            = "HTTP"
        timeout             = 5
        unhealthy_threshold = 3
      }

      create_attachment = false
    }

    backend = {
      name_prefix      = "be-"
      backend_protocol = "HTTP"
      backend_port     = 5001
      target_type      = "ip"

      health_check = {
        enabled             = true
        healthy_threshold   = 2
        interval            = 30
        matcher             = "200"
        path                = "/health"
        port                = "traffic-port"
        protocol            = "HTTP"
        timeout             = 5
        unhealthy_threshold = 3
      }

      create_attachment = false
    }
  }

  tags = {
    Name        = "medease-alb"
    Environment = var.environment
  }
}
