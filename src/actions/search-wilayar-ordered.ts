// // app/actions/wilayah.ts
// 'use server'

// import type { Province, Regency, District, Village } from '@/generated/prisma'

// import prisma from '@/lib/prisma'

// // --- Definisi Tipe untuk Hasil Prisma ---
// type ProvinceResult = Pick<Province, 'id' | 'name' | 'code'>

// type RegencyResult = Pick<Regency, 'id' | 'name' | 'type' | 'code' | 'fullCode' | 'label'> & {
//   province: Pick<Province, 'name'>
// }

// type DistrictResult = Pick<District, 'id' | 'name' | 'code' | 'fullCode'> & {
//   regency: Pick<Regency, 'name' | 'type' | 'label'>
// }

// type VillageResult = Pick<Village, 'id' | 'name' | 'code' | 'fullCode' | 'postalCode'> & {
//   district: Pick<District, 'name'> & {
//     regency: Pick<Regency, 'name' | 'type' | 'label'> & {
//       province: Pick<Province, 'name'>
//     }
//   }
// }

// // --- Definisi Tipe untuk Objek Kembalian Fungsi ---
// interface SearchResult {
//   province?: ProvinceResult
//   regency?: RegencyResult
//   district?: DistrictResult
//   village?: VillageResult
//   message: string

//   // Properti baru untuk menunjukkan tingkat kegagalan
//   failedLevel?: 'province' | 'regency' | 'district' | 'village' | 'validation' | 'unknown'
// }

// /**
//  * Mencari wilayah secara top-down berdasarkan nama provinsi, label kabupaten/kota, nama kecamatan, dan nama desa.
//  * Fungsi ini dianggap sukses HANYA JIKA sebuah desa yang spesifik berhasil ditemukan.
//  *
//  * @param {string | undefined} [provinceName] - Nama provinsi untuk dicari (opsional).
//  * @param {string | undefined} [regencyLabel] - Label kabupaten/kota untuk dicari (opsional).
//  * @param {string | undefined} [districtName] - Nama kecamatan untuk dicari (opsional).
//  * @param {string | undefined} villageName - Nama desa/kelurahan untuk dicari (WAJIB untuk kesuksesan pencarian).
//  * @returns {Promise<SearchResult>} Objek yang berisi hasil pencarian dan pesan status, serta tingkat kegagalan.
//  */
// export async function searchWilayahOrdered(
//   provinceName?: string,
//   regencyLabel?: string,
//   districtName?: string,
//   villageName?: string
// ): Promise<SearchResult> {
//   try {
//     const result: SearchResult = {
//       message: 'Pencarian gagal: Desa belum ditemukan.',
//       failedLevel: 'unknown' // Default jika tidak ada kasus lain yang cocok
//     }

//     const createContainsCondition = (name: string) => ({
//       contains: name.toLowerCase(),
//       mode: 'insensitive' as const
//     })

//     let currentProvinceId: number | undefined
//     let currentRegencyId: number | undefined
//     let currentDistrictId: number | undefined

//     // --- Validasi Awal: villageName Wajib ada untuk pencarian sukses ---
//     if (!villageName || villageName.trim() === '') {
//       result.message = 'Pencarian desa gagal: Nama desa wajib diisi.'
//       result.failedLevel = 'validation' // Kegagalan validasi input

//       return result
//     }

//     // 1. Cari Provinsi
//     if (provinceName) {
//       const provincesFound = (await prisma.province.findMany({
//         where: {
//           name: createContainsCondition(provinceName)
//         },
//         select: { id: true, name: true, code: true },
//         take: 2
//       })) as ProvinceResult[]

//       if (provincesFound.length === 0) {
//         result.message = `Pencarian gagal: Provinsi '${provinceName}' tidak ditemukan.`
//         result.failedLevel = 'province' // Gagal di level provinsi

//         return result
//       }

//       if (provincesFound.length > 1) {
//         result.message = `Pencarian gagal: Ditemukan lebih dari satu provinsi dengan nama '${provinceName}'. Mohon berikan informasi yang lebih spesifik.`
//         result.failedLevel = 'province' // Ambiguitas di level provinsi

//         return result
//       }

//       result.province = provincesFound[0]
//       currentProvinceId = result.province.id
//     }

//     // 2. Cari Kabupaten/Kota (berdasarkan label)
//     if (regencyLabel) {
//       const regencyWhere: any = {
//         label: createContainsCondition(regencyLabel)
//       }

