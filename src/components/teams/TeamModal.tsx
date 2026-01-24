'use client'
import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { PROJECT_COLORS } from '@/types/enums'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import type { Team } from '@/payload-types'
interface TeamModalProps {
  isOpen: boolean
  onClose: () => void
  team: Team | null
  onSave: (team: Team) => void
}
export function TeamModal({ isOpen, onClose, team, onSave }: TeamModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#6366f1')
  const [isSubmitting, setIsSubmitting] = useState(false)
  useEffect(() => {
    if (team) {
      setName(team.name)
      setDescription(team.description as unknown as string || '')
      setColor(team.color as string || '#6366f1')
    } else {
      setName('')
      setDescription('')
      setColor('#6366f1')
    }
  }, [team, isOpen])
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setIsSubmitting(true)
    try {
      const payload = {
        name: name.trim(),
        description: description || null,
        color,
      }
      const url = team ? `/api/teams/${team.id}` : '/api/teams'
      const method = team ? 'PATCH' : 'POST'
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        throw new Error('Failed to save team')
      }
      const savedTeam = await response.json()
      onSave(savedTeam.doc || savedTeam)
    } catch (error) {
      console.error('Failed to save team:', error)
    } finally {
      setIsSubmitting(false)
    }
  }
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-[#18181b] border border-[#27272a] rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#18181b] flex items-center justify-between px-6 py-4 border-b border-[#27272a]">
          <h2 className="text-lg font-semibold text-white">
            {team ? 'Edit Team' : 'Create Team'}
          </h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Engineering"
              className="w-full bg-[#1f1f23] border border-[#27272a] rounded-md px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>
          <div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="Describe the team's responsibilities, goals, and expertise..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Color</label>
            <div className="grid grid-cols-6 gap-2">
              {PROJECT_COLORS.map((colorOption) => (
                <button
                  key={colorOption}
                  type="button"
                  onClick={() => setColor(colorOption)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    color === colorOption ? 'border-white scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: colorOption }}
                />
              ))}
            </div>
          </div>
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
              disabled={isSubmitting || !name.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : team ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
