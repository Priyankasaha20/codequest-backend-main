#!/usr/bin/env bash

# prod.sh - spin up production services with Docker Compose
set -e

# Navigate to project root
cd "$(dirname "${BASH_SOURCE[0]}")/.."

echo "Building and starting production containers..."
docker-compose up -d --build

echo "All production services are up and running."
echo "MongoDB: mongodb://localhost:27017"
echo "MinIO Console: http://localhost:9001"
echo "API: http://localhost:5000"