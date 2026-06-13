'use client'

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { useState, useEffect } from 'react'
import { Trophy } from 'lucide-react'
import { getMatrixDataByPhase } from '@/app/actions'

interface RankingUser {
  username: string
  points: number
}

interface Match {
  id: string
  home_team: string
  away_team: string
  home_score?: number
  away_score?: number
  phase: string
  match_date: string
}

const PHASES = [
  { key: 'groups', label: 'Fase de Grupos' },
  { key: 'Dieciseisavos', label: 'Dieciseisavos' },
  { key: 'round16', label: 'Octavos' },
  { key: 'quarterfinals', label: 'Cuartos' },
  { key: 'semifinals', label: 'Semifinal' },
  { key: 'thirdplace', label: '3er Lugar' },
  { key: 'final', label: 'Final' },
]

export default function ResultadosMatrixPage() {
  const [mounted, setMounted] = useState(false)
  const [users, setUsers] = useState<RankingUser[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [matrix, setMatrix] = useState<Record<string, any>>({})
  const [selectedPhase, setSelectedPhase] = useState('groups')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
    const userData = localStorage.getItem('user')
    let reqUser = undefined
    
    if (userData) {
      try {
        const parsed = JSON.parse(userData)
        reqUser = parsed.username
      } catch (e) {
        console.error(e)
      }
    }
    loadData(reqUser)
  }, [selectedPhase])

  const loadData = async (reqUser?: string) => {
    setLoading(true)
    try {
      // Invocamos la nueva acción optimizada usuario por usuario
      const result = await getMatrixDataByPhase(selectedPhase, reqUser)
      if (result.success) {
        setUsers(result.users)
        setMatches(result.matches)
        setMatrix(result.matrix)
      }
    } catch (err) {
      console.error('Error cargando matriz:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!mounted || loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
        <p className="mt-4 text-text-secondary">Construyendo matriz de resultados sin límites...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      <main className="flex-1 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 rounded-full mb-3">
              <Trophy className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-text-primary">Matriz de Predicciones General</h1>
            <p className="text-sm text-text-secondary mt-1">Compara los pronósticos y puntos de todos los participantes</p>
          </div>

          {/* Filtro de Fases */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2 justify-start md:justify-center">
            {PHASES.map((phase) => (
              <button
                key={phase.key}
                onClick={() => setSelectedPhase(phase.key)}
                className={`px-4 py-2 rounded-xl font-semibold transition-all text-sm whitespace-nowrap ${
                  selectedPhase === phase.key
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-surface text-text-secondary hover:bg-gray-100 border'
                }`}
              >
                {phase.label}
              </button>
            ))}
          </div>

          {/* Matriz Estilo Excel */}
          <div className="bg-surface rounded-2xl shadow-xl border overflow-hidden">
            <div className="overflow-x-auto max-w-full max-h-[70vh]">
              <table className="w-full table-fixed border-collapse">
                <thead className="sticky top-0 z-20 bg-gray-100 shadow">
                  <tr>
                    <th className="w-48 min-w-[140px] p-4 bg-gray-200 font-bold text-left text-sm text-text-primary border sticky left-0 z-30 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                      Participantes
                    </th>
                    {matches.map(match => (
                      <th key={match.id} className="w-56 min-w-[200px] p-3 text-center border border-gray-300 bg-gray-50 text-xs font-bold text-text-primary">
                        <div className="truncate">{match.home_team} vs {match.away_team}</div>
                        <div className="mt-1 text-[11px] text-primary font-mono bg-white inline-block px-2 py-0.5 rounded border shadow-sm">
                          {match.home_score !== null && match.away_score !== null 
                            ? `Real: ${match.home_score} - ${match.away_score}` 
                            : 'Pendiente'}
                        </div>
                      </th>
                    ))}
                    {matches.length === 0 && (
                      <th className="p-8 text-center text-text-secondary font-medium">No hay partidos en esta fase</th>
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.username} className="hover:bg-gray-50 transition-colors">
                      {/* Columna Lateral Fija */}
                      <td className="p-4 font-bold text-sm text-text-primary bg-white border border-gray-200 sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                        {user.username}
                      </td>

                      {/* Renderizado directo e instantáneo desde el mapa del Servidor */}
                      {matches.map(match => {
                        const pred = matrix[user.username]?.[match.id]

                        return (
                          <td key={match.id} className="p-3 text-center border border-gray-200 text-sm font-medium">
                            {!pred ? (
                              <span className="text-xs text-gray-400 font-normal italic">- Sin pronóstico -</span>
                            ) : pred.is_hidden ? (
                              <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-lg border border-amber-200 font-semibold">
                                🔒 Oculto
                              </span>
                            ) : (
                              <div className="flex flex-col items-center justify-center gap-1">
                                <span className="font-bold font-mono text-base text-text-primary">
                                  {pred.home_score} - {pred.away_score}
                                </span>
                                {pred.points !== undefined && match.home_score !== null && (
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                    pred.points > 0 ? 'bg-green-100 text-fifa-green border border-green-200' : 'bg-gray-100 text-text-secondary border'
                                  }`}>
                                    +{pred.points} pts
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}