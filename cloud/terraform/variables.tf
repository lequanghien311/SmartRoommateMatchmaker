variable "project_name" { type = string, default = "smart-roommate" }
variable "environment" { type = string, default = "dev" }
variable "location" { type = string, default = "southeastasia" }
variable "postgres_admin_username" { type = string, default = "smartadmin" }
variable "postgres_admin_password" {
  type      = string
  sensitive = true
}
variable "container_image" { type = string, default = "mcr.microsoft.com/azuredocs/containerapps-helloworld:latest" }
variable "enable_aks" { type = bool, default = false }
variable "enable_gateway" { type = bool, default = false }
variable "enable_front_door" { type = bool, default = false }
variable "enable_api_management" { type = bool, default = false }
variable "tags" {
  type = map(string)
  default = {
    project    = "smart-roommate"
    managed_by = "terraform"
  }
}

