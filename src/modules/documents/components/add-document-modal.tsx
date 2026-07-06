"use client"

import { useCallback, useRef, useState } from "react"
import { AlertTriangle, FileText, Plus, Upload, X } from "lucide-react"
import { z } from "zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { documentStatuses } from "@/modules/documents/services/document-mock-data"
import { uploadFilesToDocument } from "@/modules/documents/services/document-file-services"
import {
  documentFormSchema,
  isExtensionAllowed,
  MAX_FILE_SIZE_BYTES,
  type Document,
  type DocumentAttachment,
  type DocumentFormData,
} from "@/modules/documents/services/types/document-types"

interface AddDocumentModalProps {
  /**
   * Create the document in Firestore. Should return the created document
   * (with its Firestore-assigned `id`) so the modal can transition into
   * the upload step and persist attachments under that id.
   */
  onAddDocument?: (
    document: Omit<Document, "id">
  ) => Promise<Document | void> | void
  trigger?: React.ReactNode
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

export function AddDocumentModal({
  onAddDocument,
  trigger,
}: AddDocumentModalProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<DocumentFormData>({
    name: "",
    status: "draft",
    summary: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  // After the document is created, transition into the upload step.
  const [createdDocument, setCreatedDocument] = useState<Document | null>(null)
  const [fileEntries, setFileEntries] = useState<FileEntry[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetState = useCallback(() => {
    setFormData({ name: "", status: "draft", summary: "" })
    setErrors({})
    setCreatedDocument(null)
    setFileEntries([])
    setIsUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }, [])

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && (isSubmitting || isUploading)) return
      if (!nextOpen) resetState()
      setOpen(nextOpen)
    },
    [isSubmitting, isUploading, resetState],
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const validatedData = documentFormSchema.parse(formData)

      // Firestore auto-generates the document ID via addDoc — do not assign one here.
      const newDocument: Omit<Document, "id"> = {
        name: validatedData.name,
        status: validatedData.status,
        summary: validatedData.summary ?? "",
      }

      const created = await onAddDocument?.(newDocument)

      if (created) {
        // Transition to the upload step within the same dialog.
        setCreatedDocument(created)
        toast.success("Tạo tài liệu thành công", {
          description: `Tài liệu "${created.name}" đã được tạo. Bạn có thể upload file đính kèm ngay bây giờ.`,
        })
      } else {
        // Caller didn't return the document — fall back to closing the dialog.
        toast.success("Tạo tài liệu thành công", {
          description: `Tài liệu "${newDocument.name}" đã được tạo.`,
        })
        resetState()
        setOpen(false)
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {}
        error.issues.forEach((issue) => {
          if (issue.path[0]) {
            newErrors[issue.path[0] as string] = issue.message
          }
        })
        setErrors(newErrors)
      } else {
        setErrors({
          root:
            error instanceof Error ? error.message : "Không thể tạo tài liệu",
        })
        toast.error("Lỗi khi tạo tài liệu", {
          description:
            error instanceof Error
              ? error.message
              : "Đã xảy ra lỗi không xác định.",
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    resetState()
    setOpen(false)
  }

  // File picker handlers for the upload step.
  const addFiles = useCallback((incoming: FileList | File[]) => {
    const newFiles = Array.from(incoming)
    setFileEntries((prev) => [
      ...prev,
      ...newFiles.map((file) => ({
        file,
        progress: 0,
        state: "pending" as const,
      })),
    ])
  }, [])

  const removeFileEntry = useCallback((index: number) => {
    setFileEntries((prev) => prev.filter((_, i) => i !== index))
  }, [])

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
    if (!createdDocument) return

    // Validate files
    const validationErrors: string[] = []
    setFileEntries((prev) =>
      prev.map((entry) => {
        const err = validateFile(entry.file)
        if (err) {
          validationErrors.push(err)
          return { ...entry, state: "error" as const, error: err }
        }
        return entry
      }),
    )

    if (validationErrors.length > 0) {
      toast.error("Có file không hợp lệ", {
        description: validationErrors[0],
      })
      return
    }

    setIsUploading(true)
    try {
      setFileEntries((prev) =>
        prev.map((e) => ({ ...e, state: "uploading" as const })),
      )

      await uploadFilesToDocument(
        createdDocument.id,
        fileEntries.map((e) => e.file),
        (fileName, pct) => {
          setFileEntries((prev) =>
            prev.map((e) =>
              e.file.name === fileName ? { ...e, progress: pct } : e,
            ),
          )
        },
      )

      setFileEntries((prev) =>
        prev.map((e) => ({ ...e, state: "success" as const, progress: 100 })),
      )

      const uploadedCount = fileEntries.length
      toast.success("Upload thành công", {
        description: `${uploadedCount} file đã được tải lên.`,
      })

      // Close after a short delay so the success state is visible.
      setTimeout(() => {
        resetState()
        setOpen(false)
      }, 600)
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
  }, [createdDocument, fileEntries, resetState])

  const handleSkipUpload = useCallback(() => {
    resetState()
    setOpen(false)
  }, [resetState])

  const pendingCount = fileEntries.filter(
    (e) => e.state === "pending",
  ).length

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            type="button"
            variant="default"
            size="sm"
            className="cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Thêm tài liệu
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-131.25">
        {createdDocument ? (
          // Step 2: upload files for the newly created document
          <>
            <DialogHeader>
              <DialogTitle>Upload file đính kèm</DialogTitle>
              <DialogDescription>
                Tài liệu{" "}
                <span className="font-semibold text-foreground">
                  &ldquo;{createdDocument.name}&rdquo;
                </span>{" "}
                đã được tạo. Bạn có thể upload file đính kèm ngay bây giờ hoặc
                bỏ qua để thêm sau.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Drop zone */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors hover:border-primary/50 hover:bg-muted/30"
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Kéo thả file vào đây hoặc{" "}
                  <span className="font-medium text-primary">chọn file</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Hỗ trợ: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, CSV, TXT, …
                </p>
              </div>

              <input
                ref={fileInputRef}
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
                <AttachmentGroup className="max-h-[200px] flex-col overflow-y-auto">
                  {fileEntries.map((entry, idx) => {
                    const stateMap: Record<FileEntry["state"], "idle" | "uploading" | "error" | "done"> = {
                      pending: "idle",
                      uploading: "uploading",
                      error: "error",
                      success: "done",
                    }
                    return (
                      <Attachment
                        key={`${entry.file.name}-${idx}`}
                        size="sm"
                        state={stateMap[entry.state]}
                        className="w-full"
                      >
                        <AttachmentMedia>
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        </AttachmentMedia>
                        <AttachmentContent>
                          <AttachmentTitle>{entry.file.name}</AttachmentTitle>
                          <AttachmentDescription>
                            {formatFileSize(entry.file.size)}
                            {entry.state === "error"
                              ? ` — ${entry.error}`
                              : entry.state === "uploading" || entry.state === "success"
                                ? ` · ${entry.progress}%`
                                : ""}
                          </AttachmentDescription>
                          {entry.state === "uploading" || entry.state === "success" ? (
                            <Progress className="mt-1 h-1.5" value={entry.progress} />
                          ) : null}
                        </AttachmentContent>
                        {!isUploading || entry.state === "pending" ? (
                          <AttachmentActions>
                            <AttachmentAction
                              aria-label={`Xóa ${entry.file.name}`}
                              onClick={() => removeFileEntry(idx)}
                            >
                              <X className="h-4 w-4" />
                            </AttachmentAction>
                          </AttachmentActions>
                        ) : null}
                      </Attachment>
                    )
                  })}
                </AttachmentGroup>
              ) : null}

              {fileEntries.some((e) => e.state === "error") ? (
                <div className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    Một hoặc nhiều file không hợp lệ. Kiểm tra lại định dạng.
                  </span>
                </div>
              ) : null}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleSkipUpload}
                className="cursor-pointer"
                disabled={isUploading}
              >
                Bỏ qua
              </Button>
              <Button
                type="button"
                onClick={handleUpload}
                disabled={pendingCount === 0 || isUploading}
                className="cursor-pointer"
              >
                <Upload className="mr-2 h-4 w-4" />
                {isUploading
                  ? "Đang tải lên..."
                  : `Upload ${pendingCount} file`}
              </Button>
            </DialogFooter>
          </>
        ) : (
          // Step 1: collect document info
          <>
            <DialogHeader>
              <DialogTitle>Thêm tài liệu mới</DialogTitle>
              <DialogDescription>
                Tạo tài liệu mới để quản lý nội dung. Điền thông tin bên dưới.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              {errors.root ? (
                <p className="text-sm text-destructive">{errors.root}</p>
              ) : null}

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="doc-name">
                  Tên tài liệu <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="doc-name"
                  placeholder="Nhập tên tài liệu..."
                  maxLength={100}
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className={errors.name ? "border-destructive" : ""}
                />
                <div className="flex items-center justify-between">
                  {errors.name ? (
                    <p className="text-sm text-destructive">{errors.name}</p>
                  ) : (
                    <span />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {formData.name.length}/100
                  </span>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="doc-status">Trạng thái</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "draft" | "published") =>
                    setFormData((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        <div className="flex items-center">
                          {status.icon && (
                            <status.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                          )}
                          {status.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Summary */}
              <div className="space-y-2">
                <Label htmlFor="doc-summary">Tóm tắt</Label>
                <Textarea
                  id="doc-summary"
                  placeholder="Nhập tóm tắt tài liệu (không bắt buộc)..."
                  value={formData.summary ?? ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      summary: e.target.value,
                    }))
                  }
                  rows={4}
                />
              </div>

              {/* Action Buttons */}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  className="cursor-pointer"
                  disabled={isSubmitting}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  className="cursor-pointer"
                  disabled={isSubmitting}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {isSubmitting ? "Đang tạo..." : "Tạo tài liệu"}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}