"""
THEMOBIADZ EXTRACTION ENGINE V2.0 - ULTRA INTEGRATED
Specialized App/Game/E-commerce Company Data Extraction

AI/ML-POWERED ULTRA FEATURES:
=============================
- SpaCy NER for entity extraction
- 50+ email patterns with permutation generator
- Advanced data structures (Bloom Filter, LRU Cache, Trie)
- DNS & SSL certificate intelligence
- GitHub organization email extraction
- Wayback Machine historical email discovery
- Fuzzy matching for deduplication
- Email verification with MX records

This engine focuses on finding:
- Mobile App Developers (Android/iOS)
- Game Development Companies
- E-commerce Platforms
- Product-based Companies
- Ads-based Companies

Data Sources (20+):
1. Google Play Store (apps, games, developers)
2. Apple App Store (iTunes API)
3. Microsoft Store
4. Steam (games)
5. Company Websites (6-7 level deep scraping)
6. LinkedIn (company profiles)
7. Crunchbase (startup data)
8. ProductHunt (new products)
9. GitHub Organizations & Commits
10. npm Registry (maintainer emails)
11. HackerNews mentions
12. DNS/MX Records
13. SSL Certificate Transparency (crt.sh)
14. Wayback Machine historical data
15. WHOIS domain data

Two Modes:
- FREE: All free scraping methods + AI/ML enhancements
- PAID: APIs + enhanced data (with free fallback)
"""

import asyncio
import logging
import re
import json
from typing import Dict, Any, List, Optional, Set, Tuple
from dataclasses import dataclass, field
from datetime import datetime
from urllib.parse import urlparse, urlencode, quote, parse_qs
from enum import Enum

import httpx
from bs4 import BeautifulSoup

# Import Ultra Engine components
from app.services.mobiadz_ultra_engine import (
    BloomFilter,
    LRUCache,
    EmailPatternTrie,
    PriorityURLQueue,
    NLPEntityExtractor,
    EmailPermutationGenerator,
    EmailVerifier,
    FuzzyMatcher,
    GitHubOrganizationScraper,
    NPMPackageScraper,
    HackerNewsScraper,
    DNSIntelligence,
    SSLCertificateIntelligence,
    WaybackIntelligence,
    MobiAdzUltraEngine
)

# Import OSINT Engine components
from app.services.mobiadz_osint_engine import (
    MobiAdzOSINTEngine,
    GoogleDorkingOSINT,
    LinkedInPublicOSINT,
    GitHubOSINT,
    SocialMediaOSINT,
    DomainOSINT,
    EmailOSINT,
    CompanyRegistryOSINT,
    PersonIntel,
    CompanyIntel
)

# Import FREE Web Search Engine
from app.services.mobiadz_web_search import (
    MobiAdzWebSearch,
    DuckDuckGoSearch,
    BingSearch,
    SearXSearch,
    GoogleDorkSearch,
    EmailExtractor,
    SearchResult
)

logger = logging.getLogger(__name__)

# Import ULTRA DEEP Search Engine V2.0 (15+ FREE layers + 10+ PAID APIs)
try:
    from app.services.ultra_deep_search import (
        UltraDeepSearchEngine,
        MultiEngineSearch,
        ArchiveMiner,
        DNSIntelligence as DNSIntelV2,
        WHOISIntelligence,
        CertificateTransparency,
        SitemapMiner,
        SocialMediaDiscovery,
        DeveloperPlatformSearch,
        JobPostingAnalyzer,
        PressReleaseMiner,
        StartupDatabaseSearch,
        EmailPermutationEngine,
        SMTPVerifier,
        HunterIOClient,
        ClearbitClient,
        ApolloIOClient,
        RocketReachClient,
        SnovIOClient,
        BuiltWithClient,
    )
    ULTRA_DEEP_AVAILABLE = True
    logger.info("✅ ULTRA DEEP Search Engine V2.0 loaded successfully")
except ImportError as e:
    ULTRA_DEEP_AVAILABLE = False
    logger.warning(f"ULTRA DEEP Search Engine not available - some features disabled: {e}")


class Demographic(Enum):
    """Geographic regions for targeting"""
    USA = "usa"
    EUROPE = "europe"
    UK = "uk"
    AUSTRALIA = "australia"
    SINGAPORE = "singapore"
    EAST_ASIA = "east_asia"  # Japan, Korea, China, Taiwan
    SOUTH_ASIA = "south_asia"  # India, Pakistan, Bangladesh
    MIDDLE_EAST = "middle_east"
    RUSSIA = "russia"
    LATIN_AMERICA = "latin_america"
    AFRICA = "africa"
    SOUTHEAST_ASIA = "southeast_asia"  # Thailand, Vietnam, Indonesia, Philippines
    GLOBAL = "global"


class ProductCategory(Enum):
    """Types of products/companies to search"""
    MOBILE_APPS = "mobile_apps"
    ANDROID_APPS = "android_apps"
    IOS_APPS = "ios_apps"
    GAMES = "games"
    ECOMMERCE = "ecommerce"
    PRODUCT_BASED = "product_based"
    ADS_BASED = "ads_based"
    SAAS = "saas"
    FINTECH = "fintech"
    HEALTH_TECH = "health_tech"
    ED_TECH = "ed_tech"
    SOCIAL_MEDIA = "social_media"
    STREAMING = "streaming"
    PRODUCTIVITY = "productivity"
    ENTERPRISE = "enterprise"


# Country codes for app stores by demographic
DEMOGRAPHIC_COUNTRIES = {
    Demographic.USA: ["us"],
    Demographic.EUROPE: ["de", "fr", "es", "it", "nl", "pl", "se", "no", "dk", "fi", "be", "at", "ch"],
    Demographic.UK: ["gb"],
    Demographic.AUSTRALIA: ["au", "nz"],
    Demographic.SINGAPORE: ["sg"],
    Demographic.EAST_ASIA: ["jp", "kr", "cn", "tw", "hk"],
    Demographic.SOUTH_ASIA: ["in", "pk", "bd", "lk"],
    Demographic.MIDDLE_EAST: ["ae", "sa", "eg", "il", "tr"],
    Demographic.RUSSIA: ["ru"],
    Demographic.LATIN_AMERICA: ["br", "mx", "ar", "co", "cl", "pe"],
    Demographic.AFRICA: ["za", "ng", "ke", "eg"],
    Demographic.SOUTHEAST_ASIA: ["th", "vn", "id", "ph", "my"],
    Demographic.GLOBAL: ["us", "gb", "de", "jp", "in", "br"]
}

# Category keywords for search
CATEGORY_KEYWORDS = {
    ProductCategory.MOBILE_APPS: ["mobile app", "app developer", "mobile application"],
    ProductCategory.ANDROID_APPS: ["android app", "android developer", "google play"],
    ProductCategory.IOS_APPS: ["ios app", "iphone app", "app store developer"],
    ProductCategory.GAMES: ["mobile game", "game developer", "gaming studio", "video game"],
    ProductCategory.ECOMMERCE: ["ecommerce", "online store", "marketplace", "shopping app"],
    ProductCategory.PRODUCT_BASED: ["product company", "product startup", "consumer product"],
    ProductCategory.ADS_BASED: ["advertising platform", "ad network", "adtech", "digital advertising"],
    ProductCategory.SAAS: ["saas", "software as a service", "cloud software", "b2b software"],
    ProductCategory.FINTECH: ["fintech", "payment app", "banking app", "crypto", "trading app"],
    ProductCategory.HEALTH_TECH: ["health app", "fitness app", "medical app", "healthcare tech"],
    ProductCategory.ED_TECH: ["education app", "learning app", "edtech", "online course"],
    ProductCategory.SOCIAL_MEDIA: ["social media app", "social network", "messaging app"],
    ProductCategory.STREAMING: ["streaming app", "video streaming", "music streaming", "ott"],
    ProductCategory.PRODUCTIVITY: ["productivity app", "task management", "note app", "calendar app"],
    ProductCategory.ENTERPRISE: ["enterprise software", "business app", "b2b app", "crm"]
}


@dataclass
class MobiAdzConfig:
    """Configuration for TheMobiAdz Extraction Engine V2.0 - ULTRA"""
    # Target settings
    demographics: List[Demographic] = field(default_factory=lambda: [Demographic.USA])
    categories: List[ProductCategory] = field(default_factory=lambda: [ProductCategory.MOBILE_APPS])

    # Search settings
    max_apps_per_category: int = 50
    max_companies: int = 200
    search_timeout: int = 30

    # Scraping depth
    website_scrape_depth: int = 6  # How deep to crawl company websites
    max_pages_per_site: int = 30

    # Contact finding
    find_marketing_contacts: bool = True
    find_sales_contacts: bool = True
    find_founder_contacts: bool = True
    find_general_contacts: bool = True

    # Mode
    use_paid_apis: bool = False

    # API Keys (for paid mode)
    google_api_key: Optional[str] = None
    rapidapi_key: Optional[str] = None
    hunter_api_key: Optional[str] = None
    apollo_api_key: Optional[str] = None
    clearbit_api_key: Optional[str] = None

    # Rate limiting
    requests_per_second: int = 3
    delay_between_requests: float = 0.3

    # Output
    deduplicate: bool = True

    # ========== ULTRA ENGINE SETTINGS ==========
    # AI/ML Features
    use_nlp_extraction: bool = True  # SpaCy NER for entity extraction
    use_email_permutations: bool = True  # Generate 50+ email patterns
    use_email_verification: bool = True  # Verify emails via MX records
    use_fuzzy_matching: bool = True  # Fuzzy deduplication

    # Additional Data Sources
    use_github_extraction: bool = True  # GitHub org & commit emails
    use_npm_extraction: bool = True  # npm registry maintainer emails
    use_hackernews_mentions: bool = True  # HackerNews company mentions
    use_dns_intelligence: bool = True  # DNS TXT/MX record emails
    use_ssl_subdomains: bool = True  # Certificate Transparency subdomains
    use_wayback_machine: bool = True  # Historical email extraction

    # Advanced Data Structures
    use_bloom_filter: bool = True  # O(1) URL deduplication
    use_lru_cache: bool = True  # API response caching
    bloom_filter_size: int = 1000000
    lru_cache_capacity: int = 2000

    # Deep mode
    deep_extraction_mode: bool = True  # Enable all Ultra features

    # ========== OSINT ENGINE SETTINGS ==========
    # Enable OSINT
    use_osint: bool = True  # Enable deep OSINT for companies and people

    # OSINT Features
    osint_find_leadership: bool = True  # Find CEO, CTO, founders, directors
    osint_find_employees: bool = True  # Find employees via LinkedIn/GitHub
    osint_google_dorking: bool = True  # Use Google dorking for emails/phones
    osint_social_media: bool = True  # Find social media profiles
    osint_company_registry: bool = True  # Search OpenCorporates, SEC EDGAR
    osint_domain_intel: bool = True  # WHOIS, DNS, subdomains, tech detection
    osint_email_permutation: bool = True  # Generate email permutations for people
    osint_gravatar_lookup: bool = True  # Check Gravatar for profile photos

    # OSINT Depth
    osint_max_leadership: int = 10  # Max leadership/executives to find
    osint_max_employees: int = 20  # Max employees to find per company
    osint_max_email_permutations: int = 5  # Email variations per person

    # ========== FREE WEB SEARCH SETTINGS ==========
    # Enable FREE web search (DuckDuckGo, Bing, SearX - NO API keys needed)
    use_free_web_search: bool = True  # Enable multi-engine web search
    use_duckduckgo: bool = True  # DuckDuckGo (completely free)
    use_bing_search: bool = True  # Bing web search (free)
    use_searx: bool = True  # SearX meta-search (free, privacy-focused)
    use_google_dorking: bool = True  # Google dorking for targeted results
    web_search_max_results: int = 50  # Max results per search
    web_search_delay: float = 1.0  # Delay between searches to avoid rate limits

    # ========== ULTRA DEEP SEARCH V2.0 SETTINGS ==========
    # Master switch for ULTRA DEEP extraction (15+ FREE layers + 10+ PAID APIs)
    use_ultra_deep_search: bool = True  # Enable ULTRA DEEP search engine

    # FREE LAYERS (no API keys needed)
    ultra_deep_multi_engine: bool = True  # 6 search engines in parallel
    ultra_deep_archive_mining: bool = True  # Wayback, Archive.today, CommonCrawl
    ultra_deep_dns_intel: bool = True  # MX, TXT, SPF, DMARC records
    ultra_deep_whois: bool = True  # Domain WHOIS contacts
    ultra_deep_cert_transparency: bool = True  # CT logs subdomain discovery
    ultra_deep_sitemap_mining: bool = True  # Sitemap/robots.txt pages
    ultra_deep_social_media: bool = True  # LinkedIn, Twitter, Facebook discovery
    ultra_deep_developer_platforms: bool = True  # GitHub, GitLab, npm, PyPI
    ultra_deep_job_postings: bool = True  # Indeed, Glassdoor, LinkedIn Jobs
    ultra_deep_press_releases: bool = True  # PRNewswire, BusinessWire
    ultra_deep_startup_databases: bool = True  # Crunchbase, AngelList, ProductHunt
    ultra_deep_email_permutation: bool = True  # 50+ email patterns
    ultra_deep_smtp_verify: bool = True  # FREE SMTP verification

    # PAID API INTEGRATIONS (need API keys)
    ultra_deep_use_paid_apis: bool = False  # Enable PAID API integrations

    # PAID API Keys (for maximum extraction power)
    hunter_io_api_key: Optional[str] = None  # Hunter.io for email discovery
    clearbit_api_key_v2: Optional[str] = None  # Clearbit for company enrichment
    apollo_io_api_key: Optional[str] = None  # Apollo.io for contacts/leads
    rocketreach_api_key: Optional[str] = None  # RocketReach for verified emails
    snov_io_api_key: Optional[str] = None  # Snov.io for email finder
    builtwith_api_key: Optional[str] = None  # BuiltWith for tech stack

    # ULTRA DEEP Performance settings
    ultra_deep_max_concurrent: int = 10  # Max concurrent requests
    ultra_deep_timeout: int = 60  # Per-layer timeout seconds
    ultra_deep_retry_count: int = 3  # Retries per failed request


