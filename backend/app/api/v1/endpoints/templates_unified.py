"""
Unified Templates API - Shows both EmailTemplates and PersonalizedEmailDrafts
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, desc
from typing import List, Dict, Any
import json
import logging

from app.core.database import get_db
from app.core.auth import get_current_candidate
from app.models.candidate import Candidate
from app.models.email_template import EmailTemplate
from app.models.company_intelligence import PersonalizedEmailDraft
from app.models.company import Company

router = APIRouter()
logger = logging.getLogger(__name__)

# MODULE LOAD MARKER - will print when module is imported/reloaded
import datetime
print(f"[MODULE-LOAD] templates_unified.py loaded at {datetime.datetime.now()}")
logger.info(f"[MODULE-LOAD] templates_unified.py loaded at {datetime.datetime.now()}")


@router.get("/")
async def list_all_templates(
    db: Session = Depends(get_db),
    current_candidate: Candidate = Depends(get_current_candidate),
    limit: int = 100,
    offset: int = 0
):
    """
    Get all templates and AI-generated drafts for current user
    Returns unified list combining EmailTemplate and PersonalizedEmailDraft
    """
    print("="*80)
    print("[ENDPOINT HIT] list_all_templates function called!")
    print(f"[ENDPOINT HIT] Candidate ID: {current_candidate.id}")
    print("="*80)

    # Get traditional email templates using raw SQL to bypass SQLAlchemy import issues
    import sqlite3
    from pathlib import Path

    db_path = Path(__file__).parent.parent.parent.parent.parent / "hr_resume.db"
    print(f"[SQL-DEBUG] Database path: {db_path}")
    print(f"[SQL-DEBUG] Database exists: {db_path.exists()}")
    print(f"[SQL-DEBUG] Candidate ID: {current_candidate.id}")

    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            id, name, description, category, language, tone,
            subject_template, body_template_html, body_template_text,
            target_position, target_industry, target_country, target_company_size,
            is_default, is_active, times_used, last_used_at, created_at
        FROM email_templates
        WHERE candidate_id = ? AND is_active = 1 AND deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT ?
    """, (current_candidate.id, limit))

    templates_rows = cursor.fetchall()
    print(f"[SQL-DEBUG] Query returned {len(templates_rows)} rows")

    # DEBUG: Log what we got
    logger.info(f"[TEMPLATES-DEBUG] Database path: {db_path}")
    logger.info(f"[TEMPLATES-DEBUG] Database exists: {db_path.exists()}")
    logger.info(f"[TEMPLATES-DEBUG] Current candidate ID: {current_candidate.id}")
    logger.info(f"[TEMPLATES-DEBUG] Found {len(templates_rows)} traditional templates")
    if templates_rows:
        logger.info(f"[TEMPLATES-DEBUG] First template: {dict(templates_rows[0])}")
    else:
        logger.warning(f"[TEMPLATES-DEBUG] NO TRADITIONAL TEMPLATES FOUND for candidate {current_candidate.id}!")

    # Get AI-generated drafts using the same connection
    cursor.execute("""
        SELECT
            ped.id, ped.subject_line, ped.email_body, ped.email_html,
            ped.tone, ped.personalization_level, ped.confidence_score,
            ped.is_favorite, ped.is_used, ped.generation_params,
            ped.created_at, ped.used_at, c.name as company_name
        FROM personalized_email_drafts ped
        JOIN companies c ON ped.company_id = c.id
        WHERE ped.candidate_id = ?
        ORDER BY ped.created_at DESC
        LIMIT ?
    """, (current_candidate.id, limit))

    drafts_with_company = cursor.fetchall()
    conn.close()

    # Transform templates to unified format
    items = []

    # Add traditional templates
    for row in templates_rows:
        items.append({
            "id": row['id'],
            "type": "template",
            "name": row['name'],
            "subject_template": row['subject_template'],
            "body_template_html": row['body_template_html'],
            "category": row['category'] or "general",
            "language": row['language'] or "english",
            "tone": row['tone'],
            "target_position": row['target_position'],
            "target_country": row['target_country'],
            "is_default": bool(row['is_default']),
            "is_active": bool(row['is_active']),
            "times_used": row['times_used'] or 0,
            "created_at": row['created_at'],
            "last_used_at": row['last_used_at'],
        })

    # Add AI-generated drafts
    for row in drafts_with_company:
        # Parse generation params if available
        gen_params = {}
        if row['generation_params']:
            try:
                gen_params = json.loads(row['generation_params']) if isinstance(row['generation_params'], str) else row['generation_params']
            except:
                pass

        items.append({
            "id": row['id'],
            "type": "ai_draft",
            "name": f"AI Generated - {row['company_name']} ({row['tone']})",
            "subject_template": row['subject_line'],
            "body_template_html": row['email_html'] or row['email_body'],
            "category": "ai_generated",
            "language": "english",
            "tone": row['tone'],
            "target_position": gen_params.get("recipient_position", ""),
            "target_company": row['company_name'],
            "target_country": gen_params.get("recipient_country", ""),
            "is_default": False,
            "is_active": True,
            "times_used": 0,
            "is_favorite": bool(row['is_favorite']),
            "is_used": bool(row['is_used']),
            "personalization_level": row['personalization_level'],
            "confidence_score": row['confidence_score'],
            "matched_skills": gen_params.get("matched_skills", []),
            "estimated_response_rate": gen_params.get("estimated_response_rate", ""),
            "created_at": row['created_at'] if row['created_at'] else None,
            "used_at": row['used_at'] if row['used_at'] else None,
        })

    # Sort by created_at descending
    items.sort(key=lambda x: x.get("created_at") or "", reverse=True)

    # ADD VERY OBVIOUS DEBUG INFO
    logger.info(f"[FINAL-RETURN] Returning {len(items)} items: {len(templates_rows)} traditional, {len(drafts_with_company)} AI drafts")

    return {
        "items": items,
        "total": len(items),
        "traditional_templates": len(templates_rows),
        "ai_drafts": len(drafts_with_company),
        "debug_info": f"traditional={len(templates_rows)}, ai={len(drafts_with_company)}, candidate_id={current_candidate.id}"
    }


