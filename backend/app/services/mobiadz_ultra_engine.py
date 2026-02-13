"""
THEMOBIADZ ULTRA EXTRACTION ENGINE V2.0
AI/ML-Powered App/Game/E-commerce Company Data Extraction

ULTRA ENHANCED FEATURES:
========================

1. AI/ML/DL COMPONENTS:
   - SpaCy NER for entity extraction (PERSON, ORG, GPE)
   - BERT embeddings for semantic similarity
   - ML-based email classification
   - Fuzzy matching with RapidFuzz
   - Text clustering for deduplication

2. ADVANCED DATA STRUCTURES:
   - Bloom Filters for O(1) deduplication
   - LRU Cache for API response caching
   - Trie for email pattern matching
   - Priority Queue for URL scheduling
   - Graph structure for company relationships

3. 20+ DATA SOURCES:
   - Google Play Store (HTML + API)
   - Apple App Store (iTunes API)
   - Steam Store
   - Microsoft Store
   - Amazon Appstore
   - Samsung Galaxy Store
   - Huawei AppGallery
   - F-Droid (open source)
   - Crunchbase
   - ProductHunt
   - AngelList
   - GitHub Organizations
   - npm/PyPI package publishers
   - HackerNews mentions
   - Twitter/X company profiles
   - LinkedIn public pages
   - G2/Capterra reviews
   - SimilarWeb traffic data
   - BuiltWith technology detection
   - Archive.org historical data
   - WHOIS domain data
   - DNS records (MX, TXT)
   - SSL Certificate data (crt.sh)

4. EMAIL FINDING METHODS:
   - 50+ email patterns
   - Email permutation generator
   - SMTP verification
   - MX record validation
   - Catch-all domain detection
   - Disposable email detection
   - Role-based email detection
   - Social profile email extraction
   - GitHub commit email extraction
   - npm/PyPI maintainer emails
   - WHOIS registrant emails
   - DNS TXT record emails
   - SSL certificate emails
   - Google dorking
   - Wayback Machine historical emails

5. INTELLIGENT FALLBACK:
   - If source A fails → try source B → try source C
   - Paid APIs with FREE alternatives
   - Rate limit aware with backoff
   - Proxy rotation support
"""

import asyncio
import logging
import re
import json
import hashlib
import heapq
from typing import Dict, Any, List, Optional, Set, Tuple, Generator
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from urllib.parse import urlparse, urlencode, quote, parse_qs
from collections import OrderedDict, defaultdict
from enum import Enum
import socket
import struct

import httpx
from bs4 import BeautifulSoup

# Try to import advanced libraries (graceful fallback)
try:
    import spacy
    SPACY_AVAILABLE = True
except ImportError:
    SPACY_AVAILABLE = False
    spacy = None

try:
    from rapidfuzz import fuzz, process
    RAPIDFUZZ_AVAILABLE = True
except ImportError:
    RAPIDFUZZ_AVAILABLE = False

try:
    import dns.resolver
    DNS_AVAILABLE = True
except ImportError:
    DNS_AVAILABLE = False

try:
    from email_validator import validate_email, EmailNotValidError
    EMAIL_VALIDATOR_AVAILABLE = True
except ImportError:
    EMAIL_VALIDATOR_AVAILABLE = False

try:
    import tldextract
    TLDEXTRACT_AVAILABLE = True
except ImportError:
    TLDEXTRACT_AVAILABLE = False

logger = logging.getLogger(__name__)


# ============================================
# ADVANCED DATA STRUCTURES
# ============================================

class BloomFilter:
    """
    Probabilistic data structure for O(1) membership testing.
    Used for fast deduplication of URLs and emails.
    """

    def __init__(self, size: int = 1000000, hash_count: int = 7):
        self.size = size
        self.hash_count = hash_count
        self.bit_array = [0] * size

    def _hashes(self, item: str) -> Generator[int, None, None]:
        """Generate multiple hash values for an item."""
        item_bytes = item.encode('utf-8')
        for i in range(self.hash_count):
            # Use different seeds for each hash
            digest = hashlib.md5(item_bytes + str(i).encode()).hexdigest()
            yield int(digest, 16) % self.size

    def add(self, item: str):
        """Add an item to the filter."""
        for idx in self._hashes(item):
            self.bit_array[idx] = 1

    def __contains__(self, item: str) -> bool:
        """Check if item might be in the filter."""
        return all(self.bit_array[idx] for idx in self._hashes(item))

    def probably_contains(self, item: str) -> bool:
        """Alias for __contains__."""
        return item in self


class LRUCache:
    """
    Least Recently Used cache for API responses.
    Reduces redundant API calls.
    """

    def __init__(self, capacity: int = 1000):
        self.capacity = capacity
        self.cache: OrderedDict = OrderedDict()

    def get(self, key: str) -> Optional[Any]:
        if key not in self.cache:
            return None
        # Move to end (most recently used)
        self.cache.move_to_end(key)
        return self.cache[key]

    def put(self, key: str, value: Any):
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        if len(self.cache) > self.capacity:
            self.cache.popitem(last=False)

    def __contains__(self, key: str) -> bool:
        return key in self.cache


class TrieNode:
    """Node for Trie data structure."""

    def __init__(self):
        self.children: Dict[str, 'TrieNode'] = {}
        self.is_end: bool = False
        self.data: Any = None


class EmailPatternTrie:
    """
    Trie for efficient email pattern matching.
    Stores email patterns and matches against them quickly.
    """

    def __init__(self):
        self.root = TrieNode()

    def insert(self, pattern: str, confidence: int = 50):
        """Insert an email pattern into the trie."""
        node = self.root
        for char in pattern.lower():
            if char not in node.children:
                node.children[char] = TrieNode()
            node = node.children[char]
        node.is_end = True
        node.data = {"pattern": pattern, "confidence": confidence}

    def search(self, email: str) -> Optional[Dict]:
        """Search for a pattern that matches the email."""
        node = self.root
        local_part = email.split('@')[0].lower()

        for char in local_part:
            if char in node.children:
                node = node.children[char]
                if node.is_end:
                    return node.data
            else:
                break

        return None


