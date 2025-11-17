#!/bin/bash

# Database Backup Script
# Data Aggregator Platform

set -e  # Exit on error

# ==========================================================================
# Configuration
# ==========================================================================

# Load environment variables
if [ -f ".env.production" ]; then
    source .env.production
fi

# Backup configuration
BACKUP_DIR=${BACKUP_DIR:-"/var/backups/dataaggregator"}
BACKUP_RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILENAME="dataaggregator_${ENVIRONMENT}_${TIMESTAMP}.sql.gz"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILENAME}"

# S3 configuration (optional)
S3_BACKUP_ENABLED=${S3_BACKUP_ENABLED:-false}
S3_BUCKET=${BACKUP_S3_BUCKET:-""}

# Notification
SLACK_WEBHOOK=${SLACK_WEBHOOK_URL:-""}

# ==========================================================================
# Functions
# ==========================================================================

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

send_notification() {
    local status=$1
    local message=$2

    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -X POST "$SLACK_WEBHOOK" \
            -H 'Content-Type: application/json' \
            -d "{\"text\": \"Database Backup $status\", \"blocks\": [{\"type\": \"section\", \"text\": {\"type\": \"mrkdwn\", \"text\": \"*Database Backup $status*\n$message\"}}]}"
    fi
}

cleanup_old_backups() {
    log "Cleaning up backups older than $BACKUP_RETENTION_DAYS days..."

    find "$BACKUP_DIR" -name "dataaggregator_*.sql.gz" -type f -mtime +$BACKUP_RETENTION_DAYS -delete

    log "Cleanup completed"
}

# ==========================================================================
# Main Backup Process
# ==========================================================================

log "Starting database backup..."

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Database connection details
PGHOST=${POSTGRES_HOST:-localhost}
PGPORT=${POSTGRES_PORT:-5432}
PGDATABASE=${POSTGRES_DB:-dataaggregator}
PGUSER=${POSTGRES_USER:-postgres}
PGPASSWORD=${POSTGRES_PASSWORD}

# Export password for pg_dump
export PGPASSWORD

# Create backup
log "Creating backup: $BACKUP_FILENAME"

pg_dump \
    --host="$PGHOST" \
    --port="$PGPORT" \
    --username="$PGUSER" \
    --dbname="$PGDATABASE" \
    --format=custom \
    --compress=9 \
    --verbose \
    --file="$BACKUP_PATH.tmp"

# Verify backup was created
if [ ! -f "$BACKUP_PATH.tmp" ]; then
    log "ERROR: Backup file was not created"
    send_notification "Failed" "Backup file was not created"
    exit 1
fi

# Move to final location
mv "$BACKUP_PATH.tmp" "$BACKUP_PATH"

# Get backup size
BACKUP_SIZE=$(du -h "$BACKUP_PATH" | cut -f1)

log "Backup created successfully: $BACKUP_FILENAME (Size: $BACKUP_SIZE)"

# Upload to S3 if enabled
if [ "$S3_BACKUP_ENABLED" = true ] && [ -n "$S3_BUCKET" ]; then
    log "Uploading backup to S3..."

    aws s3 cp "$BACKUP_PATH" "s3://${S3_BUCKET}/backups/${BACKUP_FILENAME}" \
        --storage-class STANDARD_IA \
        --server-side-encryption AES256

    if [ $? -eq 0 ]; then
        log "Backup uploaded to S3 successfully"
    else
        log "ERROR: Failed to upload backup to S3"
        send_notification "Warning" "Local backup created but S3 upload failed"
    fi
fi

# Cleanup old backups
cleanup_old_backups

# Send success notification
send_notification "Successful" "Database: $PGDATABASE\nSize: $BACKUP_SIZE\nFile: $BACKUP_FILENAME"

log "Backup process completed successfully"

# ==========================================================================
# Backup Verification
# ==========================================================================

log "Verifying backup integrity..."

pg_restore --list "$BACKUP_PATH" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    log "Backup verification successful"
else
    log "WARNING: Backup verification failed"
    send_notification "Warning" "Backup created but verification failed"
fi

exit 0
