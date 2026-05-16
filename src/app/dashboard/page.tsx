'use client'

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Trophy, Clock, Users, Shield, Calendar, Star,
  CheckCircle, XCircle, AlertCircle, Edit3, Save, Eye, EyeOff, Play, Pause,
  UserPlus, UserCheck, Trash2
} from 'lucide-react'
import { createUser, getUsers, getMatches, createPrediction, getUserPredictions } from '@/app/actions'

// Types
interface Match {
  id: string
  home_team: string
  away_team: string
  home_score?: number
  away_score?: number
  match_date: string
  phase: string
  status: 'upcoming' | 'live' | 'finished'
  group_name?: string
}

interface Prediction {
  match_id: string
  home_score: number
  away_score: number
  points?: number
}

interface UserData {
  username: string
  points: number
  is_admin: boolean
  must_change_password: boolean
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'predictions' | 'admin'>('dashboard')
  const [mounted, setMounted] = useState(false)
  const [currentUser, setCurrentUser] = useState<UserData | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [predictions, setPredictions] = useState<Record<string, { homeScore: number; awayScore: number }>>({})
  const [editingMatch, setEditingMatch] = useState<string | null>(null)
  const [tempPrediction, setTempPrediction] = useState({ homeScore: 0, awayScore: 0 })
  const [matches, setMatches] = useState<Match[]>([])
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Admin state
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [userCreated, setUserCreated] = useState(false)
  const [userError, setUserError] = useState('')

  useEffect(() => {
    setMounted(true)
    const token = localStorage.getItem('auth_token')
    const userData = localStorage.getItem('user')

    if (!token || !userData) {
      router.push('/login')
      return
    }

    const parsedUser = JSON.parse(userData)
    setCurrentUser(parsedUser)
    setIsAdmin(parsedUser.isAdmin || parsedUser.is_admin || false)

    // Cargar datos desde Supabase
    loadData(parsedUser.username)
  }, [router])

  const loadData = async (username: string) => {
    try {
      const [matchesData, usersData, predictionsData] = await Promise.all([
        getMatches(),
        getUsers(),
        getUserPredictions(username)
      ])

      setMatches(matchesData || [])
      setUsers(usersData || [])

      // Convertir predicciones a formato del estado
      const preds: Record<string, { homeScore: number; awayScore: number }> = {}
      predictionsData?.forEach((p: any) => {
        preds[p.match_id] = { homeScore: p.home_score, awayScore: p.away_score }
      })
      setPredictions(preds)
    } catch (err) {
      console.error('Error cargando datos:', err)
    } finally {
      setLoading(false)
    }
  }

  const getPhaseMultiplier = (phase: string) => {
    switch (phase) {
      case 'groups': return 1
      case 'round16': return 2
      case 'quarterfinals': return 3
      case 'semifinals': return 4
      case 'final': return 5
      case 'thirdplace': return 4
      default: return 1
    }
  }

  const getPhaseName = (phase: string) => {
    switch (phase) {
      case 'groups': return 'Fase de Grupos'
      case 'round16': return 'Octavos'
      case 'quarterfinals': return 'Cuartos'
      case 'semifinals': return 'Semifinal'
      case 'final': return 'Final'
      case 'thirdplace': return '3er Lugar'
      default: return phase
    }
  }

  // Guardar predicción en Supabase
  const handleSavePrediction = async (matchId: string) => {
    if (!currentUser) return

    try {
      await createPrediction(currentUser.username, matchId, tempPrediction.homeScore, tempPrediction.awayScore)

      // Actualizar estado local
      const newPredictions = {
        ...predictions,
        [matchId]: tempPrediction
      }
      setPredictions(newPredictions)
      setEditingMatch(null)
    } catch (err: any) {
      alert('Error guardando predicción: ' + err.message)
    }
  }

