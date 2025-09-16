# Terraform outputs for Flow infrastructure

output "project_id" {
  description = "The GCP project ID"
  value       = var.project_id
}

output "region" {
  description = "The GCP region"
  value       = var.region
}

output "environment" {
  description = "The environment"
  value       = var.environment
}

# Cloud Run outputs
output "cloud_run_service_name" {
  description = "Name of the Cloud Run service"
  value       = google_cloud_run_v2_service.flow_api.name
}

output "cloud_run_service_url" {
  description = "URL of the Cloud Run service"
  value       = google_cloud_run_v2_service.flow_api.uri
}

output "cloud_run_service_id" {
  description = "ID of the Cloud Run service"
  value       = google_cloud_run_v2_service.flow_api.id
}

# Database outputs
output "database_instance_name" {
  description = "Name of the Cloud SQL instance"
  value       = google_sql_database_instance.flow_db.name
}

output "database_connection_name" {
  description = "Connection name for Cloud SQL"
  value       = google_sql_database_instance.flow_db.connection_name
}

output "database_private_ip" {
  description = "Private IP address of the Cloud SQL instance"
  value       = google_sql_database_instance.flow_db.private_ip_address
}

output "database_name" {
  description = "Name of the database"
  value       = google_sql_database.flow_database.name
}

output "database_user" {
  description = "Database user name"
  value       = google_sql_user.flow_user.name
}

# Redis outputs
output "redis_instance_name" {
  description = "Name of the Redis instance"
  value       = google_redis_instance.flow_redis.name
}

output "redis_host" {
  description = "Redis host"
  value       = google_redis_instance.flow_redis.host
}

output "redis_port" {
  description = "Redis port"
  value       = google_redis_instance.flow_redis.port
}

# Artifact Registry outputs
output "artifact_registry_repository_name" {
  description = "Name of the Artifact Registry repository"
  value       = google_artifact_registry_repository.flow_repo.name
}

output "artifact_registry_repository_url" {
  description = "URL of the Artifact Registry repository"
  value       = google_artifact_registry_repository.flow_repo.name
}

# Storage outputs
output "storage_bucket_name" {
  description = "Name of the Cloud Storage bucket"
  value       = google_storage_bucket.flow_assets.name
}

output "storage_bucket_url" {
  description = "URL of the Cloud Storage bucket"
  value       = google_storage_bucket.flow_assets.url
}

# VPC outputs
output "vpc_name" {
  description = "Name of the VPC"
  value       = google_compute_network.flow_vpc.name
}

output "vpc_id" {
  description = "ID of the VPC"
  value       = google_compute_network.flow_vpc.id
}

output "subnet_name" {
  description = "Name of the subnet"
  value       = google_compute_subnetwork.flow_subnet.name
}

output "vpc_connector_name" {
  description = "Name of the VPC connector"
  value       = google_vpc_access_connector.flow_connector.name
}

# Service Account outputs
output "service_account_email" {
  description = "Email of the service account"
  value       = google_service_account.flow_service_account.email
}

output "service_account_id" {
  description = "ID of the service account"
  value       = google_service_account.flow_service_account.id
}

# Secret Manager outputs
output "database_url_secret_name" {
  description = "Name of the database URL secret"
  value       = google_secret_manager_secret.database_url.secret_id
}

output "redis_host_secret_name" {
  description = "Name of the Redis host secret"
  value       = google_secret_manager_secret.redis_host.secret_id
}

output "redis_password_secret_name" {
  description = "Name of the Redis password secret"
  value       = google_secret_manager_secret.redis_password.secret_id
}

output "jwt_secret_name" {
  description = "Name of the JWT secret"
  value       = google_secret_manager_secret.jwt_secret.secret_id
}

# Monitoring outputs
output "notification_channel_id" {
  description = "ID of the notification channel"
  value       = var.environment == "production" ? google_monitoring_notification_channel.email[0].id : null
}

output "alert_policy_id" {
  description = "ID of the alert policy"
  value       = var.environment == "production" ? google_monitoring_alert_policy.flow_api_uptime[0].id : null
}

# Scheduler outputs
output "scheduler_job_name" {
  description = "Name of the scheduler job"
  value       = var.environment == "production" ? google_cloud_scheduler_job.flow_cleanup_job[0].name : null
}

# Connection strings and URLs
output "database_connection_string" {
  description = "Database connection string"
  value       = "postgresql://${google_sql_user.flow_user.name}:${random_password.db_password.result}@${google_sql_database_instance.flow_db.private_ip_address}:5432/${google_sql_database.flow_database.name}?sslmode=require"
  sensitive   = true
}

output "redis_connection_string" {
  description = "Redis connection string"
  value       = "redis://:${google_redis_instance.flow_redis.auth_string}@${google_redis_instance.flow_redis.host}:${google_redis_instance.flow_redis.port}"
  sensitive   = true
}

# Docker image information
output "docker_image_url" {
  description = "Docker image URL for deployment"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.flow_repo.repository_id}/flow-api"
}

# Health check endpoints
output "health_check_url" {
  description = "Health check URL"
  value       = "${google_cloud_run_v2_service.flow_api.uri}/health"
}

output "api_docs_url" {
  description = "API documentation URL"
  value       = "${google_cloud_run_v2_service.flow_api.uri}/docs"
}

output "openapi_spec_url" {
  description = "OpenAPI specification URL"
  value       = "${google_cloud_run_v2_service.flow_api.uri}/openapi.json"
}
