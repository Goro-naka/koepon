'use client'

import { Button } from "@/components/ui/button"
import { Container } from "@/components/layout/container"
import { Header } from "@/components/layout/header"
import { GachaCard } from "@/components/gacha/GachaCard"
import { VTuberAvatar } from "@/components/ui/vtuber-avatar"
import { useGachaStore } from "@/stores/gacha"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"

export default function Home() {
  const router = useRouter()
  const { gachaList, fetchGachaList } = useGachaStore()

  useEffect(() => {
    fetchGachaList()
  }, [fetchGachaList])

  const handleGachaClick = (gachaId: string) => {
    router.push(`/gacha/${gachaId}`)
  }

  // 人気上位3件の限定ガチャを取得
  const popularGachas = gachaList
    .filter(gacha => gacha.isLimitedTime || gacha.isActive)
    .sort((a, b) => (a.popularityRank || 999) - (b.popularityRank || 999))
    .slice(0, 3)

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="py-12 sm:py-20 lg:py-28 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
          <Container>
            <div className="text-center space-y-6 max-w-4xl mx-auto">
              <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold tracking-tight text-gray-900 leading-tight">
                推しのVTuberを<br />
                <span className="text-primary bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  もっと応援しよう
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed">
                こえポン！は、VTuberファンのための新しいガチャ・特典アプリです。<br />
                推しメダルを集めて、限定特典をゲットしよう！
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                <Button size="lg" asChild>
                  <Link href="/auth/register">今すぐ始める</Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/gacha">ガチャを見る</Link>
                </Button>
              </div>
            </div>
          </Container>
        </section>

        {/* Popular Gachas Section */}
        <section className="py-12 sm:py-20 bg-white">
          <Container>
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-900">
                🔥 開催中の人気ガチャ
              </h2>
              <p className="text-gray-800 text-lg">
                今すぐ参加できる注目のガチャをチェックしよう！
              </p>
            </div>
            
            {popularGachas.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                {popularGachas.map((gacha) => (
                  <GachaCard
                    key={gacha.id}
                    gacha={gacha}
                    onClick={handleGachaClick}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-700 mb-4">現在開催中のガチャを準備中です...</p>
              </div>
            )}

            <div className="text-center">
              <Button variant="outline" size="lg" asChild>
                <Link href="/gacha">全てのガチャを見る</Link>
              </Button>
            </div>
          </Container>
        </section>

        {/* Popular VTubers Section */}
        <section className="py-12 sm:py-20 bg-gray-50">
          <Container>
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-900">
                ✨ 人気のVTuber
              </h2>
              <p className="text-gray-800 text-lg">
                推しのVTuberを見つけて、特別なコンテンツを楽しもう
              </p>
            </div>
            
            {gachaList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {Array.from(new Map(gachaList.map(gacha => [gacha.vtuberName, gacha])).values())
                  .sort((a, b) => (a.popularityRank || 999) - (b.popularityRank || 999))
                  .slice(0, 4)
                  .map((gacha) => (
                    <div
                      key={gacha.vtuberName}
                      className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border border-gray-100 hover:border-gray-200 hover:-translate-y-1"
                      onClick={() => router.push(`/vtubers/${encodeURIComponent(gacha.vtuberName)}`)}
                    >
                      <div className="relative">
                        <VTuberAvatar
                          vtuberName={gacha.vtuberName}
                          width={300}
                          height={128}
                          className="w-full h-32 rounded-none object-cover"
                        />
                        {(gacha.popularityRank || 999) <= 3 && (
                          <div className="absolute top-2 right-2">
                            <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                              人気
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="p-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          {gacha.vtuberName}
                        </h3>
                        <div className="flex justify-between items-center text-sm text-gray-700">
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                            <span>ガチャ開催中</span>
                          </div>
                          <span>{gacha.totalDraws?.toLocaleString()}人参加</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-700 mb-4">VTuberが登録されていません</p>
              </div>
            )}

            <div className="text-center">
              <Button variant="outline" size="lg" asChild>
                <Link href="/vtubers">全てのVTuberを見る</Link>
              </Button>
            </div>
          </Container>
        </section>

        {/* Features Section */}
        <section className="py-12 sm:py-20 bg-white">
          <Container>
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-900">
                こえポン！の特徴
              </h2>
              <p className="text-gray-800 text-lg">
                VTuberファンのために作られた、楽しい機能が盛りだくさん
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-card p-6 rounded-lg border text-center">
                <div className="w-12 h-12 bg-primary rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-xl">🎰</span>
                </div>
                <h3 className="font-semibold mb-2 text-gray-900">ガチャシステム</h3>
                <p className="text-gray-800 text-sm">
                  推しのVTuberの限定グッズやボイスが当たるガチャを楽しもう
                </p>
              </div>
              
              <div className="bg-card p-6 rounded-lg border text-center">
                <div className="w-12 h-12 bg-accent rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <span className="text-accent-foreground font-bold text-xl">🏪</span>
                </div>
                <h3 className="font-semibold mb-2 text-gray-900">交換所</h3>
                <p className="text-gray-800 text-sm">
                  推しメダルを使って、欲しいアイテムと交換できます
                </p>
              </div>
              
              <div className="bg-card p-6 rounded-lg border text-center">
                <div className="w-12 h-12 bg-secondary rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <span className="text-secondary-foreground font-bold text-xl">🎁</span>
                </div>
                <h3 className="font-semibold mb-2 text-gray-900">特典BOX</h3>
                <p className="text-gray-800 text-sm">
                  ゲットした特典は特典BOXでいつでも確認・ダウンロード可能
                </p>
              </div>
            </div>
          </Container>
        </section>
      </main>

      <footer className="py-8 border-t">
        <Container>
          <div className="text-center text-gray-800">
            <p>&copy; 2025 こえポン！ All rights reserved.</p>
          </div>
        </Container>
      </footer>
    </div>
  )
}
