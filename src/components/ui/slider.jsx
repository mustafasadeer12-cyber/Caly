import * as SliderPrimitive from '@radix-ui/react-slider'
import { cn } from '@/lib/utils'

export function Slider({ className, ...props }) {
  return (
    <SliderPrimitive.Root
      className={cn('relative flex h-5 w-full touch-none select-none items-center', className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1 grow rounded-full bg-hairline">
        <SliderPrimitive.Range className="absolute h-full rounded-full bg-terra" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block h-4 w-4 cursor-pointer rounded-full border border-hairline bg-card shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-terra/40" />
    </SliderPrimitive.Root>
  )
}
