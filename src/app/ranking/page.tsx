'use client'

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { useState, useEffect } from 'react'
import { Trophy, Medal, Crown, Users } from 'lucide-react'
import { getMatches, getRankingListWithStats } from '@/app/actions' // ← Importada la nueva función

interface RankingData {
  username: string
  points: number
  predictions: number
  correctPredictions: number
  isAdmin: boolean
}

interface Match {
  id: string
}

export default function RankingPage() {
  const [mounted, setMounted] = useState(false)
  const [rankingData, setRankingData] = useState<RankingData[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [statsResult, matchesData] = await Promise.all([
        getRankingListWithStats(),
        getMatches()
      ])

      if (statsResult.success) {
        setRankingData(statsResult.data)
      }
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
        <p className="mt-4 text-text-secondary">Cargando clasificaciones exactas...</p>
      </div>
    )
  }

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

          {/* Top 3 Podium (Imagen-3) */}
          {rankingData.length >= 3 && (
            <div className="mb-12">
              <div className="flex justify-center items-end gap-4">
                {/* 2nd Place */}
                {rankingData[1] && (
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center mb-2 mx-auto shadow-lg">
                      <span className="text-3xl font-bold text-gray-700">2</span>
                    </div>
                    <Medal className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                    <p className="font-bold text-text-primary">{rankingData[1].username}</p>
                    <p className="text-2xl font-bold text-primary">{rankingData[1].points}</p>
                    <p className="text-sm text-text-secondary">puntos</p>
                    <p className="text-xs text-accent font-medium">30% del bote</p>
                  </div>
                )}

                {/* 1st Place */}
                {rankingData[0] && (
                  <div className="text-center transform -translate-y-4">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-accent to-yellow-500 flex items-center justify-center mb-2 mx-auto shadow-xl ring-4 ring-accent">
                      <Crown className="w-8 h-8 text-white" />
                      <span className="absolute text-4xl font-bold text-white">1</span>
                    </div>
                    <Trophy className="w-8 h-8 text-accent mx-auto mb-1" />
                    <p className="font-bold text-xl text-text-primary">{rankingData[0].username}</p>
                    <p className="text-3xl font-bold text-accent">{rankingData[0].points}</p>
                    <p className="text-sm text-text-secondary">puntos</p>
                    <p className="text-xs text-accent font-medium">60% del bote</p>
                  </div>
                )}

                {/* 3rd Place */}
                {rankingData[2] && (
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center mb-2 mx-auto shadow-lg">
                      <span className="text-3xl font-bold text-white">3</span>
                    </div>
                    <Medal className="w-6 h-6 text-amber-600 mx-auto mb-1" />
                    <p className="font-bold text-text-primary">{rankingData[2].username}</p>
                    <p className="text-2xl font-bold text-primary">{rankingData[2].points}</p>
                    <p className="text-sm text-text-secondary">puntos</p>
                    <p className="text-xs text-accent font-medium">10% del bote</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tabla de Clasificación Sin Columna Acciones (Imagen-3) */}
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rankingData.map((user, index) => (
                    <tr key={user.username} className={`hover:bg-gray-50 transition-colors ${index < 3 ? 'bg-accent/5' : ''}`}>
                      <td className="px-6 py-4">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0 ? 'bg-accent text-white' :
                          index === 1 ? 'bg-gray-300 text-gray-700' :
                          index === 2 ? 'bg-amber-600 text-white' :
                          'bg-gray-100 text-text-secondary'
                        }`}>
                          {index + 1}
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
                        <span className="text-text-secondary font-mono">{user.predictions}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-semibold font-mono ${user.correctPredictions > 0 ? 'text-fifa-green' : 'text-text-secondary'}`}>
                          {user.correctPredictions}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {rankingData.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-text-secondary">
                        No hay usuarios registrados en el sistema.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-surface rounded-xl p-6 shadow-lg text-center">
              <div className="text-4xl font-bold text-primary mb-2">{rankingData.length}</div>
              <p className="text-text-secondary">Participantes</p>
            </div>
            <div className="bg-surface rounded-xl p-6 shadow-lg text-center">
              <div className="text-4xl font-bold text-accent mb-2">{matches.length}</div>
              <p className="text-text-secondary">Partidos Totales</p>
            </div>
            <div className="bg-surface rounded-xl p-6 shadow-lg text-center">
              <div className="text-4xl font-bold text-fifa-green mb-2">
                {rankingData[0]?.points || 0}
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