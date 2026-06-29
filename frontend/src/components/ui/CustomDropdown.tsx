import { useState, useEffect, useRef } from "react"
import { ChevronDown } from "lucide-react"

export interface DropdownOption {
  value: string
  label: string
}

export interface CustomDropdownProps {
  options: DropdownOption[]
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
  placeholder?: string
  align?: "left" | "right"
}

export function CustomDropdown({
  options,
  value,
  onChange,
  disabled = false,
  className = "",
  placeholder = "Select Option",
  align = "left"
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const selectedOption = options.find((opt) => opt.value === value)
  const displayLabel = selectedOption ? selectedOption.label : placeholder

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
    }
  }

  const handleSelect = (val: string) => {
    if (!disabled) {
      onChange(val)
      setIsOpen(false)
    }
  }

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${isOpen ? "z-30" : ""} ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={`w-full flex items-center justify-between gap-2 rounded-lg border border-[#262626] bg-[#181818] px-3 py-1.5 text-xs font-semibold text-white transition-colors focus:border-[#444444] focus:outline-none ${
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-[#202020]"
        }`}
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className={`absolute top-full mt-1 w-full min-w-[160px] rounded-lg border border-[#262626] bg-[#181818] shadow-lg z-50 py-1 overflow-hidden ${
          align === "right" ? "right-0" : "left-0"
        }`}>
          <div className="max-h-60 overflow-y-auto">
            {options.map((opt) => {
              const isSelected = opt.value === value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full text-left px-3 py-1.5 text-xs text-white transition-colors cursor-pointer block ${
                    isSelected ? "bg-[#242424] font-semibold" : "bg-transparent hover:bg-[#242424]"
                  }`}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomDropdown
