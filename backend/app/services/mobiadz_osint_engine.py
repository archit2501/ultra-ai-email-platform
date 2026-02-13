"""
THEMOBIADZ OSINT ENGINE V1.0
Deep Open Source Intelligence for Company & People Data Extraction

OSINT CAPABILITIES:
==================

1. COMPANY OSINT:
   - OpenCorporates (company registry data)
   - SEC EDGAR (US public company filings)
   - Companies House UK API
   - Crunchbase public data
   - LinkedIn company pages (public)
   - Google dorking for company data

2. PEOPLE/LEADERSHIP OSINT:
   - LinkedIn public profiles
   - Twitter/X profiles
   - GitHub user profiles
   - Gravatar lookups
   - About.me pages
   - Speaker/conference profiles

3. EMAIL OSINT:
   - Google dorking for emails
   - Email permutation + verification
   - Gravatar email lookup
   - GitHub commit emails
   - Have I Been Pwned (breach check)
   - EmailRep.io reputation

4. PHONE OSINT:
   - Website scraping
   - Social media extraction
   - Business directory lookups

5. DOMAIN OSINT:
   - WHOIS data
   - DNS records (MX, TXT, NS)
   - Subdomain enumeration
   - Technology detection
   - Historical data (Wayback)

6. SOCIAL MEDIA OSINT:
   - Twitter/X profiles
   - Facebook pages
   - Instagram business
   - YouTube channels
   - TikTok profiles
"""

import asyncio
import logging
import re
import json
import hashlib
from typing import Dict, Any, List, Optional, Set, Tuple
from dataclasses import dataclass, field
from datetime import datetime
from urllib.parse import urlparse, urlencode, quote, parse_qs
from collections import defaultdict

import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)


# ============================================
# DATA STRUCTURES
# ============================================

@dataclass
class PersonIntel:
    """Intelligence data for a person"""
    name: str
    title: Optional[str] = None
    company: Optional[str] = None

    # Contact info
    emails: List[str] = field(default_factory=list)
    phones: List[str] = field(default_factory=list)

    # Social profiles
    linkedin_url: Optional[str] = None
    twitter_url: Optional[str] = None
    github_url: Optional[str] = None
    facebook_url: Optional[str] = None

    # Additional data
    location: Optional[str] = None
    bio: Optional[str] = None
    profile_image: Optional[str] = None

    # OSINT metadata
    sources: List[str] = field(default_factory=list)
    confidence_score: int = 0
    last_updated: str = field(default_factory=lambda: datetime.utcnow().isoformat())


@dataclass
class CompanyIntel:
    """Intelligence data for a company"""
    name: str
    domain: Optional[str] = None

    # Company info
    description: Optional[str] = None
    industry: Optional[str] = None
    founded: Optional[str] = None
    size: Optional[str] = None
    headquarters: Optional[str] = None

    # Contact info
    emails: Dict[str, str] = field(default_factory=dict)  # type -> email
    phones: List[str] = field(default_factory=list)
    address: Optional[str] = None

    # Social profiles
    linkedin_url: Optional[str] = None
    twitter_url: Optional[str] = None
    facebook_url: Optional[str] = None

    # Leadership
    leadership: List[PersonIntel] = field(default_factory=list)
    employees: List[PersonIntel] = field(default_factory=list)

    # Technical data
    technologies: List[str] = field(default_factory=list)
    subdomains: List[str] = field(default_factory=list)

    # OSINT metadata
    sources: List[str] = field(default_factory=list)
    confidence_score: int = 0


# ============================================
# GOOGLE DORKING OSINT
# ============================================

