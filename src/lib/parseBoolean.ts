// utils/parseBoolean.ts
export function parseBoolean(value: string | null, fallback = false): boolean {
  if (value == null) return fallback

  switch (value.trim().toLowerCase()) {
    case '1':
    case 'true':
    case 'yes':
    case 'y':
    case 'on':
    case 't':
      return true
    case '0':
    case 'false':
    case 'no':
    case 'n':
    case 'off':
    case 'f':
      return false
    default:
      return fallback
  }
}
