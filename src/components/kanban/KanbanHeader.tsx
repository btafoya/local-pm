'use client'

import { Plus, Filter, X } from 'lucide-react'
import type { Project, Team } from '@/payload-types'

interface KanbanHeaderProps {
  projects: Project[]
  teams: Team[]
  selectedProjectId: string | null
  selectedTeamId: string | null
  onProjectChange: (projectId: string | null) => void
  onTeamChange: (teamId: string | null) => void
  onCreateTicket: () => void
}

export function KanbanHeader({
  projects,
  teams,
  selectedProjectId,
  selectedTeamId,
  onProjectChange,
  onTeamChange,
  onCreateTicket,
}: KanbanHeaderProps) {
  const selectedProject = projects.find((p) => p.id === selectedProjectId)
  const selectedTeam = teams.find((t) => t.id === selectedTeamId)

  const hasFilters = selectedProjectId || selectedTeamId

  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272a]">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-white">Board</h1>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />

          {/* Project Filter */}
          <select
            value={selectedProjectId || ''}
            onChange={(e) => onProjectChange(e.target.value || null)}
            className="bg-[#1f1f23] border border-[#27272a] text-sm text-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>

          {/* Team Filter */}
          <select
            value={selectedTeamId || ''}
            onChange={(e) => onTeamChange(e.target.value || null)}
            className="bg-[#1f1f23] border border-[#27272a] text-sm text-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Teams</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>

          {/* Clear Filters */}
          {hasFilters && (
            <button
              onClick={() => {
                onProjectChange(null)
                onTeamChange(null)
              }}
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {hasFilters && (
        <div className="flex items-center gap-2">
          {selectedProject && (
            <span
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
              style={{
                backgroundColor: `${selectedProject.color}20`,
                color: selectedProject.color as string,
              }}
            >
              {selectedProject.name}
              <button
                onClick={() => onProjectChange(null)}
                className="hover:opacity-70"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedTeam && (
            <span
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
              style={{
                backgroundColor: `${selectedTeam.color}20`,
                color: selectedTeam.color as string,
              }}
            >
              {selectedTeam.name}
              <button
                onClick={() => onTeamChange(null)}
                className="hover:opacity-70"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Create Button */}
      <button
        onClick={onCreateTicket}
        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
      >
        <Plus className="w-4 h-4" />
        New Ticket
      </button>
    </div>
  )
}
