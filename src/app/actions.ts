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
    .order('points', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function updatePassword(username: string, newPassword: string) {
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

  const { error } = await supabaseAdmin
    .from('users')
    .delete()
    .eq('username', username)

  if (error) throw new Error(error.message)
  return true
}

export async function resetPassword(username: string, tempPassword: string) {
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

  for (const pred of predictions) {
    const match = pred.matches
    if (!match || match.status !== 'finished') continue

    let points = 0

    const actualResult = match.home_score > match.away_score ? 'home' :
                         match.home_score < match.away_score ? 'away' : 'draw'
    const predictedResult = pred.home_score > pred.away_score ? 'home' :
                           pred.home_score < pred.away_score ? 'away' : 'draw'

    if (actualResult === predictedResult) points += 5
    if (pred.home_score === match.home_score) points += 3
    else if (Math.abs(pred.home_score - match.home_score) === 1) points += 1
    if (pred.away_score === match.away_score) points += 3
    else if (Math.abs(pred.away_score - match.away_score) === 1) points += 1

    const multipliers: Record<string, number> = {
      'groups': 1,
      'round32': 1,      // Dieciseisavos mismo multiplicador que grupos (o ajusta si quieres x2)
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
      // ⭐ USAMOS EL MAPPER MEJORADO QUE CORRIGE POR FECHA SI ES NECESARIO ⭐
      const correctedPhase = mapPhaseWithCorrection(match)
      
      const matchData = {
        home_team: match.homeTeam?.name || 'Por definir',
        away_team: match.awayTeam?.name || 'Por definir',
        match_date: match.utcDate,
        phase: correctedPhase,  // ← Fase corregida (dieciseisavos, octavos, etc.)
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

    return { success: true, count: matches.length }
  } catch (err: any) {
    throw new Error('Error actualizando: ' + err.message)
  }
}

// ==================== FUNCIONES AUXILIARES MEJORADAS ====================

/**
 * Mapea la fase de la API a nuestro slug interno
 * PRIORIDAD:
 * 1. Si la API ya tiene una fase eliminatoria correcta (ROUND_OF_16, QUARTER_FINALS, etc.) la usamos
 * 2. Si no, usamos el fixMatchPhase que corrige por fecha según el calendario FIFA 2026
 */
function mapPhaseWithCorrection(match: any): string {
  const apiStage = match.stage
  
  // Caso 1: La API ya nos dice explícitamente que es una fase eliminatoria
  // Esto incluirá ROUND_OF_32, ROUND_OF_16, QUARTER_FINALS, etc. cuando lo implementen
  if (apiStage && apiStage !== 'GROUP_STAGE') {
    const directPhase = mapKnownPhase(apiStage)
    if (directPhase !== 'groups') {
      // Si la API ya sabe que no es fase de grupos, usamos lo que diga
      return directPhase
    }
  }
  
  // Caso 2: La API dice GROUP_STAGE o no tiene fase clara
  // Usamos nuestro mapper basado en fechas del calendario FIFA 2026
  return fixMatchPhase({
    stage: apiStage,
    phase: match.phase,
    utcDate: match.utcDate
  })
}

/**
 * Mapea las fases conocidas de football-data.org a nuestros slugs
 * Incluye ROUND_OF_32 para cuando la API lo implemente
 */
function mapKnownPhase(stage: string): string {
  const phaseMap: Record<string, string> = {
    'GROUP_STAGE': 'groups',
    'ROUND_OF_32': 'round32',      // Dieciseisavos (cuando lo añadan)
    'ROUND_OF_16': 'round16',      // Octavos
    'QUARTER_FINALS': 'quarterfinals',
    'SEMI_FINALS': 'semifinals',
    'FINAL': 'final',
    'THIRD_PLACE': 'thirdplace'
  }
  return phaseMap[stage] || 'groups'
}

// Mantenemos la función antigua por compatibilidad (aunque ya no se usa directamente)
function mapPhase(stage: string): string {
  return mapKnownPhase(stage)
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