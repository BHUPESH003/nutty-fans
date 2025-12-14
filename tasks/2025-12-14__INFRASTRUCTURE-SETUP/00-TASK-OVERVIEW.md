# Task 03 – Infrastructure Setup (Neon + S3 + CI/CD)

## Problem Statement

NuttyFans requires production-ready cloud infrastructure to support:
- Database hosting (PostgreSQL)
- Media storage (images, videos)
- Automated quality gates and deployment

The Prisma schema is complete but the database is not yet provisioned.
The application scaffold is ready but deployment pipeline is not configured.

---

## Business Goal

Establish a reliable, scalable infrastructure foundation that:
- Enables development team to work with real database
- Provides secure media storage for creator content
- Automates testing and deployment workflows
- Minimizes operational overhead

---

## Scope

### IN SCOPE

#### 1. Neon Database Provisioning
- Create Neon project and database
- Configure connection pooling (for serverless)
- Set up environment variables
- Run initial Prisma migrations
- Verify database connectivity

#### 2. S3 Media Storage Setup
- Create AWS S3 bucket for media uploads
- Configure bucket policies and CORS
- Set up IAM user/role with minimal permissions
- Configure environment variables
- (Optional) CloudFront CDN for media delivery

#### 3. CI/CD Pipeline (GitHub Actions)
- Linting checks (ESLint)
- Type checking (TypeScript)
- Unit tests (when added)
- Vercel deployment integration
- Database migration checks

### OUT OF SCOPE

- Application code changes
- Authentication implementation
- API development
- Frontend features
- Production domain setup
- Advanced monitoring/alerting

---

## Open Questions (REQUIRES HUMAN INPUT)

### Q1: CI/CD with Vercel Deployment

**Context:** Vercel provides built-in CI/CD for Next.js apps (auto-deploy on push).

**Question:** Do you want GitHub Actions for quality gates BEFORE Vercel deploys?

| Option | Description | Recommendation |
|--------|-------------|----------------|
| **Option A** | Vercel only (no GitHub Actions) | Simple, but no pre-deploy checks |
| **Option B** | GitHub Actions + Vercel | Lint/test/type-check before deploy ✅ |
| **Option C** | GitHub Actions blocking Vercel | Deploy only if checks pass |

**PM Recommendation:** Option B or C — Vercel handles deployment, but GitHub Actions should run quality gates (lint, type-check, tests) to catch issues early.

---

### Q2: Docker for Application

**Context:** Vercel uses serverless deployment (no Docker needed).

**Question:** Should we add Docker support?

| Option | Description | Use Case |
|--------|-------------|----------|
| **Option A** | No Docker | Simplest, Vercel handles everything |
| **Option B** | Docker for local dev only | Consistent local environment |
| **Option C** | Full Docker support | Future self-hosting option |

**PM Recommendation:** Option A (No Docker) for now — Vercel handles deployment, and local dev works fine with `pnpm dev`. Docker adds complexity without clear benefit for our current setup.

---

### Q3: Environment Strategy

**Question:** How many environments do you want?

| Environment | Database | Purpose |
|-------------|----------|---------|
| Development | Neon (dev branch) | Local development |
| Preview | Neon (preview branch) | PR preview deployments |
| Production | Neon (main branch) | Live application |

**PM Recommendation:** Start with 2 environments (Development + Production). Add Preview later if needed.

---

## Non-Functional Requirements

### Security
- No secrets in code repository
- Minimal IAM permissions for S3
- Database connection pooling enabled
- SSL/TLS for all connections

### Reliability
- Neon auto-scaling enabled
- S3 versioning (optional)
- CI/CD should not block on non-critical failures

### Cost Optimization
- Use Neon free tier initially
- S3 standard storage (not Glacier)
- Vercel free/hobby tier

---

## Dependencies

- ✅ Prisma schema complete (`prisma/schema.prisma`)
- ✅ Project scaffold complete
- ⬜ AWS account access
- ⬜ Neon account access
- ⬜ GitHub repository admin access

---

## Success Criteria

- [ ] Neon database accessible from application
- [ ] Prisma migrations run successfully
- [ ] S3 bucket created with proper permissions
- [ ] File upload test succeeds
- [ ] GitHub Actions workflow runs on PR
- [ ] Vercel deployment triggered on merge to main

---

## Notes

This task is intentionally minimal — focus on getting infrastructure working, not optimizing it.

Optimization (caching, CDN, advanced monitoring) will be separate tasks.

---

## Estimated Effort

| Component | Effort |
|-----------|--------|
| Neon setup | 2-3 hours |
| S3 setup | 2-3 hours |
| CI/CD pipeline | 3-4 hours |
| **Total** | ~1 day |

---

## AWAITING HUMAN INPUT

Before PM research can begin, please answer:

1. **Q1:** CI/CD approach? (A/B/C)
2. **Q2:** Docker? (A/B/C)
3. **Q3:** How many environments? (2 or 3)
4. **AWS/Neon accounts:** Do you have access to create resources?
