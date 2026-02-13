"""Email Template Management Endpoints"""
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from jinja2 import Template, TemplateError

from app.core.database import get_database_session
from app.models.candidate import Candidate
from app.models.email_template import EmailTemplate, EmailLanguage, TemplateCategory
from app.schemas.email_template import (
    EmailTemplateCreate,
    EmailTemplateUpdate,
    EmailTemplateResponse,
    EmailTemplateListResponse,
    EmailTemplatePreviewRequest,
    EmailTemplatePreviewResponse
)
from app.api.dependencies import get_current_candidate

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/", response_model=EmailTemplateResponse, status_code=status.HTTP_201_CREATED)
def create_email_template(
    template_create: EmailTemplateCreate,
    current_candidate: Candidate = Depends(get_current_candidate),
    db: Session = Depends(get_database_session)
):
    """Create a new email template"""
    try:
        # Validate templates are valid Jinja2
        try:
            Template(template_create.subject_template)
            Template(template_create.body_template_html)
            if template_create.body_template_text:
                Template(template_create.body_template_text)
        except TemplateError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid Jinja2 template syntax: {str(e)}"
            )

        # If setting as default, unset other defaults for this category
        if template_create.is_default:
            db.query(EmailTemplate).filter(
                EmailTemplate.candidate_id == current_candidate.id,
                EmailTemplate.category == template_create.category,
                EmailTemplate.is_default == True
            ).update({"is_default": False})

        # Create email template
        email_template = EmailTemplate(
            candidate_id=current_candidate.id,
            **template_create.model_dump()
        )

        db.add(email_template)
        db.commit()
        db.refresh(email_template)

        logger.info(f"Created email template {email_template.id} for candidate {current_candidate.id}")
        return email_template

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating email template: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create email template: {str(e)}"
        )


@router.get("/", response_model=EmailTemplateListResponse)
def list_email_templates(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    category: Optional[TemplateCategory] = None,
    language: Optional[EmailLanguage] = None,
    target_position: Optional[str] = None,
    target_country: Optional[str] = None,
    is_active: Optional[bool] = None,
    current_candidate: Candidate = Depends(get_current_candidate),
    db: Session = Depends(get_database_session)
):
    """List all email templates for the current candidate"""
    logger.debug(f"[EmailTemplates] Listing templates for candidate {current_candidate.id}, skip={skip}, limit={limit}")

    query = db.query(EmailTemplate).filter(
        EmailTemplate.candidate_id == current_candidate.id,
        EmailTemplate.deleted_at.is_(None)
    )

    # Apply filters
    if category:
        query = query.filter(EmailTemplate.category == category)
    if language:
        query = query.filter(EmailTemplate.language == language)
    if target_position:
        query = query.filter(EmailTemplate.target_position.ilike(f"%{target_position}%"))
    if target_country:
        query = query.filter(EmailTemplate.target_country.ilike(f"%{target_country}%"))
    if is_active is not None:
        query = query.filter(EmailTemplate.is_active == is_active)

    total = query.count()
    items = query.order_by(EmailTemplate.created_at.desc()).offset(skip).limit(limit).all()

    logger.debug(f"[EmailTemplates] Found {len(items)} templates (total: {total})")

    return EmailTemplateListResponse(total=total, items=items)


@router.get("/{template_id}", response_model=EmailTemplateResponse)
def get_email_template(
    template_id: int,
    current_candidate: Candidate = Depends(get_current_candidate),
    db: Session = Depends(get_database_session)
):
    """Get a specific email template"""
    template = db.query(EmailTemplate).filter(
        EmailTemplate.id == template_id,
        EmailTemplate.candidate_id == current_candidate.id,
        EmailTemplate.deleted_at.is_(None)
    ).first()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email template not found"
        )

    return template


