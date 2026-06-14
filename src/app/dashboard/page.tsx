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
  deleteUser, createPredictionBackup, getLatestBackup, resetPassword, updatePassword,
  recalculateAllRankings,
  createAdminManualPrediction
} from '@/app/actions'
import { getMatchDeadline } from '@/lib/utils/matchPhaseMapper'

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

interface UserData {
  username: string
  points: number
  is_admin: boolean
  must_change_password: boolean
  password: string
}

const PHASES = [
  { key: 'groups', label: 'Fase de Grupos', multiplier: 1 },
  { key: 'Dieciseisavos', label: 'Dieciseisavos', multiplier: 2 },
  { key: 'round16', label: 'Octavos', multiplier: 2 },
  { key: 'quarterfinals', label: 'Cuartos', multiplier: 3 },
  { key: 'semifinals', label: 'Semifinal', multiplier: 4 },
  { key: 'thirdplace', label: '3er Lugar', multiplier: 4 }, 
  { key: 'final', label: 'Final', multiplier: 5 },
]

// Rangos de fechas configurados a las 05:00 AM para el filtrado exacto en la pestaña de Predicciones
const PHASE_DATE_RANGES: Record<string, { start: Date; end: Date }> = {
  groups:        { start: new Date('2026-06-11T00:00:00Z'), end: new Date('2026-06-28T05:00:00Z') },
  Dieciseisavos: { start: new Date('2026-06-28T05:00:00Z'), end: new Date('2026-07-04T05:00:00Z') },
  round16:       { start: new Date('2026-07-04T05:00:00Z'), end: new Date('2026-07-08T05:00:00Z') },
  quarterfinals: { start: new Date('2026-07-08T05:00:00Z'), end: new Date('2026-07-12T05:00:00Z') },
  semifinals:    { start: new Date('2026-07-12T05:00:00Z'), end: new Date('2026-07-16T05:00:00Z') },
  thirdplace:    { start: new Date('2026-07-16T05:00:00Z'), end: new Date('2026-07-18T23:59:59Z') },
  final:         { start: new Date('2026-07-18T05:00:00Z'), end: new Date('2026-07-21T05:00:00Z') },
}

const DEADLINE_BLOCKS = [
  { label: 'Fase de Grupos (Bloque 1)', date: new Date('2026-06-10T23:30:00Z') },
  { label: 'Fase de Grupos (Bloque 2)', date: new Date('2026-06-17T23:30:00Z') },
  { label: 'Fase de Grupos (Bloque 3)', date: new Date('2026-06-23T23:30:00Z') },
  { label: 'Dieciseisavos de Final', date: new Date('2026-06-27T23:30:00Z') },
  { label: 'Octavos de Final', date: new Date('2026-07-03T23:30:00Z') },
  { label: 'Cuartos de Final', date: new Date('2026-07-08T23:30:00Z') },
  { label: 'Semifinales', date: new Date('2026-07-13T23:30:00Z') },
  { label: 'Final y 3er Puesto', date: new Date('2026-07-17T23:30:00Z') },
]

function MatchCountdown({ deadline }: { deadline: Date }) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null)
  const [isBlocked, setIsBlocked] = useState(false)

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date()
      const difference = deadline.getTime() - now.getTime()

      if (difference <= 0) {
        setIsBlocked(true)
        setTimeLeft(null)
      } else {
        setIsBlocked(false)
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        })
      }
    }

    calculateTime()
    const timer = setInterval(calculateTime, 1000)
    return () => clearInterval(timer)
  }, [deadline])

  if (isBlocked) {
    return <span className="text-sm font-bold text-fifa-red animate-pulse">🔒 Bloqueado</span>
  }
  if (!timeLeft) return null

  return (
    <span className="text-xs font-mono bg-gray-100 text-text-secondary px-2 py-1 rounded border border-gray-200 shadow-sm">
      ⏳ {timeLeft.days}d {String(timeLeft.hours).padStart(2, '0')}h:{String(timeLeft.minutes).padStart(2, '0')}m:{String(timeLeft.seconds).padStart(2, '0')}s
    </span>
  )
}

