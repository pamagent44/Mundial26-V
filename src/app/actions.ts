'use server'

import { supabaseAdmin } from '@/lib/supabase/admin'
import { fixMatchPhase, getMatchDeadline } from '@/lib/utils/matchPhaseMapper' // ← MODIFICADO

// ==================== USUARIOS ====================

export async function createUser(username: string, password: string, isAdmin = false) {
  if (!username || username.length < 3) {
    throw new Error('El usuario debe tener al menos 3 caracteres')
  }
  if (!password || password.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres')
  }

  const { data: existing } = await supabaseAdmin
    .from('users')
    .select('username')
    .eq('username', username)
    .single()

  if (existing) {
    throw new Error('El usuario ya existe')
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .insert([{
      username,
      password,
      is_admin: isAdmin,
      must_change_password: true,
      points: 0
    }])
    .select()

  if (error) throw new Error(error.message)
  return data
}

export async function loginUser(username: string, password: string) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('username', username)
    .eq('password', password)
    .single()

  if (error || !data) {
    throw new Error('Usuario o contraseña incorrectos')
  }
  return data
}

export async function getUsers() {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .neq('username', 'admin')
    .order('points', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function updatePassword(username: string, newPassword: string) {
  if (!newPassword || newPassword.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres')
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .update({ password: newPassword, must_change_password: false })
    .eq('username', username)
    .select()

  if (error) throw new Error(error.message)
  return data
}

export async function deleteUser(username: string) {
  if (username === 'admin') {
    throw new Error('No se puede eliminar el usuario admin')
  }

  const { data: user, error: findError } = await supabaseAdmin
    .from('users')
    .select('username')
    .eq('username', username)
    .single()

  if (findError || !user) {
    throw new Error('Usuario no encontrado')
  }

  const { error } = await supabaseAdmin
    .from('users')
    .delete()
    .eq('username', username)

  if (error) throw new Error('Error al eliminar usuario: ' + error.message)
  return { success: true, message: `Usuario ${username} eliminado correctamente` }
}

export async function resetPassword(username: string, tempPassword: string) {
  if (!tempPassword || tempPassword.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres')
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .update({ password: tempPassword, must_change_password: true })
    .eq('username', username)
    .select()

  if (error) throw new Error(error.message)
  return data
}

// ==================== PARTIDOS ====================

export async function getMatches() {
  const { data, error } = await supabaseAdmin
    .from('matches')
    .select('*')
    .order('match_date', { ascending: true })

  if (error) throw new Error(error.message)
  return data
}

export async function createMatch(
  homeTeam: string,
  awayTeam: string,
  matchDate: string,
  phase: string,
  groupName?: string
) {
  const { data, error } = await supabaseAdmin
    .from('matches')
    .insert([{
      home_team: homeTeam,
      away_team: awayTeam,
      match_date: matchDate,
      phase,
      group_name: groupName,
      status: 'upcoming'
    }])
    .select()

  if (error) throw new Error(error.message)
  return data
}

export async function updateMatchResult(matchId: string, homeScore: number, awayScore: number) {
  const { data, error } = await supabaseAdmin
    .from('matches')
    .update({
      home_score: homeScore,
      away_score: awayScore,
      status: 'finished'
    })
    .eq('id', matchId)
    .select()

  if (error) throw new Error(error.message)
  await recalculateAllRankings()
  return data
}

// ==================== PREDICCIONES ====================

export async function createPrediction(userId: string, matchId: string, homeScore: number, awayScore: number) {
  const { data: match } = await supabaseAdmin
    .from('matches')
    .select('status, match_date')
    .eq('id', matchId)
    .single()

  if (!match) throw new Error('Partido no encontrado')

  const deadline = getMatchDeadline(match.match_date)
  if (new Date() >= deadline) {
    throw new Error('El tiempo para realizar o editar predicciones sobre este partido ha expirado.')
  }

  if (match.status !== 'upcoming') {
    throw new Error('No se pueden hacer predicciones en partidos finalizados o en juego')
  }

  const { data: existing } = await supabaseAdmin
    .from('predictions')
    .select('id')
    .eq('user_id', userId)
    .eq('match_id', matchId)
    .single()

  if (existing) {
    const { data, error } = await supabaseAdmin
      .from('predictions')
      .update({ home_score: homeScore, away_score: awayScore })
      .eq('id', existing.id)
      .select()

    if (error) throw new Error(error.message)
    return data
  }

  const { data, error } = await supabaseAdmin
    .from('predictions')
    .insert([{
      user_id: userId,
      match_id: matchId,
      home_score: homeScore,
      away_score: awayScore,
      points: 0
    }])
    .select()

  if (error) throw new Error(error.message)
  return data
}

export async function getUserPredictions(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('predictions')
    .select(`
      *,
      matches ( home_team, away_team, home_score, away_score, phase, match_date, status )
    `)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
  return data
}

export async function getAllPredictions(requestingUser?: string) {
  const { data: userData } = requestingUser ? await supabaseAdmin
    .from('users')
    .select('is_admin')
    .eq('username', requestingUser)
    .single() : { data: null }

  const isAdmin = userData?.is_admin ?? false
  const now = new Date()

  const { data, error } = await supabaseAdmin
    .from('predictions')
    .select(`
      *,
      users (username),
      matches (*)
    `)
    .range(0, 10000)

  if (error) throw new Error(error.message)

  return data?.map((pred: any) => {
    if (isAdmin || !requestingUser || pred.user_id === requestingUser) {
      return pred
    }
    const matchDate = pred.matches?.match_date
    if (matchDate) {
      const deadline = getMatchDeadline(matchDate)
      if (now < deadline) {
        return {
          ...pred,
          home_score: -1, 
          away_score: -1,
          is_hidden_by_server: true
        }
      }
    }
    return pred
  }) || []
}

export async function getVisiblePredictionsForPhase(requestingUser: string, phase: string) {
  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('is_admin')
    .eq('username', requestingUser)
    .single()

  const isAdmin = userData?.is_admin ?? false
  const now = new Date()

  let query = supabaseAdmin
    .from('predictions')
    .select(`
      *,
      users (username),
      matches!inner ( id, home_team, away_team, match_date, phase, home_score, away_score, status )
    `)
    .eq('matches.phase', phase)

  const { data, error } = await query
  if (error) throw new Error(error.message)

  const processed = data?.map((pred: any) => {
    const deadline = getMatchDeadline(pred.matches.match_date)
    const isVisible = now >= deadline || isAdmin || pred.user_id === requestingUser
    if (!isVisible) {
      return { ...pred, home_score: -1, away_score: -1 }
    }
    return pred
  })

  return { data: processed, phaseVisible: true, revealDate: null }
}

// ==================== RANKING ====================

export async function getRankings() {
  const { data, error } = await supabaseAdmin
    .from('rankings')
    .select(`*, users ( username )`)
    .order('total_points', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function updateRanking(userId: string, totalPoints: number, predictionsCount: number) {
  const { data, error } = await supabaseAdmin
    .from('rankings')
    .upsert({
      user_id: userId,
      total_points: totalPoints,
      predictions_count: predictionsCount,
      updated_at: new Date().toISOString()
    })
    .select()

  if (error) throw new Error(error.message)
  return data
}

export async function recalculateAllRankings() {
  try {
    const { data: allUsers, error } = await supabaseAdmin
      .from('users')
      .select('username')

    if (error) throw error
    if (allUsers) {
      for (const user of allUsers) {
        await calculateUserPoints(user.username)
      }
    }
    return { success: true, message: 'Todos los rankings globales y puntos han sido actualizados con éxito.' }
  } catch (error: any) {
    throw new Error('Error al actualizar rankings: ' + error.message)
  }
}

export async function calculateUserPoints(userId: string) {
  const { data: predictions } = await supabaseAdmin
    .from('predictions')
    .select(`*, matches (*)`)
    .eq('user_id', userId)

  if (!predictions) return 0

  let totalPoints = 0
  const signValueMap: Record<string, number> = { 'home': 1, 'draw': 2, 'away': 3 }

  for (const pred of predictions) {
    const match = pred.matches
    if (!match || match.home_score === null || match.away_score === null) continue

    let points = 0
    const actualResult = match.home_score > match.away_score ? 'home' :
                         match.home_score < match.away_score ? 'away' : 'draw'
    const predictedResult = pred.home_score > pred.away_score ? 'home' :
                           pred.home_score < pred.away_score ? 'away' : 'draw'

    const actualVal = signValueMap[actualResult]
    const predictedVal = signValueMap[predictedResult]
    const jumpDistance = Math.abs(actualVal - predictedVal)

    if (jumpDistance === 0) points += 5
    else if (jumpDistance === 1) points += 2

    if (pred.home_score === match.home_score) points += 3
    else if (Math.abs(pred.home_score - match.home_score) === 1) points += 1

    if (pred.away_score === match.away_score) points += 3
    else if (Math.abs(pred.away_score - match.away_score) === 1) points += 1

    const multipliers: Record<string, number> = {
      'groups': 1, 'Dieciseisavos': 2, 'round16': 3, 'quarterfinals': 4, 'semifinals': 5, 'final': 6, 'thirdplace': 5
    }
    const multiplier = multipliers[match.phase as string] || 1
    totalPoints += points * multiplier

    await supabaseAdmin
      .from('predictions')
      .update({ points: points * multiplier })
      .eq('id', pred.id)
  }

  await supabaseAdmin
    .from('users')
    .update({ points: totalPoints })
    .eq('username', userId)

  return totalPoints
}

// ==================== SINCRO & BACKUPS ====================

export async function syncMatchesFromAPI() {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY
  if (!apiKey) throw new Error('FOOTBALL_DATA_API_KEY no configurada.')

  try {
    const response = await fetch('https://api.football-data.org/v4/competitions/WC/matches', {
      headers: { 'X-Auth-Token': apiKey }
    })
    if (!response.ok) throw new Error(`Error API: ${response.status}`)

    const data = await response.json()
    const matches = data.matches || []
    let inserted = 0, updated = 0

    for (const match of matches) {
      const correctedPhase = mapPhaseWithCorrection(match)
      const matchData = {
        home_team: match.homeTeam?.name || 'Por definir',
        away_team: match.awayTeam?.name || 'Por definir',
        match_date: match.utcDate,
        phase: correctedPhase,
        group_name: match.group?.replace('GROUP_', '') || null,
        home_score: match.score?.fullTime?.home,
        away_score: match.score?.fullTime?.away,
        status: mapStatus(match.status)
      }

      const { data: existing } = await supabaseAdmin
        .from('matches')
        .select('id')
        .eq('home_team', matchData.home_team)
        .eq('away_team', matchData.away_team)
        .eq('match_date', matchData.match_date)
        .single()

      if (existing) {
        await supabaseAdmin.from('matches').update(matchData).eq('id', existing.id)
        updated++
      } else {
        await supabaseAdmin.from('matches').insert([matchData])
        inserted++
      }
    }

    if (inserted > 0 || updated > 0) await recalculateAllRankings()
    return { success: true, total: matches.length, inserted, updated }
  } catch (err: any) {
    throw new Error('Error sincronizando: ' + err.message)
  }
}

export async function updateLiveScores() {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY
  if (!apiKey) throw new Error('FOOTBALL_DATA_API_KEY no configurada')

  try {
    const response = await fetch('https://api.football-data.org/v4/competitions/WC/matches?status=LIVE,FINISHED', {
      headers: { 'X-Auth-Token': apiKey }
    })
    if (!response.ok) throw new Error(`Error API: ${response.status}`)

    const data = await response.json()
    const matches = data.matches || []

    for (const match of matches) {
      const homeScore = match.score?.fullTime?.home
      const awayScore = match.score?.fullTime?.away
      if (homeScore !== null && awayScore !== null) {
        await supabaseAdmin
          .from('matches')
          .update({
            home_score: homeScore,
            away_score: awayScore,
            status: match.status === 'FINISHED' ? 'finished' : 'live'
          })
          .eq('home_team', match.homeTeam?.name)
          .eq('away_team', match.awayTeam?.name)
      }
    }

    if (matches.length > 0) await recalculateAllRankings()
    return { success: true, count: matches.length }
  } catch (err: any) {
    throw new Error('Error actualizando: ' + err.message)
  }
}

export async function createPredictionBackup() {
  try {
    const { data: predictions, error } = await supabaseAdmin
      .from('predictions')
      .select(`id, home_score, away_score, points, users (username), matches (*)`)

    if (error) throw error
    const backupData = {
      created_at: new Date().toISOString(),
      total_predictions: predictions?.length || 0,
      predictions: predictions?.map((p: any) => ({
        prediction_id: p.id, user_id: p.users?.username, match_id: p.matches?.id,
        home_team: p.matches?.home_team, away_team: p.matches?.away_team,
        predicted_home: p.home_score, predicted_away: p.away_score,
        actual_home: p.matches?.home_score, actual_away: p.matches?.away_score,
        points_earned: p.points, match_status: p.matches?.status, phase: p.matches?.phase
      }))
    }

    const { data: backup, error: insErr } = await supabaseAdmin
      .from('prediction_backups')
      .insert([{ backup_data: backupData, backup_type: 'auto' }]).select()

    if (insErr) throw insErr
    await supabaseAdmin.rpc('cleanup_old_backups')
    return { success: true, backup: backup?.[0], message: `Backup creado correctamente` }
  } catch (error: any) {
    throw new Error('Error al crear backup: ' + error.message)
  }
}

export async function getLatestBackup() {
  try {
    const { data, error } = await supabaseAdmin
      .from('prediction_backups').select('*').order('backup_date', { ascending: false }).limit(1).single()
    if (error) throw error
    return { success: true, backup: data }
  } catch (error: any) {
    return { success: false, message: 'No hay backups disponibles' }
  }
}

export async function getAllBackups() {
  try {
    const { data, error } = await supabaseAdmin
      .from('prediction_backups').select('*').order('backup_date', { ascending: false }).limit(3)
    if (error) throw error
    return { success: true, backups: data }
  } catch (error: any) {
    throw new Error(error.message)
  }
}

export async function restorePredictionBackup(backupId: number) {
  try {
    const { data: backup, error: fErr } = await supabaseAdmin
      .from('prediction_backups').select('*').eq('id', backupId).single()
    if (fErr) throw fErr

    const backupData = backup.backup_data
    let restored = 0, failed = 0

    for (const pred of backupData.predictions) {
      const { data: match } = await supabaseAdmin.from('matches').select('id, status').eq('id', pred.match_id).single()
      if (!match || match.status === 'finished') continue

      const { error: upErr } = await supabaseAdmin
        .from('predictions')
        .upsert({ user_id: pred.user_id, match_id: pred.match_id, home_score: pred.predicted_home, away_score: pred.predicted_away, points: 0 }, { onConflict: 'user_id,match_id' })

      if (upErr) failed++
      else restored++
    }
    return { success: true, restored, failed }
  } catch (error: any) {
    throw new Error('Error al restaurar backup: ' + error.message)
  }
}

export async function scheduledBackup() {
  try {
    return await createPredictionBackup()
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

function mapPhaseWithCorrection(match: any): string {
  const apiStage = match.stage
  if (apiStage && apiStage !== 'GROUP_STAGE') {
    const directPhase = mapKnownPhase(apiStage)
    if (directPhase !== 'groups') return directPhase
  }
  return fixMatchPhase({ stage: apiStage, phase: match.phase, utcDate: match.utcDate })
}

function mapKnownPhase(stage: string): string {
  const phaseMap: Record<string, string> = {
    'GROUP_STAGE': 'groups', 'ROUND_OF_32': 'Dieciseisavos', 'ROUND_OF_16': 'round16',
    'QUARTER_FINALS': 'quarterfinals', 'SEMI_FINALS': 'semifinals', 'FINAL': 'final', 'THIRD_PLACE': 'thirdplace'
  }
  return phaseMap[stage] || 'groups'
}

function mapStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'SCHEDULED': 'upcoming', 'TIMED': 'upcoming', 'IN_PLAY': 'live',
    'PAUSED': 'live', 'FINISHED': 'finished', 'POSTPONED': 'upcoming'
  }
  return statusMap[status] || 'upcoming'
}

// Añadir al final de tu archivo src/app/actions.ts

/**
 * NUEVA ACCIÓN DE SERVIDOR: Permite al administrador insertar o editar predicciones de un usuario de forma manual,
 * saltándose el bloqueo de tiempo del contador, pero validando que el partido no haya empezado todavía.
 */
export async function createAdminManualPrediction(
  adminUsername: string,
  targetUserId: string,
  matchId: string,
  homeScore: number,
  awayScore: number
) {
  // 1. Validar que quien invoca la acción sea realmente administrador
  const { data: adminUser } = await supabaseAdmin
    .from('users')
    .select('is_admin')
    .eq('username', adminUsername)
    .single()

  if (!adminUser || !adminUser.is_admin) {
    throw new Error('No autorizado. Solo los administradores pueden realizar esta acción.')
  }

  // 2. Validar que el partido no haya empezado o finalizado (status debe ser 'upcoming')
  const { data: match } = await supabaseAdmin
    .from('matches')
    .select('status')
    .eq('id', matchId)
    .single()

  if (!match) throw new Error('Partido no encontrado')
  if (match.status !== 'upcoming') {
    throw new Error('No se pueden modificar predicciones de partidos en juego o finalizados.')
  }

  // 3. Comprobar si ya existe un registro previo para actualizarlo o crear uno nuevo
  const { data: existing } = await supabaseAdmin
    .from('predictions')
    .select('id')
    .eq('user_id', targetUserId)
    .eq('match_id', matchId)
    .single()

  if (existing) {
    const { data, error } = await supabaseAdmin
      .from('predictions')
      .update({ home_score: homeScore, away_score: awayScore })
      .eq('id', existing.id)
      .select()

    if (error) throw new Error(error.message)
    return data
  }

  const { data, error } = await supabaseAdmin
    .from('predictions')
    .insert([{
      user_id: targetUserId,
      match_id: matchId,
      home_score: homeScore,
      away_score: awayScore,
      points: 0
    }])
    .select()

  if (error) throw new Error(error.message)
  return data
}