@router.patch("/{template_id}", response_model=EmailTemplateResponse)
def update_email_template(
    template_id: int,
    template_update: EmailTemplateUpdate,
    current_candidate: Candidate = Depends(get_current_candidate),
    db: Session = Depends(get_database_session)
):
    """Update an email template"""
    template = db.query(EmailTemplate).filter(
        EmailTemplate.id == template_id,
        EmailTemplate.candidate_id == current_candidate.id,
        EmailTemplate.deleted_at.is_(None)
    ).first()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email template not found"
        )

    # Validate new templates if provided
    if template_update.subject_template:
        try:
            Template(template_update.subject_template)
        except TemplateError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid subject template syntax: {str(e)}"
            )

    if template_update.body_template_html:
        try:
            Template(template_update.body_template_html)
        except TemplateError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid HTML body template syntax: {str(e)}"
            )

    if template_update.body_template_text:
        try:
            Template(template_update.body_template_text)
        except TemplateError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid text body template syntax: {str(e)}"
            )

    # If setting as default, unset other defaults for this category
    if template_update.is_default and not template.is_default:
        category = template_update.category if template_update.category else template.category
        db.query(EmailTemplate).filter(
            EmailTemplate.candidate_id == current_candidate.id,
            EmailTemplate.category == category,
            EmailTemplate.is_default == True,
            EmailTemplate.id != template_id
        ).update({"is_default": False})

    # Update fields
    update_data = template_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(template, field, value)

    try:
        db.commit()
        db.refresh(template)
        logger.info(f"[EmailTemplates] Updated template {template_id}")
    except Exception as e:
        db.rollback()
        logger.error(f"[EmailTemplates] Failed to update template {template_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update template")

    return template


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_email_template(
    template_id: int,
    current_candidate: Candidate = Depends(get_current_candidate),
    db: Session = Depends(get_database_session)
):
    """Soft delete an email template"""
    template = db.query(EmailTemplate).filter(
        EmailTemplate.id == template_id,
        EmailTemplate.candidate_id == current_candidate.id,
        EmailTemplate.deleted_at.is_(None)
    ).first()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email template not found"
        )

    # Soft delete
    from datetime import datetime
    template.deleted_at = datetime.utcnow()

    try:
        db.commit()
        logger.info(f"[EmailTemplates] Soft deleted template {template_id}")
    except Exception as e:
        db.rollback()
        logger.error(f"[EmailTemplates] Failed to delete template {template_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete template")

    return None


@router.post("/{template_id}/set-default", response_model=EmailTemplateResponse)
def set_default_template(
    template_id: int,
    current_candidate: Candidate = Depends(get_current_candidate),
    db: Session = Depends(get_database_session)
):
    """Set an email template as default for its category"""
    template = db.query(EmailTemplate).filter(
        EmailTemplate.id == template_id,
        EmailTemplate.candidate_id == current_candidate.id,
        EmailTemplate.deleted_at.is_(None)
    ).first()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email template not found"
        )

    # Unset other defaults for this category
    db.query(EmailTemplate).filter(
        EmailTemplate.candidate_id == current_candidate.id,
        EmailTemplate.category == template.category,
        EmailTemplate.is_default == True
    ).update({"is_default": False})

    # Set this as default
    template.is_default = True

    try:
        db.commit()
        db.refresh(template)
        logger.info(f"[EmailTemplates] Set template {template_id} as default for category {template.category}")
    except Exception as e:
        db.rollback()
        logger.error(f"[EmailTemplates] Failed to set template {template_id} as default: {e}")
        raise HTTPException(status_code=500, detail="Failed to set default template")

    return template


@router.post("/preview", response_model=EmailTemplatePreviewResponse)
def preview_email_template(
    preview_request: EmailTemplatePreviewRequest,
    current_candidate: Candidate = Depends(get_current_candidate),
    db: Session = Depends(get_database_session)
):
    """Preview an email template with test variables"""
    template = db.query(EmailTemplate).filter(
        EmailTemplate.id == preview_request.template_id,
        EmailTemplate.candidate_id == current_candidate.id,
        EmailTemplate.deleted_at.is_(None)
    ).first()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email template not found"
        )

    try:
        # Render templates with provided variables
        subject_template = Template(template.subject_template)
        body_html_template = Template(template.body_template_html)

        subject = subject_template.render(**preview_request.variables)
        body_html = body_html_template.render(**preview_request.variables)

        body_text = None
        if template.body_template_text:
            body_text_template = Template(template.body_template_text)
            body_text = body_text_template.render(**preview_request.variables)

        return EmailTemplatePreviewResponse(
            subject=subject,
            body_html=body_html,
            body_text=body_text
        )

    except TemplateError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Template rendering error: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Error previewing template: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to preview template: {str(e)}"
        )
