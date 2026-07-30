data "azurerm_client_config" "current" {}
resource "azurerm_resource_group" "this" {
  name     = "${var.name}-rg"
  location = var.location
  tags     = var.tags
}
resource "azurerm_container_registry" "this" {
  name                = replace("${var.name}acr", "-", "")
  resource_group_name = azurerm_resource_group.this.name
  location            = var.location
  sku                 = "Basic"
  admin_enabled       = false
  tags                = var.tags
}
resource "azurerm_key_vault" "this" {
  name                       = substr(replace("${var.name}-kv", "-", ""), 0, 24)
  location                   = var.location
  resource_group_name        = azurerm_resource_group.this.name
  tenant_id                  = data.azurerm_client_config.current.tenant_id
  sku_name                   = "standard"
  purge_protection_enabled   = true
  soft_delete_retention_days = 7
  enable_rbac_authorization  = true
  tags                       = var.tags
}