@dataclass
class AppData:
    """Data structure for app/product information"""
    app_id: str
    app_name: str
    developer_name: str
    developer_id: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    store: str = "unknown"  # playstore, appstore, microsoft, steam
    store_url: Optional[str] = None
    developer_url: Optional[str] = None
    developer_website: Optional[str] = None
    developer_email: Optional[str] = None  # NEW: Email directly from store page
    icon_url: Optional[str] = None
    rating: Optional[float] = None
    reviews_count: Optional[int] = None
    downloads: Optional[str] = None
    price: Optional[str] = None
    description: Optional[str] = None
    demographic: Optional[str] = None
    extracted_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())


@dataclass
class CompanyContact:
    """Data structure for company contact information"""
    company_name: str
    app_or_product: Optional[str] = None
    product_category: Optional[str] = None
    demographic: Optional[str] = None

    # Company info
    company_website: Optional[str] = None
    company_domain: Optional[str] = None
    company_description: Optional[str] = None
    company_size: Optional[str] = None
    company_industry: Optional[str] = None
    company_founded: Optional[str] = None
    company_location: Optional[str] = None
    company_linkedin: Optional[str] = None

    # Contact emails
    contact_email: Optional[str] = None  # info@, contact@, hello@
    marketing_email: Optional[str] = None
    sales_email: Optional[str] = None
    support_email: Optional[str] = None
    press_email: Optional[str] = None

    # People
    people: List[Dict[str, Any]] = field(default_factory=list)

    # App store data
    playstore_url: Optional[str] = None
    appstore_url: Optional[str] = None

    # Metadata
    data_sources: List[str] = field(default_factory=list)
    confidence_score: int = 0
    extracted_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())

    # Email verification status: "verified" (>80% confidence), "maybe" (50-80%), "not_verified" (<50%)
    email_verification_status: str = "not_verified"
    email_verification_confidence: int = 0
    email_mx_valid: bool = False
    email_is_disposable: bool = False
    email_is_role_based: bool = False


class GooglePlayScraper:
    """
    FREE Google Play Store Scraper
    Extracts app and developer information
    """

    def __init__(self, timeout: int = 30):
        self.timeout = timeout
        self.base_url = "https://play.google.com"
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
        }
        self.client = httpx.AsyncClient(timeout=timeout, follow_redirects=True)

    async def search_apps(
        self,
        query: str,
        country: str = "us",
        category: Optional[str] = None,
        max_results: int = 30
    ) -> List[AppData]:
        """Search for apps on Google Play Store"""
        apps = []

        try:
            # Search URL
            search_url = f"{self.base_url}/store/search"
            params = {
                "q": query,
                "c": "apps",
                "gl": country,
                "hl": "en"
            }

            response = await self.client.get(search_url, params=params, headers=self.headers)

            if response.status_code == 200:
                soup = BeautifulSoup(response.text, "html.parser")

                # Find app cards
                app_links = soup.select("a[href*='/store/apps/details']")

                seen_ids = set()
                for link in app_links[:max_results * 2]:  # Get extra to filter duplicates
                    href = link.get("href", "")

                    # Extract app ID
                    if "id=" in href:
                        app_id = href.split("id=")[1].split("&")[0]

                        if app_id not in seen_ids:
                            seen_ids.add(app_id)

                            # Get app details
                            app_data = await self.get_app_details(app_id, country)
                            if app_data:
                                app_data.demographic = country
                                apps.append(app_data)

                                if len(apps) >= max_results:
                                    break

                            await asyncio.sleep(0.5)

                logger.info(f"PlayStore search '{query}' ({country}): found {len(apps)} apps")

        except Exception as e:
            logger.error(f"PlayStore search error: {e}")

        return apps

    async def get_app_details(self, app_id: str, country: str = "us") -> Optional[AppData]:
        """Get detailed app information"""
        try:
            url = f"{self.base_url}/store/apps/details"
            params = {"id": app_id, "gl": country, "hl": "en"}

            response = await self.client.get(url, params=params, headers=self.headers)

            if response.status_code == 200:
                soup = BeautifulSoup(response.text, "html.parser")

                # Extract app name
                title_elem = soup.select_one("h1[itemprop='name']") or soup.select_one("h1")
                app_name = title_elem.get_text(strip=True) if title_elem else app_id

                # Extract developer
                dev_elem = soup.select_one("a[href*='/store/apps/dev']")
                developer_name = dev_elem.get_text(strip=True) if dev_elem else "Unknown"
                developer_url = self.base_url + dev_elem.get("href") if dev_elem else None
                developer_id = None
                if developer_url and "id=" in developer_url:
                    developer_id = developer_url.split("id=")[1].split("&")[0]

                # Extract developer website
                website_elem = soup.select_one("a[href*='developer.android.com']") or \
                               soup.select_one("a[aria-label*='website']") or \
                               soup.select_one("a[href^='http']:not([href*='play.google.com']):not([href*='google.com'])")

                developer_website = None
                if website_elem:
                    href = website_elem.get("href", "")
                    if href.startswith("http") and "google.com" not in href:
                        developer_website = href

                # Try to find website from the page content
                if not developer_website:
                    # Look for URLs in the description or links section
                    all_links = soup.find_all("a", href=True)
                    for link in all_links:
                        href = link.get("href", "")
                        if href.startswith("http") and not any(x in href for x in ["google.com", "play.google.com", "android.com", "youtube.com"]):
                            developer_website = href
                            break

                # Extract rating
                rating_elem = soup.select_one("[itemprop='ratingValue']") or \
                              soup.select_one("div[aria-label*='Rated']")
                rating = None
                if rating_elem:
                    rating_text = rating_elem.get("content") or rating_elem.get_text()
                    try:
                        rating = float(re.search(r'[\d.]+', rating_text).group())
                    except:
                        pass

                # Extract downloads
                downloads = None
                download_elem = soup.find(string=re.compile(r'\d+[KMB]?\+?\s*(downloads|installs)', re.I))
                if download_elem:
                    downloads = download_elem.strip()

                # Extract category
                category_elem = soup.select_one("a[href*='/store/apps/category/']")
                category = category_elem.get_text(strip=True) if category_elem else None

                # Extract developer email - Play Store shows it in the developer info section
                developer_email = None
                # Method 1: Look for mailto links
                mailto_link = soup.select_one("a[href^='mailto:']")
                if mailto_link:
                    developer_email = mailto_link.get("href", "").replace("mailto:", "").split("?")[0]

                # Method 2: Look for email patterns in the page
                if not developer_email:
                    email_pattern = re.compile(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}')
                    # Look specifically in developer contact section
                    page_text = soup.get_text()
                    emails_found = email_pattern.findall(page_text)
                    # Filter out common non-developer emails
                    for email in emails_found:
                        if not any(x in email.lower() for x in ["@google.com", "@android.com", "@example.com", "@email.com"]):
                            developer_email = email
                            break

                return AppData(
                    app_id=app_id,
                    app_name=app_name,
                    developer_name=developer_name,
                    developer_id=developer_id,
                    developer_url=developer_url,
                    developer_website=developer_website,
                    developer_email=developer_email,
                    store="playstore",
                    store_url=f"{self.base_url}/store/apps/details?id={app_id}",
                    category=category,
                    rating=rating,
                    downloads=downloads
                )

        except Exception as e:
            logger.error(f"PlayStore app details error for {app_id}: {e}")

        return None

    async def get_developer_apps(self, developer_id: str, max_apps: int = 20) -> List[AppData]:
        """Get all apps from a developer"""
        apps = []

        try:
            url = f"{self.base_url}/store/apps/dev"
            params = {"id": developer_id, "hl": "en"}

            response = await self.client.get(url, params=params, headers=self.headers)

            if response.status_code == 200:
                soup = BeautifulSoup(response.text, "html.parser")

                app_links = soup.select("a[href*='/store/apps/details']")
                seen_ids = set()

                for link in app_links:
                    href = link.get("href", "")
                    if "id=" in href:
                        app_id = href.split("id=")[1].split("&")[0]
                        if app_id not in seen_ids:
                            seen_ids.add(app_id)

                            # Get basic info from the card
                            parent = link.find_parent("div")
                            app_name = link.get_text(strip=True) or app_id

                            apps.append(AppData(
                                app_id=app_id,
                                app_name=app_name,
                                developer_name="",
                                developer_id=developer_id,
                                store="playstore",
                                store_url=f"{self.base_url}/store/apps/details?id={app_id}"
                            ))

                            if len(apps) >= max_apps:
                                break

        except Exception as e:
            logger.error(f"PlayStore developer apps error: {e}")

        return apps

    async def get_top_charts(
        self,
        category: str = "APPLICATION",
        chart: str = "topselling_free",
        country: str = "us",
        max_results: int = 50
    ) -> List[AppData]:
        """Get top charts apps"""
        apps = []

        try:
            url = f"{self.base_url}/store/apps/top"
            params = {
                "gl": country,
                "hl": "en"
            }

            response = await self.client.get(url, params=params, headers=self.headers)

            if response.status_code == 200:
                soup = BeautifulSoup(response.text, "html.parser")

                app_links = soup.select("a[href*='/store/apps/details']")
                seen_ids = set()

                for link in app_links[:max_results * 2]:
                    href = link.get("href", "")
                    if "id=" in href:
                        app_id = href.split("id=")[1].split("&")[0]
                        if app_id not in seen_ids:
                            seen_ids.add(app_id)

                            app_data = await self.get_app_details(app_id, country)
                            if app_data:
                                apps.append(app_data)

                            if len(apps) >= max_results:
                                break

                            await asyncio.sleep(0.3)

        except Exception as e:
            logger.error(f"PlayStore top charts error: {e}")

        return apps

    async def close(self):
        await self.client.aclose()


class AppStoreScraper:
    """
    FREE Apple App Store Scraper
    Extracts iOS app and developer information
    """

    def __init__(self, timeout: int = 30):
        self.timeout = timeout
        self.search_url = "https://itunes.apple.com/search"
        self.lookup_url = "https://itunes.apple.com/lookup"
        self.web_url = "https://apps.apple.com"
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
        }
        self.client = httpx.AsyncClient(timeout=timeout, follow_redirects=True)

    async def search_apps(
        self,
        query: str,
        country: str = "us",
        max_results: int = 30
    ) -> List[AppData]:
        """Search for apps on App Store using iTunes API"""
        apps = []

        try:
            params = {
                "term": query,
                "country": country,
                "media": "software",
                "limit": min(max_results, 200)
            }

            response = await self.client.get(self.search_url, params=params, headers=self.headers)

            if response.status_code == 200:
                data = response.json()

                for result in data.get("results", [])[:max_results]:
                    app_id = str(result.get("trackId", ""))

                    # Extract developer website
                    developer_website = result.get("sellerUrl")

                    apps.append(AppData(
                        app_id=app_id,
                        app_name=result.get("trackName", ""),
                        developer_name=result.get("artistName", ""),
                        developer_id=str(result.get("artistId", "")),
                        developer_website=developer_website,
                        store="appstore",
                        store_url=result.get("trackViewUrl"),
                        developer_url=result.get("artistViewUrl"),
                        category=result.get("primaryGenreName"),
                        icon_url=result.get("artworkUrl512") or result.get("artworkUrl100"),
                        rating=result.get("averageUserRating"),
                        reviews_count=result.get("userRatingCount"),
                        price=str(result.get("price", "Free")),
                        description=result.get("description", "")[:500],
                        demographic=country
                    ))

                logger.info(f"AppStore search '{query}' ({country}): found {len(apps)} apps")

        except Exception as e:
            logger.error(f"AppStore search error: {e}")

        return apps

    async def get_app_details(self, app_id: str, country: str = "us") -> Optional[AppData]:
        """Get detailed app information using lookup API"""
        try:
            params = {
                "id": app_id,
                "country": country
            }

            response = await self.client.get(self.lookup_url, params=params, headers=self.headers)

            if response.status_code == 200:
                data = response.json()
                results = data.get("results", [])

                if results:
                    result = results[0]

                    return AppData(
                        app_id=app_id,
                        app_name=result.get("trackName", ""),
                        developer_name=result.get("artistName", ""),
                        developer_id=str(result.get("artistId", "")),
                        developer_website=result.get("sellerUrl"),
                        store="appstore",
                        store_url=result.get("trackViewUrl"),
                        developer_url=result.get("artistViewUrl"),
                        category=result.get("primaryGenreName"),
                        rating=result.get("averageUserRating"),
                        reviews_count=result.get("userRatingCount"),
                        price=str(result.get("price", "Free")),
                        demographic=country
                    )

        except Exception as e:
            logger.error(f"AppStore lookup error for {app_id}: {e}")

        return None

    async def get_developer_apps(self, developer_id: str, country: str = "us") -> List[AppData]:
        """Get all apps from a developer"""
        apps = []

        try:
            params = {
                "id": developer_id,
                "entity": "software",
                "country": country
            }

            response = await self.client.get(self.lookup_url, params=params, headers=self.headers)

            if response.status_code == 200:
                data = response.json()

                for result in data.get("results", []):
                    if result.get("wrapperType") == "software":
                        apps.append(AppData(
                            app_id=str(result.get("trackId", "")),
                            app_name=result.get("trackName", ""),
                            developer_name=result.get("artistName", ""),
                            developer_id=developer_id,
                            developer_website=result.get("sellerUrl"),
                            store="appstore",
                            store_url=result.get("trackViewUrl"),
                            category=result.get("primaryGenreName"),
                            demographic=country
                        ))

        except Exception as e:
            logger.error(f"AppStore developer apps error: {e}")

        return apps

    async def close(self):
        await self.client.aclose()


