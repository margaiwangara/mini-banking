#!/bin/bash

# Create .env.example files for api and ui
# Note: If this script fails due to permissions, create the files manually using the commands in README.md

echo "Creating .env.example files..."

# Backend .env.example
if [ ! -f "api/.env.example" ]; then
  cat > api/.env.example << 'EOF'
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
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
EOF
  echo "✅ Created api/.env.example"
else
  echo "⚠️  api/.env.example already exists"
fi

# Frontend .env.example
if [ ! -f "ui/.env.example" ]; then
  cat > ui/.env.example << 'EOF'
# API Base URL
NEXT_PUBLIC_API_URL=http://localhost:3001
EOF
  echo "✅ Created ui/.env.example"
else
  echo "⚠️  ui/.env.example already exists"
fi

echo ""
echo "📝 Next steps:"
echo "   - cd api && cp .env.example .env && edit .env with your database credentials"
echo "   - cd ui && cp .env.example .env.local"