  const getMatchPoints = (match: Match) => {
    if (match.home_score === undefined || match.away_score === undefined) return null
    const prediction = predictions[match.id]
    if (!prediction) return null

    let points = 0
    const actualResult = match.home_score > match.away_score ? 'home' :
                         match.home_score < match.away_score ? 'away' : 'draw'
    const predictedResult = prediction.homeScore > prediction.awayScore ? 'home' :
                           prediction.homeScore < prediction.awayScore ? 'away' : 'draw'

    if (actualResult === predictedResult) points += 5
    if (prediction.homeScore === match.home_score) points += 3
    else if (Math.abs(prediction.homeScore - match.home_score) === 1) points += 1
    if (prediction.awayScore === match.away_score) points += 3
    else if (Math.abs(prediction.awayScore - match.away_score) === 1) points += 1

    return points
  }

  // Crear usuario en Supabase
  const handleCreateUser = async () => {
    setUserError('')
    setUserCreated(false)

    if (!newUsername || newUsername.length < 3) {
      setUserError('El nombre de usuario debe tener al menos 3 caracteres')
      return
    }

    if (!newPassword || newPassword.length < 4) {
      setUserError('La contraseña debe tener al menos 4 caracteres')
      return
    }

    try {
      await createUser(newUsername, newPassword, false)
      setUserCreated(true)
      setNewUsername('')
      setNewPassword('')

      // Recargar lista de usuarios
      const usersData = await getUsers()
      setUsers(usersData || [])

      setTimeout(() => setUserCreated(false), 3000)
    } catch (err: any) {
      setUserError(err.message || 'Error creando usuario')
    }
  }

  // Delete user function (necesitarías añadir deleteUser a actions.ts)
  const handleDeleteUser = async (username: string) => {
    if (username === 'admin') {
      setUserError('No se puede eliminar el usuario admin')
      return
    }
    // Por ahora solo local, añadir deleteUser a actions.ts si lo necesitas
    setUserError('Función no implementada en Supabase aún')
  }

  // Reset password function (necesitarías añadir resetPassword a actions.ts)
  const handleResetPassword = async (username: string) => {
    setUserError('Función no implementada en Supabase aún')
  }

  // Reset admin password
  const handleResetAdminPassword = () => {
    const tempPassword = prompt('Introduce la nueva contraseña para admin:')
    if (tempPassword && tempPassword.length >= 4) {
      alert('Función no implementada en Supabase aún. Usa Supabase Dashboard.')
    }
  }

