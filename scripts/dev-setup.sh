#!/bin/bash

# Koepon Development Environment Setup Script
# This script sets up the development environment for Koepon

set -e

echo "🚀 Setting up Koepon development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

print_success "Docker is running"

# Check if docker-compose is available
if ! command -v docker-compose >/dev/null 2>&1; then
    print_error "docker-compose is not installed. Please install Docker Compose."
    exit 1
fi

print_success "docker-compose is available"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    print_status "Creating .env file from template..."
    cp .env.development .env
    print_success ".env file created"
else
    print_warning ".env file already exists, skipping creation"
fi

# Create logs directory
print_status "Creating logs directory..."
mkdir -p logs
print_success "Logs directory created"

# Stop any existing containers
print_status "Stopping existing containers..."
docker-compose down --remove-orphans || true

# Build and start containers
print_status "Building and starting containers..."
docker-compose up -d --build postgres redis

# Wait for PostgreSQL to be ready
print_status "Waiting for PostgreSQL to be ready..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if docker-compose exec -T postgres pg_isready -U postgres >/dev/null 2>&1; then
        print_success "PostgreSQL is ready"
        break
    fi
    
    attempt=$((attempt + 1))
    echo -n "."
    sleep 1
done

if [ $attempt -eq $max_attempts ]; then
    print_error "PostgreSQL failed to start within 30 seconds"
    exit 1
fi

# Wait for Redis to be ready
print_status "Waiting for Redis to be ready..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if docker-compose exec -T redis redis-cli ping >/dev/null 2>&1; then
        print_success "Redis is ready"
        break
    fi
    
    attempt=$((attempt + 1))
    echo -n "."
    sleep 1
done

if [ $attempt -eq $max_attempts ]; then
    print_error "Redis failed to start within 30 seconds"
    exit 1
fi

# Install Node.js dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing Node.js dependencies..."
    npm install
    print_success "Dependencies installed"
fi

# Test database connection
print_status "Testing database connection..."
if docker-compose exec -T postgres psql -U postgres -d koepon -c "SELECT 1;" >/dev/null 2>&1; then
    print_success "Database connection test passed"
else
    print_warning "Database connection test failed, but containers are running"
fi

# Display status
echo ""
echo "🎉 Development environment setup complete!"
echo ""
echo "Services running:"
echo "  • PostgreSQL: localhost:5432"
echo "  • Redis: localhost:6379"
echo ""
echo "Management tools (optional):"
echo "  • PgAdmin: http://localhost:5050 (start with: docker-compose --profile tools up -d)"
echo "  • Redis Commander: http://localhost:8081"
echo ""
echo "To start the application:"
echo "  npm run dev"
echo ""
echo "To stop the development environment:"
echo "  docker-compose down"
echo ""
echo "To view logs:"
echo "  docker-compose logs -f postgres redis"