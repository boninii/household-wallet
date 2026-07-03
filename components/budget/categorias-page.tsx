'use client'

import { useMemo, useState, useTransition } from 'react'

import { useRouter } from 'next/navigation'

import {
  Check,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X
} from 'lucide-react'

import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'

import { updateGoals } from '@/app/actions/budget'

import {
  archiveCategory,
  createCategory,
  updateCategory
} from '@/app/actions/categories'

import { COLOR_PRESETS, mergeWithAllocations } from '@/lib/categories'

import type { Category, MonthlyBudget } from '@/lib/types'

import { cn } from '@/lib/utils'

import { MonthBar } from '@/components/shell/month-bar'

import { Button } from '@/components/ui/button'

import { Card, CardHeader, CardTitle } from '@/components/ui/card'

import { Input, Label } from '@/components/ui/input'

import { Slider } from '@/components/ui/slider'

import { useConfirm } from '@/components/ui/confirm-provider'

import { PageHeader } from './page-header'

import { ColorPicker } from './color-picker'

type Props = {

  budget: MonthlyBudget

  categories: Category[]

  allocations: Record<string, number>

}

type Draft = {

  id: string

  slug: string

  label: string

  color: string

  pct: number

  is_saving: boolean

}

function firstUnusedColor(used: Set<string>): string {

  for (const c of COLOR_PRESETS) {

    if (!used.has(c)) {

      return c

    }

  }

  return COLOR_PRESETS[0]

}

