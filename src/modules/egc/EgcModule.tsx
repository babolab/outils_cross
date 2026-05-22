import { useState } from 'react'
import { Copy, Check, AlertTriangle } from 'lucide-react'
import type { EgcFormState, SatCode, PriorityCode, ServiceCode, RepeatCode } from './types'
import { buildEgcLine, validateForm } from './egcCoder'
import EgcMap from './EgcMap'

const DEFAULT_FORM: EgcFormState = {
  sat: '1',
  c1: '3',
  c2: '44',
  c4: '11',
  lat: '',
  latHemi: 'N',
  lon: '',
  lonHemi: 'W',
  radius: '',
  height: '',
  width: '',
  navarea: '',
}

const SAT_OPTIONS: { value: SatCode; label: string }[] = [
  { value: '0', label: '0 — Atlantique Ouest' },
  { value: '1', label: '1 — Atlantique Est' },
  { value: '2', label: '2 — Pacifique' },
  { value: '3', label: '3 — Indien' },
  { value: '4', label: '4 — Tous les satellites' },
  { value: '9', label: '9 — Indien + Atlantique Est' },
]

const C1_OPTIONS: { value: PriorityCode; label: string; color?: string }[] = [
  { value: '0', label: '0 — Routine' },
  { value: '1', label: '1 — Sécurité' },
  { value: '2', label: '2 — Urgent (Inquiétude)' },
  { value: '3', label: '3 — Détresse (Mayday relay)', color: 'text-red-400' },
]

const C2_OPTIONS: { value: ServiceCode; label: string }[] = [
  { value: '00', label: '00 — Appel global (tous navires)' },
  { value: '14', label: '14 — Alerte de détresse — zone circulaire' },
  { value: '31', label: '31 — Opérations en zone NAVAREA' },
  { value: '34', label: '34 — Coordination SAR — zone rectangulaire' },
  { value: '44', label: '44 — Coordination SAR — zone circulaire' },
]

const C4_OPTIONS: { value: RepeatCode; label: string; highlight?: boolean }[] = [
  { value: '11', label: '11 — 2 appels séparés de 6 min (SAR)', highlight: true },
  { value: '61', label: '61 — 2 appels séparés de 1 heure' },
  { value: '62', label: '62 — 2 appels séparés de 2 heures' },
  { value: '63', label: '63 — 2 appels séparés de 3 heures' },
  { value: '64', label: '64 — 2 appels séparés de 4 heures' },
  { value: '66', label: '66 — 2 appels séparés de 12 heures' },
  { value: '67', label: '67 — 2 appels séparés de 24 heures' },
  { value: '70', label: '70 — 3 appels séparés de 12 heures' },
  { value: '71', label: '71 — 3 appels (1 + 24h + 12h après)' },
]

function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string; color?: string; highlight?: boolean }[]
  onChange: (v: T) => void
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full bg-slate-700 text-slate-200 text-sm px-2 py-1.5 rounded border border-slate-600 focus:outline-none focus:border-blue-500"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className={o.color ?? ''}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function NumInput({
  label,
  value,
  onChange,
  maxLen,
  placeholder,
  hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  maxLen: number
  placeholder: string
  hint?: string
}) {
  return (
    <div className="flex-1">
      <label className="block text-xs text-slate-400 mb-1">{label}</label>
      <input
        type="number"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLen}
        className="w-full bg-slate-700 text-slate-200 text-sm px-2 py-1.5 rounded border border-slate-600 focus:outline-none focus:border-blue-500"
      />
      {hint && <p className="text-xs text-slate-500 mt-0.5">{hint}</p>}
    </div>
  )
}

function HemiSelect({
  value,
  options,
  onChange,
}: {
  value: string
  options: string[]
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1">&nbsp;</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-slate-700 text-slate-200 text-sm px-2 py-1.5 rounded border border-slate-600 focus:outline-none focus:border-blue-500"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  )
}

