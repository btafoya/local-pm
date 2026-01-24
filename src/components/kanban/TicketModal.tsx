'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Trash2, CheckSquare, Square, Ban } from 'lucide-react'
import { TicketStatus, TicketPriority, TICKET_STATUS_OPTIONS, TICKET_PRIORITY_OPTIONS } from '@/types/enums'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import type { Project, Team, Ticket } from '@/payload-types'

interface TicketModalProps {
  isOpen: boolean
  onClose: () => void
  ticket: Ticket | null
  projects: Project[]
  teams: Team[]
  allTickets: Ticket[]
  onSave: (ticket: Ticket) => void
  defaultProjectId?: string | null
}

interface Label {
  name: string
  color: string
}

interface Subtask {
  title: string
  completed: boolean
}

export function TicketModal({
  isOpen,
  onClose,
  ticket,
  projects,
  teams,
  allTickets,
  onSave,
  defaultProjectId,
}: TicketModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TicketStatus>(TicketStatus.TODO)
  const [priority, setPriority] = useState<TicketPriority>(TicketPriority.NO_PRIORITY)
  const [projectId, setProjectId] = useState('')
  const [teamId, setTeamId] = useState('')
  const [labels, setLabels] = useState<Label[]>([])
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [blockedByIds, setBlockedByIds] = useState<string[]>([])
  const [dueDate, setDueDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newLabelName, setNewLabelName] = useState('')
  const [newLabelColor, setNewLabelColor] = useState('#6366f1')
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')

  useEffect(() => {
    if (ticket) {
      setTitle(ticket.title)
      setDescription(ticket.description as unknown as string || '')
      setStatus(ticket.status as TicketStatus)
      setPriority(ticket.priority as TicketPriority || TicketPriority.NO_PRIORITY)
      setProjectId(typeof ticket.project === 'string' ? ticket.project : ticket.project?.id || '')
      setTeamId(typeof ticket.team === 'string' ? ticket.team : ticket.team?.id || '')
      setLabels((ticket.labels || []).map(l => ({ name: l.name, color: l.color ?? '#6366f1' })))
      setSubtasks((ticket.subtasks || []).map(st => ({ title: st.title, completed: st.completed ?? false })))
      setBlockedByIds((ticket.blockedBy || []).map(t => typeof t === 'string' ? t : t.id))
      setDueDate(ticket.dueDate || '')
    } else {
      setTitle('')
      setDescription('')
      setStatus(TicketStatus.TODO)
      setPriority(TicketPriority.NO_PRIORITY)
      setProjectId(defaultProjectId || '')
      setTeamId('')
      setLabels([])
      setSubtasks([])
      setBlockedByIds([])
      setDueDate('')
    }
  }, [ticket, defaultProjectId, isOpen])

  // Available tickets for blocking (exclude self and already selected)
  const availableTickets = (allTickets || []).filter(t =>
    (!ticket || t.id !== ticket.id) && !blockedByIds.includes(t.id)
  )

  const addBlocker = (ticketId: string) => {
    if (!blockedByIds.includes(ticketId)) {
      setBlockedByIds([...blockedByIds, ticketId])
    }
  }

  const removeBlocker = (ticketId: string) => {
    setBlockedByIds(blockedByIds.filter(id => id !== ticketId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !projectId) return

    setIsSubmitting(true)

    try {
      const payload = {
        title: title.trim(),
        description: description || null,
        status,
        priority,
        project: projectId,
        team: teamId || null,
        labels,
        subtasks,
        blockedBy: blockedByIds,
        dueDate: dueDate || null,
      }

      const url = ticket ? `/api/tickets/${ticket.id}` : '/api/tickets'
      const method = ticket ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('Failed to save ticket')
      }

      const savedTicket = await response.json()
      onSave(savedTicket.doc || savedTicket)
    } catch (error) {
      console.error('Failed to save ticket:', error)
    } finally {
      setIsSubmitting(false)
    }
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#18181b] border border-[#27272a] rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#18181b] flex items-center justify-between px-6 py-4 border-b border-[#27272a] z-10">
          <h2 className="text-lg font-semibold text-white">
            {ticket ? 'Edit Ticket' : 'Create Ticket'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full bg-[#1f1f23] border border-[#27272a] rounded-md px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Description
            </label>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="Describe the task in detail..."
            />
          </div>

          {/* Project & Team */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Project <span className="text-red-500">*</span>
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full bg-[#1f1f23] border border-[#27272a] rounded-md px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                required
              >
                <option value="">Select project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Team
              </label>
              <select
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className="w-full bg-[#1f1f23] border border-[#27272a] rounded-md px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">No team</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TicketStatus)}
                className="w-full bg-[#1f1f23] border border-[#27272a] rounded-md px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              >
                {TICKET_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TicketPriority)}
                className="w-full bg-[#1f1f23] border border-[#27272a] rounded-md px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              >
                {TICKET_PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-[#1f1f23] border border-[#27272a] rounded-md px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Subtasks */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Subtasks
            </label>
            <div className="space-y-2 mb-2">
              {subtasks.map((subtask, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-[#1f1f23] border border-[#27272a] rounded-md"
                >
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
                  <button
                    type="button"
                    onClick={() => removeSubtask(index)}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
                placeholder="Add a subtask..."
                className="flex-1 bg-[#1f1f23] border border-[#27272a] rounded-md px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={addSubtask}
                className="p-2 bg-[#27272a] hover:bg-[#3f3f46] rounded-md transition-colors"
              >
                <Plus className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Labels */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Labels
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {labels.map((label, index) => (
                <span
                  key={index}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded"
                  style={{
                    backgroundColor: `${label.color}20`,
                    color: label.color,
                  }}
                >
                  {label.name}
                  <button
                    type="button"
                    onClick={() => removeLabel(index)}
                    className="hover:opacity-70"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                placeholder="Label name"
                className="flex-1 bg-[#1f1f23] border border-[#27272a] rounded-md px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
              <input
                type="color"
                value={newLabelColor}
                onChange={(e) => setNewLabelColor(e.target.value)}
                className="w-10 h-8 bg-[#1f1f23] border border-[#27272a] rounded cursor-pointer"
              />
              <button
                type="button"
                onClick={addLabel}
                className="p-2 bg-[#27272a] hover:bg-[#3f3f46] rounded-md transition-colors"
              >
                <Plus className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Blocked By */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              <span className="flex items-center gap-1">
                <Ban className="w-3 h-3" />
                Blocked By
              </span>
            </label>
            <div className="space-y-2 mb-2">
              {blockedByIds.map((blockerId) => {
                const blocker = (allTickets || []).find(t => t.id === blockerId)
                if (!blocker) return null
                const blockerProject = typeof blocker.project === 'object' ? blocker.project : null
                return (
                  <div
                    key={blockerId}
                    className="flex items-center gap-2 p-2 bg-[#1f1f23] border border-[#27272a] rounded-md"
                  >
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
                    <span className={`flex-1 text-sm truncate ${blocker.status === 'DONE' ? 'text-gray-500 line-through' : 'text-white'}`}>
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
              })}
            </div>
            {availableTickets.length > 0 && (
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    addBlocker(e.target.value)
                    e.target.value = ''
                  }
                }}
                className="w-full bg-[#1f1f23] border border-[#27272a] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
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

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[#27272a]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !projectId}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : ticket ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
