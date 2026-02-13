"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, X, Filter } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

// ========================================
// TYPES
// ========================================

export type FilterOperator =
  | "equals"
  | "notEquals"
  | "contains"
  | "notContains"
  | "startsWith"
  | "endsWith"
  | "greaterThan"
  | "lessThan"
  | "greaterThanOrEqual"
  | "lessThanOrEqual"
  | "in"
  | "notIn"
  | "between"
  | "isEmpty"
  | "isNotEmpty"

export type FilterFieldType = "text" | "number" | "date" | "select" | "boolean"

export interface FilterField {
  key: string
  label: string
  type: FilterFieldType
  options?: { label: string; value: string }[]
}

export interface FilterCondition {
  id: string
  field: string
  operator: FilterOperator
  value: any
}

export interface FilterGroup {
  id: string
  operator: "AND" | "OR"
  conditions: FilterCondition[]
  groups?: FilterGroup[]
}

// ========================================
// OPERATOR OPTIONS
// ========================================

const operatorsByType: Record<FilterFieldType, FilterOperator[]> = {
  text: ["equals", "notEquals", "contains", "notContains", "startsWith", "endsWith", "isEmpty", "isNotEmpty"],
  number: ["equals", "notEquals", "greaterThan", "lessThan", "greaterThanOrEqual", "lessThanOrEqual", "between"],
  date: ["equals", "notEquals", "greaterThan", "lessThan", "between"],
  select: ["equals", "notEquals", "in", "notIn"],
  boolean: ["equals"],
}

const operatorLabels: Record<FilterOperator, string> = {
  equals: "equals",
  notEquals: "does not equal",
  contains: "contains",
  notContains: "does not contain",
  startsWith: "starts with",
  endsWith: "ends with",
  greaterThan: "is greater than",
  lessThan: "is less than",
  greaterThanOrEqual: "is greater than or equal to",
  lessThanOrEqual: "is less than or equal to",
  in: "is one of",
  notIn: "is not one of",
  between: "is between",
  isEmpty: "is empty",
  isNotEmpty: "is not empty",
}

// ========================================
// FILTER CONDITION COMPONENT
// ========================================

interface FilterConditionRowProps {
  condition: FilterCondition
  fields: FilterField[]
  onUpdate: (condition: FilterCondition) => void
  onRemove: () => void
}

