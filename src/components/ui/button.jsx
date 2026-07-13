import { cn } from '@/lib/utils'

const variants = {
  primary: 'bg-ink text-card hover:opacity-90',
  outline: 'border border-hairline bg-card text-ink hover:bg-page',
  ghost: 'text-mink hover:text-ink hover:bg-ink/5',
  danger: 'border border-red-200 bg-card text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950',
  terra: 'bg-terra text-white hover:opacity-90',
}

const sizes = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  icon: 'h-9 w-9',
  iconSm: 'h-7 w-7',
}

export function Button({ className, variant = 'primary', size = 'md', ...props }) {
  return (
    <button
      className={cn(
        'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-40',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
}