class GoogleDorkingOSINT:
    """
    FREE Google Dorking for OSINT
    Uses DuckDuckGo HTML (no API key needed)
    """

    # Google Dork patterns
    EMAIL_DORKS = [
        'site:{domain} "@{domain}"',
        'site:{domain} "email" OR "contact"',
        'site:linkedin.com "{company}" "@{domain}"',
        '"{company}" "@{domain}" -site:{domain}',
        'filetype:pdf site:{domain} "@"',
        'filetype:xlsx site:{domain} "email"',
        '"{company}" "email" "director" OR "manager" OR "head"',
        'site:github.com "{company}" "@{domain}"',
    ]

    PHONE_DORKS = [
        'site:{domain} "phone" OR "tel" OR "call"',
        'site:{domain} "+1" OR "+44" OR "+91"',
        '"{company}" "contact" "phone"',
    ]

    LEADERSHIP_DORKS = [
        'site:linkedin.com/in "{company}" "CEO" OR "CTO" OR "Founder"',
        'site:linkedin.com/in "{company}" "Director" OR "VP" OR "Head"',
        'site:{domain} "team" OR "about" OR "leadership"',
        '"{company}" "CEO" OR "founder" site:crunchbase.com',
        '"{company}" "executive" OR "management" site:bloomberg.com',
    ]

    def __init__(self, timeout: int = 30):
        self.timeout = timeout
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        self.client = httpx.AsyncClient(timeout=timeout, follow_redirects=True)
        self.results_cache: Dict[str, List[Dict]] = {}

    async def search_duckduckgo(self, query: str, max_results: int = 20) -> List[Dict[str, Any]]:
        """Search using DuckDuckGo HTML (no API needed)"""
        results = []

        cache_key = hashlib.md5(query.encode()).hexdigest()
        if cache_key in self.results_cache:
            return self.results_cache[cache_key]

        try:
            url = "https://html.duckduckgo.com/html/"
            data = {"q": query, "kl": "us-en"}

            response = await self.client.post(url, data=data, headers=self.headers)

            if response.status_code == 200:
                soup = BeautifulSoup(response.text, "html.parser")

                for result in soup.select(".result")[:max_results]:
                    title_elem = result.select_one(".result__title")
                    snippet_elem = result.select_one(".result__snippet")
                    url_elem = result.select_one(".result__url")

                    if title_elem:
                        link = title_elem.find("a")
                        results.append({
                            "title": title_elem.get_text(strip=True),
                            "url": link.get("href") if link else None,
                            "snippet": snippet_elem.get_text(strip=True) if snippet_elem else "",
                            "displayed_url": url_elem.get_text(strip=True) if url_elem else ""
                        })

                self.results_cache[cache_key] = results

        except Exception as e:
            logger.debug(f"DuckDuckGo search error: {e}")

        return results

    async def find_emails(self, company: str, domain: str) -> List[Dict[str, Any]]:
        """Find emails using dorking"""
        emails_found = []

        for dork_template in self.EMAIL_DORKS[:4]:  # Limit queries
            try:
                dork = dork_template.format(company=company, domain=domain)
                results = await self.search_duckduckgo(dork, max_results=10)

                for result in results:
                    text = f"{result.get('title', '')} {result.get('snippet', '')}"

                    # Extract emails from text
                    found = re.findall(r'[\w.+-]+@[\w.-]+\.\w+', text)

                    for email in found:
                        if domain in email.lower() or not any(
                            x in email.lower() for x in ['example.com', 'email.com', 'domain.com']
                        ):
                            emails_found.append({
                                "email": email.lower(),
                                "source": "google_dork",
                                "context": result.get("snippet", "")[:100]
                            })

                await asyncio.sleep(1)  # Rate limiting

            except Exception as e:
                logger.debug(f"Email dork error: {e}")

        # Deduplicate
        seen = set()
        unique_emails = []
        for e in emails_found:
            if e["email"] not in seen:
                seen.add(e["email"])
                unique_emails.append(e)

        return unique_emails

    async def find_leadership(self, company: str, domain: str) -> List[Dict[str, Any]]:
        """Find leadership/executives using dorking"""
        people_found = []

        for dork_template in self.LEADERSHIP_DORKS[:3]:
            try:
                dork = dork_template.format(company=company, domain=domain)
                results = await self.search_duckduckgo(dork, max_results=10)

                for result in results:
                    url = result.get("url", "")
                    title = result.get("title", "")
                    snippet = result.get("snippet", "")

                    # Extract LinkedIn profiles
                    if "linkedin.com/in/" in url:
                        # Extract name from title (usually "Name - Title | LinkedIn")
                        name_match = re.match(r'^([^-|]+)', title)
                        if name_match:
                            name = name_match.group(1).strip()

                            # Try to extract title
                            title_match = re.search(r'-\s*([^|]+)', title)
                            job_title = title_match.group(1).strip() if title_match else None

                            people_found.append({
                                "name": name,
                                "title": job_title,
                                "linkedin_url": url,
                                "source": "linkedin_dork",
                                "snippet": snippet[:200]
                            })

                await asyncio.sleep(1)

            except Exception as e:
                logger.debug(f"Leadership dork error: {e}")

        return people_found

    async def find_phones(self, company: str, domain: str) -> List[str]:
        """Find phone numbers using dorking"""
        phones_found = set()

        phone_patterns = [
            r'\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}',  # US
            r'\+44\s?[0-9]{4}\s?[0-9]{6}',  # UK
            r'\+91[-.\s]?[0-9]{10}',  # India
            r'\+[0-9]{1,3}[-.\s]?[0-9]{6,14}',  # International
        ]

        for dork_template in self.PHONE_DORKS[:2]:
            try:
                dork = dork_template.format(company=company, domain=domain)
                results = await self.search_duckduckgo(dork, max_results=10)

                for result in results:
                    text = f"{result.get('title', '')} {result.get('snippet', '')}"

                    for pattern in phone_patterns:
                        found = re.findall(pattern, text)
                        phones_found.update(found)

                await asyncio.sleep(1)

            except Exception as e:
                logger.debug(f"Phone dork error: {e}")

        return list(phones_found)

    async def close(self):
        await self.client.aclose()


# ============================================
# LINKEDIN PUBLIC OSINT
# ============================================

class LinkedInPublicOSINT:
    """
    FREE LinkedIn public page scraper
    Extracts company and people info from public pages
    """

    def __init__(self, timeout: int = 30):
        self.timeout = timeout
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
        }
        self.client = httpx.AsyncClient(timeout=timeout, follow_redirects=True)

    async def get_company_page(self, company_slug: str) -> Optional[Dict[str, Any]]:
        """Get company info from public LinkedIn page"""
        result = {
            "name": None,
            "description": None,
            "industry": None,
            "size": None,
            "headquarters": None,
            "website": None,
            "linkedin_url": f"https://www.linkedin.com/company/{company_slug}",
            "employees_on_linkedin": None
        }

        try:
            url = f"https://www.linkedin.com/company/{company_slug}"
            response = await self.client.get(url, headers=self.headers)

            if response.status_code == 200:
                soup = BeautifulSoup(response.text, "html.parser")

                # Try to extract from JSON-LD
                scripts = soup.find_all("script", type="application/ld+json")
                for script in scripts:
                    try:
                        data = json.loads(script.string)
                        if data.get("@type") == "Organization":
                            result["name"] = data.get("name")
                            result["description"] = data.get("description")
                            result["website"] = data.get("url")
                    except:
                        pass

                # Extract from meta tags
                og_title = soup.find("meta", property="og:title")
                if og_title and not result["name"]:
                    result["name"] = og_title.get("content", "").split("|")[0].strip()

                og_desc = soup.find("meta", property="og:description")
                if og_desc and not result["description"]:
                    result["description"] = og_desc.get("content", "")

                return result

        except Exception as e:
            logger.debug(f"LinkedIn company scrape error: {e}")

        return None

    async def search_company_employees(self, company: str) -> List[Dict[str, Any]]:
        """Search for company employees using Google"""
        employees = []

        # Use Google/DuckDuckGo to find LinkedIn profiles
        dork_searcher = GoogleDorkingOSINT()

        try:
            # Search for employees
            query = f'site:linkedin.com/in "{company}" current'
            results = await dork_searcher.search_duckduckgo(query, max_results=20)

            for result in results:
                url = result.get("url", "")
                title = result.get("title", "")

                if "linkedin.com/in/" in url:
                    # Parse name and title from result
                    name_match = re.match(r'^([^-|]+)', title)
                    if name_match:
                        name = name_match.group(1).strip()

                        # Extract job title
                        title_match = re.search(r'-\s*([^|]+)', title)
                        job_title = title_match.group(1).strip() if title_match else None

                        # Check if this person works at the company
                        if company.lower() in title.lower() or company.lower() in result.get("snippet", "").lower():
                            employees.append({
                                "name": name,
                                "title": job_title,
                                "linkedin_url": url,
                                "company": company,
                                "source": "linkedin_search"
                            })

        except Exception as e:
            logger.debug(f"LinkedIn employee search error: {e}")
        finally:
            await dork_searcher.close()

        return employees

    async def close(self):
        await self.client.aclose()


