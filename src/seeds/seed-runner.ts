import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../payload.config'
import { ProjectStatus, TicketStatus, TicketPriority } from '../types/enums'

interface SeedProject {
  name: string
  prefix: string
  color: string
  icon: string
  status: ProjectStatus
}

interface SeedTeam {
  name: string
  description: string | null
  color: string
}

interface SeedTicket {
  title: string
  status: TicketStatus
  priority: TicketPriority
  projectPrefix: string
  teamName: string | null
  labels: { name: string; color: string }[]
}

const SEED_PROJECTS: SeedProject[] = [
  {
    name: 'Website Redesign',
    prefix: 'WEB',
    color: '#6366f1',
    icon: 'rocket',
    status: ProjectStatus.ACTIVE,
  },
  {
    name: 'Mobile App',
    prefix: 'APP',
    color: '#8b5cf6',
    icon: 'zap',
    status: ProjectStatus.ACTIVE,
  },
  {
    name: 'Backend API',
    prefix: 'API',
    color: '#22c55e',
    icon: 'database',
    status: ProjectStatus.ACTIVE,
  },
]

const SEED_TEAMS: SeedTeam[] = [
  {
    name: 'Engineering',
    description: null,
    color: '#3b82f6',
  },
  {
    name: 'QA',
    description: null,
    color: '#f97316',
  },
  {
    name: 'Design',
    description: null,
    color: '#ec4899',
  },
  {
    name: 'Product',
    description: null,
    color: '#14b8a6',
  },
]

const SEED_TICKETS: SeedTicket[] = [
  // Website Redesign tickets
  {
    title: 'Design new homepage layout',
    status: TicketStatus.DONE,
    priority: TicketPriority.HIGH,
    projectPrefix: 'WEB',
    teamName: 'Design',
    labels: [{ name: 'design', color: '#ec4899' }],
  },
  {
    title: 'Implement responsive navigation',
    status: TicketStatus.IN_PROGRESS,
    priority: TicketPriority.HIGH,
    projectPrefix: 'WEB',
    teamName: 'Engineering',
    labels: [{ name: 'frontend', color: '#3b82f6' }],
  },
  {
    title: 'Create color palette and typography system',
    status: TicketStatus.DONE,
    priority: TicketPriority.MEDIUM,
    projectPrefix: 'WEB',
    teamName: 'Design',
    labels: [{ name: 'design', color: '#ec4899' }],
  },
  {
    title: 'Build hero section component',
    status: TicketStatus.TODO,
    priority: TicketPriority.MEDIUM,
    projectPrefix: 'WEB',
    teamName: 'Engineering',
    labels: [{ name: 'frontend', color: '#3b82f6' }],
  },
  {
    title: 'Setup analytics tracking',
    status: TicketStatus.TODO,
    priority: TicketPriority.LOW,
    projectPrefix: 'WEB',
    teamName: null,
    labels: [],
  },
  // Mobile App tickets
  {
    title: 'Setup React Native project',
    status: TicketStatus.DONE,
    priority: TicketPriority.URGENT,
    projectPrefix: 'APP',
    teamName: 'Engineering',
    labels: [{ name: 'setup', color: '#22c55e' }],
  },
  {
    title: 'Design app navigation flow',
    status: TicketStatus.IN_PROGRESS,
    priority: TicketPriority.HIGH,
    projectPrefix: 'APP',
    teamName: 'Design',
    labels: [{ name: 'design', color: '#ec4899' }, { name: 'ux', color: '#a855f7' }],
  },
  {
    title: 'Implement authentication screens',
    status: TicketStatus.TODO,
    priority: TicketPriority.HIGH,
    projectPrefix: 'APP',
    teamName: 'Engineering',
    labels: [{ name: 'auth', color: '#ef4444' }],
  },
  {
    title: 'Create push notification service',
    status: TicketStatus.TODO,
    priority: TicketPriority.MEDIUM,
    projectPrefix: 'APP',
    teamName: 'Engineering',
    labels: [{ name: 'backend', color: '#14b8a6' }],
  },
  // Backend API tickets
  {
    title: 'Setup database schema',
    status: TicketStatus.DONE,
    priority: TicketPriority.URGENT,
    projectPrefix: 'API',
    teamName: 'Engineering',
    labels: [{ name: 'database', color: '#f97316' }],
  },
  {
    title: 'Implement user authentication endpoints',
    status: TicketStatus.DONE,
    priority: TicketPriority.HIGH,
    projectPrefix: 'API',
    teamName: 'Engineering',
    labels: [{ name: 'auth', color: '#ef4444' }, { name: 'api', color: '#6366f1' }],
  },
  {
    title: 'Create REST API documentation',
    status: TicketStatus.IN_PROGRESS,
    priority: TicketPriority.MEDIUM,
    projectPrefix: 'API',
    teamName: null,
    labels: [{ name: 'docs', color: '#64748b' }],
  },
  {
    title: 'Add rate limiting middleware',
    status: TicketStatus.TODO,
    priority: TicketPriority.MEDIUM,
    projectPrefix: 'API',
    teamName: 'Engineering',
    labels: [{ name: 'security', color: '#ef4444' }],
  },
  {
    title: 'Setup CI/CD pipeline',
    status: TicketStatus.TODO,
    priority: TicketPriority.LOW,
    projectPrefix: 'API',
    teamName: null,
    labels: [{ name: 'devops', color: '#8b5cf6' }],
  },
]

async function seed() {
  console.log('Starting seed...')

  const payload = await getPayload({ config })

  // Clear existing data
  console.log('Clearing existing data...')
  await payload.delete({ collection: 'tickets', where: {} })
  await payload.delete({ collection: 'projects', where: {} })
  await payload.delete({ collection: 'teams', where: {} })

  // Create teams
  console.log('Creating teams...')
  const teamMap = new Map<string, string>()
  for (const team of SEED_TEAMS) {
    const created = await payload.create({
      collection: 'teams',
      data: team as any,
    })
    teamMap.set(team.name, created.id)
  }

  // Create projects
  console.log('Creating projects...')
  const projectMap = new Map<string, string>()
  for (const project of SEED_PROJECTS) {
    const created = await payload.create({
      collection: 'projects',
      data: project as any,
    })
    projectMap.set(project.prefix, created.id)
  }

  // Create tickets
  console.log('Creating tickets...')
  for (const ticket of SEED_TICKETS) {
    const projectId = projectMap.get(ticket.projectPrefix)
    const teamId = ticket.teamName ? teamMap.get(ticket.teamName) : null

    if (!projectId) {
      console.error(`Project not found: ${ticket.projectPrefix}`)
      continue
    }

    await payload.create({
      collection: 'tickets',
      data: {
        title: ticket.title,
        status: ticket.status,
        priority: ticket.priority,
        project: projectId,
        team: teamId,
        labels: ticket.labels,
      },
    })
  }

  console.log('Seed completed!')
  process.exit(0)
}

seed().catch((error) => {
  console.error('Seed failed:', error)
  process.exit(1)
})
