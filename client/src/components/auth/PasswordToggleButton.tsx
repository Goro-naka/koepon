import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PasswordToggleButtonProps {
  showPassword: boolean
  onToggle: () => void
  ariaLabel?: string
}

export function PasswordToggleButton({ 
  showPassword, 
  onToggle, 
  ariaLabel 
}: PasswordToggleButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
      onClick={onToggle}
      aria-label={ariaLabel || (showPassword ? 'パスワードを隠す' : 'パスワードを表示')}
    >
      {showPassword ? (
        <EyeOff className="h-4 w-4 text-gray-400" />
      ) : (
        <Eye className="h-4 w-4 text-gray-400" />
      )}
    </Button>
  )
}