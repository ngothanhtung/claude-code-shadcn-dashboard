"use client"

import type { ColumnDef } from "@tanstack/react-table"

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

interface DocumentColumnActions {
  attachmentsMap?: Record<string, DocumentAttachment[]>
  onUpdateDocument?: (document: Document) => void | Promise<void>
  onDeleteDocument?: (documentId: string) => void | Promise<void>
  onDeleteFile?: (documentId: string, fileName: string) => void | Promise<void>
  onFilesUploaded?: (documentId: string) => void | Promise<void>
}

export function getDocumentColumns({
  attachmentsMap,
  onUpdateDocument,
  onDeleteDocument,
  onDeleteFile,
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
      accessorKey: "id",
      size: 80,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="ID" />
      ),
      cell: ({ row }) => (
        <div className="w-20 truncate font-mono text-sm">
          {row.getValue("id")}
        </div>
      ),
      enableHiding: false,
      enableResizing: true,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tên tài liệu" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex space-x-2">
            <span className="max-w-[400px] truncate font-medium">
              {row.getValue("name")}
            </span>
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
      id: "actions",
      size: 40,
      enableResizing: false,
      cell: ({ row }) => (
        <DataTableRowActions
          row={row}
          attachments={attachmentsMap?.[row.original.id]}
          onUpdateDocument={onUpdateDocument}
          onDeleteDocument={onDeleteDocument}
          onDeleteFile={onDeleteFile}
          onFilesUploaded={onFilesUploaded}
        />
      ),
    },
  ]
}

export const columns = getDocumentColumns()
