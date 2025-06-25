// MUI Imports
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript'
import { Bounce, ToastContainer } from 'react-toastify'

// Third-party Imports
import 'react-perfect-scrollbar/dist/css/styles.css'

// Type Imports
import type { ChildrenType } from '@core/types'

// Util Imports
import { getSystemMode } from '@core/utils/serverHelpers'

// Style Imports
import '@/app/globals.css'

// Generated Icon CSS Imports
import '@assets/iconify-icons/generated-icons.css'
import NextAuthProviders from '@/components/providers/next-auth-providers'
import { auth } from '@/lib/auth'

export const metadata = {
  title: 'Sigap - PPDF',
  description: 'Sigap - PPDF'
}

const RootLayout = async (props: ChildrenType) => {
  const { children } = props

  // Vars

  const systemMode = await getSystemMode()
  const direction = 'ltr'

  const session = await auth()

  return (
    <html id='__next' lang='en' dir={direction} suppressHydrationWarning>
      <body className='flex is-full min-bs-full flex-auto flex-col'>
        <InitColorSchemeScript attribute='data' defaultMode={systemMode} />
        <NextAuthProviders session={session}>{children}</NextAuthProviders>
        <ToastContainer
          position='bottom-right'
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick={false}
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme='light'
          transition={Bounce}
        />{' '}
      </body>
    </html>
  )
}

export default RootLayout
