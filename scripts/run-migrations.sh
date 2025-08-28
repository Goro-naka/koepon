#!/bin/bash

# Supabase Migration Script
# This script runs the database migrations and inserts test data

echo "====================================="
echo "Running Supabase Database Migrations"
echo "====================================="

# Load environment variables
source .env.supabase

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Supabase CLI is not installed. Installing..."
    npm install -g supabase
fi

# Run migrations
echo "Running migration files..."

# Connect to the database using psql (or you can use supabase db push)
export PGPASSWORD=$SUPABASE_PASSWORD

# Run each migration file
for migration in supabase/migrations/*.sql; do
    if [ -f "$migration" ]; then
        echo "Running migration: $(basename $migration)"
        psql -h $SUPABASE_HOST -p $SUPABASE_PORT -U $SUPABASE_USERNAME -d $SUPABASE_DATABASE -f "$migration"
        if [ $? -eq 0 ]; then
            echo "✅ Successfully ran: $(basename $migration)"
        else
            echo "❌ Failed to run: $(basename $migration)"
            exit 1
        fi
    fi
done

echo "====================================="
echo "All migrations completed successfully!"
echo "====================================="

# Run the test data function
echo "Inserting test data..."
psql -h $SUPABASE_HOST -p $SUPABASE_PORT -U $SUPABASE_USERNAME -d $SUPABASE_DATABASE -c "SELECT insert_test_data();"

if [ $? -eq 0 ]; then
    echo "✅ Test data inserted successfully!"
else
    echo "❌ Failed to insert test data"
    exit 1
fi

echo "====================================="
echo "Database setup complete!"
echo "====================================="