function DashboardDeadlineTimer() {
  const [currentBlock, setCurrentBlock] = useState<{ label: string; date: Date } | null>(null)
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date()
      const activeBlock = DEADLINE_BLOCKS.find(b => b.date.getTime() > now.getTime())

      if (!activeBlock) {
        setFinished(true)
        setCurrentBlock(null)
        return
      }

      setCurrentBlock(activeBlock)
      setFinished(false)

      const difference = activeBlock.date.getTime() - now.getTime()
      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      })
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [])

  if (finished) {
    return (
      <div className="text-center py-4 bg-white/10 rounded-xl border border-white/20">
        <p className="font-bold text-lg">🔒 Predicciones Cerradas</p>
        <p className="text-xs text-white/80 mt-1">El mundial está en curso o ha finalizado.</p>
      </div>
    )
  }

  if (!currentBlock) return null

  return (
    <div className="text-center">
      <div className="mb-3">
        <span className="text-xs font-bold uppercase tracking-wider bg-white/20 text-white px-3 py-1 rounded-full border border-white/10">
          🎯 Cierre: {currentBlock.label}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2 font-bold text-center">
        <div className="bg-white/20 p-2 rounded"><div>{timeLeft.days}</div><div className="text-xs font-normal">Días</div></div>
        <div className="bg-white/20 p-2 rounded"><div>{String(timeLeft.hours).padStart(2, '0')}</div><div className="text-xs font-normal">Horas</div></div>
        <div className="bg-white/20 p-2 rounded"><div>{String(timeLeft.minutes).padStart(2, '0')}</div><div className="text-xs font-normal">Min</div></div>
        <div className="bg-white/20 p-2 rounded"><div>{String(timeLeft.seconds).padStart(2, '0')}</div><div className="text-xs font-normal">Seg</div></div>
      </div>
      <p className="text-[10px] text-white/60 mt-3">
        Límite: {currentBlock.date.toLocaleDateString('es-ES')} a las 23:30 (Hora UTC)
      </p>
    </div>
  )
}