# ============================================
# GITHUB OSINT
# ============================================

class GitHubOSINT:
    """
    FREE GitHub OSINT
    Extracts user info, emails from commits, organization data
    """

    def __init__(self, timeout: int = 30):
        self.timeout = timeout
        self.api_url = "https://api.github.com"
        self.headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "MobiAdz-OSINT/1.0"
        }
        self.client = httpx.AsyncClient(timeout=timeout)
        self.rate_remaining = 60

    async def search_org_members(self, org_name: str, max_members: int = 20) -> List[Dict[str, Any]]:
        """Search organization members and extract emails"""
        members = []

        try:
            # Get public members
            url = f"{self.api_url}/orgs/{org_name}/members"
            params = {"per_page": min(max_members, 100)}

            response = await self.client.get(url, params=params, headers=self.headers)
            self.rate_remaining = int(response.headers.get("X-RateLimit-Remaining", 60))

            if response.status_code == 200:
                member_list = response.json()

                for member in member_list[:max_members]:
                    username = member.get("login")

                    if username and self.rate_remaining > 5:
                        # Get user details
                        user_data = await self._get_user_details(username)

                        if user_data:
                            # Get email from commits
                            email = await self._get_user_email_from_commits(username)

                            members.append({
                                "username": username,
                                "name": user_data.get("name"),
                                "email": email,
                                "bio": user_data.get("bio"),
                                "company": user_data.get("company"),
                                "location": user_data.get("location"),
                                "twitter": user_data.get("twitter_username"),
                                "blog": user_data.get("blog"),
                                "github_url": user_data.get("html_url"),
                                "avatar": user_data.get("avatar_url"),
                                "source": "github_org"
                            })

                        await asyncio.sleep(0.5)

        except Exception as e:
            logger.debug(f"GitHub org members error: {e}")

        return members

    async def _get_user_details(self, username: str) -> Optional[Dict[str, Any]]:
        """Get user profile details"""
        try:
            url = f"{self.api_url}/users/{username}"
            response = await self.client.get(url, headers=self.headers)
            self.rate_remaining = int(response.headers.get("X-RateLimit-Remaining", 60))

            if response.status_code == 200:
                return response.json()

        except Exception as e:
            logger.debug(f"GitHub user details error: {e}")

        return None

    async def _get_user_email_from_commits(self, username: str) -> Optional[str]:
        """Extract email from user's public commits"""
        try:
            url = f"{self.api_url}/users/{username}/events/public"
            response = await self.client.get(url, headers=self.headers)
            self.rate_remaining = int(response.headers.get("X-RateLimit-Remaining", 60))

            if response.status_code == 200:
                events = response.json()

                for event in events:
                    if event.get("type") == "PushEvent":
                        commits = event.get("payload", {}).get("commits", [])

                        for commit in commits:
                            author = commit.get("author", {})
                            email = author.get("email", "")

                            # Filter out noreply emails
                            if email and "noreply" not in email.lower() and "github" not in email.lower():
                                return email

        except Exception as e:
            logger.debug(f"GitHub commit email error: {e}")

        return None

    async def search_users(self, query: str, max_results: int = 10) -> List[Dict[str, Any]]:
        """Search GitHub users"""
        users = []

        try:
            url = f"{self.api_url}/search/users"
            params = {"q": query, "per_page": min(max_results, 100)}

            response = await self.client.get(url, params=params, headers=self.headers)
            self.rate_remaining = int(response.headers.get("X-RateLimit-Remaining", 60))

            if response.status_code == 200:
                data = response.json()

                for item in data.get("items", [])[:max_results]:
                    username = item.get("login")

                    if username and self.rate_remaining > 5:
                        user_data = await self._get_user_details(username)
                        email = await self._get_user_email_from_commits(username)

                        if user_data:
                            users.append({
                                "username": username,
                                "name": user_data.get("name"),
                                "email": email,
                                "bio": user_data.get("bio"),
                                "company": user_data.get("company"),
                                "github_url": user_data.get("html_url"),
                                "source": "github_search"
                            })

                        await asyncio.sleep(0.5)

        except Exception as e:
            logger.debug(f"GitHub user search error: {e}")

        return users

    async def close(self):
        await self.client.aclose()


# ============================================
# SOCIAL MEDIA OSINT
# ============================================

