#!/bin/sh
set -e

# Wait for database to be ready
node wait-for-db.js

# Push database schema changes
echo "Synchronizing database schema..."
npx drizzle-kit push

# Seed database with default admin/tester if not already present
echo "Running database seed..."
npm run db:seed

# Start application
echo "Starting application..."
exec "$@"
