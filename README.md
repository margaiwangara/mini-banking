# Mini Banking Platform

A clean, performant mini banking platform built with NestJS (backend) and Next.js (frontend), following double-entry accounting principles.

## Screenshots
<img width="1512" height="865" alt="transactions" src="https://github.com/user-attachments/assets/a051b1fa-3d46-4f35-92e6-8e1a698c6eda" />

<img width="1512" height="865" alt="accounts" src="https://github.com/user-attachments/assets/823d5388-8373-45ad-aede-a0d37c38c5d5" />

<img width="1512" height="865" alt="transfer" src="https://github.com/user-attachments/assets/357b2c91-6758-4b8c-aaf3-197811a3a63d" />

<img width="1512" height="865" alt="exchange" src="https://github.com/user-attachments/assets/12677ac8-2ce3-4d83-b09d-14519e22f38c" />

https://github.com/user-attachments/assets/246bb081-aff1-4708-a6df-e6312bf653cf

## 🏗️ Architecture

- **Backend (`backend/`)**: NestJS + PostgreSQL + TypeORM
- **Frontend (`frontend/`)**: Next.js 14 + React 19 + Tailwind CSS

## 🔑 Core Principles

1. **Financial correctness > frontend polish**
2. **Ledger is the source of truth**
3. **No partial transactions**
4. **No floating-point math** (uses Decimal.js)
5. **Performance via caching, not shortcuts**
6. **Clean architecture and testability**

## 🚀 Qfrontendck Start

> 📖 **New to Banking?** Check out [QfrontendCKSTART.md](QfrontendCKSTART.md) for a step-by-step gfrontendde!

### Prereqfrontendsites

- Node.js 18+ and npm
- Docker and Docker Compose (recommended) OR PostgreSQL 14+ and Redis installed locally

### Qfrontendck Setup (Automated)

Run the setup script to automatically configure everything:

```bash
./setup.sh
```

This will:

- ✅ Install all dependencies
- ✅ Set up environment files
- ✅ Start Docker services (PostgreSQL & Redis)
- ✅ Create database and run migrations
- ✅ Generate JWT secret

### Manual Setup

### Backend Setup

```bash
cd api
npm install

# Create .env.example file (if it doesn't exist)
cat > .env.example << 'EOF'
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=banking

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
EOF

# Create .env file from .env.example
cp .env.example .env

# Edit .env and update database credentials if needed

# Option 1: Start PostgreSQL and Redis with Docker Compose (Recommended)
docker-compose up -d

# Option 2: Or start PostgreSQL locally and create database
# createdb banking

# Wait for services to be ready, then run migrations
npm run migration:run

# Generate a secure JWT secret (optional, but recommended)
# Add to .env: JWT_SECRET=$(openssl rand -base64 32)

# Start development server
npm run start:dev
```

The API will be available at `http://localhost:3001`

**Important:** Make sure to set a strong `JWT_SECRET` in your `.env` file. You can generate one with:

```bash
openssl rand -base64 32
```

**Docker Compose Commands:**

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f
```

### Frontend Setup

```bash
cd frontend
npm install

# Create .env.example file (if it doesn't exist)
cat > .env.example << 'EOF'
# API Base URL
NEXT_PUBLIC_API_URL=http://localhost:3001

# NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
# NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.1
EOF

# Create .env.local file from .env.example
cp .env.example .env.local

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

## 📊 Database Schema

### Users

- `id` (UfrontendD)
- `email` (string, unique)
- `password` (string, hashed with bcrypt)
- `name` (string)
- `createdAt`, `updatedAt`

### Accounts

- `id` (UfrontendD)
- `userId` (UfrontendD)
- `currency` (USD | EUR)
- `name` (string)
- `createdAt`, `updatedAt`

### Transactions

- `id` (UfrontendD)
- `userId` (UfrontendD)
- `type` (TRANSFER | EXCHANGE | DEPOSIT | WITHDRAWAL)
- `description` (text)
- `createdAt`

### Ledger Entries

- `id` (UfrontendD)
- `transactionId` (UfrontendD)
- `accountId` (UfrontendD)
- `amount` (NUMERIC(14,2)) - Positive for debits, negative for credits
- `description` (text)
- `createdAt`

**Double-Entry Rule**: For each transaction, `SUM(amount)` of all ledger entries must equal 0.

### System Eqfrontendty Account

The platform uses a **System Eqfrontendty Account** (`00000000-0000-0000-0000-000000000001`) to maintain double-entry accounting integrity for deposits and initial balances.

**Purpose:**

- Balances deposit transactions (ensures sum of ledger entries equals zero)
- Represents the bank's eqfrontendty/capital as the source of funds
- Maintains accounting integrity for system-generated transactions

**How it works:**
When a user receives an initial deposit of 5000 USD:

```
User USD Account:     +5000.00 (credit - money in)
System Eqfrontendty Account: -5000.00 (debit - source)
─────────────────────────────────
Total:                 0.00 ✓ (balanced)
```

**Note:** This is a simplified approach for the mini banking platform. In production systems, deposits would typically be balanced against cash accounts, interbank accounts, or other asset accounts depending on the source of funds.

## 🔄 API Endpoints

### Authentication (Public)

