"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Paperclip } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

import { documentStatuses } from "@/modules/documents/services/document-mock-data"
import type {
  Document,
  DocumentAttachment,
} from "@/modules/documents/services/types/document-types"
import { DataTableColumnHeader } from "./data-table-column-header"
import { DataTableRowActions } from "./data-table-row-actions"

function formatDate(value: unknown): string {
  if (!value) return "—"
  try {
    if (typeof value === "object" && value !== null && "toDate" in value) {
      return (value as { toDate: () => Date })
        .toDate()
        .toLocaleDateString("vi-VN")
    }
    const date = new Date(value as string)
    if (isNaN(date.getTime())) return "—"
    return date.toLocaleDateString("vi-VN")
  } catch {
    return "—"
  }
}

interface DocumentColumnActions {
  attachmentsMap?: Record<string, DocumentAttachment[]>
  canManage?: boolean
  onUpdateDocument?: (document: Document) => void | Promise<void>
  onDeleteDocument?: (documentId: string) => void | Promise<void>
  onFilesUploaded?: (documentId: string) => void | Promise<void>
}

export function getDocumentColumns({
  attachmentsMap,
  canManage = false,
  onUpdateDocument,
  onDeleteDocument,
  onFilesUploaded,
}: DocumentColumnActions = {}): ColumnDef<Document>[] {
  return [
    {
      id: "select",

      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px] cursor-pointer"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px] cursor-pointer"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "no",
      size: 60,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="No." />
      ),
      cell: ({ row, table }) => (
        <div className="w-12 text-center text-sm text-muted-foreground">
          {table.getState().pagination.pageIndex *
            table.getState().pagination.pageSize +
            row.index +
            1}
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tên tài liệu" />
      ),
      cell: ({ row }) => {
        const attachmentCount = attachmentsMap?.[row.original.id]?.length ?? 0

        return (
          <div className="flex items-center space-x-2">
            <span className="max-w-[400px] truncate font-medium">
              {row.getValue("name")}
            </span>
            {attachmentCount > 0 && (
              <span
                className="flex shrink-0 items-center gap-0.5 text-muted-foreground"
                title={`${attachmentCount} file đính kèm`}
              >
                <Paperclip className="h-3.5 w-3.5" />
                <span className="text-xs">{attachmentCount}</span>
              </span>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "status",
      size: 100,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Trạng thái" />
      ),
      cell: ({ row }) => {
        const status = documentStatuses.find(
          (s) => s.value === row.getValue("status")
        )

        if (!status) {
          return null
        }

        const statusColors: Record<string, string> = {
          draft: "border-yellow-500 text-yellow-700 dark:text-yellow-400",
          published: "border-green-500 text-green-700 dark:text-green-400",
        }

        return (
          <div className="flex w-25 items-center">
            {status.icon && (
              <status.icon className="mr-1.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            )}
            <Badge
              variant="outline"
              className={cn(
                "shrink-0 pl-1.5",
                statusColors[status.value as keyof typeof statusColors]
              )}
            >
              <span className="text-xs">{status.label}</span>
            </Badge>
          </div>
        )
      },
      enableResizing: false,
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      accessorKey: "createdBy",
      size: 140,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Người tạo" />
      ),
      cell: ({ row }) => (
        <div className="max-w-[160px] truncate text-sm">
          {(row.getValue("createdBy") as string) || "—"}
        </div>
      ),
    },
    {
      accessorKey: "createdDate",
      size: 120,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Ngày tạo" />
      ),
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {formatDate(row.getValue("createdDate"))}
        </div>
      ),
      sortingFn: (rowA, rowB) => {
        const a = new Date(
          (rowA.getValue("createdDate") as string) ?? 0
        ).getTime()
        const b = new Date(
          (rowB.getValue("createdDate") as string) ?? 0
        ).getTime()
        return a - b
      },
    },
    {
      id: "actions",
      size: 40,
      enableResizing: false,
      cell: ({ row }) => (
        <DataTableRowActions
          row={row}
          attachments={attachmentsMap?.[row.original.id]}
          canManage={canManage}
          onUpdateDocument={onUpdateDocument}
          onDeleteDocument={onDeleteDocument}
          onFilesUploaded={onFilesUploaded}
        />
      ),
    },
  ]
}

export const columns = getDocumentColumns()
