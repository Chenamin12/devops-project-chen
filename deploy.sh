#!/bin/bash
# Deployment script for EC2
# This script will be executed on the EC2 instance via GitHub Actions

set -e  # Exit on error

echo "🚀 Starting deployment..."

# Check and install Docker if not present
echo "🔍 Checking for Docker installation..."
if ! command -v docker &> /dev/null; then
    echo "📦 Docker not found. Installing Docker..."
    
    # Update package index
    sudo apt-get update
    
    # Install prerequisites
    sudo apt-get install -y \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    
    # Add Docker's official GPG key
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    
    # Set up the repository
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker Engine
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Add current user to docker group (optional, for running without sudo)
    sudo usermod -aG docker $USER
    
    echo "✅ Docker installed successfully"
else
    echo "✅ Docker is already installed"
    docker --version
fi

# Check and install Docker Compose if not present (fallback for older systems)
if ! command -v docker-compose &> /dev/null; then
    if command -v docker &> /dev/null && docker compose version &> /dev/null; then
        echo "✅ Docker Compose v2 (plugin) is available"
        # Create alias if needed
        if ! command -v docker-compose &> /dev/null; then
            echo "Creating docker-compose alias..."
            sudo ln -sf $(which docker) /usr/local/bin/docker-compose || true
        fi
    else
        echo "📦 Docker Compose not found. Installing Docker Compose..."
        # Install docker-compose standalone if needed
        sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
        echo "✅ Docker Compose installed successfully"
    fi
else
    echo "✅ Docker Compose is already installed"
    docker-compose --version
fi

# Ensure Docker daemon is running
echo "🔧 Ensuring Docker daemon is running..."
sudo systemctl start docker || true
sudo systemctl enable docker || true

# Determine if we need sudo for docker commands
DOCKER_CMD="docker"
if ! docker ps &> /dev/null; then
    echo "⚠️  Docker requires sudo privileges. Using sudo for docker commands."
    DOCKER_CMD="sudo docker"
fi

# Helper function to run docker-compose commands (works with both v1 and v2)
docker_compose() {
    if command -v docker-compose &> /dev/null; then
        if [ "$DOCKER_CMD" = "sudo docker" ]; then
            sudo docker-compose "$@"
        else
            docker-compose "$@"
        fi
    elif $DOCKER_CMD compose version &> /dev/null 2>&1; then
        $DOCKER_CMD compose "$@"
    else
        echo "❌ Error: Neither docker-compose nor docker compose is available"
        exit 1
    fi
}

# Login to Docker Hub
echo "📦 Logging in to Docker Hub..."
echo "$DOCKER_TOKEN" | $DOCKER_CMD login -u "$DOCKER_USERNAME" --password-stdin

# Pull latest images
echo "⬇️ Pulling latest images..."
$DOCKER_CMD pull "$DOCKER_USERNAME/shopping-list-api:latest" || echo "⚠️  Failed to pull API image, will use existing"
$DOCKER_CMD pull "$DOCKER_USERNAME/shopping-list-client:latest" || echo "⚠️  Failed to pull client image, will use existing"

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
docker_compose down || true

# Start services
echo "🚀 Starting services..."
docker_compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to start..."
sleep 10

# Check service status
echo "📊 Service status:"
docker_compose ps

# Show logs
echo "📋 Recent logs:"
docker_compose logs --tail=50

echo "✅ Deployment completed successfully!"
echo "🌐 Application should be available at http://$(curl -s ifconfig.me)"

