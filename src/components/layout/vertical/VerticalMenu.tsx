// MUI Imports
import { useTheme } from '@mui/material/styles'

// Third-party Imports
import PerfectScrollbar from 'react-perfect-scrollbar'

// Type Imports
import type { VerticalMenuContextProps } from '@menu/components/vertical-menu/Menu'

// Component Imports
import { Menu, MenuItem, MenuSection } from '@menu/vertical-menu'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'

// Styled Component Imports
import StyledVerticalNavExpandIcon from '@menu/styles/vertical/StyledVerticalNavExpandIcon'

// Style Imports
import menuItemStyles from '@core/styles/vertical/menuItemStyles'
import menuSectionStyles from '@core/styles/vertical/menuSectionStyles'
import { permissionHelper } from '@/utils/permission-helper'

type RenderExpandIconProps = {
  open?: boolean
  transitionDuration?: VerticalMenuContextProps['transitionDuration']
}

type Props = {
  scrollMenu: (container: any, isPerfectScrollbar: boolean) => void
}

const RenderExpandIcon = ({ open, transitionDuration }: RenderExpandIconProps) => (
  <StyledVerticalNavExpandIcon open={open} transitionDuration={transitionDuration}>
    <i className='tabler-chevron-right' />
  </StyledVerticalNavExpandIcon>
)

export type MenuConfigItem = {
  title: string
  href: string
  icon?: string
  permissions?: string[]
}

export type MenuConfigSection = {
  label: string
  items: MenuConfigItem[]
}

export const menuItems: MenuConfigSection[] = [
  {
    label: 'PUSAT',
    items: [
      { title: 'Laporan', href: '/report', icon: 'tabler-currency-dollar', permissions: ['report:view'] },
      { title: 'Transaksi', href: '/transaction', icon: 'tabler-users', permissions: ['transaction:view'] }
    ]
  },
  {
    label: 'Absensi',
    items: [
      {
        title: 'Absensi',
        href: '/attendance',
        icon: 'tabler-presentation-analytics',
        permissions: ['attendance:view']
      },

      {
        title: 'Daftar Absensi Santri',
        href: '/attendance/list-attendance-student',
        icon: 'tabler-report',
        permissions: ['report-attend:view']
      },
      {
        title: 'Daftar Absensi Pengajar',
        href: '/attendance/list-attendance-teacher',
        icon: 'tabler-report',
        permissions: ['report-attend:view']
      }
    ]
  },
  {
    label: 'Pengajar',
    items: [
      {
        title: 'Jadwal Pelajaran',
        href: '/schedule',
        icon: 'tabler-presentation-analytics',
        permissions: ['attendance:view']
      }
    ]
  },
  {
    label: 'Asrama',
    items: [
      { title: 'Santri', href: '/dormitory/student', icon: 'tabler-school', permissions: ['dormitory.student:view'] },
      { title: 'Izin', href: '/dormitory/permit', icon: 'tabler-license-off', permissions: ['dormitory.permit:view'] },
      { title: 'Laporan', href: '/dormitory/report', icon: 'tabler-report', permissions: ['dormitory.report:view'] },
      {
        title: 'Validasi Absensi Santri',
        href: '/dormitory/validate-student',
        icon: 'tabler-copy-check',
        permissions: ['dormitory.validation.student:view']
      },
      {
        title: 'Validasi Absensi Pengajar',
        href: '/dormitory/validate-teacher',
        icon: 'tabler-copy-check',
        permissions: ['dormitory.validation.teacher:view']
      },
      {
        title: 'Jadwal Pelajaran',
        href: '/dormitory/schedule',
        icon: 'tabler-calendar-due',
        permissions: ['dormitory.schedul:view']
      },
      {
        title: 'Pengajar',
        href: '/dormitory/teacher',
        icon: 'tabler-brand-tether',
        permissions: ['dormitory.teacher:view']
      },
      {
        title: 'Fan',
        href: '/dormitory/track',
        icon: 'tabler-brand-tether',
        permissions: ['dormitory.track:view']
      }
    ]
  },
  {
    label: 'AKADEMIK',
    items: [
      { title: 'Daftar Tes', href: '/academic/test-registration', icon: 'tabler-users', permissions: ['user:view'] },
      { title: 'Hasil Tes', href: '/academic/result-registration', icon: 'tabler-key', permissions: ['role:view'] }
    ]
  },
  {
    label: 'Data',
    items: [
      { title: 'Santri', href: '/data/student', icon: 'tabler-school', permissions: ['student:view'] },
      { title: 'Asrama', href: '/data/dormitory', icon: 'tabler-building-skyscraper', permissions: ['dormitory:view'] },
      {
        title: 'Pengajar',
        href: '/data/teacher',
        icon: 'tabler-brand-tether',
        permissions: ['student:view']
      },
      {
        title: 'Kelas',
        href: '/data/class',
        icon: 'tabler-brand-tether',
        permissions: ['student:view']
      }
    ]
  },
  {
    label: 'ADMIN',
    items: [
      { title: 'Users', href: '/admin/user', icon: 'tabler-users', permissions: ['user:view'] },
      { title: 'Role', href: '/admin/role', icon: 'tabler-key', permissions: ['role:view'] },
      { title: 'Import', href: '/admin/import', icon: 'tabler-upload', permissions: ['role:view'] }
    ]
  }
]

