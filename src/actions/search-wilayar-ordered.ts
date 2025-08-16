'use server'

import type { Province, Regency, District, Village } from '@/generated/prisma'

import prisma from '@/lib/prisma'

// --- Definisi Tipe untuk Hasil Prisma ---
type ProvinceResult = Pick<Province, 'id' | 'name' | 'code'>

type RegencyResult = Pick<Regency, 'id' | 'name' | 'type' | 'code' | 'fullCode' | 'label'> & {
  province: Pick<Province, 'name' | 'id' | 'code'> // PASTIKAN id dan code juga ada di sini
}

type DistrictResult = Pick<District, 'id' | 'name' | 'code' | 'fullCode'> & {
  regency: Pick<Regency, 'id' | 'name' | 'type' | 'label' | 'code' | 'fullCode'> & {
    province: Pick<Province, 'name' | 'id' | 'code'> // PASTIKAN id dan code juga ada di sini
  }
}

type VillageResult = Pick<Village, 'id' | 'name' | 'code' | 'fullCode' | 'postalCode'> & {
  district: Pick<District, 'id' | 'name' | 'code' | 'fullCode'> & {
    regency: Pick<Regency, 'id' | 'name' | 'type' | 'label' | 'code' | 'fullCode'> & {
      province: Pick<Province, 'name' | 'id' | 'code'> // PASTIKAN id dan code juga ada di sini
    }
  }
}

// --- Definisi Tipe untuk Objek Kembalian Fungsi ---
interface SearchResult {
  province?: ProvinceResult
  regency?: RegencyResult
  district?: DistrictResult
  village?: VillageResult
  message: string
  failedLevel?: 'province' | 'regency' | 'district' | 'village' | 'validation' | 'unknown'
}

/**
 * Membersihkan nama desa dari prefiks umum (misal: "desa", "ds").
 * @param {string} villageName - Nama desa mentah.
 * @returns {string} Nama desa yang sudah dibersihkan.
 */
function cleanVillageName(villageName: string): string {
  if (!villageName) return ''

  const prefixesToRemove = [
    /^desa\s*\.\s*/i,
    /^desa\s*/i,
    /^ds\s*\.\s*/i,
    /^ds\s*/i,
    /^kelurahan\s*\.\s*/i,
    /^kelurahan\s*/i,
    /^kl\s*\.\s*/i,
    /^kl\s*/i
  ]

  let cleanedName = villageName.trim()

  for (const prefixRegex of prefixesToRemove) {
    cleanedName = cleanedName.replace(prefixRegex, '').trim()
  }

  return cleanedName
}

/**
 * Mencari wilayah secara top-down berdasarkan nama provinsi, label kabupaten/kota, nama kecamatan, dan nama desa.
 * Fungsi ini dianggap sukses HANYA JIKA sebuah desa yang spesifik berhasil ditemukan.
 * Jika ditemukan beberapa Kabupaten/Kota dengan label yang sama, akan mencoba menelusuri masing-masing hingga desa.
 *
 * @param {string | undefined} [provinceName] - Nama provinsi untuk dicari (opsional).
 * @param {string | undefined} [regencyLabel] - Label kabupaten/kota untuk dicari (opsional).
 * @param {string | undefined} [districtName] - Nama kecamatan untuk dicari (opsional).
 * @param {string | undefined} villageName - Nama desa/kelurahan untuk dicari (WAJIB untuk kesuksesan pencarian).
 * @returns {Promise<SearchResult>} Objek yang berisi hasil pencarian dan pesan status, serta tingkat kegagalan.
 */
