#!/bin/sh
set -e

# Wait for database to be ready
node wait-for-db.js

# Push database schema changes
echo "Synchronizing database schema..."
./dev_node_modules/.bin/drizzle-kit push

# Seed database with default admin/tester if not already present
echo "Running database seed..."
./dev_node_modules/.bin/tsx src/db/seed.ts

# Start application
echo "Starting application..."
exec "$@"
