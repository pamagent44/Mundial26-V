'use client'

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { useState, useEffect } from 'react'
import { Trophy, Medal, Crown, TrendingUp, Calendar, Users, Eye } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getUsers, getMatches, getAllPredictions } from '@/app/actions'

interface RankingUser {
  username: string
  points: number
  predictions_count: number
  is_admin: boolean
}

interface Match {
  id: string
  home_team: string
  away_team: string
  home_score?: number
  away_score?: number
  phase: string
}

interface Prediction {
  user_id: string
  match_id: string
  home_score: number
  away_score: number
  points?: number
  matches?: Match
}

// Fechas de inicio de cada fase para control de visibilidad en el ranking
const PHASE_START_DATES: Record<string, Date> = {
  groups:        new Date('2026-06-11T00:00:00Z'),
  Dieciseisavos: new Date('2026-06-28T00:00:00Z'),
  round16:       new Date('2026-07-04T00:00:00Z'),
  quarterfinals: new Date('2026-07-09T00:00:00Z'),
  semifinals:    new Date('2026-07-14T00:00:00Z'),
  thirdplace:    new Date('2026-07-18T00:00:00Z'),
  final:         new Date('2026-07-19T00:00:00Z'),
}

export default function RankingPage() {
  const [sortBy, setSortBy] = useState<'points' | 'predictions'>('points')
  const [mounted, setMounted] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ username: string; isAdmin: boolean } | null>(null)
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [users, setUsers] = useState<RankingUser[]>([])
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    const token = localStorage.getItem('auth_token')
    setIsLoggedIn(!!token)
    
    // Cargar datos del usuario logueado para validar permisos de privacidad
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        const parsed = JSON.parse(userData)
        setCurrentUser({
          username: parsed.username,
          isAdmin: parsed.isAdmin || parsed.is_admin || false
        })
      } catch (e) {
        console.error('Error parseando sesión de usuario:', e)
      }
    }
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [usersData, predictionsData, matchesData] = await Promise.all([
        getUsers(),
        getAllPredictions(),
        getMatches()
      ])

      setUsers(usersData || [])
      setPredictions(predictionsData || [])
      setMatches(matchesData || [])
    } catch (err) {
      console.error('Error cargando ranking:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!mounted || loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
        <p className="mt-4 text-text-secondary">Cargando ranking...</p>
      </div>
    )
  }

  // Calcular estadísticas por usuario
  const userStats = users.map((user, index) => {
    const userPredictions = predictions.filter(p => p.user_id === user.username)
    const correctPredictions = userPredictions.filter(p => (p.points || 0) > 0).length
    
    // Encontrar último partido con predicción
    const lastPred = userPredictions
      .filter(p => p.matches)
      .sort((a, b) => new Date(b.matches?.home_team || '').getTime() - new Date(a.matches?.home_team || '').getTime())[0]
    
    const lastMatch = lastPred?.matches 
      ? `${lastPred.matches.home_team} ${lastPred.home_score}-${lastPred.away_score} ${lastPred.matches.away_team}`
      : 'Sin predicciones'

    return {
      rank: index + 1,
      username: user.username,
      points: user.points || 0,
      predictions: userPredictions.length,
      correctPredictions,
      lastMatch,
      isAdmin: user.is_admin
    }
  })

  const sortedRanking = [...userStats].sort((a, b) =>
    sortBy === 'points' ? b.points - a.points : b.predictions - a.predictions
  )

  // Reasignar ranks después de ordenar
  sortedRanking.forEach((user, index) => {
    user.rank = index + 1
  })

  // Obtener predicciones del usuario seleccionado
  const selectedUserPredictions = predictions.filter(p => p.user_id === selectedUser)

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 py-12 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-accent/20 rounded-full mb-4">
              <Trophy className="w-8 h-8 text-accent" />
            </div>
            <h1 className="text-4xl font-bold text-text-primary mb-2">Ranking General</h1>
            <p className="text-text-secondary text-lg">Clasificación de participantes por puntos acumulados</p>
          </div>

          {/* Top 3 Podium */}
          {sortedRanking.length >= 3 && (
            <div className="mb-12">
              <div className="flex justify-center items-end gap-4">
                {/* 2nd Place */}
                {sortedRanking[1] && (
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center mb-2 mx-auto shadow-lg">
                      <span className="text-3xl font-bold text-gray-700">2</span>
                    </div>
                    <Medal className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                    <p className="font-bold text-text-primary">{sortedRanking[1].username}</p>
                    <p className="text-2xl font-bold text-primary">{sortedRanking[1].points}</p>
                    <p className="text-sm text-text-secondary">puntos</p>
                    <p className="text-xs text-accent font-medium">30% del bote</p>
                  </div>
                )}

                {/* 1st Place */}
                {sortedRanking[0] && (
                  <div className="text-center transform -translate-y-4">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-accent to-yellow-500 flex items-center justify-center mb-2 mx-auto shadow-xl ring-4 ring-accent">
                      <Crown className="w-8 h-8 text-white" />
                      <span className="absolute text-4xl font-bold text-white">1</span>
                    </div>
                    <Trophy className="w-8 h-8 text-accent mx-auto mb-1" />
                    <p className="font-bold text-xl text-text-primary">{sortedRanking[0].username}</p>
                    <p className="text-3xl font-bold text-accent">{sortedRanking[0].points}</p>
                    <p className="text-sm text-text-secondary">puntos</p>
                    <p className="text-xs text-accent font-medium">60% del bote</p>
                  </div>
                )}

                {/* 3rd Place */}
                {sortedRanking[2] && (
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center mb-2 mx-auto shadow-lg">
                      <span className="text-3xl font-bold text-white">3</span>
                    </div>
                    <Medal className="w-6 h-6 text-amber-600 mx-auto mb-1" />
                    <p className="font-bold text-text-primary">{sortedRanking[2].username}</p>
                    <p className="text-2xl font-bold text-primary">{sortedRanking[2].points}</p>
                    <p className="text-sm text-text-secondary">puntos</p>
                    <p className="text-xs text-accent font-medium">10% del bote</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sorting Options */}
          <div className="flex gap-4 mb-6 justify-center">
            <button
              onClick={() => setSortBy('points')}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                sortBy === 'points'
                  ? 'bg-primary text-white'
                  : 'bg-surface text-text-secondary hover:bg-gray-100'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              Ordenar por Puntos
            </button>
            <button
              onClick={() => setSortBy('predictions')}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                sortBy === 'predictions'
                  ? 'bg-primary text-white'
                  : 'bg-surface text-text-secondary hover:bg-gray-100'
              }`}
            >
              <Calendar className="w-5 h-5" />
              Ordenar por Predicciones
            </button>
          </div>

          {/* Full Ranking Table */}
          <div className="bg-surface rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="text-left text-text-secondary text-sm">
                    <th className="px-6 py-4 font-semibold">#</th>
                    <th className="px-6 py-4 font-semibold">Usuario</th>
                    <th className="px-6 py-4 font-semibold">Puntos</th>
                    <th className="px-6 py-4 font-semibold">Predicciones</th>
                    <th className="px-6 py-4 font-semibold">Aciertos</th>
                    <th className="px-6 py-4 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedRanking.map((user, index) => (
                    <tr key={user.username} className={`hover:bg-gray-50 transition-colors ${
                      index < 3 ? 'bg-accent/5' : ''
                    }`}>
                      <td className="px-6 py-4">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0 ? 'bg-accent text-white' :
                          index === 1 ? 'bg-gray-300 text-gray-700' :
                          index === 2 ? 'bg-amber-600 text-white' :
                          'bg-gray-100 text-text-secondary'
                        }`}>
                          {user.rank}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Users className="w-5 h-5 text-text-secondary" />
                          <span className="font-semibold text-text-primary">
                            {user.username}
                            {user.isAdmin && (
                              <span className="ml-2 text-xs bg-fifa-gold text-white px-2 py-0.5 rounded">Admin</span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xl font-bold text-primary">{user.points}</span>
                        <span className="text-sm text-text-secondary ml-1">pts</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-text-secondary">{user.predictions}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-semibold ${user.correctPredictions > 0 ? 'text-fifa-green' : 'text-text-secondary'}`}>
                          {user.correctPredictions}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {isLoggedIn ? (
                          <button
                            onClick={() => setSelectedUser(user.username)}
                            className="text-primary hover:underline text-sm flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            Ver predicciones
                          </button>
                        ) : (
                          <span className="text-xs text-text-secondary">Inicia sesión</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {sortedRanking.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-text-secondary">
                        No hay usuarios registrados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* User Predictions Modal */}
          {selectedUser && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-surface rounded-2xl shadow-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-text-primary">Predicciones de {selectedUser}</h3>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="text-text-secondary hover:text-text-primary text-2xl"
                  >
                    ×
                  </button>
                </div>
                <div className="space-y-3">
                  {selectedUserPredictions.length === 0 ? (
                    <p className="text-text-secondary text-center py-4">Este usuario no ha hecho predicciones</p>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-text-secondary mb-2">Predicciones realizadas</p>
                      <div className="mt-2 space-y-2">
                        {selectedUserPredictions.map((pred, idx) => {
                          const phaseKey = pred.matches?.phase || 'groups'
                          const phaseStartDate = PHASE_START_DATES[phaseKey]
                          
                          // Condición de visibilidad: si la fase ya empezó OR es admin OR está viendo su propia predicción
                          const isVisible = !phaseStartDate || new Date() >= phaseStartDate || currentUser?.isAdmin || currentUser?.username === selectedUser

                          return (
                            <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                              <div className="flex flex-col">
                                <span className="text-text-primary font-medium">
                                  {pred.matches?.home_team || 'Equipo A'} vs {pred.matches?.away_team || 'Equipo B'}
                                </span>
                                {!isVisible && (
                                  <span className="text-xs text-amber-600 font-semibold flex items-center gap-1 mt-0.5">
                                    🔒 Bloqueado hasta el {phaseStartDate?.toLocaleDateString('es-ES')}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xl text-primary tracking-wider">
                                  {isVisible ? `${pred.home_score} - ${pred.away_score}` : '🔒 - 🔒'}
                                </span>
                                {isVisible && pred.points !== undefined && pred.points > 0 && (
                                  <span className="text-xs bg-fifa-green text-white px-2 py-0.5 rounded">
                                    +{pred.points} pts
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-surface rounded-xl p-6 shadow-lg text-center">
              <div className="text-4xl font-bold text-primary mb-2">{users.length}</div>
              <p className="text-text-secondary">Participantes</p>
            </div>
            <div className="bg-surface rounded-xl p-6 shadow-lg text-center">
              <div className="text-4xl font-bold text-accent mb-2">{matches.length}</div>
              <p className="text-text-secondary">Partidos Totales</p>
            </div>
            <div className="bg-surface rounded-xl p-6 shadow-lg text-center">
              <div className="text-4xl font-bold text-fifa-green mb-2">
                {sortedRanking[0]?.points || 0}
              </div>
              <p className="text-text-secondary">Máximo Puntos</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}