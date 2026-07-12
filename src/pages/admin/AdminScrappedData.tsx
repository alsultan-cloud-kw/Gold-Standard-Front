import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, RefreshCw, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { adminApi, type WebsiteScrapeEntry } from '../../services/api'

type QueuedScrapeUrl = { url: string; render_js: boolean }

export default function AdminScrappedData() {
  const queryClient = useQueryClient()
  const [urlInput, setUrlInput] = useState('')
  const [bulkInput, setBulkInput] = useState('')
  const [renderJsForNew, setRenderJsForNew] = useState(false)
  const [queuedUrls, setQueuedUrls] = useState<QueuedScrapeUrl[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)

  const {
    data: entriesData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['customWebsiteScrapes'],
    queryFn: () => adminApi.getCustomWebsiteScrapes(9),
    refetchInterval: 20_000,
  })

  const entries = (entriesData as WebsiteScrapeEntry[] | undefined) ?? []

  const scrapeMutation = useMutation({
    mutationFn: (urls: QueuedScrapeUrl[]) => adminApi.createCustomWebsiteScrapes(urls),
    onSuccess: (created) => {
      toast.success('Scraping completed')
      setQueuedUrls([])
      setUrlInput('')
      setBulkInput('')
      const newest = (created as WebsiteScrapeEntry[])[0]
      if (newest?.id) setActiveId(newest.id)
      queryClient.invalidateQueries({ queryKey: ['customWebsiteScrapes'] })
    },
    onError: (err) => {
      toast.error(`Failed to scrape websites: ${(err as Error)?.message || 'Unknown error'}`)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (entryId: string) => adminApi.deleteCustomWebsiteScrape(entryId),
    onSuccess: (_data, deletedId) => {
      toast.success('Scraped entry removed')
      queryClient.invalidateQueries({ queryKey: ['customWebsiteScrapes'] })
      if (activeId === deletedId) setActiveId(null)
    },
    onError: (err) => {
      toast.error(`Failed to remove entry: ${(err as Error)?.message || 'Unknown error'}`)
    },
  })

  const normalizedEntries = useMemo(
    () =>
      entries
        .slice(0, 9)
        .sort((a, b) => new Date(b.scraped_at).getTime() - new Date(a.scraped_at).getTime()),
    [entries],
  )

  const activeEntry =
    normalizedEntries.find((e) => e.id === activeId) ??
    (normalizedEntries.length > 0 ? normalizedEntries[0] : null)

  const addUrlToQueue = (raw: string, renderJs: boolean) => {
    const url = raw.trim()
    if (!url) return
    if (!/^https?:\/\//i.test(url)) {
      toast.error('Enter a full URL that starts with http:// or https://')
      return
    }
    setQueuedUrls((prev) => {
      if (prev.some((x) => x.url === url)) return prev
      if (prev.length >= 9) {
        toast.error('You can queue up to 9 websites at a time')
        return prev
      }
      return [...prev, { url, render_js: renderJs }]
    })
  }

  const addBulkUrls = () => {
    const lines = bulkInput
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
    if (lines.length === 0) return
    lines.forEach((line) => addUrlToQueue(line, renderJsForNew))
  }

  return (
    <div className="admin-page-inner">
      <div className="admin-page-body">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-3xl font-bold gold-gradient-text-on-light">Scrapped Data Compare</h1>
            <p className="gold-gradient-text-on-light">
              Add website URLs, scrape them, and compare up to 9 sources side by side.
            </p>
          </div>
        </div>

        <div className="gold-card mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <label className="text-xs text-stone-600">Website URL</label>
              <div className="flex gap-2 mt-1">
                <input
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/rates"
                  className="flex-1 px-3 py-2 bg-white border border-black/15 rounded-lg text-black"
                />
                <button
                  type="button"
                  className="gold-button inline-flex items-center gap-2"
                  onClick={() => {
                    addUrlToQueue(urlInput, renderJsForNew)
                    setUrlInput('')
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
              <label className="mt-2 inline-flex items-center gap-2 text-xs text-lime-900">
                <input
                  type="checkbox"
                  checked={renderJsForNew}
                  onChange={(e) => setRenderJsForNew(e.target.checked)}
                  className="accent-amber-500"
                />
                Render JavaScript with Selenium (slower, better for dynamic websites)
              </label>
            </div>
            <div className="flex items-end justify-end">
              <button
                type="button"
                onClick={() => refetch()}
                className="gold-button inline-flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                Refresh list
              </button>
            </div>
          </div>

          <div className="mt-4">
            <label className="text-xs text-stone-600">Paste multiple URLs (one per line)</label>
            <div className="flex flex-col lg:flex-row gap-2 mt-1">
              <textarea
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                rows={3}
                placeholder={'https://site1.com\nhttps://site2.com'}
                className="flex-1 px-3 py-2 bg-white border border-black/15 rounded-lg text-black"
              />
              <button type="button" onClick={addBulkUrls} className="gold-button h-fit inline-flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add all
              </button>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-lime-900">Queue ({queuedUrls.length}/9)</p>
              <button
                type="button"
                className="text-xs text-lime-800 hover:text-black"
                onClick={() => setQueuedUrls([])}
              >
                Clear queue
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {queuedUrls.length === 0 && (
                <p className="text-xs text-stone-500">Add one or more URLs, then click Scrape queued websites.</p>
              )}
              {queuedUrls.map((item) => (
                <div
                  key={item.url}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-black/15 text-xs text-black"
                >
                  <span className="max-w-[220px] truncate">{item.url}</span>
                  <span className={`px-1.5 py-0.5 rounded ${item.render_js ? 'bg-purple-500/25 text-purple-200' : 'bg-slate-500/25 text-slate-200'}`}>
                    {item.render_js ? 'JS' : 'HTML'}
                  </span>
                  <button
                    type="button"
                    className="text-lime-800 hover:text-red-300"
                    onClick={() => setQueuedUrls((prev) => prev.filter((u) => u.url !== item.url))}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <button
                type="button"
                disabled={queuedUrls.length === 0 || scrapeMutation.isPending}
                onClick={() => scrapeMutation.mutate(queuedUrls)}
                className="gold-button inline-flex items-center gap-2 disabled:opacity-50"
              >
                <Search className={`w-4 h-4 ${scrapeMutation.isPending ? 'animate-spin' : ''}`} />
                {scrapeMutation.isPending ? 'Scraping...' : 'Scrape queued websites'}
              </button>
            </div>
          </div>
        </div>

        <div className="gold-card">
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-10 text-stone-600">
              <RefreshCw className="w-5 h-5 animate-spin" />
              Loading scraped data...
            </div>
          )}

          {isError && (
            <div className="py-8 text-sm text-red-300">
              Failed to load scrapped data. {(error as Error)?.message}
            </div>
          )}

          {!isLoading && !isError && normalizedEntries.length === 0 && (
            <p className="text-stone-600 text-center py-8">No scrapped data found.</p>
          )}

          {!isLoading && !isError && normalizedEntries.length > 0 && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
              <div className="xl:col-span-1 space-y-2">
                <p className="text-xs text-stone-600 uppercase tracking-wide">Latest 9 website snapshots</p>
                {normalizedEntries.map((entry, index) => {
                  const isActive = activeEntry?.id === entry.id
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => setActiveId(entry.id)}
                      className={`w-full text-left rounded-lg border px-3 py-2 transition-colors ${
                        isActive
                          ? 'border-lime-500 bg-lime-100/80'
                          : 'border-stone-200 bg-white/40 hover:bg-stone-100/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-black">#{index + 1}</p>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full ${
                              entry.status === 'success'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-red-500/20 text-red-300'
                            }`}
                          >
                            {entry.status}
                          </span>
                          <span
                            role="button"
                            tabIndex={0}
                            className="text-red-300 hover:text-red-200 p-1 rounded"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteMutation.mutate(entry.id)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                e.stopPropagation()
                                deleteMutation.mutate(entry.id)
                              }
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-lime-900 mt-1 truncate">{entry.page_title || entry.url}</p>
                      <p className="text-[11px] text-stone-500 truncate">{entry.url}</p>
                    </button>
                  )
                })}
              </div>

              <div className="xl:col-span-2 rounded-xl border border-stone-200 bg-white/40 p-4">
                {activeEntry && (
                  <>
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <h2 className="text-xl font-bold text-black">
                          {activeEntry.page_title || 'Untitled page'}
                        </h2>
                        <a
                          href={activeEntry.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-lime-800 hover:underline break-all"
                        >
                          {activeEntry.url}
                        </a>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-stone-500">Scraped at</p>
                        <p className="text-sm text-black">
                          {new Date(activeEntry.scraped_at).toLocaleString()}
                        </p>
                        <p className="text-[11px] text-stone-600 mt-1">
                          Mode: {activeEntry.extracted_data?.render_mode || 'http'}
                        </p>
                        <button
                          type="button"
                          className="mt-2 text-xs text-red-300 hover:text-red-200 inline-flex items-center gap-1"
                          onClick={() => deleteMutation.mutate(activeEntry.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove this entry
                        </button>
                      </div>
                    </div>

                    {activeEntry.status === 'failed' ? (
                      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                        {activeEntry.error_message || 'Scraping failed for this URL.'}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs uppercase text-stone-500 mb-1">Company</p>
                          <div className="rounded-lg border border-stone-200 bg-white/40 p-3">
                            <p className="text-sm text-black">
                              {activeEntry.extracted_data?.company?.name || activeEntry.page_title || 'Unknown company'}
                            </p>
                            <p className="text-xs text-stone-600 mt-1">
                              {activeEntry.extracted_data?.company?.website || activeEntry.url}
                            </p>
                          </div>
                        </div>

                        {activeEntry.extracted_data?.gold_prices &&
                          activeEntry.extracted_data.gold_prices.length > 0 && (
                            <div>
                              <p className="text-xs uppercase text-stone-500 mb-1">Prices (Gold / Silver / Platinum)</p>
                              <div className="overflow-x-auto rounded-lg border border-stone-200">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b border-stone-100 text-lime-800">
                                      <th className="px-3 py-2 text-left">Type</th>
                                      <th className="px-3 py-2 text-left">Buy</th>
                                      <th className="px-3 py-2 text-left">Sell</th>
                                      <th className="px-3 py-2 text-left">Currency</th>
                                      <th className="px-3 py-2 text-left">As on website</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {activeEntry.extracted_data.gold_prices.map((row, idx) => (
                                      <tr key={`${row.carat}-${row.buy_price ?? ''}-${row.sell_price ?? ''}-${idx}`} className="border-b border-stone-100">
                                        <td className="px-3 py-2 text-black">{row.carat}</td>
                                        <td className="px-3 py-2 text-black">
                                          {row.quote_only
                                            ? '—'
                                            : (row.buy_text ?? row.buy_price ?? '—')}
                                        </td>
                                        <td className="px-3 py-2 text-black">
                                          {row.quote_only
                                            ? '—'
                                            : (row.sell_text ?? row.sell_price ?? '—')}
                                        </td>
                                        <td className="px-3 py-2 text-black">
                                          {row.quote_only ? '—' : row.currency || '—'}
                                        </td>
                                        <td className="px-3 py-2 text-black text-xs leading-snug max-w-[28rem]">
                                          {row.snippet || '—'}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        {(!activeEntry.extracted_data?.gold_prices ||
                          activeEntry.extracted_data.gold_prices.length === 0) && (
                          <div>
                            <p className="text-xs uppercase text-stone-500 mb-1">Prices (Gold / Silver / Platinum)</p>
                            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-amber-200">
                              No rates detected on this website snapshot.
                            </div>
                          </div>
                        )}

                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
