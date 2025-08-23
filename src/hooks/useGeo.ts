// hooks/useGeo.ts
import { useQuery } from '@tanstack/react-query'

const fetcher = async (url: string) => {
  const res = await fetch(url)

  if (!res.ok) throw new Error('Network error')

  return res.json()
}

export const useProvinces = (search: string, open: boolean) =>
  useQuery({
    queryKey: ['provinces', search],
    queryFn: () => fetcher(`/api/geo/provinces?search=${encodeURIComponent(search)}`),
    enabled: open,
    staleTime: 5 * 60 * 1000
  })

export const useRegencies = (provinceId?: number, search = '', open = false) =>
  useQuery({
    queryKey: ['regencies', provinceId, search],
    queryFn: () => fetcher(`/api/geo/regencies?provinceId=${provinceId}&search=${encodeURIComponent(search)}`),
    enabled: !!provinceId && open,
    staleTime: 5 * 60 * 1000
  })

export const useDistricts = (regencyId?: number, search = '', open = false) =>
  useQuery({
    queryKey: ['districts', regencyId, search],
    queryFn: () => fetcher(`/api/geo/districts?regencyId=${regencyId}&search=${encodeURIComponent(search)}`),
    enabled: !!regencyId && open,
    staleTime: 5 * 60 * 1000
  })

export const useVillages = (districtId?: number, search = '', open = false) =>
  useQuery({
    queryKey: ['villages', districtId, search],
    queryFn: () => fetcher(`/api/geo/villages?districtId=${districtId}&search=${encodeURIComponent(search)}`),
    enabled: !!districtId && open,
    staleTime: 5 * 60 * 1000
  })
