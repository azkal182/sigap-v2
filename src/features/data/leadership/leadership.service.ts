'use server'

import type { Leadership, PositionHistoryLeadership, TermLeadership } from '@/generated/prisma/client'
import { PositionRole, Prisma } from '@/generated/prisma/client'
import { handleServerError } from '@/lib/handle-error'

import prisma from '@/lib/prisma'
import type { APIResult } from '@/types/api-types'
import type { LeadershipInput, TermLeadershipInput } from './schemas/leadership.schema'

// ======================
// Helper
// ======================

// 🔍 Cek apakah santri sudah punya jabatan di periode tertentu
async function isStudentBusy(studentId: string, termLeadershipId: string): Promise<boolean> {
  const existingPosition = await prisma.positionHistoryLeadership.findFirst({
    where: { studentId, termLeadershipId }
  })

  return existingPosition !== null
}

// ➕ Tambah kepengurusan baru
export async function addLeadership(params: { name: string; description?: string }): Promise<APIResult<Leadership>> {
  try {
    const { name, description } = params
    const newLeadership = await prisma.leadership.create({ data: { name, description } })

    return { success: true, data: newLeadership, message: 'Kepengurusan berhasil ditambahkan.' }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { success: false, error: `GAGAL: Kepengurusan dengan nama "${params.name}" sudah ada.` }
    }

    const message = handleServerError('Terjadi kesalahan saat menambah kepengurusan.', error)

    return { success: false, error: message }
  }
}

export async function updateLeadership(params: LeadershipInput): Promise<APIResult<Leadership>> {
  try {
    // 2. Gunakan rest parameter untuk memisahkan id dari data update
    const { id, ...dataToUpdate } = params

    const updatedLeadership = await prisma.leadership.update({
      where: { id },
      data: dataToUpdate
    })

    // 1. Pesan sukses yang akurat
    return { success: true, data: updatedLeadership, message: 'Kepengurusan berhasil diperbarui.' }
  } catch (error) {
    // 3. Penanganan error yang lebih lengkap
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        // Error saat record yang akan di-update tidak ditemukan
        return { success: false, error: 'GAGAL: Kepengurusan yang akan diperbarui tidak ditemukan.' }
      }

      if (error.code === 'P2002') {
        // Error saat nama yang baru sudah digunakan oleh record lain
        return { success: false, error: `GAGAL: Kepengurusan dengan nama "${params.name}" sudah ada.` }
      }
    }

    // Fallback untuk error lainnya
    const message = handleServerError('Terjadi kesalahan saat memperbarui kepengurusan.', error)

    return { success: false, error: message }
  }
}

// ➕ Tambah periode kepengurusan
export async function addTermLeadership(params: {
  name: string
  startDate: Date
  endDate: Date
}): Promise<APIResult<TermLeadership>> {
  try {
    const { name, startDate, endDate } = params
    const newTerm = await prisma.termLeadership.create({ data: { name, startDate, endDate } })

    return { success: true, data: newTerm, message: 'Periode kepengurusan berhasil ditambahkan.' }
  } catch (error) {
    let message: string = ''

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      message = handleServerError(`GAGAL: Periode dengan nama "${params.name}" sudah ada.`, error)

      return { success: false, error: message }
    }

    message = handleServerError('Terjadi kesalahan saat menambah periode:', error)

    return { success: false, error: message }
  }
}

