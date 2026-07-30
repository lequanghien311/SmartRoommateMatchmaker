resource "azurerm_servicebus_namespace" "this" {
  name                = "${var.name}-sb"
  location            = var.location
  resource_group_name = var.resource_group_name
  sku                 = "Standard"
  tags                = var.tags
}
resource "azurerm_servicebus_queue" "events" {
  name         = "smart-roommate-events"
  namespace_id = azurerm_servicebus_namespace.this.id
  max_delivery_count = 10
  dead_lettering_on_message_expiration = true
}

