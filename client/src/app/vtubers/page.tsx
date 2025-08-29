'use client'

import { Container } from "@/components/layout/container"
import { Header } from "@/components/layout/header"
import { VTuberAvatar } from "@/components/ui/vtuber-avatar"
import { useGachaStore } from "@/stores/gacha"
import { useRouter } from "next/navigation"
import { useEffect, useMemo } from "react"

interface VTuber {
  name: string
  avatar: string
  description: string
  gachaCount: number
  totalParticipants: number
  isPopular: boolean
}

export default function VTubersPage() {
  const router = useRouter()
  const { gachaList, fetchGachaList } = useGachaStore()

  useEffect(() => {
    fetchGachaList()
  }, [fetchGachaList])

  // ガチャデータからVTuber一覧を作成
  const vtubers = useMemo(() => {
    const vtuberMap = new Map<string, VTuber>()
    
    gachaList.forEach(gacha => {
      if (vtuberMap.has(gacha.vtuberName)) {
        const existing = vtuberMap.get(gacha.vtuberName)!
        existing.gachaCount += 1
        existing.totalParticipants += gacha.totalDraws || 0
      } else {
        vtuberMap.set(gacha.vtuberName, {
          name: gacha.vtuberName,
          avatar: gacha.vtuberAvatar || '/avatars/default.png',
          description: `${gacha.vtuberName}の限定コンテンツをゲットしよう！`,
          gachaCount: 1,
          totalParticipants: gacha.totalDraws || 0,
          isPopular: (gacha.popularityRank || 999) <= 3
        })
      }
    })

    return Array.from(vtuberMap.values()).sort((a, b) => 
      b.totalParticipants - a.totalParticipants
    )
  }, [gachaList])

  const handleVTuberClick = (vtuberName: string) => {
    router.push(`/vtubers/${encodeURIComponent(vtuberName)}`)
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main>
        <section className="py-12 sm:py-20">
          <Container>
            <div className="text-center mb-12">
              <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900">
                VTuber一覧
              </h1>
              <p className="text-gray-800 text-lg max-w-2xl mx-auto">
                推しのVTuberを選んで、限定ガチャやコンテンツをお楽しみください
              </p>
            </div>

            {vtubers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {vtubers.map((vtuber) => (
                  <div
                    key={vtuber.name}
                    className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border border-gray-100 hover:border-gray-200 hover:-translate-y-1"
                    onClick={() => handleVTuberClick(vtuber.name)}
                  >
                    <div className="relative">
                      <VTuberAvatar 
                        vtuberName={vtuber.name}
                        width={300}
                        height={192}
                        className="w-full h-48 rounded-none"
                      />
                      {vtuber.isPopular && (
                        <div className="absolute top-3 right-3">
                          <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs px-3 py-1 rounded-full font-medium shadow-lg">
                            人気
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {vtuber.name}
                      </h3>
                      <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                        {vtuber.description}
                      </p>
                      
                      <div className="flex justify-between items-center text-sm text-gray-700">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                          <span>{vtuber.gachaCount}個のガチャ</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          <span>{vtuber.totalParticipants.toLocaleString()}人参加</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                    <div className="text-gray-400 text-xl">👤</div>
                  </div>
                </div>
                <p className="text-gray-700 text-lg">VTuberが登録されていません</p>
              </div>
            )}
          </Container>
        </section>
      </main>
    </div>
  )
}