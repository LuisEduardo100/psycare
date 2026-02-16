import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface IconInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: React.ReactNode
  rightIcon?: React.ReactNode
}

const IconInput = React.forwardRef<HTMLInputElement, IconInputProps>(
  ({ icon, rightIcon, className, ...props }, ref) => {
    return (
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </div>
        <Input
          ref={ref}
          className={cn(
            "pl-11 h-12 rounded-xl bg-muted/50 border-border focus:bg-background",
            rightIcon && "pr-11",
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground cursor-pointer">
            {rightIcon}
          </div>
        )}
      </div>
    )
  }
)
IconInput.displayName = "IconInput"

export { IconInput }