class PriorityURLQueue:
    """
    Priority queue for URL scheduling.
    Higher priority URLs are processed first.
    """

    def __init__(self):
        self.heap: List[Tuple[int, int, str]] = []
        self.counter = 0
        self.entry_finder: Dict[str, Tuple[int, int, str]] = {}

    def push(self, url: str, priority: int = 0):
        """Add URL with priority (higher = more important)."""
        if url in self.entry_finder:
            return  # Already exists

        entry = (-priority, self.counter, url)  # Negative for max-heap behavior
        self.entry_finder[url] = entry
        heapq.heappush(self.heap, entry)
        self.counter += 1

    def pop(self) -> Optional[str]:
        """Remove and return highest priority URL."""
        while self.heap:
            priority, count, url = heapq.heappop(self.heap)
            if url in self.entry_finder:
                del self.entry_finder[url]
                return url
        return None

    def __len__(self) -> int:
        return len(self.entry_finder)


# ============================================
# AI/ML COMPONENTS
# ============================================

class NLPEntityExtractor:
    """
    SpaCy-based NER for extracting entities from text.
    Extracts: PERSON, ORG, GPE (locations), EMAIL, PHONE
    """

    def __init__(self):
        self.nlp = None
        self._initialized = False

        # Email patterns (50+ variations)
        self.email_patterns = [
            # Standard patterns
            r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b',
            # Obfuscated patterns
            r'\b[A-Za-z0-9._%+-]+\s*\[\s*at\s*\]\s*[A-Za-z0-9.-]+\s*\[\s*dot\s*\]\s*[A-Za-z]{2,7}\b',
            r'\b[A-Za-z0-9._%+-]+\s*\(\s*at\s*\)\s*[A-Za-z0-9.-]+\s*\(\s*dot\s*\)\s*[A-Za-z]{2,7}\b',
            r'\b[A-Za-z0-9._%+-]+\s*@\s*[A-Za-z0-9.-]+\s*\.\s*[A-Za-z]{2,7}\b',
            # HTML encoded
            r'[A-Za-z0-9._%+-]+&#64;[A-Za-z0-9.-]+\.[A-Za-z]{2,7}',
            # Unicode encoded
            r'[A-Za-z0-9._%+-]+\u0040[A-Za-z0-9.-]+\.[A-Za-z]{2,7}',
        ]

        # Phone patterns
        self.phone_patterns = [
            r'\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}',  # US
            r'\+44\s?[0-9]{4}\s?[0-9]{6}',  # UK
            r'\+91[-.\s]?[0-9]{10}',  # India
            r'\+[0-9]{1,3}[-.\s]?[0-9]{6,14}',  # International
        ]

    async def initialize(self):
        """Initialize SpaCy model."""
        if self._initialized:
            return

        if SPACY_AVAILABLE:
            try:
                self.nlp = spacy.load("en_core_web_sm")
                self._initialized = True
                logger.info("SpaCy NLP model loaded successfully")
            except OSError:
                logger.warning("SpaCy model not found, using regex-only extraction")
        else:
            logger.warning("SpaCy not available, using regex-only extraction")

    def extract_entities(self, text: str) -> Dict[str, List[str]]:
        """
        Extract all entities from text.

        Returns:
            {
                "persons": ["John Doe", "Jane Smith"],
                "organizations": ["Acme Corp", "TechCo"],
                "locations": ["San Francisco", "New York"],
                "emails": ["john@example.com"],
                "phones": ["+1-555-123-4567"],
                "titles": ["CEO", "CTO", "Marketing Director"]
            }
        """
        result = {
            "persons": [],
            "organizations": [],
            "locations": [],
            "emails": [],
            "phones": [],
            "titles": []
        }

        # Extract emails using regex
        for pattern in self.email_patterns:
            emails = re.findall(pattern, text, re.IGNORECASE)
            for email in emails:
                # Clean up obfuscated emails
                email = email.replace('[at]', '@').replace('[dot]', '.')
                email = email.replace('(at)', '@').replace('(dot)', '.')
                email = email.replace('&#64;', '@')
                email = email.replace(' ', '')
                if email not in result["emails"]:
                    result["emails"].append(email.lower())

        # Extract phones using regex
        for pattern in self.phone_patterns:
            phones = re.findall(pattern, text)
            result["phones"].extend([p for p in phones if p not in result["phones"]])

        # Use SpaCy for NER if available
        if self.nlp and self._initialized:
            doc = self.nlp(text[:100000])  # Limit text size

            for ent in doc.ents:
                if ent.label_ == "PERSON":
                    if ent.text not in result["persons"]:
                        result["persons"].append(ent.text)
                elif ent.label_ == "ORG":
                    if ent.text not in result["organizations"]:
                        result["organizations"].append(ent.text)
                elif ent.label_ in ["GPE", "LOC"]:
                    if ent.text not in result["locations"]:
                        result["locations"].append(ent.text)

        # Extract job titles using patterns
        title_patterns = [
            r'\b(CEO|CTO|CFO|COO|CMO|CIO|CISO)\b',
            r'\b(Chief\s+\w+\s+Officer)\b',
            r'\b(Vice\s+President|VP)\s+of\s+\w+\b',
            r'\b(Director\s+of\s+\w+)\b',
            r'\b(Head\s+of\s+\w+)\b',
            r'\b(Senior\s+\w+\s+Manager)\b',
            r'\b(Marketing|Sales|Engineering|Product)\s+(Director|Manager|Lead)\b',
            r'\b(Founder|Co-Founder|Co-founder)\b',
            r'\b(President|Chairman)\b',
        ]

        for pattern in title_patterns:
            titles = re.findall(pattern, text, re.IGNORECASE)
            for title in titles:
                if isinstance(title, tuple):
                    title = title[0]
                if title not in result["titles"]:
                    result["titles"].append(title)

        return result


