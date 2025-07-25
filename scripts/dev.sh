#!/usr/bin/env bash

# MongoDB
all="$(docker ps -a -q -f name=codequest-mongo)"
running="$(docker ps -q -f name=codequest-mongo)"
if [ -z "$all" ]; then
  echo "Creating and starting MongoDB container..."
  docker run -d \
    --name codequest-mongo \
    -p 27017:27017 \
    -e MONGO_INITDB_DATABASE=codequest \
    -e MONGO_INITDB_ROOT_USERNAME=your_root_username \
    -e MONGO_INITDB_ROOT_PASSWORD=your_root_password \
    -v codequest-mongo-data:/data/db \
    mongo:latest
elif [ -z "$running" ]; then
  echo "Starting stopped MongoDB container..."
  docker start codequest-mongo
else
  echo "MongoDB container already running"
fi


# MinIO
all="$(docker ps -a -q -f name=codequest-minio)"
running="$(docker ps -q -f name=codequest-minio)"
if [ -z "$all" ]; then
  echo "Creating and starting MinIO container..."
  docker run -d \
    --name codequest-minio \
    -p 9000:9000 \
    -p 9001:9001 \
    -e MINIO_ROOT_USER=minioadmin \
    -e MINIO_ROOT_PASSWORD=minioadmin \
    -v codequest-minio-data:/data \
    minio/minio:latest \
    server /data --console-address ":9001"
elif [ -z "$running" ]; then
  echo "Starting stopped MinIO container..."
  docker start codequest-minio
else
  echo "MinIO container already running"
fi

echo "Containers launched."
echo "MongoDB available at mongodb://localhost:27017"
echo "MinIO console available at http://localhost:9001 and API at http://localhost:9000"

# PostgreSQL
all_psql="$(docker ps -a -q -f name=codequest-postgres)"
running_psql="$(docker ps -q -f name=codequest-postgres)"
if [ -z "$all_psql" ]; then
  echo "Creating and starting PostgreSQL container..."
  docker run -d \
    --name codequest-postgres \
    -p 5432:5432 \
    -e POSTGRES_USER=your_pg_user \
    -e POSTGRES_PASSWORD=your_pg_password \
    -e POSTGRES_DB=codequest \
    -v codequest-postgres-data:/var/lib/postgresql/data \
    postgres:14
elif [ -z "$running_psql" ]; then
  echo "Starting stopped PostgreSQL container..."
  docker start codequest-postgres
else
  echo "PostgreSQL container already running"
fi
echo "PostgreSQL available at postgresql://your_pg_user:your_pg_password@localhost:5432/codequest"

# Start development server from project root
cd "$(dirname "$0")/.."
echo "Starting development server..."
npm run dev
