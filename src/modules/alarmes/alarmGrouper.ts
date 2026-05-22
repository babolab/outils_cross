import type { AlarmRow } from './types'

export function groupAlarms(rows: AlarmRow[]): AlarmRow[] {
  const sorted = [...rows].sort((a, b) => a.event_dt_local.getTime() - b.event_dt_local.getTime())

  // group by couple_key
  const byCouple = new Map<string, AlarmRow[]>()
  for (const row of sorted) {
    const arr = byCouple.get(row.couple_key) ?? []
    arr.push(row)
    byCouple.set(row.couple_key, arr)
  }

  const results: AlarmRow[] = []

  for (const group of byCouple.values()) {
    const used = new Array<boolean>(group.length).fill(false)

    for (let i = 0; i < group.length; i++) {
      if (used[i]) continue
      const refTime = group[i].event_dt_local.getTime()
      const clusterIdx = [i]

      for (let j = i + 1; j < group.length; j++) {
        if (used[j]) continue
        if (Math.abs(group[j].event_dt_local.getTime() - refTime) < 15 * 60 * 1000) {
          clusterIdx.push(j)
        }
      }

      const cluster = clusterIdx.map((k) => group[k])
      const best = cluster.reduce((a, b) => (a.dcpam <= b.dcpam ? a : b))
      const comments = cluster
        .map((r) => r.ack_comment)
        .filter(Boolean)
      const unique = [...new Set(comments)]

      results.push({ ...best, comment_final: unique.length ? unique.join(' | ') : '-' })
      clusterIdx.forEach((k) => { used[k] = true })
    }
  }

  return results.sort((a, b) => a.event_dt_local.getTime() - b.event_dt_local.getTime())
}
