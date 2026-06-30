"use client"

import type { Table } from "@tanstack/react-table"
import { Plus, RefreshCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface RoleDataTableToolbarProps<TData> {
  table: Table<TData>
  onAddRole?: () => void
}

export function RoleDataTableToolbar<TData>({
  table,
  onAddRole,
}: RoleDataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Tìm role..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="w-[200px] lg:w-[300px]"
        />
        <Button
          variant="outline"
          onClick={() => table.resetColumnFilters()}
          className="px-3 cursor-pointer"
          disabled={!isFiltered}
        >
          <RefreshCcw className="h-4 w-4" />
          <span className="hidden lg:block">Đặt lại</span>
        </Button>
      </div>
      <div className="flex items-center space-x-2">
        <Button
          size="sm"
          className="cursor-pointer"
          onClick={onAddRole}
          disabled={!onAddRole}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden lg:block">Thêm role</span>
        </Button>
      </div>
    </div>
  )
}