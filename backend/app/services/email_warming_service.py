"""Email Warming Service

Handles email warming logic, daily limits, and progress tracking.
"""

from datetime import datetime, timedelta
from typing import Dict, Optional, Tuple
from sqlalchemy.orm import Session

from app.models.email_warming import (
    EmailWarmingConfig,
    EmailWarmingDailyLog,
    WarmingStrategyEnum,
    WarmingStatusEnum,
    WARMING_SCHEDULES
)
from app.core.logger import warming_logger as logger


class EmailWarmingService:
    """Service for managing email warming campaigns"""

    @staticmethod
    def create_config(
        db: Session,
        candidate_id: int,
        strategy: str = WarmingStrategyEnum.MODERATE.value,
        custom_schedule: Optional[Dict[int, int]] = None,
        auto_progress: bool = True
    ) -> EmailWarmingConfig:
        """Create a new email warming configuration"""
        logger.info(f"📝 Creating warming config for candidate {candidate_id}")
        logger.debug(f"   Strategy: {strategy}, Auto-progress: {auto_progress}")

        # Check if config already exists
        existing = db.query(EmailWarmingConfig).filter(
            EmailWarmingConfig.candidate_id == candidate_id
        ).first()

        if existing:
            logger.info(f"✓ Config already exists for candidate {candidate_id} (ID: {existing.id})")
            return existing

        config = EmailWarmingConfig(
            candidate_id=candidate_id,
            strategy=strategy,
            custom_schedule=custom_schedule,
            auto_progress=auto_progress,
            status=WarmingStatusEnum.NOT_STARTED.value
        )

        try:
            db.add(config)
            db.commit()
            db.refresh(config)
            logger.info(f"✓ Created warming config ID {config.id} for candidate {candidate_id}")
        except Exception as e:
            db.rollback()
            logger.error(f"❌ Failed to create warming config for candidate {candidate_id}: {e}")
            raise ValueError(f"Failed to create warming config: {e}")

        return config

    @staticmethod
    def start_warming(db: Session, config_id: int) -> EmailWarmingConfig:
        """Start the warming campaign"""
        logger.info(f"🚀 Starting warming campaign for config ID {config_id}")

        config = db.query(EmailWarmingConfig).filter(
            EmailWarmingConfig.id == config_id
        ).first()

        if not config:
            logger.error(f"❌ Warming config {config_id} not found")
            raise ValueError("Warming config not found")

        config.status = WarmingStatusEnum.ACTIVE.value
        config.start_date = datetime.utcnow()
        config.current_day = 1
        config.emails_sent_today = 0
        config.last_reset_date = datetime.utcnow()

        try:
            db.commit()
            db.refresh(config)
            daily_limit = EmailWarmingService.get_daily_limit(config)
            logger.info(f"✓ Warming campaign started! Day 1, Limit: {daily_limit} emails")
        except Exception as e:
            db.rollback()
            logger.error(f"❌ Failed to start warming campaign for config {config_id}: {e}")
            raise ValueError(f"Failed to start warming campaign: {e}")

        return config

    @staticmethod
    def get_daily_limit(config: EmailWarmingConfig) -> int:
        """Get the daily email limit based on current day and strategy"""

        if config.strategy == WarmingStrategyEnum.CUSTOM.value:
            if config.custom_schedule:
                return config.custom_schedule.get(str(config.current_day), 0)
            return 0

        # Get schedule for the strategy
        schedule = WARMING_SCHEDULES.get(WarmingStrategyEnum(config.strategy), {})

        # Return limit for current day, or max limit if beyond schedule
        if config.current_day in schedule:
            return schedule[config.current_day]
        else:
            # Beyond the schedule, return the max value
            return max(schedule.values()) if schedule else 100

    @staticmethod
    def can_send_email(db: Session, candidate_id: int) -> Tuple[bool, str, int]:
        """
        Check if an email can be sent based on warming limits

        Returns:
            (can_send, reason, remaining_quota)
        """
        logger.debug(f"🔍 Checking warming limits for candidate {candidate_id}")

        config = db.query(EmailWarmingConfig).filter(
            EmailWarmingConfig.candidate_id == candidate_id
        ).first()

        if not config:
            logger.debug(f"   No warming config found - allowing send")
            return True, "No warming config", 999999

        logger.debug(f"   Config ID: {config.id}, Status: {config.status}, Day: {config.current_day}")

        if config.status == WarmingStatusEnum.NOT_STARTED.value:
            logger.info(f"🚀 Auto-starting warming campaign for candidate {candidate_id}")
            EmailWarmingService.start_warming(db, config.id)
            # Refresh config with null check
            refreshed_config = db.query(EmailWarmingConfig).get(config.id)
            if refreshed_config:
                config = refreshed_config
            else:
                logger.error(f"❌ Failed to refresh warming config {config.id} after start")
                return False, "Failed to start warming config", 0

        if config.status == WarmingStatusEnum.PAUSED.value:
            logger.warning(f"⏸️  Warming campaign is PAUSED for candidate {candidate_id}")
            return False, "Warming campaign is paused", 0

        if config.status == WarmingStatusEnum.FAILED.value:
            logger.error(f"❌ Warming campaign FAILED for candidate {candidate_id}")
            return False, "Warming campaign failed", 0

        if config.status == WarmingStatusEnum.COMPLETED.value:
            logger.info(f"✓ Warming COMPLETED for candidate {candidate_id} - no limits")
            return True, "Warming completed", 999999

        # Check if we need to reset daily counter
        EmailWarmingService.check_and_reset_daily_counter(db, config)

        # Get daily limit
        daily_limit = EmailWarmingService.get_daily_limit(config)
        remaining = daily_limit - config.emails_sent_today

        logger.debug(f"   Daily limit: {daily_limit}, Sent today: {config.emails_sent_today}, Remaining: {remaining}")

        if config.emails_sent_today >= daily_limit:
            logger.warning(f"🚫 Daily warming limit REACHED for candidate {candidate_id}: {daily_limit} emails")
            return False, f"Daily warming limit reached ({daily_limit} emails)", 0

        logger.info(f"✓ Can send email - {remaining} remaining of {daily_limit} daily limit")
        return True, "OK", remaining

    @staticmethod
    def record_email_sent(
        db: Session,
        candidate_id: int,
        success: bool = True,
        bounced: bool = False
    ) -> None:
        """Record that an email was sent"""
        logger.info(f"📧 Recording email sent for candidate {candidate_id} (success={success}, bounced={bounced})")

        config = db.query(EmailWarmingConfig).filter(
            EmailWarmingConfig.candidate_id == candidate_id
        ).first()

        if not config:
            logger.debug(f"   No warming config found - skipping record")
            return

        # Increment counters
        config.emails_sent_today += 1
        config.total_emails_sent += 1

        logger.debug(f"   Updated counters: Today={config.emails_sent_today}, Total={config.total_emails_sent}")

        # Update or create daily log
        today_log = db.query(EmailWarmingDailyLog).filter(
            EmailWarmingDailyLog.config_id == config.id,
            EmailWarmingDailyLog.day_number == config.current_day
        ).first()

        if not today_log:
            today_log = EmailWarmingDailyLog(
                config_id=config.id,
                day_number=config.current_day,
                date=datetime.utcnow(),
                daily_limit=EmailWarmingService.get_daily_limit(config)
            )
            db.add(today_log)

        today_log.emails_sent += 1

        if success:
            today_log.emails_delivered += 1
        else:
            today_log.emails_failed += 1

        if bounced:
            today_log.emails_bounced += 1

        # Calculate metrics with division by zero protection
        if today_log.emails_sent and today_log.emails_sent > 0:
            today_log.delivery_rate = (today_log.emails_delivered / today_log.emails_sent) * 100
            today_log.bounce_rate = (today_log.emails_bounced / today_log.emails_sent) * 100
            logger.debug(f"   Metrics: delivery_rate={today_log.delivery_rate:.1f}%, bounce_rate={today_log.bounce_rate:.1f}%")
        else:
            today_log.delivery_rate = 0.0
            today_log.bounce_rate = 0.0
            logger.debug("   No emails sent today, metrics set to 0")

        # Check if limit reached
        if config.emails_sent_today >= EmailWarmingService.get_daily_limit(config):
            today_log.limit_reached = True

        # Update config metrics with N+1 query optimization and division by zero protection
        # Use aggregation instead of iterating over daily_logs to avoid N+1
        from sqlalchemy import func
        totals = db.query(
            func.sum(EmailWarmingDailyLog.emails_delivered).label('delivered'),
            func.sum(EmailWarmingDailyLog.emails_bounced).label('bounced')
        ).filter(EmailWarmingDailyLog.config_id == config.id).first()

        total_delivered = totals.delivered or 0
        total_bounced = totals.bounced or 0
        logger.debug(f"   Aggregated totals: delivered={total_delivered}, bounced={total_bounced}")

        if config.total_emails_sent and config.total_emails_sent > 0:
            config.success_rate = (total_delivered / config.total_emails_sent) * 100
            config.bounce_rate = (total_bounced / config.total_emails_sent) * 100
            logger.debug(f"   Config metrics: success_rate={config.success_rate:.1f}%, bounce_rate={config.bounce_rate:.1f}%")
        else:
            config.success_rate = 0.0
            config.bounce_rate = 0.0
            logger.debug("   No total emails sent, config metrics set to 0")

        # Pause if bounce rate too high
        if config.pause_on_high_bounce and config.bounce_rate > 5.0:
            config.status = WarmingStatusEnum.PAUSED.value
            today_log.notes = f"Auto-paused: Bounce rate {config.bounce_rate:.1f}% exceeds 5%"
            logger.warning(f"⚠️  Auto-pausing warming for config {config.id} due to high bounce rate")

        try:
            db.commit()
            logger.debug(f"   Email record saved for candidate {candidate_id}")
        except Exception as e:
            db.rollback()
            logger.error(f"❌ Failed to record email sent for candidate {candidate_id}: {e}")

    @staticmethod
    def check_and_reset_daily_counter(db: Session, config: EmailWarmingConfig) -> bool:
        """Check if we need to reset daily counter and advance to next day"""
        now = datetime.utcnow()
        last_reset = config.last_reset_date or config.start_date or now

        # Check if a new day has started (using daily_reset_hour)
        hours_since_reset = (now - last_reset).total_seconds() / 3600

        if hours_since_reset >= 24:
            # Reset daily counter
            config.emails_sent_today = 0
            config.last_reset_date = now

            # Auto-progress to next day if enabled
            if config.auto_progress:
                config.current_day += 1
                logger.info(f"📅 Advanced warming to day {config.current_day} for config {config.id}")

                # Check if warming is complete
                max_day = EmailWarmingService.get_max_day_for_strategy(config.strategy)
                if config.current_day > max_day:
                    config.status = WarmingStatusEnum.COMPLETED.value
                    config.completion_date = now
                    logger.info(f"🎉 Warming campaign COMPLETED for config {config.id}")

            try:
                db.commit()
                logger.debug(f"   Daily counter reset for config {config.id}")
            except Exception as e:
                db.rollback()
                logger.error(f"❌ Failed to reset daily counter for config {config.id}: {e}")
                return False
            return True

        return False

    @staticmethod
    def get_max_day_for_strategy(strategy: str) -> int:
        """Get the maximum day number for a strategy"""
        if strategy == WarmingStrategyEnum.CUSTOM.value:
            return 30  # Default for custom

        schedule = WARMING_SCHEDULES.get(WarmingStrategyEnum(strategy), {})
        return max(schedule.keys()) if schedule else 14

    @staticmethod
    def update_strategy(
        db: Session,
        config_id: int,
        strategy: str,
        custom_schedule: Optional[Dict[int, int]] = None
    ) -> EmailWarmingConfig:
        """Update warming strategy"""
        logger.info(f"📝 Updating strategy for config {config_id} to {strategy}")
        config = db.query(EmailWarmingConfig).get(config_id)

        if not config:
            logger.error(f"❌ Config {config_id} not found for strategy update")
            raise ValueError("Config not found")

        config.strategy = strategy
        if strategy == WarmingStrategyEnum.CUSTOM.value:
            config.custom_schedule = custom_schedule

        try:
            db.commit()
            db.refresh(config)
            logger.info(f"✓ Strategy updated for config {config_id}")
        except Exception as e:
            db.rollback()
            logger.error(f"❌ Failed to update strategy for config {config_id}: {e}")
            raise ValueError(f"Failed to update strategy: {e}")

        return config

    @staticmethod
    def pause_warming(db: Session, config_id: int) -> EmailWarmingConfig:
        """Pause the warming campaign"""
        logger.info(f"⏸️  Pausing warming for config {config_id}")
        config = db.query(EmailWarmingConfig).get(config_id)

        if config:
            config.status = WarmingStatusEnum.PAUSED.value
            try:
                db.commit()
                db.refresh(config)
                logger.info(f"✓ Warming paused for config {config_id}")
            except Exception as e:
                db.rollback()
                logger.error(f"❌ Failed to pause warming for config {config_id}: {e}")
        else:
            logger.warning(f"⚠️  Config {config_id} not found for pausing")

        return config

    @staticmethod
    def resume_warming(db: Session, config_id: int) -> EmailWarmingConfig:
        """Resume the warming campaign"""
        logger.info(f"▶️  Resuming warming for config {config_id}")
        config = db.query(EmailWarmingConfig).get(config_id)

        if config:
            config.status = WarmingStatusEnum.ACTIVE.value
            try:
                db.commit()
                db.refresh(config)
                logger.info(f"✓ Warming resumed for config {config_id}")
            except Exception as e:
                db.rollback()
                logger.error(f"❌ Failed to resume warming for config {config_id}: {e}")
        else:
            logger.warning(f"⚠️  Config {config_id} not found for resuming")

        return config

    @staticmethod
    def get_warming_progress(db: Session, candidate_id: int) -> Dict:
        """Get detailed warming progress"""
        config = db.query(EmailWarmingConfig).filter(
            EmailWarmingConfig.candidate_id == candidate_id
        ).first()

        if not config:
            return {
                "enabled": False,
                "status": "not_configured"
            }

        daily_limit = EmailWarmingService.get_daily_limit(config)
        max_day = EmailWarmingService.get_max_day_for_strategy(config.strategy)

        return {
            "enabled": True,
            "status": config.status,
            "strategy": config.strategy,
            "current_day": config.current_day,
            "max_day": max_day,
            "progress_percentage": int((config.current_day / max_day) * 100) if max_day > 0 else 0,
            "daily_limit": daily_limit,
            "emails_sent_today": config.emails_sent_today,
            "remaining_today": max(0, daily_limit - config.emails_sent_today),
            "total_emails_sent": config.total_emails_sent,
            "success_rate": round(config.success_rate, 2),
            "bounce_rate": round(config.bounce_rate, 2),
            "start_date": config.start_date.isoformat() if config.start_date else None,
            "completion_date": config.completion_date.isoformat() if config.completion_date else None
        }
