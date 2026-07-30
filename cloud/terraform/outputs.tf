output "resource_group_name" { value = module.core.resource_group_name }
output "app_service_url" { value = module.app.app_service_url }
output "postgres_fqdn" { value = module.data.postgres_fqdn }
output "storage_account_name" { value = module.data.storage_account_name }
output "service_bus_namespace" { value = module.messaging.namespace_name }
output "container_registry" { value = module.core.acr_login_server }
output "key_vault_uri" { value = module.core.key_vault_uri }

