# Quick Start Guide

Get Shawdy Banking Platform up and running in minutes!

## Automated Setup (Recommended)

```bash
# Run the setup script
./setup.sh
```

This will:
- ✅ Install all dependencies
- ✅ Create environment files
- ✅ Start Docker services (PostgreSQL & Redis)
- ✅ Create database and run migrations
- ✅ Generate JWT secret

## Manual Setup

### 1. Backend Setup

```bash
cd api

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Generate JWT secret and add to .env
echo "JWT_SECRET=$(openssl rand -base64 32)" >> .env
echo "JWT_EXPIRES_IN=7d" >> .env

# Start Docker services
docker-compose up -d

# Wait for services, then run migrations
npm run migration:run

# Start server
npm run start:dev
```

### 2. Frontend Setup

```bash
cd ui

# Install dependencies
npm install

# Create .env.local
cp .env.example .env.local

# Start dev server
npm run dev
```

## First Steps

### 1. Register a User

```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

Save the `access_token` from the response.

### 3. Create an Account

```bash
curl -X POST http://localhost:3001/accounts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "currency": "USD",
    "name": "My Savings Account"
  }'
```

### 4. Access the Frontend

Open http://localhost:3000 in your browser.

## Troubleshooting

### Database connection errors
- Make sure Docker containers are running: `docker-compose ps`
- Check database exists: `docker exec shawdy-postgres psql -U postgres -l`

### JWT errors
- Make sure `JWT_SECRET` is set in `.env`
- Generate a new secret: `openssl rand -base64 32`

### Migration errors
- Drop and recreate database: `docker exec shawdy-postgres psql -U postgres -c "DROP DATABASE shawdy; CREATE DATABASE shawdy;"`
- Run migrations again: `npm run migration:run`

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Check [API README](api/README.md) for backend details
- Explore the API endpoints at http://localhost:3001
