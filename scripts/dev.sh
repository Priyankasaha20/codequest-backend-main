#!/usr/bin/env bash

# Spin up MongoDB container
# Usage: ./spinup.sh

echo "Starting MongoDB..."
docker run -d \
  --name codequest-mongo \
  -p 27017:27017 \
  -e MONGO_INITDB_DATABASE=codequest \
  -e MONGO_INITDB_ROOT_USERNAME=your_root_username \
  -e MONGO_INITDB_ROOT_PASSWORD=your_root_password \
  -v codequest-mongo-data:/data/db \
  mongo:latest

# Spin up MinIO container
echo "Starting MinIO..."
docker run -d \
  --name codequest-minio \
  -p 9000:9000 \
  -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  -v codequest-minio-data:/data \
  minio/minio:latest \
  server /data --console-address ":9001"

echo "Containers launched."
echo "MongoDB available at mongodb://localhost:27017"
echo "MinIO console available at http://localhost:9001 and API at http://localhost:9000"

# Start development server from project root
cd "$(dirname "$0")/.."
echo "Starting development server..."
npm run dev
