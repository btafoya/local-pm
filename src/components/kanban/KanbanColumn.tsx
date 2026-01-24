'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { KanbanCard } from './KanbanCard'
import { TicketStatus, STATUS_COLORS } from '@/types/enums'
import type { Ticket } from '@/payload-types'

interface KanbanColumnProps {
  id: TicketStatus
  title: string
  tickets: Ticket[]
  onViewTicket: (ticket: Ticket) => void
  onDeleteTicket: (ticketId: string) => void
}

export function KanbanColumn({
  id,
  title,
  tickets,
  onViewTicket,
  onDeleteTicket,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  const statusColor = STATUS_COLORS[id]

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
          {tickets.length}
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

        {tickets.length === 0 && (
          <div className="flex items-center justify-center h-20 text-sm text-gray-500">
            No tickets
          </div>
        )}
      </div>
    </div>
  )
}
