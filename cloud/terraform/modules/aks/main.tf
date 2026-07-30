resource "azurerm_kubernetes_cluster" "this" {
  name                = "${var.name}-aks"
  location            = var.location
  resource_group_name = var.resource_group_name
  dns_prefix          = "${var.name}-aks"
  sku_tier            = "Free"
  default_node_pool {
    name       = "system"
    node_count = 1
    vm_size    = "Standard_B2s"
  }
  identity { type = "SystemAssigned" }
  network_profile {
    network_plugin = "azure"
    network_policy = "azure"
  }
  tags = var.tags
}