//       if (currentProvinceId !== undefined) {
//         regencyWhere.provinceId = currentProvinceId
//       } else if (provinceName) {
//         result.message = `Pencarian gagal: Tidak dapat mencari Kabupaten/Kota '${regencyLabel}' karena Provinsi '${provinceName}' tidak ditemukan.`
//         result.failedLevel = 'province' // Gagal karena provinsi tidak ditemukan sebelumnya

//         return result
//       }

//       const regenciesFound = (await prisma.regency.findMany({
//         where: regencyWhere,
//         select: {
//           id: true,
//           name: true,
//           type: true,
//           code: true,
//           fullCode: true,
//           label: true,
//           province: { select: { name: true } }
//         },
//         take: 2
//       })) as RegencyResult[]

//       if (regenciesFound.length === 0) {
//         result.message = `Pencarian gagal: Kabupaten/Kota dengan label '${regencyLabel}' tidak ditemukan${currentProvinceId !== undefined ? ` di Provinsi '${result.province?.name}'` : ''}.`
//         result.failedLevel = 'regency' // Gagal di level kabupaten/kota

//         return result
//       }

//       if (regenciesFound.length > 1) {
//         result.message = `Pencarian gagal: Ditemukan lebih dari satu Kabupaten/Kota dengan label '${regencyLabel}'${currentProvinceId !== undefined ? ` di Provinsi '${result.province?.name}'` : ''}. Mohon berikan informasi yang lebih spesifik.`
//         result.failedLevel = 'regency' // Ambiguitas di level kabupaten/kota

//         return result
//       }

//       result.regency = regenciesFound[0]
//       currentRegencyId = result.regency.id
//     }

//     // 3. Cari Kecamatan
//     if (districtName) {
//       const districtWhere: any = {
//         name: createContainsCondition(districtName)
//       }

//       if (currentRegencyId !== undefined) {
//         districtWhere.regencyId = currentRegencyId
//       } else if (regencyLabel) {
//         result.message = `Pencarian gagal: Tidak dapat mencari Kecamatan '${districtName}' karena Kabupaten/Kota dengan label '${regencyLabel}' tidak ditemukan.`
//         result.failedLevel = 'regency' // Gagal karena kabupaten/kota tidak ditemukan sebelumnya

//         return result
//       } else if (currentProvinceId !== undefined) {
//         const regenciesInProvince = await prisma.regency.findMany({
//           where: { provinceId: currentProvinceId },
//           select: { id: true }
//         })

//         if (regenciesInProvince.length === 0) {
//           // Tidak ada regency di provinsi ini
//           result.message = `Pencarian gagal: Tidak ada Kabupaten/Kota ditemukan di Provinsi '${result.province?.name}', sehingga tidak ada Kecamatan '${districtName}'.`
//           result.failedLevel = 'regency' // Gagal di level kabupaten/kota (karena tidak ada kecamatannya)

//           return result
//         }

//         districtWhere.regencyId = {
//           in: regenciesInProvince.map(r => r.id)
//         }
//       } else if (provinceName) {
//         result.message = `Pencarian gagal: Tidak dapat mencari Kecamatan '${districtName}' karena Provinsi '${provinceName}' tidak ditemukan.`
//         result.failedLevel = 'province' // Gagal karena provinsi tidak ditemukan sebelumnya

//         return result
//       }

//       const districtsFound = (await prisma.district.findMany({
//         where: districtWhere,
//         select: {
//           id: true,
//           name: true,
//           code: true,
//           fullCode: true,
//           regency: { select: { name: true, type: true, label: true } }
//         },
//         take: 2
//       })) as DistrictResult[]

//       if (districtsFound.length === 0) {
//         result.message = `Pencarian gagal: Kecamatan '${districtName}' tidak ditemukan di lokasi yang ditentukan.`
//         result.failedLevel = 'district' // Gagal di level kecamatan

//         return result
//       }

//       if (districtsFound.length > 1) {
//         result.message = `Pencarian gagal: Ditemukan lebih dari satu Kecamatan dengan nama '${districtName}' di lokasi yang ditentukan. Mohon berikan informasi yang lebih spesifik.`
//         result.failedLevel = 'district' // Ambiguitas di level kecamatan

//         return result
//       }

//       result.district = districtsFound[0]
//       currentDistrictId = result.district.id
//     }

//     // 4. Cari Desa (Wajib ada dan ditemukan unik)
//     const villageWhere: any = {
//       name: createContainsCondition(villageName!)
//     }

