'use client'

import { ExtractionContent } from '@/components/extraction/ExtractionContent'
import { CampaignRecipient } from '@/types'

interface ULTRAExtractionProps {
  onRecipientSelected: (recipients: CampaignRecipient[], count: number, autoAdvance?: boolean) => void
  goal: string
  initialJobId?: string
  onJobCreated?: (jobId: string) => void
}

export function ULTRAExtraction({ onRecipientSelected, initialJobId, onJobCreated }: ULTRAExtractionProps) {
  // Wrap the callback to enable auto-advance after successful extraction
  const handleRecipientsSelected = (recipients: CampaignRecipient[], count: number) => {
    // Auto-advance to Step 2 after extraction completes
    onRecipientSelected(recipients, count, true)
  }

  return (
    <ExtractionContent
      onRecipientsSelected={handleRecipientsSelected}
      initialJobId={initialJobId ? Number(initialJobId) : undefined}
      onJobCreated={(id) => onJobCreated?.(id.toString())}
    />
  )
}
