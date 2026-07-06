"use client"

import { FileText, Trash2 } from "lucide-react"

import type { DocumentAttachment } from "@/modules/documents/services/types/document-types"
import { Button } from "@/components/ui/button"

interface DocumentAttachmentsProps {
  attachments: DocumentAttachment[]
  onDeleteFile?: (fileName: string) => void | Promise<void>
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const units = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const size = parseFloat((bytes / 1024 ** i).toFixed(1))
  return `${size} ${units[i]}`
}

export function DocumentAttachments({
  attachments,
  onDeleteFile,
}: DocumentAttachmentsProps) {
  if (attachments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        Chưa có file đính kèm nào.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">
        File đính kèm ({attachments.length})
      </p>
      <ul className="divide-y rounded-md border">
        {attachments.map((att) => (
          <li
            key={att.name}
            className="flex items-center justify-between gap-3 px-3 py-2"
          >
            <div className="flex min-w-0 items-center gap-2">
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              <a
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-sm font-medium hover:underline"
                title={att.name}
              >
                {att.name}
              </a>
              <span className="hidden whitespace-nowrap text-xs text-muted-foreground sm:inline">
                {formatFileSize(att.size)}
              </span>
            </div>

            {onDeleteFile ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 cursor-pointer text-muted-foreground hover:text-destructive"
                title="Xóa file"
                onClick={() => onDeleteFile(att.name)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  )
}