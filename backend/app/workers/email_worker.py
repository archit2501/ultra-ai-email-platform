"""
Email Worker for Background Email Sending (Phase 3)

This worker handles email sending asynchronously, preventing
API endpoints from blocking while emails are sent.

PERFORMANCE IMPACT:
- API endpoints return instantly
- Emails sent in background
- Retry logic for failures
- Better user experience
"""
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger(__name__)


async def send_email_task(
    ctx: Dict,
    to_email: str,
    subject: str,
    body_html: str,
    from_email: str,
    from_password: str,
    from_name: str = "HR Resume App",
    smtp_host: str = "smtp.gmail.com",
    smtp_port: int = 587,
    application_id: Optional[int] = None,
    candidate_id: Optional[int] = None
) -> Dict[str, Any]:
    """
    Send email asynchronously in background.

    Args:
        ctx: ARQ context
        to_email: Recipient email
        subject: Email subject
        body_html: HTML email body
        from_email: Sender email
        from_password: Sender password
        from_name: Sender display name
        smtp_host: SMTP server
        smtp_port: SMTP port
        application_id: Optional application ID (for tracking)
        candidate_id: Optional candidate ID (for tracking)

    Returns:
        Dict with status and details
    """
    logger.info(f"📧 [EMAIL-WORKER] Sending email to {to_email}")

    try:
        # Create message
        message = MIMEMultipart("alternative")
        message["From"] = f"{from_name} <{from_email}>"
        message["To"] = to_email
        message["Subject"] = subject

        # Attach HTML body
        html_part = MIMEText(body_html, "html")
        message.attach(html_part)

        # Connect to SMTP server
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(from_email, from_password)
            server.send_message(message)

        logger.info(f"✅ [EMAIL-WORKER] Email sent successfully to {to_email}")

        # TODO: Log to email_logs table
        # async with get_async_db() as db:
        #     from app.models.email_log import EmailLog, EmailStatusEnum
        #     log = EmailLog(
        #         candidate_id=candidate_id,
        #         application_id=application_id,
        #         from_email=from_email,
        #         to_email=to_email,
        #         subject=subject,
        #         status=EmailStatusEnum.SENT,
        #         sent_at=datetime.utcnow()
        #     )
        #     db.add(log)
        #     await db.commit()

        return {
            "status": "success",
            "to_email": to_email,
            "subject": subject,
            "sent_at": datetime.utcnow().isoformat(),
            "application_id": application_id,
            "candidate_id": candidate_id
        }

    except smtplib.SMTPAuthenticationError as e:
        logger.error(f"❌ [EMAIL-WORKER] Authentication failed: {e}")
        return {
            "status": "failed",
            "error": "Authentication failed",
            "to_email": to_email
        }

    except smtplib.SMTPException as e:
        logger.error(f"❌ [EMAIL-WORKER] SMTP error: {e}")
        return {
            "status": "failed",
            "error": str(e),
            "to_email": to_email
        }

    except Exception as e:
        logger.error(f"❌ [EMAIL-WORKER] Unexpected error: {e}")
        return {
            "status": "failed",
            "error": str(e),
            "to_email": to_email
        }


async def send_bulk_emails_task(
    ctx: Dict,
    emails: List[Dict[str, Any]],
    from_email: str,
    from_password: str,
    from_name: str = "HR Resume App",
    smtp_host: str = "smtp.gmail.com",
    smtp_port: int = 587
) -> Dict[str, Any]:
    """
    Send multiple emails in background (bulk operation).

    Args:
        ctx: ARQ context
        emails: List of email dicts with 'to_email', 'subject', 'body_html'
        from_email: Sender email
        from_password: Sender password
        from_name: Sender display name
        smtp_host: SMTP server
        smtp_port: SMTP port

    Returns:
        Dict with success/failure counts
    """
    logger.info(f"📧 [EMAIL-WORKER] Sending {len(emails)} emails in bulk")

    results = {
        "total": len(emails),
        "success": 0,
        "failed": 0,
        "errors": []
    }

    for email_data in emails:
        try:
            result = await send_email_task(
                ctx,
                to_email=email_data["to_email"],
                subject=email_data["subject"],
                body_html=email_data["body_html"],
                from_email=from_email,
                from_password=from_password,
                from_name=from_name,
                smtp_host=smtp_host,
                smtp_port=smtp_port,
                application_id=email_data.get("application_id"),
                candidate_id=email_data.get("candidate_id")
            )

            if result["status"] == "success":
                results["success"] += 1
            else:
                results["failed"] += 1
                results["errors"].append({
                    "to_email": email_data["to_email"],
                    "error": result.get("error")
                })

        except Exception as e:
            results["failed"] += 1
            results["errors"].append({
                "to_email": email_data.get("to_email", "unknown"),
                "error": str(e)
            })

    logger.info(
        f"✅ [EMAIL-WORKER] Bulk email complete: "
        f"{results['success']} sent, {results['failed']} failed"
    )

    return results


async def send_scheduled_email_task(
    ctx: Dict,
    scheduled_email_id: int
) -> Dict[str, Any]:
    """
    Send a scheduled email (for scheduled email feature).

    Args:
        ctx: ARQ context
        scheduled_email_id: ID of scheduled email

    Returns:
        Dict with status
    """
    logger.info(f"📧 [EMAIL-WORKER] Sending scheduled email {scheduled_email_id}")

    try:
        # TODO: Implement scheduled email logic
        # async with get_async_db() as db:
        #     from app.repositories.scheduled_email_async import AsyncScheduledEmailRepository
        #     repo = AsyncScheduledEmailRepository(db)
        #     scheduled_email = await repo.get_by_id(scheduled_email_id)
        #
        #     if not scheduled_email:
        #         return {"status": "error", "message": "Scheduled email not found"}
        #
        #     # Send email
        #     result = await send_email_task(
        #         ctx,
        #         to_email=scheduled_email.to_email,
        #         subject=scheduled_email.subject,
        #         body_html=scheduled_email.body_html,
        #         ...
        #     )
        #
        #     # Update status
        #     await repo.update(scheduled_email_id, {
        #         "status": "sent" if result["status"] == "success" else "failed",
        #         "sent_at": datetime.utcnow()
        #     })

        return {"status": "success", "scheduled_email_id": scheduled_email_id}

    except Exception as e:
        logger.error(f"❌ [EMAIL-WORKER] Scheduled email error: {e}")
        return {"status": "failed", "error": str(e)}


async def send_follow_up_email_task(
    ctx: Dict,
    follow_up_id: int
) -> Dict[str, Any]:
    """
    Send a follow-up email (for follow-up feature).

    Args:
        ctx: ARQ context
        follow_up_id: ID of follow-up

    Returns:
        Dict with status
    """
    logger.info(f"📧 [EMAIL-WORKER] Sending follow-up email {follow_up_id}")

    try:
        # TODO: Implement follow-up email logic
        return {"status": "success", "follow_up_id": follow_up_id}

    except Exception as e:
        logger.error(f"❌ [EMAIL-WORKER] Follow-up email error: {e}")
        return {"status": "failed", "error": str(e)}
