resource "azurerm_service_plan" "this" {
  name                = "${var.name}-plan"
  resource_group_name = var.resource_group_name
  location            = var.location
  os_type             = "Linux"
  sku_name            = "B1"
  tags                = var.tags
}
resource "azurerm_linux_web_app" "this" {
  name                = "${var.name}-web"
  resource_group_name = var.resource_group_name
  location            = var.location
  service_plan_id     = azurerm_service_plan.this.id
  https_only          = true
  identity { type = "SystemAssigned" }
  site_config {
    always_on = true
    application_stack {
      docker_image_name   = var.container_image
      docker_registry_url = "https://mcr.microsoft.com"
    }
    health_check_path = "/api/health"
  }
  app_settings = {
    NODE_ENV                             = "production"
    APPLICATIONINSIGHTS_CONNECTION_STRING = var.application_insights_connection
  }
  tags = var.tags
}
resource "azurerm_service_plan" "functions" {
  name                = "${var.name}-functions-plan"
  resource_group_name = var.resource_group_name
  location            = var.location
  os_type             = "Linux"
  sku_name            = "Y1"
  tags                = var.tags
}
resource "azurerm_linux_function_app" "this" {
  name                       = "${var.name}-functions"
  resource_group_name        = var.resource_group_name
  location                   = var.location
  service_plan_id            = azurerm_service_plan.functions.id
  storage_account_name       = var.storage_account_name
  storage_account_access_key = var.storage_account_access_key
  identity { type = "SystemAssigned" }
  site_config {
    application_stack { node_version = "22" }
  }
  tags = var.tags
}