function FilterConditionRow({
  condition,
  fields,
  onUpdate,
  onRemove,
}: FilterConditionRowProps) {
  const selectedField = fields.find((f) => f.key === condition.field)
  const availableOperators = selectedField
    ? operatorsByType[selectedField.type]
    : []

  const needsValue = !["isEmpty", "isNotEmpty"].includes(condition.operator)

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-wrap items-center gap-2"
    >
      {/* Field Selector */}
      <Select
        value={condition.field}
        onValueChange={(value) => {
          const field = fields.find((f) => f.key === value)
          onUpdate({
            ...condition,
            field: value,
            operator: field ? operatorsByType[field.type][0] : "equals",
            value: "",
          })
        }}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select field..." />
        </SelectTrigger>
        <SelectContent>
          {fields.map((field) => (
            <SelectItem key={field.key} value={field.key}>
              {field.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Operator Selector */}
      {condition.field && (
        <Select
          value={condition.operator}
          onValueChange={(value) =>
            onUpdate({ ...condition, operator: value as FilterOperator })
          }
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableOperators.map((op) => (
              <SelectItem key={op} value={op}>
                {operatorLabels[op]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Value Input */}
      {condition.field && needsValue && (
        <>
          {selectedField?.type === "select" ? (
            <Select
              value={condition.value}
              onValueChange={(value) =>
                onUpdate({ ...condition, value })
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select value..." />
              </SelectTrigger>
              <SelectContent>
                {selectedField.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : selectedField?.type === "boolean" ? (
            <Select
              value={condition.value}
              onValueChange={(value) =>
                onUpdate({ ...condition, value })
              }
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">True</SelectItem>
                <SelectItem value="false">False</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Input
              type={selectedField?.type === "number" ? "number" : "text"}
              placeholder="Enter value..."
              value={condition.value}
              onChange={(e) =>
                onUpdate({ ...condition, value: e.target.value })
              }
              className="w-[180px]"
            />
          )}
        </>
      )}

      {/* Remove Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="h-9 w-9"
      >
        <X className="h-4 w-4" />
      </Button>
    </motion.div>
  )
}

// ========================================
// FILTER GROUP COMPONENT
// ========================================

interface FilterGroupComponentProps {
  group: FilterGroup
  fields: FilterField[]
  onUpdate: (group: FilterGroup) => void
  onRemove?: () => void
  isNested?: boolean
}

function FilterGroupComponent({
  group,
  fields,
  onUpdate,
  onRemove,
  isNested = false,
}: FilterGroupComponentProps) {
  const addCondition = () => {
    const newCondition: FilterCondition = {
      id: `condition-${Date.now()}`,
      field: "",
      operator: "equals",
      value: "",
    }
    onUpdate({
      ...group,
      conditions: [...group.conditions, newCondition],
    })
  }

  const updateCondition = (index: number, condition: FilterCondition) => {
    const newConditions = [...group.conditions]
    newConditions[index] = condition
    onUpdate({ ...group, conditions: newConditions })
  }

  const removeCondition = (index: number) => {
    onUpdate({
      ...group,
      conditions: group.conditions.filter((_, i) => i !== index),
    })
  }

  const toggleOperator = () => {
    onUpdate({
      ...group,
      operator: group.operator === "AND" ? "OR" : "AND",
    })
  }

  return (
    <Card
      className={cn(
        "p-4",
        isNested && "bg-muted/30 border-muted-foreground/20"
      )}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Button
              variant="outline"
              size="sm"
              onClick={toggleOperator}
              className="h-7 px-2"
            >
              <Badge
                variant={group.operator === "AND" ? "default" : "secondary"}
                className="text-xs"
              >
                {group.operator}
              </Badge>
            </Button>
            <span className="text-sm text-muted-foreground">
              Match {group.operator === "AND" ? "all" : "any"} conditions
            </span>
          </div>
          {onRemove && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="h-7 px-2"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Conditions */}
        <AnimatePresence>
          {group.conditions.map((condition, index) => (
            <FilterConditionRow
              key={condition.id}
              condition={condition}
              fields={fields}
              onUpdate={(c) => updateCondition(index, c)}
              onRemove={() => removeCondition(index)}
            />
          ))}
        </AnimatePresence>

        {/* Add Condition Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={addCondition}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Condition
        </Button>
      </div>
    </Card>
  )
}

// ========================================
// FILTER BUILDER COMPONENT
// ========================================

interface FilterBuilderProps {
  fields: FilterField[]
  value?: FilterGroup
  onChange?: (group: FilterGroup) => void
  className?: string
}

export function FilterBuilder({
  fields,
  value,
  onChange,
  className,
}: FilterBuilderProps) {
  const [group, setGroup] = React.useState<FilterGroup>(
    value || {
      id: "root",
      operator: "AND",
      conditions: [],
    }
  )

  React.useEffect(() => {
    if (value) {
      setGroup(value)
    }
  }, [value])

  const handleUpdate = (newGroup: FilterGroup) => {
    setGroup(newGroup)
    onChange?.(newGroup)
  }

  const getActiveFiltersCount = (g: FilterGroup): number => {
    return g.conditions.filter((c) => c.field && c.operator).length
  }

  const activeCount = getActiveFiltersCount(group)

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">Filters</h3>
          {activeCount > 0 && (
            <Badge variant="secondary">{activeCount} active</Badge>
          )}
        </div>
        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              handleUpdate({
                id: "root",
                operator: "AND",
                conditions: [],
              })
            }
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Filter Group */}
      <FilterGroupComponent
        group={group}
        fields={fields}
        onUpdate={handleUpdate}
      />
    </div>
  )
}

// ========================================
// FILTER SUMMARY COMPONENT
// ========================================

interface FilterSummaryProps {
  group: FilterGroup
  fields: FilterField[]
  onRemove?: (conditionId: string) => void
  className?: string
}

export function FilterSummary({
  group,
  fields,
  onRemove,
  className,
}: FilterSummaryProps) {
  const activeConditions = group.conditions.filter((c) => c.field && c.operator)

  if (activeConditions.length === 0) {
    return (
      <div className={cn("text-sm text-muted-foreground", className)}>
        No filters applied
      </div>
    )
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {activeConditions.map((condition) => {
        const field = fields.find((f) => f.key === condition.field)
        if (!field) return null

        return (
          <Badge
            key={condition.id}
            variant="secondary"
            className="gap-1 pr-1"
          >
            <span>
              {field.label} {operatorLabels[condition.operator]}
              {condition.value && ` "${condition.value}"`}
            </span>
            {onRemove && (
              <button
                onClick={() => onRemove(condition.id)}
                className="ml-1 rounded-sm hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        )
      })}
    </div>
  )
}
