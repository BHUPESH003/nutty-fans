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

| Decision       | Choice                       | Notes                                            |
| -------------- | ---------------------------- | ------------------------------------------------ |
| CI/CD Approach | **GitHub Actions + Vercel**  | Actions for quality gates, Vercel for deployment |
| Docker         | **No**                       | Vercel handles deployment, no Docker needed      |
| Environments   | **Dev + QA + Production**    | 3 environments on `dev`, `qa`, `main` branches   |
| Cloud Access   | **Confirmed**                | AWS and Neon accounts available                  |
| GitHub Repo    | **Private**                  | Limited Actions minutes (2,000/month)            |
| Vercel Plan    | **Free (Hobby)**             | Limited bandwidth (100GB/month)                  |
| S3 Buckets     | **Separate per environment** | 3 buckets for isolation                          |
| S3 Access      | **CDN only**                 | CloudFront distributions, no direct S3 access    |

---

## Scope

### IN SCOPE

#### 1. Neon Database Provisioning

- Create Neon project and database
- Create 3 database branches: `dev`, `qa`, `main`
- Configure connection pooling (for serverless)
- Set up environment variables for all 3 environments
- Verify database connectivity

#### 2. S3 Media Storage Setup

- Create 3 S3 buckets: `nuttyfans-media-dev`, `nuttyfans-media-qa`, `nuttyfans-media-prod`
- Configure bucket policies and CORS
- Block all public access
- Set up IAM user/role with minimal permissions

#### 3. CloudFront CDN Setup

- Create 3 CloudFront distributions (one per S3 bucket)
- Configure Origin Access Control (OAC)
- S3 accessible ONLY via CloudFront
- Configure caching policies

#### 4. CI/CD Pipeline (GitHub Actions)

- Linting checks (ESLint)
- Type checking (TypeScript)
- Unit tests (when added)
- Vercel deployment integration
- Runs on PR to `dev`, `qa`, and `main` branches
- Cache dependencies (save Actions minutes)

#### 5. Vercel Deployments

- 3 deployments: Dev, QA, Production
- Environment variables for each
- Connect to GitHub repository

### OUT OF SCOPE

- Docker configuration
- Application code changes
- Authentication implementation
- API development
- Custom domain configuration
- Advanced monitoring/alerting
- Signed URLs for private content

---

## Environment Strategy

| Environment | Branch | Database    | S3 Bucket              | CloudFront     | Vercel          |
| ----------- | ------ | ----------- | ---------------------- | -------------- | --------------- |
| Development | `dev`  | Neon `dev`  | `nuttyfans-media-dev`  | Distribution 1 | Dev deployment  |
| QA          | `qa`   | Neon `qa`   | `nuttyfans-media-qa`   | Distribution 2 | QA deployment   |
| Production  | `main` | Neon `main` | `nuttyfans-media-prod` | Distribution 3 | Prod deployment |

---

## Success Criteria

- [ ] Neon database accessible (all 3 branches)
- [ ] S3 buckets created (all 3 environments)
- [ ] CloudFront distributions working (all 3)
- [ ] Direct S3 access blocked (returns 403)
- [ ] GitHub Actions workflow runs on PR
- [ ] Vercel deployment triggered correctly per branch (dev/qa/main)

---

## Status: ✅ READY FOR PM RESEARCH
