import type { HistoryStatus } from '@/generated/prisma'

export const convertHistoryStatus = (status: HistoryStatus): string => {
  switch (status) {
    case 'STUDYING':
      return 'Sedang Belajar'
    case 'GRADUATED':
      return 'Lulus'
    case 'REPEATED':
      return 'Mengulang'
    case 'TRANSFERRED':
      return 'Pindah'
    default:
      return 'Tidak Diketahui'
  }
}
