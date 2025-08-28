import React, { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'

const MENU_ITEMS = [
  { key: 'dashboard', label: 'ダッシュボード', path: '/admin/dashboard' },
  { key: 'vtuber-review', label: 'VTuber審査', path: '/admin/vtuber-review' },
  { key: 'system-monitoring', label: 'システム監視', path: '/admin/system-monitoring' },
  { key: 'user-management', label: 'ユーザー管理', path: '/admin/user-management' },
  { key: 'settings', label: '設定', path: '/admin/settings' },
]

const BREADCRUMB_MAP: Record<string, string> = {
  '/admin/dashboard': 'ダッシュボード',
  '/admin/vtuber-review': 'VTuber審査',
  '/admin/system-monitoring': 'システム監視',
  '/admin/user-management': 'ユーザー管理',
  '/admin/settings': '設定',
}

interface AdminLayoutProps {
  children: React.ReactNode
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (!mobile) {
        setMobileMenuOpen(false)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const handleMenuItemClick = (path: string) => {
    router.push(path)
    if (isMobile) {
      setMobileMenuOpen(false)
    }
  }

  const handleLogout = () => {
    // TODO: Implement logout functionality
    console.log('Logout clicked')
  }

  const isActiveMenuItem = (path: string) => {
    return pathname === path
  }

  const getBreadcrumbs = () => {
    const breadcrumbs = ['管理画面']
    const currentPageLabel = BREADCRUMB_MAP[pathname]
    if (currentPageLabel) {
      breadcrumbs.push(currentPageLabel)
    }
    return breadcrumbs
  }

  return (
    <div 
      className={`admin-theme min-h-screen bg-white flex ${isMobile ? 'flex-col' : ''}`}
      data-testid="admin-layout-container"
    >
      {/* Mobile Header */}
      {isMobile && (
        <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold">管理画面</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleMobileMenu}
            data-testid="mobile-menu-toggle"
          >
            ☰
          </Button>
        </header>
      )}

      {/* Sidebar */}
      <aside 
        className={`
          ${isMobile ? 'fixed inset-y-0 left-0 z-50' : 'relative'}
          ${isMobile && !mobileMenuOpen ? 'transform -translate-x-full' : ''}
          ${sidebarCollapsed && !isMobile ? 'w-16' : 'w-64'}
          ${isMobile ? 'w-64' : ''}
          ${isMobile && mobileMenuOpen ? 'sidebar-mobile-open' : ''}
          ${isMobile ? 'sidebar-mobile' : ''}
          ${sidebarCollapsed ? 'sidebar-collapsed' : ''}
          bg-white border-r border-gray-200 transition-all duration-300
        `}
        data-testid="admin-sidebar"
        aria-label="管理画面ナビゲーション"
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <h2 className="text-lg font-semibold text-gray-900">こえポン！管理</h2>
            )}
            {!isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                data-testid="sidebar-collapse-button"
                className="p-1"
              >
                {sidebarCollapsed ? '→' : '←'}
              </Button>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav role="navigation" className="p-4">
          <ul className="space-y-2">
            {MENU_ITEMS.map((item) => (
              <li key={item.key}>
                <button
                  onClick={() => handleMenuItemClick(item.path)}
                  className={`
                    w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors
                    ${isActiveMenuItem(item.path)
                      ? 'bg-blue-100 text-blue-700 menu-item-active'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                >
                  {!sidebarCollapsed ? item.label : item.label.charAt(0)}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Mobile Menu Overlay */}
      {isMobile && mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        {!isMobile && (
          <header className="bg-white border-b border-gray-200" data-testid="admin-header">
            <div className="px-6 py-4">
              <div className="flex justify-between items-center">
                {/* Breadcrumb */}
                <nav aria-label="Breadcrumb" data-testid="admin-breadcrumb">
                  <ol className="flex items-center space-x-2 text-sm">
                    {getBreadcrumbs().map((crumb, index) => (
                      <li key={index} className="flex items-center">
                        {index > 0 && <span className="mx-2 text-gray-400">/</span>}
                        <span 
                          className={index === getBreadcrumbs().length - 1 
                            ? 'text-gray-900 font-medium' 
                            : 'text-gray-700'
                          }
                        >
                          {crumb}
                        </span>
                      </li>
                    ))}
                  </ol>
                </nav>

                {/* User Menu */}
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    data-testid="admin-user-menu"
                    className="flex items-center space-x-2"
                  >
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">
                      管
                    </div>
                    <span>管理者</span>
                  </Button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border">
                      <button className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
                        プロフィール
                      </button>
                      <button className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
                        設定
                      </button>
                      <hr className="my-1" />
                      <button 
                        onClick={handleLogout}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        ログアウト
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>
        )}

        {/* Page Announcer for Screen Readers */}
        <div
          className="sr-only"
          aria-live="polite"
          data-testid="page-announcer"
        >
          現在のページ: {BREADCRUMB_MAP[pathname] || 'ダッシュボード'}
        </div>

        {/* Main Content Area */}
        <main 
          className="flex-1 p-6 overflow-auto"
          data-testid="admin-main-content"
        >
          {children}
        </main>
      </div>
    </div>
  )
}