import { CampaignRecipient } from '@/types'

export interface ValidationResult {
  isValid: boolean
  reason?: string
}

export interface DuplicateGroup {
  email: string
  recipients: CampaignRecipient[]
  count: number
}

export interface ValidationReport {
  totalRecipients: number
  validRecipients: CampaignRecipient[]
  invalidRecipients: Array<CampaignRecipient & { validationError: string }>
  duplicates: DuplicateGroup[]
  stats: {
    valid: number
    invalid: number
    duplicateEmails: number
    duplicateRecipients: number
  }
}

/**
 * Validates email format using RFC 5322 standard
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || typeof email !== 'string') {
    return { isValid: false, reason: 'Email is required' }
  }

  const trimmedEmail = email.trim()

  if (trimmedEmail.length === 0) {
    return { isValid: false, reason: 'Email cannot be empty' }
  }

  if (trimmedEmail.length > 254) {
    return { isValid: false, reason: 'Email exceeds maximum length (254 characters)' }
  }

  // RFC 5322 compliant regex (simplified but robust)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

  if (!emailRegex.test(trimmedEmail)) {
    return { isValid: false, reason: 'Invalid email format' }
  }

  // Check for common typos
  const domain = trimmedEmail.split('@')[1]
  if (!domain || domain.length === 0) {
    return { isValid: false, reason: 'Missing domain' }
  }

  if (domain.indexOf('..') !== -1) {
    return { isValid: false, reason: 'Invalid domain (consecutive dots)' }
  }

  if (!domain.includes('.')) {
    return { isValid: false, reason: 'Domain missing TLD' }
  }

  // Check for common disposable email domains
  const disposableDomains = [
    'tempmail.com', 'throwaway.email', '10minutemail.com', 'guerrillamail.com',
    'mailinator.com', 'trashmail.com', 'fakeinbox.com'
  ]

  if (disposableDomains.includes(domain.toLowerCase())) {
    return { isValid: false, reason: 'Disposable email address' }
  }

  return { isValid: true }
}

/**
 * Detects duplicate recipients based on email (case-insensitive)
 */
export function detectDuplicates(recipients: CampaignRecipient[]): DuplicateGroup[] {
  const emailMap = new Map<string, CampaignRecipient[]>()

  // Group recipients by normalized email
  recipients.forEach((recipient) => {
    if (!recipient.email) return

    const normalizedEmail = recipient.email.toLowerCase().trim()
    const existing = emailMap.get(normalizedEmail) || []
    existing.push(recipient)
    emailMap.set(normalizedEmail, existing)
  })

  // Filter to only duplicates (count > 1)
  const duplicates: DuplicateGroup[] = []
  emailMap.forEach((recs, email) => {
    if (recs.length > 1) {
      duplicates.push({
        email,
        recipients: recs,
        count: recs.length,
      })
    }
  })

  return duplicates
}

/**
 * Merges duplicate recipients by preferring the most complete record
 */
export function mergeDuplicates(duplicateGroup: DuplicateGroup): CampaignRecipient {
  const { recipients } = duplicateGroup

  if (recipients.length === 1) {
    return recipients[0]
  }

  // Score each recipient based on completeness
  const scored = recipients.map((recipient) => {
    let score = 0
    if (recipient.name && recipient.name.trim()) score += 10
    if (recipient.company && recipient.company.trim()) score += 5
    if (recipient.position && recipient.position.trim()) score += 5
    if (recipient.linkedinUrl && recipient.linkedinUrl.trim()) score += 3
    if (recipient.website && recipient.website.trim()) score += 2
    return { recipient, score }
  })

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score)

  // Use the highest scored recipient as base
  const merged = { ...scored[0].recipient }

  // Fill in any missing fields from other records
  scored.forEach(({ recipient }) => {
    if (!merged.name && recipient.name) merged.name = recipient.name
    if (!merged.company && recipient.company) merged.company = recipient.company
    if (!merged.position && recipient.position) merged.position = recipient.position
    if (!merged.linkedinUrl && recipient.linkedinUrl) merged.linkedinUrl = recipient.linkedinUrl
    if (!merged.website && recipient.website) merged.website = recipient.website
  })

  return merged
}

/**
 * Validates and deduplicates a list of recipients
 */
export function validateRecipients(recipients: CampaignRecipient[]): ValidationReport {
  const validRecipients: CampaignRecipient[] = []
  const invalidRecipients: Array<CampaignRecipient & { validationError: string }> = []

  // Validate each recipient
  recipients.forEach((recipient) => {
    const validation = validateEmail(recipient.email)
    if (validation.isValid) {
      validRecipients.push(recipient)
    } else {
      invalidRecipients.push({
        ...recipient,
        validationError: validation.reason || 'Invalid email',
      })
    }
  })

  // Detect duplicates among valid recipients
  const duplicates = detectDuplicates(validRecipients)

  return {
    totalRecipients: recipients.length,
    validRecipients,
    invalidRecipients,
    duplicates,
    stats: {
      valid: validRecipients.length,
      invalid: invalidRecipients.length,
      duplicateEmails: duplicates.length,
      duplicateRecipients: duplicates.reduce((sum, dup) => sum + dup.count, 0),
    },
  }
}

/**
 * Removes duplicates by merging them into single records
 */
export function deduplicateRecipients(recipients: CampaignRecipient[]): CampaignRecipient[] {
  const duplicates = detectDuplicates(recipients)
  
  if (duplicates.length === 0) {
    return recipients
  }

  // Create a set of emails that have duplicates
  const duplicateEmails = new Set(duplicates.map((d) => d.email.toLowerCase()))

  // Keep non-duplicate recipients as-is
  const nonDuplicates = recipients.filter(
    (r) => !duplicateEmails.has(r.email.toLowerCase().trim())
  )

  // Merge duplicates
  const merged = duplicates.map((dupGroup) => mergeDuplicates(dupGroup))

  return [...nonDuplicates, ...merged]
}