export function CategoriasPage({ budget, categories, allocations }: Props) {

  const router = useRouter()

  const confirm = useConfirm()

  const initial_drafts: Draft[] = mergeWithAllocations(categories, allocations).map(
    (c) => ({
      id: c.id,
      slug: c.slug,
      label: c.label,
      color: c.color,
      pct: Number(c.pct || 0),
      is_saving: Boolean(c.is_saving)

    })

  )

  const [drafts, setDrafts] = useState<Draft[]>(initial_drafts)

  const [editing_id, setEditingId] = useState<string | null>(null)

  const [edit_label, setEditLabel] = useState('')

  const [edit_color, setEditColor] = useState(COLOR_PRESETS[0])

  const [edit_is_saving, setEditIsSaving] = useState(false)

  const [new_label, setNewLabel] = useState('')

  const [new_color, setNewColor] = useState(COLOR_PRESETS[0])

  const [show_add, setShowAdd] = useState(false)

  const [pending, startTransition] = useTransition()

  const [error, setError] = useState<string | null>(null)

  const [saved, setSaved] = useState(false)

  const used_colors = useMemo(() => drafts.map((d) => d.color), [drafts])

  const used_by_list = useMemo(

    () => drafts.map((d) => ({ color: d.color, label: d.label })),

    [drafts]

  )

  const total = useMemo(() => {

    return drafts.reduce((acc, d) => acc + Number(d.pct || 0), 0)
  }, [drafts])

  const chart_data = drafts.map((d) => ({
    name: d.label,
    value: d.pct,
    color: d.color

  }))

  function setPct(id: string, val: number) {

    setSaved(false)

    setDrafts((arr) =>

      arr.map((d) => (d.id === id ? { ...d, pct: val } : d))

    )

  }

  function zeroPct(id: string) {

    setPct(id, 0)

  }

  function startEdit(d: Draft) {

    setEditingId(d.id)

    setEditLabel(d.label)

    setEditColor(d.color)

    setEditIsSaving(d.is_saving)

  }

  function cancelEdit() {

    setEditingId(null)

  }

  function commitEdit() {

    if (!editing_id) {

      return

    }

    const id = editing_id

    const label = edit_label.trim()

    if (!label) {

      setError('Nome não pode ficar vazio.')

      return

    }

    setError(null)

    setDrafts((arr) =>

      arr.map((d) => (d.id === id ? { ...d, label, color: edit_color, is_saving: edit_is_saving } : d))

    )

    startTransition(async () => {

      try {

        await updateCategory(id, { label, color: edit_color, is_saving: edit_is_saving })

        setEditingId(null)

        router.refresh()

      } catch (err) {

        setError((err as Error).message)

      }

    })

  }

  async function handleArchive(id: string) {

    const ok = await confirm({
      title: 'Arquivar categoria',
      description: 'Os gastos existentes permanecem, mas a categoria some das telas.',
      confirm_label: 'Arquivar',
      danger: true

    })

    if (!ok) {

      return

    }

    startTransition(async () => {

      try {

        await archiveCategory(id)

        setDrafts((arr) => arr.filter((d) => d.id !== id))

        router.refresh()

      } catch (err) {

        setError((err as Error).message)

      }

    })

  }

  function toggleAdd() {

    if (show_add) {

      setShowAdd(false)

      return

    }

    setNewLabel('')

    setNewColor(firstUnusedColor(new Set(used_colors)))

    setError(null)

    setShowAdd(true)

  }

  function handleCreate() {

    setError(null)

    if (!new_label.trim()) {

      setError('Informe o nome da nova categoria.')

      return

    }

    startTransition(async () => {

      try {

        await createCategory({ label: new_label, color: new_color })

        setNewLabel('')

        setNewColor(firstUnusedColor(new Set([...used_colors, new_color])))

        setShowAdd(false)

        router.refresh()

      } catch (err) {

        setError((err as Error).message)

      }

    })

  }

  function handleSave() {

    setError(null)

    if (total > 100) {

      setError(`Soma de ${total.toFixed(0)}% excede 100%. Reduza algumas categorias antes de salvar.`)

      return

    }

    const payload: Record<string, number> = {}

    for (const d of drafts) {

      payload[d.id] = d.pct

    }

    startTransition(async () => {

      try {

        await updateGoals(budget.id, payload)

        setSaved(true)

        router.refresh()

      } catch (err) {

        setError((err as Error).message)

      }

    })

  }

  const exact_100 = Math.round(total) === 100

  const over_100 = total > 100

  const under_100 = total < 100

  const total_color = exact_100
    ? 'text-positive-soft'
    : over_100
    ? 'text-negative-soft'
    : 'text-brand'

  const status_label = exact_100
    ? 'distribuição completa'
    : over_100
    ? `excede em ${(total - 100).toFixed(0)}%`
    : `faltam ${(100 - total).toFixed(0)}%`

  return (
    <section className='flex flex-col gap-8'>

      <PageHeader
        title='Categorias'
        subtitle='Crie, renomeie ou arquive categorias e distribua o orçamento da sua renda entre elas. Pode salvar com menos de 100%, mas não acima.'
      />

      <MonthBar
        budget_id={budget.id}
        month={budget.month}
        year={budget.year}
        income={Number(budget.income)}
      />

      <div className='grid gap-6 lg:grid-cols-[1fr_1.5fr]'>

        <Card className='flex flex-col items-center gap-6'>

          <div className='text-center'>

            <p className={cn('text-3xl font-semibold tabular-nums', total_color)}>
              Total {total.toFixed(0)}%
            </p>

            <p className={cn('mt-1 text-xs uppercase tracking-wider', total_color)}>
              {status_label}
            </p>

          </div>

          <div className='h-[240px] w-full'>

            <ResponsiveContainer>

              <PieChart>

                <Pie
                  data={chart_data}
                  dataKey='value'
                  nameKey='name'
                  innerRadius={70}
                  outerRadius={110}
                  stroke='none'
                  paddingAngle={1.5}
                >
                  {chart_data.map((d, i) => (
                    <Cell key={i} fill={d.color} />

                  ))}
                </Pie>

              </PieChart>

            </ResponsiveContainer>

          </div>

          <ul className='grid w-full grid-cols-1 gap-2 text-sm sm:grid-cols-2'>

            {drafts.map((d) => (

              <li key={d.id} className='flex items-center gap-2 text-text-100'>

                <span
                  className='h-2.5 w-2.5 rounded-full shrink-0'
                  style={{ background: d.color }}
                />

                <span className='truncate'>{d.label}</span>

                <span className='ml-auto font-semibold' style={{ color: d.color }}>
                  {Number(d.pct).toFixed(0)}%
                </span>

              </li>

            ))}

          </ul>

        </Card>

        <Card>

          <CardHeader>
            <CardTitle>Distribuição</CardTitle>

            <Button size='sm' onClick={toggleAdd}>
              {show_add ? (
                <X className='h-3.5 w-3.5' />
              ) : (
                <Plus className='h-3.5 w-3.5' />

              )}
              {show_add ? 'Cancelar' : 'Nova categoria'}
            </Button>

          </CardHeader>

          {show_add && (

            <div className='mb-6 flex flex-col gap-3 rounded-xl border border-dashed border-brand/40 bg-bg-900/30 p-4 animate-in fade-in slide-in-from-top-2 duration-200'>

              <div className='flex items-end gap-3'>

                <div className='flex-1'>
                  <Label>Nome</Label>
                  <Input
                    value={new_label}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder='Pet, Filhos, Viagens...'
                  />
                </div>

                <div>
                  <Label>Cor</Label>
                  <ColorPicker
                    value={new_color}
                    onChange={setNewColor}
                    used_by={used_by_list}
                  />
                </div>

              </div>

              <div className='flex justify-end'>

                <Button onClick={handleCreate} disabled={pending} size='sm'>
                  {pending ? (
                    <Loader2 className='h-3.5 w-3.5 animate-spin' />
                  ) : (
                    <Check className='h-3.5 w-3.5' />

                  )}
                  Criar
                </Button>

              </div>

            </div>

          )}

          {drafts.length === 0 ? (

            <p className='py-8 text-center text-sm text-text-300'>
              Nenhuma categoria ainda. Clique em &quot;Nova categoria&quot;.
            </p>

          ) : (

            <ul className='flex flex-col gap-6'>

              {drafts.map((d) => {

                const is_editing = editing_id === d.id

                return (
                  <li key={d.id} className='flex flex-col gap-2'>

                    <div className='flex items-center gap-3'>

                      {is_editing ? (

                        <div className='flex flex-1 flex-col gap-2'>

                          <div className='flex items-center gap-3'>

                            <Input
                              value={edit_label}
                              onChange={(e) => setEditLabel(e.target.value)}
                              className='h-9 flex-1'
                              autoFocus
                            />

                            <ColorPicker
                              value={edit_color}
                              onChange={setEditColor}
                              used_by={used_by_list.filter((u) => u.color !== d.color)}
                            />

                            <button
                              onClick={commitEdit}
                              disabled={pending}
                              className='flex h-9 w-9 items-center justify-center rounded-lg bg-positive/20 text-positive-soft hover:bg-positive/30'
                              title='Salvar'
                            >
                              <Check className='h-4 w-4' />
                            </button>

                            <button
                              onClick={cancelEdit}
                              className='flex h-9 w-9 items-center justify-center rounded-lg text-text-300 hover:bg-bg-800'
                              title='Cancelar'
                            >
                              <X className='h-4 w-4' />
                            </button>

                          </div>

                          <label className='flex w-fit cursor-pointer items-center gap-2 text-xs text-text-300'>

                            <input
                              type='checkbox'
                              checked={edit_is_saving}
                              onChange={(e) => setEditIsSaving(e.target.checked)}
                              className='h-3.5 w-3.5 cursor-pointer accent-brand'
                            />

                            <span>
                              Categoria de investimento{' '}
                              <span className='text-text-500'>(passar da meta é bom)</span>
                            </span>

                          </label>

                        </div>

                      ) : (

                        <>
                          <span
                            className='inline-block h-3 w-3 rounded-full shrink-0'
                            style={{ background: d.color }}
                          />

                          <p className='flex-1 text-base text-text-50'>
                            {d.label}
                          </p>

                          <button
                            onClick={() => zeroPct(d.id)}
                            className='text-[10px] uppercase tracking-wider text-text-300 hover:text-text-50'
                            title='Zerar'
                          >
                            zerar
                          </button>

                          <span
                            className='text-sm font-semibold tabular-nums w-12 text-right'
                            style={{ color: d.color }}
                          >
                            {Number(d.pct).toFixed(0)}%
                          </span>

                          <button
                            onClick={() => startEdit(d)}
                            className='flex h-8 w-8 items-center justify-center rounded-lg text-text-300 hover:bg-bg-800 hover:text-text-50'
                            title='Renomear'
                          >
                            <Pencil className='h-3.5 w-3.5' />
                          </button>

                          <button
                            onClick={() => handleArchive(d.id)}
                            className='flex h-8 w-8 items-center justify-center rounded-lg text-text-300 hover:bg-negative/20 hover:text-negative'
                            title='Arquivar'
                          >
                            <Trash2 className='h-3.5 w-3.5' />
                          </button>
                        </>

                      )}

                    </div>

                    <Slider
                      value={[Number(d.pct)]}
                      min={0}
                      max={100}
                      step={1}
                      trackColor={d.color}
                      onValueChange={(v) => setPct(d.id, v[0])}
                    />

                    <div className='flex justify-between text-[11px] text-text-300'>
                      <span>0%</span>
                      <span>100%</span>
                    </div>

                  </li>

                )

              })}

            </ul>

          )}

        </Card>

      </div>

      <div className='flex flex-wrap items-center justify-end gap-3 pb-6'>

        {error && (
          <span className='text-sm text-negative-soft'>{error}</span>

        )}

        {saved && !error && (
          <span className='text-sm text-positive-soft'>Metas salvas.</span>

        )}

        <Button onClick={handleSave} disabled={pending || over_100}>
          {pending && <Loader2 className='h-4 w-4 animate-spin' />}
          {over_100 ? 'Reduza para salvar' : under_100 ? `Salvar (${total.toFixed(0)}%)` : 'Salvar'}
        </Button>

      </div>

    </section>

  )

}
