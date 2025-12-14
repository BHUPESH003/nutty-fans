# Task 03 – Infrastructure Setup (Neon + S3 + CI/CD)

## Problem Statement

NuttyFans requires production-ready cloud infrastructure to support:
- Database hosting (PostgreSQL)
- Media storage (images, videos)
- Automated quality gates and deployment

---

## Business Goal

Establish a reliable, scalable infrastructure foundation that:
- Enables development team to work with real database
- Provides secure media storage for creator content
- Automates testing and deployment workflows

---

## Confirmed Decisions

| Decision | Choice | Notes |
|----------|--------|-------|
| CI/CD Approach | **GitHub Actions + Vercel** | Actions for quality gates, Vercel for deployment |
| Docker | **No** | Vercel handles deployment, no Docker needed |
| Environments | **QA + Production** | QA on `qa` branch, Production on `main` branch |
| Cloud Access | **Confirmed** | AWS and Neon accounts available |

---

## Scope

### IN SCOPE

#### 1. Neon Database Provisioning
- Create Neon project and database
- Configure connection pooling (for serverless)
- Set up environment variables
- Configure QA and Production branches
- Verify database connectivity

#### 2. S3 Media Storage Setup
- Create AWS S3 bucket for media uploads
- Configure bucket policies and CORS
- Set up IAM user/role with minimal permissions
- Configure environment variables

#### 3. CI/CD Pipeline (GitHub Actions)
- Linting checks (ESLint)
- Type checking (TypeScript)
- Unit tests (when added)
- Vercel deployment integration
- Runs on PR to `qa` and `main` branches

### OUT OF SCOPE

- Docker configuration
- Application code changes
- Authentication implementation
- API development
- CloudFront CDN (future optimization)
- Advanced monitoring/alerting

---

## Environment Strategy

| Environment | Branch | Database | Vercel |
|-------------|--------|----------|--------|
| QA | `qa` | Neon QA branch | Preview/Staging |
| Production | `main` | Neon main branch | Production |

---

## Success Criteria

- [ ] Neon database accessible from application
- [ ] S3 bucket created with proper permissions
- [ ] GitHub Actions workflow runs on PR
- [ ] Vercel deployment triggered correctly per branch

---

## Status: ✅ READY FOR PM RESEARCH