export async function searchWilayahOrdered(
  provinceName?: string,
  regencyLabel?: string,
  districtName?: string,
  villageName?: string
): Promise<SearchResult> {
  try {
    const result: SearchResult = {
      message: 'Pencarian gagal: Desa belum ditemukan.',
      failedLevel: 'unknown'
    }

    const createContainsCondition = (name: string) => ({
      contains: name.toLowerCase(),
      mode: 'insensitive' as const
    })

    let currentProvince: ProvinceResult | undefined
    let possibleRegencies: RegencyResult[] = []
    let finalVillage: VillageResult | undefined

    // --- Validasi Awal: villageName Wajib ada untuk pencarian sukses ---
    if (!villageName || villageName.trim() === '') {
      result.message = 'Pencarian desa gagal: Nama desa wajib diisi.'
      result.failedLevel = 'validation'

      return result
    }

    // Bersihkan nama desa sebelum digunakan untuk pencarian
    const cleanedVillageName = cleanVillageName(villageName)

    if (!cleanedVillageName) {
      result.message = 'Pencarian desa gagal: Nama desa kosong setelah dibersihkan dari prefiks umum.'
      result.failedLevel = 'validation'

      return result
    }

    // 1. Cari Provinsi
    if (provinceName) {
      const provincesFound = (await prisma.province.findMany({
        where: {
          name: createContainsCondition(provinceName)
        },
        select: { id: true, name: true, code: true },
        take: 2
      })) as ProvinceResult[]

      if (provincesFound.length === 0) {
        result.message = `Pencarian gagal: Provinsi '${provinceName}' tidak ditemukan.`
        result.failedLevel = 'province'

        return result
      }

      if (provincesFound.length > 1) {
        result.message = `Pencarian gagal: Ditemukan lebih dari satu provinsi dengan nama '${provinceName}'. Mohon berikan informasi yang lebih spesifik.`
        result.failedLevel = 'province'

        return result
      }

      currentProvince = provincesFound[0]
      result.province = currentProvince
    }

    // 2. Cari Kabupaten/Kota (berdasarkan label)
    if (regencyLabel) {
      const regencyWhere: any = {
        label: createContainsCondition(regencyLabel)
      }

      if (currentProvince) {
        regencyWhere.provinceId = currentProvince.id
      } else if (provinceName) {
        result.message = `Pencarian gagal: Tidak dapat mencari Kabupaten/Kota '${regencyLabel}' karena Provinsi '${provinceName}' tidak ditemukan.`
        result.failedLevel = 'province'

        return result
      }

      possibleRegencies = (await prisma.regency.findMany({
        where: regencyWhere,
        select: {
          id: true,
          name: true,
          type: true,
          code: true,
          fullCode: true,
          label: true,
          province: { select: { id: true, name: true, code: true } } // Pastikan ini juga mengambil ID & Code
        }
      })) as RegencyResult[]

      if (possibleRegencies.length === 0) {
        result.message = `Pencarian gagal: Kabupaten/Kota dengan label '${regencyLabel}' tidak ditemukan${currentProvince ? ` di Provinsi '${currentProvince.name}'` : ''}.`
        result.failedLevel = 'regency'

        return result
      }
    } else if (currentProvince) {
      possibleRegencies = (await prisma.regency.findMany({
        where: { provinceId: currentProvince.id },
        select: {
          id: true,
          name: true,
          type: true,
          code: true,
          fullCode: true,
          label: true,
          province: { select: { id: true, name: true, code: true } } // Pastikan ini juga mengambil ID & Code
        }
      })) as RegencyResult[]

      if (possibleRegencies.length === 0) {
        result.message = `Pencarian gagal: Tidak ada Kabupaten/Kota ditemukan di Provinsi '${currentProvince.name}'.`
        result.failedLevel = 'regency'

        return result
      }
    }

    // --- Logika Penelusuran Hierarki untuk Mencari Desa Unik ---
    const regenciesToSearch: RegencyResult[] = regencyLabel
      ? possibleRegencies
      : currentProvince
        ? possibleRegencies
        : []

    for (const regency of regenciesToSearch) {
      // 3. Cari Kecamatan di dalam Regency ini
      let districtsFoundInThisRegency: DistrictResult[] = []

      const districtWhere: any = {
        regencyId: regency.id
      }

      if (districtName) {
        districtWhere.name = createContainsCondition(districtName)
      }

      districtsFoundInThisRegency = (await prisma.district.findMany({
        where: districtWhere,
        select: {
          id: true,
          name: true,
          code: true,
          fullCode: true,
          regency: {
            select: {
              id: true,
              name: true,
              type: true,
              label: true,
              code: true,
              fullCode: true,
              province: { select: { id: true, name: true, code: true } }
            }
          } // Pastikan relasi Regency lengkap
        },
        take: 2
      })) as DistrictResult[]

      if (districtsFoundInThisRegency.length === 0) {
        continue
      }

      if (districtsFoundInThisRegency.length > 1) {
        continue
      }

      // 4. Cari Desa di dalam District ini
      const villageWhere: any = {
        districtId: districtsFoundInThisRegency[0].id,
        name: createContainsCondition(cleanedVillageName)
      }

      const villagesFoundInThisPath = (await prisma.village.findMany({
        where: villageWhere,
        select: {
          id: true,
          name: true,
          code: true,
          fullCode: true,
          postalCode: true,
          district: {
            select: {
              id: true,
              name: true,
              code: true,
              fullCode: true, // Pastikan relasi District lengkap
              regency: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                  label: true,
                  code: true,
                  fullCode: true,
                  province: { select: { id: true, name: true, code: true } }
                }
              } // Pastikan relasi Regency lengkap
            }
          }
        },
        take: 2
      })) as VillageResult[]

      if (villagesFoundInThisPath.length === 1) {
        finalVillage = villagesFoundInThisPath[0]
        result.province = finalVillage.district.regency.province
        result.regency = finalVillage.district.regency
        result.district = finalVillage.district // Gunakan finalVillage.district karena sudah lengkap
        result.village = finalVillage
        result.message = 'Pencarian desa berhasil: Satu lokasi spesifik ditemukan.'
        result.failedLevel = undefined

        return result
      } else if (villagesFoundInThisPath.length > 1) {
        continue
      }
    } // End of for loop for regenciesToSearch

    // --- Fallback Pencarian jika loop regenciesToSearch tidak menemukan desa unik ---
    if (!finalVillage && districtName) {
      const districtWhereFallback: any = {
        name: createContainsCondition(districtName)
      }

      if (currentProvince) {
        districtWhereFallback.regency = {
          provinceId: currentProvince.id
        }
      }

      const fallbackDistricts = (await prisma.district.findMany({
        where: districtWhereFallback,
        select: {
          id: true,
          name: true,
          code: true,
          fullCode: true,
          regency: {
            select: {
              id: true,
              name: true,
              type: true,
              label: true,
              code: true,
              fullCode: true,
              province: { select: { id: true, name: true, code: true } }
            }
          } // Pastikan relasi Regency lengkap
        }
      })) as DistrictResult[]

      if (fallbackDistricts.length === 0) {
        result.message = `Pencarian gagal: Kecamatan '${districtName}' tidak ditemukan${currentProvince ? ` di Provinsi '${currentProvince.name}'` : ''}.`
        result.failedLevel = 'district'

        return result
      }

      let ambiguousVillageInFallback = false

      for (const fallbackDistrict of fallbackDistricts) {
        const fallbackVillageWhere: any = {
          districtId: fallbackDistrict.id,
          name: createContainsCondition(cleanedVillageName)
        }

        const fallbackVillages = (await prisma.village.findMany({
          where: fallbackVillageWhere,
          select: {
            id: true,
            name: true,
            code: true,
            fullCode: true,
            postalCode: true,
            district: {
              select: {
                id: true,
                name: true,
                code: true,
                fullCode: true, // Pastikan relasi District lengkap
                regency: {
                  select: {
                    id: true,
                    name: true,
                    type: true,
                    label: true,
                    code: true,
                    fullCode: true,
                    province: { select: { id: true, name: true, code: true } }
                  }
                } // Pastikan relasi Regency lengkap
              }
            }
          },
          take: 2
        })) as VillageResult[]

        if (fallbackVillages.length === 1) {
          finalVillage = fallbackVillages[0]
          result.province = finalVillage.district.regency.province
          result.regency = finalVillage.district.regency
          result.district = finalVillage.district
          result.village = finalVillage
          result.message = 'Pencarian desa berhasil: Satu lokasi spesifik ditemukan.'
          result.failedLevel = undefined

          return result
        } else if (fallbackVillages.length > 1) {
          ambiguousVillageInFallback = true
        }
      }

      if (ambiguousVillageInFallback) {
        result.message = `Pencarian gagal: Ditemukan lebih dari satu Desa dengan nama '${villageName}' di Kecamatan '${districtName}'. Mohon berikan informasi yang lebih spesifik.`
        result.failedLevel = 'village'

        return result
      }

      if (!finalVillage && fallbackDistricts.length > 0) {
        result.message = `Pencarian gagal: Desa '${villageName}' tidak ditemukan di Kecamatan '${districtName}' yang ditentukan.`
        result.failedLevel = 'village'

        return result
      }
    }

    // Jika sampai di sini, artinya desa unik tidak ditemukan setelah menelusuri semua kemungkinan jalur.
    if (!finalVillage) {
      const anyVillageFound = await prisma.village.findMany({
        where: { name: createContainsCondition(cleanedVillageName) },
        select: { id: true },
        take: 1
      })

      if (anyVillageFound.length === 0) {
        result.message = `Pencarian gagal: Desa '${villageName}' tidak ditemukan di seluruh Indonesia.`
        result.failedLevel = 'village'
      } else {
        result.message = `Pencarian gagal: Desa '${villageName}' ditemukan, tetapi tidak dapat dipastikan secara unik dengan informasi lokasi yang diberikan (Provinsi/Kabupaten/Kecamatan mungkin ambigu atau tidak cocok).`
        result.failedLevel = 'village'
      }
    }

    return result
  } catch (error) {
    console.error('Error during ordered wilayah search:', error)

    return {
      message: 'Terjadi kesalahan internal saat mencari wilayah. Silakan coba lagi.',
      failedLevel: 'unknown'
    }
  }
}

