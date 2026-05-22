import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useCategories() {
  const [incomeCategories, setIncomeCategories] = useState([])
  const [expenseCategories, setExpenseCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCategories()
  }, [])

  async function fetchCategories() {
    setLoading(true)
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')

    if (!error && data) {
      setIncomeCategories(data.filter(c => c.type === 'income'))
      setExpenseCategories(data.filter(c => c.type === 'expense'))
    }
    setLoading(false)
  }

  async function addCategory(name, type) {
    const { data, error } = await supabase
      .from('categories')
      .insert({ name, type })
      .select()
      .single()

    if (error) throw error
    if (type === 'income') setIncomeCategories(prev => [...prev, data])
    else setExpenseCategories(prev => [...prev, data])
    return data
  }

  async function deleteCategory(id) {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) throw error
    setIncomeCategories(prev => prev.filter(c => c.id !== id))
    setExpenseCategories(prev => prev.filter(c => c.id !== id))
  }

  return {
    incomeCategories,
    expenseCategories,
    loading,
    addCategory,
    deleteCategory,
    refetch: fetchCategories,
  }
}
