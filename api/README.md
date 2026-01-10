# Shawdy API

Backend API for the Mini Banking Platform built with NestJS.

## Setup

### Option 1: Using Docker Compose (Recommended)

1. Install dependencies:

```bash
npm install
```

2. Start PostgreSQL and Redis with Docker Compose:

```bash
docker-compose up -d
```

This will start:

- PostgreSQL on port `5432`
- Redis on port `6379`

3. Set up environment variables:

```bash
# Create .env.example if it doesn't exist:
cat > .env.example << 'EOF'
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

# Sentry Configuration (optional - for error tracking)
# SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
# SENTRY_TRACES_SAMPLE_RATE=0.1
# SENTRY_PROFILES_SAMPLE_RATE=0.1
EOF

# Copy to .env and edit with your credentials
cp .env.example .env
# Edit .env with your database credentials
```

4. Wait for services to be ready and verify database exists:

```bash
# Check if containers are running
docker-compose ps

# Verify database was created (should show "shawdy" in the list)
docker exec shawdy-postgres psql -U postgres -l

# If database doesn't exist, create it manually:
docker exec shawdy-postgres psql -U postgres -c "CREATE DATABASE shawdy;"

# Or use the setup script:
./setup-db.sh
```

5. Generate JWT secret and add to .env:

```bash
# Generate a secure random secret
openssl rand -base64 32

# Add to .env file:
# JWT_SECRET=<generated-secret>
# JWT_EXPIRES_IN=7d
```

6. Run migrations (creates users table and other tables):

```bash
npm run migration:run
```

7. Start development server:

```bash
npm run start:dev
```

### Option 2: Local PostgreSQL and Redis

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables (same as Option 1, step 3)

3. Start PostgreSQL locally and create database:

```bash
createdb shawdy
```

4. Start Redis locally (if installed)

5. Run migrations:

```bash
npm run migration:run
```

6. Start development server:

```bash
npm run start:dev
```

### Docker Compose Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Stop services and remove volumes (clears data)
docker-compose down -v

# View logs
docker-compose logs -f

# Check service status
docker-compose ps

# Access PostgreSQL CLI
docker exec -it shawdy-postgres psql -U postgres -d shawdy

# Create database manually (if needed)
docker exec shawdy-postgres psql -U postgres -c "CREATE DATABASE shawdy;"
```

### Troubleshooting

**Database doesn't exist error:**

```bash
# Run the setup script
./setup-db.sh

# Or manually create the database
docker exec shawdy-postgres psql -U postgres -c "CREATE DATABASE shawdy;"
```

## Project Structure

```
src/
├── account/          # Account management module
├── transaction/      # Transaction and ledger module
├── exchange/         # Currency exchange module
├── common/           # Shared utilities and errors
├── config/           # Configuration files
└── main.ts           # Application entry point
```

## Key Features

- **JWT Authentication**: Secure user authentication with JWT tokens
- **Password Security**: Passwords hashed with bcrypt
- **Double-Entry Accounting**: All transactions create balanced ledger entries
- **Decimal Precision**: Uses Decimal.js for all financial calculations
- **Row-Level Locking**: Prevents race conditions in concurrent transfers
- **Caching**: Redis or in-memory cache for account balances and recent transactions
- **Transaction Safety**: All operations use database transactions

## Authentication

The API uses JWT (JSON Web Tokens) for authentication:

### Setup

1. Set `JWT_SECRET` in your `.env` file (generate with `openssl rand -base64 32`)
2. Set `JWT_EXPIRES_IN` (default: `7d`)

### Usage

1. **Register**: `POST /auth/register` with email, password, and name
   - Automatically creates USD and EUR accounts
   - Initializes each account with 5000.00 balance

   ```json
   {
     "email": "user@example.com",
     "password": "password123",
     "name": "John Doe"
   }
   ```

2. **Login**: `POST /auth/login` with email and password

   ```json
   {
     "email": "user@example.com",
     "password": "password123"
   }
   ```

   Returns: `{ "access_token": "...", "user": {...} }`

3. **Protected Routes**: Include `Authorization: Bearer <token>` header
   - All `/accounts/*` endpoints
   - All `/transactions/*` endpoints
   - `POST /exchange` (exchange execution)
   - `GET /exchange/rate` and `GET /exchange/calculate` are public

### Example

```bash
# Register
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Login
TOKEN=$(curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  | jq -r '.access_token')

# Use token
curl -X GET http://localhost:3001/accounts \
  -H "Authorization: Bearer $TOKEN"
```

## 📚 API Documentation (Swagger)

The API includes comprehensive Swagger/OpenAPI documentation. Once the server is running, visit:

```
http://localhost:3001/api
```

The Swagger UI allows you to:

- Browse all available endpoints
- See request/response schemas
- Test endpoints directly from the browser
- View authentication requirements

**Note:** Protected endpoints require a JWT token. Use the `/auth/login` or `/auth/register` endpoint first to get a token, then click the "Authorize" button in Swagger UI and enter: `Bearer <your-token>`

## 💰 System Equity Account

The platform uses a **System Equity Account** to maintain double-entry accounting integrity. This account:

- **Purpose**: Balances deposit transactions and initial account balances
- **Account ID**: `00000000-0000-0000-0000-000000000001`
- **How it works**: When deposits are made, the user account is credited (positive) and the system equity account is debited (negative), ensuring the transaction sums to zero

**Example - Initial Deposit of 5000 USD:**

```
User USD Account:     +5000.00 (credit)
System Equity Account: -5000.00 (debit)
─────────────────────────────────
Total:                 0.00 ✓
```

The system equity account is automatically created on first use and represents the bank's capital/equity as the source of funds for initial balances and deposits.

## 🐛 Error Tracking (Sentry) - Optional

The API includes optional Sentry integration for error tracking and performance monitoring.

### Setup

1. Create a Sentry account at [sentry.io](https://sentry.io)
2. Create a new project and get your DSN
3. Add to your `.env` file:

```bash
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_TRACES_SAMPLE_RATE=0.1  # 10% of transactions (optional)
SENTRY_PROFILES_SAMPLE_RATE=0.1  # 10% of profiles (optional)
```

### Features

- **Error Tracking**: Automatic capture of unhandled exceptions
- **Performance Monitoring**: Track API endpoint performance
- **Profiling**: Identify performance bottlenecks
- **Environment-aware**: Automatically tags errors with environment (development/production)

**Note:** If `SENTRY_DSN` is not provided, Sentry will be disabled and the application will run normally.

## Testing

```bash
npm test
```