const VerticalMenu = ({ scrollMenu }: Props) => {
  // Hooks
  const theme = useTheme()
  const verticalNavOptions = useVerticalNav()

  // Vars
  const { isBreakpointReached, transitionDuration } = verticalNavOptions

  const ScrollWrapper = isBreakpointReached ? 'div' : PerfectScrollbar
  const accessibleMenu = permissionHelper.filterAccessibleMenu(menuItems)

  return (
    // eslint-disable-next-line lines-around-comment
    /* Custom scrollbar instead of browser scroll, remove if you want browser scroll only */
    <ScrollWrapper
      {...(isBreakpointReached
        ? {
            className: 'bs-full overflow-y-auto overflow-x-hidden',
            onScroll: container => scrollMenu(container, false)
          }
        : {
            options: { wheelPropagation: false, suppressScrollX: true },
            onScrollY: container => scrollMenu(container, true)
          })}
    >
      {/* Incase you also want to scroll NavHeader to scroll with Vertical Menu, remove NavHeader from above and paste it below this comment */}
      {/* Vertical Menu */}
      <Menu
        popoutMenuOffset={{ mainAxis: 23 }}
        menuItemStyles={menuItemStyles(verticalNavOptions, theme)}
        renderExpandIcon={({ open }) => <RenderExpandIcon open={open} transitionDuration={transitionDuration} />}
        renderExpandedMenuItemIcon={{ icon: <i className='tabler-circle text-xs' /> }}
        menuSectionStyles={menuSectionStyles(verticalNavOptions, theme)}
      >
        <MenuItem href='/home' icon={<i className='tabler-smart-home' />}>
          Home
        </MenuItem>
        {accessibleMenu.map(section => (
          <MenuSection key={section.label} label={section.label}>
            {section.items.map(item => (
              <MenuItem key={item.href} href={item.href} icon={<i className={item.icon} />}>
                {item.title}
              </MenuItem>
            ))}
          </MenuSection>
        ))}
        {/* <MenuItem href='/home' icon={<i className='tabler-smart-home' />}>
          Home
        </MenuItem>
        <MenuSection label='Absensi'>
          <MenuItem href='/about' icon={<i className='tabler-info-circle' />}>
            About
          </MenuItem>
        </MenuSection>

        <MenuSection label='Admin'>
          <MenuItem href='/admin/role' icon={<i className='tabler-info-circle' />}>
            Role
          </MenuItem>
        </MenuSection> */}
      </Menu>
      {/* <Menu
        popoutMenuOffset={{ mainAxis: 23 }}
        menuItemStyles={menuItemStyles(verticalNavOptions, theme)}
        renderExpandIcon={({ open }) => <RenderExpandIcon open={open} transitionDuration={transitionDuration} />}
        renderExpandedMenuItemIcon={{ icon: <i className='tabler-circle text-xs' /> }}
        menuSectionStyles={menuSectionStyles(verticalNavOptions, theme)}
      >
        <GenerateVerticalMenu menuData={menuData(dictionary)} />
      </Menu> */}
    </ScrollWrapper>
  )
}

export default VerticalMenu