export async function searchWilayahWithFallback(
  provinceName?: string,
  regencyLabel?: string,
  districtName?: string,
  villageName?: string
): Promise<SearchResult> {
  try {
    // --- Variabel untuk menyimpan hasil parsial terbaik yang pernah ditemukan ---
    const bestPartialResult: SearchResult = {
      message: 'Pencarian dimulai...',
      failedLevel: 'unknown'
    }

    const createContainsCondition = (name: string) => ({
      contains: name.toLowerCase(),
      mode: 'insensitive' as const
    })

    let currentProvince: ProvinceResult | undefined
    let possibleRegencies: RegencyResult[] = []

    // --- Validasi Awal: villageName diperlukan untuk memulai pencarian desa ---
    // Anda bisa mengomentari atau menghapus blok ini jika ingin fungsi berjalan
    // bahkan tanpa input nama desa sama sekali.
    if (!villageName || villageName.trim() === '') {
      return {
        message: 'Pencarian desa gagal: Nama desa wajib diisi untuk memulai.',
        failedLevel: 'validation'
      }
    }

    const cleanedVillageName = cleanVillageName(villageName)

    if (!cleanedVillageName) {
      return {
        message: 'Pencarian desa gagal: Nama desa kosong setelah dibersihkan dari prefiks umum.',
        failedLevel: 'validation'
      }
    }

    // 1. Cari Provinsi
    if (provinceName) {
      const provincesFound = (await prisma.province.findMany({
        where: { name: createContainsCondition(provinceName) },
        select: { id: true, name: true, code: true },
        take: 2
      })) as ProvinceResult[]

      if (provincesFound.length !== 1) {
        return {
          message: `Pencarian gagal: Provinsi '${provinceName}' ${provincesFound.length > 1 ? 'ambigu' : 'tidak ditemukan'}.`,
          failedLevel: 'province'
        }
      }

      currentProvince = provincesFound[0]

      // SIMPAN HASIL SEMENTARA
      bestPartialResult.province = currentProvince
      bestPartialResult.message = `Provinsi ditemukan: ${currentProvince.name}.`
      bestPartialResult.failedLevel = 'regency' // Jika gagal, kegagalannya di level bawahnya
    }

    // 2. Cari Kabupaten/Kota
    const regencyWhere: any = {}

    if (regencyLabel) {
      regencyWhere.label = createContainsCondition(regencyLabel)
    }

    if (currentProvince) {
      regencyWhere.provinceId = currentProvince.id
    }

    if (regencyLabel || currentProvince) {
      possibleRegencies = (await prisma.regency.findMany({
        where: regencyWhere,
        select: {
          id: true,
          name: true,
          type: true,
          code: true,
          fullCode: true,
          label: true,
          province: { select: { id: true, name: true, code: true } }
        }
      })) as RegencyResult[]

      if (possibleRegencies.length === 0) {
        // FALLBACK: Kabupaten/Kota tidak ditemukan, kembalikan hasil parsial terbaik (provinsi)
        bestPartialResult.message = `Pencarian gagal: Kabupaten/Kota tidak ditemukan. Mengembalikan data provinsi yang cocok.`

        return bestPartialResult
      }
    }

    // --- Logika Penelusuran Hierarki untuk Mencari Desa Unik ---
    const regenciesToSearch: RegencyResult[] = possibleRegencies.length > 0 ? possibleRegencies : []

    for (const regency of regenciesToSearch) {
      // SIMPAN HASIL SEMENTARA
      bestPartialResult.province = regency.province
      bestPartialResult.regency = regency
      bestPartialResult.message = `Mencari di Kabupaten/Kota: ${regency.label}.`
      bestPartialResult.failedLevel = 'district'

      const districtWhere: any = { regencyId: regency.id }

      if (districtName) {
        districtWhere.name = createContainsCondition(districtName)
      }

      const districtsFoundInThisRegency = (await prisma.district.findMany({
        where: districtWhere,
        select: {
          id: true,
          name: true,
          code: true,
          fullCode: true,
          regency: {
            select: {
              id: true,
              name: true,
              type: true,
              label: true,
              code: true,
              fullCode: true,
              province: { select: { id: true, name: true, code: true } }
            }
          }
        },

        // Jika nama kecamatan spesifik, cek ambiguitas. Jika tidak, ambil semua kecamatan.
        take: districtName ? 2 : undefined
      })) as DistrictResult[]

      // Jika kita mencari nama kecamatan tertentu TAPI hasilnya ambigu (>1) atau tidak ketemu (0),
      // maka jalur ini tidak valid, jadi kita `continue` ke kabupaten berikutnya.
      if (districtName && districtsFoundInThisRegency.length !== 1) {
        continue
      }

      if (districtsFoundInThisRegency.length === 0) {
        // Tidak ada kecamatan yang cocok di kabupaten ini, coba kabupaten berikutnya.
        continue
      }

      // Jika districtName tidak spesifik, kita harus loop semua kecamatan yang ditemukan.
      for (const district of districtsFoundInThisRegency) {
        // SIMPAN HASIL SEMENTARA
        bestPartialResult.district = district
        bestPartialResult.message = `Mencari di Kecamatan: ${district.name}.`
        bestPartialResult.failedLevel = 'village'

        const villagesFoundInThisPath = (await prisma.village.findMany({
          where: {
            districtId: district.id,
            name: createContainsCondition(cleanedVillageName)
          },
          select: {
            id: true,
            name: true,
            code: true,
            fullCode: true,
            postalCode: true,
            district: {
              select: {
                id: true,
                name: true,
                code: true,
                fullCode: true,
                regency: {
                  select: {
                    id: true,
                    name: true,
                    type: true,
                    label: true,
                    code: true,
                    fullCode: true,
                    province: { select: { id: true, name: true, code: true } }
                  }
                }
              }
            }
          },
          take: 2 // Ambil 2 untuk memeriksa apakah hasilnya unik atau ambigu.
        })) as VillageResult[]

        if (villagesFoundInThisPath.length === 1) {
          // >>> SUKSES TOTAL! Desa unik ditemukan.
          return {
            province: villagesFoundInThisPath[0].district.regency.province,
            regency: villagesFoundInThisPath[0].district.regency,
            district: villagesFoundInThisPath[0].district,
            village: villagesFoundInThisPath[0],
            message: 'Pencarian desa berhasil: Satu lokasi spesifik ditemukan.',
            failedLevel: undefined
          }
        }
      }
    }

    // --- FALLBACK FINAL ---
    // Jika seluruh loop selesai tanpa mengeksekusi `return` di atas,
    // itu berarti desa unik tidak pernah ditemukan.
    // Maka, kita kembalikan hasil parsial terbaik yang berhasil kita simpan.
    return bestPartialResult
  } catch (error) {
    console.error('Error during search with fallback:', error)

    return {
      message: 'Terjadi kesalahan internal saat mencari wilayah. Silakan coba lagi.',
      failedLevel: 'unknown'
    }
  }
}

