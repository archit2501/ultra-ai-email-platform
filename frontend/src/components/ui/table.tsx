import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"

// Table variants
const tableVariants = cva("w-full caption-bottom text-sm", {
  variants: {
    variant: {
      default: "",
      striped: "[&_tbody>tr:nth-child(odd)]:bg-muted/50",
      bordered: "border border-border",
      glass: "glass border border-white/10",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

export interface TableProps
  extends React.HTMLAttributes<HTMLTableElement>,
    VariantProps<typeof tableVariants> {
  stickyHeader?: boolean
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, variant, stickyHeader, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
      <table
        ref={ref}
        className={cn(tableVariants({ variant, className }))}
        {...props}
      />
    </div>
  )
)
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement> & { sticky?: boolean }
>(({ className, sticky, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(
      "border-b border-border bg-muted/50",
      sticky && "sticky top-0 z-10 bg-background shadow-sm",
      className
    )}
    {...props}
  />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t border-border bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const tableRowVariants = cva(
  "border-b border-border transition-colors",
  {
    variants: {
      variant: {
        default: "hover:bg-muted/50 data-[state=selected]:bg-muted",
        interactive: "cursor-pointer hover:bg-accent/50 active:bg-accent",
        success: "bg-success/10 hover:bg-success/20",
        warning: "bg-warning/10 hover:bg-warning/20",
        error: "bg-error/10 hover:bg-error/20",
        info: "bg-info/10 hover:bg-info/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface TableRowProps
  extends React.HTMLAttributes<HTMLTableRowElement>,
    VariantProps<typeof tableRowVariants> {}

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, variant, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(tableRowVariants({ variant, className }))}
      {...props}
    />
  )
)
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement> & {
    sortable?: boolean
    sortDirection?: "asc" | "desc" | null
    onSort?: () => void
  }
>(({ className, sortable, sortDirection, onSort, children, ...props }, ref) => {
  const SortIcon = sortDirection === "asc"
    ? ArrowUp
    : sortDirection === "desc"
    ? ArrowDown
    : ChevronsUpDown

  return (
    <th
      ref={ref}
      className={cn(
        "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
        sortable && "cursor-pointer select-none hover:text-foreground transition-colors",
        className
      )}
      onClick={sortable ? onSort : undefined}
      {...props}
    >
      {sortable ? (
        <div className="flex items-center gap-2">
          {children}
          <SortIcon className={cn(
            "h-4 w-4 flex-shrink-0 transition-opacity",
            sortDirection ? "opacity-100" : "opacity-50"
          )} />
        </div>
      ) : (
        children
      )}
    </th>
  )
})
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

// Loading Skeleton Row
export interface TableSkeletonProps {
  rows?: number
  columns?: number
}

const TableSkeleton: React.FC<TableSkeletonProps> = ({ rows = 5, columns = 4 }) => (
  <>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <TableRow key={rowIndex}>
        {Array.from({ length: columns }).map((_, colIndex) => (
          <TableCell key={colIndex}>
            <div className="h-4 bg-muted rounded animate-pulse" />
          </TableCell>
        ))}
      </TableRow>
    ))}
  </>
)

// Empty State
export interface TableEmptyProps {
  colSpan?: number
  message?: string
  icon?: React.ReactNode
}

const TableEmpty: React.FC<TableEmptyProps> = ({
  colSpan = 4,
  message = "No data available",
  icon
}) => (
  <TableRow>
    <TableCell colSpan={colSpan} className="h-24 text-center">
      <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
        {icon && <div className="text-muted-foreground/50">{icon}</div>}
        <p>{message}</p>
      </div>
    </TableCell>
  </TableRow>
)

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  TableSkeleton,
  TableEmpty,
}
