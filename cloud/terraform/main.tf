resource "random_string" "suffix" {
  length  = 6
  upper   = false
  special = false
}

locals {
  prefix = "${var.project_name}-${var.environment}-${random_string.suffix.result}"
}

module "core" {
  source   = "./modules/core"
  name     = local.prefix
  location = var.location
  tags     = var.tags
}

module "observability" {
  source              = "./modules/observability"
  name                = local.prefix
  location            = var.location
  resource_group_name = module.core.resource_group_name
  tags                = var.tags
}

module "data" {
  source                  = "./modules/data"
  name                    = local.prefix
  location                = var.location
  resource_group_name     = module.core.resource_group_name
  postgres_admin_username = var.postgres_admin_username
  postgres_admin_password = var.postgres_admin_password
  tags                    = var.tags
}

module "messaging" {
  source              = "./modules/messaging"
  name                = local.prefix
  location            = var.location
  resource_group_name = module.core.resource_group_name
  tags                = var.tags
}

module "app" {
  source                          = "./modules/app"
  name                            = local.prefix
  location                        = var.location
  resource_group_name             = module.core.resource_group_name
  storage_account_name            = module.data.storage_account_name
  storage_account_access_key      = module.data.storage_account_access_key
  application_insights_connection = module.observability.connection_string
  container_image                 = var.container_image
  tags                            = var.tags
}

module "aks" {
  count               = var.enable_aks ? 1 : 0
  source              = "./modules/aks"
  name                = local.prefix
  location            = var.location
  resource_group_name = module.core.resource_group_name
  tags                = var.tags
}

