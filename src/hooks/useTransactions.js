import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useTransactions() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetchTransactions()
  }, [user])

  async function fetchTransactions() {
    setLoading(true)
    const { data, error } = await supabase
      .from('transactions')
      .select('*, financing_instruments(name)')
      .eq('user_id', user.id)
      .order('date', { ascending: false })

    if (!error) setTransactions(data)
    setLoading(false)
  }

  async function addTransaction(transaction) {
    const { data, error } = await supabase
      .from('transactions')
      .insert({ ...transaction, user_id: user.id })
      .select('*, financing_instruments(name)')
      .single()

    if (error) throw error
    setTransactions((prev) => [data, ...prev])
    return data
  }

  async function updateTransaction(id, updates) {
    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select('*, financing_instruments(name)')
      .single()

    if (error) throw error
    setTransactions((prev) => prev.map(t => t.id === id ? data : t))
    return data
  }

  async function deleteTransaction(id) {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)

    if (error) throw error
    setTransactions((prev) => prev.filter((t) => t.id !== id))
  }

  return { transactions, loading, addTransaction, updateTransaction, deleteTransaction, refetch: fetchTransactions }
}
