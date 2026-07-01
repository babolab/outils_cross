import { useState } from 'react'

const quizzes = [
  { id: 'nouvel-arrivant', label: 'Géo — Débutant', src: '/quizz/nouvel-arrivant.html' },
  { id: 'confirme',        label: 'Géo — Confirmé', src: '/quizz/confirme.html' },
  { id: 'snsm',           label: 'Quiz SNSM',      src: '/quizz/snsm.html' },
]

export default function QuizzModule() {
  const [active, setActive] = useState(quizzes[0].id)
  const current = quizzes.find(q => q.id === active)!

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1 px-4 pt-3 pb-0 border-b border-slate-700 bg-slate-900">
        {quizzes.map(q => (
          <button
            key={q.id}
            onClick={() => setActive(q.id)}
            className={`px-4 py-2 text-sm rounded-t-lg transition-colors ${
              active === q.id
                ? 'bg-slate-800 text-white border border-b-slate-800 border-slate-700'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            {q.label}
          </button>
        ))}
      </div>
      <iframe
        key={active}
        src={current.src}
        className="flex-1 w-full border-none"
        title={current.label}
      />
    </div>
  )
}