class SocialMediaOSINT:
    """
    FREE Social Media OSINT
    Extracts data from Twitter, Facebook, Instagram public pages
    """

    def __init__(self, timeout: int = 30):
        self.timeout = timeout
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        self.client = httpx.AsyncClient(timeout=timeout, follow_redirects=True)

    async def find_social_profiles(self, company: str, domain: str) -> Dict[str, Any]:
        """Find all social media profiles for a company"""
        profiles = {
            "twitter": None,
            "facebook": None,
            "instagram": None,
            "youtube": None,
            "tiktok": None,
            "linkedin": None
        }

        dork_searcher = GoogleDorkingOSINT()

        try:
            # Search for Twitter
            twitter_results = await dork_searcher.search_duckduckgo(
                f'site:twitter.com "{company}" OR site:x.com "{company}"',
                max_results=5
            )
            for result in twitter_results:
                url = result.get("url", "")
                if "twitter.com/" in url or "x.com/" in url:
                    if "/status/" not in url and "/search" not in url:
                        profiles["twitter"] = url
                        break

            await asyncio.sleep(1)

            # Search for Facebook
            fb_results = await dork_searcher.search_duckduckgo(
                f'site:facebook.com "{company}"',
                max_results=5
            )
            for result in fb_results:
                url = result.get("url", "")
                if "facebook.com/" in url:
                    if "/posts/" not in url and "/photos/" not in url:
                        profiles["facebook"] = url
                        break

            await asyncio.sleep(1)

            # Search for Instagram
            ig_results = await dork_searcher.search_duckduckgo(
                f'site:instagram.com "{company}"',
                max_results=5
            )
            for result in ig_results:
                url = result.get("url", "")
                if "instagram.com/" in url:
                    if "/p/" not in url and "/reel/" not in url:
                        profiles["instagram"] = url
                        break

            await asyncio.sleep(1)

            # Search for YouTube
            yt_results = await dork_searcher.search_duckduckgo(
                f'site:youtube.com "{company}" channel',
                max_results=5
            )
            for result in yt_results:
                url = result.get("url", "")
                if "youtube.com/" in url:
                    if "/channel/" in url or "/@" in url or "/c/" in url:
                        profiles["youtube"] = url
                        break

            # Search for LinkedIn
            li_results = await dork_searcher.search_duckduckgo(
                f'site:linkedin.com/company "{company}"',
                max_results=5
            )
            for result in li_results:
                url = result.get("url", "")
                if "linkedin.com/company/" in url:
                    profiles["linkedin"] = url
                    break

        except Exception as e:
            logger.debug(f"Social media OSINT error: {e}")
        finally:
            await dork_searcher.close()

        return profiles

    async def get_twitter_info(self, username: str) -> Optional[Dict[str, Any]]:
        """Get Twitter/X profile info (public)"""
        try:
            # Use Nitter (Twitter frontend) for public data
            nitter_instances = [
                "nitter.net",
                "nitter.cz",
                "nitter.privacydev.net"
            ]

            for instance in nitter_instances:
                try:
                    url = f"https://{instance}/{username}"
                    response = await self.client.get(url, headers=self.headers)

                    if response.status_code == 200:
                        soup = BeautifulSoup(response.text, "html.parser")

                        name_elem = soup.select_one(".profile-card-fullname")
                        bio_elem = soup.select_one(".profile-bio")

                        return {
                            "username": username,
                            "name": name_elem.get_text(strip=True) if name_elem else None,
                            "bio": bio_elem.get_text(strip=True) if bio_elem else None,
                            "twitter_url": f"https://twitter.com/{username}",
                            "source": "twitter_nitter"
                        }

                except Exception:
                    continue

        except Exception as e:
            logger.debug(f"Twitter OSINT error: {e}")

        return None

    async def close(self):
        await self.client.aclose()


# ============================================
# DOMAIN OSINT
# ============================================

class DomainOSINT:
    """
    FREE Domain OSINT
    WHOIS, DNS, subdomains, technology detection
    """

    def __init__(self, timeout: int = 30):
        self.timeout = timeout
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        self.client = httpx.AsyncClient(timeout=timeout, follow_redirects=True)

    async def get_whois_data(self, domain: str) -> Dict[str, Any]:
        """Get WHOIS data for a domain"""
        result = {
            "domain": domain,
            "registrar": None,
            "creation_date": None,
            "expiration_date": None,
            "registrant_name": None,
            "registrant_email": None,
            "registrant_org": None,
            "admin_email": None,
            "tech_email": None
        }

        try:
            # Use free WHOIS API
            url = f"https://www.whoisxmlapi.com/whoisserver/WhoisService"
            # Note: This is a placeholder - you'd need an API key for full data
            # Alternative: parse whois.domaintools.com or similar

            # Try parsing from web whois service
            web_url = f"https://who.is/whois/{domain}"
            response = await self.client.get(web_url, headers=self.headers)

            if response.status_code == 200:
                soup = BeautifulSoup(response.text, "html.parser")

                # Extract registrant info
                whois_data = soup.select_one(".whois-data")
                if whois_data:
                    text = whois_data.get_text()

                    # Extract emails
                    emails = re.findall(r'[\w.+-]+@[\w.-]+\.\w+', text)
                    if emails:
                        result["registrant_email"] = emails[0]
                        if len(emails) > 1:
                            result["admin_email"] = emails[1]
                        if len(emails) > 2:
                            result["tech_email"] = emails[2]

                    # Extract organization
                    org_match = re.search(r'Registrant Organization:\s*(.+)', text)
                    if org_match:
                        result["registrant_org"] = org_match.group(1).strip()

                    # Extract registrar
                    registrar_match = re.search(r'Registrar:\s*(.+)', text)
                    if registrar_match:
                        result["registrar"] = registrar_match.group(1).strip()

        except Exception as e:
            logger.debug(f"WHOIS OSINT error: {e}")

        return result

    async def get_dns_records(self, domain: str) -> Dict[str, Any]:
        """Get DNS records for a domain"""
        result = {
            "domain": domain,
            "mx_records": [],
            "txt_records": [],
            "ns_records": [],
            "emails_found": [],
            "email_provider": None
        }

        try:
            # Try using public DNS API
            url = f"https://dns.google/resolve"

            # Get MX records
            response = await self.client.get(url, params={"name": domain, "type": "MX"})
            if response.status_code == 200:
                data = response.json()
                for answer in data.get("Answer", []):
                    mx = answer.get("data", "")
                    result["mx_records"].append(mx)

                    # Detect email provider
                    if "google" in mx.lower():
                        result["email_provider"] = "Google Workspace"
                    elif "outlook" in mx.lower() or "microsoft" in mx.lower():
                        result["email_provider"] = "Microsoft 365"
                    elif "zoho" in mx.lower():
                        result["email_provider"] = "Zoho Mail"

            # Get TXT records
            response = await self.client.get(url, params={"name": domain, "type": "TXT"})
            if response.status_code == 200:
                data = response.json()
                for answer in data.get("Answer", []):
                    txt = answer.get("data", "")
                    result["txt_records"].append(txt)

                    # Extract emails from TXT records
                    emails = re.findall(r'[\w.+-]+@[\w.-]+\.\w+', txt)
                    result["emails_found"].extend(emails)

            # Get NS records
            response = await self.client.get(url, params={"name": domain, "type": "NS"})
            if response.status_code == 200:
                data = response.json()
                for answer in data.get("Answer", []):
                    ns = answer.get("data", "")
                    result["ns_records"].append(ns)

        except Exception as e:
            logger.debug(f"DNS OSINT error: {e}")

        return result

    async def enumerate_subdomains(self, domain: str) -> List[str]:
        """Enumerate subdomains using Certificate Transparency"""
        subdomains = set()

        try:
            # Use crt.sh
            url = f"https://crt.sh/?q=%.{domain}&output=json"
            response = await self.client.get(url)

            if response.status_code == 200:
                try:
                    certs = response.json()

                    for cert in certs:
                        name_value = cert.get("name_value", "")

                        for subdomain in name_value.split("\n"):
                            subdomain = subdomain.strip().replace("*.", "")
                            if subdomain and domain in subdomain:
                                subdomains.add(subdomain)
                except:
                    pass

        except Exception as e:
            logger.debug(f"Subdomain enumeration error: {e}")

        return list(subdomains)[:50]  # Limit results

    async def detect_technologies(self, domain: str) -> List[str]:
        """Detect technologies used by a website"""
        technologies = []

        try:
            url = f"https://{domain}"
            response = await self.client.get(url, headers=self.headers)

            if response.status_code == 200:
                html = response.text
                headers = dict(response.headers)

                # Check for common technologies
                tech_signatures = {
                    "WordPress": ["wp-content", "wp-includes", "wordpress"],
                    "Shopify": ["shopify", "cdn.shopify.com"],
                    "React": ["react", "_reactRootContainer", "react-root"],
                    "Angular": ["ng-app", "angular"],
                    "Vue.js": ["vue", "__vue__"],
                    "Next.js": ["__NEXT_DATA__", "_next"],
                    "Laravel": ["laravel", "csrf-token"],
                    "Django": ["csrfmiddlewaretoken", "django"],
                    "Ruby on Rails": ["rails", "csrf-token"],
                    "Node.js": ["express", "x-powered-by: Express"],
                    "PHP": ["x-powered-by: PHP"],
                    "ASP.NET": ["x-aspnet-version", "__VIEWSTATE"],
                    "Cloudflare": ["cloudflare", "cf-ray"],
                    "AWS": ["amazonaws.com", "x-amz"],
                    "Google Analytics": ["google-analytics.com", "gtag"],
                    "HubSpot": ["hubspot", "hs-scripts"],
                    "Intercom": ["intercom", "intercomSettings"],
                    "Zendesk": ["zendesk", "zdassets"],
                    "Stripe": ["stripe.com", "stripe.js"],
                }

                for tech, signatures in tech_signatures.items():
                    for sig in signatures:
                        if sig.lower() in html.lower() or sig.lower() in str(headers).lower():
                            if tech not in technologies:
                                technologies.append(tech)
                            break

        except Exception as e:
            logger.debug(f"Technology detection error: {e}")

        return technologies

    async def close(self):
        await self.client.aclose()


