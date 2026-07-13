/* eslint-disable react-refresh/only-export-components */
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

export const Tabs = TabsPrimitive.Root
export const TabsContent = TabsPrimitive.Content

export function TabsList({ className, ...props }) {
  return (
    <TabsPrimitive.List
      className={cn('mb-4 flex gap-1 border-b border-hairline', className)}
      {...props}
    />
  )
}

export function TabsTrigger({ className, ...props }) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'cursor-pointer border-b-2 border-transparent px-3 pb-2 pt-1 text-sm text-mink transition-colors duration-200 hover:text-ink data-[state=active]:border-terra data-[state=active]:text-ink',
        className
      )}
      {...props}
    />
  )
}