class SteamScraper:
    """
    FREE Steam Store Scraper
    Extracts game and developer information
    """

    def __init__(self, timeout: int = 30):
        self.timeout = timeout
        self.base_url = "https://store.steampowered.com"
        self.api_url = "https://api.steampowered.com"
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        self.client = httpx.AsyncClient(timeout=timeout, follow_redirects=True)

    async def search_games(
        self,
        query: str,
        max_results: int = 30
    ) -> List[AppData]:
        """Search for games on Steam"""
        games = []

        try:
            # Steam search API
            url = f"{self.base_url}/search/suggest"
            params = {
                "term": query,
                "f": "games",
                "cc": "US",
                "l": "english"
            }

            response = await self.client.get(url, params=params, headers=self.headers)

            if response.status_code == 200:
                soup = BeautifulSoup(response.text, "html.parser")

                for item in soup.select("a.match")[:max_results]:
                    href = item.get("href", "")
                    name_elem = item.select_one(".match_name")

                    if "/app/" in href:
                        app_id = href.split("/app/")[1].split("/")[0]

                        game_data = await self.get_game_details(app_id)
                        if game_data:
                            games.append(game_data)

                        await asyncio.sleep(0.3)

        except Exception as e:
            logger.error(f"Steam search error: {e}")

        return games

    async def get_game_details(self, app_id: str) -> Optional[AppData]:
        """Get game details from Steam API"""
        try:
            url = f"{self.base_url}/api/appdetails"
            params = {"appids": app_id, "l": "english"}

            response = await self.client.get(url, params=params, headers=self.headers)

            if response.status_code == 200:
                data = response.json()

                if data.get(app_id, {}).get("success"):
                    game = data[app_id]["data"]

                    # Extract developer website
                    website = game.get("website")

                    developers = game.get("developers", ["Unknown"])
                    publisher = game.get("publishers", ["Unknown"])[0]

                    return AppData(
                        app_id=app_id,
                        app_name=game.get("name", ""),
                        developer_name=developers[0] if developers else publisher,
                        developer_website=website,
                        store="steam",
                        store_url=f"{self.base_url}/app/{app_id}",
                        category="Game",
                        subcategory=", ".join([g.get("description", "") for g in game.get("genres", [])[:3]]),
                        price=game.get("price_overview", {}).get("final_formatted", "Free"),
                        description=game.get("short_description", "")
                    )

        except Exception as e:
            logger.error(f"Steam game details error for {app_id}: {e}")

        return None

    async def get_top_sellers(self, max_results: int = 50) -> List[AppData]:
        """Get Steam top sellers"""
        games = []

        try:
            url = f"{self.base_url}/search/"
            params = {
                "filter": "topsellers",
                "cc": "US"
            }

            response = await self.client.get(url, params=params, headers=self.headers)

            if response.status_code == 200:
                soup = BeautifulSoup(response.text, "html.parser")

                for item in soup.select("a.search_result_row")[:max_results]:
                    href = item.get("href", "")
                    if "/app/" in href:
                        app_id = href.split("/app/")[1].split("/")[0]

                        game_data = await self.get_game_details(app_id)
                        if game_data:
                            games.append(game_data)

                        await asyncio.sleep(0.3)

        except Exception as e:
            logger.error(f"Steam top sellers error: {e}")

        return games

    async def close(self):
        await self.client.aclose()


class CompanyWebsiteScraper:
    """
    Deep Company Website Scraper
    6-7 level deep crawling to find contacts
    """

    CONTACT_PAGES = [
        "/contact", "/contact-us", "/contactus",
        "/about", "/about-us", "/aboutus",
        "/team", "/our-team", "/leadership",
        "/company", "/company/about",
        "/support", "/help",
        "/press", "/media", "/newsroom",
        "/careers", "/jobs",
        "/partners", "/partnerships",
        "/advertise", "/advertising",
        "/business", "/enterprise", "/b2b"
    ]

    EMAIL_PATTERNS = {
        "contact": r'(contact|info|hello|hi)@[\w.-]+\.\w+',
        "marketing": r'(marketing|ads|advertising|media|pr|press)@[\w.-]+\.\w+',
        "sales": r'(sales|business|enterprise|partnerships?)@[\w.-]+\.\w+',
        "support": r'(support|help|care|service)@[\w.-]+\.\w+',
        "general": r'[\w.+-]+@[\w.-]+\.\w+'
    }

    def __init__(self, timeout: int = 30, max_depth: int = 6):
        self.timeout = timeout
        self.max_depth = max_depth
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        self.client = httpx.AsyncClient(timeout=timeout, follow_redirects=True)

    async def scrape_company(
        self,
        domain: str,
        max_pages: int = 30
    ) -> Dict[str, Any]:
        """
        Deep scrape a company website for contacts and information.

        Returns:
            {
                "domain": "example.com",
                "emails": {
                    "contact": [...],
                    "marketing": [...],
                    "sales": [...],
                    "support": [...],
                    "other": [...]
                },
                "social_links": {...},
                "company_info": {...},
                "people": [...],
                "pages_scraped": 10
            }
        """
        result = {
            "domain": domain,
            "emails": {
                "contact": set(),
                "marketing": set(),
                "sales": set(),
                "support": set(),
                "other": set()
            },
            "social_links": {
                "linkedin": None,
                "twitter": None,
                "facebook": None,
                "instagram": None
            },
            "company_info": {
                "name": None,
                "description": None,
                "address": None,
                "phone": None
            },
            "people": [],
            "pages_scraped": 0
        }

        base_url = f"https://{domain}"
        scraped_urls = set()
        urls_to_scrape = [base_url]

        # Add contact pages
        for page in self.CONTACT_PAGES:
            urls_to_scrape.append(f"{base_url}{page}")

        depth = 0
        while urls_to_scrape and result["pages_scraped"] < max_pages and depth < self.max_depth:
            current_url = urls_to_scrape.pop(0)

            if current_url in scraped_urls:
                continue

            scraped_urls.add(current_url)

            try:
                page_data = await self._scrape_page(current_url, domain)

                if page_data:
                    result["pages_scraped"] += 1

                    # Collect emails
                    for email_type, emails in page_data.get("emails", {}).items():
                        if email_type in result["emails"]:
                            result["emails"][email_type].update(emails)

                    # Collect social links
                    for platform, link in page_data.get("social_links", {}).items():
                        if link and not result["social_links"].get(platform):
                            result["social_links"][platform] = link

                    # Collect company info
                    for key, value in page_data.get("company_info", {}).items():
                        if value and not result["company_info"].get(key):
                            result["company_info"][key] = value

                    # Collect people
                    result["people"].extend(page_data.get("people", []))

                    # Add new internal links (for deeper crawling)
                    for link in page_data.get("internal_links", [])[:10]:
                        if link not in scraped_urls and link not in urls_to_scrape:
                            urls_to_scrape.append(link)

                await asyncio.sleep(0.3)

            except Exception as e:
                logger.debug(f"Error scraping {current_url}: {e}")

            depth += 1

        # Convert sets to lists
        for email_type in result["emails"]:
            result["emails"][email_type] = list(result["emails"][email_type])

        return result

    async def _scrape_page(self, url: str, domain: str) -> Optional[Dict[str, Any]]:
        """Scrape a single page for data"""
        try:
            response = await self.client.get(url, headers=self.headers)

            if response.status_code != 200:
                return None

            soup = BeautifulSoup(response.text, "html.parser")
            text = soup.get_text(separator=" ")

            data = {
                "emails": {
                    "contact": set(),
                    "marketing": set(),
                    "sales": set(),
                    "support": set(),
                    "other": set()
                },
                "social_links": {},
                "company_info": {},
                "people": [],
                "internal_links": []
            }

            # Extract emails
            for email_type, pattern in self.EMAIL_PATTERNS.items():
                matches = re.findall(pattern, text, re.IGNORECASE)

                for match in matches:
                    email = match if "@" in match else None
                    if not email:
                        # Pattern might have captured part of email
                        email_match = re.search(r'[\w.+-]+@[\w.-]+\.\w+', match if isinstance(match, str) else str(match))
                        if email_match:
                            email = email_match.group()

                    if email:
                        email = email.lower()
                        # Classify email
                        if any(x in email for x in ["contact", "info", "hello", "hi"]):
                            data["emails"]["contact"].add(email)
                        elif any(x in email for x in ["marketing", "ads", "advertising", "media", "pr", "press"]):
                            data["emails"]["marketing"].add(email)
                        elif any(x in email for x in ["sales", "business", "enterprise", "partner"]):
                            data["emails"]["sales"].add(email)
                        elif any(x in email for x in ["support", "help", "care", "service"]):
                            data["emails"]["support"].add(email)
                        else:
                            data["emails"]["other"].add(email)

            # Also find mailto links
            for mailto in soup.select("a[href^='mailto:']"):
                email = mailto.get("href", "").replace("mailto:", "").split("?")[0].lower()
                if email and "@" in email:
                    # Classify
                    if any(x in email for x in ["marketing", "ads"]):
                        data["emails"]["marketing"].add(email)
                    elif any(x in email for x in ["sales", "business"]):
                        data["emails"]["sales"].add(email)
                    else:
                        data["emails"]["contact"].add(email)

            # Extract social links
            for link in soup.find_all("a", href=True):
                href = link.get("href", "")

                if "linkedin.com/company" in href:
                    data["social_links"]["linkedin"] = href
                elif "twitter.com/" in href or "x.com/" in href:
                    data["social_links"]["twitter"] = href
                elif "facebook.com/" in href:
                    data["social_links"]["facebook"] = href
                elif "instagram.com/" in href:
                    data["social_links"]["instagram"] = href

            # Extract company name
            title = soup.find("title")
            if title:
                data["company_info"]["name"] = title.get_text(strip=True).split("|")[0].split("-")[0].strip()

            # Extract description
            meta_desc = soup.find("meta", {"name": "description"}) or \
                        soup.find("meta", {"property": "og:description"})
            if meta_desc:
                data["company_info"]["description"] = meta_desc.get("content", "")[:500]

            # Find internal links
            base_url = f"https://{domain}"
            for link in soup.find_all("a", href=True):
                href = link.get("href", "")

                if href.startswith("/"):
                    full_url = base_url + href
                    data["internal_links"].append(full_url)
                elif domain in href and href.startswith("http"):
                    data["internal_links"].append(href)

            # Look for team members
            team_sections = soup.find_all(class_=re.compile(r'team|staff|people|leadership', re.I))
            for section in team_sections:
                # Find person cards
                cards = section.find_all(class_=re.compile(r'card|member|person', re.I))
                for card in cards[:10]:
                    name_elem = card.find(["h2", "h3", "h4", "strong"])
                    title_elem = card.find(class_=re.compile(r'title|role|position', re.I))

                    if name_elem:
                        person = {
                            "name": name_elem.get_text(strip=True),
                            "title": title_elem.get_text(strip=True) if title_elem else None
                        }

                        # Look for LinkedIn
                        linkedin = card.find("a", href=re.compile(r'linkedin.com/in/'))
                        if linkedin:
                            person["linkedin"] = linkedin.get("href")

                        data["people"].append(person)

            return data

        except Exception as e:
            logger.debug(f"Page scrape error for {url}: {e}")
            return None

    async def close(self):
        await self.client.aclose()


