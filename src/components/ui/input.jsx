import { cn } from '@/lib/utils'

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-lg border border-hairline bg-page px-3 text-sm text-ink placeholder:text-mink/70 transition-colors duration-200 focus:border-terra focus:outline-none',
        className
      )}
      {...props}
    />
  )
}

export function Label({ className, ...props }) {
  return <label className={cn('mb-1.5 block text-xs font-medium text-mink', className)} {...props} />
}
