#!/bin/bash

# Database Reset Script for Koepon
# This script resets the database by dropping and recreating it

set -e

echo "🗃️  Resetting Koepon database..."

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

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v ^# | xargs)
fi

DATABASE_NAME=${DATABASE_NAME:-koepon}
DATABASE_USERNAME=${DATABASE_USERNAME:-postgres}

# Check if PostgreSQL container is running
if ! docker-compose ps postgres | grep -q "Up"; then
    print_error "PostgreSQL container is not running. Please start it first:"
    echo "  docker-compose up -d postgres"
    exit 1
fi

# Confirm reset
echo ""
print_warning "This will completely reset the '$DATABASE_NAME' database!"
print_warning "All data will be lost!"
echo ""
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_status "Database reset cancelled"
    exit 0
fi

print_status "Stopping application container if running..."
docker-compose stop app 2>/dev/null || true

print_status "Dropping existing database..."
docker-compose exec -T postgres psql -U $DATABASE_USERNAME -c "DROP DATABASE IF EXISTS $DATABASE_NAME;"

print_status "Creating new database..."
docker-compose exec -T postgres psql -U $DATABASE_USERNAME -c "CREATE DATABASE $DATABASE_NAME;"

print_status "Running database schema..."
docker-compose exec -T postgres psql -U $DATABASE_USERNAME -d $DATABASE_NAME -f /docker-entrypoint-initdb.d/01-init.sql

print_status "Running seed data..."
for seed_file in $(docker-compose exec -T postgres find /docker-entrypoint-initdb.d/seeds -name "*.sql" 2>/dev/null | sort); do
    if [ -n "$seed_file" ]; then
        print_status "Running seed: $(basename $seed_file)"
        docker-compose exec -T postgres psql -U $DATABASE_USERNAME -d $DATABASE_NAME -f "$seed_file"
    fi
done

print_status "Verifying database structure..."
tables=$(docker-compose exec -T postgres psql -U $DATABASE_USERNAME -d $DATABASE_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
print_success "Database reset complete! Found $tables tables."

print_status "You can now start the application:"
echo "  npm run dev"

echo ""
print_success "Database reset completed successfully! 🎉"