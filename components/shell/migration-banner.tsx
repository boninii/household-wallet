'use client'

import { useState } from 'react'

import { AlertTriangle, Check, Copy, ExternalLink } from 'lucide-react'

type Props = {

  title: string

  description?: string

  sql_content: string

  supabase_url?: string | null

}

export function MigrationBanner({
  title,
  description,
  sql_content,
  supabase_url
}: Props) {

  const [copied, setCopied] = useState(false)

  const [open, setOpen] = useState(false)

  function handleCopy() {

    navigator.clipboard.writeText(sql_content).then(() => {

      setCopied(true)

      setTimeout(() => setCopied(false), 2500)

    })

  }

  const sql_editor_url = supabase_url
    ? `${supabase_url.replace('.supabase.co', '.supabase.com').replace('https://', 'https://supabase.com/dashboard/project/')}/sql/new`
    : null

  return (
    <div className='flex flex-col gap-4 rounded-2xl border border-brand/40 bg-brand/10 p-6 text-text-50'>

      <div className='flex items-start gap-3'>

        <AlertTriangle className='mt-0.5 h-5 w-5 shrink-0 text-brand' />

        <div className='flex-1'>

          <p className='font-display text-2xl text-text-50'>{title}</p>

          <p className='mt-1 text-sm text-text-100'>
            {description ?? 'Esta tela precisa das tabelas adicionais. Siga os 3 passos abaixo:'}
          </p>

        </div>

      </div>

      <ol className='ml-1 space-y-2 text-sm text-text-100'>

        <li className='flex flex-wrap items-center gap-2'>

          <span className='inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand/30 text-xs font-bold text-brand'>
            1
          </span>

          <button
            onClick={handleCopy}
            className='inline-flex items-center gap-1.5 rounded-lg bg-bg-900 px-3 py-1.5 text-xs font-medium text-text-50 ring-1 ring-bg-700 hover:bg-bg-800'
          >
            {copied ? (
              <>
                <Check className='h-3.5 w-3.5 text-positive-soft' />
                SQL copiado!
              </>
            ) : (
              <>
                <Copy className='h-3.5 w-3.5' />
                Copiar SQL completo
              </>

            )}
          </button>

          <span className='text-text-300'>
            ({sql_content.split('\n').length} linhas)
          </span>

        </li>

        <li className='flex flex-wrap items-center gap-2'>

          <span className='inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand/30 text-xs font-bold text-brand'>
            2
          </span>

          {sql_editor_url ? (
            <a
              href={sql_editor_url}
              target='_blank'
              rel='noreferrer'
              className='inline-flex items-center gap-1.5 rounded-lg bg-bg-900 px-3 py-1.5 text-xs font-medium text-text-50 ring-1 ring-bg-700 hover:bg-bg-800'
            >
              <ExternalLink className='h-3.5 w-3.5' />
              Abrir SQL Editor do Supabase
            </a>
          ) : (
            <span>
              Abre o SQL Editor do seu projeto Supabase
            </span>

          )}

          <span className='text-text-300'>cola na área de query</span>

        </li>

        <li className='flex flex-wrap items-center gap-2'>

          <span className='inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand/30 text-xs font-bold text-brand'>
            3
          </span>

          <span>Clica em <strong className='text-brand'>Run</strong> e atualiza esta página (F5).</span>

        </li>

      </ol>

      <button
        onClick={() => setOpen((o) => !o)}
        className='self-start text-xs text-text-300 underline hover:text-text-50'
      >
        {open ? 'Esconder' : 'Mostrar'} preview do SQL
      </button>

      {open && (
        <pre className='max-h-[280px] overflow-auto rounded-lg bg-bg-950 p-4 text-[11px] leading-relaxed text-text-300 ring-1 ring-bg-700'>
          <code>{sql_content}</code>
        </pre>

      )}

    </div>

  )

}