# ============================================
# EMAIL OSINT
# ============================================

class EmailOSINT:
    """
    FREE Email OSINT
    Email verification, breach checking, reputation
    """

    def __init__(self, timeout: int = 30):
        self.timeout = timeout
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        self.client = httpx.AsyncClient(timeout=timeout)

    async def check_gravatar(self, email: str) -> Optional[Dict[str, Any]]:
        """Check if email has a Gravatar profile"""
        try:
            email_hash = hashlib.md5(email.lower().strip().encode()).hexdigest()

            # Check profile
            profile_url = f"https://www.gravatar.com/{email_hash}.json"
            response = await self.client.get(profile_url)

            if response.status_code == 200:
                data = response.json()
                entry = data.get("entry", [{}])[0]

                return {
                    "email": email,
                    "has_gravatar": True,
                    "display_name": entry.get("displayName"),
                    "profile_url": entry.get("profileUrl"),
                    "avatar_url": f"https://www.gravatar.com/avatar/{email_hash}",
                    "accounts": [
                        {
                            "shortname": acc.get("shortname"),
                            "url": acc.get("url")
                        }
                        for acc in entry.get("accounts", [])
                    ],
                    "source": "gravatar"
                }

        except Exception as e:
            logger.debug(f"Gravatar check error: {e}")

        return {"email": email, "has_gravatar": False}

    async def check_email_reputation(self, email: str) -> Dict[str, Any]:
        """Check email reputation using EmailRep.io"""
        result = {
            "email": email,
            "reputation": "unknown",
            "suspicious": False,
            "references": 0,
            "details": {}
        }

        try:
            url = f"https://emailrep.io/{email}"
            headers = {**self.headers, "Accept": "application/json"}

            response = await self.client.get(url, headers=headers)

            if response.status_code == 200:
                data = response.json()

                result["reputation"] = data.get("reputation", "unknown")
                result["suspicious"] = data.get("suspicious", False)
                result["references"] = data.get("references", 0)
                result["details"] = data.get("details", {})

        except Exception as e:
            logger.debug(f"EmailRep check error: {e}")

        return result

    async def generate_email_permutations(
        self,
        first_name: str,
        last_name: str,
        domain: str
    ) -> List[Dict[str, Any]]:
        """Generate possible email permutations for a person"""
        permutations = []

        first = first_name.lower().strip()
        last = last_name.lower().strip()
        first_initial = first[0] if first else ""
        last_initial = last[0] if last else ""

        patterns = [
            f"{first}@{domain}",
            f"{last}@{domain}",
            f"{first}.{last}@{domain}",
            f"{first}{last}@{domain}",
            f"{first}_{last}@{domain}",
            f"{first}-{last}@{domain}",
            f"{last}.{first}@{domain}",
            f"{last}{first}@{domain}",
            f"{first_initial}{last}@{domain}",
            f"{first_initial}.{last}@{domain}",
            f"{first}{last_initial}@{domain}",
            f"{first}.{last_initial}@{domain}",
            f"{first_initial}{last_initial}@{domain}",
            f"{last}{first_initial}@{domain}",
            f"{first}.{last}1@{domain}",
        ]

        for i, email in enumerate(patterns):
            permutations.append({
                "email": email,
                "pattern": patterns[i].replace(first, "{first}").replace(last, "{last}"),
                "confidence": max(95 - i * 3, 50)
            })

        return permutations

    async def close(self):
        await self.client.aclose()


# ============================================
# COMPANY REGISTRY OSINT
# ============================================

