'use client'

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/stores/auth"

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const { isAuthenticated, user } = useAuthStore()

  const toggleNav = () => setIsOpen(!isOpen)

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={toggleNav}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden">
          <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-background border-l p-6">
            <div className="flex items-center justify-between mb-8">
              <span className="text-lg font-semibold">メニュー</span>
              <Button variant="ghost" size="icon" onClick={toggleNav}>
                <X size={20} />
              </Button>
            </div>

            <nav className="flex flex-col space-y-4">
              <Link
                href="/gacha"
                className="text-lg font-medium py-2 px-3 rounded-md hover:bg-accent"
                onClick={toggleNav}
              >
                ガチャ
              </Link>
              <Link
                href="/exchange"
                className="text-lg font-medium py-2 px-3 rounded-md hover:bg-accent"
                onClick={toggleNav}
              >
                交換所
              </Link>
              <Link
                href="/rewards"
                className="text-lg font-medium py-2 px-3 rounded-md hover:bg-accent"
                onClick={toggleNav}
              >
                特典BOX
              </Link>

              <div className="border-t pt-4 mt-4">
                {isAuthenticated ? (
                  <div className="space-y-3">
                    <div className="px-3">
                      <p className="text-sm text-muted-foreground">ログイン中</p>
                      <p className="font-medium">
                        {user?.displayName || user?.username}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={toggleNav}
                    >
                      プロフィール
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full"
                      asChild
                      onClick={toggleNav}
                    >
                      <Link href="/login">ログイン</Link>
                    </Button>
                    <Button className="w-full" asChild onClick={toggleNav}>
                      <Link href="/register">新規登録</Link>
                    </Button>
                  </div>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  )
}