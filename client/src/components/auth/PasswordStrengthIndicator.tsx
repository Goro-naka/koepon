interface PasswordStrengthIndicatorProps {
  password: string
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const getPasswordStrength = (password: string) => {
    if (password.length < 8) return { strength: 'weak', text: '弱い', color: 'text-red-500' }
    if (password.length < 12) return { strength: 'medium', text: '普通', color: 'text-yellow-500' }
    return { strength: 'strong', text: '強い', color: 'text-green-500' }
  }

  if (!password) return null

  const passwordStrength = getPasswordStrength(password)

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm">強度:</span>
      <span className={`text-sm font-medium ${passwordStrength.color}`}>
        {passwordStrength.text}
      </span>
    </div>
  )
}