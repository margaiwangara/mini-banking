# Shawdy UI

Frontend for the Mini Banking Platform built with Next.js 14 and React 19.

## Setup

1. Install dependencies:

```bash
npm install

# If you encounter peer dependency issues with @sentry/nextjs and Next.js 15, use:
# npm install --legacy-peer-deps
```

2. Set up environment variables:

```bash
# Create .env.example if it doesn't exist:
cat > .env.example << 'EOF'
# API Base URL
NEXT_PUBLIC_API_URL=http://localhost:3001
EOF

# Copy to .env.local
cp .env.example .env.local
```

3. Start development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Features

- Account management (create, view accounts)
- Transfer money between accounts
- Exchange currency (USD ↔ EUR)
- View transaction history
- Real-time balance updates

## Project Structure

```
app/
├── components/       # React components
│   ├── AccountList.tsx
│   ├── CreateAccountForm.tsx
│   ├── TransactionList.tsx
│   ├── TransferForm.tsx
│   └── ExchangeForm.tsx
├── layout.tsx        # Root layout
├── page.tsx          # Main page
└── globals.css       # Global styles
```
