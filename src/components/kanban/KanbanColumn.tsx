'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Loader2, ChevronDown } from 'lucide-react'
import { KanbanCard } from './KanbanCard'
import { TicketStatus, STATUS_COLORS } from '@/types/enums'
import type { Ticket } from '@/payload-types'

interface ColumnPaginationInfo {
  hasNextPage: boolean
  totalDocs: number
  loadedCount: number
}

interface KanbanColumnProps {
  id: TicketStatus
  title: string
  tickets: Ticket[]
  onViewTicket: (ticket: Ticket) => void
  onDeleteTicket: (ticketId: string) => void
  pagination?: ColumnPaginationInfo
  isLoadingMore?: boolean
  onLoadMore?: () => void
}

export function KanbanColumn({
  id,
  title,
  tickets,
  onViewTicket,
  onDeleteTicket,
  pagination,
  isLoadingMore,
  onLoadMore,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  const statusColor = STATUS_COLORS[id]
  const remainingCount = pagination ? pagination.totalDocs - pagination.loadedCount : 0

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col w-80 min-w-[320px] bg-[#18181b] rounded-lg ${
        isOver ? 'ring-2 ring-indigo-500' : ''
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#27272a]">
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: statusColor }}
        />
        <h3 className="text-sm font-medium text-white">{title}</h3>
        <span className="ml-auto text-xs text-gray-500 bg-[#27272a] px-2 py-0.5 rounded">
          {pagination ? `${pagination.loadedCount}/${pagination.totalDocs}` : tickets.length}
        </span>
      </div>

      {/* Cards Container */}
      <div className="flex-1 p-2 overflow-y-auto min-h-[200px]">
        <SortableContext
          items={tickets.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {tickets.map((ticket) => (
              <KanbanCard
                key={ticket.id}
                ticket={ticket}
                onClick={() => onViewTicket(ticket)}
                onDelete={() => onDeleteTicket(ticket.id)}
              />
            ))}
          </div>
        </SortableContext>

        {tickets.length === 0 && !isLoadingMore && (
          <div className="flex items-center justify-center h-20 text-sm text-gray-500">
            No tickets
          </div>
        )}

        {/* Load more button */}
        {pagination?.hasNextPage && onLoadMore && (
          <div className="mt-2 pt-2 border-t border-[#27272a]">
            <button
              onClick={onLoadMore}
              disabled={isLoadingMore}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-white bg-[#27272a] hover:bg-[#3f3f46] rounded-md transition-colors disabled:opacity-50"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  Load more ({remainingCount})
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
