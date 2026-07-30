output "storage_account_name" { value = azurerm_storage_account.this.name }
output "storage_account_access_key" { value = azurerm_storage_account.this.primary_access_key, sensitive = true }
output "postgres_fqdn" { value = azurerm_postgresql_flexible_server.this.fqdn }

