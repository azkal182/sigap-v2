export const ensurePrefix = (str: string, prefix: string) => (str.startsWith(prefix) ? str : `${prefix}${str}`)
export const withoutSuffix = (str: string, suffix: string) =>
  str.endsWith(suffix) ? str.slice(0, -suffix.length) : str
export const withoutPrefix = (str: string, prefix: string) => (str.startsWith(prefix) ? str.slice(prefix.length) : str)

/**
 * Fungsi untuk mengganti nomor yang diawali dengan 62 menjadi 08.
 * @param phoneNumber Nomor telepon yang ingin diubah.
 * @returns Nomor telepon yang sudah diubah, atau nomor yang sama jika tidak diawali dengan 62.
 */
export function convertPhoneNumber(phoneNumber: string): string {
  // Periksa apakah nomor dimulai dengan '62'
  if (phoneNumber.startsWith('62')) {
    // Ganti '62' dengan '08'
    return '08' + phoneNumber.slice(2)
  }

  return phoneNumber // Kembalikan nomor yang tidak diubah jika tidak diawali dengan '62'
}