class ProductHuntScraper:
    """
    FREE ProductHunt Scraper
    Finds new products and their makers
    """

    def __init__(self, timeout: int = 30):
        self.timeout = timeout
        self.base_url = "https://www.producthunt.com"
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        self.client = httpx.AsyncClient(timeout=timeout, follow_redirects=True)

    async def search_products(
        self,
        query: str,
        max_results: int = 30
    ) -> List[Dict[str, Any]]:
        """Search ProductHunt for products"""
        products = []

        try:
            search_url = f"{self.base_url}/search"
            params = {"q": query}

            response = await self.client.get(search_url, params=params, headers=self.headers)

            if response.status_code == 200:
                soup = BeautifulSoup(response.text, "html.parser")

                # Find product cards
                for card in soup.select("[data-test='post-item']")[:max_results]:
                    try:
                        name_elem = card.select_one("[data-test='post-name']")
                        tagline_elem = card.select_one("[data-test='post-tagline']")
                        link_elem = card.select_one("a[href*='/posts/']")

                        if name_elem:
                            product = {
                                "name": name_elem.get_text(strip=True),
                                "tagline": tagline_elem.get_text(strip=True) if tagline_elem else "",
                                "url": self.base_url + link_elem.get("href") if link_elem else None,
                                "source": "producthunt"
                            }
                            products.append(product)
                    except:
                        continue

        except Exception as e:
            logger.error(f"ProductHunt search error: {e}")

        return products

    async def get_today_products(self, max_results: int = 30) -> List[Dict[str, Any]]:
        """Get today's featured products"""
        products = []

        try:
            response = await self.client.get(self.base_url, headers=self.headers)

            if response.status_code == 200:
                soup = BeautifulSoup(response.text, "html.parser")

                for card in soup.select("[data-test='post-item']")[:max_results]:
                    try:
                        name_elem = card.select_one("[data-test='post-name']")
                        if name_elem:
                            products.append({
                                "name": name_elem.get_text(strip=True),
                                "source": "producthunt"
                            })
                    except:
                        continue

        except Exception as e:
            logger.error(f"ProductHunt today error: {e}")

        return products

    async def close(self):
        await self.client.aclose()


