'use client'

import { useState } from 'react'
import { Package, Clock, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export interface BatchConfig {
  batchSize: number
  totalBatches: number
  interBatchDelay: number // minutes
  totalRecipients: number
  estimatedDuration: number // minutes
}

interface BatchConfigurationProps {
  totalRecipients: number
  onBatchConfigChange: (config: BatchConfig) => void
  defaultBatchSize?: number
}

export function BatchConfiguration({ totalRecipients, onBatchConfigChange, defaultBatchSize = 50 }: BatchConfigurationProps) {
  const [expanded, setExpanded] = useState(true)
  const [batchSize, setBatchSize] = useState(defaultBatchSize)
  const [interBatchDelay, setInterBatchDelay] = useState(5) // minutes

  const totalBatches = Math.ceil(totalRecipients / batchSize)
  const estimatedDuration = (totalBatches - 1) * interBatchDelay + (totalBatches * 1) // 1 minute per batch for sending

  const config: BatchConfig = {
    batchSize,
    totalBatches,
    interBatchDelay,
    totalRecipients,
    estimatedDuration,
  }

  const handleUpdate = (newBatchSize: number, newDelay: number) => {
    setBatchSize(newBatchSize)
    setInterBatchDelay(newDelay)
    onBatchConfigChange({
      ...config,
      batchSize: newBatchSize,
      interBatchDelay: newDelay,
      totalBatches: Math.ceil(totalRecipients / newBatchSize),
      estimatedDuration: (Math.ceil(totalRecipients / newBatchSize) - 1) * newDelay + (Math.ceil(totalRecipients / newBatchSize) * 1),
    })
  }

  // Generate batch timeline
  const batches = Array.from({ length: totalBatches }, (_, i) => ({
    batchNum: i + 1,
    recipients: Math.min(batchSize, totalRecipients - i * batchSize),
    startTime: i * interBatchDelay,
    endTime: i * interBatchDelay + 1,
  }))

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) return `${hours}h ${mins}m`
    return `${mins}m`
  }

  return (
    <div className="rounded-lg border-2 border-slate-800 bg-slate-900 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-6 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Package className="w-5 h-5 text-purple-400" />
          <h4 className="text-lg font-bold text-white">Batch Configuration</h4>
          <span className="text-sm text-slate-400 ml-2">
            {totalBatches} batches • {formatDuration(estimatedDuration)}
          </span>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
      </button>

      {expanded && (
        <div className="px-6 pb-6 space-y-6">
          {/* Configuration Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Batch Size</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="10"
                  max="500"
                  value={batchSize}
                  onChange={(e) => handleUpdate(Math.max(10, parseInt(e.target.value) || 50), interBatchDelay)}
                  className="flex-1 bg-slate-800 border-slate-700 text-white"
                />
                <span className="text-sm text-slate-400">recipients/batch</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Recommended: 50-100 for stable delivery</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">Inter-Batch Delay</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  max="60"
                  value={interBatchDelay}
                  onChange={(e) => handleUpdate(batchSize, Math.max(1, parseInt(e.target.value) || 5))}
                  className="flex-1 bg-slate-800 border-slate-700 text-white"
                />
                <span className="text-sm text-slate-400">minutes</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Wait between batches to maintain reputation</p>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <p className="text-xs text-slate-400 mb-1">Total Batches</p>
              <p className="text-2xl font-bold text-white">{totalBatches}</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <p className="text-xs text-slate-400 mb-1">Recipients/Batch</p>
              <p className="text-2xl font-bold text-blue-400">{batchSize}</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <p className="text-xs text-slate-400 mb-1">Est. Total Time</p>
              <p className="text-2xl font-bold text-green-400">{formatDuration(estimatedDuration)}</p>
            </div>
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <p className="text-xs text-slate-400 mb-1">Wait Between</p>
              <p className="text-2xl font-bold text-purple-400">{interBatchDelay}m</p>
            </div>
          </div>

          {/* Timeline Preview */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-white">Batch Timeline Preview</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {batches.slice(0, 10).map((batch) => (
                <div
                  key={batch.batchNum}
                  className="p-3 rounded-lg bg-slate-800/30 border border-slate-700 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="px-2 py-1 rounded bg-purple-500/20 text-purple-400 text-xs font-semibold">
                      Batch {batch.batchNum}
                    </div>
                    <span className="text-sm text-slate-300">{batch.recipients} recipients</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span className="text-slate-400">
                      +{batch.startTime}m to +{batch.endTime}m
                    </span>
                  </div>
                </div>
              ))}
              {totalBatches > 10 && (
                <div className="text-center py-2 text-sm text-slate-500">
                  +{totalBatches - 10} more batches...
                </div>
              )}
            </div>
          </div>

          {/* Batch Timing Visualization */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-white">Send Schedule</p>
            <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Now</span>
                <span>+{formatDuration(estimatedDuration)}</span>
              </div>
              <div className="flex gap-0.5 h-8">
                {batches.map((batch, idx) => {
                  const percentWidth = (batch.recipients / totalRecipients) * 100
                  return (
                    <div
                      key={idx}
                      className="bg-gradient-to-r from-purple-500 to-purple-400 hover:from-purple-400 hover:to-purple-300 transition-colors rounded-sm"
                      style={{ width: `${percentWidth}%`, minWidth: '2px' }}
                      title={`Batch ${batch.batchNum}: ${batch.recipients} recipients`}
                    />
                  )
                })}
              </div>
              <div className="text-xs text-slate-500 mt-2">
                Each segment = 1 batch (~{Math.round((estimatedDuration / totalBatches) * 10) / 10}m per batch)
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-1" />
            <div className="text-sm">
              <p className="text-blue-300 font-semibold mb-1">Batch Configuration Tips</p>
              <ul className="text-slate-400 text-xs space-y-1">
                <li>• Smaller batches (30-50) = better reputation, longer send time</li>
                <li>• Larger batches (100+) = faster send, higher bounce risk</li>
                <li>• Delay 5-10 min between batches for optimal deliverability</li>
                <li>• Total time: {formatDuration(estimatedDuration)} with current settings</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