//     if (currentDistrictId !== undefined) {
//       villageWhere.districtId = currentDistrictId
//     } else if (districtName) {
//       result.message = `Pencarian gagal: Tidak dapat mencari Desa '${villageName}' karena Kecamatan '${districtName}' tidak ditemukan.`
//       result.failedLevel = 'district' // Gagal karena kecamatan tidak ditemukan sebelumnya

//       return result
//     } else if (currentRegencyId !== undefined) {
//       const districtsInRegency = await prisma.district.findMany({
//         where: { regencyId: currentRegencyId },
//         select: { id: true }
//       })

//       if (districtsInRegency.length === 0) {
//         // Tidak ada district di regency ini
//         result.message = `Pencarian gagal: Tidak ada Kecamatan ditemukan di Kabupaten/Kota '${result.regency?.name}', sehingga tidak ada Desa '${villageName}'.`
//         result.failedLevel = 'district' // Gagal di level kecamatan (karena tidak ada desanya)

//         return result
//       }

//       villageWhere.districtId = {
//         in: districtsInRegency.map(d => d.id)
//       }
//     } else if (currentProvinceId !== undefined) {
//       const regenciesInProvince = await prisma.regency.findMany({
//         where: { provinceId: currentProvinceId },
//         select: { id: true }
//       })

//       if (regenciesInProvince.length === 0) {
//         // Tidak ada regency di province ini
//         result.message = `Pencarian gagal: Tidak ada Kabupaten/Kota ditemukan di Provinsi '${result.province?.name}', sehingga tidak ada Desa '${villageName}'.`
//         result.failedLevel = 'regency' // Gagal di level kabupaten/kota (karena tidak ada kecamatannya/desanya)

//         return result
//       }

//       const districtsInRegencies = await prisma.district.findMany({
//         where: { regencyId: { in: regenciesInProvince.map(r => r.id) } },
//         select: { id: true }
//       })

//       if (districtsInRegencies.length === 0) {
//         // Tidak ada district di regencies ini
//         result.message = `Pencarian gagal: Tidak ada Kecamatan ditemukan di Provinsi '${result.province?.name}', sehingga tidak ada Desa '${villageName}'.`
//         result.failedLevel = 'district' // Gagal di level kecamatan (karena tidak ada desanya)

//         return result
//       }

//       villageWhere.districtId = {
//         in: districtsInRegencies.map(d => d.id)
//       }
//     } else if (provinceName) {
//       result.message = `Pencarian gagal: Tidak dapat mencari Desa '${villageName}' karena Provinsi '${provinceName}' tidak ditemukan.`
//       result.failedLevel = 'province' // Gagal karena provinsi tidak ditemukan sebelumnya

//       return result
//     }

//     const villagesFound = (await prisma.village.findMany({
//       where: villageWhere,
//       select: {
//         id: true,
//         name: true,
//         code: true,
//         fullCode: true,
//         postalCode: true,
//         district: {
//           select: {
//             name: true,
//             regency: {
//               select: {
//                 name: true,
//                 type: true,
//                 label: true,
//                 province: { select: { name: true } }
//               }
//             }
//           }
//         }
//       },
//       take: 2
//     })) as VillageResult[]

//     if (villagesFound.length === 0) {
//       result.message = `Pencarian gagal: Desa '${villageName}' tidak ditemukan di lokasi yang ditentukan.`
//       result.failedLevel = 'village' // Gagal di level desa

//       return result
//     }

//     if (villagesFound.length > 1) {
//       result.message = `Pencarian gagal: Ditemukan lebih dari satu Desa dengan nama '${villageName}' di lokasi yang ditentukan. Mohon berikan informasi yang lebih spesifik.`
//       result.failedLevel = 'village' // Ambiguitas di level desa

//       return result
//     }

//     result.village = villagesFound[0]

//     // Jika sampai di sini, berarti desa telah ditemukan secara unik.
//     result.message = 'Pencarian desa berhasil: Satu lokasi spesifik ditemukan.'
//     result.failedLevel = undefined // Reset failedLevel jika sukses

//     return result
//   } catch (error) {
//     console.error('Error during ordered wilayah search:', error)

//     return {
//       message: 'Terjadi kesalahan internal saat mencari wilayah. Silakan coba lagi.',
//       failedLevel: 'unknown' // Kegagalan tak terduga
//     }
//   } finally {
//     await prisma.$disconnect()
//   }
// }

// app/actions/wilayah.ts
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
  } finally {
    await prisma.$disconnect()
  }
}
