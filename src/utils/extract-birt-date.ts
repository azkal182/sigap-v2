// app/utils/date-utils.ts (atau lokasi file Anda)
export function extractBirthData(data: string): {
  placeOfBirth: string | null
  dateOfBirth: Date | null
  isValid: boolean
  message: string
} {
  const originalData = data.trim()

  // Validasi awal: input kosong
  if (!originalData) {
    return {
      placeOfBirth: null,
      dateOfBirth: null,
      isValid: false,
      message: 'Data TTL kosong.'
    }
  }

  try {
    // Memisahkan string berdasarkan koma
    const parts = originalData.split(',').map(part => part.trim())

    if (parts.length < 2) {
      return {
        placeOfBirth: null,
        dateOfBirth: null,
        isValid: false,
        message: `Format TTL tidak valid: '${originalData}'. Harusnya "Tempat, DD Bulan YYYY".`
      }
    }

    const place = parts[0]
    const dateStr = parts.slice(1).join(',').trim() // Gabungkan kembali jika ada koma di tanggal

    if (!place || !dateStr) {
      return {
        placeOfBirth: null,
        dateOfBirth: null,
        isValid: false,
        message: `Format TTL tidak lengkap: '${originalData}'.`
      }
    }

    // Membuat array bulan dalam bahasa Indonesia
    const months = [
      'januari',
      'februari',
      'maret',
      'april',
      'mei',
      'juni',
      'juli',
      'agustus',
      'september',
      'oktober',
      'november',
      'desember'
    ]

    const dateParts = dateStr.split(' ').map(p => p.trim())

    if (dateParts.length < 3) {
      return {
        placeOfBirth: null,
        dateOfBirth: null,
        isValid: false,
        message: `Format tanggal pada TTL tidak lengkap: '${dateStr}'. Harusnya "DD Bulan YYYY".`
      }
    }

    const dayStr = dateParts[0]
    const monthName = dateParts[1]
    const yearStr = dateParts[2]

    const monthIndex = months.indexOf(monthName.toLocaleLowerCase())

    if (monthIndex === -1) {
      return {
        placeOfBirth: null,
        dateOfBirth: null,
        isValid: false,
        message: `Bulan '${monthName}' pada TTL tidak dikenali: '${originalData}'.`
      }
    }

    const validDay = Number(dayStr)
    const validYear = Number(yearStr)

    if (isNaN(validDay) || isNaN(validYear) || validDay <= 0 || validYear <= 0 || validDay > 31) {
      return {
        placeOfBirth: null,
        dateOfBirth: null,
        isValid: false,
        message: `Tanggal atau tahun tidak valid: '${dayStr} ${monthName} ${yearStr}'.`
      }
    }

    const dateOfBirth = new Date(validYear, monthIndex, validDay)

    // Memeriksa apakah tanggal valid (misalnya, 31 Februari)
    if (
      isNaN(dateOfBirth.getTime()) ||
      dateOfBirth.getDate() !== validDay ||
      dateOfBirth.getMonth() !== monthIndex ||
      dateOfBirth.getFullYear() !== validYear
    ) {
      return {
        placeOfBirth: null,
        dateOfBirth: null,
        isValid: false,
        message: `Tanggal lahir tidak valid atau tidak sesuai bulan: '${originalData}'.`
      }
    }

    return {
      placeOfBirth: place,
      dateOfBirth: dateOfBirth,
      isValid: true,
      message: 'TTL valid.'
    }
  } catch (error: any) {
    // Ini menangani error tak terduga yang mungkin terlewat dari validasi di atas
    console.error('Error tak terduga pada extractBirthData:', error.message, originalData)

    return {
      placeOfBirth: null,
      dateOfBirth: null,
      isValid: false,
      message: `Kesalahan internal validasi TTL: ${error.message}.`
    }
  }
}
