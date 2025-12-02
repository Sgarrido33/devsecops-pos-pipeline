# gcp-insecure.tf
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = "mi-proyecto-ejemplo"
  region  = "us-central1"
}

resource "google_storage_bucket" "insecure_bucket" {
  name          = "mi-bucket-inseguro-ejemplo"
  location      = "US"
  force_destroy = true

  uniform_bucket_level_access = false
}

# Hacer el bucket público
resource "google_storage_bucket_iam_member" "public_access" {
  bucket = google_storage_bucket.insecure_bucket.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

resource "google_storage_bucket_iam_member" "public_write" {
  bucket = google_storage_bucket.insecure_bucket.name
  role   = "roles/storage.objectCreator"
  member = "allUsers"
}