"""
Application Configuration Management
"""
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings"""

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"
    )

    # Application
    PROJECT_NAME: str = "HR Resume Assistant API"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = """
## HR Resume Assistant - Cold Email Web Application API

A comprehensive job application management system with intelligent email automation.

### Features:
- **Application Management**: Create, track, and manage job applications
- **Email Automation**: Send personalized cold emails with rate limiting
- **Email Warming**: Gradual domain reputation building
- **Resume Management**: Upload and manage multiple resume versions
- **Template System**: Customizable email templates with variable substitution
- **Analytics**: Real-time statistics and performance tracking
- **Notifications**: In-app notification system

### Authentication:
All protected endpoints require a JWT Bearer token.
Obtain a token via `/api/v1/auth/login` or `/api/v1/auth/login/json`.

### Rate Limiting:
- Login: 5 attempts per minute
- Registration: 3 per minute
- Password change: 3 per hour
- API reads: 100 per minute
- API writes: 30 per minute

### Contact:
For issues, visit: https://github.com/metamindswork-ux/COLD-EMAIL-WEB-APPLICATION
"""
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # API
    API_V1_PREFIX: str = "/api/v1"

    # CORS - stored as string, converted to list when accessed
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003,http://localhost:3004"

    def get_cors_origins(self) -> List[str]:
        """Parse CORS origins from string to list"""
        if isinstance(self.CORS_ORIGINS, str):
            return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
        return self.CORS_ORIGINS

    # Database
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "hr_resume_user"
    POSTGRES_PASSWORD: str = "hr_resume_password"
    POSTGRES_DB: str = "hr_resume_db"
    POSTGRES_PORT: int = 5432

    @property
    def database_url(self) -> str:
        return (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    # Security
    SECRET_KEY: str = "secret"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30  # Short-lived access tokens (30 minutes)
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7     # Long-lived refresh tokens (7 days)

    # Redis (for caching, distributed rate limiting, and token blacklist)
    REDIS_URL: str = "redis://localhost:6379/0"  # Redis connection URL
    REDIS_ENABLED: bool = True  # Enable/disable Redis caching
    REDIS_CACHE_TTL_DEFAULT: int = 3600  # Default cache TTL in seconds (1 hour)
    REDIS_CACHE_TTL_SHORT: int = 300  # Short cache TTL (5 minutes)
    REDIS_CACHE_TTL_LONG: int = 86400  # Long cache TTL (24 hours)

    # Email - Pragya
    PRAGYA_EMAIL: str = "pragyapandey2709@gmail.com"
    PRAGYA_PASSWORD: str = "bicu canf ksgd swzo"
    PRAGYA_RESUME_PATH: str = "resumes/Pragya_Pandey_Resume.pdf"

    # Email - Aniruddh
    ANIRUDDH_EMAIL: str = "atreyaniruddh@gmail.com"
    ANIRUDDH_PASSWORD: str = "your-password-here"
    ANIRUDDH_RESUME_PATH: str = "resumes/ANIRUDDH_ATREY.pdf"

    # SMTP
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USE_TLS: bool = True

    # AI - API Key from environment
    ANTHROPIC_API_KEY: str = ""
    OPENAI_API_KEY: str = ""

    # Data Enrichment APIs (Layer 5)
    APOLLO_API_KEY: str = ""  # Apollo.io for people search & enrichment
    HUNTER_API_KEY: str = ""  # Hunter.io for email verification & finding
    CLEARBIT_API_KEY: str = ""  # Clearbit for company/person enrichment
    PROXYCURL_API_KEY: str = ""  # Proxycurl for legal LinkedIn scraping
    BUILTWITH_API_KEY: str = ""  # BuiltWith for tech stack detection

    # Pagination
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100

    # File Storage & Document Management
    STORAGE_BASE_PATH: str = "storage"
    EXPORTS_DIR: str = "exports"  # Directory for extraction exports
    MAX_FILE_SIZE_MB: int = 25  # Maximum file size per upload
    MAX_STORAGE_QUOTA_MB: int = 500  # Default quota per user
    ALLOWED_RESUME_EXTENSIONS: List[str] = [".pdf", ".doc", ".docx"]
    ALLOWED_ATTACHMENT_EXTENSIONS: List[str] = [".pdf", ".doc", ".docx", ".png", ".jpg", ".jpeg", ".txt", ".zip"]

    @property
    def max_file_size_bytes(self) -> int:
        """Convert MB to bytes"""
        return self.MAX_FILE_SIZE_MB * 1024 * 1024

    @property
    def max_storage_quota_bytes(self) -> int:
        """Convert MB to bytes"""
        return self.MAX_STORAGE_QUOTA_MB * 1024 * 1024


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