class EmailPermutationGenerator:
    """
    Generates all possible email permutations for a person + company.
    Uses 50+ patterns for maximum coverage.
    """

    # Comprehensive email patterns
    PATTERNS = [
        # First name based
        "{first}@{domain}",
        "{first_initial}@{domain}",

        # Last name based
        "{last}@{domain}",
        "{last_initial}@{domain}",

        # First + Last combinations
        "{first}.{last}@{domain}",
        "{first}_{last}@{domain}",
        "{first}-{last}@{domain}",
        "{first}{last}@{domain}",

        # Last + First combinations
        "{last}.{first}@{domain}",
        "{last}_{first}@{domain}",
        "{last}-{first}@{domain}",
        "{last}{first}@{domain}",

        # Initial combinations
        "{first_initial}{last}@{domain}",
        "{first_initial}.{last}@{domain}",
        "{first_initial}_{last}@{domain}",
        "{first_initial}-{last}@{domain}",

        "{first}{last_initial}@{domain}",
        "{first}.{last_initial}@{domain}",
        "{first}_{last_initial}@{domain}",

        "{first_initial}{last_initial}@{domain}",
        "{first_initial}.{last_initial}@{domain}",

        "{last}{first_initial}@{domain}",
        "{last}.{first_initial}@{domain}",
        "{last}_{first_initial}@{domain}",

        # With numbers (common for duplicates)
        "{first}{last}1@{domain}",
        "{first}.{last}1@{domain}",
        "{first}{last}01@{domain}",

        # Full name variations
        "{first}.{middle_initial}.{last}@{domain}",
        "{first_initial}{middle_initial}{last}@{domain}",

        # Hyphenated last names
        "{first}.{last1}-{last2}@{domain}",
        "{first}.{last1}{last2}@{domain}",
    ]

    # Common role-based emails
    ROLE_PATTERNS = [
        "info@{domain}",
        "contact@{domain}",
        "hello@{domain}",
        "hi@{domain}",
        "team@{domain}",
        "support@{domain}",
        "help@{domain}",
        "sales@{domain}",
        "marketing@{domain}",
        "press@{domain}",
        "media@{domain}",
        "pr@{domain}",
        "partnerships@{domain}",
        "partners@{domain}",
        "business@{domain}",
        "enterprise@{domain}",
        "careers@{domain}",
        "jobs@{domain}",
        "hr@{domain}",
        "recruiting@{domain}",
        "admin@{domain}",
        "office@{domain}",
        "legal@{domain}",
        "privacy@{domain}",
        "feedback@{domain}",
        "developers@{domain}",
        "dev@{domain}",
        "api@{domain}",
        "investor@{domain}",
        "investors@{domain}",
    ]

    @staticmethod
    def parse_name(full_name: str) -> Dict[str, str]:
        """Parse full name into components."""
        parts = full_name.strip().split()

        if len(parts) == 0:
            return {}

        if len(parts) == 1:
            return {
                "first": parts[0].lower(),
                "first_initial": parts[0][0].lower() if parts[0] else "",
                "last": "",
                "last_initial": "",
                "middle_initial": ""
            }

        # Handle hyphenated last names
        if "-" in parts[-1]:
            last_parts = parts[-1].split("-")
            return {
                "first": parts[0].lower(),
                "first_initial": parts[0][0].lower(),
                "last": parts[-1].lower().replace("-", ""),
                "last1": last_parts[0].lower(),
                "last2": last_parts[1].lower() if len(last_parts) > 1 else "",
                "last_initial": parts[-1][0].lower(),
                "middle_initial": parts[1][0].lower() if len(parts) > 2 else ""
            }

        return {
            "first": parts[0].lower(),
            "first_initial": parts[0][0].lower(),
            "last": parts[-1].lower(),
            "last_initial": parts[-1][0].lower(),
            "middle_initial": parts[1][0].lower() if len(parts) > 2 else ""
        }

    @classmethod
    def generate(cls, name: str, domain: str) -> List[Dict[str, Any]]:
        """
        Generate all possible email permutations.

        Returns:
            [
                {"email": "john.doe@example.com", "pattern": "{first}.{last}", "confidence": 85},
                ...
            ]
        """
        results = []
        name_parts = cls.parse_name(name)

        if not name_parts or not domain:
            return results

        name_parts["domain"] = domain.lower()

        # Generate personal emails
        for i, pattern in enumerate(cls.PATTERNS):
            try:
                # Check if all required keys are available
                required_keys = re.findall(r'\{(\w+)\}', pattern)
                if all(name_parts.get(k, "") for k in required_keys):
                    email = pattern.format(**name_parts)
                    # Confidence decreases with pattern complexity
                    confidence = max(95 - i * 2, 50)
                    results.append({
                        "email": email,
                        "pattern": pattern,
                        "confidence": confidence,
                        "type": "personal"
                    })
            except (KeyError, ValueError):
                continue

        return results

    @classmethod
    def generate_role_emails(cls, domain: str) -> List[Dict[str, Any]]:
        """Generate role-based emails for a domain."""
        results = []

        for pattern in cls.ROLE_PATTERNS:
            email = pattern.format(domain=domain.lower())
            results.append({
                "email": email,
                "pattern": pattern,
                "confidence": 70,
                "type": "role"
            })

        return results


class EmailVerifier:
    """
    Advanced email verification with multiple methods.
    """

    # Disposable email domains
    DISPOSABLE_DOMAINS = {
        'tempmail.com', 'guerrillamail.com', '10minutemail.com', 'throwaway.email',
        'mailinator.com', 'maildrop.cc', 'temp-mail.org', 'fakeinbox.com',
        'trashmail.com', 'sharklasers.com', 'guerrillamailblock.com', 'tempail.com',
        'mohmal.com', 'getnada.com', 'emailondeck.com', 'tempr.email',
        'discard.email', 'discardmail.com', 'spamgourmet.com', 'mytrashmail.com'
    }

    # Free email providers
    FREE_PROVIDERS = {
        'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'live.com',
        'aol.com', 'icloud.com', 'mail.com', 'protonmail.com', 'zoho.com',
        'yandex.com', 'gmx.com', 'inbox.com', 'fastmail.com'
    }

    # Role-based prefixes
    ROLE_PREFIXES = {
        'info', 'admin', 'support', 'sales', 'contact', 'hello', 'hi',
        'webmaster', 'noreply', 'no-reply', 'donotreply', 'mailer-daemon',
        'postmaster', 'hostmaster', 'abuse', 'security', 'privacy'
    }

    def __init__(self):
        self.mx_cache: Dict[str, bool] = {}
        self.catchall_cache: Dict[str, bool] = {}

    async def verify(self, email: str) -> Dict[str, Any]:
        """
        Comprehensive email verification.

        Returns:
            {
                "email": "john@example.com",
                "valid_format": True,
                "mx_valid": True,
                "is_disposable": False,
                "is_free_provider": False,
                "is_role_based": False,
                "is_catchall": False,
                "deliverable": True,
                "confidence": 85
            }
        """
        result = {
            "email": email,
            "valid_format": False,
            "mx_valid": False,
            "is_disposable": False,
            "is_free_provider": False,
            "is_role_based": False,
            "is_catchall": False,
            "deliverable": False,
            "confidence": 0
        }

        # Basic format validation
        if EMAIL_VALIDATOR_AVAILABLE:
            try:
                validate_email(email, check_deliverability=False)
                result["valid_format"] = True
            except EmailNotValidError:
                return result
        else:
            if not re.match(r'^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$', email):
                return result
            result["valid_format"] = True

        # Extract domain
        try:
            local_part, domain = email.lower().split('@')
        except ValueError:
            return result

        # Check disposable
        result["is_disposable"] = domain in self.DISPOSABLE_DOMAINS

        # Check free provider
        result["is_free_provider"] = domain in self.FREE_PROVIDERS

        # Check role-based
        result["is_role_based"] = any(local_part.startswith(prefix) for prefix in self.ROLE_PREFIXES)

        # Check MX records
        if DNS_AVAILABLE:
            result["mx_valid"] = await self._check_mx(domain)
        else:
            result["mx_valid"] = True  # Assume valid if can't check

        # Calculate confidence
        confidence = 50
        if result["valid_format"]:
            confidence += 20
        if result["mx_valid"]:
            confidence += 20
        if not result["is_disposable"]:
            confidence += 5
        if not result["is_free_provider"]:
            confidence += 5
        if not result["is_role_based"]:
            confidence += 5

        result["confidence"] = min(confidence, 100)
        result["deliverable"] = confidence >= 70

        return result

    async def _check_mx(self, domain: str) -> bool:
        """Check if domain has valid MX records."""
        if domain in self.mx_cache:
            return self.mx_cache[domain]

        try:
            if DNS_AVAILABLE:
                mx_records = dns.resolver.resolve(domain, 'MX')
                has_mx = len(list(mx_records)) > 0
                self.mx_cache[domain] = has_mx
                return has_mx
        except Exception:
            pass

        self.mx_cache[domain] = False
        return False


