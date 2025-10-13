'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { apiGet, apiPost } from '@/lib/api'
import type { Template } from '@/schemas/survey-schemas'

/* =========================
   Helpers (multipart + progress)
   ========================= */
type JsonPayload = { studentId: string; answers: Record<string, any> }
type MultipartPayload = { formData: FormData }

// XHR dipakai agar bisa menangkap progress upload (fetch belum expose upload progress)
function xhrPost<T = any>(
  url: string,
  body: FormData,
  onUploadProgress?: (pct: number, ev: ProgressEvent<EventTarget>) => void
): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.open('POST', url)

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText))
        } catch {
          // fallback kalau server tidak balas JSON
          // @ts-expect-error – biarkan T fleksibel
          resolve(xhr.responseText)
        }
      } else {
        reject(new Error(xhr.responseText || `HTTP ${xhr.status}`))
      }
    }

    xhr.onerror = () => reject(new Error('Network error'))

    if (xhr.upload && onUploadProgress) {
      xhr.upload.onprogress = ev => {
        if (ev.lengthComputable) {
          const pct = Math.round((ev.loaded / ev.total) * 100)

          onUploadProgress(pct, ev)
        } else {
          onUploadProgress(0, ev)
        }
      }
    }

    xhr.send(body)
  })
}

/* =========================
   Queries
   ========================= */
export function useActivePeriod() {
  return useQuery({
    queryKey: ['periods', 'active'],
    queryFn: async () => {
      const { data } = await apiGet<{
        data: {
          hasResponded: any
          id: string
          name: string
          template: Template
        }
      }>('/api/periods/active')

      return data
    }
  })
}

export function useFindStudentByNIS(nis: string, enabled: boolean, periodId?: string) {
  return useQuery({
    queryKey: ['students', 'nis', nis],
    enabled: enabled && !!nis,
    queryFn: async () => {
      const { data } = await apiGet<{ data: any }>(`/api/students/nis/${encodeURIComponent(nis)}?periodId=${periodId}`)

      return data as {
        hasResponded: any
        id: string
        nis: string
        name: string
        class?: string
        school?: string
        address?: string
      }
    }
  })
}

/* =========================
   Mutation (JSON or FormData + progress)
   ========================= */
export function useSubmitResponse(
  periodId: string,
  opts?: { onUploadProgress?: (pct: number, ev: ProgressEvent<EventTarget>) => void }
) {
  const qc = useQueryClient()

  return useMutation({
    // payload bisa JSON (lama) atau FormData (baru)
    mutationFn: async (payload: JsonPayload | MultipartPayload) => {
      const url = `/api/periods/${periodId}/responses`

      if ('formData' in payload) {
        // multipart (punya progress)
        return xhrPost<{ data: any }>(url, payload.formData, opts?.onUploadProgress)
      }

      // JSON (lama) – tetap gunakan apiPost helper bawaan
      const { data } = await apiPost<{ data: any }>(url, payload)

      return data
    },
    onSuccess: () => {
      // refresh stats periode setelah submit sukses
      qc.invalidateQueries({ queryKey: ['periods', periodId, 'stats'] })
    }
  })
}

export function usePeriodStats(periodId?: string) {
  return useQuery({
    queryKey: ['periods', periodId, 'stats'],
    enabled: !!periodId,
    queryFn: async () => {
      const { data } = await apiGet<{ data: any }>(`/api/periods/${periodId}/stats`)

      return data
    }
  })
}
