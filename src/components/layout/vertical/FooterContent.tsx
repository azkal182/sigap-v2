'use client'

// Next Imports
import Link from 'next/link'

// Third-party Imports
import classnames from 'classnames'

// Hook Imports

// Util Imports
import { verticalLayoutClasses } from '@layouts/utils/layoutClasses'

const FooterContent = () => {
  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION

  return (
    <div
      className={classnames(verticalLayoutClasses.footerContent, 'flex items-center justify-between flex-wrap gap-4')}
    >
      <p>
        <span className='text-textSecondary'>{`© ${new Date().getFullYear()}, dibuat dengan `}</span>
        <span>{`❤️`}</span>
        <span className='text-textSecondary'>{` by `}</span>
        <Link href='https://amtsilatipusat.net/' target='_blank' className='text-primary uppercase'>
          PPDF
        </Link>
        {appVersion && <span className='text-textSecondary'>{` Versi ${appVersion}`}</span>}
      </p>
    </div>
  )
}

export default FooterContent
