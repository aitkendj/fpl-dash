import { loadDashboardSnapshot } from "@/lib/server/snapshot"
import { MyTeamView } from "@/components/my-team/MyTeamView"
import { SourceBanner } from "@/components/system/SourceBanner"

export default async function MyTeamPage() {
  const snapshot = await loadDashboardSnapshot()

  return (
    <div className="space-y-6">
      <SourceBanner
        status={snapshot.status}
        projectionGameweek={snapshot.projectionGameweek}
      />
      <MyTeamView squad={snapshot.squad} manager={snapshot.manager} />
    </div>
  )
}