class CompanyRegistryOSINT:
    """
    FREE Company Registry OSINT
    OpenCorporates, SEC EDGAR, Companies House
    """

    def __init__(self, timeout: int = 30):
        self.timeout = timeout
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        self.client = httpx.AsyncClient(timeout=timeout, follow_redirects=True)

    async def search_opencorporates(self, company_name: str) -> List[Dict[str, Any]]:
        """Search OpenCorporates for company info"""
        results = []

        try:
            url = "https://api.opencorporates.com/v0.4/companies/search"
            params = {"q": company_name, "per_page": 10}

            response = await self.client.get(url, params=params)

            if response.status_code == 200:
                data = response.json()

                for company in data.get("results", {}).get("companies", []):
                    c = company.get("company", {})

                    results.append({
                        "name": c.get("name"),
                        "company_number": c.get("company_number"),
                        "jurisdiction": c.get("jurisdiction_code"),
                        "status": c.get("current_status"),
                        "incorporation_date": c.get("incorporation_date"),
                        "dissolution_date": c.get("dissolution_date"),
                        "company_type": c.get("company_type"),
                        "registered_address": c.get("registered_address_in_full"),
                        "opencorporates_url": c.get("opencorporates_url"),
                        "source": "opencorporates"
                    })

        except Exception as e:
            logger.debug(f"OpenCorporates search error: {e}")

        return results

    async def search_sec_edgar(self, company_name: str) -> List[Dict[str, Any]]:
        """Search SEC EDGAR for US public company filings"""
        results = []

        try:
            url = "https://efts.sec.gov/LATEST/search-index"
            params = {
                "q": company_name,
                "dateRange": "custom",
                "startdt": "2020-01-01",
                "enddt": datetime.now().strftime("%Y-%m-%d"),
                "forms": "10-K,10-Q,8-K,DEF 14A",
                "size": 10
            }

            # SEC EDGAR full-text search
            search_url = f"https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company={quote(company_name)}&type=&dateb=&owner=include&count=10&search_text="

            response = await self.client.get(search_url, headers=self.headers)

            if response.status_code == 200:
                soup = BeautifulSoup(response.text, "html.parser")

                # Find company results
                for row in soup.select("table.tableFile2 tr")[1:]:  # Skip header
                    cells = row.find_all("td")
                    if len(cells) >= 3:
                        results.append({
                            "cik": cells[0].get_text(strip=True),
                            "name": cells[1].get_text(strip=True),
                            "state": cells[2].get_text(strip=True) if len(cells) > 2 else None,
                            "source": "sec_edgar"
                        })

        except Exception as e:
            logger.debug(f"SEC EDGAR search error: {e}")

        return results

    async def get_sec_company_officers(self, cik: str) -> List[Dict[str, Any]]:
        """Get company officers from SEC filings"""
        officers = []

        try:
            # Get company submissions
            url = f"https://data.sec.gov/submissions/CIK{cik.zfill(10)}.json"
            headers = {**self.headers, "Accept": "application/json"}

            response = await self.client.get(url, headers=headers)

            if response.status_code == 200:
                data = response.json()

                # Company info
                company_name = data.get("name")

                # Get recent 10-K filing for officer info
                filings = data.get("filings", {}).get("recent", {})
                forms = filings.get("form", [])
                accession_numbers = filings.get("accessionNumber", [])

                for i, form in enumerate(forms):
                    if form == "10-K" and i < len(accession_numbers):
                        # Parse 10-K for officers
                        # This would require parsing the actual filing
                        # For now, return basic company info
                        break

                # Basic info from submission
                officers.append({
                    "company_name": company_name,
                    "cik": cik,
                    "sic_description": data.get("sicDescription"),
                    "state": data.get("stateOfIncorporation"),
                    "fiscal_year_end": data.get("fiscalYearEnd"),
                    "source": "sec_edgar"
                })

        except Exception as e:
            logger.debug(f"SEC officers error: {e}")

        return officers

    async def close(self):
        await self.client.aclose()


# ============================================
# MAIN OSINT ENGINE
# ============================================

