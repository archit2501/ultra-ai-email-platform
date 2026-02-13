/**
 * TheMobiAdz Email Templates
 *
 * Hardcoded email templates for different tiers
 */

export type MobiAdzTier = "tier1" | "tier2" | "tier3";

export interface MobiAdzEmailData {
  companyName: string;
  productName?: string; // App/Brand/Product name if different from company
}

// Presentation link to include at the start
const PRESENTATION_LINK = "https://drive.google.com/file/d/1MpnIY-VjHgkvxgeXqBo68QDhyuCGw0rj/view";

/**
 * Generate email content for Tier 1 (Premium)
 * TODO: User will provide content later
 */
export function generateTier1Email(data: MobiAdzEmailData): { subject: string; body: string } {
  const { companyName, productName } = data;
  const displayName = productName || companyName;

  return {
    subject: `Partnership Opportunity with ${displayName} - TheMobiAdz`,
    body: `Presentation: ${PRESENTATION_LINK}

Hello Team,

[Tier 1 Premium Content - To be provided]

We look forward to partnering with ${displayName}.

Best regards,
TheMobiAdz Team`
  };
}

/**
 * Generate email content for Tier 2 (Standard)
 */
export function generateTier2Email(data: MobiAdzEmailData): { subject: string; body: string } {
  const { companyName, productName } = data;
  const displayName = productName || companyName;
  const productMention = productName && productName !== companyName
    ? ` for '${productName}'`
    : "";

  return {
    subject: `Performance-based Campaign Opportunity for '${displayName}' - TheMobiAdz`,
    body: `Presentation: ${PRESENTATION_LINK}

Hello Team,

I hope you are doing well!

I am writing to talk about the '${displayName}' Performance-based campaign${productMention}.

We, TheMobiAdz - A Performance Marketing Company helps brands promote their Apps and Websites on CPI/CPA models.

We drive traffic from multiple channels like:

• SMS, Telegram and Email Marketing
• Affiliate Networks (more than 2000 globally)
• Direct App Developers & OEMs Integrated with the direct apps & OEMs
• Media Buying on Multiple Ad Formats like Native, Push, Videos, Banners
• Search Advertising – Google, Bing, Yahoo Advertisement
• Display Advertisement – DSPs, RTBs, APIs, Direct Sites Tie-ups
• Influencer Marketing – Tie-Ups with YouTube influencers for Video Promotions

Currently, we're working with more than 450+ advertisers such as CoinDCX, Binance, Exness, Coinswitch, GroupM, Access Trade, Interactive Avenue etc., and delivering 1.5 to 2 million Conversions monthly.

We would appreciate an opportunity to associate with '${displayName}' for mobile performance campaigns.

Looking forward to hearing from you.

Best regards,
TheMobiAdz Team`
  };
}

/**
 * Generate email content for Tier 3 (Basic)
 */
export function generateTier3Email(data: MobiAdzEmailData): { subject: string; body: string } {
  const { companyName, productName } = data;
  const displayName = productName || companyName;
  const productMention = productName && productName !== companyName
    ? ` for '${productName}'`
    : "";

  return {
    subject: `Performance Marketing Partnership - '${displayName}' | TheMobiAdz`,
    body: `Presentation: ${PRESENTATION_LINK}

Hello Team,

I hope you are doing well!

I am writing to discuss a performance-based campaign opportunity${productMention} with '${displayName}'.

We, TheMobiAdz - A Performance Marketing Company helps brands promote their Apps and Websites on CPI/CPA models.

We drive traffic from multiple channels like:

• SMS, Telegram and Email Marketing
• Affiliate Networks (more than 2000 globally)
• Direct App Developers & OEMs Integrated with the direct apps & OEMs
• Media Buying on Multiple Ad Formats like Native, Push, Videos, Banners
• Search Advertising – Google, Bing, Yahoo Advertisement
• Display Advertisement – DSPs, RTBs, APIs, Direct Sites Tie-ups
• Influencer Marketing – Tie-Ups with YouTube influencers for Video Promotions

Currently, we're working with more than 450+ advertisers such as CoinDCX, Binance, Exness, Coinswitch, GroupM, Access Trade, Interactive Avenue etc., and delivering 1.5 to 2 million Conversions monthly.

We would appreciate an opportunity to associate with '${displayName}' for mobile performance campaigns.

Looking forward to your response.

Best regards,
TheMobiAdz Team`
  };
}

/**
 * Generate email based on tier selection
 */
export function generateMobiAdzEmail(tier: MobiAdzTier, data: MobiAdzEmailData): { subject: string; body: string } {
  switch (tier) {
    case "tier1":
      return generateTier1Email(data);
    case "tier2":
      return generateTier2Email(data);
    case "tier3":
      return generateTier3Email(data);
    default:
      return generateTier2Email(data);
  }
}
