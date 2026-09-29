import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs'

const clone = (value) => JSON.parse(JSON.stringify(value))

const readLocalState = (localFile, fallback) => {
  if (!existsSync(localFile)) return clone(fallback)

  try {
    return JSON.parse(readFileSync(localFile, 'utf8'))
  } catch (error) {
    console.error('Unable to read local state; starting from defaults.', error)
    return clone(fallback)
  }
}

const writeLocalState = (localFile, serialized) => {
  const temporaryFile = new URL(`${localFile.pathname}.tmp`, localFile)
  writeFileSync(temporaryFile, serialized)
  renameSync(temporaryFile, localFile)
}

export const createStateStore = async ({ defaultState, localFile, databaseUrl = '' }) => {
  const connectionString = String(databaseUrl || '').trim()
  let state = readLocalState(localFile, defaultState)
  let pool = null
  let pendingWrite = Promise.resolve()

  if (connectionString) {
    const { Pool } = await import('pg')
    pool = new Pool({ connectionString, max: 3, idleTimeoutMillis: 30000 })
    await pool.query(`
      CREATE TABLE IF NOT EXISTS punjabship_app_state (
        id TEXT PRIMARY KEY,
        payload JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    const result = await pool.query(
      'SELECT payload FROM punjabship_app_state WHERE id = $1 LIMIT 1',
      ['primary'],
    )

    if (result.rows[0]?.payload) {
      state = result.rows[0].payload
    }
  }

  const save = (nextState) => {
    const serialized = JSON.stringify(nextState, null, 2)

    if (!pool) {
      writeLocalState(localFile, serialized)
      return Promise.resolve()
    }

    // Serialize writes so rapid mutations can never let an older snapshot win.
    pendingWrite = pendingWrite.then(() => pool.query(
      `INSERT INTO punjabship_app_state (id, payload, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (id) DO UPDATE
       SET payload = EXCLUDED.payload, updated_at = EXCLUDED.updated_at`,
      ['primary', serialized],
    ))
    return pendingWrite
  }

  return {
    state,
    save,
    mode: pool ? 'postgres' : 'local-file',
  }
}
