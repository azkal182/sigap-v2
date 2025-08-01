// 'use client'

// import Link from 'next/link'

// export type BreadcrumbItem = {
//   label: string
//   href: string
// }

// type BreadcrumbsProps = {
//   items: BreadcrumbItem[]
// }

// export const Breadcrumbs = ({ items }: BreadcrumbsProps) => {
//   return (
//     <nav aria-label='breadcrumb' className='text-sm text-gray-600 mb-4'>
//       <ol className='flex flex-wrap items-center space-x-1'>
//         {items.map((item, index) => (
//           <li key={item.href} className='flex items-center'>
//             {index !== 0 && <i className='tabler-chevron-right text-red-400' />}
//             {index === items.length - 1 ? (
//               <span className='text-gray-500'>{item.label}</span>
//             ) : (
//               <Link href={item.href} className='hover:underline text-blue-600'>
//                 {item.label}
//               </Link>
//             )}
//           </li>
//         ))}
//       </ol>
//     </nav>
//   )
// }

'use client'

import Link from 'next/link'

import { Breadcrumbs as MUIBreadcrumbs, Typography } from '@mui/material'

export type BreadcrumbItem = {
  label: string
  href: string
}

type BreadcrumbsProps = {
  items: BreadcrumbItem[]
}

export const Breadcrumbs = ({ items }: BreadcrumbsProps) => {
  const lastIndex = items.length - 1

  return (
    <MUIBreadcrumbs aria-label='breadcrumb' sx={{ mb: 2 }}>
      {items.map((item, index) =>
        index === lastIndex ? (
          <Typography key={item.href} color='text.primary'>
            {item.label}
          </Typography>
        ) : (
          <Link key={item.href} href={item.href} passHref legacyBehavior>
            <Typography
              component='a'
              color='inherit'
              sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
            >
              {item.label}
            </Typography>
          </Link>
        )
      )}
    </MUIBreadcrumbs>
  )
}
