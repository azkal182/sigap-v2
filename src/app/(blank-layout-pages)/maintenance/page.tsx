import React from 'react'

import { getSystemMode } from '@/@core/utils/serverHelpers'
import UnderMaintenance from './UnderMaintenance'

const page = async () => {
  const systemMode = await getSystemMode()

  return <UnderMaintenance mode={systemMode} />
}

export default page
