variable "name" { type = string }
variable "location" { type = string }
variable "resource_group_name" { type = string }
variable "postgres_admin_username" { type = string }
variable "postgres_admin_password" { type = string, sensitive = true }
variable "tags" { type = map(string) }

