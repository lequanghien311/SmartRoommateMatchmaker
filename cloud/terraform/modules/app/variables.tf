variable "name" { type = string }
variable "location" { type = string }
variable "resource_group_name" { type = string }
variable "storage_account_name" { type = string }
variable "storage_account_access_key" { type = string, sensitive = true }
variable "application_insights_connection" { type = string, sensitive = true }
variable "container_image" { type = string }
variable "tags" { type = map(string) }

