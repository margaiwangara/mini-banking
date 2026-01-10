#!/bin/bash

# Complete setup script for Shawdy Banking Platform
# This script sets up both backend and frontend

set -e

echo "🚀 Setting up Shawdy Banking Platform..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Setup backend
echo "📦 Setting up backend..."
cd api

# Install dependencies
if [ ! -d "node_modules" ]; then
    echo "   Installing npm dependencies..."
    npm install
else
    echo "   Dependencies already installed"
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "   Creating .env file..."
    cat > .env << 'EOF'
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=shawdy

# Redis Configuration (optional - falls back to in-memory cache if not available)
REDIS_HOST=localhost
REDIS_PORT=6379

# Server Configuration
PORT=3001
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# JWT Configuration
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=7d
EOF
    echo "   ✅ Created .env file with generated JWT_SECRET"
    echo "   ⚠️  Please review and update .env file if needed"
else
    echo "   .env file already exists"
fi

# Start Docker services
echo "   Starting Docker services (PostgreSQL and Redis)..."
docker-compose up -d

# Wait for PostgreSQL
echo "   Waiting for PostgreSQL to be ready..."
sleep 5
until docker exec shawdy-postgres pg_isready -U postgres > /dev/null 2>&1; do
    echo "      Waiting for PostgreSQL..."
    sleep 2
done

# Create database if it doesn't exist
DB_EXISTS=$(docker exec shawdy-postgres psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='shawdy'" 2>/dev/null || echo "0")
if [ "$DB_EXISTS" != "1" ]; then
    echo "   Creating database..."
    docker exec shawdy-postgres psql -U postgres -c "CREATE DATABASE shawdy;" > /dev/null 2>&1
    echo "   ✅ Database created"
else
    echo "   ✅ Database already exists"
fi

# Run migrations
echo "   Running database migrations..."
npm run migration:run || echo "   ⚠️  Migration failed - you may need to run it manually"

echo "   ✅ Backend setup complete!"
echo ""

# Setup frontend
echo "📦 Setting up frontend..."
cd ../ui

# Install dependencies
if [ ! -d "node_modules" ]; then
    echo "   Installing npm dependencies..."
    npm install
else
    echo "   Dependencies already installed"
fi

# Create .env.local file if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo "   Creating .env.local file..."
    cat > .env.local << 'EOF'
# API Base URL
NEXT_PUBLIC_API_URL=http://localhost:3001
EOF
    echo "   ✅ Created .env.local file"
else
    echo "   .env.local file already exists"
fi

echo "   ✅ Frontend setup complete!"
echo ""

cd ..

echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Start backend:  cd api && npm run start:dev"
echo "   2. Start frontend: cd ui && npm run dev"
echo ""
echo "🔐 Authentication:"
echo "   - Register: POST http://localhost:3001/auth/register"
echo "   - Login:    POST http://localhost:3001/auth/login"
echo "   - Use the JWT token in Authorization header for protected endpoints"
echo ""
echo "📚 See README.md for more details"
