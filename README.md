# NuttyFans

A next-generation global creator monetization platform.

## Overview

NuttyFans empowers content creators with sophisticated tools to build sustainable income streams while connecting authentically with their audience. The platform supports both safe-for-work (SFW) and adult creators with strict category segregation.

## Features

- 💰 **Multiple Revenue Streams** - Subscriptions, PPV, tips, paid DMs, live streaming
- 🎨 **Premium Design** - Clean, editorial aesthetic inspired by Hidden.com
- 💳 **Fair Economics** - 16% commission with weekly payouts
- 🌍 **Global Reach** - PWA-first web application accessible worldwide
- 🔒 **Trust & Safety** - Mandatory KYC, AI moderation, content watermarking

## Tech Stack

| Layer    | Technology                           |
| -------- | ------------------------------------ |
| Frontend | Next.js 14+, Tailwind CSS, shadcn/ui |
| Backend  | Next.js API Routes, Server Actions   |
| Database | PostgreSQL (Neon), Prisma ORM        |
| Cache    | Redis (Upstash)                      |
| Storage  | AWS S3, CloudFront CDN               |
| Payments | Stripe Connect                       |
| Video    | Mux                                  |
| Search   | Meilisearch                          |
| Auth     | NextAuth.js v5                       |

## Documentation

All project documentation is available in the `/docs` directory:

- [Business Requirements (BRD)](./docs/01-BRD.md)
- [Product Requirements (PRD)](./docs/02-PRD.md)
- [Technical Architecture](./docs/03-TECHNICAL-ARCHITECTURE.md)
- [Database Schema](./docs/04-DATABASE-SCHEMA.md)
- [API Specification](./docs/05-API-SPECIFICATION.md)
- [UI/UX Blueprint](./docs/06-UI-UX-BLUEPRINT.md)
- [Project Tracker](./docs/07-PROJECT-TRACKER.md)

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- PostgreSQL database (or Neon account)
- AWS account (for S3)
- Stripe account

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/nuttyfans.git
cd nuttyfans

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Run database migrations
pnpm db:migrate

# Start development server
pnpm dev
```

### Environment Variables

The canonical list of infrastructure-related environment variables is defined in
`tasks/2025-12-14__INFRASTRUCTURE-SETUP/02-ARCHITECTURE-REVIEW.mdc` and mirrored in `.env.example`.
For local development, you can use the following as a guide:

```env
# ============================================
# DATABASE (Neon)
# ============================================
# Pooled connection string used by the app at runtime
DATABASE_URL="postgresql://user:pass@ep-xxx.region.aws.neon.tech/nuttyfans?sslmode=require"

# Unpooled connection string used only for migrations / schema changes
DATABASE_URL_UNPOOLED="postgresql://user:pass@ep-xxx.region.aws.neon.tech/nuttyfans?sslmode=require"

# ============================================
# STORAGE (AWS S3)
# ============================================
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="us-east-1"

# Bucket name varies by environment:
# - nuttyfans-media-dev
# - nuttyfans-media-qa
# - nuttyfans-media-prod
AWS_S3_BUCKET="nuttyfans-media-dev"

# ============================================
# CDN (CloudFront)
# ============================================
# CloudFront distribution URL for the current environment
CLOUDFRONT_URL="https://dxxxxxxxxxx.cloudfront.net"

# ============================================
# APPLICATION
# ============================================
# Base URL for the app (varies by environment)
# - https://nuttyfans-dev.vercel.app
# - https://nuttyfans-qa.vercel.app
# - https://nuttyfans.vercel.app
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# ============================================
# AUTH (future tasks)
# ============================================
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# ============================================
# PAYMENTS (future tasks)
# ============================================
STRIPE_SECRET_KEY="..."
STRIPE_WEBHOOK_SECRET="..."

# ============================================
# VIDEO (future tasks)
# ============================================
MUX_TOKEN_ID="..."
MUX_TOKEN_SECRET="..."
```

## ⚠️ IMPORTANT

This project follows strict USER and PROJECT rules.

Before making any change, read:

- /rules/USER_RULES.md
- /rules/PROJECT_RULES.md

## Project Structure

```
nuttyfans/
├── docs/               # Project documentation
├── src/
│   ├── app/           # Next.js App Router pages
│   ├── components/    # React components
│   ├── lib/           # Shared utilities
│   ├── server/        # Server-side code
│   └── styles/        # Global styles
├── prisma/            # Database schema
├── public/            # Static assets
└── tests/             # Test files
```

## Development

```bash
# Run development server
pnpm dev

# Run linting
pnpm lint

# Run type checking
pnpm typecheck

# Run tests
pnpm test

# Build for production
pnpm build
```

## Deployment

The application is designed to be deployed on Vercel:

```bash
# Deploy to Vercel
vercel
```

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Write/update tests
4. Submit a pull request

## License

Proprietary - All rights reserved.

---

_Built with ❤️ by the NuttyFans Team_
