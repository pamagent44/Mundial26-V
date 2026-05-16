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

// Types
interface Match {
  id: string
  homeTeam: string
  awayTeam: string
  homeScore?: number
  awayScore?: number
  date: string
  time: string
  phase: 'groups' | 'round16' | 'quarterfinals' | 'semifinals' | 'final' | 'thirdplace'
  status: 'upcoming' | 'live' | 'finished'
  group?: string
}

interface Prediction {
  matchId: string
  homeScore: number
  awayScore: number
  points?: number
}

interface User {
  username: string
  points: number
  predictions: Prediction[]
}

// Mock data for matches
const mockMatches: Match[] = [
  // Group Stage - Sample matches
  { id: '1', homeTeam: 'Argentina', awayTeam: 'Brasil', homeScore: 2, awayScore: 1, date: '2026-06-11', time: '18:00', phase: 'groups', status: 'finished', group: 'A' },
  { id: '2', homeTeam: 'España', awayTeam: 'Francia', date: '2026-06-11', time: '21:00', phase: 'groups', status: 'live', group: 'A' },
  { id: '3', homeTeam: 'Alemania', awayTeam: 'Italia', date: '2026-06-12', time: '18:00', phase: 'groups', status: 'upcoming', group: 'B' },
  { id: '4', homeTeam: 'Inglaterra', awayTeam: 'Portugal', date: '2026-06-12', time: '21:00', phase: 'groups', status: 'upcoming', group: 'B' },
  { id: '5', homeTeam: 'México', awayTeam: 'EE.UU.', date: '2026-06-13', time: '18:00', phase: 'groups', status: 'upcoming', group: 'C' },
  { id: '6', homeTeam: 'Uruguay', awayTeam: 'Chile', date: '2026-06-13', time: '21:00', phase: 'groups', status: 'upcoming', group: 'C' },
]