@router.get("/ai-drafts")
async def list_ai_drafts(
    db: Session = Depends(get_db),
    current_candidate: Candidate = Depends(get_current_candidate),
    limit: int = 100
):
    """Get only AI-generated email drafts"""

    stmt = (
        select(PersonalizedEmailDraft, Company.name)
        .join(Company, PersonalizedEmailDraft.company_id == Company.id)
        .where(PersonalizedEmailDraft.candidate_id == current_candidate.id)
        .order_by(desc(PersonalizedEmailDraft.created_at))
        .limit(limit)
    )
    results = db.execute(stmt).all()

    items = []
    for draft, company_name in results:
        gen_params = {}
        if draft.generation_params:
            try:
                gen_params = json.loads(draft.generation_params) if isinstance(draft.generation_params, str) else draft.generation_params
            except:
                pass

        items.append({
            "id": draft.id,
            "company_name": company_name,
            "recipient_name": gen_params.get("recipient_name"),
            "recipient_position": gen_params.get("recipient_position"),
            "subject_line": draft.subject_line,
            "email_body": draft.email_body,
            "tone": draft.tone.value if hasattr(draft.tone, 'value') else draft.tone,
            "personalization_level": draft.personalization_level,
            "confidence_score": draft.confidence_score,
            "matched_skills": gen_params.get("matched_skills", []),
            "estimated_response_rate": gen_params.get("estimated_response_rate"),
            "is_favorite": draft.is_favorite,
            "is_used": draft.is_used,
            "created_at": draft.created_at.isoformat() if draft.created_at else None,
        })

    return {
        "items": items,
        "total": len(items)
    }


@router.get("/stats")
async def get_template_stats(
    db: Session = Depends(get_db),
    current_candidate: Candidate = Depends(get_current_candidate)
):
    """Get statistics about templates and drafts"""

    # Count templates
    templates_count = db.execute(
        select(EmailTemplate)
        .where(EmailTemplate.candidate_id == current_candidate.id)
        .where(EmailTemplate.deleted_at.is_(None))
    ).scalars().all()

    # Count AI drafts
    drafts_count = db.execute(
        select(PersonalizedEmailDraft)
        .where(PersonalizedEmailDraft.candidate_id == current_candidate.id)
    ).scalars().all()

    return {
        "total_templates": len(templates_count),
        "total_ai_drafts": len(drafts_count),
        "total": len(templates_count) + len(drafts_count),
        "active_templates": sum(1 for t in templates_count if t.is_active),
        "favorite_drafts": sum(1 for d in drafts_count if d.is_favorite),
        "used_drafts": sum(1 for d in drafts_count if d.is_used),
    }