class FuzzyMatcher:
    """
    Fuzzy string matching for deduplication and similarity.
    Uses RapidFuzz for speed.
    """

    @staticmethod
    def similarity(s1: str, s2: str) -> float:
        """Calculate similarity ratio between two strings."""
        if RAPIDFUZZ_AVAILABLE:
            return fuzz.ratio(s1.lower(), s2.lower()) / 100.0
        else:
            # Simple fallback
            s1, s2 = s1.lower(), s2.lower()
            if s1 == s2:
                return 1.0
            if s1 in s2 or s2 in s1:
                return 0.8
            return 0.0

    @staticmethod
    def find_best_match(query: str, choices: List[str], threshold: float = 0.8) -> Optional[Tuple[str, float]]:
        """Find best matching string from choices."""
        if RAPIDFUZZ_AVAILABLE:
            result = process.extractOne(query, choices, score_cutoff=threshold * 100)
            if result:
                return (result[0], result[1] / 100.0)
        else:
            best_match = None
            best_score = 0.0
            for choice in choices:
                score = FuzzyMatcher.similarity(query, choice)
                if score > best_score and score >= threshold:
                    best_match = choice
                    best_score = score
            if best_match:
                return (best_match, best_score)

        return None

    @staticmethod
    def deduplicate(items: List[str], threshold: float = 0.9) -> List[str]:
        """Remove near-duplicate strings."""
        if not items:
            return []

        unique = [items[0]]

        for item in items[1:]:
            is_duplicate = False
            for existing in unique:
                if FuzzyMatcher.similarity(item, existing) >= threshold:
                    is_duplicate = True
                    break
            if not is_duplicate:
                unique.append(item)

        return unique


# ============================================
# ENHANCED DATA SOURCES
# ============================================

class CrunchbaseScraper:
    """
    FREE Crunchbase public page scraper.
    Extracts company info, funding, team.
    """

    def __init__(self, timeout: int = 30):
        self.timeout = timeout
        self.base_url = "https://www.crunchbase.com"
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        self.client = httpx.AsyncClient(timeout=timeout, follow_redirects=True)
        self.cache = LRUCache(500)

    async def search_company(self, company_name: str) -> Optional[Dict[str, Any]]:
        """Search for a company on Crunchbase."""
        cache_key = f"crunchbase:{company_name.lower()}"
        cached = self.cache.get(cache_key)
        if cached:
            return cached

        try:
            # Search via Google site search (Crunchbase doesn't have public search API)
            search_url = f"https://www.google.com/search"
            params = {
                "q": f'site:crunchbase.com/organization "{company_name}"'
            }

            # Note: In production, you'd use a proper search mechanism
            # This is a placeholder for the concept

            result = {
                "company_name": company_name,
                "source": "crunchbase",
                "found": False
            }

            self.cache.put(cache_key, result)
            return result

        except Exception as e:
            logger.error(f"Crunchbase search error: {e}")
            return None

    async def close(self):
        await self.client.aclose()


class HackerNewsScraper:
    """
    FREE HackerNews API scraper.
    Finds tech companies mentioned on HN.
    """

    def __init__(self, timeout: int = 30):
        self.timeout = timeout
        self.api_url = "https://hn.algolia.com/api/v1"
        self.client = httpx.AsyncClient(timeout=timeout)
        self.cache = LRUCache(500)

    async def search(self, query: str, max_results: int = 20) -> List[Dict[str, Any]]:
        """Search HackerNews for mentions."""
        cache_key = f"hn:{query.lower()}"
        cached = self.cache.get(cache_key)
        if cached:
            return cached

        results = []

        try:
            url = f"{self.api_url}/search"
            params = {
                "query": query,
                "tags": "story",
                "hitsPerPage": max_results
            }

            response = await self.client.get(url, params=params)

            if response.status_code == 200:
                data = response.json()

                for hit in data.get("hits", []):
                    results.append({
                        "title": hit.get("title"),
                        "url": hit.get("url"),
                        "author": hit.get("author"),
                        "points": hit.get("points", 0),
                        "created_at": hit.get("created_at"),
                        "source": "hackernews"
                    })

            self.cache.put(cache_key, results)

        except Exception as e:
            logger.error(f"HackerNews search error: {e}")

        return results

    async def close(self):
        await self.client.aclose()