export async function updateTermLeadership(params: TermLeadershipInput): Promise<APIResult<TermLeadership>> {
  try {
    // 1. Pisahkan `id` dari sisa data yang akan di-update.
    // Cara ini sangat bersih dan skalabel. Jika ada field baru, Anda tidak perlu mengubah kode ini.
    const { id, ...dataToUpdate } = params

    // Pengecekan opsional: Jika tidak ada data yang dikirim selain ID,
    // tidak perlu melakukan operasi update ke database.
    if (Object.keys(dataToUpdate).length === 0) {
      return { success: false, error: 'Tidak ada data yang dikirim untuk diperbarui.' }
    }

    // 2. Lakukan operasi update di database.
    const updatedTerm = await prisma.termLeadership.update({
      where: { id },
      data: dataToUpdate
    })

    // 3. Kembalikan respons sukses dengan pesan yang akurat.
    return { success: true, data: updatedTerm, message: 'Periode kepengurusan berhasil diperbarui.' }
  } catch (error) {
    // 4. Tangani error yang sudah diketahui dari Prisma untuk UX yang lebih baik.
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Error P2025: Record yang akan di-update tidak ditemukan.
      // Ini sangat penting untuk fungsi update.
      if (error.code === 'P2025') {
        return { success: false, error: 'GAGAL: Periode yang akan diperbarui tidak ditemukan.' }
      }

      // Error P2002: Unique constraint failed.
      // Terjadi jika Anda mengubah `name` menjadi nama yang sudah ada.
      if (error.code === 'P2002') {
        return { success: false, error: `GAGAL: Periode dengan nama "${params.name}" sudah ada.` }
      }
    }

    // 5. Fallback untuk semua error lain yang tidak terduga.
    const message = handleServerError('Terjadi kesalahan saat memperbarui periode.', error)

    return { success: false, error: message }
  }
}

// ➕ Menunjuk KETUA
export async function addLeadershipChairman(params: {
  studentId: string
  leadershipId: string

  //   termLeadershipId: string
  notes?: string
}): Promise<APIResult<PositionHistoryLeadership>> {
  const { studentId, leadershipId, notes } = params

  try {
    const now = new Date()

    const currentTerm = await prisma.termLeadership.findFirst({
      where: {
        startDate: { lte: now }, // Kurang dari atau sama dengan tanggal sekarang
        endDate: { gte: now } // Lebih dari atau sama dengan tanggal sekarang
      },
      select: {
        id: true
      }
    })

    if (!currentTerm) {
      return { success: false, error: 'Tidak dapat menemukan periode kepengurusan yang sedang berlaku.' }
    }

    if (await isStudentBusy(studentId, currentTerm.id)) {
      return { success: false, error: `GAGAL: Santri (ID: ${studentId}) sudah memegang jabatan lain di periode ini.` }
    }

    // Validasi ketua sudah ada (meski sudah ada constraint di Prisma, kita cek biar error lebih ramah)
    const existingChairman = await prisma.positionHistoryLeadership.findFirst({
      where: { leadershipId, termLeadershipId: currentTerm.id, role: PositionRole.CHAIRMAN }
    })

    if (existingChairman) {
      return { success: false, error: `GAGAL: Kepengurusan (ID: ${leadershipId}) sudah memiliki ketua di periode ini.` }
    }

    const newChairman = await prisma.positionHistoryLeadership.create({
      data: { studentId, leadershipId, termLeadershipId: currentTerm.id, role: PositionRole.CHAIRMAN, notes },
      include: { student: true, leadership: true, termLeadership: true }
    })

    return { success: true, data: newChairman, message: 'Ketua berhasil ditunjuk.' }
  } catch (error) {
    const message = handleServerError('Terjadi kesalahan saat menunjuk ketua:', error)

    return { success: false, error: message }
  }
}

// ➕ Menambah ANGGOTA
export async function addLeadershipMember(params: {
  studentId: string
  leadershipId: string
  notes?: string
}): Promise<APIResult<PositionHistoryLeadership>> {
  const { studentId, leadershipId, notes } = params

  try {
    const now = new Date()

    const currentTerm = await prisma.termLeadership.findFirst({
      where: {
        startDate: { lte: now }, // Kurang dari atau sama dengan tanggal sekarang
        endDate: { gte: now } // Lebih dari atau sama dengan tanggal sekarang
      },
      select: {
        id: true
      }
    })

    if (!currentTerm) {
      return { success: false, error: 'Tidak dapat menemukan periode kepengurusan yang sedang berlaku.' }
    }

    if (await isStudentBusy(studentId, currentTerm.id)) {
      return { success: false, error: `GAGAL: Santri (ID: ${studentId}) sudah memegang jabatan lain di periode ini.` }
    }

    const newMember = await prisma.positionHistoryLeadership.create({
      data: { studentId, leadershipId, termLeadershipId: currentTerm.id, role: PositionRole.MEMBER, notes },
      include: { student: true, leadership: true, termLeadership: true }
    })

    return { success: true, data: newMember, message: 'pengurus berhasil ditambahkan' }
  } catch (error) {
    const message = handleServerError('Terjadi kesalahan saat menambah anggota:', error)

    return { success: false, error: message }
  }
}