interface SearchResultPartial {
  province?: ProvinceResult
  regency?: RegencyResult
  district?: DistrictResult
  village?: VillageResult
  message: string
  failedLevel?: 'province' | 'regency' | 'district' | 'village' | 'validation' | 'unknown'
}

/**
 * Mencari wilayah secara top-down dan mengembalikan hasil terjauh yang dapat ditemukan secara unik.
 * Fungsi ini akan berhenti mencari jika suatu tingkat tidak ditemukan atau hasilnya ambigu (lebih dari satu).
 * Dianggap berhasil jika minimal provinsi ditemukan secara unik.
 *
 * @param {string} [provinceName] - Nama provinsi (paling direkomendasikan untuk memulai).
 * @param {string} [regencyLabel] - Label kabupaten/kota.
 * @param {string} [districtName] - Nama kecamatan.
 * @param {string} [villageName] - Nama desa/kelurahan.
 * @returns {Promise<SearchResultPartial>} Objek yang berisi hasil pencarian parsial dan status.
 */
export async function searchWilayahHybrid(
  provinceName?: string,
  regencyLabel?: string,
  districtName?: string,
  villageName?: string
): Promise<SearchResultPartial> {
  // --- Validasi Awal ---
  if (!provinceName && !regencyLabel && !districtName && !villageName) {
    return {
      message: 'Pencarian gagal: Harap berikan setidaknya satu kriteria pencarian.',
      failedLevel: 'validation'
    }
  }

  // Objek untuk menyimpan hasil parsial TERBAIK yang ditemukan selama pencarian
  const bestPartialResult: SearchResultPartial = {
    message: 'Pencarian dimulai...',
    failedLevel: 'unknown'
  }

  const createContainsCondition = (name: string) => ({
    contains: name.toLowerCase(),
    mode: 'insensitive' as const
  })

  try {
    let currentProvince: ProvinceResult | undefined
    let possibleRegencies: RegencyResult[] = []

    // 1. Cari Provinsi (Wajib untuk memulai pencarian agresif)
    if (provinceName) {
      const provincesFound = (await prisma.province.findMany({
        where: { name: createContainsCondition(provinceName) },
        select: { id: true, name: true, code: true },
        take: 2
      })) as ProvinceResult[]

      if (provincesFound.length !== 1) {
        bestPartialResult.message =
          provincesFound.length > 1
            ? `Pencarian gagal: Provinsi '${provinceName}' ambigu.`
            : `Pencarian gagal: Provinsi '${provinceName}' tidak ditemukan.`
        bestPartialResult.failedLevel = 'province'

        return bestPartialResult
      }

      currentProvince = provincesFound[0]
      bestPartialResult.province = currentProvince // Simpan sebagai hasil parsial terbaik sementara
    } else {
      return { message: 'Pencarian agresif memerlukan nama provinsi.', failedLevel: 'validation' }
    }

    // 2. Tentukan Kabupaten/Kota yang akan ditelusuri
    if (regencyLabel) {
      possibleRegencies = (await prisma.regency.findMany({
        where: {
          provinceId: currentProvince.id,
          label: createContainsCondition(regencyLabel)
        },
        select: {
          /* ... select fields ... */
        }
      })) as RegencyResult[]

      if (possibleRegencies.length === 0) {
        bestPartialResult.message = `Pencarian gagal: Kabupaten/Kota '${regencyLabel}' tidak ditemukan di ${currentProvince.name}.`
        bestPartialResult.failedLevel = 'regency'

        return bestPartialResult
      }
    } else {
      // Jika tidak ada label kabupaten, telusuri semua kabupaten di provinsi
      possibleRegencies = (await prisma.regency.findMany({
        where: { provinceId: currentProvince.id },
        select: {
          /* ... select fields ... */
        }
      })) as RegencyResult[]
    }

    // 3. === Loop Pencarian Agresif ===
    // Loop melalui setiap kemungkinan kabupaten untuk menemukan jalur yang valid ke desa
    for (const regency of possibleRegencies) {
      // Update hasil parsial terbaik saat ini
      bestPartialResult.regency = regency
      bestPartialResult.district = undefined // Reset level yang lebih dalam
      bestPartialResult.village = undefined

      const districtWhere: any = { regencyId: regency.id }

      if (districtName) {
        districtWhere.name = createContainsCondition(districtName)
      }

      const districtsFound = (await prisma.district.findMany({
        where: districtWhere,
        select: {
          /* ... select fields ... */
        }
      })) as DistrictResult[]

      // Telusuri setiap kecamatan yang ditemukan
      for (const district of districtsFound) {
        bestPartialResult.district = district // Update lagi hasil parsial terbaik

        const villageWhere: any = { districtId: district.id }

        if (villageName) {
          villageWhere.name = createContainsCondition(cleanVillageName(villageName))
        }

        const villagesFound = (await prisma.village.findMany({
          where: villageWhere,
          select: {
            /* ... select fields ... */
          },
          take: 2 // Ambil 2 untuk memeriksa ambiguitas
        })) as VillageResult[]

        // >> KONDISI SUKSES UTAMA <<
        if (villagesFound.length === 1) {
          const finalVillage = villagesFound[0]

          // Jika ditemukan SATU desa unik, pencarian berhasil! Langsung kembalikan.
          return {
            province: finalVillage.district.regency.province,
            regency: finalVillage.district.regency,
            district: finalVillage.district,
            village: finalVillage,
            message: 'Pencarian agresif berhasil: Satu lokasi desa unik ditemukan.',
            failedLevel: undefined
          }
        }

        // Jika desa ambigu ( > 1) atau tidak ditemukan (0), loop terus mencari di kecamatan/kabupaten lain.
        // `bestPartialResult` akan tetap menyimpan jejak terakhir yang paling dalam.
      }
    }

    // 4. === Logika Fallback ===
    // Jika loop selesai tanpa menemukan desa unik, artinya pencarian agresif gagal.
    // Sekarang, kita kembalikan `bestPartialResult` yang telah kita lacak.
    if (bestPartialResult.district) {
      bestPartialResult.message = `Pencarian desa unik gagal. Hasil terdekat ditemukan hingga tingkat Kecamatan: ${bestPartialResult.district.name}.`
      bestPartialResult.failedLevel = 'village' // Gagal di level desa
    } else if (bestPartialResult.regency) {
      bestPartialResult.message = `Pencarian desa unik gagal. Hasil terdekat ditemukan hingga tingkat Kabupaten/Kota: ${bestPartialResult.regency.label}.`
      bestPartialResult.failedLevel = 'district' // Gagal di level kecamatan
    } else {
      // Ini berarti hanya provinsi yang ditemukan
      bestPartialResult.message = `Pencarian desa unik gagal. Hanya provinsi yang dapat diidentifikasi.`
      bestPartialResult.failedLevel = 'regency'
    }

    return bestPartialResult
  } catch (error) {
    console.error('Error during hybrid wilayah search:', error)

    return {
      message: 'Terjadi kesalahan internal saat mencari wilayah.',
      failedLevel: 'unknown'
    }
  }
}

