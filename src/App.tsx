import { useHashLocation } from 'wouter/use-hash-location'
import { Router, Route, Link } from 'wouter'
import { Map, FileArchive, Bell, Radio, GraduationCap } from 'lucide-react'
import { cn } from './lib/utils'
import CarteModule from './modules/carte/CarteModule'
import ExtractionModule from './modules/extraction/ExtractionModule'
import AlarmesModule from './modules/alarmes/AlarmesModule'
import EgcModule from './modules/egc/EgcModule'
import SitproxModule from './modules/sitprox/SitproxModule'
import QuizzModule from './modules/quizz/QuizzModule'
import logoUrl from '/logo-cross.png'

const navItems = [
  { path: '/', label: 'Rejeu pollution', icon: Map },
  { path: '/extraction', label: 'Extraction dérive', icon: FileArchive },
  { path: '/alarmes', label: 'Alarmes collision', icon: Bell },
  { path: '/sitprox', label: 'Suivi sitprox', icon: Bell },
  { path: '/egc', label: 'EGC — Adressage', icon: Radio },
  { path: '/quizz', label: 'Quizz opérateurs', icon: GraduationCap },
]

function Sidebar() {
  const [location] = useHashLocation()
  return (
    <aside className="w-56 shrink-0 bg-slate-900 border-r border-slate-700 flex flex-col">
      <div className="p-4 border-b border-slate-700 flex flex-col items-center gap-2">
        <img src={logoUrl} alt="CROSS Jobourg" className="w-16 h-auto rounded" />
        <div className="text-center">
          <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">CROSS Jobourg</p>
          <p className="text-xs text-slate-500 mt-0.5">Outils opérationnels</p>
        </div>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map(({ path, label, icon: Icon }) => {
          const active = location === path
          return (
            <Link
              key={path}
              href={path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100',
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

export default function App() {
  return (
    <Router hook={useHashLocation}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Route path="/" component={CarteModule} />
          <Route path="/extraction" component={ExtractionModule} />
          <Route path="/alarmes" component={AlarmesModule} />
          <Route path="/egc" component={EgcModule} />
          <Route path="/sitprox" component={SitproxModule} />
          <Route path="/quizz" component={QuizzModule} />
        </main>
      </div>
    </Router>
  )
}