  if (!mounted || loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
        <p className="mt-4 text-text-secondary">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      <main className="flex-1 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              ¡Bienvenido, {currentUser?.username}!
            </h1>
            <p className="text-text-secondary">Panel de control de la porra del Mundial 2026</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'bg-primary text-white'
                  : 'bg-surface text-text-secondary hover:bg-gray-100'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('predictions')}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'predictions'
                  ? 'bg-primary text-white'
                  : 'bg-surface text-text-secondary hover:bg-gray-100'
              }`}
            >
              Predicciones
            </button>
            {isAdmin && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap ${
                  activeTab === 'admin'
                    ? 'bg-fifa-red text-white'
                    : 'bg-surface text-text-secondary hover:bg-gray-100'
                }`}
              >
                Admin
              </button>
            )}
          </div>

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Countdown */}
              <div className="lg:col-span-1 bg-gradient-to-br from-primary to-fifa-green rounded-2xl p-6 text-white">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-6 h-6" />
                  <h2 className="text-xl font-bold">Deadline de Fase</h2>
                </div>
                <div className="text-center">
                  <p className="text-white/80 mb-4">Cierre de predicciones en:</p>
                  <CountdownTimer />
                </div>
              </div>

              {/* Ranking Preview */}
              <div className="lg:col-span-2 bg-surface rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-accent" />
                    <h2 className="text-xl font-bold text-text-primary">Top 3 Ranking</h2>
                  </div>
                  <Link href="/ranking" className="text-primary font-semibold hover:underline">Ver todo</Link>
                </div>
                <div className="space-y-4">
                  {users.slice(0, 3).map((u, index) => (
                    <div key={u.username} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        index === 0 ? 'bg-accent text-text-primary' :
                        index === 1 ? 'bg-gray-300 text-text-primary' :
                        'bg-amber-700 text-white'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-text-primary">{u.username}</p>
                        <p className="text-sm text-text-secondary">{u.is_admin ? 'Admin' : 'Participante'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">{u.points || 0}</p>
                        <p className="text-xs text-text-secondary">puntos</p>
                      </div>
                    </div>
                  ))}
                  {users.length === 0 && (
                    <p className="text-text-secondary text-center py-4">No hay usuarios registrados</p>
                  )}
                </div>
              </div>

              {/* Today's Matches */}
              <div className="lg:col-span-3 bg-surface rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Calendar className="w-6 h-6 text-primary" />
                  <h2 className="text-xl font-bold text-text-primary">Próximos Partidos</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {matches.slice(0, 6).map((match) => (
                    <div key={match.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                          {getPhaseName(match.phase)}
                        </span>
                        {match.group_name && (
                          <span className="text-xs font-medium text-text-secondary bg-gray-200 px-2 py-1 rounded">
                            Grupo {match.group_name}
                          </span>
                        )}
                        {match.status === 'live' && (
                          <span className="flex items-center gap-1 text-xs font-medium text-fifa-red bg-fifa-red/10 px-2 py-1 rounded animate-pulse">
                            <Play className="w-3 h-3" /> EN VIVO
                          </span>
                        )}
                        {match.status === 'finished' && (
                          <span className="text-xs font-medium text-fifa-green bg-fifa-green/10 px-2 py-1 rounded">
                            FINAL
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-center flex-1">
                          <p className="font-semibold text-sm text-text-primary">{match.home_team}</p>
                          <p className="text-lg font-bold text-text-primary">
                            {match.home_score !== undefined ? match.home_score : '-'}
                          </p>
                        </div>
                        <div className="text-center px-4">
                          <p className="text-text-secondary text-sm">vs</p>
                          <p className="text-xs text-text-secondary">
                            {new Date(match.match_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-center flex-1">
                          <p className="font-semibold text-sm text-text-primary">{match.away_team}</p>
                          <p className="text-lg font-bold text-text-primary">
                            {match.away_score !== undefined ? match.away_score : '-'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {matches.length === 0 && (
                    <p className="text-text-secondary text-center py-4 col-span-3">No hay partidos programados</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Predictions Tab */}
          {activeTab === 'predictions' && (
            <div className="bg-surface rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-6">
                <Edit3 className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-bold text-text-primary">Mis Predicciones</h2>
              </div>

              {/* Phase Filter */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {['groups', 'round16', 'quarterfinals', 'semifinals', 'final', 'thirdplace'].map((phase) => (
                  <button
                    key={phase}
                    className="px-4 py-2 rounded-lg font-medium bg-gray-100 text-text-secondary hover:bg-primary hover:text-white transition-colors whitespace-nowrap"
                  >
                    {getPhaseName(phase)} (x{getPhaseMultiplier(phase)})
                  </button>
                ))}
              </div>

              {/* Matches List */}
              <div className="space-y-4">
                {matches.map((match) => {
                  const prediction = predictions[match.id]
                  const isEditing = editingMatch === match.id
                  const canEdit = match.status === 'upcoming'

                  return (
                    <div key={match.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                            {getPhaseName(match.phase)}
                          </span>
                          {match.group_name && (
                            <span className="text-xs font-medium text-text-secondary bg-gray-200 px-2 py-1 rounded">
                              Grupo {match.group_name}
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-text-secondary">
                          {new Date(match.match_date).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-center flex-1">
                          <p className="font-semibold text-text-primary">{match.home_team}</p>
                        </div>

                        {/* Prediction Input / Display */}
                        <div className="flex items-center gap-4">
                          {canEdit ? (
                            isEditing ? (
                              <>
                                <input
                                  type="number"
                                  min="0"
                                  value={tempPrediction.homeScore}
                                  onChange={(e) => setTempPrediction({ ...tempPrediction, homeScore: parseInt(e.target.value) || 0 })}
                                  className="w-16 h-12 text-center text-2xl font-bold border-2 border-primary rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                />
                                <span className="text-2xl font-bold text-text-secondary">-</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={tempPrediction.awayScore}
                                  onChange={(e) => setTempPrediction({ ...tempPrediction, awayScore: parseInt(e.target.value) || 0 })}
                                  className="w-16 h-12 text-center text-2xl font-bold border-2 border-primary rounded-lg focus:ring-2 focus:ring-primary outline-none"
                                />
                                <button
                                  onClick={() => handleSavePrediction(match.id)}
                                  className="p-2 bg-fifa-green text-white rounded-lg hover:bg-green-700 transition-colors"
                                >
                                  <Save className="w-5 h-5" />
                                </button>
                              </>
                            ) : (
                              <>
                                <span className="w-16 h-12 flex items-center justify-center text-2xl font-bold bg-white border-2 border-gray-300 rounded-lg">
                                  {prediction ? prediction.homeScore : '-'}
                                </span>
                                <span className="text-2xl font-bold text-text-secondary">-</span>
                                <span className="w-16 h-12 flex items-center justify-center text-2xl font-bold bg-white border-2 border-gray-300 rounded-lg">
                                  {prediction ? prediction.awayScore : '-'}
                                </span>
                                <button
                                  onClick={() => {
                                    setEditingMatch(match.id)
                                    setTempPrediction(prediction || { homeScore: 0, awayScore: 0 })
                                  }}
                                  className="p-2 bg-primary text-white rounded-lg hover:bg-fifa-blue transition-colors"
                                >
                                  <Edit3 className="w-5 h-5" />
                                </button>
                              </>
                            )
                          ) : (
                            <>
                              <span className="w-16 h-12 flex items-center justify-center text-2xl font-bold bg-white border-2 border-gray-300 rounded-lg">
                                {prediction ? prediction.homeScore : '-'}
                              </span>
                              <span className="text-2xl font-bold text-text-secondary">-</span>
                              <span className="w-16 h-12 flex items-center justify-center text-2xl font-bold bg-white border-2 border-gray-300 rounded-lg">
                                {prediction ? prediction.awayScore : '-'}
                              </span>
                              {prediction && match.status === 'finished' && (
                                <div className={`px-3 py-1 rounded-lg font-bold ${
                                  getMatchPoints(match) && getMatchPoints(match)! > 0
                                    ? 'bg-fifa-green/20 text-fifa-green'
                                    : 'bg-gray-200 text-text-secondary'
                                }`}>
                                  +{getMatchPoints(match) || 0} pts
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        <div className="text-center flex-1">
                          <p className="font-semibold text-text-primary">{match.away_team}</p>
                        </div>
                      </div>

                      {!canEdit && !prediction && (
                        <p className="text-sm text-center text-text-secondary mt-2">
                          No hiciste predicción para este partido
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Info Box */}
              <div className="mt-6 p-4 bg-accent/10 border border-accent rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-text-primary">Recuerda</p>
                    <p className="text-sm text-text-secondary">
                      Las predicciones se bloquean 24h antes del primer partido de cada fase.
                      Hasta que terminen todos los partidos de la fase, no podrás ver las predicciones de otros usuarios.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Admin Tab */}
          {activeTab === 'admin' && isAdmin && (
            <div className="bg-surface rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-6">
                <Shield className="w-6 h-6 text-fifa-red" />
                <h2 className="text-xl font-bold text-text-primary">Panel de Administración</h2>
              </div>

              {/* Create User Section */}
              <div className="bg-fifa-blue/5 border border-fifa-blue/20 rounded-xl p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <UserPlus className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-text-primary">Crear Nuevo Usuario</h3>
                </div>
                <p className="text-sm text-text-secondary mb-4">
                  El usuario deberá cambiar la contraseña en su primer inicio de sesión.
                </p>

                {userError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{userError}</span>
                  </div>
                )}

                {userCreated && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
                    <UserCheck className="w-5 h-5 flex-shrink-0" />
                    <span>¡Usuario creado exitosamente!</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="newUsername" className="block text-sm font-medium text-text-primary mb-2">
                      Nombre de Usuario
                    </label>
                    <input
                      type="text"
                      id="newUsername"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                      placeholder="Mínimo 3 caracteres"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-text-primary mb-2">
                      Contraseña Temporal
                    </label>
                    <input
                      type="password"
                      id="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                      placeholder="Mínimo 6 caracteres"
                      required
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={handleCreateUser}
                      className="w-full bg-primary hover:bg-fifa-blue text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      Crear Usuario
                    </button>
                  </div>
                </div>
              </div>

              {/* Admin Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <Users className="w-8 h-8 text-primary mb-4" />
                  <h3 className="font-semibold text-text-primary mb-2">Usuarios Totales</h3>
                  <p className="text-2xl font-bold text-primary">{users.length}</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <Calendar className="w-8 h-8 text-primary mb-4" />
                  <h3 className="font-semibold text-text-primary mb-2">Gestionar Partidos</h3>
                  <p className="text-sm text-text-secondary">Introducir resultados manualmente</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <Star className="w-8 h-8 text-primary mb-4" />
                  <h3 className="font-semibold text-text-primary mb-2">Ver Rankings</h3>
                  <p className="text-sm text-text-secondary">Consultar ranking completo</p>
                </div>
              </div>

              {/* Users List */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="font-semibold text-text-primary mb-4">Usuarios Registrados</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-text-secondary text-sm border-b border-gray-200">
                        <th className="pb-3">Usuario</th>
                        <th className="pb-3">Admin</th>
                        <th className="pb-3">Debe Cambiar Pwd</th>
                        <th className="pb-3">Puntos</th>
                        <th className="pb-3">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.username} className="border-b border-gray-100">
                          <td className="py-3 font-medium text-text-primary flex items-center gap-2">
                            {u.is_admin && <Shield className="w-4 h-4 text-fifa-gold" />}
                            {u.username}
                          </td>
                          <td className="py-3">{u.is_admin ? 'Sí' : 'No'}</td>
                          <td className="py-3">
                            {u.must_change_password ? (
                              <span className="text-fifa-red">Sí</span>
                            ) : (
                              <span className="text-fifa-green">No</span>
                            )}
                          </td>
                          <td className="py-3 font-bold text-primary">{u.points || 0}</td>
                          <td className="py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleResetPassword(u.username)}
                                className="text-primary hover:underline text-sm flex items-center gap-1"
                              >
                                <Shield className="w-4 h-4" />
                                Resetear
                              </button>
                              {!u.is_admin && (
                                <button
                                  onClick={() => handleDeleteUser(u.username)}
                                  className="text-fifa-red hover:underline text-sm flex items-center gap-1"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Eliminar
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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

// Countdown Component
function CountdownTimer() {
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    const updateCountdown = () => {
      const deadline = new Date('2026-06-14T18:00:00')
      const now = new Date()
      const diff = deadline.getTime() - now.getTime()

      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        return
      }

      setCountdown({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000)
      })
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex justify-center gap-4">
      {[
        { value: countdown.days, label: 'Días' },
        { value: countdown.hours, label: 'Horas' },
        { value: countdown.minutes, label: 'Min' },
        { value: countdown.seconds, label: 'Seg' }
      ].map((item, index) => (
        <div key={index} className="text-center">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center mb-2">
            <span className="text-3xl font-bold">{item.value}</span>
          </div>
          <span className="text-sm text-white/80">{item.label}</span>
        </div>
      ))}
    </div>
  )
}
