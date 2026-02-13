'use client'

import { MobiAdzExtractionContent } from '@/components/mobiadz-extraction'
import { CampaignRecipient } from '@/types'

interface MobiAdzExtractionProps {
  onRecipientSelected: (recipients: CampaignRecipient[], count: number, autoAdvance?: boolean) => void
  goal: string
  initialJobId?: string
  onJobCreated?: (jobId: string) => void
}

export function MobiAdzExtraction({ onRecipientSelected, initialJobId, onJobCreated }: MobiAdzExtractionProps) {
  // Wrap the callback to enable auto-advance after successful extraction
  const handleRecipientsSelected = (recipients: CampaignRecipient[], count: number) => {
    // Auto-advance to Step 2 after extraction completes
    onRecipientSelected(recipients, count, true)
  }

  return (
    <MobiAdzExtractionContent
      onRecipientsSelected={handleRecipientsSelected}
      initialJobId={initialJobId}
      onJobCreated={onJobCreated}
    />
  )
}

export default MobiAdzExtraction