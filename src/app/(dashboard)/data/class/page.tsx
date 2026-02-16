import React from 'react'

import ClassPageView from '@/features/data/class/class-page-view'
import ExportClassesButton from '@/components/common/ExportClassesButton'

const ClassView = () => {
  return (
    <div className='flex flex-col gap-4'>
      <div className='flex justify-end'>
        <ExportClassesButton />
      </div>
      <ClassPageView />
    </div>
  )
}

export default ClassView
