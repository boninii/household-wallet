import fs from 'fs'

import path from 'path'

let cached_sql: string | null = null

const FILES = ['migration_v2.sql', 'migration_v3.sql', 'migration_v4.sql', 'migration_v5.sql', 'migration_v6.sql', 'migration_v7.sql']

export function readMigrationSQL(): string {

  if (cached_sql) {

    return cached_sql

  }

  const parts: string[] = []

  for (const f of FILES) {

    try {

      const file_path = path.join(process.cwd(), 'supabase', f)

      const content = fs.readFileSync(file_path, 'utf-8')

      parts.push(
        `-- =========================================================================\n-- ${f}\n-- =========================================================================\n\n${content}`

      )

    } catch {

      // arquivo inexistente, ignora

    }

  }

  cached_sql =
    parts.length > 0
      ? parts.join('\n\n')
      : '-- Nenhuma migration encontrada em supabase/'

  return cached_sql

}
