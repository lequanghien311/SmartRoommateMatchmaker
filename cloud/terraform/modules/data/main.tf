resource "azurerm_storage_account" "this" {
  name                     = substr(replace("${var.name}storage", "-", ""), 0, 24)
  resource_group_name      = var.resource_group_name
  location                 = var.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  min_tls_version          = "TLS1_2"
  tags                     = var.tags
}
resource "azurerm_storage_container" "images" {
  name                  = "room-images"
  storage_account_id    = azurerm_storage_account.this.id
  container_access_type = "private"
}
resource "azurerm_postgresql_flexible_server" "this" {
  name                   = "${var.name}-postgres"
  resource_group_name    = var.resource_group_name
  location               = var.location
  version                = "16"
  administrator_login    = var.postgres_admin_username
  administrator_password = var.postgres_admin_password
  sku_name               = "B_Standard_B1ms"
  storage_mb             = 32768
  backup_retention_days  = 7
  zone                   = "1"
  tags                   = var.tags
}
resource "azurerm_postgresql_flexible_server_database" "this" {
  name      = "smart_roommate"
  server_id = azurerm_postgresql_flexible_server.this.id
  collation = "en_US.utf8"
  charset   = "UTF8"
}

