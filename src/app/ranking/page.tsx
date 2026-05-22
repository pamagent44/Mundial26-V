'use client'

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { useState, useEffect } from 'react'
import { Trophy, Medal, Crown, TrendingUp, Calendar, Users, Eye } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getUsers, getMatches, getAllPredictions, getMatchDeadline } from '@/app/actions' // ← IMPORTADO: getMatchDeadline

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
  match_date: string // ← CAMBIADO: Asegura tener la propiedad de fecha
}

interface Prediction {
  user_id: string
  match_id: string
  home_score: number
  away_score: number
  points?: number
  matches?: Match
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
    
    const userData = localStorage.getItem('user')
    let reqUser = undefined
    if (userData) {
      try {
        const parsed = JSON.parse(userData)
        setCurrentUser({
          username: parsed.username,
          isAdmin: parsed.isAdmin || parsed.is_admin || false
        })
        reqUser = parsed.username
      } catch (e) {
        console.error(e)
      }
    }
    loadData(reqUser)
  }, [])

  const loadData = async (reqUser?: string) => {
    try {
      // Pasamos el usuario solicitante para enmascaramiento seguro en el backend
      const [usersData, predictionsData, matchesData] = await Promise.all([
        getUsers(),
        getAllPredictions(reqUser),
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

  const userStats = users.map((user, index) => {
    const userPredictions = predictions.filter(p => p.user_id === user.username)
    const correctPredictions = userPredictions.filter(p => (p.points || 0) > 0).length
    
    return {
      rank: index + 1,
      username: user.username,
      points: user.points || 0,
      predictions: userPredictions.length,
      correctPredictions,
      isAdmin: user.is_admin
    }
  })

  const sortedRanking = [...userStats].sort((a, b) =>
    sortBy === 'points' ? b.points - a.points : b.predictions - a.predictions
  )

  sortedRanking.forEach((user, index) => {
    user.rank = index + 1
  })

  const selectedUserPredictions = predictions.filter(p => p.user_id === selectedUser)

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 py-12 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-accent/20 rounded-full mb-4">
              <Trophy className="w-8 h-8 text-accent" />
            </div>
            <h1 className="text-4xl font-bold text-text-primary mb-2">Ranking General</h1>
            <p className="text-text-secondary text-lg">Clasificación de participantes por puntos acumulados</p>
          </div>

          {/* Podium */}
          {sortedRanking.length >= 3 && (
            <div className="mb-12 flex justify-center items-end gap-4">
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center mb-2 mx-auto shadow"><span className="text-2xl font-bold">2</span></div>
                <p className="font-bold">{sortedRanking[1]?.username}</p>
                <p className="text-xl font-bold text-primary">{sortedRanking[1]?.points} pts</p>
              </div>
              <div className="text-center transform -translate-y-4">
                <div className="w-28 h-28 rounded-full bg-accent flex items-center justify-center mb-2 mx-auto shadow-lg ring-4 ring-yellow-400"><span className="text-3xl font-bold text-white">1</span></div>
                <p className="font-bold text-lg">{sortedRanking[0]?.username}</p>
                <p className="text-2xl font-bold text-accent">{sortedRanking[0]?.points} pts</p>
              </div>
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-amber-600 flex items-center justify-center mb-2 mx-auto shadow"><span className="text-2xl font-bold text-white">3</span></div>
                <p className="font-bold">{sortedRanking[2]?.username}</p>
                <p className="text-xl font-bold text-primary">{sortedRanking[2]?.points} pts</p>
              </div>
            </div>
          )}

          <div className="flex gap-4 mb-6 justify-center">
            <button onClick={() => setSortBy('points')} className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 ${sortBy === 'points' ? 'bg-primary text-white' : 'bg-surface text-text-secondary'}`}><TrendingUp className="w-5 h-5" /> Puntos</button>
            <button onClick={() => setSortBy('predictions')} className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 ${sortBy === 'predictions' ? 'bg-primary text-white' : 'bg-surface text-text-secondary'}`}><Calendar className="w-5 h-5" /> Predicciones</button>
          </div>

          <div className="bg-surface rounded-2xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 text-left text-sm text-text-secondary">
                <tr><th className="px-6 py-4">#</th><th className="px-6 py-4">Usuario</th><th className="px-6 py-4">Puntos</th><th className="px-6 py-4">Predicciones</th><th className="px-6 py-4">Acciones</th></tr>
              </thead>
              <tbody className="divide-y">
                {sortedRanking.map((user) => (
                  <tr key={user.username} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-bold">{user.rank}</td>
                    <td className="px-6 py-4 font-semibold">{user.username}</td>
                    <td className="px-6 py-4 text-primary font-bold text-lg">{user.points} pts</td>
                    <td className="px-6 py-4 text-text-secondary">{user.predictions}</td>
                    <td className="px-6 py-4">
                      {isLoggedIn ? (
                        <button onClick={() => setSelectedUser(user.username)} className="text-primary font-medium hover:underline flex items-center gap-1"><Eye className="w-4 h-4" /> Ver</button>
                      ) : <span className="text-xs text-text-secondary">Bloqueado</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Modal de visualización */}
          {selectedUser && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-surface rounded-2xl shadow-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">Predicciones de {selectedUser}</h3>
                  <button onClick={() => setSelectedUser(null)} className="text-text-secondary text-2xl">×</button>
                </div>
                <div className="space-y-2">
                  {selectedUserPredictions.map((pred, idx) => {
                    const matchDate = pred.matches?.match_date
                    const deadline = matchDate ? getMatchDeadline(matchDate) : new Date()
                    
                    // REGLA DE VISIBILIDAD: El bloqueo expira automáticamente al vencer el contador
                    const isVisible = new Date() >= deadline || currentUser?.isAdmin || currentUser?.username === selectedUser || pred.home_score !== -1

                    return (
                      <div key={idx} className="flex justify-between items-center py-2 border-b last:border-0">
                        <div className="flex flex-col">
                          <span className="font-medium text-text-primary">{pred.matches?.home_team} vs {pred.matches?.away_team}</span>
                          {!isVisible && (
                            <span className="text-xs text-fifa-red font-semibold">🔒 Bloqueado hasta cierre del bloque</span>
                          )}
                        </div>
                        <span className="font-mono text-xl font-bold text-primary">
                          {isVisible ? `${pred.home_score} - ${pred.away_score}` : '🔒 - 🔒'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}