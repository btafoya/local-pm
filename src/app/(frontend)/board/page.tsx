import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

export default async function BoardPage() {
  const payload = await getPayload({ config })

  const [ticketsResult, projectsResult, teamsResult] = await Promise.all([
    payload.find({
      collection: 'tickets',
      limit: 1000,
      sort: 'sortOrder',
      depth: 2,
    }),
    payload.find({
      collection: 'projects',
      limit: 100,
    }),
    payload.find({
      collection: 'teams',
      limit: 100,
    }),
  ])

  return (
    <KanbanBoard
      initialTickets={ticketsResult.docs}
      projects={projectsResult.docs}
      teams={teamsResult.docs}
    />
  )
}
