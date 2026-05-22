import type { LayerVisibility } from './types'

interface Props {
  visibility: LayerVisibility
  onChange: (v: LayerVisibility) => void
  hasData: { mothy: boolean; vts: boolean; anais: boolean }
}

export default function LayerControls({ visibility, onChange, hasData }: Props) {
  const toggle = (key: keyof LayerVisibility) =>
    onChange({ ...visibility, [key]: !visibility[key] })

  const items: { key: keyof LayerVisibility; label: string; color: string; available: boolean }[] = [
    { key: 'mothy', label: 'Dérive MOTHY', color: '#06b6d4', available: hasData.mothy },
    { key: 'barycenter', label: 'Barycentre', color: '#ef4444', available: hasData.mothy },
    { key: 'vts', label: 'Navires VTS', color: '#60a5fa', available: hasData.vts },
    { key: 'anais', label: 'Flotte ANAIS', color: '#22c55e', available: hasData.anais },
  ]

  return (
    <div className="bg-slate-800 rounded-lg p-3 space-y-2">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Couches</p>
      {items.map(({ key, label, color, available }) => (
        <label
          key={key}
          className={`flex items-center gap-2 cursor-pointer ${!available ? 'opacity-40' : ''}`}
        >
          <input
            type="checkbox"
            checked={visibility[key] && available}
            disabled={!available}
            onChange={() => toggle(key)}
            className="rounded"
          />
          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
          <span className="text-sm text-slate-300">{label}</span>
        </label>
      ))}
    </div>
  )
}
