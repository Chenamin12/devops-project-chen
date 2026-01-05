#!/bin/bash
# Deployment script for EC2
# This script will be executed on the EC2 instance via GitHub Actions

set -e  # Exit on error

echo "🚀 Starting deployment..."

# Login to Docker Hub
echo "📦 Logging in to Docker Hub..."
echo "$DOCKER_TOKEN" | docker login -u "$DOCKER_USERNAME" --password-stdin

# Pull latest images
echo "⬇️ Pulling latest images..."
docker pull "$DOCKER_USERNAME/shopping-list-api:latest" || echo "⚠️  Failed to pull API image, will use existing"
docker pull "$DOCKER_USERNAME/shopping-list-client:latest" || echo "⚠️  Failed to pull client image, will use existing"

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p ~/shopping-list-app
cd ~/shopping-list-app

# Create .env file from GitHub Secrets
echo "📝 Creating .env file from GitHub Secrets..."

# Set defaults if not provided (for backward compatibility)
MONGO_ROOT_USERNAME=${MONGO_ROOT_USERNAME:-admin}
MONGO_ROOT_PASSWORD=${MONGO_ROOT_PASSWORD:-password123}
MONGO_DATABASE=${MONGO_DATABASE:-shopping_list_db}
JWT_SECRET=${JWT_SECRET:-your-super-secret-jwt-key-change-this-in-production}
JWT_EXPIRE=${JWT_EXPIRE:-7d}
MONGO_EXPRESS_USERNAME=${MONGO_EXPRESS_USERNAME:-admin}
MONGO_EXPRESS_PASSWORD=${MONGO_EXPRESS_PASSWORD:-admin123}
UPLOAD_PATH=${UPLOAD_PATH:-./uploads}
MAX_FILE_SIZE=${MAX_FILE_SIZE:-5242880}

# Build MONGO_URI from components
MONGO_URI="mongodb://${MONGO_ROOT_USERNAME}:${MONGO_ROOT_PASSWORD}@mongodb:27017/${MONGO_DATABASE}?authSource=admin"

# Create .env file
cat > .env << EOF
PORT=3000
NODE_ENV=production

# MongoDB Configuration
MONGO_URI=${MONGO_URI}
MONGO_DATABASE=${MONGO_DATABASE}
MONGO_ROOT_USERNAME=${MONGO_ROOT_USERNAME}
MONGO_ROOT_PASSWORD=${MONGO_ROOT_PASSWORD}

# Mongo Express Configuration
MONGO_EXPRESS_USERNAME=${MONGO_EXPRESS_USERNAME}
MONGO_EXPRESS_PASSWORD=${MONGO_EXPRESS_PASSWORD}

# JWT Configuration
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRE=${JWT_EXPIRE}

# File Upload Configuration
UPLOAD_PATH=${UPLOAD_PATH}
MAX_FILE_SIZE=${MAX_FILE_SIZE}
EOF

echo "✅ .env file created successfully from GitHub Secrets"

# Create nginx.conf for production
echo "📝 Creating nginx.conf..."
cat > nginx.conf << 'NGINX_EOF'
events {
    worker_connections 1024;
}

