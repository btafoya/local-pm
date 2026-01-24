'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { MoreHorizontal, Calendar, Eye, Trash2, Ban } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { PRIORITY_COLORS, TicketPriority } from '@/types/enums'
import type { Ticket } from '@/payload-types'

interface KanbanCardProps {
  ticket: Ticket
  isOverlay?: boolean
  onClick?: () => void
  onDelete?: () => void
}

export function KanbanCard({ ticket, isOverlay, onClick, onDelete }: KanbanCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ticket.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const project = typeof ticket.project === 'object' ? ticket.project : null
  const team = typeof ticket.team === 'object' ? ticket.team : null
  const priorityColor = PRIORITY_COLORS[ticket.priority as TicketPriority] || PRIORITY_COLORS[TicketPriority.NO_PRIORITY]

  // Check if ticket is blocked by incomplete tickets
  const blockingTickets = (ticket.blockedBy || [])
    .map(t => typeof t === 'object' ? t : null)
    .filter((t): t is Ticket => t !== null && t.status !== 'DONE')
  const isBlocked = blockingTickets.length > 0

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // Only trigger click if not dragging and not clicking on menu
    if (!isDragging && onClick) {
      onClick()
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleCardClick}
      className={`group bg-[#1f1f23] border border-[#27272a] rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-[#3f3f46] transition-colors ${
        isOverlay ? 'shadow-xl rotate-3' : ''
      }`}
    >
      {/* Header: ID and Menu */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {project && (
            <span
              className="text-xs font-medium px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: `${project.color}20`,
                color: project.color as string,
              }}
            >
              {ticket.ticketId}
            </span>
          )}
          {!project && (
            <span className="text-xs text-gray-500">{ticket.ticketId}</span>
          )}
          {isBlocked && (
            <span
              className="flex items-center gap-1 text-xs text-amber-500"
              title={`Blocked by: ${blockingTickets.map(t => t.ticketId).join(', ')}`}
            >
              <Ban className="w-3 h-3" />
            </span>
          )}
        </div>

        {!isOverlay && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(!showMenu)
              }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#27272a] rounded transition-opacity"
            >
              <MoreHorizontal className="w-4 h-4 text-gray-400" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-[#27272a] border border-[#3f3f46] rounded-md shadow-lg py-1 z-10 min-w-[120px]">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onClick?.()
                    setShowMenu(false)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:bg-[#3f3f46] transition-colors"
                >
                  <Eye className="w-3 h-3" />
                  View
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm('Are you sure you want to delete this ticket?')) {
                      onDelete?.()
                    }
                    setShowMenu(false)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-400 hover:bg-[#3f3f46] transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Title */}
      <h4 className="text-sm text-white font-medium mb-2 line-clamp-2">
        {ticket.title}
      </h4>

      {/* Labels */}
      {ticket.labels && ticket.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {ticket.labels.slice(0, 3).map((label, index) => (
            <span
              key={index}
              className="text-xs px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: `${label.color}20`,
                color: label.color as string,
              }}
            >
              {label.name}
            </span>
          ))}
          {ticket.labels.length > 3 && (
            <span className="text-xs text-gray-500">
              +{ticket.labels.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer: Priority, Team, Due Date */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#27272a]">
        <div className="flex items-center gap-2">
          {/* Priority Indicator */}
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: priorityColor }}
            title={ticket.priority as string}
          />

          {/* Team Badge */}
          {team && (
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: `${team.color}20`,
                color: team.color as string,
              }}
            >
              {team.name}
            </span>
          )}
        </div>

        {/* Due Date */}
        {ticket.dueDate && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Calendar className="w-3 h-3" />
            {formatDate(ticket.dueDate)}
          </div>
        )}
      </div>
    </div>
  )
}
