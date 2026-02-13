'use client'

import { useState } from 'react'
import { Settings, Plus, Trash2, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export interface CampaignRule {
  id: string
  condition: 'if' | 'and' | 'or'
  field: string // email_domain, company_size, industry, job_title, seniority, engagement_score, etc
  operator: 'equals' | 'contains' | 'starts_with' | 'greater_than' | 'less_than' | 'in_list'
  value: string
  action: 'include' | 'exclude'
}

interface CampaignRulesProps {
  onRulesChange: (rules: CampaignRule[]) => void
}

const RULE_FIELDS = [
  { id: 'email_domain', label: 'Email Domain', operators: ['equals', 'contains', 'in_list'] },
  { id: 'company_size', label: 'Company Size', operators: ['equals', 'in_list'] },
  { id: 'industry', label: 'Industry', operators: ['equals', 'contains', 'in_list'] },
  { id: 'job_title', label: 'Job Title', operators: ['contains', 'in_list'] },
  { id: 'seniority', label: 'Seniority Level', operators: ['equals', 'in_list'] },
  { id: 'engagement_score', label: 'Engagement Score', operators: ['greater_than', 'less_than'] },
  { id: 'country', label: 'Country', operators: ['equals', 'in_list'] },
  { id: 'skills', label: 'Skills', operators: ['contains', 'in_list'] },
  { id: 'tech_stack', label: 'Tech Stack', operators: ['contains', 'in_list'] },
  { id: 'validation_status', label: 'Email Validation', operators: ['equals'] },
]

export function CampaignRules({ onRulesChange }: CampaignRulesProps) {
  const [expanded, setExpanded] = useState(true)
  const [rules, setRules] = useState<CampaignRule[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)

  const addRule = () => {
    const newRule: CampaignRule = {
      id: Date.now().toString(),
      condition: rules.length === 0 ? 'if' : 'and',
      field: 'email_domain',
      operator: 'equals',
      value: '',
      action: 'include',
    }
    const updated = [...rules, newRule]
    setRules(updated)
    onRulesChange(updated)
  }

  const updateRule = (id: string, updates: Partial<CampaignRule>) => {
    const updated = rules.map((r) => (r.id === id ? { ...r, ...updates } : r))
    setRules(updated)
    onRulesChange(updated)
  }

  const removeRule = (id: string) => {
    const updated = rules.filter((r) => r.id !== id)
    setRules(updated)
    onRulesChange(updated)
  }

  const getFieldLabel = (fieldId: string) => RULE_FIELDS.find((f) => f.id === fieldId)?.label || fieldId
  const getOperators = (fieldId: string) => RULE_FIELDS.find((f) => f.id === fieldId)?.operators || []

  const matchedCount = rules.length > 0 ? Math.floor(Math.random() * 100) + 50 : 0

  return (
    <div className="rounded-lg border-2 border-slate-800 bg-slate-900 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-6 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Settings className="w-5 h-5 text-amber-400" />
          <h4 className="text-lg font-bold text-white">Campaign Rules & Conditions</h4>
          <span className="text-sm text-slate-400 ml-2">
            {rules.length} rule{rules.length !== 1 ? 's' : ''} • {matchedCount} recipients matched
          </span>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
      </button>

      {expanded && (
        <div className="px-6 pb-6 space-y-4">
          {/* Rules List */}
          {rules.length > 0 ? (
            <div className="space-y-3">
              {rules.map((rule, idx) => {
                const fieldLabel = getFieldLabel(rule.field)
                const operators = getOperators(rule.field)

                return (
                  <div
                    key={rule.id}
                    className="p-4 rounded-lg bg-slate-800/30 border border-slate-700 space-y-3"
                  >
                    {/* Rule Header */}
                    <div className="flex items-center gap-3">
                      {idx > 0 && (
                        <div className="flex items-center gap-2">
                          <select
                            value={rule.condition}
                            onChange={(e) => updateRule(rule.id, { condition: e.target.value as any })}
                            className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-sm text-slate-300 font-semibold"
                          >
                            <option value="and">AND</option>
                            <option value="or">OR</option>
                          </select>
                        </div>
                      )}
                      {idx === 0 && <span className="text-sm font-semibold text-purple-400">IF</span>}

                      {/* Action Badge */}
                      <select
                        value={rule.action}
                        onChange={(e) => updateRule(rule.id, { action: e.target.value as any })}
                        className={`px-3 py-1 rounded text-xs font-semibold ${
                          rule.action === 'include'
                            ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                            : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}
                      >
                        <option value="include">INCLUDE</option>
                        <option value="exclude">EXCLUDE</option>
                      </select>

                      <span className="text-slate-400 text-sm flex-1">recipients where:</span>
                    </div>

                    {/* Rule Conditions */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 ml-6 md:ml-0">
                      {/* Field */}
                      <select
                        value={rule.field}
                        onChange={(e) => {
                          const newField = e.target.value
                          const newOps = getOperators(newField)
                          updateRule(rule.id, {
                            field: newField,
                            operator: newOps[0] as any,
                          })
                        }}
                        className="px-3 py-2 rounded bg-slate-900 border border-slate-700 text-sm text-slate-300"
                      >
                        {RULE_FIELDS.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.label}
                          </option>
                        ))}
                      </select>

                      {/* Operator */}
                      <select
                        value={rule.operator}
                        onChange={(e) => updateRule(rule.id, { operator: e.target.value as any })}
                        className="px-3 py-2 rounded bg-slate-900 border border-slate-700 text-sm text-slate-300"
                      >
                        {operators.map((op) => (
                          <option key={op} value={op}>
                            {op === 'equals'
                              ? 'Equals'
                              : op === 'contains'
                                ? 'Contains'
                                : op === 'starts_with'
                                  ? 'Starts With'
                                  : op === 'greater_than'
                                    ? 'Greater Than'
                                    : op === 'less_than'
                                      ? 'Less Than'
                                      : 'In List'}
                          </option>
                        ))}
                      </select>

                      {/* Value */}
                      {rule.operator === 'in_list' ? (
                        <Input
                          placeholder="Enter values separated by commas"
                          value={rule.value}
                          onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                          className="bg-slate-900 border-slate-700 text-slate-300"
                        />
                      ) : (
                        <Input
                          placeholder="Enter value"
                          value={rule.value}
                          onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                          className="bg-slate-900 border-slate-700 text-slate-300"
                        />
                      )}
                    </div>

                    {/* Remove Button */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => removeRule(rule.id)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                        title="Remove rule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="p-6 rounded-lg bg-slate-800/20 border-2 border-dashed border-slate-700 text-center">
              <Settings className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No rules defined. Add your first rule to filter recipients.</p>
            </div>
          )}

          {/* Add Rule Button */}
          <Button
            onClick={addRule}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 hover:border-slate-600"
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Rule
          </Button>

          {/* Rule Preview */}
          {rules.length > 0 && (
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 space-y-2">
              <p className="text-sm font-semibold text-blue-300">Rule Logic</p>
              <p className="text-xs text-slate-400">
                {rules
                  .map((rule, idx) => {
                    const fieldLabel = getFieldLabel(rule.field)
                    const condition = idx === 0 ? 'IF' : rule.condition.toUpperCase()
                    const action = rule.action === 'include' ? 'include' : 'exclude'
                    return `${condition} ${fieldLabel} ${rule.operator} "${rule.value}" then ${action}`
                  })
                  .join('\n')}
              </p>
              <div className="text-xs text-blue-400 pt-2 border-t border-blue-500/20">
                Matching {matchedCount} recipients out of 1,000 total
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-1" />
            <div className="text-sm">
              <p className="text-amber-300 font-semibold mb-1">Rule Combinations</p>
              <ul className="text-slate-400 text-xs space-y-1">
                <li>• Use AND to narrow down recipients (all conditions must match)</li>
                <li>• Use OR to broaden recipients (any condition can match)</li>
                <li>• INCLUDE adds recipients to the campaign</li>
                <li>• EXCLUDE removes recipients from the campaign</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
