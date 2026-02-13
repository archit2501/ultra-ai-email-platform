# ULTRA AI Email Platform V3.1

## HR Resume Assistant - Enterprise Cold Email Web Application

[![Version](https://img.shields.io/badge/version-3.1.0-blue.svg)](https://github.com/metamindswork-ux/COLD-EMAIL-WEB-APPLICATION)
[![Next.js](https://img.shields.io/badge/Next.js-14.0.4-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green)](https://fastapi.tiangolo.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)

---

## What's New in V3.1

### **MAJOR UPDATE - Document Management System & Follow-up Integration**

**Released: January 2026**

#### Key Features

1. **Complete Document Management System**
   - AI-powered resume and info document parsing
   - Document preview (PDF/Image) with fullscreen mode
   - Bulk operations (delete, re-parse, export)
   - Re-parse functionality for updated AI extraction
   - Download original files
   - Context selection for AI personalization

2. **Follow-up Queue Integration (Recipients Page)**
   - Recipients needing follow-up based on configurable days threshold (3-30 days)
   - Auto follow-up settings with scheduling
   - Bulk send follow-ups with template variables
   - Template variables: `{name}`, `{company}`, `{position}`, `{days_waiting}`
   - Stats cards showing queue status

3. **Project Consolidation (21 -> 17 Pages)**
   - Removed redundant pages: design-system, pipeline, resumes, follow-up
   - Follow-up merged into Recipients page as dedicated queue panel
   - Resumes merged into Documents page
   - 19% reduction in navigation complexity

4. **Deleted Redundant Backend Files**
   - Removed `applications_optimized.py` (duplicate)
   - Removed `applications_async.py` (duplicate)
   - Removed `follow_up.py` (merged into recipients.py)

---

## What's New in V3.0

### **God-Tier Cache System & Enterprise Design**

**Released: January 2026**

#### Key Features

1. **God-Tier Research & Template History**
   - Smart caching with 7-day expiration
   - Freshness indicators (Green/Yellow/Orange/Red by age)
   - Email library with search, filter, favorites
   - Full history access (max 10 batches per recipient)
   - Version tracking for all research & emails
   - Beautiful "Regenerate" button with confirmation
   - Auto-load cached data on panel open (no regeneration)

2. **Consolidated Navigation**
   - Groups integrated into Recipients page (tab)
   - Tabbed interface with futuristic animations
   - Streamlined user experience

3. **Dashboard with Intelligent Fallback**
   - 47 sample applications with realistic data
   - Auto-transitions to real data when available
   - Statistics: 47 apps, 12 contacted, 8 pending, 3 interviews, 2 offers
   - No more "empty dashboard" problem

4. **Enterprise Design System V2.0**
   - 30+ UI/UX enhancements with futuristic smooth animations
   - Glassmorphism effects with backdrop blur
   - Framer Motion spring physics (stiffness: 400, damping: 15)
   - Color-coded indicators for all data freshness
   - Stagger animations for lists and cards

---

## ULTRA PRO MAX EXTRACTION ENGINE V1.0

### **The Most Advanced Data Extraction System Ever Built**

**Released: January 2026**

The Extraction Engine is a revolutionary **9-layer AI-powered data extraction system** that scrapes, enriches, validates, and intelligently processes data from ANY source (websites, APIs, files, directories) across 4 major sectors.

#### Key Capabilities

- **4 Target Sectors**: Clients, Companies, Recruiters, Customers
- **9-Layer Deep Extraction**: From static HTML to ML-powered entity resolution
- **28+ ML/DL Services**: BERT NER, Computer Vision, FAISS, MinHash LSH
- **Real-Time Progress**: SSE streaming with <1s latency
- **Multi-Source Intelligence**: URLs, CSVs, APIs (Apollo.io, Hunter.io)
- **God-Tier UI**: 6-step wizard with glass morphism and Framer Motion
- **One-Click Integration**: Direct import to Recipients table
- **Advanced Excel Export**: 3-sheet formatted workbook with quality reports

---

### Extraction Engine UI - 6-Step Wizard

#### **Step 1: Sector Selection**
**Component**: `frontend/src/components/extraction/SectorSelector.tsx`

Select target sector with ultra-high-tech glass cards:
- Clients - Potential customers and leads
- Companies - Corporate entities and organizations
- Recruiters - HR managers and talent acquisition specialists
- Customers - End-users and consumer contacts

#### **Step 2: Source Configuration**
**Component**: `frontend/src/components/extraction/SourceConfiguration.tsx`

Configure data sources with 3 tabs: URLs, Files, Directories (API integration)

#### **Step 3: Filter Builder**
**Component**: `frontend/src/components/extraction/FilterBuilder.tsx`

AI-powered search criteria with smart suggestions for job titles, locations, industries, tech stack, funding status, and company size.

#### **Step 4: Real-Time Progress Dashboard**
**Component**: `frontend/src/components/extraction/ProgressDashboard.tsx`

Live extraction progress with SSE streaming, control buttons (Start/Pause/Resume/Cancel), and 9-layer pipeline visualization.

#### **Step 5: Data Review & Export**
**Component**: `frontend/src/components/extraction/DataReview.tsx`

Review, filter, and export extracted data with quality scoring and Excel export.

#### **Step 6: Integration & Import**
**Component**: `frontend/src/components/extraction/Integration.tsx`

One-click import to Recipients table with duplicate filtering and quality thresholds.

---

## Document Management System (NEW in V3.1)

### **Complete Resume & Info Document Management**

**Component**: `frontend/src/app/(dashboard)/documents/page.tsx`

A comprehensive document management system with AI-powered parsing and context selection for email personalization.

#### Features

1. **Dual Document Types**
   - **Resumes**: Your professional resumes for job applications
   - **Info Documents**: Company info, research docs, reference materials

2. **AI-Powered Parsing**
   - Automatic extraction of skills, experience, education
   - Key achievements and projects identification
   - Structured data for email personalization
   - Re-parse functionality for updated extraction

3. **Document Preview**
   - PDF preview using browser iframe
   - Image preview for jpg/png/gif/webp
   - Fullscreen mode toggle
   - Download for unsupported formats
   - Open in new tab option

4. **Bulk Operations**
   - Multi-select documents
   - Bulk delete with confirmation
   - Bulk re-parse for AI extraction
   - Export functionality

5. **Context Selection**
   - Select resume for job applications
   - Select info docs for company context
   - AI uses selected documents for personalization

#### Components

- `DocumentPreviewDialog.tsx` - Full-featured preview with PDF/Image support
- `DeleteConfirmDialog.tsx` - Animated delete confirmation
- `ResumeViewerDialog.tsx` - Resume viewing with re-parse
- `InfoDocViewerDialog.tsx` - Info doc viewing with re-parse

#### API Endpoints

```
GET    /api/v1/documents/resumes           # List resumes
POST   /api/v1/documents/resumes           # Upload resume
GET    /api/v1/documents/resumes/{id}      # Get resume details
DELETE /api/v1/documents/resumes/{id}      # Delete resume
GET    /api/v1/documents/resumes/{id}/download  # Download original file
POST   /api/v1/documents/resumes/{id}/reparse   # Re-parse with AI

GET    /api/v1/documents/info-docs         # List info documents
POST   /api/v1/documents/info-docs         # Upload info document
GET    /api/v1/documents/info-docs/{id}    # Get info doc details
DELETE /api/v1/documents/info-docs/{id}    # Delete info document
GET    /api/v1/documents/info-docs/{id}/download  # Download original file
POST   /api/v1/documents/info-docs/{id}/reparse   # Re-parse with AI
```

---

## Follow-up Queue System (NEW in V3.1)

### **Integrated into Recipients Page**

**Component**: `frontend/src/components/recipients/FollowUpQueuePanel.tsx`

A dedicated panel for managing follow-ups within the Recipients page, replacing the standalone follow-up page.

#### Features

1. **Queue Dashboard**
   - Recipients with no response in X days (configurable 3-30 days)
   - Visual stats cards: Total in queue, High priority, Sent today
   - Filter by days since last contact
   - Search and sort functionality

2. **Auto Follow-up Settings**
   - Enable/disable auto follow-ups
   - Configure days before follow-up (1-30 days)
   - Set maximum follow-ups per recipient (1-5)
   - Template selection for automated messages

3. **Bulk Operations**
   - Select multiple recipients
   - Bulk send follow-ups
   - Template variables: `{name}`, `{company}`, `{position}`, `{days_waiting}`

4. **Individual Actions**
   - Send follow-up to specific recipient
   - Mark as responded
   - Skip follow-up
   - View history

#### API Endpoints (Added to recipients.py)

```
GET    /api/v1/recipients/follow-up/queue      # Get follow-up queue
GET    /api/v1/recipients/follow-up/settings   # Get auto follow-up settings
PUT    /api/v1/recipients/follow-up/settings   # Update settings
POST   /api/v1/recipients/{id}/send-follow-up  # Send individual follow-up
POST   /api/v1/recipients/follow-up/bulk-send  # Bulk send follow-ups
```

---

## Project Structure (Updated for V3.1)

### Active Pages (17 Total)

```
frontend/src/app/(dashboard)/
├── dashboard/page.tsx              # Statistics with sample data fallback
├── applications/page.tsx           # Job applications list
├── recipients/page.tsx             # Recipients + Groups + Follow-up Queue (consolidated)
├── documents/page.tsx              # Resume & Info Doc Management (NEW)
├── templates/page.tsx              # Email templates management
├── extraction/page.tsx             # 9-Layer data extraction wizard
├── analytics/page.tsx              # Performance analytics
├── notifications/page.tsx          # In-app notifications
├── settings/page.tsx               # User settings & configuration
├── users/page.tsx                  # User management
├── inbox/page.tsx                  # Email inbox
├── marketplace/page.tsx            # Template marketplace
├── email-controls/page.tsx         # Email sending controls
├── template-analytics/page.tsx     # Template performance analytics
├── ab-testing/page.tsx             # A/B testing for emails
├── company-intelligence/page.tsx   # Company research intelligence
└── recipient-groups/page.tsx       # Recipient group management
```

### Deleted/Consolidated Pages

The following pages have been **removed** and their functionality consolidated:

- `design-system/page.tsx` - Removed (developer utility, not needed in production)
- `pipeline/page.tsx` - Removed (merged into applications)
- `resumes/page.tsx` - Removed (merged into documents)
- `follow-up/page.tsx` - Removed (merged into recipients as FollowUpQueuePanel)

### Backend Endpoints (30 Files)

```
backend/app/api/v1/endpoints/
├── auth.py                    # Authentication (login, register, refresh)
├── users.py                   # User management
├── applications.py            # Job applications CRUD
├── recipients.py              # Recipients + Follow-up Queue (UPDATED)
├── recipient_groups.py        # Recipient groups
├── documents.py               # Resume & Info Doc Management (NEW)
├── resumes.py                 # Resume parsing (legacy)
├── templates_unified.py       # Email templates
├── email_templates.py         # Template management
├── extraction.py              # 9-Layer extraction engine
├── analytics.py               # Performance analytics
├── notifications.py           # In-app notifications
├── companies.py               # Company data
├── company_intelligence.py    # Company research
├── intelligence.py            # AI intelligence
├── dashboards.py              # Dashboard data
├── email_inbox.py             # Email inbox
├── email_preview.py           # Email preview
├── email_warming.py           # Email warming
├── send_time.py               # Send time optimization
├── rate_limiting.py           # Rate limiting
├── warmup_health.py           # Email warmup health
├── ab_testing.py              # A/B testing
├── template_analytics.py      # Template analytics
├── template_marketplace.py    # Template marketplace
├── group_campaigns.py         # Group campaigns
├── attachments.py             # File attachments
├── search.py                  # Global search
├── scheduler_admin.py         # Scheduler admin
└── health.py                  # Health checks
```

### Deleted Backend Files

- `applications_optimized.py` - Removed (duplicate of applications.py)
- `applications_async.py` - Removed (duplicate of applications.py)
- `follow_up.py` - Removed (merged into recipients.py)

---

## Components Architecture

### New Components (V3.1)

```
frontend/src/components/
├── documents/
│   ├── DocumentPreviewDialog.tsx    # PDF/Image preview with fullscreen
│   ├── DeleteConfirmDialog.tsx      # Animated delete confirmation
│   ├── ResumeViewerDialog.tsx       # Resume viewing with re-parse
│   └── InfoDocViewerDialog.tsx      # Info doc viewing with re-parse
└── recipients/
    └── FollowUpQueuePanel.tsx       # Follow-up queue dashboard
```

### Cache System Components

```
frontend/src/components/recipients/
├── utils/
│   ├── researchCache.ts             # Company research caching (7-day TTL)
│   └── emailCache.ts                # Email batch tracking
├── CacheFreshnessIndicator.tsx      # Color-coded freshness badges
├── RegenerateButton.tsx             # Animated regenerate button
├── ResearchHistoryPanel.tsx         # Cached research display
├── EmailLibraryDrawer.tsx           # Email history drawer
└── UltraEmailPanel.tsx              # Main email panel (1800+ lines)
```

### Extraction Components

```
frontend/src/components/extraction/
├── SectorSelector.tsx               # Step 1: Sector selection
├── SourceConfiguration.tsx          # Step 2: Source configuration
├── FilterBuilder.tsx                # Step 3: Filter builder
├── ProgressDashboard.tsx            # Step 4: Progress dashboard
├── DataReview.tsx                   # Step 5: Data review
└── Integration.tsx                  # Step 6: Integration
```

---

## Architecture Overview

### Tech Stack

#### Frontend
- **Framework**: Next.js 14.0.4 (App Router)
- **Language**: TypeScript 5.0+
- **Styling**: Tailwind CSS 3.3+ with custom design system
- **Animations**: Framer Motion 10.16+
- **State Management**: Zustand 4.4+
- **Forms**: React Hook Form 7.48+ with Zod validation
- **HTTP Client**: Axios with retry logic
- **UI Components**: Radix UI + Custom components
- **Icons**: Lucide React

#### Backend
- **Framework**: FastAPI 0.104+ (Python 3.11+)
- **Database**: PostgreSQL 15+ with SQLAlchemy 2.0 (async)
- **Cache**: Redis 7.0+ (optional, with fallback)
- **Authentication**: JWT with refresh tokens
- **Rate Limiting**: Distributed rate limiting with Redis
- **Email**: SMTP with Gmail integration
- **AI**: Anthropic Claude & OpenAI GPT integration
- **Web Scraping**: Playwright for company research
- **File Storage**: Local filesystem with quota management

#### Database Schema
- **Users**: Authentication, profiles, storage quotas
- **Applications**: Job applications with status tracking
- **Recipients**: Contact management with follow-up
- **Groups**: Recipient grouping with statistics
- **Templates**: Email templates with variables
- **Documents**: Resumes and info documents with AI parsing
- **EmailLogs**: Sent email tracking
- **Notifications**: In-app notification system
- **ExtractionJobs**: Extraction job tracking

---

## API Reference

### Authentication

```
POST   /api/v1/auth/register          # Register new user
POST   /api/v1/auth/login             # Login (form)
POST   /api/v1/auth/login/json        # Login (JSON)
POST   /api/v1/auth/refresh           # Refresh access token
POST   /api/v1/auth/logout            # Logout (blacklist token)
```

### Recipients (Updated with Follow-up)

```
GET    /api/v1/recipients                      # List recipients
POST   /api/v1/recipients                      # Create recipient
GET    /api/v1/recipients/{id}                 # Get recipient
PATCH  /api/v1/recipients/{id}                 # Update recipient
DELETE /api/v1/recipients/{id}                 # Delete recipient
POST   /api/v1/recipients/import-csv/preview   # Preview CSV import
POST   /api/v1/recipients/import-csv           # Import from CSV
POST   /api/v1/recipients/{id}/research        # Research company
POST   /api/v1/recipients/{id}/generate-emails # Generate emails
POST   /api/v1/recipients/{id}/send-ultra-email# Send email

# Follow-up endpoints (NEW in V3.1)
GET    /api/v1/recipients/follow-up/queue      # Get follow-up queue
GET    /api/v1/recipients/follow-up/settings   # Get settings
PUT    /api/v1/recipients/follow-up/settings   # Update settings
POST   /api/v1/recipients/{id}/send-follow-up  # Send follow-up
POST   /api/v1/recipients/follow-up/bulk-send  # Bulk send
```

### Documents (NEW in V3.1)

```
# Resumes
GET    /api/v1/documents/resumes               # List resumes
POST   /api/v1/documents/resumes               # Upload resume
GET    /api/v1/documents/resumes/{id}          # Get resume
DELETE /api/v1/documents/resumes/{id}          # Delete resume
GET    /api/v1/documents/resumes/{id}/download # Download file
POST   /api/v1/documents/resumes/{id}/reparse  # Re-parse with AI

# Info Documents
GET    /api/v1/documents/info-docs             # List info docs
POST   /api/v1/documents/info-docs             # Upload info doc
GET    /api/v1/documents/info-docs/{id}        # Get info doc
DELETE /api/v1/documents/info-docs/{id}        # Delete info doc
GET    /api/v1/documents/info-docs/{id}/download  # Download file
POST   /api/v1/documents/info-docs/{id}/reparse   # Re-parse with AI
```

### Applications

```
GET    /api/v1/applications           # List applications
POST   /api/v1/applications           # Create application
GET    /api/v1/applications/{id}      # Get application
PATCH  /api/v1/applications/{id}      # Update application
DELETE /api/v1/applications/{id}      # Delete application
GET    /api/v1/applications/stats     # Get statistics
```

### Groups

```
GET    /api/v1/groups                 # List groups
POST   /api/v1/groups                 # Create group
GET    /api/v1/groups/{id}            # Get group
PATCH  /api/v1/groups/{id}            # Update group
DELETE /api/v1/groups/{id}            # Delete group
POST   /api/v1/groups/{id}/recipients/add     # Add recipients
POST   /api/v1/groups/{id}/recipients/remove  # Remove recipients
```

### Extraction

```
POST   /api/v1/extraction/jobs                    # Create job
GET    /api/v1/extraction/jobs/{id}               # Get job
GET    /api/v1/extraction/jobs                    # List jobs
DELETE /api/v1/extraction/jobs/{id}               # Delete job
POST   /api/v1/extraction/jobs/{id}/start         # Start extraction
POST   /api/v1/extraction/jobs/{id}/pause         # Pause extraction
POST   /api/v1/extraction/jobs/{id}/resume        # Resume extraction
POST   /api/v1/extraction/jobs/{id}/cancel        # Cancel extraction
GET    /api/v1/extraction/jobs/{id}/stream        # SSE progress stream
GET    /api/v1/extraction/jobs/{id}/results       # Get results
POST   /api/v1/extraction/jobs/{id}/export        # Export to Excel
POST   /api/v1/extraction/jobs/{id}/import-recipients  # Import to recipients
```

---

## Getting Started

### Prerequisites

- **Node.js**: 18.0+ (LTS recommended)
- **Python**: 3.11+ with pip
- **PostgreSQL**: 15+ (running on port 5432)
- **Redis**: 7.0+ (optional, port 6379)
- **Git**: For version control

### Installation

#### 1. Clone Repository

```bash
git clone https://github.com/metamindswork-ux/COLD-EMAIL-WEB-APPLICATION.git
cd hr-resume-web-app
```

#### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (see Environment Variables section)
cp .env.example .env

# Run database migrations
alembic upgrade head

# Start backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will run at: **http://localhost:8000**

#### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local

# Start development server
npm run dev
```

Frontend will run at: **http://localhost:3000**

---

## Environment Variables

### Backend (.env)

```env
# Application
PROJECT_NAME="HR Resume Assistant API"
ENVIRONMENT=development
DEBUG=true

# Database
POSTGRES_SERVER=localhost
POSTGRES_USER=hr_resume_user
POSTGRES_PASSWORD=hr_resume_password
POSTGRES_DB=hr_resume_db
POSTGRES_PORT=5432

# Redis (Optional)
REDIS_URL=redis://localhost:6379/0
REDIS_ENABLED=true

# Security
SECRET_KEY=your-secret-key-here-min-32-characters
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Email SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USE_TLS=true

# AI APIs
ANTHROPIC_API_KEY=your-anthropic-api-key
OPENAI_API_KEY=your-openai-api-key

# File Storage
STORAGE_BASE_PATH=storage
MAX_FILE_SIZE_MB=25
MAX_STORAGE_QUOTA_MB=500
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=HR Resume Assistant
NEXT_PUBLIC_VERSION=3.1.0
```

---

## Usage Guide

### 1. Document Management (NEW)

#### Upload Resume
1. Go to **Documents** page
2. Click **"Upload Resume"** button
3. Select PDF/DOC/DOCX file
4. AI automatically parses the document
5. View extracted skills, experience, education

#### Upload Info Document
1. On Documents page, switch to **"Info Docs"** tab
2. Click **"Upload Info Doc"** button
3. Select any document file
4. AI extracts key information for context

#### Preview Documents
1. Click on any document card
2. Preview dialog opens with PDF/Image viewer
3. Use fullscreen toggle for better viewing
4. Download original file if needed

#### Re-parse Documents
1. Click the re-parse button on document viewer
2. AI re-analyzes the document
3. Updated extracted data is saved

### 2. Follow-up Queue (NEW)

#### View Follow-up Queue
1. Go to **Recipients** page
2. Click **"Follow-up Queue"** tab
3. See recipients needing follow-up
4. Filter by days since last contact (3-30 days)

#### Configure Auto Follow-ups
1. Click **"Auto Follow-up Settings"** button
2. Enable auto follow-ups toggle
3. Set days before follow-up
4. Set maximum follow-ups per recipient
5. Save settings

#### Send Follow-ups
1. Select recipients in queue
2. Click **"Send Follow-ups"** button
3. Choose template or write custom message
4. Use variables: `{name}`, `{company}`, `{position}`, `{days_waiting}`
5. Send to selected recipients

### 3. AI Email Generation

#### Step 1: Research Company
1. On Recipients page, click any recipient row
2. **UltraEmailPanel** slides in from right
3. **Research Tab** auto-starts company research
4. Shows: Tech Stack, Culture, Projects, News
5. Cached for 7 days

#### Step 2: Generate Emails
1. **Generate Tab** creates 5 email variations
2. Styles: Professional, Enthusiastic, Story, Value, Consultant
3. Each shows personalization score and matched skills

#### Step 3: Send Email
1. Select preferred email variation
2. Edit if needed in Preview tab
3. Choose resume attachment from Documents
4. Send immediately or schedule

### 4. Extraction Engine

1. Go to **Extraction** page
2. **Step 1**: Select sector (Clients, Companies, Recruiters, Customers)
3. **Step 2**: Configure sources (URLs, Files, APIs)
4. **Step 3**: Set filters (job titles, locations, tech stack)
5. **Step 4**: Watch real-time progress
6. **Step 5**: Review and export data
7. **Step 6**: Import to Recipients

---

## Troubleshooting

### Common Issues

#### 1. CORS Errors in Frontend

**Error**: `No 'Access-Control-Allow-Origin' header`

**Solution**: Ensure backend `.env` has correct CORS_ORIGINS:
```env
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

#### 2. Database Connection Failed

**Error**: `could not connect to server`

**Solution**:
1. Ensure PostgreSQL is running
2. Check credentials in `.env`
3. Verify database exists

#### 3. Redis Connection Failed

**Error**: `Connection refused to Redis`

**Solution**:
1. Set `REDIS_ENABLED=false` in `.env` to use memory cache
2. Or start Redis server

#### 4. AI API Errors

**Error**: `Invalid API key` or `Rate limit exceeded`

**Solution**:
1. Check `ANTHROPIC_API_KEY` and `OPENAI_API_KEY` in `.env`
2. Verify API keys are active and have credits

---

## Security Features

- JWT authentication with refresh tokens
- Token blacklist on logout (Redis-backed)
- Password hashing with bcrypt
- Rate limiting (distributed with Redis)
- SQL injection protection (SQLAlchemy ORM)
- XSS protection (React automatic escaping)
- CORS configuration
- File upload validation
- Storage quota management

---

## File Storage

### Storage Quotas

- **Default per user**: 500 MB
- **Max file size**: 25 MB per upload
- **Allowed resume formats**: PDF, DOC, DOCX
- **Allowed attachment formats**: PDF, DOC, DOCX, PNG, JPG, JPEG, TXT, ZIP

### Storage Structure

```
storage/
├── users/
│   └── {user_id}/
│       ├── resumes/
│       │   └── {resume_id}_{filename}
│       ├── info-docs/
│       │   └── {doc_id}_{filename}
│       └── attachments/
│           └── {attachment_id}_{filename}
└── system/
    └── templates/
```

---

## Design System

### Colors

- **Primary**: Indigo (600, 500, 400)
- **Success**: Green (600, 500, 400)
- **Warning**: Yellow (600, 500, 400)
- **Error**: Red (600, 500, 400)
- **Background**: Slate (950, 900, 800)
- **Text**: White, Slate (100-400)

### Typography

- **Font**: Inter (system fallback)
- **Sizes**: xs (12px), sm (14px), base (16px), lg (18px), xl (20px), 2xl (24px)

### Animations

- **Spring Physics**: `{ type: "spring", stiffness: 400, damping: 15 }`
- **Durations**: Instant (0ms), Fast (200ms), Normal (300ms), Slow (500ms)

---

## Development

### Backend Development

```bash
cd backend

# Run with auto-reload
uvicorn app.main:app --reload --port 8000

# Run tests
pytest

# Format code
black app
isort app
```

### Frontend Development

```bash
cd frontend

# Run development server
npm run dev

# Type check
npm run type-check

# Build for production
npm run build
```

### Database Migrations

```bash
cd backend

# Create new migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1
```

---

## Documentation

### Additional Docs

- **API Reference**: Visit http://localhost:8000/docs (Swagger UI)
- **Database Schema**: See `backend/app/models/`
- **Component Docs**: See JSDoc comments in component files

---

## What's Next?

### Planned Features (V3.2)

- [ ] Multi-user workspace support
- [ ] Advanced email scheduling with timezone support
- [ ] Email A/B testing improvements
- [ ] Response tracking & parsing
- [ ] AI-powered follow-up suggestions
- [ ] CRM integrations (Salesforce, HubSpot)
- [ ] Mobile app (React Native)
- [ ] Browser extension for LinkedIn integration

---

## Developer

**Created by**: MetaMinds Work UX Team
**Version**: 3.1.0
**Last Updated**: January 2026

---

## License

Proprietary. All rights reserved.

---

## Links

- **Repository**: https://github.com/metamindswork-ux/COLD-EMAIL-WEB-APPLICATION
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## Acknowledgments

- **Next.js Team** - For the amazing React framework
- **FastAPI** - For the high-performance Python framework
- **Anthropic** - For Claude AI API
- **OpenAI** - For GPT API
- **Radix UI** - For accessible component primitives
- **Framer Motion** - For beautiful animations
- **Tailwind CSS** - For utility-first styling

---

**Built with Next.js, FastAPI, and Claude AI**

**Version 3.1.0** | January 2026
