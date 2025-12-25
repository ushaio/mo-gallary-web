#!/bin/sh

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Run seed (only creates if not exists)
echo "Running database seed..."
npx prisma db seed

# Start the application
echo "Starting application..."
exec node server.js