export async function getLeadershipList(): Promise<Leadership[]> {
  return prisma.leadership.findMany({
    orderBy: { name: 'asc' }
  })
}

export async function getTermLeadershipList(): Promise<(TermLeadership & { canEdit: boolean })[]> {
  const list = await prisma.termLeadership.findMany({
    orderBy: { startDate: 'desc' }
  })

  return list.map((item, index) => ({
    ...item,
    canEdit: index === 0
  }))
}

export type LeadershipDetail = {
  id: string
  name: string
  description?: string | null
  chairman?: {
    id: string
    name: string
    nis: string
  }
  term?: {
    id: string
    name: string
    startDate: Date
    endDate: Date
  }
  members: {
    id: string
    name: string
    nis: string
  }[]
}

export const getDetailLeadership = async (params: {
  id: string
  termLeadershipId?: string // Diubah menjadi opsional
}): Promise<APIResult<LeadershipDetail>> => {
  try {
    // 1. Validasi input utama
    if (!params.id) {
      return { success: false, error: 'ID kepengurusan harus diisi.' }
    }

    let targetTermId = params.termLeadershipId

    // 2. Jika termLeadershipId tidak ada, cari periode yang sedang berlaku
    if (!targetTermId) {
      const now = new Date()

      const currentTerm = await prisma.termLeadership.findFirst({
        where: {
          startDate: { lte: now }, // Kurang dari atau sama dengan tanggal sekarang
          endDate: { gte: now } // Lebih dari atau sama dengan tanggal sekarang
        },
        select: {
          id: true
        }
      })

      if (!currentTerm) {
        return { success: false, error: 'Tidak dapat menemukan periode kepengurusan yang sedang berlaku.' }
      }

      targetTermId = currentTerm.id
    }

    // 3. Ambil data kepengurusan dengan periode yang sudah ditentukan
    const leadership = await prisma.leadership.findUnique({
      where: {
        id: params.id
      },
      include: {
        positionHistories: {
          where: {
            termLeadershipId: targetTermId // Menggunakan targetTermId yang sudah pasti ada
          },
          include: {
            student: true,
            termLeadership: true
          }
        }
      }
    })

    if (!leadership) {
      return { success: false, error: `Kepengurusan dengan ID ${params.id} tidak ditemukan.` }
    }

    // 4. Proses data untuk membentuk struktur output
    const chairmanHistory = leadership.positionHistories.find(ph => ph.role === 'CHAIRMAN')
    const memberHistories = leadership.positionHistories.filter(ph => ph.role === 'MEMBER')
    const termInfo = leadership.positionHistories[0]?.termLeadership // Ambil info periode dari data pertama

    return {
      success: true,
      data: {
        id: leadership.id,
        name: leadership.name,
        description: leadership.description,
        chairman: chairmanHistory
          ? {
              id: chairmanHistory.student.id,
              name: chairmanHistory.student.name,
              nis: chairmanHistory.student.nis
            }
          : undefined,
        term: termInfo
          ? {
              id: termInfo.id,
              name: termInfo.name,
              startDate: termInfo.startDate,
              endDate: termInfo.endDate
            }
          : undefined,
        members: memberHistories.map(m => ({
          id: m.student.id,
          name: m.student.name,
          nis: m.student.nis
        }))
      }
    }
  } catch (error) {
    const message = handleServerError('Terjadi kesalahan saat mengambil detail kepengurusan:', error)

    return { success: false, error: message }
  }
}
