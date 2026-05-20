'use server'

import { supabaseAdmin } from '@/lib/supabase/admin'
import { fixMatchPhase } from '@/lib/utils/matchPhaseMapper'

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
    .neq('username', 'admin')  // ← FILTRA: EXCLUYE al usuario 'admin'
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

  if (error) {
    console.error('Error eliminando usuario:', error)
    throw new Error('Error al eliminar usuario: ' + error.message)
  }

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

export async function updateMatchResult(
  matchId: string,
  homeScore: number,
  awayScore: number
) {
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

  // Recalcular de forma automática tras modificar un partido
  await recalculateAllRankings()

  return data
}

// ==================== PREDICCIONES ====================

export async function createPrediction(
  userId: string,
  matchId: string,
  homeScore: number,
  awayScore: number
) {
  const { data: match } = await supabaseAdmin
    .from('matches')
    .select('status')
    .eq('id', matchId)
    .single()

  if (!match || match.status !== 'upcoming') {
    throw new Error('No se pueden hacer predicciones en partidos finalizados')
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
      matches (
        home_team,
        away_team,
        home_score,
        away_score,
        phase,
        match_date,
        status
      )
    `)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
  return data
}

export async function getAllPredictions() {
  const { data, error } = await supabaseAdmin
    .from('predictions')
    .select(`
      *,
      users (username),
      matches (*)
    `)

  if (error) throw new Error(error.message)
  return data
}

const PHASE_REVEAL_DATES: Record<string, string> = {
  groups:        '2026-06-11T00:00:00Z',
  Dieciseisavos: '2026-06-28T00:00:00Z',
  round16:       '2026-07-04T00:00:00Z',
  quarterfinals: '2026-07-09T00:00:00Z',
  semifinals:    '2026-07-14T00:00:00Z',
  thirdplace:    '2026-07-18T00:00:00Z',
  final:         '2026-07-19T00:00:00Z',
}

export async function getVisiblePredictionsForPhase(requestingUser: string, phase: string) {
  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('is_admin')
    .eq('username', requestingUser)
    .single()

  const isAdmin = userData?.is_admin ?? false

  const revealDate = PHASE_REVEAL_DATES[phase]
  const phaseVisible = !revealDate || new Date() >= new Date(revealDate)

  let query = supabaseAdmin
    .from('predictions')
    .select(`
      *,
      users (username),
      matches!inner (
        id, home_team, away_team, match_date, phase,
        home_score, away_score, status
      )
    `)
    .eq('matches.phase', phase)

  if (!phaseVisible && !isAdmin) {
    query = query.eq('user_id', requestingUser)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  return {
    data,
    phaseVisible,
    revealDate: revealDate ?? null,
  }
}

// ==================== RANKING ====================

export async function getRankings() {
  const { data, error } = await supabaseAdmin
    .from('rankings')
    .select(`
      *,
      users (
        username
      )
    `)
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
    console.error('Error recalculando rankings globales:', error)
    throw new Error('Error al actualizar rankings: ' + error.message)
  }
}

export async function calculateUserPoints(userId: string) {
  const { data: predictions } = await supabaseAdmin
    .from('predictions')
    .select(`
      *,
      matches (*)
    `)
    .eq('user_id', userId)

  if (!predictions) return 0

  let totalPoints = 0

  // Mapeo secuencial para calcular la distancia de saltos del 1X2 (1 = Local, 2 = Empate, 3 = Visitante)
  const signValueMap: Record<string, number> = {
    'home': 1,
    'draw': 2,
    'away': 3
  }

  for (const pred of predictions) {
    const match = pred.matches
    
    // Permitir cálculo en pruebas si hay datos de puntuación
    if (!match || match.home_score === null || match.away_score === null) continue

    let points = 0

    // 1. Determinar el signo real y el signo predicho
    const actualResult = match.home_score > match.away_score ? 'home' :
                         match.home_score < match.away_score ? 'away' : 'draw'
    const predictedResult = pred.home_score > pred.away_score ? 'home' :
                           pred.home_score < pred.away_score ? 'away' : 'draw'

    // 2. Calcular la distancia de saltos en base a la quiniela (1 - X - 2)
    const actualVal = signValueMap[actualResult]
    const predictedVal = signValueMap[predictedResult]
    const jumpDistance = Math.abs(actualVal - predictedVal)

    if (jumpDistance === 0) {
      points += 5 // Resultado Exacto (1X2)
    } else if (jumpDistance === 1) {
      points += 2 // CORREGIDO: Cercano al Resultado (1X2) -> Exactamente 1 salto de distancia
    }

    // 3. Reglas de goles por equipo (Se mantienen intactas sin tocar)
    if (pred.home_score === match.home_score) points += 3
    else if (Math.abs(pred.home_score - match.home_score) === 1) points += 1

    if (pred.away_score === match.away_score) points += 3
    else if (Math.abs(pred.away_score - match.away_score) === 1) points += 1

    // 4. Multiplicadores por fase
    const multipliers: Record<string, number> = {
      'groups': 1,
      'Dieciseisavos': 2,
      'round16': 2,
      'quarterfinals': 3,
      'semifinals': 4,
      'final': 5,
      'thirdplace': 4
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

// ==================== FOOTBALL-DATA.ORG API ====================

export async function syncMatchesFromAPI() {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY

  if (!apiKey) {
    throw new Error('FOOTBALL_DATA_API_KEY no configurada. Obtén una gratis en football-data.org')
  }

  try {
    const response = await fetch('https://api.football-data.org/v4/competitions/WC/matches', {
      headers: {
        'X-Auth-Token': apiKey
      }
    })

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('API Key inválida o sin acceso al Mundial 2026')
      }
      throw new Error(`Error API: ${response.status}`)
    }

    const data = await response.json()
    const matches = data.matches || []

    let inserted = 0
    let updated = 0

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
        await supabaseAdmin
          .from('matches')
          .update(matchData)
          .eq('id', existing.id)
        updated++
      } else {
        await supabaseAdmin
          .from('matches')
          .insert([matchData])
        inserted++
      }
    }

    if (inserted > 0 || updated > 0) {
      await recalculateAllRankings()
    }

    return {
      success: true,
      total: matches.length,
      inserted,
      updated
    }
  } catch (err: any) {
    throw new Error('Error sincronizando: ' + err.message)
  }
}

export async function updateLiveScores() {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY

  if (!apiKey) {
    throw new Error('FOOTBALL_DATA_API_KEY no configurada')
  }

  try {
    const response = await fetch('https://api.football-data.org/v4/competitions/WC/matches?status=LIVE,FINISHED', {
      headers: {
        'X-Auth-Token': apiKey
      }
    })

    if (!response.ok) {
      throw new Error(`Error API: ${response.status}`)
    }

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

    if (matches.length > 0) {
      await recalculateAllRankings()
    }

    return { success: true, count: matches.length }
  } catch (err: any) {
    throw new Error('Error actualizando: ' + err.message)
  }
}

// ==================== COPIA DE SEGURIDAD DE PREDICCIONES ====================

export async function createPredictionBackup() {
  try {
    const { data: predictions, error } = await supabaseAdmin
      .from('predictions')
      .select(`
        id,
        home_score,
        away_score,
        points,
        users (username),
        matches (
          id,
          home_team,
          away_team,
          match_date,
          phase,
          home_score,
          away_score,
          status
        )
      `)

    if (error) throw error

    const backupData = {
      created_at: new Date().toISOString(),
      total_predictions: predictions?.length || 0,
      predictions: predictions?.map((p: any) => ({
        prediction_id: p.id,
        user_id: p.users?.username,
        match_id: p.matches?.id,
        home_team: p.matches?.home_team,
        away_team: p.matches?.away_team,
        predicted_home: p.home_score,
        predicted_away: p.away_score,
        actual_home: p.matches?.home_score,
        actual_away: p.matches?.away_score,
        points_earned: p.points,
        match_status: p.matches?.status,
        match_date: p.matches?.match_date,
        phase: p.matches?.phase
      })) || []
    }

    const { data: backup, error: insertError } = await supabaseAdmin
      .from('prediction_backups')
      .insert([{
        backup_data: backupData,
        backup_type: 'auto'
      }])
      .select()

    if (insertError) throw insertError

    await supabaseAdmin.rpc('cleanup_old_backups')

    return { 
      success: true, 
      backup: backup?.[0],
      message: `Backup creado: ${backupData.total_predictions} predicciones guardadas`
    }
  } catch (error: any) {
    console.error('Error creando backup:', error)
    throw new Error('Error al crear backup: ' + error.message)
  }
}

export async function getLatestBackup() {
  try {
    const { data, error } = await supabaseAdmin
      .from('prediction_backups')
      .select('*')
      .order('backup_date', { ascending: false })
      .limit(1)
      .single()

    if (error) throw error
    return { success: true, backup: data }
  } catch (error: any) {
    if (error.message?.includes('no rows')) {
      return { success: false, message: 'No hay backups disponibles' }
    }
    throw new Error('Error al obtener backup: ' + error.message)
  }
}

export async function getAllBackups() {
  try {
    const { data, error } = await supabaseAdmin
      .from('prediction_backups')
      .select('*')
      .order('backup_date', { ascending: false })
      .limit(3)

    if (error) throw error
    return { success: true, backups: data }
  } catch (error: any) {
    throw new Error('Error al obtener backups: ' + error.message)
  }
}

export async function restorePredictionBackup(backupId: number) {
  try {
    const { data: backup, error: fetchError } = await supabaseAdmin
      .from('prediction_backups')
      .select('*')
      .eq('id', backupId)
      .single()

    if (fetchError) throw fetchError

    const backupData = backup.backup_data
    let restored = 0
    let failed = 0

    for (const pred of backupData.predictions) {
      const { data: match } = await supabaseAdmin
        .from('matches')
        .select('id, status')
        .eq('id', pred.match_id)
        .single()

      if (!match || match.status === 'finished') {
        continue
      }

      const { error: upsertError } = await supabaseAdmin
        .from('predictions')
        .upsert({
          user_id: pred.user_id,
          match_id: pred.match_id,
          home_score: pred.predicted_home,
          away_score: pred.predicted_away,
          points: 0
        }, { onConflict: 'user_id,match_id' })

      if (upsertError) {
        failed++
      } else {
        restored++
      }
    }

    return {
      success: true,
      restored,
      failed,
      message: `Restauradas ${restored} predicciones, ${failed} fallidas`
    }
  } catch (error: any) {
    throw new Error('Error al restaurar backup: ' + error.message)
  }
}

export async function scheduledBackup() {
  'use server'
  
  console.log('🔄 Ejecutando backup programado...', new Date().toISOString())
  
  try {
    const result = await createPredictionBackup()
    console.log('✅ Backup completado:', result.message)
    return result
  } catch (error: any) {
    console.error('❌ Error en backup programado:', error.message)
    return { success: false, error: error.message }
  }
}

// ==================== FUNCIONES AUXILIARES ====================

function mapPhaseWithCorrection(match: any): string {
  const apiStage = match.stage
  
  if (apiStage && apiStage !== 'GROUP_STAGE') {
    const directPhase = mapKnownPhase(apiStage)
    if (directPhase !== 'groups') {
      return directPhase
    }
  }
  
  return fixMatchPhase({
    stage: apiStage,
    phase: match.phase,
    utcDate: match.utcDate
  })
}

function mapKnownPhase(stage: string): string {
  const phaseMap: Record<string, string> = {
    'GROUP_STAGE': 'groups',
    'ROUND_OF_32': 'Dieciseisavos',
    'ROUND_OF_16': 'round16',
    'QUARTER_FINALS': 'quarterfinals',
    'SEMI_FINALS': 'semifinals',
    'FINAL': 'final',
    'THIRD_PLACE': 'thirdplace'
  }
  return phaseMap[stage] || 'groups'
}

function mapStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'SCHEDULED': 'upcoming',
    'TIMED': 'upcoming',
    'IN_PLAY': 'live',
    'PAUSED': 'live',
    'FINISHED': 'finished',
    'POSTPONED': 'upcoming',
    'CANCELLED': 'upcoming',
    'SUSPENDED': 'upcoming'
  }
  return statusMap[status] || 'upcoming'
}