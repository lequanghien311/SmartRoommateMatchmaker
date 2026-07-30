output "resource_group_name" { value = azurerm_resource_group.this.name }
output "acr_login_server" { value = azurerm_container_registry.this.login_server }
output "key_vault_uri" { value = azurerm_key_vault.this.vault_uri }

