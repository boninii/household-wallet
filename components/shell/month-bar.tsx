'use client'

import { MonthSelector } from '@/components/budget/month-selector'

import { IncomeInput } from '@/components/budget/income-input'

type Props = {

  budget_id: string

  month: number

  year: number

  income: number

}

export function MonthBar({ budget_id, month, year, income }: Props) {

  return (
    <div className='flex flex-wrap items-end gap-6 rounded-2xl bg-bg-900/40 p-5 ring-1 ring-bg-800'>

      <MonthSelector month={month} year={year} />

      <IncomeInput budget_id={budget_id} initial={income} />

    </div>

  )

}