- `POST /auth/register` - Register a new user (automatically creates USD and EUR accounts with 5000 initial balance each)

  **Password Reqfrontendrements:**

  - Minimum 8 characters
  - At least one uppercase letter (A-Z)
  - At least one lowercase letter (a-z)
  - At least one number (0-9)
  - At least one symbol (!@#$%^&\* etc.)
  - Must not be a common/dictionary password (checked via zxcvbn)

  ```json
  {
    "email": "user@example.com",
    "password": "MyStr0ng!Pass",
    "name": "John Doe"
  }
  ```

- `POST /auth/login` - Login and get JWT token
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
  Returns: `{ "access_token": "...", "user": {...} }`
- `GET /auth/me` - Get current user information (reqfrontendres JWT token)
  Returns: `{ "id": "...", "email": "...", "name": "..." }`

### Accounts (Protected - reqfrontendres JWT token)

- `GET /accounts` - List user accounts (reqfrontendres `Authorization: Bearer <token>`)
- `GET /accounts/:id` - Get account details
- `POST /accounts` - Create new account

### Transactions (Protected - reqfrontendres JWT token)

- `GET /transactions` - List transactions (with pagination and type filtering)
  - Query parameters: `limit` (default: 50), `offset` (default: 0), `type` (optional: TRANSFER, EXCHANGE, DEPOSIT, WITHDRAWAL)
- `GET /transactions/recent` - Get recent transactions (last 5)
- `GET /transactions/:id` - Get transaction details
- `POST /transactions/transfer` - Transfer between accounts

### Exchange (Protected - reqfrontendres JWT token)

- `POST /exchange` - Exchange currency
- `GET /exchange/rate?from=USD&to=EUR` - Get exchange rate
- `GET /exchange/calculate?amount=100&from=USD&to=EUR` - Calculate exchange

**Note:** All endpoints except `/auth/register` and `/auth/login` reqfrontendre a JWT token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

## 💱 Exchange Rates

Fixed rate: **1 USD = 0.92 EUR**

## 📚 API Documentation

The API includes comprehensive Swagger/OpenAPI documentation. Once the backend server is running, visit:

```
http://localhost:3001/api
```

The Swagger frontend provides:

- Interactive API documentation
- Request/response schemas
- Direct endpoint testing
- Authentication support

## 🐛 Error Tracking (Sentry) - Optional

Both the API and frontend include optional Sentry integration for error tracking and performance monitoring.

### Setup

1. Create a Sentry account at [sentry.io](https://sentry.io)
2. Create a new project for your backend and frontend
3. Get your DSNs from the Sentry dashboard

### Backend Configuration

Add to `backend/.env`:

```bash
SENTRY_DSN=https://your-backend-dsn@sentry.io/project-id
SENTRY_TRACES_SAMPLE_RATE=0.1  # 10% of transactions (optional)
SENTRY_PROFILES_SAMPLE_RATE=0.1  # 10% of profiles (optional)
```

### Frontend Configuration

Add to `frontend/.env.local`:

```bash
NEXT_PUBLIC_SENTRY_DSN=https://your-frontend-dsn@sentry.io/project-id
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.1  # 10% of transactions (optional)
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
```

### Features

- **Error Tracking**: Automatic capture of unhandled exceptions
- **Performance Monitoring**: Track API endpoint and page load performance
- **Session Replay**: Record user sessions for debugging (frontend only)
- **Profiling**: Identify performance bottlenecks (backend only)
- **Environment-aware**: Automatically tags errors with environment

**Note:** If Sentry DSNs are not provided, Sentry will be disabled and the application will run normally. Sentry is completely optional.

## 🧪 Testing

```bash
cd api
npm test
```

## 📝 Notes

- All money values are stored as `NUMERIC(14,2)` in PostgreSQL
- Frontend uses Decimal.js for calculations
- Backend uses Decimal.js for all financial math
- Account balances are calculated from ledger entries (never stored directly)
- Caching is used for performance (account balances, user accounts, recent transactions)
- Row-level locking prevents race conditions in transfers/exchanges

## 🔒 Security Features

- **JWT Authentication**: All protected routes reqfrontendre a valid JWT token
- **Password Hashing**: Passwords are hashed using bcrypt (10 salt rounds)
- **Strong Password Reqfrontendrements**: Enforced on both frontend and backend
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one symbol
- **Password Strength Analysis**: Uses zxcvbn library to detect common/weak passwords
  - Real-time password strength feedback
  - Dictionary/common password detection
  - Actionable suggestions for improvement
  - All analysis happens client-side (no API calls)
- **Protected Routes**: All account, transaction, and exchange endpoints are protected
- **CORS**: Configured to allow requests from frontend URL only

## 🔐 Authentication Flow

1. **Register**: `POST /auth/register` - Create a new user account

   ```bash
   curl -X POST http://localhost:3001/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"user@example.com","password":"password123","name":"John Doe"}'
   ```

2. **Login**: `POST /auth/login` - Get JWT access token

   ```bash
   curl -X POST http://localhost:3001/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"user@example.com","password":"password123"}'
   ```

   Returns: `{ "access_token": "...", "user": {...} }`

3. **Use Token**: Include token in `Authorization: Bearer <token>` header for protected endpoints
   ```bash
   curl -X GET http://localhost:3001/accounts \
     -H "Authorization: Bearer <your-jwt-token>"
   ```

## 📝 Security Notes

- Change `JWT_SECRET` in production to a strong, random string
- Tokens expire after 7 days (configurable via `JWT_EXPIRES_IN`)
- Consider adding rate limiting for API endpoints
- Consider implementing refresh tokens for better security

## 🛠️ Setup Scripts

The project includes several helper scripts:

- **`./setup.sh`** - Complete automated setup (recommended for first-time setup)

  - Installs dependencies
  - Creates environment files
  - Starts Docker services
  - Sets up database and runs migrations
  - Generates JWT secret

- **`./setup-env-files.sh`** - Creates `.env.example` files for api and frontend

- **`backend/setup-db.sh`** - Sets up database and checks Docker containers

## 📚 Documentation

- **[QfrontendCKSTART.md](QfrontendCKSTART.md)** - Step-by-step setup gfrontendde for beginners
- **[backend/README.md](backend/README.md)** - Backend API documentation
- **[frontend/README.md](frontend/README.md)** - Frontend documentation