// Mock users for ranking
const mockUsers = [
  { username: 'admin', points: 156, isAdmin: true },
  { username: 'Juanito', points: 142 },
  { username: 'Maria92', points: 138 },
  { username: 'Carlos_88', points: 125 },
  { username: 'Elena_M', points: 118 },
]

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'predictions' | 'admin'>('dashboard')
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [predictions, setPredictions] = useState<Record<string, { homeScore: number; awayScore: number }>>({})
  const [editingMatch, setEditingMatch] = useState<string | null>(null)
  const [tempPrediction, setTempPrediction] = useState({ homeScore: 0, awayScore: 0 })
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()

  // Admin state
  const [adminUsers, setAdminUsers] = useState<any[]>([])
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
    setIsAdmin(parsedUser.isAdmin || false)

    // Load saved predictions
    const savedPredictions = localStorage.getItem('predictions_' + parsedUser.username)
    if (savedPredictions) {
      setPredictions(JSON.parse(savedPredictions))
    }

    // Load users for admin
    const users = JSON.parse(localStorage.getItem('users') || '[]')
    setAdminUsers(users)
  }, [router])

  // Calculate countdown for groups deadline
  const getCountdown = () => {
    // Mock deadline: 24 hours before first match of each phase
    const deadline = new Date('2026-06-14T18:00:00')
    const now = new Date()
    const diff = deadline.getTime() - now.getTime()

    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    return { days, hours, minutes, seconds }
  }

  const handleSavePrediction = (matchId: string) => {
    if (!currentUser) return

    const newPredictions = {
      ...predictions,
      [matchId]: tempPrediction
    }
    setPredictions(newPredictions)
    localStorage.setItem('predictions_' + currentUser.username, JSON.stringify(newPredictions))
    setEditingMatch(null)
  }

  const getMatchPoints = (match: Match) => {
    if (!match.homeScore !== undefined && match.awayScore !== undefined) return null
    const prediction = predictions[match.id]
    if (!prediction) return null

    // Calculate points based on rules:
    // - 5 pts for exact 1X2
    // - 2 pts for close to 1X2 (1 position away)
    // - 3 pts for exact team goals
    // - 1 pt for close to goals (1 away)
    let points = 0

    // 1X2 logic
    const actualResult = match.homeScore! > match.awayScore! ? 'home' :
                         match.homeScore! < match.awayScore! ? 'away' : 'draw'
    const predictedResult = prediction.homeScore > prediction.awayScore ? 'home' :
                           prediction.homeScore < prediction.awayScore ? 'away' : 'draw'

    if (actualResult === predictedResult) {
      points += 5
    }

    // Goals logic
    if (prediction.homeScore === match.homeScore) {
      points += 3
    } else if (Math.abs(prediction.homeScore - match.homeScore!) === 1) {
      points += 1
    }

    if (prediction.awayScore === match.awayScore) {
      points += 3
    } else if (Math.abs(prediction.awayScore - match.awayScore!) === 1) {
      points += 1
    }

    return points
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

  // Create user function
  const handleCreateUser = () => {
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

    const users = JSON.parse(localStorage.getItem('users') || '[]')

    if (users.find((u: any) => u.username === newUsername)) {
      setUserError('El nombre de usuario ya existe')
      return
    }

    const newUser = {
      username: newUsername,
      password: newPassword,
      isAdmin: false,
      mustChangePassword: true,
      createdAt: new Date().toISOString(),
      points: 0
    }

    users.push(newUser)
    localStorage.setItem('users', JSON.stringify(users))
    setAdminUsers(users)
    setNewUsername('')
    setNewPassword('')
    setUserCreated(true)

    setTimeout(() => setUserCreated(false), 3000)
  }

  // Delete user function
  const handleDeleteUser = (username: string) => {
    if (username === 'admin') {
      setUserError('No se puede eliminar el usuario admin')
      return
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]')
    const filteredUsers = users.filter((u: any) => u.username !== username)
    localStorage.setItem('users', JSON.stringify(filteredUsers))
    setAdminUsers(filteredUsers)
  }

  // Reset password function
  const handleResetPassword = (username: string) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]')
    const userIndex = users.findIndex((u: any) => u.username === username)

    if (userIndex !== -1) {
      // Generate random temporary password
      const tempPassword = Math.random().toString(36).substring(2, 8)
      users[userIndex].password = tempPassword
      users[userIndex].mustChangePassword = true
      localStorage.setItem('users', JSON.stringify(users))
      setAdminUsers([...users])
      alert(`Contraseña reseteada para ${username}. Nueva contraseña temporal: ${tempPassword}`)
    }
  }

  // Reset admin password
  const handleResetAdminPassword = () => {
    const tempPassword = prompt('Introduce la nueva contraseña para admin:')
    if (tempPassword && tempPassword.length >= 4) {
      // Update localStorage admin password
      const users = JSON.parse(localStorage.getItem('users') || '[]')
      const adminInList = users.find((u: any) => u.username === 'admin')
      if (adminInList) {
        adminInList.password = tempPassword
      }
      localStorage.setItem('users', JSON.stringify(users))
      alert('Contraseña de admin actualizada')
    } else {
      alert('La contraseña debe tener al menos 4 caracteres')
    }
  }

  if (!mounted) return null

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
                  {mockUsers.slice(0, 3).map((u, index) => (
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
                        <p className="text-sm text-text-secondary">{u.isAdmin ? 'Admin' : 'Participante'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">{u.points}</p>
                        <p className="text-xs text-text-secondary">puntos</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Today's Matches */}
              <div className="lg:col-span-3 bg-surface rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Calendar className="w-6 h-6 text-primary" />
                  <h2 className="text-xl font-bold text-text-primary">Partidos de Hoy</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mockMatches.slice(0, 3).map((match) => (
                    <div key={match.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                          {match.group}
                        </span>
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
                          <p className="font-semibold text-sm text-text-primary">{match.homeTeam}</p>
                          <p className="text-lg font-bold text-text-primary">
                            {match.homeScore !== undefined ? match.homeScore : '-'}
                          </p>
                        </div>
                        <div className="text-center px-4">
                          <p className="text-text-secondary text-sm">vs</p>
                          <p className="text-xs text-text-secondary">{match.time}</p>
                        </div>
                        <div className="text-center flex-1">
                          <p className="font-semibold text-sm text-text-primary">{match.awayTeam}</p>
                          <p className="text-lg font-bold text-text-primary">
                            {match.awayScore !== undefined ? match.awayScore : '-'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
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
                {mockMatches.map((match) => {
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
                          {match.group && (
                            <span className="text-xs font-medium text-text-secondary bg-gray-200 px-2 py-1 rounded">
                              Grupo {match.group}
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-text-secondary">{match.date} {match.time}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-center flex-1">
                          <p className="font-semibold text-text-primary">{match.homeTeam}</p>
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
                          <p className="font-semibold text-text-primary">{match.awayTeam}</p>
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
                      placeholder="Mínimo 4 caracteres"
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
                  <p className="text-2xl font-bold text-primary">{adminUsers.length}</p>
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
                        <th className="pb-3">Contraseña Temporal</th>
                        <th className="pb-3">Debe Cambiar Pwd</th>
                        <th className="pb-3">Fecha Creación</th>
                        <th className="pb-3">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-100">
                        <td className="py-3 font-medium text-text-primary flex items-center gap-2">
                          <Shield className="w-4 h-4 text-fifa-gold" />
                          admin
                        </td>
                        <td className="py-3 text-text-secondary font-mono">******</td>
                        <td className="py-3"><span className="text-fifa-green">No</span></td>
                        <td className="py-3 text-text-secondary">-</td>
                        <td className="py-3">
                          <button
                            onClick={handleResetAdminPassword}
                            className="text-primary hover:underline text-sm flex items-center gap-1"
                          >
                            <Shield className="w-4 h-4" />
                            Cambiar Pwd
                          </button>
                        </td>
                      </tr>
                      {adminUsers.map((u) => (
                        <tr key={u.username} className="border-b border-gray-100">
                          <td className="py-3 font-medium text-text-primary">{u.username}</td>
                          <td className="py-3 text-text-secondary font-mono">******</td>
                          <td className="py-3">
                            {u.mustChangePassword ? (
                              <span className="text-fifa-red">Sí</span>
                            ) : (
                              <span className="text-fifa-green">No</span>
                            )}
                          </td>
                          <td className="py-3 text-text-secondary text-sm">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}
                          </td>
                          <td className="py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleResetPassword(u.username)}
                                className="text-primary hover:underline text-sm flex items-center gap-1"
                              >
                                <Shield className="w-4 h-4" />
                                Resetear
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.username)}
                                className="text-fifa-red hover:underline text-sm flex items-center gap-1"
                              >
                                <Trash2 className="w-4 h-4" />
                                Eliminar
                              </button>
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