export default function EgcModule() {
  const [form, setForm] = useState<EgcFormState>(DEFAULT_FORM)
  const [copied, setCopied] = useState(false)

  function update<K extends keyof EgcFormState>(key: K, value: EgcFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const errors = validateForm(form)
  const egcLine = buildEgcLine(form)
  const isDetresse = form.c1 === '3'
  const isCircular = form.c2 === '14' || form.c2 === '44'
  const isRect = form.c2 === '34'
  const isNavarea = form.c2 === '31'
  const isGlobal = form.c2 === '00'

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(egcLine)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for non-HTTPS environments
      const el = document.createElement('textarea')
      el.value = egcLine
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-6 pt-5 pb-3 border-b border-slate-700 space-y-3">
        <div>
          <h1 className="text-xl font-bold text-blue-300">EGC — Adressage</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Génération de la ligne d'adressage pour les messages EGC (Enhanced Group Call) de détresse.
          </p>
        </div>
        <div className="flex items-start gap-2 bg-amber-950/60 border border-amber-700/50 rounded-lg px-3 py-2">
          <AlertTriangle size={14} className="text-amber-400 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-300">
            <strong>Responsabilité opérateur :</strong> L'opérateur est seul responsable de vérifier la cohérence et
            l'exactitude de l'adressage EGC fourni par cet applicatif avant tout envoi. Cet outil est une aide à la
            rédaction et ne se substitue pas au jugement opérationnel.
          </p>
        </div>
      </div>

      {/* Two-column body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: form */}
        <div className="w-80 shrink-0 overflow-y-auto p-4 border-r border-slate-700 space-y-4">

          {/* SAT */}
          <SelectField
            label="SAT — Satellite"
            value={form.sat}
            options={SAT_OPTIONS}
            onChange={(v) => update('sat', v)}
          />

          {/* C1 */}
          <div>
            <SelectField
              label="C1 — Priorité"
              value={form.c1}
              options={C1_OPTIONS}
              onChange={(v) => update('c1', v)}
            />
            {isDetresse && (
              <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                <AlertTriangle size={11} />
                Priorité DÉTRESSE sélectionnée — vérifier l'adressage avant envoi
              </p>
            )}
          </div>

          {/* C2 */}
          <SelectField
            label="C2 — Code de service / type de zone"
            value={form.c2}
            options={C2_OPTIONS}
            onChange={(v) => update('c2', v)}
          />

          {/* C3 — dynamic */}
          {!isGlobal && (
            <div className="space-y-3 border border-slate-600 rounded-lg p-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">C3 — Zone</p>

              {isCircular && (
                <>
                  <div className="flex gap-2 items-end">
                    <NumInput
                      label="Latitude centre (°)"
                      value={form.lat}
                      onChange={(v) => update('lat', v)}
                      maxLen={2}
                      placeholder="00–90"
                      hint="2 chiffres"
                    />
                    <HemiSelect
                      value={form.latHemi}
                      options={['N', 'S']}
                      onChange={(v) => update('latHemi', v as 'N' | 'S')}
                    />
                  </div>
                  <div className="flex gap-2 items-end">
                    <NumInput
                      label="Longitude centre (°)"
                      value={form.lon}
                      onChange={(v) => update('lon', v)}
                      maxLen={3}
                      placeholder="000–180"
                      hint="3 chiffres"
                    />
                    <HemiSelect
                      value={form.lonHemi}
                      options={['E', 'W']}
                      onChange={(v) => update('lonHemi', v as 'E' | 'W')}
                    />
                  </div>
                  <NumInput
                    label="Rayon (milles nautiques)"
                    value={form.radius}
                    onChange={(v) => update('radius', v)}
                    maxLen={3}
                    placeholder="001–999"
                    hint="3 chiffres"
                  />
                </>
              )}

              {isRect && (
                <>
                  <p className="text-xs text-slate-500">Coin Sud-Ouest du rectangle :</p>
                  <div className="flex gap-2 items-end">
                    <NumInput
                      label="Latitude SW (°)"
                      value={form.lat}
                      onChange={(v) => update('lat', v)}
                      maxLen={2}
                      placeholder="00–90"
                      hint="2 chiffres"
                    />
                    <HemiSelect
                      value={form.latHemi}
                      options={['N', 'S']}
                      onChange={(v) => update('latHemi', v as 'N' | 'S')}
                    />
                  </div>
                  <div className="flex gap-2 items-end">
                    <NumInput
                      label="Longitude SW (°)"
                      value={form.lon}
                      onChange={(v) => update('lon', v)}
                      maxLen={3}
                      placeholder="000–180"
                      hint="3 chiffres"
                    />
                    <HemiSelect
                      value={form.lonHemi}
                      options={['E', 'W']}
                      onChange={(v) => update('lonHemi', v as 'E' | 'W')}
                    />
                  </div>
                  <NumInput
                    label="Hauteur (degrés de latitude)"
                    value={form.height}
                    onChange={(v) => update('height', v)}
                    maxLen={2}
                    placeholder="01–90"
                    hint="2 chiffres — vers le Nord depuis SW"
                  />
                  <NumInput
                    label="Largeur (degrés de longitude)"
                    value={form.width}
                    onChange={(v) => update('width', v)}
                    maxLen={3}
                    placeholder="001–360"
                    hint="3 chiffres — vers l'Est depuis SW"
                  />
                </>
              )}

              {isNavarea && (
                <NumInput
                  label="Numéro de zone NAVAREA"
                  value={form.navarea}
                  onChange={(v) => update('navarea', v)}
                  maxLen={2}
                  placeholder="01–21"
                  hint="2 chiffres"
                />
              )}
            </div>
          )}

          {isGlobal && (
            <p className="text-xs text-slate-500 border border-slate-600 rounded-lg px-3 py-2">
              C3 = <code className="text-slate-300">00</code> — aucune zone géographique à renseigner.
            </p>
          )}

          {/* C4 */}
          <SelectField
            label="C4 — Cadence de répétition"
            value={form.c4}
            options={C4_OPTIONS}
            onChange={(v) => update('c4', v)}
          />
          {form.c4 === '11' && (
            <p className="text-xs text-blue-400 -mt-2 flex items-center gap-1">
              ★ Cadence SAR recommandée (2 × 6 min)
            </p>
          )}

          {/* C5 */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
              C5 — Présentation
            </label>
            <div className="bg-slate-800 text-slate-500 text-sm px-2 py-1.5 rounded border border-slate-700 select-none">
              00 (fixe)
            </div>
          </div>

          {/* Validation errors */}
          {errors.length > 0 && (
            <div className="space-y-1">
              {errors.map((e, i) => (
                <p key={i} className="text-xs text-red-400">• {e}</p>
              ))}
            </div>
          )}
        </div>

        {/* Right: map */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 relative">
            <EgcMap form={form} />
          </div>

          {/* Generated EGC line */}
          <div className="shrink-0 border-t border-slate-700 p-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Ligne d'adressage EGC générée
            </p>
            <div className="flex items-center gap-3">
              <code
                className={`flex-1 font-mono text-base px-4 py-2.5 rounded-lg border ${
                  isDetresse
                    ? 'bg-red-950/40 border-red-700/50 text-red-200'
                    : 'bg-slate-800 border-slate-600 text-green-300'
                }`}
              >
                {egcLine}
              </code>
              <button
                onClick={handleCopy}
                disabled={errors.length > 0}
                title="Copier la ligne d'adressage"
                className="flex items-center gap-2 px-3 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
              >
                {copied ? <Check size={16} className="text-green-300" /> : <Copy size={16} />}
                {copied ? 'Copié' : 'Copier'}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              À coller dans le champ adressage de votre interface d'envoi EGC. Le corps du message et <code>NNNN</code> sont à saisir séparément.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