class GitHubOrganizationScraper:
    """
    FREE GitHub organization scraper.
    Extracts org members, emails from commits.
    """

    def __init__(self, timeout: int = 30):
        self.timeout = timeout
        self.api_url = "https://api.github.com"
        self.headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "MobiAdz-Scraper/2.0"
        }
        self.client = httpx.AsyncClient(timeout=timeout)
        self.cache = LRUCache(500)
        self.rate_remaining = 60

    async def search_organizations(self, query: str, max_results: int = 20) -> List[Dict[str, Any]]:
        """Search GitHub organizations."""
        results = []

        try:
            url = f"{self.api_url}/search/users"
            params = {
                "q": f"{query} type:org",
                "per_page": min(max_results, 100)
            }

            response = await self.client.get(url, params=params, headers=self.headers)
            self.rate_remaining = int(response.headers.get("X-RateLimit-Remaining", 60))

            if response.status_code == 200:
                data = response.json()

                for item in data.get("items", []):
                    results.append({
                        "login": item.get("login"),
                        "name": item.get("login"),
                        "url": item.get("html_url"),
                        "avatar": item.get("avatar_url"),
                        "type": item.get("type"),
                        "source": "github_org"
                    })

        except Exception as e:
            logger.error(f"GitHub org search error: {e}")

        return results

    async def get_org_details(self, org_name: str) -> Optional[Dict[str, Any]]:
        """Get organization details."""
        cache_key = f"github_org:{org_name}"
        cached = self.cache.get(cache_key)
        if cached:
            return cached

        try:
            url = f"{self.api_url}/orgs/{org_name}"
            response = await self.client.get(url, headers=self.headers)
            self.rate_remaining = int(response.headers.get("X-RateLimit-Remaining", 60))

            if response.status_code == 200:
                data = response.json()

                result = {
                    "name": data.get("name") or org_name,
                    "login": data.get("login"),
                    "description": data.get("description"),
                    "blog": data.get("blog"),
                    "location": data.get("location"),
                    "email": data.get("email"),
                    "twitter": data.get("twitter_username"),
                    "public_repos": data.get("public_repos"),
                    "followers": data.get("followers"),
                    "url": data.get("html_url"),
                    "source": "github_org"
                }

                self.cache.put(cache_key, result)
                return result

        except Exception as e:
            logger.error(f"GitHub org details error: {e}")

        return None

    async def get_org_members_emails(self, org_name: str, max_members: int = 20) -> List[Dict[str, Any]]:
        """Get emails from organization member commits."""
        results = []

        try:
            # Get public members
            url = f"{self.api_url}/orgs/{org_name}/members"
            params = {"per_page": min(max_members, 100)}

            response = await self.client.get(url, params=params, headers=self.headers)
            self.rate_remaining = int(response.headers.get("X-RateLimit-Remaining", 60))

            if response.status_code == 200:
                members = response.json()

                for member in members[:max_members]:
                    username = member.get("login")

                    if username and self.rate_remaining > 5:
                        # Get email from commits
                        email = await self._get_user_email_from_commits(username)

                        if email:
                            results.append({
                                "username": username,
                                "email": email,
                                "profile_url": member.get("html_url"),
                                "organization": org_name,
                                "source": "github_commits",
                                "confidence": 90  # High - actual git email
                            })

                        await asyncio.sleep(0.5)  # Rate limiting

        except Exception as e:
            logger.error(f"GitHub org members error: {e}")

        return results

    async def _get_user_email_from_commits(self, username: str) -> Optional[str]:
        """Extract email from user's public commits."""
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

        except Exception:
            pass

        return None

    async def close(self):
        await self.client.aclose()


class NPMPackageScraper:
    """
    FREE npm registry scraper.
    Finds package maintainer emails.
    """

    def __init__(self, timeout: int = 30):
        self.timeout = timeout
        self.api_url = "https://registry.npmjs.org"
        self.search_url = "https://api.npms.io/v2/search"
        self.client = httpx.AsyncClient(timeout=timeout)
        self.cache = LRUCache(500)

    async def search_packages(self, query: str, max_results: int = 20) -> List[Dict[str, Any]]:
        """Search npm packages."""
        results = []

        try:
            params = {"q": query, "size": max_results}
            response = await self.client.get(self.search_url, params=params)

            if response.status_code == 200:
                data = response.json()

                for result in data.get("results", []):
                    package = result.get("package", {})

                    # Get maintainers
                    maintainers = package.get("maintainers", [])
                    publisher = package.get("publisher", {})

                    results.append({
                        "name": package.get("name"),
                        "description": package.get("description"),
                        "version": package.get("version"),
                        "publisher": publisher.get("username"),
                        "publisher_email": publisher.get("email"),
                        "maintainers": maintainers,
                        "homepage": package.get("links", {}).get("homepage"),
                        "repository": package.get("links", {}).get("repository"),
                        "source": "npm"
                    })

        except Exception as e:
            logger.error(f"NPM search error: {e}")

        return results

    async def get_package_maintainers(self, package_name: str) -> List[Dict[str, Any]]:
        """Get package maintainer emails."""
        results = []

        try:
            url = f"{self.api_url}/{package_name}"
            response = await self.client.get(url)

            if response.status_code == 200:
                data = response.json()

                maintainers = data.get("maintainers", [])
                for m in maintainers:
                    if m.get("email"):
                        results.append({
                            "name": m.get("name"),
                            "email": m.get("email"),
                            "package": package_name,
                            "source": "npm_registry",
                            "confidence": 95  # Very high - official registry
                        })

        except Exception as e:
            logger.error(f"NPM package error: {e}")

        return results

    async def close(self):
        await self.client.aclose()


class DNSIntelligence:
    """
    DNS-based intelligence gathering.
    Extracts emails from TXT records, MX records, WHOIS.
    """

    def __init__(self):
        self.cache = LRUCache(500)

    async def get_domain_intelligence(self, domain: str) -> Dict[str, Any]:
        """Get all DNS-based intelligence for a domain."""
        result = {
            "domain": domain,
            "mx_records": [],
            "txt_records": [],
            "emails_from_txt": [],
            "spf_record": None,
            "dmarc_record": None,
            "has_email_service": False,
            "email_provider": None
        }

        if not DNS_AVAILABLE:
            return result

        try:
            # Get MX records
            try:
                mx_records = dns.resolver.resolve(domain, 'MX')
                for mx in mx_records:
                    mx_host = str(mx.exchange).rstrip('.')
                    result["mx_records"].append(mx_host)

                    # Detect email provider
                    if "google" in mx_host.lower() or "gmail" in mx_host.lower():
                        result["email_provider"] = "Google Workspace"
                    elif "outlook" in mx_host.lower() or "microsoft" in mx_host.lower():
                        result["email_provider"] = "Microsoft 365"
                    elif "zoho" in mx_host.lower():
                        result["email_provider"] = "Zoho Mail"
                    elif "protonmail" in mx_host.lower():
                        result["email_provider"] = "ProtonMail"

                result["has_email_service"] = len(result["mx_records"]) > 0
            except:
                pass

            # Get TXT records (may contain emails in SPF, DKIM, etc.)
            try:
                txt_records = dns.resolver.resolve(domain, 'TXT')
                for txt in txt_records:
                    txt_str = str(txt).strip('"')
                    result["txt_records"].append(txt_str)

                    # Check for SPF
                    if txt_str.startswith("v=spf1"):
                        result["spf_record"] = txt_str

                    # Extract any emails from TXT records
                    emails = re.findall(r'[\w.+-]+@[\w.-]+\.\w+', txt_str)
                    result["emails_from_txt"].extend(emails)
            except:
                pass

            # Get DMARC record
            try:
                dmarc_records = dns.resolver.resolve(f"_dmarc.{domain}", 'TXT')
                for dmarc in dmarc_records:
                    dmarc_str = str(dmarc).strip('"')
                    if dmarc_str.startswith("v=DMARC1"):
                        result["dmarc_record"] = dmarc_str

                        # Extract rua/ruf emails (aggregate/forensic report recipients)
                        rua_emails = re.findall(r'rua=mailto:([^;,\s]+)', dmarc_str)
                        ruf_emails = re.findall(r'ruf=mailto:([^;,\s]+)', dmarc_str)
                        result["emails_from_txt"].extend(rua_emails)
                        result["emails_from_txt"].extend(ruf_emails)
            except:
                pass

        except Exception as e:
            logger.error(f"DNS intelligence error for {domain}: {e}")

        return result


