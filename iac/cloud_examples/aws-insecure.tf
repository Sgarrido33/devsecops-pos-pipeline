# aws-insecure.tf
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

resource "aws_s3_bucket" "insecure_bucket" {
  bucket = "mi-bucket-inseguro-ejemplo"
}

resource "aws_s3_bucket_public_access_block" "insecure_bucket_pab" {
  bucket = aws_s3_bucket.insecure_bucket.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_acl" "insecure_bucket_acl" {
  bucket = aws_s3_bucket.insecure_bucket.id
  acl    = "public-read-write"
}