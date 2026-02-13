"""
TheMobiAdz Extraction API Endpoints

API for extracting app/game/e-commerce company data.
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import asyncio
import logging
import uuid

from app.services.mobiadz_extraction_engine import (
    MobiAdzExtractionEngine,
    MobiAdzConfig,
    Demographic,
    ProductCategory,
    DEMOGRAPHIC_COUNTRIES,
    CATEGORY_KEYWORDS
)

logger = logging.getLogger(__name__)

router = APIRouter()

# Store active jobs with expiration tracking
active_jobs: Dict[str, Dict[str, Any]] = {}

# Job cleanup settings
MAX_COMPLETED_JOBS = 100
JOB_EXPIRY_HOURS = 24


def cleanup_old_jobs():
    """Remove old completed/failed jobs to prevent memory leaks"""
    now = datetime.utcnow()
    jobs_to_remove = []

    for job_id, job in active_jobs.items():
        if job["status"] in ["completed", "failed", "cancelled"]:
            created_at = datetime.fromisoformat(job["created_at"])
            if now - created_at > timedelta(hours=JOB_EXPIRY_HOURS):
                jobs_to_remove.append(job_id)

    # Also limit total completed jobs
    completed_jobs = [
        (job_id, datetime.fromisoformat(job["created_at"]))
        for job_id, job in active_jobs.items()
        if job["status"] in ["completed", "failed", "cancelled"]
    ]
    completed_jobs.sort(key=lambda x: x[1])

    if len(completed_jobs) > MAX_COMPLETED_JOBS:
        for job_id, _ in completed_jobs[:-MAX_COMPLETED_JOBS]:
            if job_id not in jobs_to_remove:
                jobs_to_remove.append(job_id)

    for job_id in jobs_to_remove:
        del active_jobs[job_id]

    if jobs_to_remove:
        logger.info(f"Cleaned up {len(jobs_to_remove)} old jobs")


class DemographicOption(BaseModel):
    """Demographic option for frontend"""
    value: str
    label: str
    countries: List[str]


class CategoryOption(BaseModel):
    """Category option for frontend"""
    value: str
    label: str
    keywords: List[str]


class ExtractionRequest(BaseModel):
    """Request to start extraction"""
    demographics: List[str] = Field(..., description="List of demographics to target")
    categories: List[str] = Field(..., description="List of product categories")
    use_paid_apis: bool = Field(False, description="Use paid APIs for enrichment")
    max_companies: int = Field(100, ge=10, le=5000)  # Increased to 5000
    max_apps_per_category: int = Field(50, ge=10, le=500)  # Increased to 500
    website_scrape_depth: int = Field(6, ge=1, le=10)

    # Deduplication options
    exclude_previous_job_id: Optional[str] = Field(None, description="Exclude contacts from a previous job")
    exclude_domains: List[str] = Field(default_factory=list, description="Domains to exclude")
    exclude_emails: List[str] = Field(default_factory=list, description="Emails to exclude")

    # Advanced options
    enable_deep_osint: bool = Field(True, description="Enable deep OSINT research")
    enable_email_verification: bool = Field(True, description="Enable MX record verification")
    enable_social_scraping: bool = Field(True, description="Enable social media scraping")

    # Optional API keys for paid mode
    hunter_api_key: Optional[str] = None
    clearbit_api_key: Optional[str] = None
    apollo_api_key: Optional[str] = None


class RerunRequest(BaseModel):
    """Request to rerun a job with same or modified settings"""
    mode: str = Field("same", description="same, same_exclude_found, or new")
    # For 'new' mode, provide new settings
    demographics: Optional[List[str]] = None
    categories: Optional[List[str]] = None
    max_companies: Optional[int] = None


class ExportToRecipientsRequest(BaseModel):
    """Request to export results to recipients"""
    group_name: str = Field(..., description="Name for the recipient group")
    filter_duplicates: bool = Field(True, description="Filter out duplicates")
    only_with_email: bool = Field(True, description="Only include contacts with email")


class LiveContact(BaseModel):
    """Live contact discovered during extraction"""
    id: str
    timestamp: str
    company_name: str
    app_or_product: Optional[str] = None
    email: Optional[str] = None
    person_name: Optional[str] = None
    type: str  # "app", "company", "email", "person", "leadership"
    source: str
    confidence: int = 0
    playstore_url: Optional[str] = None
    website: Optional[str] = None


class ExtractionJob(BaseModel):
    """Extraction job status"""
    job_id: str
    status: str  # pending, running, completed, failed
    progress: Dict[str, Any]
    stats: Dict[str, Any]
    created_at: str
    completed_at: Optional[str] = None
    results_count: int = 0
    live_contacts: List[LiveContact] = []


class ExtractionResult(BaseModel):
    """Single extraction result"""
    company_name: str
    app_or_product: Optional[str]
    product_category: Optional[str]
    demographic: Optional[str]
    company_website: Optional[str]
    company_domain: Optional[str]
    company_description: Optional[str]
    company_linkedin: Optional[str]
    contact_email: Optional[str]
    marketing_email: Optional[str]
    sales_email: Optional[str]
    support_email: Optional[str]
    playstore_url: Optional[str]
    appstore_url: Optional[str]
    people: List[Dict[str, Any]] = []
    confidence_score: int = 0
    data_sources: List[str] = []


@router.get("/demographics", response_model=List[DemographicOption])
async def get_demographics():
    """Get available demographics for selection"""
    demographics = []

    for demo in Demographic:
        demographics.append(DemographicOption(
            value=demo.value,
            label=demo.name.replace("_", " ").title(),
            countries=DEMOGRAPHIC_COUNTRIES.get(demo, [])
        ))

    return demographics


@router.get("/categories", response_model=List[CategoryOption])
async def get_categories():
    """Get available product categories for selection"""
    categories = []

    for cat in ProductCategory:
        categories.append(CategoryOption(
            value=cat.value,
            label=cat.name.replace("_", " ").title(),
            keywords=CATEGORY_KEYWORDS.get(cat, [cat.value])
        ))

    return categories


@router.post("/extract", response_model=ExtractionJob)
async def start_extraction(
    request: ExtractionRequest,
    background_tasks: BackgroundTasks
):
    """Start a new extraction job"""
    # Cleanup old jobs first
    cleanup_old_jobs()

    # Create job ID
    job_id = str(uuid.uuid4())

    # Initialize job with proper default stats and save config for rerun
    active_jobs[job_id] = {
        "status": "pending",
        "progress": {"stage": "initializing", "stage_progress": 0, "total_progress": 0, "message": "Starting..."},
        "stats": {
            "apps_found": 0,
            "companies_found": 0,
            "emails_found": 0,
            "emails_verified": 0,
            "pages_scraped": 0,
            "api_calls": 0,
            "bloom_filter_hits": 0,
            "cache_hits": 0,
            "nlp_entities_extracted": 0,
            "email_permutations_generated": 0,
            "osint_leadership_found": 0,
            "osint_employees_found": 0,
            "osint_phones_found": 0,
            "osint_social_profiles_found": 0
        },
        "results": [],
        "live_contacts": [],  # Live feed of discovered contacts
        "created_at": datetime.utcnow().isoformat(),
        "completed_at": None,
        # Store config for rerun capability
        "config": {
            "demographics": request.demographics,
            "categories": request.categories,
            "use_paid_apis": request.use_paid_apis,
            "max_companies": request.max_companies,
            "max_apps_per_category": request.max_apps_per_category,
            "website_scrape_depth": request.website_scrape_depth,
            "enable_deep_osint": request.enable_deep_osint,
            "enable_email_verification": request.enable_email_verification,
            "enable_social_scraping": request.enable_social_scraping
        }
    }

    # Start extraction in background
    background_tasks.add_task(
        run_extraction_job,
        job_id,
        request
    )

    return ExtractionJob(
        job_id=job_id,
        status="pending",
        progress=active_jobs[job_id]["progress"],
        stats={},
        created_at=active_jobs[job_id]["created_at"]
    )


async def run_extraction_job(job_id: str, request: ExtractionRequest):
    """Background task to run extraction"""
    try:
        active_jobs[job_id]["status"] = "running"

        # Convert strings to enums
        demographics = []
        for d in request.demographics:
            try:
                demographics.append(Demographic(d))
            except ValueError:
                pass

        categories = []
        for c in request.categories:
            try:
                categories.append(ProductCategory(c))
            except ValueError:
                pass

        if not demographics:
            demographics = [Demographic.USA]
        if not categories:
            categories = [ProductCategory.MOBILE_APPS]

        # Create config with all API keys
        config = MobiAdzConfig(
            demographics=demographics,
            categories=categories,
            max_companies=request.max_companies,
            max_apps_per_category=request.max_apps_per_category,
            website_scrape_depth=request.website_scrape_depth,
            use_paid_apis=request.use_paid_apis,
            hunter_api_key=request.hunter_api_key,
            clearbit_api_key=request.clearbit_api_key,
            apollo_api_key=request.apollo_api_key
        )

        # Create engine and run
        engine = MobiAdzExtractionEngine(config)

        # Callback for live contacts
        def on_live_contact(contact_data: dict):
            """Add live contact to the feed (max 100 most recent)"""
            live_contacts = active_jobs[job_id].get("live_contacts", [])
            live_contacts.append(contact_data)
            # Keep only last 100 contacts
            if len(live_contacts) > 100:
                live_contacts = live_contacts[-100:]
            active_jobs[job_id]["live_contacts"] = live_contacts

        # Set the callback on the engine
        engine.set_live_contact_callback(on_live_contact)

        # Create task to update progress
        async def update_progress():
            while active_jobs.get(job_id, {}).get("status") == "running":
                active_jobs[job_id]["progress"] = engine.get_progress()
                active_jobs[job_id]["stats"] = engine.get_stats()
                await asyncio.sleep(1)

        # Start progress updater
        progress_task = asyncio.create_task(update_progress())

        try:
            # Run extraction
            contacts = await engine.run_extraction()

            # Store results
            active_jobs[job_id]["results"] = [
                {
                    "company_name": c.company_name,
                    "app_or_product": c.app_or_product,
                    "product_category": c.product_category,
                    "demographic": c.demographic,
                    "company_website": c.company_website,
                    "company_domain": c.company_domain,
                    "company_description": c.company_description,
                    "company_linkedin": c.company_linkedin,
                    "contact_email": c.contact_email,
                    "marketing_email": c.marketing_email,
                    "sales_email": c.sales_email,
                    "support_email": c.support_email,
                    "playstore_url": c.playstore_url,
                    "appstore_url": c.appstore_url,
                    "people": c.people,
                    "confidence_score": c.confidence_score,
                    "data_sources": c.data_sources
                }
                for c in contacts
            ]

            active_jobs[job_id]["status"] = "completed"
            active_jobs[job_id]["completed_at"] = datetime.utcnow().isoformat()
            active_jobs[job_id]["stats"] = engine.get_stats()

        finally:
            progress_task.cancel()
            await engine.close()

    except Exception as e:
        logger.error(f"Extraction job {job_id} failed: {e}")
        active_jobs[job_id]["status"] = "failed"
        active_jobs[job_id]["stats"]["error"] = str(e)


@router.get("/jobs/{job_id}")
async def get_job_status(job_id: str):
    """Get job status with live contacts"""
    if job_id not in active_jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    job = active_jobs[job_id]

    # Convert live_contacts dicts to LiveContact models and return as dict
    live_contacts = job.get("live_contacts", [])
    logger.info(f"[MOBIADZ] get_job_status: job={job_id}, live_contacts_count={len(live_contacts)}")

    response_data = {
        "job_id": job_id,
        "status": job["status"],
        "progress": job["progress"],
        "stats": job["stats"],
        "created_at": job["created_at"],
        "completed_at": job.get("completed_at"),
        "results_count": len(job.get("results", [])),
        "live_contacts": live_contacts
    }
    logger.info(f"[MOBIADZ] Returning response with keys: {list(response_data.keys())}")
    return response_data


@router.get("/jobs/{job_id}/results", response_model=List[ExtractionResult])
async def get_job_results(
    job_id: str,
    page: int = 1,
    limit: int = 50
):
    """Get extraction results"""
    if job_id not in active_jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    job = active_jobs[job_id]

    if job["status"] not in ["completed", "running"]:
        raise HTTPException(status_code=400, detail="Job not ready")

    results = job.get("results", [])

    # Pagination
    start = (page - 1) * limit
    end = start + limit

    return results[start:end]


@router.delete("/jobs/{job_id}")
async def cancel_job(job_id: str):
    """Cancel a running job"""
    if job_id not in active_jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    if active_jobs[job_id]["status"] == "running":
        active_jobs[job_id]["status"] = "cancelled"

    return {"message": "Job cancelled"}


@router.post("/jobs/{job_id}/export")
async def export_results(
    job_id: str,
    format: str = "json"
):
    """Export results to specified format"""
    if job_id not in active_jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    job = active_jobs[job_id]
    results = job.get("results", [])

    if format == "csv":
        import csv
        import io

        output = io.StringIO()
        if results:
            writer = csv.DictWriter(output, fieldnames=results[0].keys())
            writer.writeheader()
            for row in results:
                # Flatten people list
                row_copy = row.copy()
                row_copy["people"] = str(row_copy.get("people", []))
                row_copy["data_sources"] = ", ".join(row_copy.get("data_sources", []))
                writer.writerow(row_copy)

        return {"content": output.getvalue(), "format": "csv"}

    return {"results": results, "format": "json"}


class QuickExtractRequest(BaseModel):
    """Request for quick extraction"""
    demographics: List[str] = Field(..., description="List of demographics")
    categories: List[str] = Field(..., description="List of categories")
    max_results: int = Field(20, ge=5, le=100, description="Max results to return")


@router.post("/quick-extract")
async def quick_extract(request: QuickExtractRequest):
    """Quick synchronous extraction (limited results)"""
    from app.services.mobiadz_extraction_engine import quick_mobiadz_extraction

    try:
        results = await quick_mobiadz_extraction(
            demographics=request.demographics,
            categories=request.categories,
            max_companies=request.max_results
        )

        return {
            "success": True,
            "count": len(results),
            "results": results
        }

    except Exception as e:
        logger.error(f"Quick extraction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/jobs")
async def list_jobs():
    """List all active extraction jobs with full details"""
    jobs = []
    for job_id, job in active_jobs.items():
        config = job.get("config", {})
        stats = job.get("stats", {})
        jobs.append({
            "job_id": job_id,
            "status": job["status"],
            "progress": job["progress"]["total_progress"],
            "results_count": len(job.get("results", [])),
            "emails_found": stats.get("emails_found", 0),
            "created_at": job["created_at"],
            "completed_at": job.get("completed_at"),
            "demographics": config.get("demographics", []),
            "categories": config.get("categories", []),
            "config": config,  # Include full config for display
            "stats": stats
        })

    # Sort by created_at descending
    jobs.sort(key=lambda x: x["created_at"], reverse=True)

    return {"jobs": jobs, "total": len(jobs)}


@router.post("/jobs/{job_id}/rerun")
async def rerun_job(
    job_id: str,
    request: RerunRequest,
    background_tasks: BackgroundTasks
):
    """Rerun a job with same, modified, or new settings"""
    if job_id not in active_jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    original_job = active_jobs[job_id]
    original_config = original_job.get("config", {})

    # Determine exclusions based on mode
    exclude_domains = []
    exclude_emails = []

    if request.mode == "same_exclude_found":
        # Get domains and emails from previous results to exclude
        for result in original_job.get("results", []):
            if result.get("company_domain"):
                exclude_domains.append(result["company_domain"])
            for email_field in ["contact_email", "marketing_email", "sales_email", "support_email"]:
                if result.get(email_field):
                    exclude_emails.append(result[email_field])

    # Build new request
    if request.mode in ["same", "same_exclude_found"]:
        new_request = ExtractionRequest(
            demographics=original_config.get("demographics", ["usa"]),
            categories=original_config.get("categories", ["mobile_apps"]),
            use_paid_apis=original_config.get("use_paid_apis", False),
            max_companies=original_config.get("max_companies", 100),
            max_apps_per_category=original_config.get("max_apps_per_category", 50),
            website_scrape_depth=original_config.get("website_scrape_depth", 6),
            exclude_domains=exclude_domains,
            exclude_emails=exclude_emails,
            enable_deep_osint=original_config.get("enable_deep_osint", True),
            enable_email_verification=original_config.get("enable_email_verification", True),
            enable_social_scraping=original_config.get("enable_social_scraping", True)
        )
    else:
        # New mode - use provided settings or fall back to original
        new_request = ExtractionRequest(
            demographics=request.demographics or original_config.get("demographics", ["usa"]),
            categories=request.categories or original_config.get("categories", ["mobile_apps"]),
            use_paid_apis=original_config.get("use_paid_apis", False),
            max_companies=request.max_companies or original_config.get("max_companies", 100),
            max_apps_per_category=original_config.get("max_apps_per_category", 50),
            website_scrape_depth=original_config.get("website_scrape_depth", 6),
            enable_deep_osint=True,
            enable_email_verification=True,
            enable_social_scraping=True
        )

    # Start new extraction
    return await start_extraction(new_request, background_tasks)


@router.post("/jobs/{job_id}/export-to-recipients")
async def export_to_recipients(
    job_id: str,
    request: ExportToRecipientsRequest
):
    """Export extraction results to Recipients as a new group"""
    if job_id not in active_jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    job = active_jobs[job_id]
    results = job.get("results", [])

    if not results:
        raise HTTPException(status_code=400, detail="No results to export")

    # Filter results
    contacts_to_export = []
    seen_emails = set()

    for result in results:
        # Get primary email
        email = result.get("contact_email") or result.get("marketing_email") or result.get("sales_email")

        if request.only_with_email and not email:
            continue

        if request.filter_duplicates and email and email in seen_emails:
            continue

        if email:
            seen_emails.add(email)

        contacts_to_export.append({
            "name": result.get("company_name", "Unknown"),
            "email": email,
            "company": result.get("company_name"),
            "website": result.get("company_website"),
            "source": "MobiAdz Extraction",
            "metadata": {
                "app_or_product": result.get("app_or_product"),
                "category": result.get("product_category"),
                "demographic": result.get("demographic"),
                "playstore_url": result.get("playstore_url"),
                "appstore_url": result.get("appstore_url"),
                "linkedin": result.get("company_linkedin"),
                "confidence_score": result.get("confidence_score", 0)
            }
        })

    # Import recipients service and create group
    try:
        from app.api.v1.endpoints.recipients import create_recipient_group, add_recipients_to_group

        # Create group
        from app.schemas.recipients import RecipientGroupCreate
        group_data = RecipientGroupCreate(
            name=request.group_name,
            description=f"Imported from MobiAdz extraction job {job_id[:8]}",
            tags=["mobiadz", "extraction", "auto-import"]
        )

        # Note: This is a simplified version - actual implementation needs proper DB access
        # For now, return the contacts that would be exported
        return {
            "success": True,
            "message": f"Ready to export {len(contacts_to_export)} contacts",
            "group_name": request.group_name,
            "contacts_count": len(contacts_to_export),
            "contacts": contacts_to_export[:10],  # Preview first 10
            "total_available": len(contacts_to_export)
        }

    except ImportError:
        # If recipients module not available, return exportable data
        return {
            "success": True,
            "message": f"Export data prepared for {len(contacts_to_export)} contacts",
            "group_name": request.group_name,
            "contacts_count": len(contacts_to_export),
            "contacts": contacts_to_export
        }


@router.get("/jobs/{job_id}/config")
async def get_job_config(job_id: str):
    """Get the configuration used for a job (for rerun)"""
    if job_id not in active_jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    job = active_jobs[job_id]
    return {
        "job_id": job_id,
        "config": job.get("config", {}),
        "status": job["status"],
        "created_at": job["created_at"],
        "completed_at": job.get("completed_at"),
        "results_count": len(job.get("results", []))
    }


@router.get("/stats/summary")
async def get_extraction_stats():
    """Get overall extraction statistics"""
    total_jobs = len(active_jobs)
    completed_jobs = sum(1 for j in active_jobs.values() if j["status"] == "completed")
    running_jobs = sum(1 for j in active_jobs.values() if j["status"] == "running")
    total_contacts = sum(len(j.get("results", [])) for j in active_jobs.values())
    total_emails = sum(
        sum(1 for r in j.get("results", []) if r.get("contact_email") or r.get("marketing_email"))
        for j in active_jobs.values()
    )

    return {
        "total_jobs": total_jobs,
        "completed_jobs": completed_jobs,
        "running_jobs": running_jobs,
        "total_contacts_extracted": total_contacts,
        "total_emails_found": total_emails,
        "jobs_with_results": sum(1 for j in active_jobs.values() if j.get("results"))
    }
