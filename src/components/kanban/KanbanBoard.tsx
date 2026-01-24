'use client'

import { useState, useCallback, useMemo } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { KanbanColumn } from './KanbanColumn'
import { KanbanCard } from './KanbanCard'
import { KanbanHeader } from './KanbanHeader'
import { TicketModal } from './TicketModal'
import { TicketDetailModal } from './TicketDetailModal'
import { TicketStatus } from '@/types/enums'
import type { Project, Team, Ticket } from '@/payload-types'

interface KanbanBoardProps {
  initialTickets: Ticket[]
  projects: Project[]
  teams: Team[]
}

const COLUMNS = [
  { id: TicketStatus.TODO, title: 'Todo' },
  { id: TicketStatus.IN_PROGRESS, title: 'In Progress' },
  { id: TicketStatus.DONE, title: 'Done' },
]

export function KanbanBoard({ initialTickets, projects, teams }: KanbanBoardProps) {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets)
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null)
  const [viewingTicket, setViewingTicket] = useState<Ticket | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      if (selectedProjectId) {
        const projectId = typeof ticket.project === 'string' ? ticket.project : ticket.project?.id
        if (projectId !== selectedProjectId) return false
      }
      if (selectedTeamId) {
        const teamId = typeof ticket.team === 'string' ? ticket.team : ticket.team?.id
        if (teamId !== selectedTeamId) return false
      }
      return true
    })
  }, [tickets, selectedProjectId, selectedTeamId])

  const getTicketsByStatus = useCallback(
    (status: TicketStatus) => {
      return filteredTickets
        .filter((ticket) => ticket.status === status)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    },
    [filteredTickets]
  )

  const handleDragStart = (event: DragStartEvent) => {
    const ticket = tickets.find((t) => t.id === event.active.id)
    setActiveTicket(ticket || null)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeTicket = tickets.find((t) => t.id === activeId)
    if (!activeTicket) return

    // Check if we're over a column
    const isOverColumn = COLUMNS.some((col) => col.id === overId)
    if (isOverColumn) {
      const newStatus = overId as TicketStatus
      if (activeTicket.status !== newStatus) {
        setTickets((prev) =>
          prev.map((ticket) =>
            ticket.id === activeId ? { ...ticket, status: newStatus } : ticket
          )
        )
      }
      return
    }

    // We're over another ticket
    const overTicket = tickets.find((t) => t.id === overId)
    if (!overTicket) return

    if (activeTicket.status !== overTicket.status) {
      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.id === activeId ? { ...ticket, status: overTicket.status } : ticket
        )
      )
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTicket(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    if (activeId === overId) return

    const activeTicket = tickets.find((t) => t.id === activeId)
    if (!activeTicket) return

    // Determine the target status
    let targetStatus = activeTicket.status
    const isOverColumn = COLUMNS.some((col) => col.id === overId)
    if (isOverColumn) {
      targetStatus = overId as TicketStatus
    } else {
      const overTicket = tickets.find((t) => t.id === overId)
      if (overTicket) {
        targetStatus = overTicket.status as TicketStatus
      }
    }

    // Get tickets in the target column
    const columnTickets = tickets.filter((t) => t.status === targetStatus)
    const oldIndex = columnTickets.findIndex((t) => t.id === activeId)
    const newIndex = isOverColumn
      ? columnTickets.length
      : columnTickets.findIndex((t) => t.id === overId)

    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
      const reorderedTickets = arrayMove(columnTickets, oldIndex, newIndex)

      // Update sort order for all tickets in the column
      const updatedTickets = tickets.map((ticket) => {
        const reorderedIndex = reorderedTickets.findIndex((t) => t.id === ticket.id)
        if (reorderedIndex !== -1) {
          return { ...ticket, sortOrder: reorderedIndex, status: targetStatus }
        }
        return ticket
      })

      setTickets(updatedTickets)
    }

    // Update the ticket in the database
    try {
      await fetch(`/api/tickets/${activeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: targetStatus,
          sortOrder: columnTickets.findIndex((t) => t.id === overId) + 1,
        }),
      })
    } catch (error) {
      console.error('Failed to update ticket:', error)
    }
  }

  const handleCreateTicket = () => {
    setEditingTicket(null)
    setIsModalOpen(true)
  }

  const handleViewTicket = (ticket: Ticket) => {
    setViewingTicket(ticket)
  }

  const handleTicketSaved = (savedTicket: Ticket) => {
    if (editingTicket) {
      setTickets((prev) =>
        prev.map((t) => (t.id === savedTicket.id ? savedTicket : t))
      )
    } else {
      setTickets((prev) => [...prev, savedTicket])
    }
    setIsModalOpen(false)
    setEditingTicket(null)
  }

  const handleTicketUpdated = (updatedTicket: Ticket) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === updatedTicket.id ? updatedTicket : t))
    )
    setViewingTicket(updatedTicket)
  }

  const handleDeleteTicket = async (ticketId: string) => {
    try {
      await fetch(`/api/tickets/${ticketId}`, { method: 'DELETE' })
      setTickets((prev) => prev.filter((t) => t.id !== ticketId))
    } catch (error) {
      console.error('Failed to delete ticket:', error)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <KanbanHeader
        projects={projects}
        teams={teams}
        selectedProjectId={selectedProjectId}
        selectedTeamId={selectedTeamId}
        onProjectChange={setSelectedProjectId}
        onTeamChange={setSelectedTeamId}
        onCreateTicket={handleCreateTicket}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 flex gap-4 p-6 overflow-x-auto">
          {COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              tickets={getTicketsByStatus(column.id)}
              onViewTicket={handleViewTicket}
              onDeleteTicket={handleDeleteTicket}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTicket ? <KanbanCard ticket={activeTicket} isOverlay /> : null}
        </DragOverlay>
      </DndContext>

      <TicketModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        ticket={editingTicket}
        projects={projects}
        teams={teams}
        allTickets={tickets}
        onSave={handleTicketSaved}
        defaultProjectId={selectedProjectId}
      />

      {viewingTicket && (
        <TicketDetailModal
          isOpen={!!viewingTicket}
          onClose={() => setViewingTicket(null)}
          ticket={viewingTicket}
          projects={projects}
          teams={teams}
          allTickets={tickets}
          onUpdate={handleTicketUpdated}
          onDelete={handleDeleteTicket}
        />
      )}
    </div>
  )
}
