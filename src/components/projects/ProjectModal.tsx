'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { ProjectStatus, PROJECT_STATUS_OPTIONS, PROJECT_ICONS, PROJECT_COLORS } from '@/types/enums'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import type { Project } from '@/payload-types'

interface ProjectModalProps {
  isOpen: boolean
  onClose: () => void
  project: Project | null
  onSave: (project: Project) => void
}

export function ProjectModal({ isOpen, onClose, project, onSave }: ProjectModalProps) {
  const [name, setName] = useState('')
  const [prefix, setPrefix] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<ProjectStatus>(ProjectStatus.ACTIVE)
  const [icon, setIcon] = useState('folder')
  const [color, setColor] = useState('#6366f1')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (project) {
      setName(project.name)
      setPrefix(project.prefix)
      setDescription(project.description as unknown as string || '')
      setStatus(project.status as ProjectStatus)
      setIcon(project.icon as string || 'folder')
      setColor(project.color as string || '#6366f1')
    } else {
      setName('')
      setPrefix('')
      setDescription('')
      setStatus(ProjectStatus.ACTIVE)
      setIcon('folder')
      setColor('#6366f1')
    }
    setError(null)
  }, [project, isOpen])

  const handlePrefixChange = (value: string) => {
    setPrefix(value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !prefix.trim()) return

    setIsSubmitting(true)
    setError(null)

    try {
      const payload = {
        name: name.trim(),
        prefix: prefix.trim(),
        description: description || null,
        status,
        icon,
        color,
      }

      const url = project ? `/api/projects/${project.id}` : '/api/projects'
      const method = project ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.errors?.[0]?.message || 'Failed to save project')
      }

      const savedProject = await response.json()
      onSave(savedProject.doc || savedProject)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save project')
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
            {project ? 'Edit Project' : 'Create Project'}
          </h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm px-3 py-2 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Project"
              className="w-full bg-[#1f1f23] border border-[#27272a] rounded-md px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Prefix <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={prefix}
              onChange={(e) => handlePrefixChange(e.target.value)}
              placeholder="PROJ"
              className="w-full bg-[#1f1f23] border border-[#27272a] rounded-md px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              required
              disabled={!!project}
            />
            <p className="text-xs text-gray-500 mt-1">2-6 uppercase letters (e.g., PROJ, WEB)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              placeholder="Describe the project goals, scope, and any important details..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              className="w-full bg-[#1f1f23] border border-[#27272a] rounded-md px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
            >
              {PROJECT_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Icon</label>
            <div className="grid grid-cols-6 gap-2">
              {PROJECT_ICONS.map((iconName) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setIcon(iconName)}
                  className={`p-2 rounded border transition-colors ${
                    icon === iconName
                      ? 'border-indigo-500 bg-indigo-500/20'
                      : 'border-[#27272a] hover:border-[#3f3f46]'
                  }`}
                >
                  <span className="text-sm text-gray-300">{iconName}</span>
                </button>
              ))}
            </div>
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
              disabled={isSubmitting || !name.trim() || !prefix.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : project ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
