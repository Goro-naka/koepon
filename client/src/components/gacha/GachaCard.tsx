import { formatPrice } from '@/lib/gacha-utils'
import type { GachaItem } from '@/types/gacha'
import { VTuberAvatar } from '@/components/ui/vtuber-avatar'

export interface GachaCardProps {
  gacha: GachaItem
  onClick: (id: string) => void
}

export function GachaCard({ gacha, onClick }: GachaCardProps) {
  return (
    <div 
      data-testid="gacha-card"
      className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border border-slate-100 hover:border-slate-200 hover:-translate-y-1"
      onClick={() => onClick(gacha.id)}
    >
      {/* Header with VTuber info */}
      <div className="p-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
        <div className="flex items-center">
          <div className="relative">
            <VTuberAvatar 
              vtuberName={gacha.vtuberName}
              size="sm"
              className="ring-2 ring-white shadow-md"
            />
            {gacha.isLimitedTime && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-red-400 to-pink-400 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            )}
          </div>
          <div className="ml-3">
            <span className="text-sm font-medium text-slate-700">{gacha.vtuberName}</span>
            {gacha.isLimitedTime && (
              <div className="text-xs text-red-500 font-medium">限定開催中</div>
            )}
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="p-4">
        <h3 className="font-semibold text-xl text-slate-800 mb-2 line-clamp-2 leading-tight">
          {gacha.title || gacha.name}
        </h3>
        <p className="text-sm text-slate-600 mb-4 line-clamp-2 leading-relaxed">
          {gacha.description}
        </p>
        
        {/* Pricing */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-slate-800">{formatPrice(gacha.singlePrice || 100)}</span>
            <span className="text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded-full">単発</span>
          </div>
          {gacha.isLimitedTime && (
            <div className="bg-gradient-to-r from-red-400 to-pink-400 text-white text-xs px-3 py-1 rounded-full font-medium shadow-lg">
              期間限定
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex justify-between items-center text-xs text-slate-500">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"></div>
            <span>人気 #{gacha.popularityRank || 1}</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full"></div>
            <span>{gacha.totalDraws?.toLocaleString() || 0}人参加</span>
          </div>
        </div>
      </div>
    </div>
  )
}