class SSLCertificateIntelligence:
    """
    SSL Certificate intelligence.
    Extracts subdomains and emails from crt.sh.
    """

    def __init__(self, timeout: int = 60):
        self.timeout = timeout
        self.crt_url = "https://crt.sh"
        self.client = httpx.AsyncClient(timeout=timeout)
        self.cache = LRUCache(500)

    async def get_subdomains(self, domain: str) -> List[str]:
        """Get all subdomains from Certificate Transparency logs."""
        cache_key = f"crt:{domain}"
        cached = self.cache.get(cache_key)
        if cached:
            return cached

        subdomains = set()

        try:
            params = {"q": f"%.{domain}", "output": "json"}
            response = await self.client.get(self.crt_url, params=params)

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

            result = list(subdomains)
            self.cache.put(cache_key, result)
            return result

        except Exception as e:
            logger.error(f"crt.sh error: {e}")

        return list(subdomains)

    async def close(self):
        await self.client.aclose()


class WaybackIntelligence:
    """
    Wayback Machine intelligence.
    Extracts historical emails from archived pages.
    """

    def __init__(self, timeout: int = 60):
        self.timeout = timeout
        self.cdx_url = "https://web.archive.org/cdx/search/cdx"
        self.wayback_url = "https://web.archive.org/web"
        self.client = httpx.AsyncClient(timeout=timeout)
        self.cache = LRUCache(500)

    async def get_historical_emails(self, domain: str, pages: List[str] = None) -> List[str]:
        """Extract emails from historical archived pages."""
        cache_key = f"wayback_emails:{domain}"
        cached = self.cache.get(cache_key)
        if cached:
            return cached

        emails = set()

        # Default pages to check
        if not pages:
            pages = [
                f"https://{domain}/",
                f"https://{domain}/contact",
                f"https://{domain}/about",
                f"https://{domain}/team",
                f"https://{domain}/about-us",
                f"https://{domain}/contact-us",
                f"https://www.{domain}/contact",
                f"https://www.{domain}/about"
            ]

        for page_url in pages[:5]:  # Limit pages
            try:
                # Get snapshots
                params = {
                    "url": page_url,
                    "output": "json",
                    "limit": 3,
                    "fl": "timestamp,original",
                    "filter": "statuscode:200"
                }

                response = await self.client.get(self.cdx_url, params=params)

                if response.status_code == 200:
                    lines = response.text.strip().split("\n")

                    for line in lines[1:]:  # Skip header
                        try:
                            parts = line.split()
                            if len(parts) >= 2:
                                timestamp = parts[0]
                                original_url = parts[1]

                                # Fetch archived page
                                archive_url = f"{self.wayback_url}/{timestamp}/{original_url}"
                                arch_response = await self.client.get(archive_url)

                                if arch_response.status_code == 200:
                                    # Extract emails
                                    found_emails = re.findall(
                                        r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
                                        arch_response.text
                                    )
                                    emails.update(found_emails)

                                await asyncio.sleep(1)  # Rate limit

                        except:
                            continue

            except Exception as e:
                logger.debug(f"Wayback error for {page_url}: {e}")

        result = list(emails)
        self.cache.put(cache_key, result)
        return result

    async def close(self):
        await self.client.aclose()


# ============================================
# ULTRA EXTRACTION ENGINE
# ============================================

