# Terraform configuration for Flow infrastructure on Google Cloud Platform
# This file defines the core infrastructure components

terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.0"
    }
  }
  
  backend "gcs" {
    bucket = "flow-terraform-state"
    prefix = "terraform/state"
  }
}

# Configure the Google Cloud Provider
provider "google" {
  project = var.project_id
  region  = var.region
  zone    = var.zone
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
  zone    = var.zone
}

# Variables
variable "project_id" {
  description = "The GCP project ID"
  type        = string
}

variable "region" {
  description = "The GCP region"
  type        = string
  default     = "us-central1"
}

variable "zone" {
  description = "The GCP zone"
  type        = string
  default     = "us-central1-a"
}

variable "environment" {
  description = "Environment (staging, production)"
  type        = string
  default     = "production"
}

# Enable required APIs
resource "google_project_service" "required_apis" {
  for_each = toset([
    "run.googleapis.com",
    "sqladmin.googleapis.com",
    "redis.googleapis.com",
    "secretmanager.googleapis.com",
    "artifactregistry.googleapis.com",
    "cloudbuild.googleapis.com",
    "logging.googleapis.com",
    "monitoring.googleapis.com",
    "clouderrorreporting.googleapis.com",
    "cloudscheduler.googleapis.com",
    "storage.googleapis.com",
    "iam.googleapis.com"
  ])

  service = each.value
  disable_on_destroy = false
}

# Artifact Registry for Docker images
resource "google_artifact_registry_repository" "flow_repo" {
  location      = var.region
  repository_id = "flow-repo"
  description   = "Docker repository for Flow application images"
  format        = "DOCKER"

  depends_on = [google_project_service.required_apis]
}

# Cloud SQL PostgreSQL instance
resource "google_sql_database_instance" "flow_db" {
  name             = "flow-db-${var.environment}"
  database_version = "POSTGRES_15"
  region           = var.region

  settings {
    tier = var.environment == "production" ? "db-f1-micro" : "db-f1-micro"
    
    disk_type       = "PD_SSD"
    disk_size       = var.environment == "production" ? 100 : 20
    disk_autoresize = true

    backup_configuration {
      enabled                        = true
      start_time                     = "03:00"
      location                       = var.region
      point_in_time_recovery_enabled = true
      transaction_log_retention_days  = 7
      backup_retention_settings {
        retained_backups = 30
        retention_unit   = "COUNT"
      }
    }

    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.flow_vpc.id
      require_ssl     = true
    }

    database_flags {
      name  = "log_statement"
      value = "all"
    }

    database_flags {
      name  = "log_min_duration_statement"
      value = "1000"
    }
  }

  deletion_protection = var.environment == "production"

  depends_on = [google_project_service.required_apis]
}

# Cloud SQL database
resource "google_sql_database" "flow_database" {
  name     = "flow_${var.environment}"
  instance = google_sql_database_instance.flow_db.name
}

# Cloud SQL user
resource "google_sql_user" "flow_user" {
  name     = "flow_user"
  instance = google_sql_database_instance.flow_db.name
  password = random_password.db_password.result
}

# Random password for database
resource "random_password" "db_password" {
  length  = 32
  special = true
}

# MemoryStore Redis instance
resource "google_redis_instance" "flow_redis" {
  name           = "flow-redis-${var.environment}"
  tier           = var.environment == "production" ? "STANDARD_HA" : "BASIC"
  memory_size_gb = var.environment == "production" ? 4 : 1
  region         = var.region

  redis_version     = "REDIS_7_0"
  display_name      = "Flow Redis Cache"
  authorized_network = google_compute_network.flow_vpc.id

  depends_on = [google_project_service.required_apis]
}

# VPC Network
resource "google_compute_network" "flow_vpc" {
  name                    = "flow-vpc-${var.environment}"
  auto_create_subnetworks = false
  routing_mode           = "REGIONAL"
}

# Subnet
resource "google_compute_subnetwork" "flow_subnet" {
  name          = "flow-subnet-${var.environment}"
  ip_cidr_range = "10.0.0.0/24"
  region        = var.region
  network       = google_compute_network.flow_vpc.id

  private_ip_google_access = true
}

# VPC Connector for Cloud Run
resource "google_vpc_access_connector" "flow_connector" {
  name          = "flow-connector-${var.environment}"
  region        = var.region
  ip_cidr_range = "10.8.0.0/28"
  network       = google_compute_network.flow_vpc.name

  depends_on = [google_project_service.required_apis]
}

# Cloud Storage bucket for static assets
resource "google_storage_bucket" "flow_assets" {
  name          = "flow-assets-${var.environment}-${random_id.bucket_suffix.hex}"
  location      = var.region
  storage_class = "STANDARD"

  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition {
      age = 30
    }
    action {
      type = "Delete"
    }
  }

  cors {
    origin          = ["*"]
    method          = ["GET", "HEAD", "PUT", "POST", "DELETE"]
    response_header = ["*"]
    max_age_seconds = 3600
  }
}

# Random ID for bucket suffix
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# Secret Manager secrets
resource "google_secret_manager_secret" "database_url" {
  secret_id = "database-url-${var.environment}"

  replication {
    auto {}
  }

  depends_on = [google_project_service.required_apis]
}

resource "google_secret_manager_secret_version" "database_url" {
  secret      = google_secret_manager_secret.database_url.id
  secret_data = "postgresql://${google_sql_user.flow_user.name}:${random_password.db_password.result}@${google_sql_database_instance.flow_db.private_ip_address}:5432/${google_sql_database.flow_database.name}?sslmode=require"
}