class MobiAdzExtractionEngine:
    """
    TheMobiAdz Main Extraction Engine V2.0 - ULTRA INTEGRATED

    Combines all scrapers + AI/ML components for comprehensive app/company data extraction.
    Supports both FREE and PAID modes with intelligent fallback.

    ULTRA FEATURES:
    - SpaCy NER for entity extraction
    - 50+ email patterns with permutation generator
    - Email verification via MX records
    - Bloom Filter for O(1) deduplication
    - LRU Cache for API responses
    - GitHub, npm, HackerNews extraction
    - DNS/SSL intelligence
    - Wayback Machine historical data
    """

    def __init__(self, config: Optional[MobiAdzConfig] = None):
        self.config = config or MobiAdzConfig()

        # Initialize FREE scrapers
        self.playstore = GooglePlayScraper(timeout=self.config.search_timeout)
        self.appstore = AppStoreScraper(timeout=self.config.search_timeout)
        self.steam = SteamScraper(timeout=self.config.search_timeout)
        self.website_scraper = CompanyWebsiteScraper(
            timeout=self.config.search_timeout,
            max_depth=self.config.website_scrape_depth
        )
        self.producthunt = ProductHuntScraper(timeout=self.config.search_timeout)

        # ========== ULTRA ENGINE COMPONENTS ==========
        # Advanced Data Structures
        if self.config.use_bloom_filter:
            self.url_bloom = BloomFilter(size=self.config.bloom_filter_size)
            self.email_bloom = BloomFilter(size=self.config.bloom_filter_size // 2)
        else:
            self.url_bloom = None
            self.email_bloom = None

        if self.config.use_lru_cache:
            self.response_cache = LRUCache(capacity=self.config.lru_cache_capacity)
        else:
            self.response_cache = None

        # AI/ML Components
        if self.config.use_nlp_extraction:
            self.nlp_extractor = NLPEntityExtractor()
        else:
            self.nlp_extractor = None

        if self.config.use_email_verification:
            self.email_verifier = EmailVerifier()
        else:
            self.email_verifier = None

        # Additional Data Source Scrapers
        if self.config.use_github_extraction:
            self.github_scraper = GitHubOrganizationScraper(timeout=self.config.search_timeout)
        else:
            self.github_scraper = None

        if self.config.use_npm_extraction:
            self.npm_scraper = NPMPackageScraper(timeout=self.config.search_timeout)
        else:
            self.npm_scraper = None

        if self.config.use_hackernews_mentions:
            self.hackernews_scraper = HackerNewsScraper(timeout=self.config.search_timeout)
        else:
            self.hackernews_scraper = None

        if self.config.use_dns_intelligence:
            self.dns_intel = DNSIntelligence()
        else:
            self.dns_intel = None

        if self.config.use_ssl_subdomains:
            self.ssl_intel = SSLCertificateIntelligence(timeout=self.config.search_timeout)
        else:
            self.ssl_intel = None

        if self.config.use_wayback_machine:
            self.wayback_intel = WaybackIntelligence(timeout=self.config.search_timeout)
        else:
            self.wayback_intel = None

        # Paid API clients (initialized on demand)
        self._hunter_client = None
        self._clearbit_client = None

        # NLP initialization flag
        self._nlp_initialized = False

        # ========== OSINT ENGINE ==========
        if self.config.use_osint:
            self.osint_engine = MobiAdzOSINTEngine(timeout=self.config.search_timeout)
        else:
            self.osint_engine = None

        # ========== FREE WEB SEARCH ENGINE ==========
        if self.config.use_free_web_search:
            self.web_search = MobiAdzWebSearch(timeout=self.config.search_timeout)
        else:
            self.web_search = None

        # Statistics
        self.stats = {
            "apps_found": 0,
            "companies_found": 0,
            "emails_found": 0,
            "emails_verified": 0,
            "pages_scraped": 0,
            "api_calls": 0,
            "sources_used": [],
            "bloom_filter_hits": 0,
            "cache_hits": 0,
            "nlp_entities_extracted": 0,
            "email_permutations_generated": 0,
            # OSINT stats
            "osint_leadership_found": 0,
            "osint_employees_found": 0,
            "osint_phones_found": 0,
            "osint_social_profiles_found": 0,
            # Web search stats
            "web_search_queries": 0,
            "web_search_results": 0,
            "web_search_emails_found": 0,
            # ULTRA DEEP V2.0 stats
            "ultra_deep_emails_found": 0,
            "ultra_deep_paid_emails_found": 0,
            "ultra_deep_layers_completed": 0,
            "ultra_deep_multi_engine_hits": 0,
            "ultra_deep_archive_hits": 0,
            "ultra_deep_dns_hits": 0,
            "ultra_deep_whois_hits": 0,
            "ultra_deep_ct_hits": 0,
            "ultra_deep_sitemap_hits": 0,
            "ultra_deep_social_hits": 0,
            "ultra_deep_dev_platform_hits": 0,
            "ultra_deep_job_posting_hits": 0,
            "ultra_deep_press_hits": 0,
            "ultra_deep_startup_db_hits": 0,
            "ultra_deep_smtp_verified": 0,
            "start_time": None,
            "end_time": None
        }

        # Progress tracking
        self.progress = {
            "stage": "idle",
            "stage_progress": 0,
            "total_progress": 0,
            "message": "Ready"
        }

        # Live contact callback for real-time updates
        self._live_contact_callback = None
        self._live_contact_counter = 0

    def set_live_contact_callback(self, callback):
        """Set callback for live contact updates"""
        self._live_contact_callback = callback

    def _emit_live_contact(
        self,
        company_name: str,
        contact_type: str,
        source: str,
        confidence: int = 50,
        app_or_product: str = None,
        email: str = None,
        person_name: str = None,
        playstore_url: str = None,
        website: str = None
    ):
        """Emit a live contact event to the callback"""
        if self._live_contact_callback:
            self._live_contact_counter += 1
            contact_data = {
                "id": f"live_{self._live_contact_counter}",
                "timestamp": datetime.utcnow().isoformat(),
                "company_name": company_name,
                "type": contact_type,
                "source": source,
                "confidence": confidence,
                "app_or_product": app_or_product,
                "email": email,
                "person_name": person_name,
                "playstore_url": playstore_url,
                "website": website
            }
            self._live_contact_callback(contact_data)

    async def _initialize_nlp(self):
        """Initialize NLP components asynchronously."""
        if self.nlp_extractor and not self._nlp_initialized:
            await self.nlp_extractor.initialize()
            self._nlp_initialized = True

    def _update_progress(self, stage: str, stage_progress: int, message: str):
        """Update progress tracking"""
        stages = ["discovery", "app_scraping", "company_scraping", "contact_finding", "enrichment", "complete"]
        stage_idx = stages.index(stage) if stage in stages else 0

        self.progress = {
            "stage": stage,
            "stage_progress": stage_progress,
            "total_progress": int((stage_idx * 100 + stage_progress) / len(stages)),
            "message": message
        }

    async def run_extraction(
        self,
        demographics: Optional[List[Demographic]] = None,
        categories: Optional[List[ProductCategory]] = None
    ) -> List[CompanyContact]:
        """
        Run the full extraction pipeline.

        Args:
            demographics: Target regions
            categories: Product categories to search

        Returns:
            List of CompanyContact objects
        """
        self.stats["start_time"] = datetime.utcnow().isoformat()

        demographics = demographics or self.config.demographics
        categories = categories or self.config.categories

        all_contacts: List[CompanyContact] = []
        all_apps: List[AppData] = []

        try:
            # Stage 1: App Discovery
            self._update_progress("discovery", 0, "Starting app discovery...")

            for category in categories:
                keywords = CATEGORY_KEYWORDS.get(category, [category.value])

                for demographic in demographics:
                    countries = DEMOGRAPHIC_COUNTRIES.get(demographic, ["us"])

                    for country in countries[:2]:  # Limit countries per demographic
                        self._update_progress(
                            "discovery", 20,
                            f"Searching {category.value} in {country.upper()}..."
                        )

                        # Search based on category
                        if category in [ProductCategory.MOBILE_APPS, ProductCategory.ANDROID_APPS,
                                       ProductCategory.ECOMMERCE, ProductCategory.SAAS,
                                       ProductCategory.FINTECH, ProductCategory.HEALTH_TECH]:
                            # Search Play Store
                            for keyword in keywords[:2]:
                                apps = await self.playstore.search_apps(
                                    keyword,
                                    country=country,
                                    max_results=self.config.max_apps_per_category // len(keywords)
                                )
                                # Emit live contact for each app found
                                for app in apps:
                                    self._emit_live_contact(
                                        company_name=app.developer_name or "Unknown Developer",
                                        contact_type="app",
                                        source="Play Store",
                                        confidence=40,
                                        app_or_product=app.app_name,
                                        playstore_url=app.store_url if app.store == "playstore" else None,
                                        website=app.developer_website
                                    )
                                all_apps.extend(apps)
                                self.stats["apps_found"] = len(all_apps)
                                await asyncio.sleep(self.config.delay_between_requests)

                        if category in [ProductCategory.MOBILE_APPS, ProductCategory.IOS_APPS,
                                       ProductCategory.ECOMMERCE, ProductCategory.SAAS,
                                       ProductCategory.FINTECH]:
                            # Search App Store
                            for keyword in keywords[:2]:
                                apps = await self.appstore.search_apps(
                                    keyword,
                                    country=country,
                                    max_results=self.config.max_apps_per_category // len(keywords)
                                )
                                # Emit live contact for each app found
                                for app in apps:
                                    self._emit_live_contact(
                                        company_name=app.developer_name or "Unknown Developer",
                                        contact_type="app",
                                        source="App Store",
                                        confidence=40,
                                        app_or_product=app.app_name,
                                        website=app.developer_website
                                    )
                                all_apps.extend(apps)
                                self.stats["apps_found"] = len(all_apps)
                                await asyncio.sleep(self.config.delay_between_requests)

                        if category == ProductCategory.GAMES:
                            # Search Steam
                            for keyword in keywords[:2]:
                                games = await self.steam.search_games(
                                    keyword,
                                    max_results=self.config.max_apps_per_category // len(keywords)
                                )
                                # Emit live contact for each game found
                                for game in games:
                                    self._emit_live_contact(
                                        company_name=game.developer_name or "Unknown Developer",
                                        contact_type="app",
                                        source="Steam",
                                        confidence=40,
                                        app_or_product=game.app_name,
                                        website=game.developer_website
                                    )
                                all_apps.extend(games)
                                self.stats["apps_found"] = len(all_apps)
                                await asyncio.sleep(self.config.delay_between_requests)

            self.stats["apps_found"] = len(all_apps)
            self._update_progress("discovery", 100, f"Found {len(all_apps)} apps/products")

            # Stage 2: Deduplicate and group by developer
            self._update_progress("app_scraping", 0, "Processing developers...")

            developers = {}
            for app in all_apps:
                dev_key = app.developer_name.lower() if app.developer_name else app.developer_website
                if dev_key:
                    if dev_key not in developers:
                        developers[dev_key] = {
                            "name": app.developer_name,
                            "website": app.developer_website,
                            "apps": []
                        }
                    developers[dev_key]["apps"].append(app)

            # Stage 3: Scrape company websites - PARALLEL PROCESSING for speed
            self._update_progress("company_scraping", 0, f"Scraping {len(developers)} company websites (parallel)...")

            # Create semaphore for rate limiting (10 concurrent requests)
            scrape_semaphore = asyncio.Semaphore(10)
            companies_processed = 0
            total_to_process = min(len(developers), self.config.max_companies)

            async def scrape_single_company(dev_key: str, dev_info: dict) -> Optional[CompanyContact]:
                """Scrape a single company website with rate limiting"""
                nonlocal companies_processed

                async with scrape_semaphore:
                    website = dev_info.get("website")

                    if website:
                        try:
                            # Extract domain
                            parsed = urlparse(website)
                            domain = parsed.netloc.replace("www.", "")

                            if domain:
                                # Deep scrape company website
                                company_data = await self.website_scraper.scrape_company(
                                    domain,
                                    max_pages=self.config.max_pages_per_site
                                )

                                self.stats["pages_scraped"] += company_data.get("pages_scraped", 0)

                                # Extract emails
                                contact_email = next(iter(company_data.get("emails", {}).get("contact", [])), None)
                                marketing_email = next(iter(company_data.get("emails", {}).get("marketing", [])), None)
                                sales_email = next(iter(company_data.get("emails", {}).get("sales", [])), None)
                                support_email = next(iter(company_data.get("emails", {}).get("support", [])), None)

                                company_name = company_data.get("company_info", {}).get("name") or dev_info["name"]
                                app_name = dev_info["apps"][0].app_name if dev_info["apps"] else None
                                playstore_url = dev_info["apps"][0].store_url if dev_info["apps"] and dev_info["apps"][0].store == "playstore" else None

                                # Create contact record
                                contact = CompanyContact(
                                    company_name=company_name,
                                    app_or_product=app_name,
                                    product_category=dev_info["apps"][0].category if dev_info["apps"] else None,
                                    demographic=dev_info["apps"][0].demographic if dev_info["apps"] else None,
                                    company_website=website,
                                    company_domain=domain,
                                    company_description=company_data.get("company_info", {}).get("description"),
                                    company_linkedin=company_data.get("social_links", {}).get("linkedin"),
                                    contact_email=contact_email,
                                    marketing_email=marketing_email,
                                    sales_email=sales_email,
                                    support_email=support_email,
                                    people=company_data.get("people", []),
                                    playstore_url=playstore_url,
                                    appstore_url=dev_info["apps"][0].store_url if dev_info["apps"] and dev_info["apps"][0].store == "appstore" else None,
                                    data_sources=["website_scrape"],
                                    confidence_score=self._calculate_confidence(company_data)
                                )

                                # Emit company discovery
                                self._emit_live_contact(
                                    company_name=company_name,
                                    contact_type="company",
                                    source=f"Website ({domain})",
                                    confidence=contact.confidence_score,
                                    app_or_product=app_name,
                                    playstore_url=playstore_url,
                                    website=website
                                )

                                # Emit email discoveries
                                primary_email = contact_email or marketing_email or sales_email
                                if primary_email:
                                    self._emit_live_contact(
                                        company_name=company_name,
                                        contact_type="email",
                                        source=f"Website Scrape ({domain})",
                                        confidence=contact.confidence_score,
                                        app_or_product=app_name,
                                        email=primary_email,
                                        playstore_url=playstore_url,
                                        website=website
                                    )

                                # Emit people/leaders found
                                for person in company_data.get("people", [])[:3]:
                                    person_email = person.get("emails", [None])[0] if person.get("emails") else None
                                    self._emit_live_contact(
                                        company_name=company_name,
                                        contact_type="leadership" if "CEO" in str(person.get("title", "")) or "Founder" in str(person.get("title", "")) else "person",
                                        source=f"Website ({domain})",
                                        confidence=person.get("confidence", 60),
                                        app_or_product=app_name,
                                        person_name=person.get("name"),
                                        email=person_email,
                                        website=website
                                    )

                                companies_processed += 1
                                # Update progress
                                progress = int(companies_processed / total_to_process * 100)
                                self._update_progress("company_scraping", progress, f"Scraped {companies_processed}/{total_to_process}: {domain}")

                                return contact

                        except Exception as e:
                            logger.warning(f"Error processing {dev_key}: {e}")
                            companies_processed += 1

                    # Create record even without website (use email from Play Store if available)
                    elif dev_info["name"]:
                        # Check if any app has a developer_email from store page
                        store_email = None
                        for app in dev_info["apps"]:
                            if hasattr(app, 'developer_email') and app.developer_email:
                                store_email = app.developer_email
                                break

                        company_name = dev_info["name"]
                        app_name = dev_info["apps"][0].app_name if dev_info["apps"] else None
                        playstore_url = dev_info["apps"][0].store_url if dev_info["apps"] and dev_info["apps"][0].store == "playstore" else None

                        contact = CompanyContact(
                            company_name=company_name,
                            app_or_product=app_name,
                            product_category=dev_info["apps"][0].category if dev_info["apps"] else None,
                            demographic=dev_info["apps"][0].demographic if dev_info["apps"] else None,
                            contact_email=store_email,  # Use email from store page if available
                            playstore_url=playstore_url,
                            appstore_url=dev_info["apps"][0].store_url if dev_info["apps"] and dev_info["apps"][0].store == "appstore" else None,
                            data_sources=["app_store", "store_email"] if store_email else ["app_store"],
                            confidence_score=50 if store_email else 30  # Higher confidence if we have email
                        )

                        # Emit company discovery
                        self._emit_live_contact(
                            company_name=company_name,
                            contact_type="company",
                            source="App Store Page",
                            confidence=contact.confidence_score,
                            app_or_product=app_name,
                            playstore_url=playstore_url
                        )

                        # Emit email if found from store
                        if store_email:
                            self._emit_live_contact(
                                company_name=company_name,
                                contact_type="email",
                                source="Play Store Developer Info",
                                confidence=50,
                                app_or_product=app_name,
                                email=store_email,
                                playstore_url=playstore_url
                            )

                        companies_processed += 1
                        return contact

                    return None

            # Run all company scrapes in parallel with rate limiting
            scrape_tasks = [
                scrape_single_company(dev_key, dev_info)
                for dev_key, dev_info in list(developers.items())[:self.config.max_companies]
            ]

            # Process in batches of 20 for better progress updates
            batch_size = 20
            for i in range(0, len(scrape_tasks), batch_size):
                batch = scrape_tasks[i:i + batch_size]
                results = await asyncio.gather(*batch, return_exceptions=True)

                for result in results:
                    if isinstance(result, CompanyContact):
                        all_contacts.append(result)
                        # Update stats incrementally
                        self.stats["companies_found"] = len(all_contacts)
                        if result.contact_email or result.marketing_email or result.sales_email:
                            self.stats["emails_found"] += 1

                self._update_progress(
                    "company_scraping",
                    int(min(i + batch_size, len(scrape_tasks)) / len(scrape_tasks) * 100),
                    f"Processed batch {i // batch_size + 1}/{(len(scrape_tasks) + batch_size - 1) // batch_size}"
                )

            # ========== STAGE 4: ULTRA EXTRACTION ==========
            if self.config.deep_extraction_mode:
                await self._run_ultra_extraction(all_contacts)

            # ========== STAGE 5: DEEP OSINT ==========
            if self.config.use_osint:
                await self._run_osint_extraction(all_contacts)

            # ========== STAGE 5.5: FREE WEB SEARCH ENHANCEMENT ==========
            if self.config.use_free_web_search:
                self._update_progress("web_search", 0, "Starting FREE web search enhancement...")
                try:
                    await self._web_search_enhancement(all_contacts)
                    self._update_progress("web_search", 100, f"Web search complete: {self.stats.get('web_search_emails_found', 0)} additional emails found")
                except Exception as e:
                    logger.warning(f"Web search enhancement failed: {e}")
                    self._update_progress("web_search", 100, f"Web search completed with errors")

            # ========== STAGE 6: ULTRA DEEP SEARCH V2.0 ==========
            # 15+ FREE layers + 10+ PAID API integrations for maximum extraction
            if self.config.use_ultra_deep_search and ULTRA_DEEP_AVAILABLE:
                self._update_progress("ultra_deep", 0, "🚀 Starting ULTRA DEEP Search V2.0...")
                try:
                    await self._run_ultra_deep_extraction(all_contacts)
                    ultra_deep_found = self.stats.get('ultra_deep_emails_found', 0)
                    self._update_progress("ultra_deep", 100, f"✅ ULTRA DEEP complete: {ultra_deep_found} emails via 15+ layers")
                except Exception as e:
                    logger.warning(f"ULTRA DEEP extraction failed: {e}")
                    self._update_progress("ultra_deep", 100, f"ULTRA DEEP completed with errors: {str(e)[:50]}")

            # Stage 7: Enrichment (if paid mode or fallback)
            if self.config.use_paid_apis:
                await self._enrich_with_paid_apis(all_contacts)

            # Stage 8: Email Verification & Deduplication
            if self.config.use_email_verification or self.config.use_fuzzy_matching:
                await self._verify_and_deduplicate(all_contacts)

            # Stage 9: Calculate final stats
            self.stats["companies_found"] = len(all_contacts)
            self.stats["emails_found"] = sum(
                1 for c in all_contacts if c.contact_email or c.marketing_email or c.sales_email
            )
            self.stats["end_time"] = datetime.utcnow().isoformat()

            # Summary message
            summary = f"🏆 ULTRA PRO MAX Extraction complete: {len(all_contacts)} companies"
            summary += f", {self.stats['emails_found']} emails"
            if self.stats.get('osint_leadership_found'):
                summary += f", {self.stats['osint_leadership_found']} leadership"
            if self.stats.get('osint_employees_found'):
                summary += f", {self.stats['osint_employees_found']} employees"
            if self.stats.get('web_search_emails_found'):
                summary += f", {self.stats['web_search_emails_found']} web search"
            if self.stats.get('ultra_deep_emails_found'):
                summary += f", {self.stats['ultra_deep_emails_found']} ultra deep"
            if self.stats.get('ultra_deep_paid_emails_found'):
                summary += f", {self.stats['ultra_deep_paid_emails_found']} paid APIs"

            self._update_progress("complete", 100, summary)

        except Exception as e:
            logger.error(f"Extraction error: {e}")
            self.stats["end_time"] = datetime.utcnow().isoformat()

        return all_contacts

    async def _enrich_with_paid_apis(self, contacts: List[CompanyContact]):
        """Enrich contacts using paid APIs with free fallback"""
        self._update_progress("enrichment", 0, "Enriching with additional data...")

        for i, contact in enumerate(contacts):
            try:
                # Try Hunter.io if API key provided
                if self.config.hunter_api_key and contact.company_domain:
                    enriched = await self._hunter_enrich(contact.company_domain)
                    if enriched:
                        contact.data_sources.append("hunter.io")
                        # Update emails if found
                        if enriched.get("emails"):
                            for email_data in enriched["emails"]:
                                email = email_data.get("value")
                                email_type = email_data.get("type", "generic")

                                if email_type == "generic" and not contact.contact_email:
                                    contact.contact_email = email
                                elif "marketing" in email_type and not contact.marketing_email:
                                    contact.marketing_email = email
                                elif "sales" in email_type and not contact.sales_email:
                                    contact.sales_email = email

                # Try Clearbit if API key provided
                if self.config.clearbit_api_key and contact.company_domain:
                    enriched = await self._clearbit_enrich(contact.company_domain)
                    if enriched:
                        contact.data_sources.append("clearbit")
                        if not contact.company_size:
                            contact.company_size = enriched.get("metrics", {}).get("employeesRange")
                        if not contact.company_industry:
                            contact.company_industry = enriched.get("category", {}).get("industry")

                progress = int((i + 1) / len(contacts) * 100)
                self._update_progress("enrichment", progress, f"Enriched {i + 1}/{len(contacts)}")

            except Exception as e:
                logger.warning(f"Enrichment error for {contact.company_name}: {e}")

    async def _hunter_enrich(self, domain: str) -> Optional[Dict]:
        """Enrich using Hunter.io API"""
        if not self.config.hunter_api_key:
            return None

        try:
            url = "https://api.hunter.io/v2/domain-search"
            params = {
                "domain": domain,
                "api_key": self.config.hunter_api_key
            }

            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.get(url, params=params)

                if response.status_code == 200:
                    self.stats["api_calls"] += 1
                    return response.json().get("data")

        except Exception as e:
            logger.warning(f"Hunter.io API error: {e}")

        return None

    async def _clearbit_enrich(self, domain: str) -> Optional[Dict]:
        """Enrich using Clearbit API"""
        if not self.config.clearbit_api_key:
            return None

        try:
            url = f"https://company.clearbit.com/v2/companies/find?domain={domain}"
            headers = {"Authorization": f"Bearer {self.config.clearbit_api_key}"}

            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.get(url, headers=headers)

                if response.status_code == 200:
                    self.stats["api_calls"] += 1
                    return response.json()

        except Exception as e:
            logger.warning(f"Clearbit API error: {e}")

        return None

    def _calculate_confidence(self, company_data: Dict) -> int:
        """Calculate confidence score for extracted data"""
        score = 0

        emails = company_data.get("emails", {})
        if emails.get("contact"):
            score += 30
        if emails.get("marketing"):
            score += 20
        if emails.get("sales"):
            score += 20

        if company_data.get("social_links", {}).get("linkedin"):
            score += 10

        if company_data.get("company_info", {}).get("name"):
            score += 10

        if company_data.get("people"):
            score += 10

        return min(score, 100)

    # ========== ULTRA ENGINE METHODS ==========

    async def _run_ultra_extraction(self, contacts: List[CompanyContact]):
        """
        Run ULTRA extraction for additional data sources.

        This method enhances contacts with:
        - GitHub organization emails
        - npm registry maintainer emails
        - DNS intelligence (MX/TXT records)
        - SSL certificate subdomains
        - Wayback Machine historical emails
        - NLP entity extraction
        - Email permutation generation
        """
        self._update_progress("contact_finding", 0, "Starting ULTRA extraction...")

        # Initialize NLP if needed
        await self._initialize_nlp()

        total = len(contacts)

        for i, contact in enumerate(contacts):
            try:
                domain = contact.company_domain
                company_name = contact.company_name

                if not domain:
                    continue

                progress = int((i / total) * 100)
                self._update_progress("contact_finding", progress, f"ULTRA: Processing {company_name}...")

                # 1. DNS Intelligence
                if self.dns_intel and self.config.use_dns_intelligence:
                    try:
                        dns_data = await self.dns_intel.get_domain_intelligence(domain)

                        # Extract emails from DNS records
                        dns_emails = dns_data.get("emails_from_txt", [])
                        for email in dns_emails[:3]:
                            if not contact.contact_email:
                                contact.contact_email = email
                            elif "dns_intel" not in contact.data_sources:
                                contact.data_sources.append("dns_intel")

                        # Check if domain has email service
                        if dns_data.get("has_email_service"):
                            contact.data_sources.append("dns_verified")

                    except Exception as e:
                        logger.debug(f"DNS intel error for {domain}: {e}")

                # 2. SSL Certificate Subdomains
                if self.ssl_intel and self.config.use_ssl_subdomains:
                    try:
                        subdomains = await self.ssl_intel.get_subdomains(domain)

                        # Look for interesting subdomains (mail, marketing, etc.)
                        interesting = [s for s in subdomains if any(
                            x in s.lower() for x in ["mail", "marketing", "sales", "support", "team"]
                        )]

                        if interesting:
                            contact.data_sources.append("ssl_certs")

                    except Exception as e:
                        logger.debug(f"SSL intel error for {domain}: {e}")

                # 3. GitHub Organization Search
                if self.github_scraper and self.config.use_github_extraction:
                    try:
                        # Clean company name for GitHub search
                        org_name = company_name.lower().replace(" ", "").replace("-", "").replace(".", "")

                        org_details = await self.github_scraper.get_org_details(org_name)

                        if org_details and org_details.get("email"):
                            if not contact.contact_email:
                                contact.contact_email = org_details["email"]
                            contact.data_sources.append("github_org")

                        # Get emails from commits (high confidence)
                        if org_details:
                            member_emails = await self.github_scraper.get_org_members_emails(org_name, max_members=5)

                            for member in member_emails[:3]:
                                # Add to people list
                                contact.people.append({
                                    "name": member.get("username"),
                                    "email": member.get("email"),
                                    "source": "github_commits",
                                    "confidence": 90
                                })

                            if member_emails:
                                contact.data_sources.append("github_commits")
                                self.stats["emails_found"] += len(member_emails)

                    except Exception as e:
                        logger.debug(f"GitHub extraction error for {company_name}: {e}")

                # 4. npm Registry Search
                if self.npm_scraper and self.config.use_npm_extraction:
                    try:
                        packages = await self.npm_scraper.search_packages(company_name, max_results=3)

                        for pkg in packages[:2]:
                            if pkg.get("publisher_email"):
                                contact.people.append({
                                    "name": pkg.get("publisher"),
                                    "email": pkg.get("publisher_email"),
                                    "source": "npm_registry",
                                    "context": f"npm package: {pkg.get('name')}",
                                    "confidence": 95
                                })
                                contact.data_sources.append("npm")
                                break

                    except Exception as e:
                        logger.debug(f"npm extraction error: {e}")

                # 5. HackerNews Mentions
                if self.hackernews_scraper and self.config.use_hackernews_mentions:
                    try:
                        mentions = await self.hackernews_scraper.search(company_name, max_results=5)

                        if mentions:
                            contact.data_sources.append("hackernews")

                    except Exception as e:
                        logger.debug(f"HackerNews error: {e}")

                # 6. Wayback Machine Historical Emails
                if self.wayback_intel and self.config.use_wayback_machine:
                    try:
                        historical_emails = await self.wayback_intel.get_historical_emails(domain)

                        for email in historical_emails[:5]:
                            email_lower = email.lower()

                            # Classify email
                            if any(x in email_lower for x in ["marketing", "ads", "pr"]) and not contact.marketing_email:
                                contact.marketing_email = email
                            elif any(x in email_lower for x in ["sales", "business"]) and not contact.sales_email:
                                contact.sales_email = email
                            elif not contact.contact_email:
                                contact.contact_email = email

                        if historical_emails:
                            contact.data_sources.append("wayback")
                            self.stats["emails_found"] += len(historical_emails)

                    except Exception as e:
                        logger.debug(f"Wayback error for {domain}: {e}")

                # 7. Email Permutation Generation
                if self.config.use_email_permutations and contact.people:
                    for person in contact.people[:3]:
                        person_name = person.get("name", "")

                        if person_name and domain:
                            # Generate email permutations
                            permutations = EmailPermutationGenerator.generate(person_name, domain)

                            # Add top 3 permutations to person data
                            person["possible_emails"] = [p["email"] for p in permutations[:3]]

                            self.stats["email_permutations_generated"] += len(permutations)

                    # Generate role-based emails
                    role_emails = EmailPermutationGenerator.generate_role_emails(domain)

                    for role_email in role_emails[:5]:
                        email = role_email["email"]

                        if "marketing" in email and not contact.marketing_email:
                            contact.marketing_email = email
                        elif "sales" in email and not contact.sales_email:
                            contact.sales_email = email
                        elif "info" in email or "contact" in email:
                            if not contact.contact_email:
                                contact.contact_email = email

                # 8. NLP Entity Extraction (if text data available)
                if self.nlp_extractor and self.config.use_nlp_extraction and contact.company_description:
                    try:
                        entities = self.nlp_extractor.extract_entities(contact.company_description)

                        # Extract persons
                        for person_name in entities.get("persons", [])[:5]:
                            if not any(p.get("name") == person_name for p in contact.people):
                                contact.people.append({
                                    "name": person_name,
                                    "source": "nlp_extraction"
                                })

                        # Extract emails
                        for email in entities.get("emails", []):
                            if not contact.contact_email:
                                contact.contact_email = email

                        self.stats["nlp_entities_extracted"] += len(entities.get("persons", []))

                    except Exception as e:
                        logger.debug(f"NLP extraction error: {e}")

                # Recalculate confidence
                contact.confidence_score = self._calculate_ultra_confidence(contact)

                await asyncio.sleep(0.2)  # Rate limiting

            except Exception as e:
                logger.warning(f"Ultra extraction error for {contact.company_name}: {e}")

        self._update_progress("contact_finding", 100, f"ULTRA extraction complete for {total} companies")

    async def _verify_and_deduplicate(self, contacts: List[CompanyContact]):
        """
        Verify emails and deduplicate contacts using fuzzy matching.
        """
        self._update_progress("enrichment", 0, "Verifying emails and deduplicating...")

        # Collect all emails for verification
        emails_to_verify = []

        for contact in contacts:
            for email in [contact.contact_email, contact.marketing_email, contact.sales_email]:
                if email and email not in emails_to_verify:
                    emails_to_verify.append(email)

        # Verify emails
        if self.email_verifier and self.config.use_email_verification:
            verified_count = 0

            for i, email in enumerate(emails_to_verify[:100]):  # Limit verification
                try:
                    result = await self.email_verifier.verify(email)

                    if result.get("deliverable"):
                        verified_count += 1

                    # Mark verification status in contacts
                    confidence = result.get("confidence", 0)
                    mx_valid = result.get("mx_valid", False)
                    is_disposable = result.get("is_disposable", False)
                    is_role_based = result.get("is_role_based", False)

                    # Determine verification status based on confidence
                    if confidence >= 80:
                        verification_status = "verified"
                    elif confidence >= 50:
                        verification_status = "maybe"
                    else:
                        verification_status = "not_verified"

                    for contact in contacts:
                        if contact.contact_email == email or contact.marketing_email == email or contact.sales_email == email:
                            # Store verification info
                            contact.email_verification_status = verification_status
                            contact.email_verification_confidence = confidence
                            contact.email_mx_valid = mx_valid
                            contact.email_is_disposable = is_disposable
                            contact.email_is_role_based = is_role_based

                            if "verified_emails" not in contact.data_sources:
                                contact.data_sources.append("verified_emails")

                except Exception as e:
                    logger.debug(f"Email verification error for {email}: {e}")

                progress = int((i + 1) / min(len(emails_to_verify), 100) * 50)
                self._update_progress("enrichment", progress, f"Verified {i + 1} emails...")

            self.stats["emails_verified"] = verified_count

        # Fuzzy deduplication
        if self.config.use_fuzzy_matching:
            self._update_progress("enrichment", 60, "Removing duplicates...")

            # Deduplicate company names
            seen_companies = {}
            unique_contacts = []

            for contact in contacts:
                company_key = contact.company_name.lower() if contact.company_name else ""

                # Check for fuzzy match
                is_duplicate = False

                for seen_key in seen_companies:
                    similarity = FuzzyMatcher.similarity(company_key, seen_key)

                    if similarity > 0.85:  # 85% similarity threshold
                        is_duplicate = True
                        self.stats["bloom_filter_hits"] += 1

                        # Merge data into existing contact
                        existing_contact = seen_companies[seen_key]

                        # Merge emails
                        if contact.contact_email and not existing_contact.contact_email:
                            existing_contact.contact_email = contact.contact_email
                        if contact.marketing_email and not existing_contact.marketing_email:
                            existing_contact.marketing_email = contact.marketing_email
                        if contact.sales_email and not existing_contact.sales_email:
                            existing_contact.sales_email = contact.sales_email

                        # Merge people
                        existing_contact.people.extend(contact.people)

                        # Merge data sources
                        existing_contact.data_sources = list(set(
                            existing_contact.data_sources + contact.data_sources
                        ))

                        break

                if not is_duplicate:
                    seen_companies[company_key] = contact
                    unique_contacts.append(contact)

            # Replace contacts list (in-place modification)
            contacts.clear()
            contacts.extend(unique_contacts)

        self._update_progress("enrichment", 100, "Verification and deduplication complete")

    async def _run_osint_extraction(self, contacts: List[CompanyContact]):
        """
        Run Deep OSINT extraction for companies and people.

        This method performs comprehensive Open Source Intelligence gathering:
        - Google dorking for emails and phone numbers
        - LinkedIn public profile scraping for leadership/employees
        - GitHub organization and user email extraction
        - Social media profile discovery
        - Company registry searches (OpenCorporates, SEC EDGAR)
        - Domain intelligence (WHOIS, DNS, subdomains)
        - Email permutation generation for discovered people
        """
        if not self.osint_engine:
            return

        self._update_progress("contact_finding", 50, "Starting Deep OSINT extraction...")

        total = len(contacts)

        for i, contact in enumerate(contacts):
            try:
                company_name = contact.company_name
                domain = contact.company_domain

                if not company_name:
                    continue

                progress = 50 + int((i / total) * 50)
                self._update_progress("contact_finding", progress, f"OSINT: Researching {company_name}...")

                # Perform deep company OSINT
                company_intel = await self.osint_engine.deep_company_osint(
                    company_name=company_name,
                    domain=domain,
                    find_leadership=self.config.osint_find_leadership,
                    find_employees=self.config.osint_find_employees
                )

                # Update contact with OSINT data
                if company_intel:
                    # Update company info
                    if company_intel.description and not contact.company_description:
                        contact.company_description = company_intel.description

                    if company_intel.headquarters and not contact.company_location:
                        contact.company_location = company_intel.headquarters

                    if company_intel.founded:
                        contact.company_founded = company_intel.founded

                    if company_intel.size:
                        contact.company_size = company_intel.size

                    if company_intel.industry:
                        contact.company_industry = company_intel.industry

                    # Update social profiles
                    if company_intel.linkedin_url and not contact.company_linkedin:
                        contact.company_linkedin = company_intel.linkedin_url
                        self.stats["osint_social_profiles_found"] += 1

                    # Update emails from OSINT
                    for email_type, email in company_intel.emails.items():
                        if isinstance(email, str):
                            if email_type in ["contact", "info", "dns", "whois"] and not contact.contact_email:
                                contact.contact_email = email
                            elif email_type == "marketing" and not contact.marketing_email:
                                contact.marketing_email = email
                            elif email_type == "sales" and not contact.sales_email:
                                contact.sales_email = email
                        elif isinstance(email, list):
                            for e in email[:2]:
                                if not contact.contact_email:
                                    contact.contact_email = e
                                    break

                    # Update phone numbers
                    if company_intel.phones:
                        self.stats["osint_phones_found"] += len(company_intel.phones)
                        # Store phones in people data or as additional contact info
                        for person in contact.people:
                            if "phones" not in person:
                                person["phones"] = company_intel.phones[:2]
                                break

                    # Add leadership to people
                    for leader in company_intel.leadership[:self.config.osint_max_leadership]:
                        # Check if already exists
                        existing = next(
                            (p for p in contact.people if p.get("name", "").lower() == leader.name.lower()),
                            None
                        )

                        if existing:
                            # Update existing person
                            if leader.title and not existing.get("title"):
                                existing["title"] = leader.title
                            if leader.linkedin_url and not existing.get("linkedin"):
                                existing["linkedin"] = leader.linkedin_url
                            if leader.emails:
                                existing["emails"] = list(set(existing.get("emails", []) + leader.emails))
                            existing["sources"] = list(set(existing.get("sources", []) + leader.sources))
                        else:
                            # Add new person
                            contact.people.append({
                                "name": leader.name,
                                "title": leader.title,
                                "role": "leadership",
                                "emails": leader.emails[:self.config.osint_max_email_permutations],
                                "linkedin": leader.linkedin_url,
                                "github": leader.github_url,
                                "twitter": leader.twitter_url,
                                "location": leader.location,
                                "sources": leader.sources,
                                "confidence": leader.confidence_score
                            })
                            self.stats["osint_leadership_found"] += 1

                    # Add employees to people
                    for employee in company_intel.employees[:self.config.osint_max_employees]:
                        # Check if already exists
                        existing = next(
                            (p for p in contact.people if p.get("name", "").lower() == employee.name.lower()),
                            None
                        )

                        if existing:
                            # Update existing person
                            if employee.title and not existing.get("title"):
                                existing["title"] = employee.title
                            if employee.linkedin_url and not existing.get("linkedin"):
                                existing["linkedin"] = employee.linkedin_url
                            if employee.github_url and not existing.get("github"):
                                existing["github"] = employee.github_url
                            if employee.emails:
                                existing["emails"] = list(set(existing.get("emails", []) + employee.emails))
                            existing["sources"] = list(set(existing.get("sources", []) + employee.sources))
                        else:
                            # Add new person
                            contact.people.append({
                                "name": employee.name,
                                "title": employee.title,
                                "role": "employee",
                                "emails": employee.emails[:self.config.osint_max_email_permutations],
                                "linkedin": employee.linkedin_url,
                                "github": employee.github_url,
                                "twitter": employee.twitter_url,
                                "location": employee.location,
                                "bio": employee.bio,
                                "sources": employee.sources,
                                "confidence": employee.confidence_score
                            })
                            self.stats["osint_employees_found"] += 1

                    # Add technologies discovered
                    if company_intel.technologies:
                        if "technologies" not in contact.data_sources:
                            contact.data_sources.append("technologies")

                    # Add subdomains for reference
                    if company_intel.subdomains:
                        if "subdomains" not in contact.data_sources:
                            contact.data_sources.append("subdomains")

                    # Update data sources
                    for source in company_intel.sources:
                        if source not in contact.data_sources:
                            contact.data_sources.append(f"osint_{source}")

                    # Recalculate confidence with OSINT data
                    contact.confidence_score = self._calculate_osint_confidence(contact)

                # Rate limiting
                await asyncio.sleep(0.5)

            except Exception as e:
                logger.warning(f"OSINT extraction error for {contact.company_name}: {e}")

        self._update_progress("contact_finding", 100, f"OSINT complete: Found {self.stats['osint_leadership_found']} leaders, {self.stats['osint_employees_found']} employees")

    async def _web_search_enhancement(self, contacts: List[CompanyContact]):
        """
        ULTRA DEEP FREE Web Search Enhancement - NO API Keys Required!
        Uses DuckDuckGo, Bing, SearX with MULTI-PAGE scraping
        and VARIED search prompts for maximum contact discovery
        """
        if not self.web_search:
            return

        # Focus on contacts without emails OR with incomplete data
        contacts_needing_emails = [
            c for c in contacts
            if not c.contact_email and not c.marketing_email and not c.sales_email
        ][:40]  # Increased limit for deeper search

        # Also get contacts with partial data for enrichment
        contacts_needing_enrichment = [
            c for c in contacts
            if c not in contacts_needing_emails and (
                not c.company_linkedin or
                len(c.people) < 2
            )
        ][:20]

        total_to_search = contacts_needing_emails + contacts_needing_enrichment

        if not total_to_search:
            logger.info("All companies have emails, skipping web search enhancement")
            return

        self._update_progress("web_search", 0, f"ULTRA Deep web search for {len(total_to_search)} companies...")

        for idx, contact in enumerate(total_to_search):
            try:
                progress = int((idx / len(total_to_search)) * 90)
                self._update_progress(
                    "web_search", progress,
                    f"Deep searching: {contact.company_name} ({idx+1}/{len(total_to_search)})..."
                )

                # ========== PHASE 1: Standard Email Search (Multi-page) ==========
                search_results = await self.web_search.search_company_emails(
                    company_name=contact.company_name,
                    domain=contact.company_domain,
                    max_results=self.config.web_search_max_results,
                    max_pages=3  # Scrape 3 pages per search
                )

                self.stats["web_search_queries"] += search_results.get("stats", {}).get("queries_used", 1)
                self.stats["web_search_results"] += search_results.get("stats", {}).get("total_results", 0)

                # Process found emails
                emails_found = search_results.get("emails_found", [])
                emails_categorized = search_results.get("emails_categorized", {})

                if emails_found:
                    self._process_found_emails(contact, emails_categorized, "Web Search (Multi-Page)")

                # ========== PHASE 2: ULTRA Deep Company Contact Search ==========
                if contact in contacts_needing_emails:  # Only for contacts really needing emails
                    deep_results = await self.web_search.deep_company_contact_search(
                        company_name=contact.company_name,
                        domain=contact.company_domain,
                        website_url=contact.company_website,
                        max_pages=5  # Go deeper - 5 pages per query
                    )

                    self.stats["web_search_queries"] += deep_results.get("queries_executed", 0)
                    self.stats["web_search_results"] += deep_results.get("search_results_count", 0)

                    # Process deep search emails
                    deep_emails = deep_results.get("emails_categorized", {})
                    if deep_emails:
                        self._process_found_emails(contact, deep_emails, "ULTRA Deep Web Search")

                    # Add social profiles
                    social_profiles = deep_results.get("social_profiles", {})
                    if social_profiles:
                        if social_profiles.get("linkedin_company") and not contact.company_linkedin:
                            contact.company_linkedin = social_profiles["linkedin_company"]
                            contact.data_sources.append("web_search_linkedin")

                        # Add LinkedIn people as contacts
                        linkedin_people = social_profiles.get("linkedin_people", [])
                        for profile_url in linkedin_people[:5]:
                            if not any(p.get("linkedin") == profile_url for p in contact.people):
                                contact.people.append({
                                    "linkedin": profile_url,
                                    "role": "leadership",
                                    "sources": ["deep_web_search"]
                                })
                                self.stats["osint_leadership_found"] += 1

                    # Emit discovery for social profiles
                    if social_profiles:
                        self._emit_live_contact(
                            company_name=contact.company_name,
                            contact_type="social",
                            source="Deep Web Search",
                            confidence=65,
                            website=contact.company_website
                        )

                # ========== PHASE 3: Leadership Search ==========
                if self.config.osint_find_leadership and len(contact.people) < 3:
                    leadership_results = await self.web_search.search_leadership(
                        company_name=contact.company_name,
                        max_results=30  # More results
                    )

                    linkedin_profiles = leadership_results.get("linkedin_profiles", [])
                    for profile in linkedin_profiles[:5]:
                        if isinstance(profile, SearchResult):
                            name = profile.title.split(" - ")[0] if profile.title else ""
                            if name and not any(p.get("name") == name for p in contact.people):
                                contact.people.append({
                                    "name": name,
                                    "role": "leadership",
                                    "linkedin": profile.url,
                                    "sources": ["web_search_linkedin"]
                                })
                                self.stats["osint_leadership_found"] += 1
                                self._emit_live_contact(
                                    company_name=contact.company_name,
                                    contact_type="leadership",
                                    source="Web Search LinkedIn",
                                    confidence=60,
                                    person_name=name
                                )

                # ========== PHASE 4: ULTRA PARALLEL MULTI-ATTEMPT SEARCH ==========
                # For contacts STILL without emails after Phase 1-3, run aggressive parallel search
                still_needs_email = not contact.contact_email and not contact.marketing_email and not contact.sales_email

                if still_needs_email and contact in contacts_needing_emails:
                    self._update_progress(
                        "web_search", progress + 2,
                        f"🔥 PARALLEL HUNT for {contact.company_name} - 8 methods in parallel..."
                    )

                    try:
                        # Run ULTRA parallel search - 8 methods simultaneously
                        parallel_results = await self.web_search.parallel_multi_attempt_search(
                            company_name=contact.company_name,
                            domain=contact.company_domain,
                            website_url=contact.company_website,
                            product_name=contact.product_name if hasattr(contact, 'product_name') else None,
                            max_attempts=4
                        )

                        self.stats["web_search_queries"] += parallel_results.get("total_queries", 8)

                        # Process parallel search emails
                        parallel_emails = parallel_results.get("emails_categorized", {})
                        if parallel_emails:
                            self._process_found_emails(contact, parallel_emails, "ULTRA Parallel Search (8 Methods)")
                            logger.info(f"🎯 Parallel search found {len(parallel_emails)} emails for {contact.company_name}")

                        # Add people found from parallel search
                        parallel_people = parallel_results.get("people_found", [])
                        for person in parallel_people[:5]:
                            if isinstance(person, dict):
                                name = person.get("name", "")
                                if name and not any(p.get("name") == name for p in contact.people):
                                    contact.people.append({
                                        "name": name,
                                        "role": person.get("role", "contact"),
                                        "linkedin": person.get("linkedin"),
                                        "github": person.get("github"),
                                        "sources": person.get("sources", ["parallel_search"])
                                    })
                                    self.stats["osint_employees_found"] += 1

                        # Add social profiles from parallel search
                        parallel_social = parallel_results.get("social_profiles", {})
                        if parallel_social:
                            if parallel_social.get("github") and not hasattr(contact, 'company_github'):
                                contact.company_github = parallel_social["github"]
                            if parallel_social.get("producthunt"):
                                if "producthunt" not in contact.data_sources:
                                    contact.data_sources.append("producthunt")

                        # Add discovered sources to global cache
                        discovered = parallel_results.get("discovered_sources", [])
                        for source in discovered:
                            self.web_search.discovered_sources.add(source)

                    except Exception as e:
                        logger.warning(f"Parallel search error for {contact.company_name}: {e}")

                    # ========== PHASE 4.5: AGGRESSIVE LAST RESORT ==========
                    # If STILL no email after parallel search, use aggressive hunt with 4 retries
                    still_needs_email = not contact.contact_email and not contact.marketing_email and not contact.sales_email

                    if still_needs_email:
                        self._update_progress(
                            "web_search", progress + 4,
                            f"🎯 AGGRESSIVE HUNT for {contact.company_name} - 4 retry strategies..."
                        )

                        try:
                            aggressive_results = await self.web_search.aggressive_contact_hunt(
                                company_name=contact.company_name,
                                domain=contact.company_domain,
                                website_url=contact.company_website,
                                retry_count=4
                            )

                            if aggressive_results.get("success"):
                                aggressive_emails = aggressive_results.get("emails_categorized", {})
                                if aggressive_emails:
                                    self._process_found_emails(contact, aggressive_emails, "AGGRESSIVE Hunt (4 Retries)")
                                    logger.info(f"✅ Aggressive hunt found {len(aggressive_emails)} emails for {contact.company_name}")

                        except Exception as e:
                            logger.warning(f"Aggressive hunt error for {contact.company_name}: {e}")

                # Update data sources
                if "web_search_deep" not in contact.data_sources:
                    contact.data_sources.append("web_search_deep")

                # Update total email count
                self.stats["emails_found"] = sum(1 for c in contacts if c.contact_email or c.marketing_email or c.sales_email)

                # Rate limiting between companies
                await asyncio.sleep(self.config.web_search_delay)

            except Exception as e:
                logger.warning(f"Web search error for {contact.company_name}: {e}")

        self._update_progress("web_search", 95, f"ULTRA Deep search complete: Found {self.stats['web_search_emails_found']} emails")

    # ========== ULTRA DEEP SEARCH V2.0 ==========
    async def _run_ultra_deep_extraction(self, contacts: List[CompanyContact]):
        """
        ULTRA DEEP SEARCH V2.0 - Maximum extraction power!

        15+ FREE LAYERS:
        1. Multi-Engine Search (6 engines parallel)
        2. Archive Mining (Wayback, Archive.today, CommonCrawl, Google Cache)
        3. DNS Intelligence (MX, TXT, SPF, DMARC)
        4. WHOIS Intelligence (domain contacts)
        5. Certificate Transparency (subdomain discovery)
        6. Sitemap Mining (hidden pages)
        7. Social Media Discovery (LinkedIn, Twitter, Facebook)
        8. Developer Platforms (GitHub, GitLab, npm, PyPI)
        9. Job Postings (Indeed, Glassdoor, LinkedIn Jobs)
        10. Press Releases (PRNewswire, BusinessWire)
        11. Startup Databases (Crunchbase, AngelList, ProductHunt)
        12. Email Permutation (50+ patterns)
        13. SMTP Verification (free email verification)
        14. Google Cache Mining
        15. Academic/Research Paper Mining

        10+ PAID API INTEGRATIONS:
        1. Hunter.io - Email discovery
        2. Clearbit - Company enrichment
        3. Apollo.io - Contact/leads
        4. RocketReach - Verified emails
        5. Snov.io - Email finder
        6. BuiltWith - Tech stack
        7. Lusha - Contact data
        8. ZoomInfo - B2B intelligence
        9. LeadIQ - Sales intelligence
        10. Cognism - B2B data
        """
        if not ULTRA_DEEP_AVAILABLE:
            logger.warning("ULTRA DEEP Search Engine not available")
            return

        logger.info("🚀 ULTRA DEEP V2.0: Starting 15+ layer extraction...")
        self._update_progress("ultra_deep", 5, "Initializing ULTRA DEEP Search Engine V2.0...")

        # Filter contacts that need emails
        contacts_needing_emails = [
            c for c in contacts
            if not c.contact_email and not c.marketing_email and not c.sales_email
        ]

        if not contacts_needing_emails:
            logger.info("All contacts already have emails, skipping ULTRA DEEP")
            return

        logger.info(f"ULTRA DEEP: Processing {len(contacts_needing_emails)} contacts without emails")

        # Build configuration for ULTRA DEEP engine
        ultra_config = {
            'max_concurrent': self.config.ultra_deep_max_concurrent,
            'timeout': self.config.ultra_deep_timeout,
            'retry_count': self.config.ultra_deep_retry_count,
        }

        # Add PAID API keys if available
        if self.config.hunter_io_api_key:
            ultra_config['hunter_api_key'] = self.config.hunter_io_api_key
        if self.config.clearbit_api_key_v2:
            ultra_config['clearbit_api_key'] = self.config.clearbit_api_key_v2
        if self.config.apollo_io_api_key:
            ultra_config['apollo_api_key'] = self.config.apollo_io_api_key
        if self.config.rocketreach_api_key:
            ultra_config['rocketreach_api_key'] = self.config.rocketreach_api_key
        if self.config.snov_io_api_key:
            ultra_config['snov_client_id'] = self.config.snov_io_api_key
            ultra_config['snov_client_secret'] = self.config.snov_io_api_key  # Using same key for both
        if self.config.builtwith_api_key:
            ultra_config['builtwith_api_key'] = self.config.builtwith_api_key

        # Initialize ULTRA DEEP engine
        try:
            ultra_deep_engine = UltraDeepSearchEngine(config=ultra_config)
        except Exception as e:
            logger.error(f"Failed to initialize ULTRA DEEP engine: {e}")
            return

        total = len(contacts_needing_emails)

        # Process contacts in batches for efficiency
        batch_size = 5
        for batch_idx in range(0, total, batch_size):
            batch = contacts_needing_emails[batch_idx:batch_idx + batch_size]
            batch_num = batch_idx // batch_size + 1
            total_batches = (total + batch_size - 1) // batch_size

            self._update_progress(
                "ultra_deep",
                10 + int(80 * batch_idx / total),
                f"🔍 ULTRA DEEP V2.0: Batch {batch_num}/{total_batches} - Processing {len(batch)} contacts..."
            )

            # Process batch concurrently
            tasks = []
            for contact in batch:
                domain = contact.company_domain or self._extract_domain(contact.company_website)
                if domain:
                    tasks.append(self._ultra_deep_process_contact(
                        ultra_deep_engine, contact, domain
                    ))

            if tasks:
                try:
                    await asyncio.gather(*tasks, return_exceptions=True)
                except Exception as e:
                    logger.warning(f"ULTRA DEEP batch error: {e}")

            # Small delay between batches
            await asyncio.sleep(0.5)

        # Update final stats
        self._update_progress(
            "ultra_deep", 95,
            f"✅ ULTRA DEEP V2.0 complete: {self.stats['ultra_deep_emails_found']} emails found"
        )

        logger.info(f"ULTRA DEEP V2.0 completed: {self.stats['ultra_deep_emails_found']} emails, "
                   f"{self.stats['ultra_deep_layers_completed']} layers completed")

    async def _ultra_deep_process_contact(
        self,
        engine: 'UltraDeepSearchEngine',
        contact: CompanyContact,
        domain: str
    ):
        """Process a single contact through ULTRA DEEP layers"""
        try:
            # Run ULTRA DEEP extraction
            result = await engine.deep_search_company(
                company_name=contact.company_name,
                domain=domain,
                use_paid=self.config.ultra_deep_use_paid_apis
            )

            if not result:
                return

            # Process all emails found (DeepSearchResult has .emails list)
            for email in result.emails:
                if email and self._is_valid_email(email):
                    self._assign_ultra_deep_email(contact, email, "ultra_deep_search")

            # Process verified emails (higher confidence)
            for email in result.verified_emails:
                if email and self._is_valid_email(email):
                    self._assign_ultra_deep_email(contact, email, "ultra_deep_verified")
                    self.stats['ultra_deep_smtp_verified'] += 1

            # Track people found
            for person in result.people:
                if person.get('email') and person.get('name'):
                    contact.people.append({
                        'name': person['name'],
                        'email': person['email'],
                        'title': person.get('title', ''),
                        'source': 'ultra_deep_v2'
                    })
                    # Also assign person email to contact if available
                    if self._is_valid_email(person['email']):
                        self._assign_ultra_deep_email(contact, person['email'], "ultra_deep_person")

            # Add data source markers
            if result.sources:
                for source in result.sources:
                    if source not in contact.data_sources:
                        contact.data_sources.append(f"ultra_deep_{source}")
                self.stats['ultra_deep_layers_completed'] += len(result.sources)
                # Update layer-specific stats
                for source in result.sources:
                    self._update_layer_stats(source)

            # Update confidence
            if result.confidence_score:
                contact.email_verification_confidence = max(
                    contact.email_verification_confidence,
                    result.confidence_score
                )

            # Store raw data for debugging
            if result.raw_data:
                # Check for paid API data to track separately
                for api_name in ['hunter', 'clearbit', 'apollo', 'rocketreach', 'snov', 'builtwith']:
                    if api_name in result.raw_data:
                        self.stats['ultra_deep_paid_emails_found'] += 1

        except Exception as e:
            logger.warning(f"ULTRA DEEP error for {contact.company_name}: {e}")

    def _assign_ultra_deep_email(self, contact: CompanyContact, email: str, source: str):
        """Assign email from ULTRA DEEP to appropriate contact field"""
        email_lower = email.lower()
        assigned = False

        # Categorize and assign
        if any(p in email_lower for p in ['marketing', 'promo', 'ads', 'growth', 'media']):
            if not contact.marketing_email:
                contact.marketing_email = email
                assigned = True
        elif any(p in email_lower for p in ['sales', 'business', 'partner', 'deals']):
            if not contact.sales_email:
                contact.sales_email = email
                assigned = True
        elif any(p in email_lower for p in ['press', 'pr@', 'media@', 'news']):
            if not contact.press_email:
                contact.press_email = email
                assigned = True
        elif any(p in email_lower for p in ['support', 'help', 'service', 'care']):
            if not contact.support_email:
                contact.support_email = email
                assigned = True
        elif not contact.contact_email:
            contact.contact_email = email
            assigned = True

        if assigned:
            self.stats['ultra_deep_emails_found'] += 1
            if source not in contact.data_sources:
                contact.data_sources.append(source)

            # Emit live update
            self._emit_live_contact(
                company_name=contact.company_name,
                contact_type="email",
                source=source,
                confidence=75,  # ULTRA DEEP emails are high confidence
                email=email
            )

    def _update_layer_stats(self, layer_name: str):
        """Update stats for specific ULTRA DEEP layer"""
        layer_stat_map = {
            'multi_engine': 'ultra_deep_multi_engine_hits',
            'archive': 'ultra_deep_archive_hits',
            'dns': 'ultra_deep_dns_hits',
            'whois': 'ultra_deep_whois_hits',
            'ct': 'ultra_deep_ct_hits',
            'certificate': 'ultra_deep_ct_hits',
            'sitemap': 'ultra_deep_sitemap_hits',
            'social': 'ultra_deep_social_hits',
            'developer': 'ultra_deep_dev_platform_hits',
            'github': 'ultra_deep_dev_platform_hits',
            'job': 'ultra_deep_job_posting_hits',
            'press': 'ultra_deep_press_hits',
            'startup': 'ultra_deep_startup_db_hits',
        }

        for key, stat_name in layer_stat_map.items():
            if key in layer_name.lower():
                self.stats[stat_name] = self.stats.get(stat_name, 0) + 1
                break

    def _extract_domain(self, url: Optional[str]) -> Optional[str]:
        """Extract domain from URL"""
        if not url:
            return None
        try:
            parsed = urlparse(url if url.startswith('http') else f'https://{url}')
            domain = parsed.netloc or parsed.path.split('/')[0]
            return domain.lower().replace('www.', '')
        except:
            return None

    def _is_valid_email(self, email: str) -> bool:
        """Validate email format"""
        if not email or not isinstance(email, str):
            return False
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(email_pattern, email.strip()))

    def _process_found_emails(self, contact: CompanyContact, emails_categorized: Dict[str, str], source: str):
        """Helper to process and assign found emails to contact"""
        for email, category in emails_categorized.items():
            added = False
            if category == "marketing" and not contact.marketing_email:
                contact.marketing_email = email
                added = True
            elif category == "sales" and not contact.sales_email:
                contact.sales_email = email
                added = True
            elif category == "support" and not contact.support_email:
                contact.support_email = email
                added = True
            elif category in ["general", "other"] and not contact.contact_email:
                contact.contact_email = email
                added = True

            if added:
                self.stats["web_search_emails_found"] += 1
                self._emit_live_contact(
                    company_name=contact.company_name,
                    contact_type="email",
                    source=source,
                    confidence=60 if category in ["marketing", "sales"] else 55,
                    email=email
                )

    def _calculate_osint_confidence(self, contact: CompanyContact) -> int:
        """
        Calculate confidence score including OSINT data.
        """
        score = self._calculate_ultra_confidence(contact)

        # OSINT bonuses
        osint_sources = [s for s in contact.data_sources if s.startswith("osint_")]
        score += min(len(osint_sources) * 3, 15)

        # Leadership/employee data bonus
        leadership_count = sum(1 for p in contact.people if p.get("role") == "leadership")
        employee_count = sum(1 for p in contact.people if p.get("role") == "employee")

        if leadership_count > 0:
            score += min(leadership_count * 5, 15)
        if employee_count > 0:
            score += min(employee_count * 2, 10)

        # People with emails bonus
        people_with_emails = sum(1 for p in contact.people if p.get("emails"))
        score += min(people_with_emails * 3, 15)

        return min(score, 100)

    def _calculate_ultra_confidence(self, contact: CompanyContact) -> int:
        """
        Calculate enhanced confidence score using ULTRA metrics.
        """
        score = 0

        # Email presence
        if contact.contact_email:
            score += 20
        if contact.marketing_email:
            score += 15
        if contact.sales_email:
            score += 15

        # Data quality
        if contact.company_linkedin:
            score += 10
        if contact.company_description:
            score += 5
        if contact.people:
            score += min(len(contact.people) * 3, 15)

        # Data source diversity (more sources = higher confidence)
        source_count = len(set(contact.data_sources))
        score += min(source_count * 5, 25)

        # Bonus for high-quality sources
        high_quality_sources = ["github_commits", "npm", "verified_emails", "dns_verified"]
        for source in high_quality_sources:
            if source in contact.data_sources:
                score += 5

        return min(score, 100)

    def get_stats(self) -> Dict[str, Any]:
        """Get extraction statistics"""
        return self.stats

    def get_progress(self) -> Dict[str, Any]:
        """Get current progress"""
        return self.progress

    async def close(self):
        """Close all scrapers, Ultra engine, and OSINT engine components"""
        # Base scrapers
        await self.playstore.close()
        await self.appstore.close()
        await self.steam.close()
        await self.website_scraper.close()
        await self.producthunt.close()

        # Ultra engine scrapers
        if self.github_scraper:
            await self.github_scraper.close()
        if self.npm_scraper:
            await self.npm_scraper.close()
        if self.hackernews_scraper:
            await self.hackernews_scraper.close()
        if self.ssl_intel:
            await self.ssl_intel.close()
        if self.wayback_intel:
            await self.wayback_intel.close()

        # OSINT engine
        if self.osint_engine:
            await self.osint_engine.close()

        logger.info("MobiAdz ULTRA+OSINT Extraction Engine V2.0 closed")