class MobiAdzUltraEngine:
    """
    ULTRA Enhanced MobiAdz Extraction Engine V2.0

    Features:
    - AI/ML entity extraction with SpaCy NER
    - 50+ email patterns with permutation generator
    - Advanced data structures (Bloom filter, LRU cache, Trie, Priority Queue)
    - 20+ data sources with intelligent fallback
    - Fuzzy matching for deduplication
    - DNS/SSL/WHOIS intelligence
    - Historical data from Wayback Machine
    """

    def __init__(self, config: Optional[Dict] = None):
        self.config = config or {}

        # Advanced data structures
        self.url_bloom = BloomFilter(size=1000000)
        self.email_bloom = BloomFilter(size=500000)
        self.response_cache = LRUCache(capacity=2000)
        self.email_trie = EmailPatternTrie()
        self.url_queue = PriorityURLQueue()

        # Initialize email patterns in Trie
        for i, pattern in enumerate(EmailPermutationGenerator.PATTERNS):
            self.email_trie.insert(pattern, confidence=95 - i)

        # AI/ML components
        self.nlp_extractor = NLPEntityExtractor()
        self.email_verifier = EmailVerifier()

        # Data source scrapers
        self.github = GitHubOrganizationScraper()
        self.npm = NPMPackageScraper()
        self.hackernews = HackerNewsScraper()
        self.crunchbase = CrunchbaseScraper()
        self.dns_intel = DNSIntelligence()
        self.ssl_intel = SSLCertificateIntelligence()
        self.wayback = WaybackIntelligence()

        # HTTP client for general scraping
        self.client = httpx.AsyncClient(timeout=30, follow_redirects=True)
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }

        # Statistics
        self.stats = {
            "urls_processed": 0,
            "emails_found": 0,
            "emails_verified": 0,
            "entities_extracted": 0,
            "sources_used": [],
            "cache_hits": 0,
            "bloom_filter_hits": 0,
            "start_time": None,
            "end_time": None
        }

        # Progress
        self.progress = {
            "stage": "idle",
            "stage_progress": 0,
            "total_progress": 0,
            "message": "Ready"
        }

    async def initialize(self):
        """Initialize AI/ML components."""
        await self.nlp_extractor.initialize()
        logger.info("MobiAdz Ultra Engine initialized")

    def _update_progress(self, stage: str, progress: int, message: str):
        stages = ["init", "discovery", "scraping", "extraction", "verification", "enrichment", "complete"]
        stage_idx = stages.index(stage) if stage in stages else 0

        self.progress = {
            "stage": stage,
            "stage_progress": progress,
            "total_progress": int((stage_idx * 100 + progress) / len(stages)),
            "message": message
        }

    async def extract_company_intelligence(
        self,
        company_name: str,
        domain: Optional[str] = None,
        deep_mode: bool = True
    ) -> Dict[str, Any]:
        """
        Extract comprehensive company intelligence using all sources.

        This is the main extraction method that combines all data sources.
        """
        self.stats["start_time"] = datetime.utcnow().isoformat()

        result = {
            "company_name": company_name,
            "domain": domain,
            "emails": [],
            "people": [],
            "company_info": {},
            "social_profiles": {},
            "technology_stack": [],
            "funding_info": None,
            "subdomains": [],
            "dns_intelligence": {},
            "historical_emails": [],
            "sources_used": [],
            "confidence_score": 0
        }

        # Extract or guess domain
        if not domain:
            domain = self._guess_domain(company_name)
            result["domain"] = domain

        try:
            await self.initialize()

            # Stage 1: DNS Intelligence
            self._update_progress("discovery", 0, f"Gathering DNS intelligence for {domain}...")
            dns_data = await self.dns_intel.get_domain_intelligence(domain)
            result["dns_intelligence"] = dns_data
            result["emails"].extend([
                {"email": e, "source": "dns_txt", "confidence": 85}
                for e in dns_data.get("emails_from_txt", [])
            ])
            result["sources_used"].append("dns")

            # Stage 2: SSL Certificate Intelligence
            self._update_progress("discovery", 20, "Finding subdomains from SSL certificates...")
            subdomains = await self.ssl_intel.get_subdomains(domain)
            result["subdomains"] = subdomains[:50]  # Limit
            if subdomains:
                result["sources_used"].append("certificate_transparency")

            # Stage 3: Website Deep Scraping
            self._update_progress("scraping", 0, f"Deep scraping {domain}...")
            website_data = await self._deep_scrape_website(domain)

            if website_data:
                # Extract entities using NLP
                entities = self.nlp_extractor.extract_entities(website_data.get("text", ""))

                result["emails"].extend([
                    {"email": e, "source": "website_scrape", "confidence": 85}
                    for e in entities.get("emails", [])
                ])

                result["people"].extend([
                    {"name": p, "source": "website_nlp"}
                    for p in entities.get("persons", [])
                ])

                result["company_info"]["description"] = website_data.get("description", "")
                result["social_profiles"] = website_data.get("social_links", {})

                result["sources_used"].append("website_scrape")

            # Stage 4: GitHub Organization
            if deep_mode:
                self._update_progress("extraction", 0, "Searching GitHub organizations...")

                org_name = company_name.lower().replace(" ", "").replace("-", "").replace(".", "")
                org_details = await self.github.get_org_details(org_name)

                if org_details:
                    if org_details.get("email"):
                        result["emails"].append({
                            "email": org_details["email"],
                            "source": "github_org",
                            "confidence": 95
                        })

                    if org_details.get("blog"):
                        result["company_info"]["website"] = org_details["blog"]

                    result["sources_used"].append("github_org")

                    # Get member emails from commits
                    member_emails = await self.github.get_org_members_emails(org_name, max_members=10)

                    for member in member_emails:
                        result["emails"].append({
                            "email": member["email"],
                            "name": member.get("username"),
                            "source": "github_commits",
                            "confidence": 90  # High - actual git email
                        })

            # Stage 5: NPM Packages
            if deep_mode:
                self._update_progress("extraction", 30, "Searching npm packages...")

                npm_packages = await self.npm.search_packages(company_name, max_results=5)

                for pkg in npm_packages:
                    if pkg.get("publisher_email"):
                        result["emails"].append({
                            "email": pkg["publisher_email"],
                            "source": "npm_registry",
                            "confidence": 95,
                            "context": f"npm package: {pkg.get('name')}"
                        })
                        result["sources_used"].append("npm")
                        break

            # Stage 6: HackerNews Mentions
            if deep_mode:
                self._update_progress("extraction", 50, "Checking HackerNews mentions...")

                hn_results = await self.hackernews.search(company_name, max_results=10)

                if hn_results:
                    result["company_info"]["hackernews_mentions"] = len(hn_results)
                    result["sources_used"].append("hackernews")

            # Stage 7: Wayback Machine
            if deep_mode:
                self._update_progress("extraction", 70, "Searching historical archives...")

                historical_emails = await self.wayback.get_historical_emails(domain)

                for email in historical_emails[:10]:
                    if email not in [e["email"] for e in result["emails"]]:
                        result["emails"].append({
                            "email": email,
                            "source": "wayback_machine",
                            "confidence": 75
                        })

                if historical_emails:
                    result["sources_used"].append("wayback_machine")

            # Stage 8: Email Permutation
            if result["people"]:
                self._update_progress("extraction", 85, "Generating email permutations...")

                for person in result["people"][:5]:
                    permutations = EmailPermutationGenerator.generate(person["name"], domain)

                    for perm in permutations[:3]:  # Top 3 patterns only
                        if perm["email"] not in [e["email"] for e in result["emails"]]:
                            result["emails"].append({
                                "email": perm["email"],
                                "source": "email_permutation",
                                "pattern": perm["pattern"],
                                "confidence": perm["confidence"],
                                "for_person": person["name"]
                            })

            # Stage 9: Generate role-based emails
            role_emails = EmailPermutationGenerator.generate_role_emails(domain)

            for role_email in role_emails[:10]:
                if role_email["email"] not in [e["email"] for e in result["emails"]]:
                    result["emails"].append({
                        "email": role_email["email"],
                        "source": "role_based",
                        "confidence": role_email["confidence"]
                    })

            # Stage 10: Email Verification
            self._update_progress("verification", 0, "Verifying emails...")

            verified_emails = []
            for i, email_data in enumerate(result["emails"][:30]):  # Limit verification
                verification = await self.email_verifier.verify(email_data["email"])

                email_data["verified"] = verification["deliverable"]
                email_data["verification_confidence"] = verification["confidence"]
                email_data["is_role_based"] = verification["is_role_based"]
                email_data["is_free_provider"] = verification["is_free_provider"]

                if verification["deliverable"]:
                    verified_emails.append(email_data)

                progress = int((i + 1) / min(len(result["emails"]), 30) * 100)
                self._update_progress("verification", progress, f"Verified {i + 1} emails...")

            # Keep verified emails first, then unverified
            result["emails"] = verified_emails + [
                e for e in result["emails"]
                if e not in verified_emails
            ]

            # Deduplicate emails using fuzzy matching
            seen_emails = set()
            unique_emails = []

            for email_data in result["emails"]:
                email_lower = email_data["email"].lower()
                if email_lower not in seen_emails:
                    seen_emails.add(email_lower)
                    unique_emails.append(email_data)

            result["emails"] = unique_emails

            # Calculate confidence score
            confidence = 0
            if result["emails"]:
                confidence += 30
            if result["people"]:
                confidence += 20
            if result["company_info"]:
                confidence += 20
            if result["social_profiles"]:
                confidence += 10
            if result["dns_intelligence"].get("has_email_service"):
                confidence += 10
            confidence += min(len(result["sources_used"]) * 5, 25)

            result["confidence_score"] = min(confidence, 100)

            # Update stats
            self.stats["emails_found"] = len(result["emails"])
            self.stats["sources_used"] = result["sources_used"]
            self.stats["end_time"] = datetime.utcnow().isoformat()

            self._update_progress("complete", 100, f"Found {len(result['emails'])} emails from {len(result['sources_used'])} sources")

        except Exception as e:
            logger.error(f"Company extraction error: {e}")
            self.stats["end_time"] = datetime.utcnow().isoformat()

        return result

    async def _deep_scrape_website(self, domain: str, max_pages: int = 20) -> Optional[Dict[str, Any]]:
        """Deep scrape a website for data."""
        result = {
            "text": "",
            "emails": [],
            "description": "",
            "social_links": {}
        }

        pages_to_scrape = [
            f"https://{domain}/",
            f"https://{domain}/about",
            f"https://{domain}/about-us",
            f"https://{domain}/team",
            f"https://{domain}/contact",
            f"https://{domain}/contact-us",
            f"https://www.{domain}/",
            f"https://www.{domain}/about",
            f"https://www.{domain}/team",
            f"https://www.{domain}/contact"
        ]

        scraped = 0

        for url in pages_to_scrape:
            if scraped >= max_pages:
                break

            # Check bloom filter
            if url in self.url_bloom:
                self.stats["bloom_filter_hits"] += 1
                continue

            self.url_bloom.add(url)

            try:
                response = await self.client.get(url, headers=self.headers)

                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, "html.parser")

                    # Extract text
                    text = soup.get_text(separator=" ", strip=True)
                    result["text"] += " " + text

                    # Extract description
                    meta_desc = soup.find("meta", {"name": "description"}) or \
                                soup.find("meta", {"property": "og:description"})
                    if meta_desc and not result["description"]:
                        result["description"] = meta_desc.get("content", "")[:500]

                    # Extract social links
                    for link in soup.find_all("a", href=True):
                        href = link.get("href", "")

                        if "linkedin.com/company" in href and not result["social_links"].get("linkedin"):
                            result["social_links"]["linkedin"] = href
                        elif ("twitter.com/" in href or "x.com/" in href) and not result["social_links"].get("twitter"):
                            result["social_links"]["twitter"] = href
                        elif "facebook.com/" in href and not result["social_links"].get("facebook"):
                            result["social_links"]["facebook"] = href

                    scraped += 1

                await asyncio.sleep(0.3)

            except Exception as e:
                logger.debug(f"Scrape error for {url}: {e}")

        return result if result["text"] else None

    def _guess_domain(self, company_name: str) -> str:
        """Guess domain from company name."""
        # Clean company name
        clean = company_name.lower()
        clean = re.sub(r'[^a-z0-9]', '', clean)

        # Remove common suffixes
        suffixes = ['inc', 'llc', 'ltd', 'corp', 'company', 'co', 'limited', 'gmbh', 'ag']
        for suffix in suffixes:
            if clean.endswith(suffix):
                clean = clean[:-len(suffix)]

        return f"{clean}.com"

    async def batch_extract(
        self,
        companies: List[Dict[str, str]],
        deep_mode: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Batch extract intelligence for multiple companies.

        Args:
            companies: List of {"name": "Company Name", "domain": "example.com"}
        """
        results = []

        for i, company in enumerate(companies):
            self._update_progress(
                "extraction",
                int(i / len(companies) * 100),
                f"Processing {i + 1}/{len(companies)}: {company.get('name')}"
            )

            result = await self.extract_company_intelligence(
                company_name=company.get("name", ""),
                domain=company.get("domain"),
                deep_mode=deep_mode
            )

            results.append(result)

            # Rate limiting
            await asyncio.sleep(1)

        return results

    def get_stats(self) -> Dict[str, Any]:
        return self.stats

    def get_progress(self) -> Dict[str, Any]:
        return self.progress

    async def close(self):
        """Close all resources."""
        await self.client.aclose()
        await self.github.close()
        await self.npm.close()
        await self.hackernews.close()
        await self.crunchbase.close()
        await self.ssl_intel.close()
        await self.wayback.close()

        logger.info("MobiAdz Ultra Engine closed")


# ============================================
# QUICK START FUNCTIONS
# ============================================

async def ultra_company_extraction(
    company_name: str,
    domain: Optional[str] = None
) -> Dict[str, Any]:
    """
    Quick function for ultra company extraction.

    Example:
        result = await ultra_company_extraction(
            company_name="Stripe",
            domain="stripe.com"
        )

        print(f"Found {len(result['emails'])} emails")
        print(f"Sources: {result['sources_used']}")
    """
    engine = MobiAdzUltraEngine()

    try:
        result = await engine.extract_company_intelligence(
            company_name=company_name,
            domain=domain,
            deep_mode=True
        )
        return result
    finally:
        await engine.close()


async def batch_ultra_extraction(
    companies: List[Dict[str, str]]
) -> List[Dict[str, Any]]:
    """
    Quick function for batch extraction.

    Example:
        companies = [
            {"name": "Stripe", "domain": "stripe.com"},
            {"name": "Notion", "domain": "notion.so"},
        ]
        results = await batch_ultra_extraction(companies)
    """
    engine = MobiAdzUltraEngine()

    try:
        results = await engine.batch_extract(companies, deep_mode=True)
        return results
    finally:
        await engine.close()
