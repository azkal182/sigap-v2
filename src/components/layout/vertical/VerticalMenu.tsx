// MUI Imports
import { useTheme } from '@mui/material/styles'

// Third-party Imports
import PerfectScrollbar from 'react-perfect-scrollbar'

// Type Imports
import type { VerticalMenuContextProps } from '@menu/components/vertical-menu/Menu'

// Component Imports
import { Menu, MenuItem, MenuSection, SubMenu } from '@menu/vertical-menu'

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
  href?: string
  icon?: string
  permissions?: string[]
  subMenuItems?: MenuConfigItem[]
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
      { title: 'Transaksi', href: '/transaction', icon: 'tabler-users', permissions: ['transaction:view'] },
    ],
  },
  {
    label: 'Perizinan',
    items: [{ title: 'Perizinan', href: '/permit', icon: 'tabler-license-off', permissions: ['permit:view'] }],
  },
  {
    label: 'Absensi',
    items: [
      {
        title: 'Daftar Absensi',
        icon: 'tabler-report',
        permissions: ['attendance:view'],
        subMenuItems: [
          {
            title: 'Santri',
            href: '/attendance/list-attendance-student',
            permissions: ['attendance:view'],
          },
          {
            title: 'Pengajar',
            href: '/attendance/list-attendance-teacher',
            permissions: ['attendance:view'],
          },
        ],
      },
    ],
  },
  {
    label: 'Pengajar',
    items: [
      {
        title: 'Jadwal Pelajaran',
        href: '/schedule',
        icon: 'tabler-presentation-analytics',
        permissions: ['teacher.schedule:view'],
      },
    ],
  },
  {
    label: 'Asrama',
    items: [
      { title: 'Santri', href: '/dormitory/student', icon: 'tabler-school', permissions: ['dormitory.student:view'] },
      {
        title: 'Validasi Absensi Santri',
        href: '/dormitory/validate-student',
        icon: 'tabler-copy-check',
        permissions: ['dormitory.validation.student:view'],
      },
      {
        title: 'Validasi Absensi Pengajar',
        href: '/dormitory/validate-teacher',
        icon: 'tabler-copy-check',
        permissions: ['dormitory.validation.teacher:view'],
      },
      {
        title: 'Jadwal Pelajaran',
        href: '/dormitory/schedule',
        icon: 'tabler-calendar-due',
        permissions: ['dormitory.schedul:view'],
      },
      {
        title: 'Pengajar',
        href: '/dormitory/teacher',
        icon: 'tabler-brand-tether',
        permissions: ['dormitory.teacher:view'],
      },
      {
        title: 'Fan',
        href: '/dormitory/track',
        icon: 'tabler-brand-tether',
        permissions: ['dormitory.track:view'],
      },
    ],
  },

  {
    label: 'AKADEMIK',
    items: [
      {
        title: 'Daftar Tes',
        href: '/academic/test-registration',
        icon: 'tabler-users',
        permissions: ['academic.registration-test:view'],
      },
      {
        title: 'Laporan Target Santri',
        href: '/academic/target-report',
        icon: 'tabler-chart-bar',
        permissions: ['user:view'],
      },
    ],
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
        permissions: ['teacher:view'],
      },

      {
        title: 'Kependudukan',
        href: '/data/penduduk',
        icon: 'tabler-world-plus',
        permissions: ['leadership:view'],
      },
      {
        title: 'Pindah Asrama',
        href: '/data/move-dormitory',
        icon: 'tabler-replace',
        permissions: ['leadership:view'],
      },
      {
        title: 'Kepengurusan',
        icon: 'tabler-report',
        permissions: ['leadership:view'],
        subMenuItems: [
          {
            title: 'Periode Kepengurusan',
            href: '/data/leadership/term-leadership',
            permissions: ['leadership.term:view'],
          },
          {
            title: 'List Kepengurusan',
            href: '/data/leadership/list-leadership',
            permissions: ['leadership.list:view'],
          },
          {
            title: 'Data Kepengurusan',
            href: '/data/leadership/leadership-data',
            permissions: ['leadership.list:view'],
          },
        ],
      },
    ],
  },
  {
    label: 'DAUROH',
    items: [
      {
        title: 'Monitoring dauroh',
        href: '/admin/dauroh',
        icon: 'tabler-video',
        // permissions: ['user:view'],
      },
      {
        title: 'Sinkronasi Wali Kelas',
        href: '/admin/class-teacher-sync',
        icon: 'tabler-link',
        permissions: ['role:view'],
      },
    ],
  },
  {
    label: 'ADMIN',
    items: [
      { title: 'Users', href: '/admin/user', icon: 'tabler-users', permissions: ['user:view'] },
      { title: 'Role', href: '/admin/role', icon: 'tabler-key', permissions: ['role:view'] },
      { title: 'Survey', href: '/admin/periods', icon: 'tabler-chart-dots', permissions: ['user:view'] },
      { title: 'Import', href: '/admin/import', icon: 'tabler-upload', permissions: ['role:view'] },
      { title: 'Import Pengajar', href: '/admin/import-teacher', icon: 'tabler-upload', permissions: ['role:view'] },
    ],
  },
]

const renderMenuItems = (items: MenuConfigItem[]) => {
  return items.map(item => {
    // Cek jika item memiliki subMenu dan tidak kosong
    if (item.subMenuItems && item.subMenuItems.length > 0) {
      return (
        <SubMenu
          key={item.title} // Gunakan title sebagai key unik untuk SubMenu
          label={item.title}
          icon={item.icon ? <i className={item.icon} /> : undefined}
        >
          {/* Panggil fungsi ini lagi untuk anak-anaknya (rekursif) */}
          {renderMenuItems(item.subMenuItems)}
        </SubMenu>
      )
    }

    // Jika tidak punya subMenu, render sebagai MenuItem biasa
    return (
      <MenuItem
        key={item.href} // Gunakan href sebagai key unik untuk MenuItem
        href={item.href}
        icon={item.icon ? <i className={item.icon} /> : undefined}
      >
        {item.title}
      </MenuItem>
    )
  })
}

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
            onScroll: container => scrollMenu(container, false),
          }
        : {
            options: { wheelPropagation: false, suppressScrollX: true },
            onScrollY: container => scrollMenu(container, true),
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
            {renderMenuItems(section.items)}
          </MenuSection>
        ))}
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
