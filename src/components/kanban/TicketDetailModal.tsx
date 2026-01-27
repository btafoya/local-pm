'use client'

import { useState } from 'react'
import {
  X,
  Pencil,
  Save,
  Trash2,
  Calendar,
  Flag,
  Users,
  FolderKanban,
  Clock,
  Tag,
  Plus,
  FileText,
  CheckSquare,
  Square,
  Ban,
  GitBranch,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
} from 'lucide-react'
import {
  TicketStatus,
  TicketPriority,
  TICKET_STATUS_OPTIONS,
  TICKET_PRIORITY_OPTIONS,
  PRIORITY_COLORS,
  STATUS_COLORS,
} from '@/types/enums'
import { RichTextEditor, RichTextDisplay } from '@/components/ui/RichTextEditor'
import { DependencyGraph } from './DependencyGraph'
import type { Project, Team, Ticket } from '@/payload-types'

interface Subtask {
  title: string
  completed: boolean
}

interface TicketDetailModalProps {
  isOpen: boolean
  onClose: () => void
  ticket: Ticket
  projects: Project[]
  teams: Team[]
  allTickets: Ticket[]
  onUpdate: (ticket: Ticket) => void
  onDelete: (ticketId: string) => void
}

export function TicketDetailModal({
  isOpen,
  onClose,
  ticket,
  projects,
  teams,
  allTickets,
  onUpdate,
  onDelete,
}: TicketDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)

  // Form state
  const [title, setTitle] = useState(ticket.title)
  const [description, setDescription] = useState(ticket.description as unknown as string || '')
  const [status, setStatus] = useState(ticket.status)
  const [priority, setPriority] = useState(ticket.priority || TicketPriority.NO_PRIORITY)
  const [teamId, setTeamId] = useState(typeof ticket.team === 'string' ? ticket.team : ticket.team?.id || '')
  const [dueDate, setDueDate] = useState(ticket.dueDate || '')
  const [labels, setLabels] = useState(ticket.labels || [])
  const [subtasks, setSubtasks] = useState<Subtask[]>(
    (ticket.subtasks || []).map(st => ({ title: st.title, completed: st.completed ?? false }))
  )
  const [blockedByIds, setBlockedByIds] = useState<string[]>(
    (ticket.blockedBy || []).map(t => typeof t === 'string' ? t : t.id)
  )
  const [newLabelName, setNewLabelName] = useState('')
  const [newLabelColor, setNewLabelColor] = useState('#6366f1')
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [showDependencyGraph, setShowDependencyGraph] = useState(true)

  const project = typeof ticket.project === 'object' ? ticket.project : null
  const team = typeof ticket.team === 'object' ? ticket.team : null

  // Get blocking tickets (resolved objects) - tickets that block this ticket
  const blockingTickets = (ticket.blockedBy || [])
    .map(t => typeof t === 'object' ? t : (allTickets || []).find(at => at.id === t))
    .filter((t): t is Ticket => t !== undefined)

  // Get blocked tickets - tickets that are blocked by this ticket
  const blockedTickets = (allTickets || []).filter(t => {
    const tBlockedByIds = (t.blockedBy || []).map(b => typeof b === 'string' ? b : b.id)
    return tBlockedByIds.includes(ticket.id)
  })

  // Available tickets for blocking (exclude self and already selected)
  const availableTickets = (allTickets || []).filter(t => t.id !== ticket.id && !blockedByIds.includes(t.id))

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || null,
          status,
          priority,
          team: teamId || null,
          dueDate: dueDate || null,
          labels,
          subtasks,
          blockedBy: blockedByIds,
        }),
      })

      if (!response.ok) throw new Error('Failed to update ticket')

      const updated = await response.json()
      onUpdate(updated.doc || updated)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to save ticket:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this ticket?')) return
    onDelete(ticket.id)
    onClose()
  }

  const handleCancel = () => {
    setTitle(ticket.title)
    setDescription(ticket.description as unknown as string || '')
    setStatus(ticket.status)
    setPriority(ticket.priority || TicketPriority.NO_PRIORITY)
    setTeamId(typeof ticket.team === 'string' ? ticket.team : ticket.team?.id || '')
    setDueDate(ticket.dueDate || '')
    setLabels(ticket.labels || [])
    setSubtasks((ticket.subtasks || []).map(st => ({ title: st.title, completed: st.completed ?? false })))
    setBlockedByIds((ticket.blockedBy || []).map(t => typeof t === 'string' ? t : t.id))
    setNewSubtaskTitle('')
    setIsEditing(false)
  }

  const addBlocker = (ticketId: string) => {
    if (!blockedByIds.includes(ticketId)) {
      setBlockedByIds([...blockedByIds, ticketId])
    }
  }

  const removeBlocker = (ticketId: string) => {
    setBlockedByIds(blockedByIds.filter(id => id !== ticketId))
  }

  const addLabel = () => {
    if (newLabelName.trim()) {
      setLabels([...labels, { name: newLabelName.trim(), color: newLabelColor }])
      setNewLabelName('')
      setNewLabelColor('#6366f1')
    }
  }

  const removeLabel = (index: number) => {
    setLabels(labels.filter((_, i) => i !== index))
  }

  const addSubtask = () => {
    if (newSubtaskTitle.trim()) {
      setSubtasks([...subtasks, { title: newSubtaskTitle.trim(), completed: false }])
      setNewSubtaskTitle('')
    }
  }

  const toggleSubtask = (index: number) => {
    setSubtasks(subtasks.map((st, i) =>
      i === index ? { ...st, completed: !st.completed } : st
    ))
  }

  const removeSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatRelativeDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (!isOpen) return null

  // Reusable Components
  const TitleSection = () => (
    <div className="mb-6">
      {isEditing ? (
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-xl font-semibold bg-[#1f1f23] border border-[#27272a] rounded-md px-3 py-2 w-full text-white focus:outline-none focus:border-indigo-500"
        />
      ) : (
        <h2 className="text-xl font-semibold text-white">{ticket.title}</h2>
      )}
    </div>
  )

  const DescriptionSection = ({ minHeight = '120px' }: { minHeight?: string }) => (
    <div className="bg-[#1f1f23] rounded-lg p-4 mb-6">
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
        <FileText className="w-3 h-3" />
        Description
      </div>
      {isEditing ? (
        <RichTextEditor
          value={description}
          onChange={setDescription}
          placeholder="Describe the task in detail..."
        />
      ) : (
        <div style={{ minHeight }}>
          <RichTextDisplay content={ticket.description as unknown as string || ''} />
        </div>
      )}
    </div>
  )

  const SubtasksSection = () => (
    <div className="bg-[#1f1f23] rounded-lg p-4 mb-6">
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
        <CheckSquare className="w-3 h-3" />
        Subtasks
        {subtasks.length > 0 && (
          <span className="ml-auto text-xs">
            {subtasks.filter(s => s.completed).length}/{subtasks.length} completed
          </span>
        )}
      </div>
      <div className="space-y-2 mb-2">
        {subtasks.map((subtask, index) => (
          <div key={index} className="flex items-center gap-2 p-2 bg-[#27272a] rounded-md">
            <button
              type="button"
              onClick={() => toggleSubtask(index)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              {subtask.completed ? (
                <CheckSquare className="w-4 h-4 text-green-400" />
              ) : (
                <Square className="w-4 h-4" />
              )}
            </button>
            <span className={`flex-1 text-sm ${subtask.completed ? 'text-gray-500 line-through' : 'text-white'}`}>
              {subtask.title}
            </span>
            {isEditing && (
              <button
                type="button"
                onClick={() => removeSubtask(index)}
                className="text-gray-400 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
        {subtasks.length === 0 && !isEditing && (
          <span className="text-sm text-gray-500">No subtasks</span>
        )}
      </div>
      {isEditing && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newSubtaskTitle}
            onChange={(e) => setNewSubtaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
            placeholder="Add a subtask..."
            className="flex-1 bg-[#27272a] border border-[#3f3f46] rounded-md px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="button"
            onClick={addSubtask}
            className="p-2 bg-[#27272a] hover:bg-[#3f3f46] rounded-md transition-colors"
          >
            <Plus className="w-4 h-4 text-white" />
          </button>
        </div>
      )}
    </div>
  )

  const StatusSection = () => (
    <div className="bg-[#1f1f23] rounded-lg p-4">
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
        <Clock className="w-3 h-3" />
        Status
      </div>
      {isEditing ? (
        <select
          value={status as string}
          onChange={(e) => setStatus(e.target.value as TicketStatus)}
          className="w-full bg-[#27272a] border border-[#3f3f46] rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
        >
          {TICKET_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: STATUS_COLORS[ticket.status as TicketStatus] }}
          />
          <span className="text-sm text-white">
            {TICKET_STATUS_OPTIONS.find((o) => o.value === ticket.status)?.label}
          </span>
        </div>
      )}
    </div>
  )

  const PrioritySection = () => (
    <div className="bg-[#1f1f23] rounded-lg p-4">
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
        <Flag className="w-3 h-3" />
        Priority
      </div>
      {isEditing ? (
        <select
          value={priority as string}
          onChange={(e) => setPriority(e.target.value as TicketPriority)}
          className="w-full bg-[#27272a] border border-[#3f3f46] rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
        >
          {TICKET_PRIORITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: PRIORITY_COLORS[ticket.priority as TicketPriority] || PRIORITY_COLORS[TicketPriority.NO_PRIORITY] }}
          />
          <span className="text-sm text-white">
            {TICKET_PRIORITY_OPTIONS.find((o) => o.value === ticket.priority)?.label || 'No Priority'}
          </span>
        </div>
      )}
    </div>
  )

  const ProjectSection = () => (
    <div className="bg-[#1f1f23] rounded-lg p-4">
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
        <FolderKanban className="w-3 h-3" />
        Project
      </div>
      {project && (
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: project.color as string }}
          />
          <span className="text-sm text-white">{project.name}</span>
        </div>
      )}
    </div>
  )

  const TeamSection = () => (
    <div className="bg-[#1f1f23] rounded-lg p-4">
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
        <Users className="w-3 h-3" />
        Team
      </div>
      {isEditing ? (
        <select
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
          className="w-full bg-[#27272a] border border-[#3f3f46] rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="">No team</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      ) : team ? (
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: team.color as string }}
          />
          <span className="text-sm text-white">{team.name}</span>
        </div>
      ) : (
        <span className="text-sm text-gray-500">No team assigned</span>
      )}
    </div>
  )

  const DueDateSection = () => (
    <div className="bg-[#1f1f23] rounded-lg p-4">
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
        <Calendar className="w-3 h-3" />
        Due Date
      </div>
      {isEditing ? (
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full bg-[#27272a] border border-[#3f3f46] rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
        />
      ) : ticket.dueDate ? (
        <span className="text-sm text-white">{formatRelativeDate(ticket.dueDate)}</span>
      ) : (
        <span className="text-sm text-gray-500">No due date</span>
      )}
    </div>
  )

  const LabelsSection = () => (
    <div className="bg-[#1f1f23] rounded-lg p-4">
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
        <Tag className="w-3 h-3" />
        Labels
      </div>
      <div className="flex flex-wrap gap-2 mb-2">
        {labels.map((label, index) => (
          <span
            key={index}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded"
            style={{
              backgroundColor: `${label.color}20`,
              color: label.color as string,
            }}
          >
            {label.name}
            {isEditing && (
              <button onClick={() => removeLabel(index)} className="hover:opacity-70">
                <X className="w-3 h-3" />
              </button>
            )}
          </span>
        ))}
        {labels.length === 0 && !isEditing && (
          <span className="text-sm text-gray-500">No labels</span>
        )}
      </div>
      {isEditing && (
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={newLabelName}
            onChange={(e) => setNewLabelName(e.target.value)}
            placeholder="Label name"
            className="flex-1 bg-[#27272a] border border-[#3f3f46] rounded-md px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
          <input
            type="color"
            value={newLabelColor}
            onChange={(e) => setNewLabelColor(e.target.value)}
            className="w-10 h-8 bg-[#27272a] border border-[#3f3f46] rounded cursor-pointer"
          />
          <button
            type="button"
            onClick={addLabel}
            className="p-2 bg-[#27272a] hover:bg-[#3f3f46] rounded-md transition-colors"
          >
            <Plus className="w-4 h-4 text-white" />
          </button>
        </div>
      )}
    </div>
  )

  const BlockedBySection = () => (
    <div className="bg-[#1f1f23] rounded-lg p-4">
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
        <Ban className="w-3 h-3" />
        Blocked By
      </div>
      <div className="space-y-2 mb-2">
        {isEditing ? (
          blockedByIds.map((blockerId) => {
            const blocker = (allTickets || []).find(t => t.id === blockerId)
            if (!blocker) return null
            const blockerProject = typeof blocker.project === 'object' ? blocker.project : null
            return (
              <div key={blockerId} className="flex items-center gap-2 p-2 bg-[#27272a] rounded-md">
                <Ban className="w-4 h-4 text-amber-500" />
                <span
                  className="text-xs font-medium px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: blockerProject ? `${blockerProject.color}20` : '#27272a',
                    color: blockerProject?.color as string || '#888',
                  }}
                >
                  {blocker.ticketId}
                </span>
                <span className={`flex-1 text-sm ${blocker.status === 'DONE' ? 'text-gray-500 line-through' : 'text-white'}`}>
                  {blocker.title}
                </span>
                <button
                  type="button"
                  onClick={() => removeBlocker(blockerId)}
                  className="text-gray-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )
          })
        ) : blockingTickets.length > 0 ? (
          blockingTickets.map((blocker) => {
            const blockerProject = typeof blocker.project === 'object' ? blocker.project : null
            return (
              <div key={blocker.id} className="flex items-center gap-2 p-2 bg-[#27272a] rounded-md">
                <Ban className={`w-4 h-4 ${blocker.status === 'DONE' ? 'text-green-500' : 'text-amber-500'}`} />
                <span
                  className="text-xs font-medium px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: blockerProject ? `${blockerProject.color}20` : '#27272a',
                    color: blockerProject?.color as string || '#888',
                  }}
                >
                  {blocker.ticketId}
                </span>
                <span className={`flex-1 text-sm ${blocker.status === 'DONE' ? 'text-gray-500 line-through' : 'text-white'}`}>
                  {blocker.title}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded ${blocker.status === 'DONE' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  {blocker.status === 'DONE' ? 'Done' : 'Pending'}
                </span>
              </div>
            )
          })
        ) : (
          <span className="text-sm text-gray-500">No blockers</span>
        )}
      </div>
      {isEditing && availableTickets.length > 0 && (
        <select
          onChange={(e) => {
            if (e.target.value) {
              addBlocker(e.target.value)
              e.target.value = ''
            }
          }}
          className="w-full bg-[#27272a] border border-[#3f3f46] rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
          defaultValue=""
        >
          <option value="">Add a blocking ticket...</option>
          {availableTickets.map((t) => {
            const tProject = typeof t.project === 'object' ? t.project : null
            return (
              <option key={t.id} value={t.id}>
                {t.ticketId} - {t.title} {tProject ? `(${tProject.name})` : ''}
              </option>
            )
          })}
        </select>
      )}
    </div>
  )

  const BlocksSection = () => (
    <div className="bg-[#1f1f23] rounded-lg p-4">
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
        <Ban className="w-3 h-3 rotate-180" />
        Blocks
      </div>
      <div className="space-y-2">
        {blockedTickets.length > 0 ? (
          blockedTickets.map((blocked) => {
            const blockedProject = typeof blocked.project === 'object' ? blocked.project : null
            return (
              <div key={blocked.id} className="flex items-center gap-2 p-2 bg-[#27272a] rounded-md">
                <Ban className={`w-4 h-4 ${blocked.status === 'DONE' ? 'text-green-500' : 'text-red-500'}`} />
                <span
                  className="text-xs font-medium px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: blockedProject ? `${blockedProject.color}20` : '#27272a',
                    color: blockedProject?.color as string || '#888',
                  }}
                >
                  {blocked.ticketId}
                </span>
                <span className={`flex-1 text-sm ${blocked.status === 'DONE' ? 'text-gray-500 line-through' : 'text-white'}`}>
                  {blocked.title}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded ${blocked.status === 'DONE' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {blocked.status === 'DONE' ? 'Done' : 'Waiting'}
                </span>
              </div>
            )
          })
        ) : (
          <span className="text-sm text-gray-500">This ticket doesn&apos;t block any other tickets</span>
        )}
      </div>
    </div>
  )

  const DependencyGraphSection = () => (
    !isEditing && (blockingTickets.length > 0 || blockedTickets.length > 0) ? (
      <div className="bg-[#1f1f23] rounded-lg p-4">
        <button
          onClick={() => setShowDependencyGraph(!showDependencyGraph)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <GitBranch className="w-3 h-3" />
            Dependency Graph
          </div>
          {showDependencyGraph ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </button>
        {showDependencyGraph && (
          <div className="mt-3">
            <DependencyGraph ticket={ticket} allTickets={allTickets} />
          </div>
        )}
      </div>
    ) : null
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div
        className={`relative bg-[#18181b] border border-[#27272a] overflow-hidden transition-all duration-200 ${
          isFullScreen
            ? 'w-full h-full max-w-none rounded-none'
            : 'w-full max-w-2xl mx-4 max-h-[90vh] rounded-lg'
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#18181b] border-b border-[#27272a] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {project && (
              <span
                className="text-sm font-medium px-2 py-1 rounded"
                style={{
                  backgroundColor: `${project.color}20`,
                  color: project.color as string,
                }}
              >
                {ticket.ticketId}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsFullScreen(!isFullScreen)}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                  title={isFullScreen ? 'Exit full screen' : 'Full screen'}
                >
                  {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                  title="Edit"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className={`overflow-y-auto ${isFullScreen ? 'h-[calc(100vh-73px)]' : 'max-h-[calc(90vh-73px)]'}`}>
          <div className={`p-6 ${isFullScreen ? 'max-w-7xl mx-auto' : ''}`}>
            {isFullScreen ? (
              /* Fullscreen: Two-column layout */
              <div className="flex gap-8">
                {/* Left Column - Main Content */}
                <div className="flex-1 min-w-0">
                  <TitleSection />
                  <DescriptionSection minHeight="300px" />
                  <SubtasksSection />
                  <div className="mb-6">
                    <BlockedBySection />
                  </div>
                  <div className="mb-6">
                    <BlocksSection />
                  </div>
                  <DependencyGraphSection />
                </div>

                {/* Right Column - Metadata Sidebar */}
                <div className="w-80 flex-shrink-0 space-y-4">
                  <StatusSection />
                  <PrioritySection />
                  <ProjectSection />
                  <TeamSection />
                  <DueDateSection />
                  <LabelsSection />

                  {/* Timestamps */}
                  <div className="bg-[#1f1f23] rounded-lg p-4 text-xs text-gray-500">
                    <div className="space-y-1">
                      <div>Created {formatDate(ticket.createdAt)}</div>
                      <div>Updated {formatDate(ticket.updatedAt)}</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Normal: Single-column layout */
              <>
                <TitleSection />
                <DescriptionSection />
                <SubtasksSection />

                {/* Meta Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <StatusSection />
                  <PrioritySection />
                  <ProjectSection />
                  <TeamSection />
                </div>

                <div className="mb-6">
                  <DueDateSection />
                </div>

                <div className="mb-6">
                  <BlockedBySection />
                </div>

                <div className="mb-6">
                  <BlocksSection />
                </div>

                <div className="mb-6">
                  <DependencyGraphSection />
                </div>

                <div className="mb-6">
                  <LabelsSection />
                </div>

                {/* Timestamps */}
                <div className="border-t border-[#27272a] pt-4 text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>Created {formatDate(ticket.createdAt)}</span>
                    <span>Updated {formatDate(ticket.updatedAt)}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
