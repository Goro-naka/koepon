'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Container } from "./container"
import { useAuthStore } from "@/stores/auth"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { isAuthenticated, user } = useAuthStore()

  // Close mobile menu on escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false)
      }
    }

    if (mobileMenuOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [mobileMenuOpen])

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (mobileMenuOpen && !target.closest('[data-mobile-menu]')) {
        setMobileMenuOpen(false)
      }
    }

    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [mobileMenuOpen])

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90 border-b border-gray-200">
      <Container>
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-primary" />
              <span className="text-xl font-bold text-gray-900">
                こえポン！
              </span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/vtubers"
              className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              VTuber
            </Link>
            <Link
              href="/gacha"
              className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              イベント一覧
            </Link>
            <Link
              href="/exchange"
              className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              交換所
            </Link>
            <Link
              href="/rewards"
              className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              特典BOX
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden" data-mobile-menu>
            <Button
              variant="ghost" 
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2"
              aria-label={mobileMenuOpen ? "メニューを閉じる" : "メニューを開く"}
              aria-expanded={mobileMenuOpen}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </Button>
          </div>

          {/* Desktop User Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-800 hidden lg:inline">
                  {user?.displayName || user?.username}
                </span>
                <Button variant="outline" size="sm">
                  プロフィール
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    const { logout } = useAuthStore.getState()
                    logout()
                  }}
                >
                  ログアウト
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/auth/login">ログイン</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/auth/register">新規登録</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div 
            className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg"
            data-mobile-menu
            role="menu"
            aria-label="モバイルナビゲーション"
          >
            <div className="px-4 py-4 space-y-4">
              {/* Mobile Navigation Links */}
              <nav className="space-y-3">
                <Link
                  href="/vtubers"
                  className="block text-base font-medium text-gray-800 hover:text-gray-900 transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  VTuber
                </Link>
                <Link
                  href="/gacha"
                  className="block text-base font-medium text-gray-800 hover:text-gray-900 transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  イベント一覧
                </Link>
                <Link
                  href="/exchange"
                  className="block text-base font-medium text-gray-800 hover:text-gray-900 transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  交換所
                </Link>
                <Link
                  href="/rewards"
                  className="block text-base font-medium text-gray-800 hover:text-gray-900 transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  特典BOX
                </Link>
              </nav>

              {/* Mobile User Actions */}
              <div className="border-t border-gray-200 pt-4">
                {isAuthenticated ? (
                  <div className="space-y-3">
                    <div className="text-sm text-gray-800">
                      {user?.displayName || user?.username}
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      プロフィール
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full"
                      onClick={() => {
                        const { logout } = useAuthStore.getState()
                        logout()
                        setMobileMenuOpen(false)
                      }}
                    >
                      ログアウト
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Button variant="ghost" size="sm" className="w-full" asChild>
                      <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                        ログイン
                      </Link>
                    </Button>
                    <Button size="sm" className="w-full" asChild>
                      <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)}>
                        新規登録
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Container>
    </header>
  )
}