resource "google_secret_manager_secret" "redis_host" {
  secret_id = "redis-host-${var.environment}"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "redis_host" {
  secret      = google_secret_manager_secret.redis_host.id
  secret_data = google_redis_instance.flow_redis.host
}

resource "google_secret_manager_secret" "redis_password" {
  secret_id = "redis-password-${var.environment}"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "redis_password" {
  secret      = google_secret_manager_secret.redis_password.id
  secret_data = google_redis_instance.flow_redis.auth_string
}

resource "google_secret_manager_secret" "jwt_secret" {
  secret_id = "jwt-secret-${var.environment}"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "jwt_secret" {
  secret      = google_secret_manager_secret.jwt_secret.id
  secret_data = random_password.jwt_secret.result
}

# Random JWT secret
resource "random_password" "jwt_secret" {
  length  = 64
  special = true
}

# Firebase secrets (if using Firebase)
resource "google_secret_manager_secret" "firebase_project_id" {
  secret_id = "firebase-project-id-${var.environment}"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "firebase_project_id" {
  secret      = google_secret_manager_secret.firebase_project_id.id
  secret_data = var.project_id
}

# Service Account for Cloud Run
resource "google_service_account" "flow_service_account" {
  account_id   = "flow-service-${var.environment}"
  display_name = "Flow Service Account"
  description  = "Service account for Flow Cloud Run service"
}

# IAM bindings for service account
resource "google_project_iam_member" "flow_service_account_permissions" {
  for_each = toset([
    "roles/cloudsql.client",
    "roles/secretmanager.secretAccessor",
    "roles/storage.objectViewer",
    "roles/logging.logWriter",
    "roles/monitoring.metricWriter",
    "roles/errorreporting.writer"
  ])

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.flow_service_account.email}"
}

# Cloud Run service
resource "google_cloud_run_v2_service" "flow_api" {
  name     = "flow-api-${var.environment}"
  location = var.region

  template {
    service_account = google_service_account.flow_service_account.email
    
    scaling {
      min_instance_count = var.environment == "production" ? 1 : 0
      max_instance_count = var.environment == "production" ? 20 : 5
    }

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.flow_repo.repository_id}/flow-api:latest"
      
      ports {
        container_port = 8080
      }

      env {
        name  = "NODE_ENV"
        value = var.environment
      }

      env {
        name  = "PORT"
        value = "8080"
      }

      env {
        name  = "HOST"
        value = "0.0.0.0"
      }

      resources {
        limits = {
          cpu    = var.environment == "production" ? "2" : "1"
          memory = var.environment == "production" ? "2Gi" : "1Gi"
        }
      }
    }

    vpc_access {
      connector = google_vpc_access_connector.flow_connector.id
      egress    = "PRIVATE_RANGES_ONLY"
    }
  }

  traffic {
    percent = 100
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
  }

  depends_on = [google_project_service.required_apis]
}

# Allow unauthenticated access to Cloud Run
resource "google_cloud_run_service_iam_member" "flow_api_public_access" {
  location = google_cloud_run_v2_service.flow_api.location
  service  = google_cloud_run_v2_service.flow_api.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Cloud Scheduler for periodic jobs
resource "google_cloud_scheduler_job" "flow_cleanup_job" {
  count       = var.environment == "production" ? 1 : 0
  name        = "flow-cleanup-job"
  description = "Periodic cleanup job for Flow"
  schedule    = "0 2 * * *" # Daily at 2 AM
  time_zone   = "UTC"

  http_target {
    http_method = "POST"
    uri         = "${google_cloud_run_v2_service.flow_api.uri}/api/v1/jobs/cleanup"
    
    headers = {
      "Content-Type" = "application/json"
    }

    body = base64encode(jsonencode({
      job_type = "cleanup"
    }))
  }

  depends_on = [google_project_service.required_apis]
}

# Monitoring and alerting
resource "google_monitoring_notification_channel" "email" {
  count        = var.environment == "production" ? 1 : 0
  display_name = "Email Notification Channel"
  type         = "email"
  
  labels = {
    email_address = "admin@flow.com" # Replace with actual email
  }
}

resource "google_monitoring_alert_policy" "flow_api_uptime" {
  count        = var.environment == "production" ? 1 : 0
  display_name = "Flow API Uptime Alert"
  combiner     = "OR"

  conditions {
    display_name = "API Service Down"
    
    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"${google_cloud_run_v2_service.flow_api.name}\""
      duration        = "300s"
      comparison      = "COMPARISON_LT"
      threshold_value = 0.95

      aggregations {
        alignment_period   = "300s"
        per_series_aligner = "ALIGN_RATE"
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.email[0].id]

  alert_strategy {
    auto_close = "1800s"
  }
}

# Outputs
output "cloud_run_url" {
  description = "URL of the Cloud Run service"
  value       = google_cloud_run_v2_service.flow_api.uri
}

output "database_connection_name" {
  description = "Connection name for Cloud SQL"
  value       = google_sql_database_instance.flow_db.connection_name
}

output "redis_host" {
  description = "Redis host"
  value       = google_redis_instance.flow_redis.host
}

output "artifact_registry_repository" {
  description = "Artifact Registry repository"
  value       = google_artifact_registry_repository.flow_repo.name
}

output "service_account_email" {
  description = "Service account email"
  value       = google_service_account.flow_service_account.email
}