function matchBelongsToPhase(match: Match, phaseKey: string): boolean {
  const range = PHASE_DATE_RANGES[phaseKey]
  if (!range) return match.phase === phaseKey
  const matchDate = new Date(match.match_date)
  return matchDate >= range.start && matchDate <= range.end
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'predictions' | 'admin' | 'admin-manual'>('dashboard')
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

  // Admin states
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [userCreated, setUserCreated] = useState(false)
  const [userError, setUserError] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')
  const [calculating, setCalculating] = useState(false)
  const [calcMessage, setCalcMessage] = useState('')

  // Gestión manual del administrador
  const [manualTargetUser, setManualTargetUser] = useState('')
  const [manualTargetMatch, setManualTargetMatch] = useState('')
  const [manualHomeScore, setManualHomeScore] = useState(0)
  const [manualAwayScore, setManualAwayScore] = useState(0)
  const [manualMessage, setManualMessage] = useState('')
  
  const [showResetModal, setShowResetModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState('')
  const [newTempPassword, setNewTempPassword] = useState('')

  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPasswordAdmin, setNewPasswordAdmin] = useState('')
  const [confirmPasswordAdmin, setConfirmPasswordAdmin] = useState('')
 
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
    if (isAdmin) loadBackupInfo()
  }, [isAdmin])

  useEffect(() => {
    if (currentUser?.username) {
      loadData(currentUser.username)
    }
  }, [activeTab])
  
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
      console.error(err)
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
      setPredictions({ ...predictions, [matchId]: tempPrediction })
      setEditingMatch(null)
      await loadData(currentUser.username)
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleSaveAdminManualPrediction = async () => {
    setManualMessage('')
    if (!currentUser || !manualTargetUser || !manualTargetMatch) {
      setManualMessage('❌ Por favor, selecciona un usuario y un partido válido.')
      return
    }
    try {
      await createAdminManualPrediction(
        currentUser.username,
        manualTargetUser,
        manualTargetMatch,
        manualHomeScore,
        manualAwayScore
      )
      setManualMessage('✅ Predicción guardada correctamente en el sistema.')
      setManualTargetMatch('')
      setManualHomeScore(0)
      setManualAwayScore(0)
      await loadData(currentUser.username)
    } catch (err: any) {
      setManualMessage('❌ Error: ' + err.message)
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

    return points * getPhaseMultiplier(match.phase)
  }

  const handleCreateUser = async () => {
    setUserError(''); setUserCreated(false)
    if (!newUsername || newUsername.length < 3 || !newPassword || newPassword.length < 6) {
      setUserError('Verifica la longitud del usuario (3) y contraseña (6)')
      return
    }
    try {
      await createUser(newUsername, newPassword, false)
      setUserCreated(true); setNewUsername(''); setNewPassword('')
      const usersData = await getUsers()
      setUsers(usersData || [])
      setTimeout(() => setUserCreated(false), 3000)
    } catch (err: any) {
      setUserError(err.message)
    }
  }

  const handleDeleteUser = async (username: string) => {
    if (username === 'admin') return
    if (!confirm(`¿Eliminar usuario "${username}"?`)) return
    try {
      await deleteUser(username)
      const usersData = await getUsers()
      setUsers(usersData || [])
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleResetPassword = (username: string) => {
    setSelectedUser(username); setNewTempPassword(''); setShowResetModal(true)
  }

  const handleConfirmResetPassword = async () => {
    if (!newTempPassword || newTempPassword.length < 6) return
    try {
      await resetPassword(selectedUser, newTempPassword)
      setShowResetModal(false); setNewTempPassword('')
      alert('Contraseña cambiada temporalmente')
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleChangeOwnPassword = async () => {
    if (newPasswordAdmin !== confirmPasswordAdmin || currentPassword !== currentUser?.password) {
      alert('Error en las credenciales introducidas')
      return
    }
    try {
      await updatePassword(currentUser!.username, newPasswordAdmin)
      setShowChangePasswordModal(false)
      alert('Contraseña actualizada con éxito')
    } catch (err: any) {
      alert(err.message)
    }
  }

  // ✅ CORREGIDO AL 100%: Eliminada por completo la sintaxis inválida 'fill:' de este bloque asíncrono
  const handleSyncMatches = async () => {
    setSyncing(true)
    try {
      const result = await syncMatchesFromAPI()
      setSyncMessage(`✅ ${result.total} partidos sincronizados.`)
      const matchesData = await getMatches()
      setMatches(matchesData || [])
    } catch (err: any) {
      setSyncMessage('❌ ' + err.message)
    } finally {
      setSyncing(false)
    }
  }

  // ✅ CORREGIDO AL 100%: Bloque purgado de forma homogénea libre de errores
  const handleRecalculateRankings = async () => {
    setCalculating(true)
    try {
      const result = await recalculateAllRankings()
      setCalcMessage(`✅ ${result.message}`)
      const usersData = await getUsers()
      setUsers(usersData || [])
    } catch (err: any) {
      setCalcMessage('❌ ' + err.message)
    } finally {
      setCalculating(false)
    }
  }

  const loadBackupInfo = async () => {
    const result = await getLatestBackup()
    if (result.success && result.backup) {
      setBackupInfo({
        date: new Date(result.backup.backup_date).toLocaleString(),
        count: result.backup.backup_data.total_predictions || 0
      })
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-1 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text-primary mb-2">¡Bienvenido, {currentUser?.username}!</h1>
            <p className="text-text-secondary">Panel de control de la porra del Mundial 2026</p>
          </div>

          <div className="flex gap-2 mb-8 overflow-x-auto">
            {['dashboard', 'predictions', 'admin', 'admin-manual'].map((tab) => {
              if ((tab === 'admin' || tab === 'admin-manual') && !isAdmin) return null
              return (
                <button
                  key={tab} onClick={() => setActiveTab(tab as any)}
                  className={`px-6 py-3 rounded-lg font-semibold capitalize whitespace-nowrap ${activeTab === tab ? 'bg-primary text-white' : 'bg-surface text-text-secondary'}`}
                >
                  {tab === 'admin-manual' ? 'Gestión Manual' : tab}
                </button>
              )
            })}
          </div>

          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 bg-gradient-to-br from-primary to-fifa-green rounded-2xl p-6 text-white shadow-lg flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-6 h-6" />
                  <h2 className="text-xl font-bold">Próximo Cierre</h2>
                </div>
                <DashboardDeadlineTimer />
              </div>

              <div className="lg:col-span-2 bg-surface rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2"><Trophy className="w-6 h-6 text-accent" /><h2 className="text-xl font-bold">Top 3 Ranking</h2></div>
                  <Link href="/ranking" className="text-primary font-semibold hover:underline">Ver todo</Link>
                </div>
                <div className="space-y-4">
                  {users.slice(0, 3).map((u, idx) => (
                    <div key={u.username} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                      <span className="font-bold">{idx + 1}. {u.username}</span>
                      <span className="text-xl font-bold text-primary">{u.points || 0} pts</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-3 bg-surface rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold mb-4">Próximos Partidos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {matches.slice(0, 6).map(m => (
                    <div key={m.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <div className="flex justify-between text-xs text-text-secondary mb-2"><span>{getPhaseName(m.phase)}</span><span>{m.status.toUpperCase()}</span></div>
                      <div className="flex justify-between items-center font-semibold">
                        <span>{m.home_team} {m.home_score ?? '-'}</span>
                        <span>vs</span>
                        <span>{m.away_score ?? '-'} {m.away_team}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'predictions' && (
            <div className="bg-surface rounded-2xl shadow-lg p-6">
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {PHASES.map((phase) => (
                  <button
                    key={phase.key} onClick={() => setSelectedPhase(selectedPhase === phase.key ? null : phase.key)}
                    className={`px-4 py-2 rounded-lg font-medium ${selectedPhase === phase.key ? 'bg-primary text-white' : 'bg-gray-100 text-text-secondary'}`}
                  >
                    {phase.label}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                {matches.filter(match => !selectedPhase || matchBelongsToPhase(match, selectedPhase)).map((match) => {
                  const prediction = predictions[match.id]
                  const isEditing = editingMatch === match.id
                  
                  const deadline = getMatchDeadline(match.match_date)
                  const canEdit = match.status === 'upcoming' && (new Date() < deadline)

                  return (
                    <div key={match.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">{getPhaseName(match.phase)}</span>
                        
                        <div className="flex items-center gap-3">
                          <MatchCountdown deadline={deadline} />
                          <span className="text-sm text-text-secondary">{new Date(match.match_date).toLocaleDateString('es-ES')}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="font-semibold w-1/3 text-left">{match.home_team}</span>
                        <div className="flex items-center gap-2">
                          {canEdit ? (
                            isEditing ? (
                              <>
                                <input type="number" value={tempPrediction.homeScore} onChange={(e) => setTempPrediction({ ...tempPrediction, homeScore: parseInt(e.target.value) || 0 })} className="w-12 text-center border rounded" />
                                <span>-</span>
                                <input type="number" value={tempPrediction.awayScore} onChange={(e) => setTempPrediction({ ...tempPrediction, awayScore: parseInt(e.target.value) || 0 })} className="w-12 text-center border rounded" />
                                <button onClick={() => handleSavePrediction(match.id)} className="p-2 bg-fifa-green text-white rounded"><Save className="w-4 h-4" /></button>
                              </>
                            ) : (
                              <>
                                <span className="w-12 text-center font-bold bg-white p-1 border rounded">{prediction ? prediction.homeScore : '-'}</span>
                                <span>-</span>
                                <span className="w-12 text-center font-bold bg-white p-1 border rounded">{prediction ? prediction.awayScore : '-'}</span>
                                <button onClick={() => { setEditingMatch(match.id); setTempPrediction(prediction || { homeScore: 0, awayScore: 0 }) }} className="p-2 bg-primary text-white rounded"><Edit3 className="w-4 h-4" /></button>
                              </>
                            )
                          ) : (
                            <>
                              <span className="w-12 text-center font-bold bg-gray-200 p-1 border rounded">{prediction ? prediction.homeScore : '-'}</span>
                              <span>-</span>
                              <span className="w-12 text-center font-bold bg-gray-200 p-1 border rounded">{prediction ? prediction.awayScore : '-'}</span>
                              {prediction && match.status === 'finished' && <span className="ml-2 text-fifa-green font-bold">+{getMatchPoints(match)} pts</span>}
                            </>
                          )}
                        </div>
                        <span className="font-semibold w-1/3 text-right">{match.away_team}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {activeTab === 'admin' && isAdmin && (
            <div className="bg-surface rounded-2xl shadow-lg p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl border">
                  <h3 className="font-bold mb-2">Sincronización API</h3>
                  <button onClick={handleSyncMatches} disabled={syncing} className="bg-fifa-green text-white px-4 py-2 rounded w-full">Sincronizar Partidos</button>
                  {syncMessage && <p className="text-xs mt-2">{syncMessage}</p>}
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border">
                  <h3 className="font-bold mb-2">Puntuaciones Manual</h3>
                  <button onClick={handleRecalculateRankings} disabled={calculating} className="bg-accent text-text-primary px-4 py-2 rounded w-full font-bold">Calcular Puntos ahora</button>
                  {calcMessage && <p className="text-xs mt-2">{calcMessage}</p>}
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-text-primary">Mi Contraseña</h3>
                  <p className="text-sm text-text-secondary">Cambia tu contraseña de administrador de forma segura</p>
                </div>
                <button onClick={() => setShowChangePasswordModal(true)} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-fifa-blue transition-colors flex items-center gap-2 text-sm font-semibold"><Edit3 className="w-4 h-4" /> Cambiar Contraseña</button>
              </div>

              <div className="p-4 bg-gray-50 border rounded-xl">
                <h3 className="font-bold mb-4">Crear Participante</h3>
                <div className="flex gap-2">
                  <input type="text" placeholder="Usuario" value={newUsername} onChange={e => setNewUsername(e.target.value)} className="border p-2 rounded flex-1" />
                  <input type="password" placeholder="Clave temporal" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="border p-2 rounded flex-1" />
                  <button onClick={handleCreateUser} className="bg-primary text-white px-4 py-2 rounded">Añadir</button>
                </div>
                {userError && <p className="text-red-600 text-xs mt-2">{userError}</p>}
              </div>

              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-100 text-xs font-bold">
                    <tr><th className="p-3">Usuario</th><th className="p-3">Puntos</th><th className="p-3">Acciones</th></tr>
                  </thead>
                  <tbody className="text-sm divide-y">
                    {users.map(u => (
                      <tr key={u.username}>
                        <td className="p-3">{u.username}</td>
                        <td className="p-3 font-bold">{u.points || 0}</td>
                        <td className="p-3 flex gap-2">
                          <button onClick={() => handleResetPassword(u.username)} className="text-blue-600 underline">Reset</button>
                          <button onClick={() => handleDeleteUser(u.username)} className="text-red-600 underline">Eliminar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'admin-manual' && isAdmin && (
            <div className="bg-surface rounded-2xl shadow-lg p-6 space-y-6">
              <div className="border-b pb-4">
                <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                  <Shield className="w-5 h-5 text-fifa-red" />
                  Panel de Gestión de Predicciones Manuales
                </h2>
                <p className="text-sm text-text-secondary mt-1">
                  Registra o altera marcadores en nombre de cualquier participante saltándote las restricciones de tiempo regulado.
                </p>
              </div>

              {manualMessage && (
                <div className={`p-4 rounded-xl text-sm font-semibold border ${manualMessage.includes('✅') ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                  {manualMessage}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-xl border border-gray-200">
                <div>
                  <label className="block text-sm font-bold text-text-primary mb-2">1. Seleccionar Participante</label>
                  <select 
                    value={manualTargetUser}
                    onChange={(e) => setManualTargetUser(e.target.value)}
                    className="w-full bg-white p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary font-medium"
                  >
                    <option value="">-- Elige un usuario --</option>
                    {users.map(u => (
                      <option key={u.username} value={u.username}>{u.username} ({u.points || 0} pts)</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-text-primary mb-2">2. Seleccionar Partido (No Empezados)</label>
                  <select
                    value={manualTargetMatch}
                    onChange={(e) => setManualTargetMatch(e.target.value)}
                    className="w-full bg-white p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-primary font-medium"
                  >
                    <option value="">-- Elige un enfrentamiento --</option>
                    {matches.filter(m => m.status === 'upcoming').map(m => (
                      <option key={m.id} value={m.id}>
                        [{getPhaseName(m.phase)}] {m.home_team} vs {m.away_team}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2 flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-xl shadow-inner">
                  <label className="block text-sm font-bold text-text-primary mb-3">3. Período de Marcador de la Predicción</label>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <span className="text-xs block font-semibold mb-1 text-text-secondary">Goles Local</span>
                      <input 
                        type="number" min="0" value={manualHomeScore} 
                        onChange={(e) => setManualHomeScore(parseInt(e.target.value) || 0)} 
                        className="w-16 h-12 text-center text-2xl font-bold border-2 border-primary rounded-xl outline-none focus:ring-2"
                      />
                    </div>
                    <span className="text-2xl font-bold text-gray-400 mt-4">-</span>
                    <div className="text-center">
                      <span className="text-xs block font-semibold mb-1 text-text-secondary">Goles Visitante</span>
                      <input 
                        type="number" min="0" value={manualAwayScore} 
                        onChange={(e) => setManualAwayScore(parseInt(e.target.value) || 0)} 
                        className="w-16 h-12 text-center text-2xl font-bold border-2 border-primary rounded-xl outline-none focus:ring-2"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveAdminManualPrediction}
                className="w-full bg-primary hover:bg-fifa-blue text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                Guardar Predicción Manual Forzada
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />

      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Resetear Contraseña de {selectedUser}</h3>
            <input type="password" value={newTempPassword} onChange={e => setNewTempPassword(e.target.value)} className="w-full border p-2 rounded mb-4" placeholder="Mínimo 6 caracteres" />
            <div className="flex gap-2"><button onClick={() => setShowResetModal(false)} className="border px-4 py-2 rounded flex-1">Cancelar</button><button onClick={handleConfirmResetPassword} className="bg-primary text-white px-4 py-2 rounded flex-1">Confirmar</button></div>
          </div>
        </div>
      )}

      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Cambiar mi Contraseña</h3>
            <input type="password" placeholder="Contraseña Actual" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full border p-2 rounded mb-3" />
            <input type="password" placeholder="Nueva Contraseña" value={newPasswordAdmin} onChange={e => setNewPasswordAdmin(e.target.value)} className="w-full border p-2 rounded mb-3" />
            <input type="password" placeholder="Confirmar Nueva Contraseña" value={confirmPasswordAdmin} onChange={e => setConfirmPasswordAdmin(e.target.value)} className="w-full border p-2 rounded mb-4" />
            <div className="flex gap-2">
              <button onClick={() => setShowChangePasswordModal(false)} className="border px-4 py-2 rounded flex-1">Cancelar</button>
              <button onClick={handleChangeOwnPassword} className="bg-primary text-white px-4 py-2 rounded flex-1">Actualizar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}