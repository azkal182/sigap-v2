// 'use client'

// import * as React from 'react'

// import type { ConfirmModalProps } from '@/components/ConfirmModal'
// import { ConfirmModal } from '@/components/ConfirmModal'

// type ConfirmOptions = Omit<ConfirmModalProps, 'open' | 'onClose' | 'loading' | 'dialogProps'>

// type ConfirmContextValue = (opts?: ConfirmOptions) => Promise<boolean>

// const ConfirmContext = React.createContext<ConfirmContextValue | null>(null)

// export function ConfirmProvider({ children }: { children: React.ReactNode }) {
//   const [state, setState] = React.useState<{
//     open: boolean
//     resolve?: (v: boolean) => void
//     opts?: ConfirmOptions
//     loading?: boolean
//   }>({ open: false })

//   const confirm = React.useCallback<ConfirmContextValue>(opts => {
//     return new Promise<boolean>(resolve => {
//       setState({ open: true, resolve, opts })
//     })
//   }, [])

//   const handleClose = () => {
//     setState(s => {
//       s.resolve?.(false)

//       return { open: false }
//     })
//   }

//   const handleConfirm = async () => {
//     const { opts } = state

//     try {
//       if (opts?.onConfirm) {
//         setState(s => ({ ...s, loading: true }))
//         await opts.onConfirm() // kalau ada side-effect custom
//       }

//       state.resolve?.(true)
//     } finally {
//       setState({ open: false })
//     }
//   }

//   const { opts, open, loading } = state

//   return (
//     <ConfirmContext.Provider value={confirm}>
//       {children}
//       <ConfirmModal
//         open={open}
//         onClose={handleClose}
//         onConfirm={handleConfirm}
//         title={opts?.title ?? 'Confirm action'}
//         description={opts?.description}
//         confirmText={opts?.confirmText ?? 'Yes, continue'}
//         cancelText={opts?.cancelText ?? 'Cancel'}
//         confirmColor={opts?.confirmColor ?? 'error'}
//         icon={opts?.icon ?? <i color='warning' className='tabler-alert-triangle ' />}
//         loading={!!loading}
//         disableBackdropClose={opts?.disableBackdropClose ?? true}
//       />
//     </ConfirmContext.Provider>
//   )
// }

// export function useConfirm() {
//   const ctx = React.useContext(ConfirmContext)

//   if (!ctx) throw new Error('useConfirm must be used within <ConfirmProvider>')

//   return ctx
// }

'use client'

import * as React from 'react'

import type { ConfirmModalProps } from '@/components/ConfirmModal'
import { ConfirmModal } from '@/components/ConfirmModal'

type ConfirmOptions = Omit<ConfirmModalProps, 'open' | 'onClose' | 'loading' | 'dialogProps'>

type ConfirmContextValue = (opts?: ConfirmOptions) => Promise<boolean>

const ConfirmContext = React.createContext<ConfirmContextValue | null>(null)

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<{
    open: boolean
    resolve?: (v: boolean) => void
    opts?: ConfirmOptions
    lastOpts?: ConfirmOptions
    loading?: boolean
  }>({ open: false })

  const confirm = React.useCallback<ConfirmContextValue>(opts => {
    return new Promise<boolean>(resolve => {
      setState({ open: true, resolve, opts, lastOpts: opts })
    })
  }, [])

  const handleClose = () => {
    setState(s => {
      s.resolve?.(false)

      return { open: false, lastOpts: s.lastOpts } // simpan lastOpts
    })
  }

  const handleConfirm = async () => {
    const { opts } = state

    try {
      if (opts?.onConfirm) {
        setState(s => ({ ...s, loading: true }))
        await opts.onConfirm()
      }

      state.resolve?.(true)
    } finally {
      setState(s => ({
        open: false,
        lastOpts: s.lastOpts // simpan nilai terakhir
      }))
    }
  }

  const { opts, open, loading, lastOpts } = state
  const modalOpts = opts ?? lastOpts

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmModal
        open={open}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title={modalOpts?.title ?? 'Confirm action'}
        description={modalOpts?.description}
        confirmText={modalOpts?.confirmText ?? 'Yes, continue'}
        cancelText={modalOpts?.cancelText ?? 'Cancel'}
        confirmColor={modalOpts?.confirmColor ?? 'error'}
        icon={modalOpts?.icon ?? <i className='tabler-alert-triangle' color='warning' />}
        loading={!!loading}
        disableBackdropClose={opts?.disableBackdropClose ?? true}
      />
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = React.useContext(ConfirmContext)

  if (!ctx) throw new Error('useConfirm must be used within <ConfirmProvider>')

  return ctx
}
