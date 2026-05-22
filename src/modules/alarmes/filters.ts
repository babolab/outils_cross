import type { AlarmRow } from './types'

export function filterForShip(rows: AlarmRow[], ship: string, dateStart: Date, dateEnd: Date): AlarmRow[] {
  const start = dateStart.getTime()
  const end = dateEnd.getTime() + 86400000 - 1 // inclusive end of day
  return rows
    .filter(
      (r) =>
        (r.ship_name === ship || r.target_1_ship_name === ship) &&
        r.event_dt_local.getTime() >= start &&
        r.event_dt_local.getTime() <= end,
    )
    .sort((a, b) => a.event_dt_local.getTime() - b.event_dt_local.getTime())
}

export function allShips(rows: AlarmRow[]): string[] {
  const ships = new Set<string>()
  for (const r of rows) {
    ships.add(r.ship_name)
    ships.add(r.target_1_ship_name)
  }
  return [...ships].sort()
}
