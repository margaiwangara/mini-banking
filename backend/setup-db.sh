#!/bin/bash

# Script to set up the database after Docker containers are running

echo "🔍 Checking if Docker containers are running..."

# Check if postgres container is running
if ! docker ps --format '{{.Names}}' | grep -q "banking-postgres"; then
    echo "❌ PostgreSQL container is not running"
    echo "📦 Starting Docker Compose services..."
    docker-compose up -d
    echo "⏳ Waiting for services to be ready..."
    sleep 5
fi

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until docker exec banking-postgres pg_isready -U postgres > /dev/null 2>&1; do
    echo "   Waiting for PostgreSQL..."
    sleep 2
done

echo "✅ PostgreSQL is ready!"

# Check if database exists
DB_EXISTS=$(docker exec banking-postgres psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='banking'" 2>/dev/null)

if [ "$DB_EXISTS" != "1" ]; then
    echo "📝 Database 'banking' does not exist, creating it..."
    docker exec banking-postgres psql -U postgres -c "CREATE DATABASE banking;"
    echo "✅ Database 'banking' created!"
else
    echo "✅ Database 'banking' already exists"
fi

echo ""
echo "🎉 Database setup complete!"
echo "📋 Next steps:"
echo "   1. Run migrations (creates users and other tables): npm run migration:run"
echo "   2. Make sure JWT_SECRET is set in your .env file"
echo "   3. Start the server: npm run start:dev"
