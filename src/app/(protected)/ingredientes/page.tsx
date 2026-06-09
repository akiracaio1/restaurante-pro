'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

type Ingredient = {
  id: number
  user_id: number
  name: string
  unit: string
  unit_cost: number
  min_stock: number
  purchase_unit: string | null
  purchase_quantity: number | null
  purchase_cost: number | null
  yield_percentage: number | null
  reduction_stages: string | null
  processing_cost_per_unit: number | null
  processing_cost_per_batch: number | null
  processing_batch_size: number | null
}

type IngredientForm = Omit<Ingredient, 'id' | 'user_id'>

const EMPTY_FORM: IngredientForm = {
  name: '',
  unit: '',
  unit_cost: 0,
  min_stock: 0,
  purchase_unit: '',
  purchase_quantity: null,
  purchase_cost: null,
  yield_percentage: 100,
  reduction_stages: null,
  processing_cost_per_unit: null,
  processing_cost_per_batch: null,
  processing_batch_size: null,
}

const UNITS = ['kg', 'g', 'L', 'ml', 'unidade', 'caixa', 'pacote', 'saco', 'fatia']

function fmt(value: number | null | undefined, decimals = 4): string {
  if (value == null) return '-'
  return value.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function fmtCurrency(value: number | null | undefined): string {
  if (value == null) return '-'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [filtered, setFiltered] = useState<Ingredient[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Ingredient | null>(null)
  const [form, setForm] = useState<IngredientForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Ingredient | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile, error: profileError } = await supabase
        .from('users').select('id').eq('auth_id', user.id).single()
      if (profileError || !profile) {
        setError('Usuario nao encontrado.')
        setLoading(false)
        return
      }
      setUserId(profile.id)
    }
    init()
  }, [])

  const fetchIngredients = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data, error: fetchError } = await supabase
      .from('ingredients').select('*').eq('user_id', userId).order('name')
    if (fetchError) setError(fetchError.message)
    else setIngredients(data ?? [])
    setLoading(false)
  }, [userId])

  useEffect(() => { if (userId) fetchIngredients() }, [userId, fetchIngredients])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(q ? ingredients.filter(i => i.name.toLowerCase().includes(q)) : ingredients)
  }, [search, ingredients])

  function openCreate() {
    setEditTarget(null); setForm(EMPTY_FORM); setFormError(null); setShowAdvanced(false); setModalOpen(true)
  }

  function openEdit(ing: Ingredient) {
    setEditTarget(ing)
    const { id: _, user_id: __, ...rest } = ing
    setForm(rest); setFormError(null)
    setShowAdvanced(!!(ing.processing_cost_per_unit || ing.processing_cost_per_batch))
    setModalOpen(true)
  }

  function closeModal() { setModalOpen(false); setEditTarget(null) }

  function updateForm(field: keyof IngredientForm, raw: string) {
    const nums: (keyof IngredientForm)[] = ['unit_cost','min_stock','purchase_quantity','purchase_cost','yield_percentage','processing_cost_per_unit','processing_cost_per_batch','processing_batch_size']
    setForm(prev => ({ ...prev, [field]: nums.includes(field) ? (raw === '' ? null : parseFloat(raw)) : raw }))
  }

  async function handleSave() {
    if (!userId) return
    setFormError(null)
    if (!form.name.trim()) return setFormError('Nome e obrigatorio.')
    if (!form.unit.trim()) return setFormError('Unidade e obrigatoria.')
    setSaving(true)
    const payload = { ...form, user_id: userId }
    const { error: e } = editTarget
      ? await supabase.from('ingredients').update(payload).eq('id', editTarget.id)
      : await supabase.from('ingredients').insert(payload)
    setSaving(false)
    if (e) setFormError(e.message)
    else { closeModal(); fetchIngredients() }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const { error: e } = await supabase.from('ingredients').delete().eq('id', deleteTarget.id)
    setDeleting(false)
    if (e) alert('Erro: ' + e.message)
    else { setDeleteTarget(null); fetchIngredients() }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ingredientes</h1>
            <p className="text-sm text-gray-500 mt-0.5">{ingredients.length} ingrediente{ingredients.length !== 1 ? 's' : ''} cadastrado{ingredients.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={openCreate} className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Novo Ingrediente
          </button>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="relative mb-6 max-w-sm">
          <input type="text" placeholder="Buscar ingrediente..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-4 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white" />
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <svg className="animate-spin w-6 h-6 mr-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            Carregando...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="font-medium">{search ? 'Nenhum resultado' : 'Nenhum ingrediente cadastrado'}</p>
            {!search && <button onClick={openCreate} className="mt-3 text-emerald-600 hover:underline text-sm">Cadastrar primeiro ingrediente</button>}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Nome</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Unidade</th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase px-4 py-3">Custo/Unid.</th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase px-4 py-3">Yield %</th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase px-4 py-3">Custo Real</th>
                    <th className="text-right text-xs font-semibold text-gray-500 uppercase px-4 py-3">Estoque Min.</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(ing => {
                    const y = ing.yield_percentage ?? 100
                    const realCost = y > 0 ? ing.unit_cost / (y / 100) : ing.unit_cost
                    return (
                      <tr key={ing.id} className="hover:bg-gray-50 group">
                        <td className="px-5 py-3.5 font-medium text-gray-900">{ing.name}</td>
                        <td className="px-4 py-3.5"><span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded font-mono">{ing.unit}</span></td>
                        <td className="px-4 py-3.5 text-right font-mono text-xs text-gray-700">R$ {fmt(ing.unit_cost)}</td>
                        <td className="px-4 py-3.5 text-right"><span className={`text-xs font-medium ${y < 100 ? 'text-amber-600' : 'text-gray-400'}`}>{y}%</span></td>
                        <td className="px-4 py-3.5 text-right font-mono text-xs font-semibold text-emerald-700">R$ {fmt(realCost)}</td>
                        <td className="px-4 py-3.5 text-right font-mono text-xs text-gray-500">{fmt(ing.min_stock, 2)} {ing.unit}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 justify-end">
                            <button onClick={() => openEdit(ing)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button onClick={() => setDeleteTarget(ing)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-900">{editTarget ? 'Editar Ingrediente' : 'Novo Ingrediente'}</h2>
              <button onClick={closeModal} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {formError && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{formError}</div>}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                  <input type="text" value={form.name} onChange={e => updateForm('name', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unidade *</label>
                  <select value={form.unit} onChange={e => updateForm('unit', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                    <option value="">Selecione...</option>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Custo/Unidade (R$) *</label>
                  <input type="number" step="0.0001" min="0" value={form.unit_cost ?? ''} onChange={e => updateForm('unit_cost', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estoque Minimo</label>
                  <input type="number" step="0.01" min="0" value={form.min_stock ?? ''} onChange={e => updateForm('min_stock', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Yield %</label>
                  <input type="number" step="0.01" min="0" max="100" value={form.yield_percentage ?? ''} onChange={e => updateForm('yield_percentage', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unidade de Compra</label>
                  <input type="text" value={form.purchase_unit ?? ''} onChange={e => updateForm('purchase_unit', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Qtd por Embalagem</label>
                  <input type="number" step="0.001" min="0" value={form.purchase_quantity ?? ''} onChange={e => updateForm('purchase_quantity', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Custo Embalagem (R$)</label>
                  <input type="number" step="0.01" min="0" value={form.purchase_cost ?? ''} onChange={e => updateForm('purchase_cost', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
              <button onClick={closeModal} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2 rounded-lg">
                {saving ? 'Salvando...' : editTarget ? 'Salvar' : 'Criar Ingrediente'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">Excluir ingrediente?</h3>
            <p className="text-sm text-gray-500 mb-6"><strong>{deleteTarget.name}</strong> sera removido permanentemente.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
              <button onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-lg">
                {deleting ? 'Excluindo...' : 'Sim, excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}