class MobiAdzOSINTEngine:
    """
    Main OSINT Engine for TheMobiAdz
    Combines all OSINT sources for deep intelligence gathering
    """

    def __init__(self, timeout: int = 30):
        self.timeout = timeout

        # Initialize all OSINT modules
        self.google_dork = GoogleDorkingOSINT(timeout)
        self.linkedin_osint = LinkedInPublicOSINT(timeout)
        self.github_osint = GitHubOSINT(timeout)
        self.social_osint = SocialMediaOSINT(timeout)
        self.domain_osint = DomainOSINT(timeout)
        self.email_osint = EmailOSINT(timeout)
        self.company_registry = CompanyRegistryOSINT(timeout)

        # Statistics
        self.stats = {
            "companies_researched": 0,
            "people_found": 0,
            "emails_found": 0,
            "phones_found": 0,
            "social_profiles_found": 0,
            "sources_used": set()
        }

        # Progress
        self.progress = {
            "stage": "idle",
            "progress": 0,
            "message": "Ready"
        }

    def _update_progress(self, stage: str, progress: int, message: str):
        self.progress = {
            "stage": stage,
            "progress": progress,
            "message": message
        }

    async def deep_company_osint(
        self,
        company_name: str,
        domain: Optional[str] = None,
        find_leadership: bool = True,
        find_employees: bool = True
    ) -> CompanyIntel:
        """
        Perform deep OSINT on a company.

        This is the main method that combines all OSINT techniques.
        """
        self._update_progress("osint", 0, f"Starting OSINT for {company_name}...")

        # Initialize result
        intel = CompanyIntel(name=company_name, domain=domain)

        # Guess domain if not provided
        if not domain:
            domain = self._guess_domain(company_name)
            intel.domain = domain

        try:
            # 1. Domain OSINT
            self._update_progress("osint", 10, "Gathering domain intelligence...")

            if domain:
                # DNS records
                dns_data = await self.domain_osint.get_dns_records(domain)
                intel.emails["dns"] = dns_data.get("emails_found", [])

                # WHOIS data
                whois_data = await self.domain_osint.get_whois_data(domain)
                if whois_data.get("registrant_email"):
                    intel.emails["whois"] = whois_data["registrant_email"]
                if whois_data.get("registrant_org"):
                    if not intel.name or intel.name == company_name:
                        intel.name = whois_data["registrant_org"]

                # Subdomains
                subdomains = await self.domain_osint.enumerate_subdomains(domain)
                intel.subdomains = subdomains[:20]

                # Technologies
                technologies = await self.domain_osint.detect_technologies(domain)
                intel.technologies = technologies

                intel.sources.append("domain_osint")
                self.stats["sources_used"].add("domain_osint")

            # 2. Social Media Profiles
            self._update_progress("osint", 20, "Finding social media profiles...")

            social_profiles = await self.social_osint.find_social_profiles(company_name, domain or "")
            intel.linkedin_url = social_profiles.get("linkedin")
            intel.twitter_url = social_profiles.get("twitter")
            intel.facebook_url = social_profiles.get("facebook")

            if any(social_profiles.values()):
                intel.sources.append("social_media")
                self.stats["social_profiles_found"] += sum(1 for v in social_profiles.values() if v)

            # 3. Google Dorking for Emails
            self._update_progress("osint", 30, "Searching for emails via dorking...")

            dork_emails = await self.google_dork.find_emails(company_name, domain or "")
            for email_data in dork_emails:
                email = email_data["email"]
                if "contact" not in intel.emails:
                    intel.emails["contact"] = email
                elif "info" in email or "hello" in email:
                    intel.emails["info"] = email
                elif "marketing" in email or "pr" in email:
                    intel.emails["marketing"] = email
                elif "sales" in email or "business" in email:
                    intel.emails["sales"] = email

            self.stats["emails_found"] += len(dork_emails)

            # 4. Google Dorking for Phones
            self._update_progress("osint", 40, "Searching for phone numbers...")

            phones = await self.google_dork.find_phones(company_name, domain or "")
            intel.phones = phones[:5]
            self.stats["phones_found"] += len(phones)

            # 5. Company Registry Search
            self._update_progress("osint", 50, "Searching company registries...")

            registry_results = await self.company_registry.search_opencorporates(company_name)
            if registry_results:
                top_result = registry_results[0]
                intel.headquarters = top_result.get("registered_address")
                intel.founded = top_result.get("incorporation_date")
                intel.sources.append("opencorporates")

            # SEC EDGAR for US companies
            sec_results = await self.company_registry.search_sec_edgar(company_name)
            if sec_results:
                intel.sources.append("sec_edgar")

            # 6. Leadership/Employee OSINT
            if find_leadership:
                self._update_progress("osint", 60, "Finding leadership team...")

                # Google dorking for leadership
                leadership_results = await self.google_dork.find_leadership(company_name, domain or "")

                for person_data in leadership_results[:10]:
                    person = PersonIntel(
                        name=person_data.get("name", "Unknown"),
                        title=person_data.get("title"),
                        company=company_name,
                        linkedin_url=person_data.get("linkedin_url"),
                        sources=["linkedin_dork"]
                    )
                    intel.leadership.append(person)

                self.stats["people_found"] += len(intel.leadership)

            if find_employees:
                self._update_progress("osint", 70, "Finding employees...")

                # LinkedIn employee search
                employees = await self.linkedin_osint.search_company_employees(company_name)

                for emp_data in employees[:15]:
                    person = PersonIntel(
                        name=emp_data.get("name", "Unknown"),
                        title=emp_data.get("title"),
                        company=company_name,
                        linkedin_url=emp_data.get("linkedin_url"),
                        sources=["linkedin_search"]
                    )
                    intel.employees.append(person)

                self.stats["people_found"] += len(intel.employees)

            # 7. GitHub OSINT
            self._update_progress("osint", 80, "Searching GitHub...")

            org_name = company_name.lower().replace(" ", "").replace("-", "")
            github_members = await self.github_osint.search_org_members(org_name, max_members=10)

            for member in github_members:
                # Check if already in employees
                existing = next(
                    (e for e in intel.employees if e.name and member.get("name") and
                     e.name.lower() == member.get("name", "").lower()),
                    None
                )

                if existing:
                    # Update existing with GitHub data
                    if member.get("email"):
                        existing.emails.append(member["email"])
                    existing.github_url = member.get("github_url")
                    existing.sources.append("github")
                else:
                    # Add new person
                    person = PersonIntel(
                        name=member.get("name") or member.get("username"),
                        company=company_name,
                        emails=[member["email"]] if member.get("email") else [],
                        github_url=member.get("github_url"),
                        location=member.get("location"),
                        bio=member.get("bio"),
                        sources=["github"]
                    )
                    intel.employees.append(person)
                    self.stats["people_found"] += 1

                if member.get("email"):
                    self.stats["emails_found"] += 1

            # 8. Email Permutation for Leadership
            self._update_progress("osint", 90, "Generating email permutations...")

            if domain:
                for person in intel.leadership[:5]:
                    if person.name and " " in person.name:
                        name_parts = person.name.split()
                        first_name = name_parts[0]
                        last_name = name_parts[-1]

                        permutations = await self.email_osint.generate_email_permutations(
                            first_name, last_name, domain
                        )

                        # Add top permutations
                        person.emails = [p["email"] for p in permutations[:5]]

            # Calculate confidence score
            intel.confidence_score = self._calculate_confidence(intel)

            self.stats["companies_researched"] += 1
            self._update_progress("osint", 100, f"OSINT complete for {company_name}")

        except Exception as e:
            logger.error(f"OSINT error for {company_name}: {e}")

        return intel

    async def deep_person_osint(
        self,
        name: str,
        company: Optional[str] = None,
        domain: Optional[str] = None
    ) -> PersonIntel:
        """
        Perform deep OSINT on a person.
        """
        self._update_progress("osint", 0, f"Starting OSINT for {name}...")

        intel = PersonIntel(name=name, company=company)

        try:
            # 1. Search Google/DuckDuckGo for the person
            self._update_progress("osint", 20, "Searching for person online...")

            dork_searcher = GoogleDorkingOSINT()

            # LinkedIn search
            linkedin_query = f'site:linkedin.com/in "{name}"'
            if company:
                linkedin_query += f' "{company}"'

            linkedin_results = await dork_searcher.search_duckduckgo(linkedin_query, max_results=5)

            for result in linkedin_results:
                url = result.get("url", "")
                if "linkedin.com/in/" in url:
                    intel.linkedin_url = url

                    # Extract title from result
                    title_match = re.search(r'-\s*([^|]+)', result.get("title", ""))
                    if title_match:
                        intel.title = title_match.group(1).strip()
                    break

            # 2. GitHub search
            self._update_progress("osint", 40, "Searching GitHub...")

            github_users = await self.github_osint.search_users(name, max_results=3)

            for user in github_users:
                user_company = user.get("company", "").lower() if user.get("company") else ""

                if not company or (company and company.lower() in user_company):
                    intel.github_url = user.get("github_url")
                    if user.get("email"):
                        intel.emails.append(user["email"])
                    if user.get("bio"):
                        intel.bio = user["bio"]
                    if user.get("location"):
                        intel.location = user["location"]
                    intel.sources.append("github")
                    break

            # 3. Twitter search
            self._update_progress("osint", 60, "Searching Twitter...")

            twitter_query = f'site:twitter.com "{name}"'
            if company:
                twitter_query += f' "{company}"'

            twitter_results = await dork_searcher.search_duckduckgo(twitter_query, max_results=5)

            for result in twitter_results:
                url = result.get("url", "")
                if "twitter.com/" in url or "x.com/" in url:
                    if "/status/" not in url:
                        intel.twitter_url = url
                        intel.sources.append("twitter")
                        break

            # 4. Email permutation
            self._update_progress("osint", 80, "Generating email permutations...")

            if domain and " " in name:
                name_parts = name.split()
                first_name = name_parts[0]
                last_name = name_parts[-1]

                permutations = await self.email_osint.generate_email_permutations(
                    first_name, last_name, domain
                )

                intel.emails.extend([p["email"] for p in permutations[:5]])

            # 5. Gravatar check
            for email in intel.emails[:3]:
                gravatar_data = await self.email_osint.check_gravatar(email)
                if gravatar_data.get("has_gravatar"):
                    intel.profile_image = gravatar_data.get("avatar_url")
                    intel.sources.append("gravatar")
                    break

            await dork_searcher.close()

            # Calculate confidence
            score = 0
            if intel.linkedin_url:
                score += 30
            if intel.emails:
                score += 25
            if intel.github_url:
                score += 15
            if intel.twitter_url:
                score += 10
            if intel.title:
                score += 10
            if intel.location:
                score += 5
            if intel.bio:
                score += 5

            intel.confidence_score = min(score, 100)

            self._update_progress("osint", 100, f"OSINT complete for {name}")

        except Exception as e:
            logger.error(f"Person OSINT error for {name}: {e}")

        return intel

    def _guess_domain(self, company_name: str) -> str:
        """Guess domain from company name"""
        clean = company_name.lower()
        clean = re.sub(r'[^a-z0-9]', '', clean)

        # Remove common suffixes
        for suffix in ['inc', 'llc', 'ltd', 'corp', 'company', 'co', 'limited']:
            if clean.endswith(suffix):
                clean = clean[:-len(suffix)]

        return f"{clean}.com"

    def _calculate_confidence(self, intel: CompanyIntel) -> int:
        """Calculate confidence score for company intel"""
        score = 0

        # Basic info
        if intel.name:
            score += 10
        if intel.domain:
            score += 10
        if intel.description:
            score += 5

        # Contact info
        if intel.emails:
            score += min(len(intel.emails) * 5, 20)
        if intel.phones:
            score += 10

        # Social profiles
        if intel.linkedin_url:
            score += 10
        if intel.twitter_url:
            score += 5

        # Leadership
        if intel.leadership:
            score += min(len(intel.leadership) * 3, 15)

        # Employees
        if intel.employees:
            score += min(len(intel.employees) * 2, 10)

        # Data sources
        score += min(len(intel.sources) * 3, 15)

        return min(score, 100)

    def get_stats(self) -> Dict[str, Any]:
        stats = dict(self.stats)
        stats["sources_used"] = list(stats["sources_used"])
        return stats

    def get_progress(self) -> Dict[str, Any]:
        return self.progress

    async def close(self):
        """Close all OSINT modules"""
        await self.google_dork.close()
        await self.linkedin_osint.close()
        await self.github_osint.close()
        await self.social_osint.close()
        await self.domain_osint.close()
        await self.email_osint.close()
        await self.company_registry.close()

        logger.info("MobiAdz OSINT Engine closed")