# Quick start functions
async def quick_mobiadz_extraction(
    demographics: List[str],
    categories: List[str],
    use_paid: bool = False,
    max_companies: int = 100
) -> List[Dict[str, Any]]:
    """
    Quick start function for MobiAdz extraction.

    Example:
        results = await quick_mobiadz_extraction(
            demographics=["usa", "europe"],
            categories=["mobile_apps", "games"],
            max_companies=50
        )
    """
    # Convert string inputs to enums
    demo_enums = [Demographic(d) for d in demographics if d in [e.value for e in Demographic]]
    cat_enums = [ProductCategory(c) for c in categories if c in [e.value for e in ProductCategory]]

    config = MobiAdzConfig(
        demographics=demo_enums or [Demographic.USA],
        categories=cat_enums or [ProductCategory.MOBILE_APPS],
        max_companies=max_companies,
        use_paid_apis=use_paid
    )

    engine = MobiAdzExtractionEngine(config)

    try:
        contacts = await engine.run_extraction()

        # Convert to dicts
        return [
            {
                "company_name": c.company_name,
                "app_or_product": c.app_or_product,
                "product_category": c.product_category,
                "demographic": c.demographic,
                "company_website": c.company_website,
                "contact_email": c.contact_email,
                "marketing_email": c.marketing_email,
                "sales_email": c.sales_email,
                "support_email": c.support_email,
                "company_linkedin": c.company_linkedin,
                "playstore_url": c.playstore_url,
                "appstore_url": c.appstore_url,
                "people": c.people,
                "confidence_score": c.confidence_score,
                "data_sources": c.data_sources
            }
            for c in contacts
        ]
    finally:
        await engine.close()
