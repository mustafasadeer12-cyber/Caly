import { cn } from '@/lib/utils'

export function Card({ className, ...props }) {
  return (
    <div className={cn('rounded-xl border border-hairline bg-card', className)} {...props} />
  )
}
