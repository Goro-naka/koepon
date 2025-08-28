import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import type { SortOption } from '@/types/gacha'

export interface FilterPanelProps {
  searchQuery: string
  selectedVTuber: string
  sortBy: SortOption
  availableVTubers: string[]
  onSearchChange: (query: string) => void
  onVTuberChange: (vtuber: string) => void
  onSortChange: (sort: SortOption) => void
  onClearFilters: () => void
}

export function FilterPanel({
  searchQuery,
  selectedVTuber,
  sortBy,
  availableVTubers,
  onSearchChange,
  onVTuberChange,
  onSortChange,
  onClearFilters,
}: FilterPanelProps) {
  const hasActiveFilters = searchQuery || selectedVTuber || sortBy !== 'popular'

  return (
    <div className="mb-8 space-y-4 md:space-y-0 md:flex md:gap-4 md:items-end">
      <div className="flex-1">
        <Label htmlFor="search" className="text-gray-900">検索</Label>
        <Input
          id="search"
          type="text"
          placeholder="検索..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="bg-white text-gray-900"
        />
      </div>
      
      <div>
        <Label htmlFor="vtuber-select" className="text-gray-900">VTuber選択</Label>
        <Select 
          value={selectedVTuber || "all"} 
          onValueChange={(value) => onVTuberChange(value === "all" ? "" : value)}
        >
          <SelectTrigger aria-label="VTuber選択" className="bg-white text-gray-900">
            <SelectValue placeholder="すべて" />
          </SelectTrigger>
          <SelectContent className="bg-white text-gray-900">
            <SelectItem value="all" className="text-gray-900">すべて</SelectItem>
            {availableVTubers.map((vtuber) => (
              <SelectItem key={vtuber} value={vtuber} className="text-gray-900">
                {vtuber}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="sort-select" className="text-gray-900">並び順</Label>
        <Select value={sortBy} onValueChange={(value: SortOption) => onSortChange(value)}>
          <SelectTrigger aria-label="並び順" className="bg-white text-gray-900">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white text-gray-900">
            <SelectItem value="popular" className="text-gray-900">人気順</SelectItem>
            <SelectItem value="price" className="text-gray-900">価格順</SelectItem>
            <SelectItem value="latest" className="text-gray-900">新着順</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {hasActiveFilters && (
        <Button variant="outline" onClick={onClearFilters}>
          フィルター
        </Button>
      )}
    </div>
  )
}