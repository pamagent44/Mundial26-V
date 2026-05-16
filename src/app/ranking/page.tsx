'use client'

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { useState, useEffect } from 'react'
import { Trophy, Medal, Crown, TrendingUp, Calendar, Users, Eye } from 'lucide-react'
import { useRouter } from 'next/navigation'

// Mock data for ranking
const mockRanking = [
  { rank: 1, username: 'admin', points: 156, predictions: 48, lastMatch: 'Argentina 2-1 Brasil' },
  { rank: 2, username: 'Juanito', points: 142, predictions: 48, lastMatch: 'España 1-1 Francia' },
  { rank: 3, username: 'Maria92', points: 138, predictions: 47, lastMatch: 'Alemania 3-2 Italia' },
  { rank: 4, username: 'Carlos_88', points: 125, predictions: 48, lastMatch: 'Inglaterra 2-0 Portugal' },
  { rank: 5, username: 'Elena_M', points: 118, predictions: 46, lastMatch: 'México 1-2 EE.UU.' },
  { rank: 6, username: 'Pedro_Futbol', points: 112, predictions: 48, lastMatch: 'Uruguay 2-1 Chile' },
  { rank: 7, username: 'Ana123', points: 108, predictions: 45, lastMatch: 'Argentina 2-1 Brasil' },
  { rank: 8, username: 'Miguel_Tips', points: 102, predictions: 48, lastMatch: 'España 2-0 Francia' },
  { rank: 9, username: 'Sofia_Wins', points: 98, predictions: 44, lastMatch: 'Alemania 1-0 Italia' },
  { rank: 10, username: 'Diego_Porra', points: 95, predictions: 48, lastMatch: 'Inglaterra 1-1 Portugal' },
]

export default function RankingPage() {
  const [sortBy, setSortBy] = useState<'points' | 'predictions'>('points')
  const [mounted, setMounted] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    const token = localStorage.getItem('auth_token')
    setIsLoggedIn(!!token)
  }, [])

  if (!mounted) return null

  const sortedRanking = [...mockRanking].sort((a, b) =>
    sortBy === 'points' ? b.points - a.points : b.predictions - a.predictions
  )

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
                    <th className="px-6 py-4 font-semibold">Último Partido</th>
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
                          <span className="font-semibold text-text-primary">{user.username}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xl font-bold text-primary">{user.points}</span>
                        <span className="text-sm text-text-secondary ml-1">pts</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-text-secondary">{user.predictions}/48</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-text-secondary">{user.lastMatch}</span>
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
                  <p className="text-text-secondary text-sm">Las predicciones se muestran solo cuando la fase está cerrada.</p>
                  {/* Mock predictions display */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-text-secondary">Predicciones de fase de grupos</p>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                        <span className="text-text-primary">Argentina vs Brasil</span>
                        <span className="font-semibold text-primary">2 - 1</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                        <span className="text-text-primary">España vs Francia</span>
                        <span className="font-semibold text-primary">1 - 1</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-text-primary">Alemania vs Italia</span>
                        <span className="font-semibold text-primary">3 - 2</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-surface rounded-xl p-6 shadow-lg text-center">
              <div className="text-4xl font-bold text-primary mb-2">10</div>
              <p className="text-text-secondary">Participantes</p>
            </div>
            <div className="bg-surface rounded-xl p-6 shadow-lg text-center">
              <div className="text-4xl font-bold text-accent mb-2">48</div>
              <p className="text-text-secondary">Partidos Totales</p>
            </div>
            <div className="bg-surface rounded-xl p-6 shadow-lg text-center">
              <div className="text-4xl font-bold text-fifa-green mb-2">156</div>
              <p className="text-text-secondary">Máximo Puntos</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}