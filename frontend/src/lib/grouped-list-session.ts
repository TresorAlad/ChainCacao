export type GroupedListSessionEntry = {
  list_id: string
  batch_ids: string[]
  created_at: string
}

const STORAGE_KEY = 'chaincacao_grouped_lists_session'

export function loadGroupedListSession(): {
  last: GroupedListSessionEntry | null
  history: GroupedListSessionEntry[]
} {
  if (typeof window === 'undefined') return { last: null, history: [] }
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return { last: null, history: [] }
    const parsed = JSON.parse(raw) as { last?: GroupedListSessionEntry; history?: GroupedListSessionEntry[] }
    const history = Array.isArray(parsed.history) ? parsed.history : []
    const last = parsed.last ?? history[0] ?? null
    return { last, history }
  } catch {
    return { last: null, history: [] }
  }
}

export function saveGroupedListSession(entry: GroupedListSessionEntry) {
  if (typeof window === 'undefined') return
  const { history } = loadGroupedListSession()
  const nextHistory = [entry, ...history.filter((h) => h.list_id !== entry.list_id)].slice(0, 10)
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ last: entry, history: nextHistory })
  )
}
