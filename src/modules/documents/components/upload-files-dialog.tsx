"use client"

import { useCallback, useRef, useState } from "react"
import { AlertTriangle, Upload, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"

import {
  MAX_FILE_SIZE_BYTES,
  isExtensionAllowed,
  type DocumentAttachment,
} from "@/modules/documents/services/types/document-types"
import { uploadFilesToDocument } from "@/modules/documents/services/document-file-services"

interface UploadFilesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentId: string
  onUploaded?: (attachments: DocumentAttachment[]) => void
}

interface FileEntry {
  file: File
  progress: number
  state: "pending" | "uploading" | "success" | "error"
  error?: string
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const units = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const size = parseFloat((bytes / 1024 ** i).toFixed(1))
  return `${size} ${units[i]}`
}

function validateFile(file: File): string | null {
  if (!isExtensionAllowed(file.name)) {
    return `Định dạng "${file.name.split(".").pop() ?? "unknown"}" không được phép.`
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `File "${file.name}" vượt quá ${formatFileSize(MAX_FILE_SIZE_BYTES)}.`
  }
  return null
}

export function UploadFilesDialog({
  open,
  onOpenChange,
  documentId,
  onUploaded,
}: UploadFilesDialogProps) {
  const [fileEntries, setFileEntries] = useState<FileEntry[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const reset = useCallback(() => {
    setFileEntries([])
    setIsUploading(false)
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }, [])

  const handleClose = useCallback(
    (value: boolean) => {
      if (!isUploading) {
        reset()
      }
      onOpenChange(value)
    },
    [isUploading, onOpenChange, reset],
  )

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const newFiles = Array.from(incoming)
    setFileEntries((prev) => [
      ...prev,
      ...newFiles.map((file) => ({ file, progress: 0, state: "pending" as const })),
    ])
  }, [])

  const removeFileEntry = useCallback(
    (index: number) => {
      setFileEntries((prev) => prev.filter((_, i) => i !== index))
    },
    [],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files)
      }
    },
    [addFiles],
  )

  const handleUpload = useCallback(async () => {
    // Validate
    const validatedEntries: FileEntry[] = []
    const validationErrors: string[] = []

    for (const entry of fileEntries) {
      const err = validateFile(entry.file)
      if (err) {
        validationErrors.push(err)
        validatedEntries.push({ ...entry, state: "error" as const, error: err })
      } else {
        validatedEntries.push(entry)
      }
    }

    if (validationErrors.length > 0) {
      setFileEntries(validatedEntries)
      toast.error("Có file không hợp lệ", {
        description: validationErrors[0],
      })
      return
    }

    setIsUploading(true)

    try {
      const filesToUpload = fileEntries.map((e) => e.file)

      // Update all states to uploading
      setFileEntries((prev) =>
        prev.map((e) => ({ ...e, state: "uploading" as const })),
      )

      await uploadFilesToDocument(documentId, filesToUpload, (fileName, pct) => {
        setFileEntries((prev) =>
          prev.map((e) =>
            e.file.name === fileName ? { ...e, progress: pct } : e,
          ),
        )
      })

      // Mark all as success
      setFileEntries((prev) =>
        prev.map((e) => ({ ...e, state: "success" as const, progress: 100 })),
      )

      const uploadedCount = filesToUpload.length
      toast.success("Upload thành công", {
        description: `${uploadedCount} file đã được tải lên.`,
      })

      // Notify parent so it can re-fetch attachments
      onUploaded?.([])
      handleClose(false)
    } catch (err) {
      setFileEntries((prev) =>
        prev.map((e) =>
          e.state === "uploading"
            ? { ...e, state: "error" as const, error: "Lỗi upload" }
            : e,
        ),
      )
      toast.error("Lỗi khi upload file", {
        description:
          err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định.",
      })
    } finally {
      setIsUploading(false)
    }
  }, [documentId, fileEntries, handleClose, onUploaded])

  const pendingCount = fileEntries.filter(
    (e) => e.state === "pending",
  ).length

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Upload file đính kèm</DialogTitle>
          <DialogDescription>
            Chọn hoặc kéo thả các file. Chỉ chấp nhận tài liệu văn bản (PDF,
            DOC, DOCX, XLS, XLSX, PPT, PPTX, …) — tối đa 20 MB/file.
          </DialogDescription>
        </DialogHeader>

        {/* Drop zone */}
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors hover:border-primary/50 hover:bg-muted/30"
        >
          <Upload className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Kéo thả file vào đây hoặc <span className="font-medium text-primary">chọn file</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Hỗ trợ: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, CSV, TXT, …
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple
          title="Chọn file đính kèm"
          aria-label="Chọn file đính kèm"
          className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.odp,.rtf,.txt,.md,.csv,.json,.xml"
          onChange={(e) => {
            if (e.target.files?.length) {
              addFiles(e.target.files)
              e.target.value = ""
            }
          }}
        />

        {/* File list */}
        {fileEntries.length > 0 ? (
          <ul className="max-h-[200px] space-y-2 overflow-y-auto">
            {fileEntries.map((entry, idx) => (
              <li
                key={`${entry.file.name}-${idx}`}
                className="flex items-center gap-2 rounded-md border px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {entry.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(entry.file.size)}
                    {entry.state === "error" ? (
                      <span className="ml-2 text-destructive">
                        — {entry.error}
                      </span>
                    ) : entry.state === "uploading" || entry.state === "success" ? (
                      <span className="ml-2 text-primary">
                        {entry.progress}%
                      </span>
                    ) : null}
                  </p>
                  {entry.state === "uploading" || entry.state === "success" ? (
                    <Progress
                      className="mt-1 h-1.5"
                      value={entry.progress}
                    />
                  ) : null}
                </div>
                {!isUploading || entry.state === "pending" ? (
                  <button
                    type="button"
                    title="Xóa file"
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                    onClick={() => removeFileEntry(idx)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}

        {fileEntries.some((e) => e.state === "error") ? (
          <div className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Một hoặc nhiều file không hợp lệ. Kiểm tra lại định dạng.</span>
          </div>
        ) : null}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={isUploading}
          >
            Hủy
          </Button>
          <Button
            onClick={handleUpload}
            disabled={pendingCount === 0 || isUploading}
            className="cursor-pointer"
          >
            <Upload className="mr-2 h-4 w-4" />
            {isUploading ? "Đang tải lên..." : `Upload ${pendingCount} file`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}