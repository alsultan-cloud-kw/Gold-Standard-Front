import { useCallback, useMemo, useRef, useState } from 'react'
import { ChevronDown, Globe } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { RegionFlagImg } from '@/components/RegionFlagImg'
import { getRegionDisplayName, getSortedIso2RegionCodes } from '@/lib/registrationRegions'
import { cn } from '@/lib/utils'

type Props = {
  id: string
  label: string
  value: string
  onChange: (iso2: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
}

export function RegionSelectField({
  id,
  label,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyText,
  className,
}: Props) {
  const { i18n, t } = useTranslation()
  const regionLocale = i18n.language?.startsWith('ar') ? 'ar' : 'en'
  const [open, setOpen] = useState(false)
  const rowRef = useRef<HTMLDivElement>(null)
  const [menuWidth, setMenuWidth] = useState<number>()

  const options = useMemo(() => {
    const codes = getSortedIso2RegionCodes(regionLocale)
    return codes.map((code) => ({
      code,
      name: getRegionDisplayName(code, regionLocale),
    }))
  }, [regionLocale])

  const onOpenChange = useCallback((next: boolean) => {
    setOpen(next)
    if (next && rowRef.current) {
      setMenuWidth(Math.max(rowRef.current.offsetWidth, 304))
    }
  }, [])

  const labelClass = 'mb-1.5 block text-sm font-semibold text-[#0B0F19]'

  return (
    <div className={className}>
      <label id={id} className={labelClass}>
        {label}
      </label>
      <div ref={rowRef} className="relative w-full">
        <Popover open={open} onOpenChange={onOpenChange}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              aria-labelledby={id}
              className={cn(
                'h-auto min-h-[48px] w-full justify-between rounded-xl border-black/10 bg-white py-3 pe-10 ps-4 font-normal text-[#0B0F19] shadow-none hover:bg-[#F9F9FA]',
              )}
            >
              <span className="flex min-w-0 flex-1 items-center gap-2.5 text-start">
                {value ? (
                  <>
                    <RegionFlagImg code={value} size="sm" className="shrink-0" />
                    <span className="truncate font-medium">
                      {getRegionDisplayName(value, regionLocale)}
                    </span>
                  </>
                ) : (
                  <>
                    <Globe className="h-4 w-4 shrink-0 text-[#94A3B8]" aria-hidden />
                    <span className="truncate text-[#94A3B8]">
                      {placeholder ?? t('auth.selectNationality')}
                    </span>
                  </>
                )}
              </span>
              <ChevronDown className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 shrink-0 text-[#94A3B8]" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            sideOffset={8}
            className="z-[200] overflow-hidden rounded-xl border border-black/10 bg-white p-0 shadow-lg"
            style={menuWidth ? { width: menuWidth } : undefined}
          >
            <Command label={label}>
              <CommandInput placeholder={searchPlaceholder ?? t('auth.searchNationality')} />
              <CommandList className="max-h-[min(20rem,55vh)]">
                <CommandEmpty>{emptyText ?? t('auth.noCountryMatch')}</CommandEmpty>
                <CommandGroup>
                  {options.map(({ code, name }) => (
                    <CommandItem
                      key={code}
                      value={code}
                      keywords={[name, code]}
                      onSelect={(selected) => {
                        onChange(selected.toUpperCase())
                        setOpen(false)
                      }}
                    >
                      <span className="flex w-full min-w-0 items-center gap-3">
                        <RegionFlagImg code={code} size="md" />
                        <span className="min-w-0 flex-1 truncate">{name}</span>
                        <span className="text-[10px] font-semibold text-[#94A3B8]">{code}</span>
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
