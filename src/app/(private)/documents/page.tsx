"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ArrowUp, FileEdit, FileText, File } from "lucide-react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { hasDocumentManagerAccess } from "@/lib/auth/permissions"
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
import { listDocumentAttachments } from "@/modules/documents/services/document-file-services"
import type {
  Document,
  DocumentAttachment,
} from "@/modules/documents/services/types/document-types"

export default function DocumentPage() {
  const { data: session } = useSession()
  const canManageDocuments = hasDocumentManagerAccess(session?.user)

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
        err
      )
      setAttachmentsMap((prev) => ({ ...prev, [documentId]: [] }))
    }
  }, [])

  const refreshAllAttachments = useCallback(async (docs: Document[]) => {
    const entries = await Promise.allSettled(
      docs.map(
        async (d) => [d.id, await listDocumentAttachments(d.id)] as const
      )
    )
    setAttachmentsMap((prev) => {
      const next = { ...prev }
      entries.forEach((entry) => {
        if (entry.status === "fulfilled") {
          next[entry.value[0]] = entry.value[1]
        }
      })
      return next
    })
  }, [])

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const documentList = await getDocuments()
        setDocuments(documentList)
        // Load attachments for all documents so the View Details dialog can show them.
        await refreshAllAttachments(documentList)
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
  }, [refreshAllAttachments])

  const handleAddDocument = useCallback(
    async (newDocument: Omit<Document, "id">): Promise<Document> => {
      if (!canManageDocuments) {
        throw new Error(
          "Bạn không có quyền tạo tài liệu. Yêu cầu vai trò Document Manager."
        )
      }
      const now = new Date().toISOString()
      const created = await createDocument({
        ...newDocument,
        createdBy: session?.user?.name || session?.user?.email || "Unknown",
        createdDate: now,
      })
      await refreshDocuments()
      return created
    },
    [canManageDocuments, refreshDocuments, session]
  )

  const handleUpdateDocument = useCallback(
    async (documentItem: Document) => {
      if (!canManageDocuments) {
        toast.error("Không có quyền cập nhật", {
          description:
            "Bạn không có quyền chỉnh sửa tài liệu. Yêu cầu vai trò Document Manager.",
        })
        return
      }
      await updateDocument(documentItem)
      setDocuments((prev) =>
        prev.map((item) => (item.id === documentItem.id ? documentItem : item))
      )
    },
    [canManageDocuments]
  )

  const handleDeleteDocument = useCallback(
    async (documentId: string) => {
      if (!canManageDocuments) {
        toast.error("Không có quyền xóa", {
          description:
            "Bạn không có quyền xóa tài liệu. Yêu cầu vai trò Document Manager.",
        })
        return
      }
      await deleteDocument(documentId)
      setDocuments((prev) => prev.filter((item) => item.id !== documentId))
      setAttachmentsMap((prev) => {
        const next = { ...prev }
        delete next[documentId]
        return next
      })
    },
    [canManageDocuments]
  )

  const handleFilesUploaded = useCallback(
    async (documentId: string) => {
      await refreshAttachments(documentId)
    },
    [refreshAttachments]
  )

  const handleSeedDocuments = useCallback(async () => {
    if (!canManageDocuments) {
      toast.error("Không có quyền seed dữ liệu", {
        description:
          "Bạn không có quyền seed dữ liệu. Yêu cầu vai trò Document Manager.",
      })
      return
    }
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
  }, [canManageDocuments])

  const documentColumns = useMemo(
    () =>
      getDocumentColumns({
        attachmentsMap,
        canManage: canManageDocuments,
        onUpdateDocument: handleUpdateDocument,
        onDeleteDocument: handleDeleteDocument,
        onFilesUploaded: handleFilesUploaded,
      }),
    [
      attachmentsMap,
      canManageDocuments,
      handleDeleteDocument,
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
              Vui lòng sử dụng màn hình lớn hơn để xem đầy đủ giao diện quản lý
              tài liệu.
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
              canManage={canManageDocuments}
              onAddDocument={handleAddDocument}
              onFilesUploaded={handleFilesUploaded}
              onSeedDocuments={handleSeedDocuments}
              isSeedingDocuments={isSeedingDocuments}
            />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
