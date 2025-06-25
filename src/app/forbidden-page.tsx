// Component Imports

import Providers from '@components/Providers'
import BlankLayout from '@layouts/BlankLayout'

// Util Imports
import { getServerMode, getSystemMode } from '@core/utils/serverHelpers'
import Forbidden from '@/components/forbidden'

const ForbiddenPage = async () => {
  // Vars
  const direction = 'ltr'
  const mode = await getServerMode()
  const systemMode = await getSystemMode()

  return (
    <Providers direction={direction}>
      <BlankLayout systemMode={systemMode}>
        <Forbidden mode={mode} />
      </BlankLayout>
    </Providers>
  )
}

export default ForbiddenPage