http {
    # Upstream configuration for load balancing
    upstream node_backend {
        # Round-robin load balancing (default)
        server api1:3000;
        server api2:3000;
        server api3:3000;
    }

    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    server {
        listen 80;
        server_name localhost;

        # Increase body size for file uploads
        client_max_body_size 10M;

        # Proxy settings
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Health check endpoint
        location /api/health {
            proxy_pass http://node_backend;
            proxy_connect_timeout 5s;
            proxy_read_timeout 5s;
        }

        # API routes
        location /api {
            proxy_pass http://node_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_cache_bypass $http_upgrade;
        }

        # Static files (uploads)
        location /uploads {
            proxy_pass http://node_backend;
        }

        # All other routes (frontend) - serve from client container
        location / {
            proxy_pass http://client:80/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
NGINX_EOF

# Create docker-compose.yml for production
echo "🐳 Creating docker-compose.yml..."
cat > docker-compose.yml << 'EOF'
version: "3.9"

services:
  api1:
    image: ${DOCKER_USERNAME}/shopping-list-api:latest
    container_name: shopping-list-api-1
    restart: unless-stopped
    env_file:
      - .env
    environment:
      - MONGO_URI=mongodb://${MONGO_ROOT_USERNAME:-admin}:${MONGO_ROOT_PASSWORD:-password123}@mongodb:27017/${MONGO_DATABASE:-shopping_list_db}?authSource=admin
      - PORT=3000
      - NODE_ENV=production
    volumes:
      - ./uploads:/usr/src/app/uploads
    depends_on:
      - mongodb
    networks:
      - shopping-list-network

  api2:
    image: ${DOCKER_USERNAME}/shopping-list-api:latest
    container_name: shopping-list-api-2
    restart: unless-stopped
    env_file:
      - .env
    environment:
      - MONGO_URI=mongodb://${MONGO_ROOT_USERNAME:-admin}:${MONGO_ROOT_PASSWORD:-password123}@mongodb:27017/${MONGO_DATABASE:-shopping_list_db}?authSource=admin
      - PORT=3000
      - NODE_ENV=production
    volumes:
      - ./uploads:/usr/src/app/uploads
    depends_on:
      - mongodb
    networks:
      - shopping-list-network

  api3:
    image: ${DOCKER_USERNAME}/shopping-list-api:latest
    container_name: shopping-list-api-3
    restart: unless-stopped
    env_file:
      - .env
    environment:
      - MONGO_URI=mongodb://${MONGO_ROOT_USERNAME:-admin}:${MONGO_ROOT_PASSWORD:-password123}@mongodb:27017/${MONGO_DATABASE:-shopping_list_db}?authSource=admin
      - PORT=3000
      - NODE_ENV=production
    volumes:
      - ./uploads:/usr/src/app/uploads
    depends_on:
      - mongodb
    networks:
      - shopping-list-network

  client:
    image: ${DOCKER_USERNAME}/shopping-list-client:latest
    container_name: shopping-list-client
    restart: unless-stopped
    networks:
      - shopping-list-network

  nginx:
    image: nginx:alpine
    container_name: shopping-list-nginx
    restart: unless-stopped
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - api1
      - api2
      - api3
      - client
    networks:
      - shopping-list-network

  mongodb:
    image: mongo:7.0
    container_name: shopping-list-mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USERNAME}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
      MONGO_INITDB_DATABASE: ${MONGO_DATABASE}
    volumes:
      - mongodb_data:/data/db
    networks:
      - shopping-list-network

  mongo-express:
    image: mongo-express:1.0.2
    container_name: shopping-list-mongo-express
    restart: unless-stopped
    ports:
      - "8081:8081"
    environment:
      ME_CONFIG_MONGODB_ADMINUSERNAME: ${MONGO_ROOT_USERNAME}
      ME_CONFIG_MONGODB_ADMINPASSWORD: ${MONGO_ROOT_PASSWORD}
      ME_CONFIG_MONGODB_URL: mongodb://${MONGO_ROOT_USERNAME}:${MONGO_ROOT_PASSWORD}@mongodb:27017/
      ME_CONFIG_BASICAUTH_USERNAME: ${MONGO_EXPRESS_USERNAME}
      ME_CONFIG_BASICAUTH_PASSWORD: ${MONGO_EXPRESS_PASSWORD}
    depends_on:
      - mongodb
    networks:
      - shopping-list-network

volumes:
  mongodb_data:

networks:
  shopping-list-network:
    driver: bridge
EOF

# Export DOCKER_USERNAME for docker-compose
export DOCKER_USERNAME

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down || true

# Start services
echo "🚀 Starting services..."
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to start..."
sleep 10

# Check service status
echo "📊 Service status:"
docker-compose ps

# Show logs
echo "📋 Recent logs:"
docker-compose logs --tail=50

echo "✅ Deployment completed successfully!"
echo "🌐 Application should be available at http://$(curl -s ifconfig.me)"

