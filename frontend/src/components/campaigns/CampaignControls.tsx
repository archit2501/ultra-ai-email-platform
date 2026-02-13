'use client'

import { useState } from 'react'
import { Play, Pause, X, ChevronDown, ChevronUp, AlertCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type CampaignState = 'draft' | 'ready' | 'running' | 'paused' | 'completed' | 'cancelled'

export interface CampaignControlsData {
  state: CampaignState
  startedAt?: Date
  pausedAt?: Date
  totalSent: number
  totalRecipients: number
  currentBatch: number
  totalBatches: number
}

interface CampaignControlsProps {
  onStateChange: (state: CampaignState) => void
  campaignData?: Partial<CampaignControlsData>
}

export function CampaignControls({ onStateChange, campaignData }: CampaignControlsProps) {
  const [expanded, setExpanded] = useState(true)
  const [state, setState] = useState<CampaignState>(campaignData?.state || 'draft')
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmAction, setConfirmAction] = useState<CampaignState | null>(null)

  const data: CampaignControlsData = {
    state,
    totalSent: campaignData?.totalSent || 0,
    totalRecipients: campaignData?.totalRecipients || 1000,
    currentBatch: campaignData?.currentBatch || 0,
    totalBatches: campaignData?.totalBatches || 20,
  }

  const progress = data.totalRecipients > 0 ? (data.totalSent / data.totalRecipients) * 100 : 0

  const handleStateChange = (newState: CampaignState) => {
    if (['running', 'cancelled'].includes(newState)) {
      setConfirmAction(newState)
      setShowConfirm(true)
    } else {
      setState(newState)
      onStateChange(newState)
    }
  }

  const confirmStateChange = () => {
    if (confirmAction) {
      setState(confirmAction)
      onStateChange(confirmAction)
    }
    setShowConfirm(false)
    setConfirmAction(null)
  }

  const getStateColor = (s: CampaignState) => {
    switch (s) {
      case 'draft':
        return 'text-slate-400'
      case 'ready':
        return 'text-blue-400'
      case 'running':
        return 'text-green-400'
      case 'paused':
        return 'text-yellow-400'
      case 'completed':
        return 'text-emerald-400'
      case 'cancelled':
        return 'text-red-400'
      default:
        return 'text-slate-400'
    }
  }

  const getStateBg = (s: CampaignState) => {
    switch (s) {
      case 'draft':
        return 'bg-slate-700'
      case 'ready':
        return 'bg-blue-900'
      case 'running':
        return 'bg-green-900'
      case 'paused':
        return 'bg-yellow-900'
      case 'completed':
        return 'bg-emerald-900'
      case 'cancelled':
        return 'bg-red-900'
      default:
        return 'bg-slate-900'
    }
  }

  const isRunning = state === 'running'
  const isPaused = state === 'paused'
  const canStart = state === 'draft' || state === 'ready' || state === 'paused'
  const canPause = state === 'running'
  const canCancel = state === 'draft' || state === 'ready' || state === 'running' || state === 'paused'

  return (
    <div className="rounded-lg border-2 border-slate-800 bg-slate-900 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-6 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Play className={`w-5 h-5 ${getStateColor(state)}`} />
          <h4 className="text-lg font-bold text-white">Campaign Controls</h4>
          <span className={`text-sm font-semibold ml-2 px-3 py-1 rounded ${getStateBg(state)} ${getStateColor(state)}`}>
            {state.toUpperCase()}
          </span>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
      </button>

      {expanded && (
        <div className="px-6 pb-6 space-y-6">
          {/* State Indicator */}
          <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
            <p className="text-xs text-slate-400 mb-2">Campaign Status</p>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-2xl font-bold ${getStateColor(state)}`}>{state.toUpperCase()}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {state === 'draft' && 'Campaign is ready to configure'}
                  {state === 'ready' && 'Campaign ready to launch'}
                  {state === 'running' && 'Campaign is actively sending'}
                  {state === 'paused' && 'Campaign paused, can resume'}
                  {state === 'completed' && 'Campaign finished successfully'}
                  {state === 'cancelled' && 'Campaign cancelled'}
                </p>
              </div>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${getStateBg(state)}`}>
                {state === 'running' && <div className="w-12 h-12 rounded-full bg-green-500 animate-pulse" />}
                {state === 'paused' && <Pause className="w-8 h-8 text-yellow-400" />}
                {state === 'completed' && <Play className="w-8 h-8 text-emerald-400 rotate-90" />}
                {state === 'cancelled' && <X className="w-8 h-8 text-red-400" />}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {state === 'running' || state === 'completed' ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Send Progress</p>
                <p className="text-sm text-slate-400">
                  {data.totalSent} / {data.totalRecipients}
                </p>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-slate-500">
                {Math.round(progress)}% complete • Batch {data.currentBatch} of {data.totalBatches}
              </p>
            </div>
          ) : null}

          {/* Control Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              onClick={() => handleStateChange(state === 'paused' ? 'running' : 'running')}
              disabled={!canStart}
              className={`py-6 flex items-center justify-center gap-2 ${
                canStart
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              {state === 'paused' ? 'Resume' : 'Start'} Campaign
            </Button>

            <Button
              onClick={() => handleStateChange('paused')}
              disabled={!canPause}
              className={`py-6 flex items-center justify-center gap-2 ${
                canPause
                  ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Pause className="w-4 h-4" />
              Pause Campaign
            </Button>

            <Button
              onClick={() => handleStateChange('cancelled')}
              disabled={!canCancel}
              className={`py-6 flex items-center justify-center gap-2 ${
                canCancel
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              <X className="w-4 h-4" />
              Cancel Campaign
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <p className="text-xs text-slate-400 mb-1">Current Batch</p>
              <p className="text-2xl font-bold text-white">
                {data.currentBatch}/{data.totalBatches}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {data.totalBatches > 0
                  ? Math.round((data.currentBatch / data.totalBatches) * 100)
                  : 0}
                % batches sent
              </p>
            </div>
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Estimated Time
              </p>
              <p className="text-2xl font-bold text-white">
                {data.totalBatches - data.currentBatch > 0
                  ? `${(data.totalBatches - data.currentBatch) * 5}m`
                  : 'Complete'}
              </p>
              <p className="text-xs text-slate-500 mt-1">remaining at current pace</p>
            </div>
          </div>

          {/* State Transition Info */}
          {state === 'running' && (
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-1" />
              <div className="text-sm">
                <p className="text-green-300 font-semibold mb-1">Campaign in Progress</p>
                <p className="text-slate-400 text-xs">
                  Your campaign is actively sending emails. You can pause it at any time, but stopping it may affect your
                  sending statistics.
                </p>
              </div>
            </div>
          )}

          {state === 'paused' && (
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-1" />
              <div className="text-sm">
                <p className="text-yellow-300 font-semibold mb-1">Campaign Paused</p>
                <p className="text-slate-400 text-xs">
                  Resume to continue sending from the next batch. Emails in the current batch will complete before pausing.
                </p>
              </div>
            </div>
          )}

          {state === 'cancelled' && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-1" />
              <div className="text-sm">
                <p className="text-red-300 font-semibold mb-1">Campaign Cancelled</p>
                <p className="text-slate-400 text-xs">
                  This campaign has been stopped. You can start a new campaign or review the results of this one.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-lg border border-slate-700 max-w-md w-full p-6">
            <p className="text-lg font-bold text-white mb-2">
              {confirmAction === 'running' ? 'Start Campaign?' : 'Cancel Campaign?'}
            </p>
            <p className="text-sm text-slate-400 mb-6">
              {confirmAction === 'running'
                ? 'Once started, emails will be sent to all recipients according to your batch configuration.'
                : 'This will stop the campaign immediately. Are you sure?'}
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowConfirm(false)
                  setConfirmAction(null)
                }}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white"
              >
                Keep Editing
              </Button>
              <Button
                onClick={confirmStateChange}
                className={`flex-1 text-white ${
                  confirmAction === 'running'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {confirmAction === 'running' ? 'Start' : 'Cancel'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
