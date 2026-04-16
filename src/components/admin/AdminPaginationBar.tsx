type AdminPaginationBarProps = {
  page: number
  totalPages: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
  itemLabel?: string
}

export default function AdminPaginationBar({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  itemLabel = 'entries',
}: AdminPaginationBarProps) {
  if (total <= pageSize) return null

  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-700 font-medium">
      <div>
        Page {page} of {totalPages} ({total} {itemLabel})
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="px-3 py-1 rounded-full border border-lime-400/60 bg-white text-black disabled:opacity-40 hover:bg-lime-100"
        >
          Prev
        </button>
        <button
          type="button"
          onClick={() => onPageChange(page < totalPages ? page + 1 : page)}
          disabled={page >= totalPages}
          className="px-3 py-1 rounded-full border border-lime-400/60 bg-white text-black disabled:opacity-40 hover:bg-lime-100"
        >
          Next
        </button>
      </div>
    </div>
  )
}
