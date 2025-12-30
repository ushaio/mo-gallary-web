'use client'

import React, { forwardRef } from 'react'
import { LucideIcon } from 'lucide-react'

interface CustomInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** 输入框变体：
   * - form: 表单样式（底部边框）
   * - search: 搜索样式（完整边框 + 背景色）
   * - config: 配置样式（完整边框 + 背景透明）
   */
  variant?: 'form' | 'search' | 'config'
  /** 左侧图标 */
  icon?: LucideIcon
  /** 容器的额外类名 */
  containerClassName?: string
}

export const CustomInput = forwardRef<HTMLInputElement, CustomInputProps>(
  ({ variant = 'form', icon: Icon, containerClassName = '', className = '', ...props }, ref) => {
    const baseInputClass = 'outline-none transition-colors placeholder:text-muted-foreground/30'

    const variantClasses = {
      form: 'w-full p-3 bg-background border-b border-border focus:border-primary text-sm rounded-none',
      search: 'w-full py-2 bg-muted/30 border border-border focus:border-primary text-xs font-mono',
      config: 'w-full p-3 bg-background border border-border focus:border-primary text-xs font-mono',
    }

    const inputClass = `${baseInputClass} ${variantClasses[variant]} ${Icon ? 'pl-10 pr-4' : 'px-3'} ${className}`

    if (Icon) {
      return (
        <div className={`relative ${containerClassName}`}>
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input ref={ref} className={inputClass} {...props} />
        </div>
      )
    }

    return <input ref={ref} className={`${inputClass} ${containerClassName}`} {...props} />
  }
)

CustomInput.displayName = 'CustomInput'
