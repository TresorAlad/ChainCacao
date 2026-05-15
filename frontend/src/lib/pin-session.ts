const PIN_OK_KEY = 'chaincacao_pin_unlocked'
const HAS_PIN_KEY = 'chaincacao_has_pin'

export function setHasPinRequired(required: boolean) {
  if (typeof window === 'undefined') return
  if (required) {
    sessionStorage.setItem(HAS_PIN_KEY, '1')
    sessionStorage.removeItem(PIN_OK_KEY)
  } else {
    sessionStorage.removeItem(HAS_PIN_KEY)
    sessionStorage.setItem(PIN_OK_KEY, '1')
  }
}

export function hasPinRequired(): boolean {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem(HAS_PIN_KEY) === '1'
}

export function isPinUnlocked(): boolean {
  if (typeof window === 'undefined') return true
  if (!hasPinRequired()) return true
  return sessionStorage.getItem(PIN_OK_KEY) === '1'
}

export function markPinUnlocked() {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(PIN_OK_KEY, '1')
}

export function lockPinSession() {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(PIN_OK_KEY)
}

export function clearPinSession() {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(PIN_OK_KEY)
  sessionStorage.removeItem(HAS_PIN_KEY)
}
