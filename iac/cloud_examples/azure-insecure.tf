# azure-insecure.tf
terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "example" {
  name     = "rg-storage-ejemplo"
  location = "East US"
}

resource "azurerm_storage_account" "insecure_storage" {
  name                     = "storageinseguroejemplo"
  resource_group_name      = azurerm_resource_group.example.name
  location                 = azurerm_resource_group.example.location
  account_tier             = "Standard"
  account_replication_type = "LRS"

  # Permitir acceso HTTP
  enable_https_traffic_only = false
  
  # Sin cifrado de infraestructura
  infrastructure_encryption_enabled = false

  # Permitir acceso con clave compartida
  shared_access_key_enabled = true

  # Permitir acceso público a blobs
  allow_nested_items_to_be_public = true

  # TLS mínimo 1.0 (inseguro)
  min_tls_version = "TLS1_0"
}

resource "azurerm_storage_container" "insecure_container" {
  name                  = "contenedor-publico"
  storage_account_name  = azurerm_storage_account.insecure_storage.name
  container_access_type = "blob"
}