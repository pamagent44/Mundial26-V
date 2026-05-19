'use client'

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Trophy, Clock, Users, Shield, Calendar, Star,
  CheckCircle, XCircle, AlertCircle, Edit3, Save, Eye, EyeOff, Play, Pause,
  UserPlus, UserCheck, Trash2, Download, RefreshCw, Database
} from 'lucide-react'
import { 
  createUser, getUsers, getMatches, createPrediction, getUserPredictions, syncMatchesFromAPI,
  deleteUser, createPredictionBackup, getLatestBackup, resetPassword, updatePassword
} from '@/app/actions'

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
  password: string
}

// Definición de fases para el Mundial 2026 (48 equipos)
const PHASES = [
  { key: 'groups', label: 'Fase de Grupos', multiplier: 1 },
  { key: 'round32', label: 'Ronda de 32', multiplier: 2 },
  { key: 'round16', label: 'Octavos', multiplier: 2 },
  { key: 'quarterfinals', label: 'Cuartos', multiplier: 3 },
  { key: 'semifinals', label: 'Semifinal', multiplier: 4 },
  { key: 'final', label: 'Final', multiplier: 5 },
  { key: 'thirdplace', label: '3er Lugar', multiplier: 4 },
]

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
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null)
  const router = useRouter()

  // Admin state
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [userCreated, setUserCreated] = useState(false)
  const [userError, setUserError] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')
  
  // Reset password state
  const [showResetModal, setShowResetModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState('')
  const [newTempPassword, setNewTempPassword] = useState('')

  // Change own password state
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPasswordAdmin, setNewPasswordAdmin] = useState('')
  const [confirmPasswordAdmin, setConfirmPasswordAdmin] = useState('')
 
  // Backup state
  const [downloading, setDownloading] = useState(false)
  const [backupInfo, setBackupInfo] = useState<{ date: string; count: number } | null>(null)
  const [showBackupConfirm, setShowBackupConfirm] = useState(false)

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

    loadData(parsedUser.username)
  }, [router])

  useEffect(() => {
    if (isAdmin) {
      loadBackupInfo()
    }
  }, [isAdmin])

  const loadData = async (username: string) => {
    try {
      const [matchesData, usersData, predictionsData] = await Promise.all([
        getMatches(),
        getUsers(),
        getUserPredictions(username)
      ])

      setMatches(matchesData || [])
      setUsers(usersData || [])

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
    const phaseConfig = PHASES.find(p => p.key === phase)
    return phaseConfig?.multiplier || 1
  }

  const getPhaseName = (phase: string) => {
    const phaseConfig = PHASES.find(p => p.key === phase)
    return phaseConfig?.label || phase
  }

  const handleSavePrediction = async (matchId: string) => {
    if (!currentUser) return

    try {
      await createPrediction(currentUser.username, matchId, tempPrediction.homeScore, tempPrediction.awayScore)

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

    const multiplier = getPhaseMultiplier(match.phase)
    return points * multiplier
  }

  const handleCreateUser = async () => {
    setUserError('')
    setUserCreated(false)

    if (!newUsername || newUsername.length < 3) {
      setUserError('El nombre de usuario debe tener al menos 3 caracteres')
      return
    }

    if (!newPassword || newPassword.length < 6) {
      setUserError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    try {
      await createUser(newUsername, newPassword, false)
      setUserCreated(true)
      setNewUsername('')
      setNewPassword('')

      const usersData = await getUsers()
      setUsers(usersData || [])

      setTimeout(() => setUserCreated(false), 3000)
    } catch (err: any) {
      setUserError(err.message || 'Error creando usuario')
    }
  }

  const handleDeleteUser = async (username: string) => {
    if (username === 'admin') {
      setUserError('No se puede eliminar el usuario admin')
      return
    }
    
    if (!confirm(`¿Estás seguro de que quieres eliminar al usuario "${username}"? Se eliminarán todas sus predicciones.`)) {
      return
    }
    
    setUserError('')
    setSyncing(true)
    
    try {
      await deleteUser(username)
      
      const usersData = await getUsers()
      setUsers(usersData || [])
      
      setUserCreated(true)
      setTimeout(() => setUserCreated(false), 3000)
    } catch (err: any) {
      setUserError(err.message || 'Error eliminando usuario')
    } finally {
      setSyncing(false)
    }
  }

  const handleResetPassword = (username: string) => {
    setSelectedUser(username)
    setNewTempPassword('')
    setShowResetModal(true)
  }

  const handleConfirmResetPassword = async () => {
    if (!newTempPassword || newTempPassword.length < 6) {
      setUserError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    
    setSyncing(true)
    try {
      await resetPassword(selectedUser, newTempPassword)
      setUserCreated(true)
      setSyncMessage(`✅ Contraseña reseteada para ${selectedUser}`)
      setTimeout(() => {
        setUserCreated(false)
        setSyncMessage('')
      }, 3000)
      setShowResetModal(false)
      setNewTempPassword('')
    } catch (err: any) {
      setUserError(err.message || 'Error reseteando contraseña')
    } finally {
      setSyncing(false)
    }
  }

  const handleChangeOwnPassword = async () => {
    if (!currentPassword) {
      setUserError('Debes ingresar tu contraseña actual')
      return
    }
    
    if (!newPasswordAdmin || newPasswordAdmin.length < 6) {
      setUserError('La nueva contraseña debe tener al menos 6 caracteres')
      return
    }
    
    if (newPasswordAdmin !== confirmPasswordAdmin) {
      setUserError('Las contraseñas nuevas no coinciden')
      return
    }
    
    if (currentPassword !== currentUser?.password) {
      setUserError('Contraseña actual incorrecta')
      return
    }
    
    setSyncing(true)
    try {
      await updatePassword(currentUser!.username, newPasswordAdmin)
      
      const updatedUser = { ...currentUser, password: newPasswordAdmin, must_change_password: false }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setCurrentUser(updatedUser)
      
      setSyncMessage('✅ Tu contraseña ha sido actualizada correctamente')
      setShowChangePasswordModal(false)
      setCurrentPassword('')
      setNewPasswordAdmin('')
      setConfirmPasswordAdmin('')
      
      setTimeout(() => setSyncMessage(''), 3000)
    } catch (err: any) {
      setUserError(err.message || 'Error cambiando contraseña')
    } finally {
      setSyncing(false)
    }
  }

  const handleSyncMatches = async () => {
    setSyncing(true)
    setSyncMessage('')
    try {
      const result = await syncMatchesFromAPI()
      setSyncMessage(`✅ ${result.total} partidos sincronizados (${result.inserted} nuevos, ${result.updated} actualizados)`)
      const matchesData = await getMatches()
      setMatches(matchesData || [])
    } catch (err: any) {
      setSyncMessage('❌ ' + err.message)
    } finally {
      setSyncing(false)
      setTimeout(() => setSyncMessage(''), 5000)
    }
  }

  // Backup functions
  const handleCreateBackup = async () => {
    setShowBackupConfirm(false)
    setSyncing(true)
    try {
      const result = await createPredictionBackup()
      if (result.success) {
        setSyncMessage(`✅ ${result.message}`)
        await loadBackupInfo()
      } else {
        setSyncMessage('❌ Error al crear backup')
      }
    } catch (err: any) {
      setSyncMessage('❌ ' + err.message)
    } finally {
      setSyncing(false)
      setTimeout(() => setSyncMessage(''), 5000)
    }
  }

  const loadBackupInfo = async () => {
    try {
      const result = await getLatestBackup()
      if (result.success && result.backup) {
        const backupData = result.backup.backup_data
        setBackupInfo({
          date: new Date(result.backup.backup_date).toLocaleString(),
          count: backupData.total_predictions || backupData.predictions?.length || 0
        })
      }
    } catch (err) {
      console.error('Error cargando info backup:', err)
    }
  }

  const handleDownloadBackup = async () => {
    setDownloading(true)
    try {
      const result = await getLatestBackup()
      if (result.success && result.backup) {
        const backupData = result.backup.backup_data
        const jsonStr = JSON.stringify(backupData, null, 2)
        const blob = new Blob([jsonStr], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `backup_predicciones_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        setSyncMessage('✅ Backup descargado correctamente')
      } else {
        setSyncMessage('❌ No hay backups disponibles para descargar')
      }
    } catch (err: any) {
      setSyncMessage('❌ ' + err.message)
    } finally {
      setDownloading(false)
      setTimeout(() => setSyncMessage(''), 5000)
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
                    <p className="text-text-secondary text-center py-4 col-span-3">No hay partidos programados. Sincroniza desde el panel de Admin.</p>
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
                {PHASES.map((phase) => (
                  <button
                    key={phase.key}
                    onClick={() => setSelectedPhase(selectedPhase === phase.key ? null : phase.key)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                      selectedPhase === phase.key
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-text-secondary hover:bg-primary hover:text-white'
                    }`}
                  >
                    {phase.label} (x{phase.multiplier})
                  </button>
                ))}
              </div>

              {/* Matches List */}
              <div className="space-y-4">
                {selectedPhase && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-text-secondary">Filtrando por:</span>
                    <span className="px-3 py-1 bg-primary text-white text-sm rounded-full font-medium">
                      {getPhaseName(selectedPhase)}
                    </span>
                    <button
                      onClick={() => setSelectedPhase(null)}
                      className="text-sm text-fifa-red hover:underline"
                    >
                      Limpiar filtro
                    </button>
                  </div>
                )}
                {matches.filter(match => !selectedPhase || match.phase === selectedPhase).map((match) => {
                  const prediction = predictions[match.id]
                  const isEditing = editingMatch === match.id
                  const canEdit = match.status === 'upcoming'
                  const multiplier = getPhaseMultiplier(match.phase)

                  return (
                    <div key={match.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                            {getPhaseName(match.phase)} (x{multiplier})
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
                {matches.filter(match => !selectedPhase || match.phase === selectedPhase).length === 0 && (
                  <p className="text-text-secondary text-center py-8">
                    {selectedPhase
                      ? `No hay partidos en ${getPhaseName(selectedPhase)}.`
                      : 'No hay partidos disponibles. Sincroniza desde el panel de Admin.'}
                  </p>
                )}
              </div>

              <div className="mt-6 p-4 bg-accent/10 border border-accent rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-text-primary">Recuerda</p>
                    <p className="text-sm text-text-secondary">
                      Las predicciones se bloquean 24h antes del primer partido de cada fase.
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

              {/* Sync Matches */}
              <div className="bg-fifa-green/5 border border-fifa-green/20 rounded-xl p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-fifa-green" />
                  <h3 className="font-semibold text-text-primary">Sincronizar Partidos</h3>
                </div>
                <p className="text-sm text-text-secondary mb-4">
                  Descarga los partidos oficiales del Mundial 2026 desde football-data.org
                </p>
                {syncMessage && (
                  <div className={`px-4 py-3 rounded-lg mb-4 ${syncMessage.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {syncMessage}
                  </div>
                )}
                <button
                  onClick={handleSyncMatches}
                  disabled={syncing}
                  className="w-full bg-fifa-green hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {syncing ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sincronizando...
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4" />
                      Sincronizar Partidos Mundial 2026
                    </>
                  )}
                </button>
              </div>

              {/* Backup Section */}
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Database className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-text-primary">Copia de Seguridad</h3>
                </div>
                <p className="text-sm text-text-secondary mb-4">
                  Las copias se realizan automáticamente todos los días a las 23:30. Se mantienen las últimas 3 copias.
                </p>
                
                {backupInfo && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
                    <p className="text-text-secondary">
                      <span className="font-medium">Última copia:</span> {backupInfo.date} | 
                      <span className="font-medium ml-2">{backupInfo.count} predicciones</span>
                    </p>
                  </div>
                )}
                
                <div className="flex gap-3">
                  <button
                    onClick={handleDownloadBackup}
                    disabled={downloading}
                    className="flex-1 bg-primary hover:bg-fifa-blue text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {downloading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Descargando...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Descargar Última Copia
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => setShowBackupConfirm(true)}
                    className="flex-1 bg-fifa-green hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Crear Copia Ahora
                  </button>
                </div>
              </div>

              {/* Cambiar mi propia contraseña */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-text-primary">Mi Contraseña</h3>
                  <p className="text-sm text-text-secondary">Cambia tu contraseña de administrador</p>
                </div>
                <button
                  onClick={() => setShowChangePasswordModal(true)}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-fifa-blue transition-colors flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  Cambiar Contraseña
                </button>
              </div>

              {/* Create User */}
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
                    <label className="block text-sm font-medium text-text-primary mb-2">Nombre de Usuario</label>
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                      placeholder="Mínimo 3 caracteres"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Contraseña Temporal</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                      placeholder="Mínimo 6 caracteres"
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

              {/* Users List */}
              <div className="bg-surface rounded-xl border border-gray-200 overflow-hidden">
                <div className="flex items-center gap-2 p-6 border-b border-gray-200">
                  <Users className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-text-primary">Usuarios Registrados</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Usuario</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Rol</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Puntos</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {users.map((u) => (
                        <tr key={u.username} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                                <span className="text-sm font-bold text-primary">{u.username[0].toUpperCase()}</span>
                              </div>
                              <span className="font-medium text-text-primary">{u.username}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              u.is_admin ? 'bg-fifa-red/10 text-fifa-red' : 'bg-primary/10 text-primary'
                            }`}>
                              {u.is_admin ? 'Admin' : 'Participante'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-bold text-text-primary">{u.points || 0}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleResetPassword(u.username)}
                                className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                                title={`Resetear contraseña de ${u.username}`}
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              
                              {u.username !== currentUser?.username && (
                                <button
                                  onClick={() => handleDeleteUser(u.username)}
                                  className={`p-2 transition-colors ${
                                    u.username === 'admin' 
                                      ? 'text-gray-300 cursor-not-allowed' 
                                      : 'text-red-600 hover:text-red-800'
                                  }`}
                                  title={u.username === 'admin' ? 'No se puede eliminar admin' : 'Eliminar usuario'}
                                  disabled={u.username === 'admin'}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {users.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-text-secondary">
                            No hay usuarios registrados
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal para resetear contraseña */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md mx-4">
            <h3 className="text-lg font-bold mb-4">Resetear Contraseña</h3>
            <p className="text-text-secondary mb-4">
              Usuario: <span className="font-semibold">{selectedUser}</span>
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-primary mb-2">
                Nueva Contraseña Temporal
              </label>
              <input
                type="password"
                value={newTempPassword}
                onChange={(e) => setNewTempPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowResetModal(false)
                  setNewTempPassword('')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmResetPassword}
                className="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-fifa-blue"
              >
                Resetear Contraseña
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para cambiar propia contraseña */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md mx-4">
            <h3 className="text-lg font-bold mb-4">Cambiar mi Contraseña</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-primary mb-2">
                Contraseña Actual
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                placeholder="Tu contraseña actual"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-primary mb-2">
                Nueva Contraseña
              </label>
              <input
                type="password"
                value={newPasswordAdmin}
                onChange={(e) => setNewPasswordAdmin(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-primary mb-2">
                Confirmar Nueva Contraseña
              </label>
              <input
                type="password"
                value={confirmPasswordAdmin}
                onChange={(e) => setConfirmPasswordAdmin(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                placeholder="Repite la nueva contraseña"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowChangePasswordModal(false)
                  setCurrentPassword('')
                  setNewPasswordAdmin('')
                  setConfirmPasswordAdmin('')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleChangeOwnPassword}
                className="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-fifa-blue"
              >
                Cambiar Contraseña
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de backup */}
      {showBackupConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md mx-4">
            <h3 className="text-lg font-bold mb-4">Confirmar Backup Manual</h3>
            <p className="text-text-secondary mb-6">
              ¿Deseas crear una copia de seguridad manual? Se guardará junto con las automáticas.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBackupConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateBackup}
                className="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-fifa-blue"
              >
                Crear Backup
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

// Countdown Timer Component
function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    const targetDate = new Date('2026-06-11T00:00:00')

    const calculateTimeLeft = () => {
      const now = new Date()
      const difference = targetDate.getTime() - now.getTime()

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        })
      }
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="grid grid-cols-4 gap-2">
      {[
        { value: timeLeft.days, label: 'Días' },
        { value: timeLeft.hours, label: 'Horas' },
        { value: timeLeft.minutes, label: 'Min' },
        { value: timeLeft.seconds, label: 'Seg' },
      ].map((item, index) => (
        <div key={index} className="bg-white/20 rounded-lg p-2 text-center">
          <div className="text-2xl font-bold">{String(item.value).padStart(2, '0')}</div>
          <div className="text-xs text-white/80">{item.label}</div>
        </div>
      ))}
    </div>
  )
}