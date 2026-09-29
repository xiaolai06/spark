import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: ReactNode
  icon?: ReactNode
  error?: string
  hint?: ReactNode
  /** 输入框右侧的附加内容，例如显示/隐藏密码按钮 */
  trailing?: ReactNode
  /** 左侧内边距是否为图标预留 */
  hasIcon?: boolean
  containerClassName?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, icon, error, hint, trailing, hasIcon, className, containerClassName, id, ...rest },
  ref,
) {
  const autoId = useId()
  const inputId = id ?? autoId
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined

  return (
    <div className={cn('space-y-1.5', containerClassName)}>
      {label ? (
        <label htmlFor={inputId} className="block text-sm font-medium text-ink-soft">
          {label}
        </label>
      ) : null}

      <div className="relative">
        {icon ? (
          <span
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted"
            aria-hidden
          >
            {icon}
          </span>
        ) : null}

        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          className={cn(
            'field-control',
            hasIcon && 'pl-11',
            trailing && 'pr-11',
            className,
          )}
          {...rest}
        />

        {trailing ? (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2">{trailing}</span>
        ) : null}
      </div>

      {error ? (
        <p id={`${inputId}-error`} className="text-xs text-state-bad">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-xs text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
})

interface SelectProps extends InputHTMLAttributes<HTMLSelectElement> {
  label?: ReactNode
  options: Array<{ value: string; label: string }>
  error?: string
  containerClassName?: string
}

export function Select({
  label,
  options,
  error,
  className,
  containerClassName,
  id,
  ...rest
}: SelectProps) {
  const autoId = useId()
  const selectId = id ?? autoId
  return (
    <div className={cn('space-y-1.5', containerClassName)}>
      {label ? (
        <label htmlFor={selectId} className="block text-sm font-medium text-ink-soft">
          {label}
        </label>
      ) : null}
      <select
        id={selectId}
        aria-invalid={error ? 'true' : undefined}
        className={cn('field-control cursor-pointer appearance-none pr-9', className)}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%237c8da4' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.75rem center',
        }}
        {...rest}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <p className="text-xs text-state-bad">{error}</p> : null}
    </div>
  )
}

interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  children: ReactNode
  error?: string
  className?: string
}

export function Checkbox({ checked, onChange, children, error, className }: CheckboxProps) {
  return (
    <div className={cn('space-y-1', className)}>
      <label className="flex cursor-pointer items-start gap-2.5 text-sm text-ink-soft select-none">
        <span className="relative mt-0.5 inline-flex shrink-0">
          <input
            type="checkbox"
            className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-line-strong bg-white transition-colors checked:border-brand-600 checked:bg-brand-600 disabled:cursor-not-allowed"
            checked={checked}
            onChange={(event) => onChange(event.target.checked)}
          />
          <svg
            className="pointer-events-none absolute left-0.5 top-0.5 h-3 w-3 scale-75 text-white opacity-0 transition peer-checked:scale-100 peer-checked:opacity-100"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
        <span className="leading-5">{children}</span>
      </label>
      {error ? <p className="text-xs text-state-bad">{error}</p> : null}
    </div>
  )
}
