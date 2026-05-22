import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useInstruments() {
  const { user } = useAuth()
  const [instruments, setInstruments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetchInstruments()
  }, [user])

  async function fetchInstruments() {
    setLoading(true)
    const { data, error } = await supabase
      .from('financing_instruments')
      .select('*')
      .eq('user_id', user.id)
      .order('name')

    if (!error) setInstruments(data)
    setLoading(false)
  }

  async function addInstrument(name) {
    const { data, error } = await supabase
      .from('financing_instruments')
      .insert({ name, user_id: user.id })
      .select()
      .single()

    if (error) throw error
    setInstruments(prev => [...prev, data])
    return data
  }

  async function deleteInstrument(id) {
    const { error } = await supabase
      .from('financing_instruments')
      .delete()
      .eq('id', id)

    if (error) throw error
    setInstruments(prev => prev.filter(i => i.id !== id))
  }

  return {
    instruments,
    loading,
    addInstrument,
    deleteInstrument,
    refetch: fetchInstruments,
  }
}
