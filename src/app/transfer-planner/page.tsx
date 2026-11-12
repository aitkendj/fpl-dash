import { loadDashboardSnapshot } from "@/lib/server/snapshot"
import { TransferPlannerView } from "@/components/transfer-planner/TransferPlannerView"
import { SourceBanner } from "@/components/system/SourceBanner"

export default async function TransferPlannerPage() {
  const snapshot = await loadDashboardSnapshot()

  return (
    <div className="space-y-6">
      <SourceBanner
        status={snapshot.status}
        projectionGameweek={snapshot.projectionGameweek}
      />
      <TransferPlannerView
        squad={snapshot.squad}
        players={snapshot.players}
        manager={
          snapshot.manager
            ? {
                bank: snapshot.manager.bank,
                teamValue: snapshot.manager.teamValue,
              }
            : null
        }
      />
    </div>
  )
}
