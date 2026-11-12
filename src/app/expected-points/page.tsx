import { loadDashboardSnapshot } from "@/lib/server/snapshot"
import { ExpectedPointsView } from "@/components/expected-points/ExpectedPointsView"
import { SourceBanner } from "@/components/system/SourceBanner"

export default async function ExpectedPointsPage() {
  const snapshot = await loadDashboardSnapshot()

  return (
    <div className="space-y-6">
      <SourceBanner
        status={snapshot.status}
        projectionGameweek={snapshot.projectionGameweek}
      />
      <ExpectedPointsView
        squad={snapshot.squad}
        players={snapshot.players}
        projectionGameweek={snapshot.projectionGameweek}
      />
    </div>
  )
}
