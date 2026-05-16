'use server'

import { supabaseAdmin } from '@/lib/supabase/admin'

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