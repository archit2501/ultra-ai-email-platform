'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

interface ColumnMapperProps {
  csvData: string[][]
  onMappingConfirmed: (mapping: Record<string, string>, columnNames: string[]) => void
}

const AVAILABLE_COLUMNS = [
  { key: 'name', label: 'Name', required: false },
  { key: 'email', label: 'Email', required: true },
  { key: 'company', label: 'Company', required: false },
  { key: 'job_title', label: 'Job Title', required: false },
  { key: 'phone', label: 'Phone', required: false },
  { key: 'website', label: 'Website', required: false },
]

export function ColumnMapper({ csvData, onMappingConfirmed }: ColumnMapperProps) {
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [autoDetected, setAutoDetected] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<string[]>([])

  const csvHeaders = csvData[0] || []
  const csvSample = csvData.slice(1, 4)

  // Auto-detect columns on mount
  useEffect(() => {
    const detected = autoDetectColumns(csvHeaders)
    setAutoDetected(detected)
    setMapping(detected)
  }, [csvHeaders])

  // Validate mapping
  useEffect(() => {
    const newErrors: string[] = []
    const requiredColumns = AVAILABLE_COLUMNS.filter((col) => col.required)

    requiredColumns.forEach((col) => {
      if (!Object.values(mapping).includes(col.key)) {
        newErrors.push(`Missing required column: ${col.label}`)
      }
    })

    setErrors(newErrors)
  }, [mapping])

  const autoDetectColumns = (headers: string[]): Record<string, string> => {
    const detected: Record<string, string> = {}
    const lowerHeaders = headers.map((h) => h.toLowerCase().trim())

    AVAILABLE_COLUMNS.forEach((col) => {
      const headerIndex = lowerHeaders.findIndex((h) =>
        h.includes(col.key) || h.includes(col.label.toLowerCase())
      )
      if (headerIndex >= 0) {
        detected[headers[headerIndex]] = col.key
      }
    })

    return detected
  }

  const handleColumnChange = (csvHeader: string, fieldKey: string) => {
    setMapping((prev) => ({
      ...prev,
      [csvHeader]: fieldKey,
    }))
  }

  const isValid = errors.length === 0

  return (
    <div className="space-y-6 text-slate-100">
      <div>
        <h2 className="text-2xl font-bold mb-2 text-white">Map Columns</h2>
        <p className="text-slate-400">Tell us which CSV columns match which fields</p>
      </div>

      {/* Auto-detection notice */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <p className="text-sm text-slate-200">
          ✓ We've auto-detected column mappings. Review and adjust if needed.
        </p>
      </div>

      {/* Mapping Table */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60">
                <th className="text-left p-4 font-semibold text-white">CSV Column</th>
                <th className="text-left p-4 font-semibold text-white">Maps To</th>
                <th className="text-left p-4 font-semibold text-white">Sample Data</th>
              </tr>
            </thead>
            <tbody>
              {csvHeaders.map((header, idx) => (
                <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/60">
                  <td className="p-4">
                    <span className="font-medium text-white">{header}</span>
                  </td>
                  <td className="p-4">
                    <select
                      value={mapping[header] || ''}
                      onChange={(e) => handleColumnChange(header, e.target.value)}
                      className="rounded px-3 py-2 border border-slate-700 bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-100"
                    >
                      <option value="">-- Ignore --</option>
                      {AVAILABLE_COLUMNS.map((col) => (
                        <option key={col.key} value={col.key}>
                          {col.label} {col.required ? '*' : ''}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-4 text-sm text-slate-300">
                    {csvSample[0]?.[idx] || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-900/40 border border-red-800 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-200 mb-1">Issues found:</h3>
            <ul className="text-sm text-red-200 space-y-1">
              {errors.map((error, idx) => (
                <li key={idx}>• {error}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Preview */}
      <div>
        <h3 className="font-semibold text-white mb-3">Preview</h3>
        <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto border border-slate-800">
          <table className="text-sm w-full">
            <thead>
              <tr className="border-b border-slate-800">
                {Object.entries(mapping)
                  .filter(([_, value]) => value !== '')
                  .map(([csvHeader, fieldKey]) => (
                    <th key={csvHeader} className="text-left p-2 font-semibold text-white">
                      {AVAILABLE_COLUMNS.find((col) => col.key === fieldKey)?.label}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {csvSample.map((row, rowIdx) => (
                <tr key={rowIdx} className="border-b border-slate-800">
                  {Object.entries(mapping)
                    .filter(([_, value]) => value !== '')
                    .map(([csvHeader, _]) => {
                      const colIdx = csvHeaders.indexOf(csvHeader)
                      return (
                        <td key={csvHeader} className="p-2 text-slate-200">
                          {row[colIdx] || '-'}
                        </td>
                      )
                    })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions */}
      <div>
        <Button
          onClick={() => {
            const mappedColumns = csvHeaders.filter((h) => mapping[h])
            onMappingConfirmed(mapping, mappedColumns)
          }}
          disabled={!isValid}
          className="w-full"
        >
          Continue to Preview
        </Button>
      </div>
    </div>
  )
}
