"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ArrowUp, FileEdit, FileText, File } from "lucide-react"
import { toast } from "sonner"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getDocumentColumns } from "@/modules/documents/components/columns"
import { DataTable } from "@/modules/documents/components/data-table"
import {
  createDocument,
  deleteDocument,
  getDocumentStats,
  getDocuments,
  seedDocumentsWithClient,
  updateDocument,
} from "@/modules/documents/services/document-services"
import {
  deleteDocumentFile,
  listDocumentAttachments,
} from "@/modules/documents/services/document-file-services"
import type {
  Document,
  DocumentAttachment,
} from "@/modules/documents/services/types/document-types"

export default function DocumentPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [attachmentsMap, setAttachmentsMap] = useState<
    Record<string, DocumentAttachment[]>
  >({})
  const [loading, setLoading] = useState(true)
  const [isSeedingDocuments, setIsSeedingDocuments] = useState(false)

  const refreshDocuments = useCallback(async () => {
    const documentList = await getDocuments()
    setDocuments(documentList)
  }, [])

  const refreshAttachments = useCallback(async (documentId: string) => {
    try {
      const list = await listDocumentAttachments(documentId)
      setAttachmentsMap((prev) => ({ ...prev, [documentId]: list }))
    } catch (err) {
      console.error(
        `[Documents] Failed to list attachments for ${documentId}:`,
        err,
      )
      setAttachmentsMap((prev) => ({ ...prev, [documentId]: [] }))
    }
  }, [])

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        await refreshDocuments()
      } catch (error) {
        console.error("Failed to load documents:", error)
        toast.error("Lỗi khi tải danh sách tài liệu", {
          description:
            error instanceof Error
              ? error.message
              : "Đã xảy ra lỗi không xác định.",
        })
      } finally {
        setLoading(false)
      }
    }

    loadDocuments()
  }, [refreshDocuments])

  const handleAddDocument = useCallback(
    async (newDocument: Omit<Document, "id">): Promise<Document> => {
      const created = await createDocument(newDocument)
      await refreshDocuments()
      return created
    },
    [refreshDocuments]
  )

  const handleUpdateDocument = useCallback(
    async (documentItem: Document) => {
      await updateDocument(documentItem)
      setDocuments((prev) =>
        prev.map((item) => (item.id === documentItem.id ? documentItem : item))
      )
    },
    []
  )

  const handleDeleteDocument = useCallback(async (documentId: string) => {
    await deleteDocument(documentId)
    setDocuments((prev) => prev.filter((item) => item.id !== documentId))
    setAttachmentsMap((prev) => {
      const next = { ...prev }
      delete next[documentId]
      return next
    })
  }, [])

  const handleDeleteFile = useCallback(
    async (documentId: string, fileName: string) => {
      await deleteDocumentFile(documentId, fileName)
      await refreshAttachments(documentId)
      toast.success("Xóa file thành công", {
        description: `File "${fileName}" đã được xóa.`,
      })
    },
    [refreshAttachments],
  )

  const handleFilesUploaded = useCallback(
    async (documentId: string) => {
      await refreshAttachments(documentId)
    },
    [refreshAttachments],
  )

  const handleSeedDocuments = useCallback(async () => {
    try {
      setIsSeedingDocuments(true)
      const seededDocuments = await seedDocumentsWithClient()
      setDocuments(seededDocuments)
      toast.success("Seed dữ liệu thành công", {
        description: `Đã tải ${seededDocuments.length} tài liệu mẫu lên Firestore.`,
      })
    } catch (error) {
      console.error("Failed to seed documents:", error)
      toast.error("Lỗi khi seed dữ liệu", {
        description:
          error instanceof Error
            ? error.message
            : "Không thể seed dữ liệu. Vui lòng thử lại sau.",
      })
    } finally {
      setIsSeedingDocuments(false)
    }
  }, [])

  const documentColumns = useMemo(
    () =>
      getDocumentColumns({
        attachmentsMap,
        onUpdateDocument: handleUpdateDocument,
        onDeleteDocument: handleDeleteDocument,
        onDeleteFile: handleDeleteFile,
        onFilesUploaded: handleFilesUploaded,
      }),
    [
      attachmentsMap,
      handleDeleteDocument,
      handleDeleteFile,
      handleFilesUploaded,
      handleUpdateDocument,
    ]
  )

  const stats = getDocumentStats(documents)
  const getPercent = (value: number) =>
    stats.total > 0 ? Math.round((value / stats.total) * 100) : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">
          Đang tải danh sách tài liệu...
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col gap-2 px-4 md:px-6">
        <h1 className="text-2xl font-bold tracking-tight">Tài liệu</h1>
        <p className="text-muted-foreground">
          Quản lý tài liệu của bạn — tạo mới, chỉnh sửa, xuất bản hoặc xóa các
          tài liệu trong hệ thống.
        </p>
      </div>

      {/* Mobile view placeholder */}
      <div className="md:hidden px-4 md:px-6">
        <div className="flex items-center justify-center h-96 border rounded-lg bg-muted/20">
          <div className="text-center p-8">
            <h3 className="text-lg font-semibold mb-2">Documents Dashboard</h3>
            <p className="text-muted-foreground">
              Vui lòng sử dụng màn hình lớn hơn để xem đầy đủ giao diện quản
              lý tài liệu.
            </p>
          </div>
        </div>
      </div>

      {/* Desktop view */}
      <div className="hidden h-full flex-1 flex-col space-y-6 px-4 md:px-6 md:flex">
        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">
                    Tổng tài liệu
                  </p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{stats.total}</span>
                    <span className="flex items-center gap-0.5 text-sm text-green-500">
                      <ArrowUp className="size-3.5" />
                      {getPercent(stats.published)}%
                    </span>
                  </div>
                </div>
                <div className="bg-secondary rounded-lg p-3">
                  <File className="size-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">
                    Đã xuất bản
                  </p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold">
                      {stats.published}
                    </span>
                    <span className="flex items-center gap-0.5 text-sm text-green-500">
                      <ArrowUp className="size-3.5" />
                      {getPercent(stats.published)}%
                    </span>
                  </div>
                </div>
                <div className="bg-secondary rounded-lg p-3">
                  <FileText className="size-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">
                    Bản nháp
                  </p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{stats.draft}</span>
                    <span className="flex items-center gap-0.5 text-sm text-orange-500">
                      <ArrowUp className="size-3.5" />
                      {getPercent(stats.draft)}%
                    </span>
                  </div>
                </div>
                <div className="bg-secondary rounded-lg p-3">
                  <FileEdit className="size-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>Quản lý tài liệu</CardTitle>
            <CardDescription>
              Xem, lọc và quản lý tất cả tài liệu của bạn tại một nơi.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              data={documents}
              columns={documentColumns}
              onAddDocument={handleAddDocument}
              onSeedDocuments={handleSeedDocuments}
              isSeedingDocuments={isSeedingDocuments}
            />
          </CardContent>
        </Card>
      </div>
    </>
  )
}