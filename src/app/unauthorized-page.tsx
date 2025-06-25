// Component Imports

import Providers from '@components/Providers'
import BlankLayout from '@layouts/BlankLayout'

// Util Imports
import { getServerMode, getSystemMode } from '@core/utils/serverHelpers'
import NotAuthorized from '@/components/NotAuthorized'

const UnAuthorizedPage = async () => {
  // Vars
  const direction = 'ltr'
  const mode = await getServerMode()
  const systemMode = await getSystemMode()

  return (
    <Providers direction={direction}>
      <BlankLayout systemMode={systemMode}>
        <NotAuthorized mode={mode} />
      </BlankLayout>
    </Providers>
  )
}

export default UnAuthorizedPage