export async function searchWilayahOrderedPartialFlexible(
  provinceName?: string,
  regencyLabel?: string,
  districtName?: string,
  villageName?: string
): Promise<SearchResultPartial> {
  try {
    const result: SearchResultPartial = {
      message: 'Tidak ada data wilayah ditemukan.',
      failedLevel: undefined
    }

    const createContains = (s: string) => ({ contains: s, mode: 'insensitive' as const })

    // --- Provinsi ---
    if (!provinceName) {
      result.failedLevel = 'province'
      result.message = 'Province wajib ada.'

      return result
    }

    const provinces = await prisma.province.findMany({
      where: { name: createContains(provinceName) },
      select: { id: true, name: true, code: true },
      take: 2
    })

    if (provinces.length === 0) {
      result.failedLevel = 'province'
      result.message = `Provinsi '${provinceName}' tidak ditemukan.`

      return result
    } else if (provinces.length > 1) {
      result.failedLevel = 'province'
      result.message = `Lebih dari satu provinsi cocok dengan '${provinceName}'.`

      return result
    }

    const province = provinces[0]

    result.province = province

    // --- Kabupaten/Kota ---
    let regency: RegencyResult | undefined

    if (regencyLabel) {
      const regencyWhere: any = { label: createContains(regencyLabel), provinceId: province.id }

      const regencies = await prisma.regency.findMany({
        where: regencyWhere,
        select: {
          id: true,
          name: true,
          type: true,
          code: true,
          fullCode: true,
          label: true,
          province: { select: { id: true, name: true, code: true } }
        },
        take: 2
      })

      if (regencies.length > 0) {
        regency = regencies[0]
        result.regency = regency

        if (regencies.length > 1) {
          result.message = `Lebih dari satu Kabupaten/Kota cocok dengan '${regencyLabel}', menggunakan yang pertama.`
        }
      } else {
        result.message = `Kabupaten/Kota '${regencyLabel}' tidak ditemukan.`
      }
    } else {
      const regencies = await prisma.regency.findMany({
        where: { provinceId: province.id },
        select: {
          id: true,
          name: true,
          type: true,
          code: true,
          fullCode: true,
          label: true,
          province: { select: { id: true, name: true, code: true } }
        }
      })

      if (regencies.length > 0) {
        regency = regencies[0]
        result.regency = regency
      }
    }

    // --- Kecamatan ---
    let district: DistrictResult | undefined

    if (districtName && regency) {
      const districts = await prisma.district.findMany({
        where: { regencyId: regency.id, name: createContains(districtName) },
        select: {
          id: true,
          name: true,
          code: true,
          fullCode: true,
          regency: {
            select: {
              id: true,
              name: true,
              type: true,
              code: true,
              fullCode: true,
              label: true,
              province: { select: { id: true, name: true, code: true } }
            }
          }
        },
        take: 2
      })

      if (districts.length > 0) {
        district = districts[0]
        result.district = district

        if (districts.length > 1) {
          result.message = `Lebih dari satu Kecamatan cocok dengan '${districtName}', menggunakan yang pertama.`
        }
      } else {
        result.message = `Kecamatan '${districtName}' tidak ditemukan.`
      }
    }

    // --- Desa ---
    if (villageName && district) {
      const cleanedName = cleanVillageName(villageName)

      if (cleanedName) {
        const villages = await prisma.village.findMany({
          where: { districtId: district.id, name: createContains(cleanedName) },
          select: {
            id: true,
            name: true,
            code: true,
            fullCode: true,
            postalCode: true,
            district: {
              select: {
                id: true,
                name: true,
                code: true,
                fullCode: true,
                regency: {
                  select: {
                    id: true,
                    name: true,
                    type: true,
                    code: true,
                    fullCode: true,
                    label: true,
                    province: { select: { id: true, name: true, code: true } }
                  }
                }
              }
            }
          },
          take: 2
        })

        if (villages.length > 0) {
          result.village = villages[0]

          if (villages.length > 1) {
            result.message = `Lebih dari satu Desa cocok dengan '${villageName}', menggunakan yang pertama.`
          } else {
            result.message = 'Desa ditemukan.'
          }
        } else {
          result.message = `Desa '${villageName}' tidak ditemukan.`
        }
      }
    }

    // Hasil minimal valid: province sudah ada → dianggap valid
    result.failedLevel = undefined

    return result
  } catch (err) {
    console.error('searchWilayahOrderedPartialFlexible error:', err)

    return { message: 'Terjadi kesalahan internal.', failedLevel: 'unknown' }
  }
}
