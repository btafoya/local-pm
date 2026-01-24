import { TeamsList } from '@/components/teams/TeamsList'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

export default async function TeamsPage() {
  const payload = await getPayload({ config })

  const teamsResult = await payload.find({
    collection: 'teams',
    limit: 100,
    sort: '-createdAt',
  })

  return <TeamsList initialTeams={teamsResult.docs} />
}
