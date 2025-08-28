interface FormErrorAlertProps {
  error: string | null
}

export function FormErrorAlert({ error }: FormErrorAlertProps) {
  if (!error) return null

  return (
    <div 
      role="alert"
      className="p-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded-md"
      data-testid="error-message"
    >
      {error}
    </div>
  )
}