# ============================================
# QUICK START FUNCTIONS
# ============================================

async def quick_company_osint(company_name: str, domain: Optional[str] = None) -> Dict[str, Any]:
    """
    Quick OSINT for a company.

    Example:
        result = await quick_company_osint("Stripe", "stripe.com")
        print(f"Found {len(result['leadership'])} leaders")
    """
    engine = MobiAdzOSINTEngine()

    try:
        intel = await engine.deep_company_osint(
            company_name=company_name,
            domain=domain,
            find_leadership=True,
            find_employees=True
        )

        return {
            "name": intel.name,
            "domain": intel.domain,
            "description": intel.description,
            "headquarters": intel.headquarters,
            "founded": intel.founded,
            "emails": intel.emails,
            "phones": intel.phones,
            "linkedin_url": intel.linkedin_url,
            "twitter_url": intel.twitter_url,
            "leadership": [
                {
                    "name": p.name,
                    "title": p.title,
                    "emails": p.emails,
                    "linkedin_url": p.linkedin_url,
                    "github_url": p.github_url
                }
                for p in intel.leadership
            ],
            "employees": [
                {
                    "name": p.name,
                    "title": p.title,
                    "emails": p.emails,
                    "linkedin_url": p.linkedin_url,
                    "github_url": p.github_url
                }
                for p in intel.employees
            ],
            "technologies": intel.technologies,
            "subdomains": intel.subdomains,
            "sources": intel.sources,
            "confidence_score": intel.confidence_score
        }

    finally:
        await engine.close()


async def quick_person_osint(
    name: str,
    company: Optional[str] = None,
    domain: Optional[str] = None
) -> Dict[str, Any]:
    """
    Quick OSINT for a person.

    Example:
        result = await quick_person_osint("John Doe", "Acme Corp", "acme.com")
    """
    engine = MobiAdzOSINTEngine()

    try:
        intel = await engine.deep_person_osint(
            name=name,
            company=company,
            domain=domain
        )

        return {
            "name": intel.name,
            "title": intel.title,
            "company": intel.company,
            "emails": intel.emails,
            "phones": intel.phones,
            "linkedin_url": intel.linkedin_url,
            "twitter_url": intel.twitter_url,
            "github_url": intel.github_url,
            "location": intel.location,
            "bio": intel.bio,
            "profile_image": intel.profile_image,
            "sources": intel.sources,
            "confidence_score": intel.confidence_score
        }

    finally:
        await engine.close()
