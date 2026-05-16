import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dxuyhlgawgowrwrusskr.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4dXlobGdhd2dvd3J3cnVzc2tyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MTMyNDYsImV4cCI6MjA5NDQ4OTI0Nn0.jC5a2j1iY1IY_vlB0SHvCKO4V7hkrxUGHLyh_Ifl4hw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Funciones de ayuda para usuarios
export async function getUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('points', { ascending: false })
  return { data, error }
}

export async function createUser(username: string, password: string, isAdmin: boolean = false) {
  const { data, error } = await supabase
    .from('users')
    .insert({
      username,
      password,
      is_admin: isAdmin,
      must_change_password: true,
      points: 0
    })
    .select()
  return { data, error }
}

export async function getUser(username: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single()
  return { data, error }
}

export async function updateUser(username: string, updates: any) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('username', username)
    .select()
  return { data, error }
}

export async function deleteUser(username: string) {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('username', username)
  return { error }
}

// Funciones de ayuda para predicciones
export async function savePrediction(userId: string, matchId: string, homeScore: number, awayScore: number) {
  const { data, error } = await supabase
    .from('predictions')
    .upsert({
      user_id: userId,
      match_id: matchId,
      home_score: homeScore,
      away_score: awayScore
    }, {
      onConflict: 'user_id,match_id'
    })
    .select()
  return { data, error }
}

export async function getUserPredictions(userId: string) {
  const { data, error } = await supabase
    .from('predictions')
    .select('*')
    .eq('user_id', userId)
  return { data, error }
}

// Funciones de ayuda para partidos
export async function getMatches() {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .order('match_date', { ascending: true })
  return { data, error }
}

export async function getMatch(matchId: string) {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .single()
  return { data, error }
}

// Funciones de ayuda para ranking
export async function getRanking() {
  const { data, error } = await supabase
    .from('users')
    .select('username, points')
    .order('points', { ascending: false })
  return { data, error }
}

export async function updateUserPoints(username: string, points: number) {
  const { data, error } = await supabase
    .from('users')
    .update({ points })
    .eq('username', username)
    .select()
  return { data, error }
}