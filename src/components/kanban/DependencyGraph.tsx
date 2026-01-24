'use client'

import { useMemo, useState } from 'react'
import { ArrowRight, CheckCircle2, Circle, Ban, X, ZoomIn, ZoomOut } from 'lucide-react'
import type { Ticket } from '@/payload-types'

interface DependencyGraphProps {
  ticket: Ticket
  allTickets: Ticket[]
  onTicketClick?: (ticket: Ticket) => void
}

interface GraphNode {
  ticket: Ticket
  x: number
  y: number
  level: number
  type: 'blocker' | 'current' | 'blocked'
}

interface GraphEdge {
  from: GraphNode
  to: GraphNode
}

export function DependencyGraph({ ticket, allTickets, onTicketClick }: DependencyGraphProps) {
  const [zoom, setZoom] = useState(1)

  // Build the dependency graph
  const { nodes, edges, hasGraph } = useMemo(() => {
    const nodeMap = new Map<string, GraphNode>()
    const edges: GraphEdge[] = []

    // Get blocking tickets (blockers of current ticket)
    const blockerIds = (ticket.blockedBy || []).map(t => typeof t === 'string' ? t : t.id)
    const blockers = blockerIds
      .map(id => allTickets.find(t => t.id === id))
      .filter((t): t is Ticket => t !== undefined)

    // Get blocked tickets (tickets that are blocked by current ticket)
    const blockedTickets = allTickets.filter(t => {
      const blockedByIds = (t.blockedBy || []).map(b => typeof b === 'string' ? b : b.id)
      return blockedByIds.includes(ticket.id)
    })

    // No graph if no dependencies
    if (blockers.length === 0 && blockedTickets.length === 0) {
      return { nodes: [], edges: [], hasGraph: false }
    }

    // Layout constants
    const nodeWidth = 180
    const nodeHeight = 60
    const levelGap = 100
    const nodeGap = 20

    // Add blocker nodes (level 0)
    blockers.forEach((blocker, i) => {
      const node: GraphNode = {
        ticket: blocker,
        x: i * (nodeWidth + nodeGap),
        y: 0,
        level: 0,
        type: 'blocker'
      }
      nodeMap.set(blocker.id, node)
    })

    // Add current ticket node (level 1)
    const blockersTotalWidth = blockers.length * (nodeWidth + nodeGap) - nodeGap
    const blockedTotalWidth = blockedTickets.length * (nodeWidth + nodeGap) - nodeGap
    const maxWidth = Math.max(blockersTotalWidth, blockedTotalWidth, nodeWidth)

    const currentNode: GraphNode = {
      ticket,
      x: (maxWidth - nodeWidth) / 2,
      y: blockers.length > 0 ? nodeHeight + levelGap : 0,
      level: 1,
      type: 'current'
    }
    nodeMap.set(ticket.id, currentNode)

    // Add blocked nodes (level 2)
    const blockedStartX = (maxWidth - blockedTotalWidth) / 2
    blockedTickets.forEach((blocked, i) => {
      const node: GraphNode = {
        ticket: blocked,
        x: blockedStartX + i * (nodeWidth + nodeGap),
        y: currentNode.y + nodeHeight + levelGap,
        level: 2,
        type: 'blocked'
      }
      nodeMap.set(blocked.id, node)
    })

    // Center blocker nodes
    if (blockers.length > 0) {
      const blockerStartX = (maxWidth - blockersTotalWidth) / 2
      blockers.forEach((blocker, i) => {
        const node = nodeMap.get(blocker.id)!
        node.x = blockerStartX + i * (nodeWidth + nodeGap)
      })
    }

    // Create edges from blockers to current
    blockers.forEach(blocker => {
      const fromNode = nodeMap.get(blocker.id)!
      edges.push({ from: fromNode, to: currentNode })
    })

    // Create edges from current to blocked
    blockedTickets.forEach(blocked => {
      const toNode = nodeMap.get(blocked.id)!
      edges.push({ from: currentNode, to: toNode })
    })

    return {
      nodes: Array.from(nodeMap.values()),
      edges,
      hasGraph: true
    }
  }, [ticket, allTickets])

  if (!hasGraph) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-500">
        <Circle className="w-8 h-8 mb-2 opacity-50" />
        <p className="text-sm">No dependencies for this ticket</p>
      </div>
    )
  }

  // Calculate SVG dimensions
  const padding = 40
  const nodeWidth = 180
  const nodeHeight = 60
  const maxX = Math.max(...nodes.map(n => n.x)) + nodeWidth + padding * 2
  const maxY = Math.max(...nodes.map(n => n.y)) + nodeHeight + padding * 2

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DONE': return { bg: '#22c55e', text: '#dcfce7', border: '#16a34a' }
      case 'IN_PROGRESS': return { bg: '#3b82f6', text: '#dbeafe', border: '#2563eb' }
      default: return { bg: '#71717a', text: '#e4e4e7', border: '#52525b' }
    }
  }

  const getNodeBorderColor = (node: GraphNode) => {
    if (node.type === 'current') return '#8b5cf6'
    if (node.ticket.status === 'DONE') return '#22c55e'
    return '#f59e0b'
  }

  return (
    <div className="relative">
      {/* Zoom controls */}
      <div className="absolute top-2 right-2 flex items-center gap-1 z-10 bg-[#27272a] rounded-md p-1">
        <button
          onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
          className="p-1 hover:bg-[#3f3f46] rounded transition-colors"
          title="Zoom out"
        >
          <ZoomOut className="w-4 h-4 text-gray-400" />
        </button>
        <span className="text-xs text-gray-400 px-2">{Math.round(zoom * 100)}%</span>
        <button
          onClick={() => setZoom(z => Math.min(1.5, z + 0.1))}
          className="p-1 hover:bg-[#3f3f46] rounded transition-colors"
          title="Zoom in"
        >
          <ZoomIn className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute top-2 left-2 flex items-center gap-4 z-10 text-xs text-gray-400">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span>Blocking</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-violet-500" />
          <span>Current</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Done</span>
        </div>
      </div>

      {/* Graph */}
      <div className="overflow-auto max-h-[400px] mt-8 bg-[#0f0f10] rounded-lg border border-[#27272a]">
        <svg
          width={maxX * zoom}
          height={maxY * zoom}
          viewBox={`0 0 ${maxX} ${maxY}`}
          className="min-w-full"
        >
          <defs>
            {/* Arrow marker */}
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="#6b7280"
              />
            </marker>
            <marker
              id="arrowhead-green"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="#22c55e"
              />
            </marker>
          </defs>

          {/* Edges */}
          {edges.map((edge, i) => {
            const fromX = edge.from.x + padding + nodeWidth / 2
            const fromY = edge.from.y + padding + nodeHeight
            const toX = edge.to.x + padding + nodeWidth / 2
            const toY = edge.to.y + padding

            const isDone = edge.from.ticket.status === 'DONE'
            const midY = (fromY + toY) / 2

            return (
              <g key={i}>
                {/* Curved path */}
                <path
                  d={`M ${fromX} ${fromY}
                      C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${toY - 10}`}
                  fill="none"
                  stroke={isDone ? '#22c55e' : '#6b7280'}
                  strokeWidth="2"
                  strokeDasharray={isDone ? 'none' : '5,5'}
                  markerEnd={isDone ? 'url(#arrowhead-green)' : 'url(#arrowhead)'}
                  className="transition-all duration-300"
                />
              </g>
            )
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const project = typeof node.ticket.project === 'object' ? node.ticket.project : null
            const statusColors = getStatusColor(node.ticket.status as string)
            const borderColor = getNodeBorderColor(node)
            const isClickable = node.type !== 'current' && onTicketClick

            return (
              <g
                key={node.ticket.id}
                transform={`translate(${node.x + padding}, ${node.y + padding})`}
                onClick={() => isClickable && onTicketClick?.(node.ticket)}
                className={isClickable ? 'cursor-pointer' : ''}
              >
                {/* Node background */}
                <rect
                  x="0"
                  y="0"
                  width={nodeWidth}
                  height={nodeHeight}
                  rx="8"
                  fill="#1f1f23"
                  stroke={borderColor}
                  strokeWidth={node.type === 'current' ? '3' : '2'}
                  className={isClickable ? 'hover:brightness-110 transition-all' : ''}
                />

                {/* Status indicator */}
                <circle
                  cx="16"
                  cy={nodeHeight / 2}
                  r="6"
                  fill={statusColors.bg}
                />
                {node.ticket.status === 'DONE' && (
                  <path
                    d="M13 30 L15 32 L19 28"
                    stroke="white"
                    strokeWidth="2"
                    fill="none"
                    transform={`translate(0, ${nodeHeight / 2 - 30})`}
                  />
                )}

                {/* Ticket ID */}
                <text
                  x="30"
                  y="20"
                  fontSize="11"
                  fontWeight="600"
                  fill={project?.color as string || '#888'}
                >
                  {node.ticket.ticketId}
                </text>

                {/* Title (truncated) */}
                <text
                  x="30"
                  y="38"
                  fontSize="12"
                  fill="#fff"
                  className="font-medium"
                >
                  {node.ticket.title.length > 18
                    ? node.ticket.title.substring(0, 18) + '...'
                    : node.ticket.title}
                </text>

                {/* Type indicator for current node */}
                {node.type === 'current' && (
                  <text
                    x={nodeWidth - 10}
                    y="15"
                    fontSize="10"
                    fill="#8b5cf6"
                    textAnchor="end"
                  >
                    ★
                  </text>
                )}

                {/* Blocked indicator */}
                {node.type === 'blocked' && node.ticket.status !== 'DONE' && (
                  <g transform={`translate(${nodeWidth - 20}, ${nodeHeight - 18})`}>
                    <rect
                      x="-2"
                      y="-2"
                      width="18"
                      height="14"
                      rx="3"
                      fill="#f59e0b20"
                    />
                    <text fontSize="8" fill="#f59e0b">
                      blocked
                    </text>
                  </g>
                )}
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
