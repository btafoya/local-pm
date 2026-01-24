import { ProjectsList } from '@/components/projects/ProjectsList'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

export default async function ProjectsPage() {
  const payload = await getPayload({ config })

  const projectsResult = await payload.find({
    collection: 'projects',
    limit: 100,
    sort: '-createdAt',
  })

  return <ProjectsList initialProjects={projectsResult.docs} />
}
