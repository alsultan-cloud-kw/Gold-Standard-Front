import type { Ref } from 'react'

type Props = {
  label: string
  hint: string
  file: File | null
  inputRef?: Ref<HTMLInputElement>
  required?: boolean
  onChange: (file: File | null) => void
}

const ACCEPT =
  '.pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp'

export function CompanyDeskApplyFileField({
  label,
  hint,
  file,
  inputRef,
  required = true,
  onChange,
}: Props) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold text-[#0C1512]">
        {label} {required ? <span className="text-red-600">*</span> : null}
      </span>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        required={required}
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        className="w-full rounded-xl border border-black/10 bg-[#F9F9FA] px-3 py-2.5 text-sm outline-none ring-[#85E307]/40 file:me-3 file:rounded-lg file:border-0 file:bg-[#0B0F19] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[#85E307] focus:ring-2"
      />
      <span className="block text-[11px] text-[#64748B]">
        {hint}
        {file ? ` · ${file.name}` : ''}
      </span>
    </label>
  )
}
