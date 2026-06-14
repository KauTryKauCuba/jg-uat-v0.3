#!/bin/sh
set -e

# Wait for database to be ready
node wait-for-db.js

# Apply database migrations
echo "Applying database migrations..."
npx drizzle-kit migrate

# Seed database with default admin/tester if not already present
echo "Running database seed..."
npm run db:seed

# Start application
echo "Starting application..."
exec "$@"
