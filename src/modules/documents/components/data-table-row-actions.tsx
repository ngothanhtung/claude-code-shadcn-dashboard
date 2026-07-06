"use client"

import * as React from "react"
import type { Row } from "@tanstack/react-table"
import { AlertTriangle, Download, Eye, FileText, MoreHorizontal, Upload } from "lucide-react"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { documentStatuses } from "@/modules/documents/services/document-mock-data"
import {
  documentSchema,
  type Document,
  type DocumentAttachment,
} from "@/modules/documents/services/types/document-types"
import { DocumentAttachments } from "./document-attachments"
import { UploadFilesDialog } from "./upload-files-dialog"

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const units = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const size = parseFloat((bytes / 1024 ** i).toFixed(1))
  return `${size} ${units[i]}`
}

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
  attachments?: DocumentAttachment[]
  onUpdateDocument?: (document: Document) => void | Promise<void>
  onDeleteDocument?: (documentId: string) => void | Promise<void>
  onDeleteFile?: (documentId: string, fileName: string) => void | Promise<void>
  onFilesUploaded?: (documentId: string) => void | Promise<void>
}

export function DataTableRowActions<TData>({
  row,
  attachments = [],
  onUpdateDocument,
  onDeleteDocument,
  onDeleteFile,
  onFilesUploaded,
}: DataTableRowActionsProps<TData>) {
  const parsed = documentSchema.safeParse(row.original)
  const [editOpen, setEditOpen] = React.useState(false)
  const [viewOpen, setViewOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [uploadOpen, setUploadOpen] = React.useState(false)
  const [draft, setDraft] = React.useState<Document | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  if (!parsed.success) {
    return null
  }

  const documentItem = parsed.data

  function openEditDialog() {
    setDraft({ ...documentItem })
    setError(null)
    setEditOpen(true)
  }

  async function handleSaveEdit() {
    if (!draft?.name.trim()) {
      setError("Tên tài liệu không được để trống")
      return
    }

    if (draft.name.length > 100) {
      setError("Tên tài liệu không được vượt quá 100 ký tự")
      return
    }

    try {
      setIsSaving(true)
      setError(null)
      await onUpdateDocument?.({ ...draft, name: draft.name.trim() })
      toast.success("Cập nhật thành công", {
        description: `Tài liệu "${draft.name}" đã được cập nhật.`,
      })
      setEditOpen(false)
    } catch (saveError) {
      toast.error("Lỗi khi cập nhật", {
        description:
          saveError instanceof Error
            ? saveError.message
            : "Không thể cập nhật tài liệu.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    try {
      await onDeleteDocument?.(documentItem.id)
      toast.success("Xóa thành công", {
        description: `Tài liệu "${documentItem.name}" đã được xóa.`,
      })
      setDeleteOpen(false)
    } catch {
      toast.error("Lỗi khi xóa", {
        description: "Không thể xóa tài liệu. Vui lòng thử lại sau.",
      })
    }
  }

  const statusLabel = documentStatuses.find(
    (s) => s.value === documentItem.status
  )

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted cursor-pointer"
          >
            <MoreHorizontal />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => setViewOpen(true)}
          >
            <Eye className="mr-2 h-4 w-4" />
            Xem chi tiết
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer" onClick={openEditDialog}>
            Chỉnh sửa
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer text-destructive focus:text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            Xóa
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <AlertTriangle className="text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>Xác nhận xóa tài liệu</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa tài liệu{" "}
              <span className="font-semibold text-foreground">
                &ldquo;{documentItem.name}&rdquo;
              </span>
              ? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
            >
              Xóa tài liệu
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Details Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Chi tiết tài liệu</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về tài liệu này.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">ID</p>
              <p className="text-sm font-mono">{documentItem.id}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Tên</p>
              <p className="text-sm font-semibold">{documentItem.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Trạng thái
              </p>
              <Badge variant="outline">
                {statusLabel?.label ?? documentItem.status}
              </Badge>
            </div>
            {documentItem.summary ? (
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Tóm tắt
                </p>
                <p className="text-sm leading-relaxed text-foreground">
                  {documentItem.summary}
                </p>
              </div>
            ) : null}

            {/* Attachments section */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                File đính kèm {attachments.length > 0 ? `(${attachments.length})` : ""}
              </p>
              {attachments.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  Chưa có file đính kèm nào.
                </p>
              ) : (
                <AttachmentGroup className="flex-col">
                  {attachments.map((att) => (
                    <Attachment key={att.name} size="sm" state="done" className="w-full">
                      <AttachmentMedia>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </AttachmentMedia>
                      <AttachmentContent>
                        <AttachmentTitle>{att.name}</AttachmentTitle>
                        <AttachmentDescription>
                          {formatFileSize(att.size)}
                        </AttachmentDescription>
                      </AttachmentContent>
                      <AttachmentActions>
                        <AttachmentAction
                          aria-label={`Tải xuống ${att.name}`}
                          onClick={() => window.open(att.url, "_blank", "noopener,noreferrer")}
                        >
                          <Download className="h-4 w-4" />
                        </AttachmentAction>
                      </AttachmentActions>
                    </Attachment>
                  ))}
                </AttachmentGroup>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setViewOpen(false)}
              className="cursor-pointer"
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa tài liệu</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin tài liệu và lưu lại.
            </DialogDescription>
          </DialogHeader>

          {draft ? (
            <div className="space-y-5">
              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor={`doc-name-${documentItem.id}`}>
                  Tên tài liệu <span className="text-destructive">*</span>
                </Label>
                <Input
                  id={`doc-name-${documentItem.id}`}
                  value={draft.name}
                  maxLength={100}
                  onChange={(event) =>
                    setDraft((current) =>
                      current
                        ? { ...current, name: event.target.value }
                        : current
                    )
                  }
                />
                <span className="text-xs text-muted-foreground">
                  {draft.name.length}/100
                </span>
              </div>

              <div className="space-y-2">
                <Label>Trạng thái</Label>
                <Select
                  value={draft.status}
                  onValueChange={(value: "draft" | "published") =>
                    setDraft((current) =>
                      current ? { ...current, status: value } : current
                    )
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
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

              <div className="space-y-2">
                <Label>Tóm tắt</Label>
                <Textarea
                  value={draft.summary ?? ""}
                  placeholder="Nhập tóm tắt tài liệu..."
                  rows={4}
                  onChange={(event) =>
                    setDraft((current) =>
                      current
                        ? { ...current, summary: event.target.value }
                        : current
                    )
                  }
                />
              </div>

              {/* Attachments in edit dialog */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>File đính kèm</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                    onClick={() => {
                      setEditOpen(false)
                      setTimeout(() => setUploadOpen(true), 100)
                    }}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                  </Button>
                </div>
                <DocumentAttachments
                  attachments={attachments}
                  onDeleteFile={
                    onDeleteFile
                      ? (fileName) => onDeleteFile(documentItem.id, fileName)
                      : undefined
                  }
                />
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              disabled={isSaving}
            >
              Hủy
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Files Dialog */}
      <UploadFilesDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        documentId={documentItem.id}
        onUploaded={async () => {
          await onFilesUploaded?.(documentItem.id)
        }}
      />
    </>
  )
}