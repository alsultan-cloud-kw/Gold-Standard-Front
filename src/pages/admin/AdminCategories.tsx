import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit2, Trash2, FolderTree, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { productsApi } from '../../services/api'
import AdminNav from '../../components/admin/AdminNav'
import type { Category } from '../../types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

type SubRow = { id: string; name_en: string; name_ar?: string; slug: string; image?: string | null }
type CategoryRow = Category & { image_url?: string; subcategories?: SubRow[] }

export default function AdminCategories() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<CategoryRow | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [page, setPage] = useState(1)
  const pageSize = 10

  const [form, setForm] = useState({
    name_ar: '',
    name_en: '',
    parent: '' as string, // empty = root
    display_order: 0,
    is_active: true,
  })

  const { data: tree, isLoading, error } = useQuery({
    queryKey: ['adminCategoriesTree'],
    queryFn: async () => {
      const res = await productsApi.getCategoriesAdminTree()
      return Array.isArray(res) ? (res as CategoryRow[]) : []
    },
    retry: 1,
  })

  const createMutation = useMutation({
    mutationFn: () =>
      productsApi.createCategory({
        name_ar: form.name_ar,
        name_en: form.name_en,
        parent: form.parent || null,
        display_order: form.display_order,
        is_active: form.is_active,
        image: imageFile || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCategoriesTree'] })
      toast.success(editing ? 'Category updated' : 'Category created')
      setDialogOpen(false)
      resetForm()
    },
    onError: () => toast.error('Save failed. Are you logged in as admin?'),
  })

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!editing) return Promise.reject()
      const payload: Parameters<typeof productsApi.updateCategory>[1] = {
        name_ar: form.name_ar,
        name_en: form.name_en,
        parent: form.parent || null,
        display_order: form.display_order,
        is_active: form.is_active,
      }
      if (imageFile) payload.image = imageFile
      return productsApi.updateCategory(editing.slug, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCategoriesTree'] })
      toast.success('Category updated')
      setDialogOpen(false)
      setEditing(null)
      resetForm()
    },
    onError: () => toast.error('Update failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: (slug: string) => productsApi.deleteCategory(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCategoriesTree'] })
      toast.success('Category deleted')
    },
    onError: () => toast.error('Delete failed — category may have products'),
  })

  function resetForm() {
    setForm({
      name_ar: '',
      name_en: '',
      parent: '',
      display_order: 0,
      is_active: true,
    })
    setEditing(null)
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function openAddRoot() {
    resetForm()
    setEditing(null)
    setDialogOpen(true)
  }

  function openAddSub(parentId: string) {
    resetForm()
    setForm((f) => ({ ...f, parent: parentId }))
    setImagePreview(null)
    setDialogOpen(true)
  }

  function openEdit(cat: CategoryRow) {
    setEditing(cat)
    setImageFile(null)
    setImagePreview((cat as CategoryRow).image_url || cat.image || null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setForm({
      name_ar: cat.name_ar,
      name_en: cat.name_en,
      parent: (cat.parent as string) || '',
      display_order: cat.display_order ?? 0,
      is_active: cat.is_active ?? true,
    })
    setDialogOpen(true)
  }

  const roots = tree || []
  const total = roots.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const pageRoots = roots.slice(start, end)

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <AdminNav />
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold gold-gradient-text flex items-center gap-2">
              <FolderTree className="w-8 h-8" />
              Categories
            </h1>
            <p className="text-stone-600">Root categories and subcategories for products</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
            <button type="button" onClick={openAddRoot} className="gold-button flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add category
            </button>
            <DialogContent className="max-h-[90vh] overflow-y-auto border-2 border-black/15 bg-gradient-to-b from-lime-50 via-white to-amber-50/30 text-black shadow-xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-black">
                  {editing ? 'Edit category' : form.parent ? 'Add subcategory' : 'Add root category'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-sm font-semibold text-black/80 mb-1">Name (EN)</label>
                  <input
                    value={form.name_en}
                    onChange={(e) => setForm({ ...form, name_en: e.target.value })}
                    className="w-full px-4 py-2 bg-white border-2 border-black/15 rounded-lg text-black placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-lime-500/40"
                    placeholder="Rings"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-black/80 mb-1">Name (AR)</label>
                  <input
                    value={form.name_ar}
                    onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
                    className="w-full px-4 py-2 bg-white border-2 border-black/15 rounded-lg text-black placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-lime-500/40"
                    placeholder="خواتم"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-black/80 mb-1">Parent (subcategory)</label>
                  <select
                    value={form.parent}
                    onChange={(e) => setForm({ ...form, parent: e.target.value })}
                    className="w-full px-4 py-2 bg-white border-2 border-black/15 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-lime-500/40"
                  >
                    <option value="">— Root category —</option>
                    {roots.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name_en}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-black/80 mb-1">Display order</label>
                  <input
                    type="number"
                    value={form.display_order}
                    onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-4 py-2 bg-white border-2 border-black/15 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-lime-500/40"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-black/80 mb-1">Category image</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="w-full text-sm text-black/80 file:mr-2 file:rounded-md file:border-2 file:border-black/15 file:bg-yellow-300 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-black hover:file:bg-yellow-200"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) {
                        setImageFile(f)
                        setImagePreview(URL.createObjectURL(f))
                      }
                    }}
                  />
                  {imagePreview && (
                    <div className="mt-2">
                      <img
                        src={imagePreview}
                        alt=""
                        className="h-24 w-24 object-cover rounded-lg border-2 border-black/15"
                      />
                      <button
                        type="button"
                        className="text-xs font-semibold text-lime-900 hover:underline mt-1"
                        onClick={() => {
                          setImageFile(null)
                          setImagePreview(editing ? ((editing as CategoryRow).image_url || editing.image) || null : null)
                          if (fileInputRef.current) fileInputRef.current.value = ''
                        }}
                      >
                        Clear selection
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-stone-600 mt-1">Optional. Used for category and subcategory display.</p>
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-black font-medium">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="rounded border-black/30"
                  />
                  <span className="text-sm">Active</span>
                </label>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    disabled={!form.name_en.trim() || !form.name_ar.trim()}
                    onClick={() => (editing ? updateMutation.mutate() : createMutation.mutate())}
                    className="gold-button flex-1 border-2 border-black/10 disabled:opacity-50"
                  >
                    {editing ? 'Save' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDialogOpen(false)}
                    className="px-4 py-2 rounded-lg border-2 border-black/20 font-semibold text-black hover:bg-lime-100"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {error && (
          <div className="gold-card mb-4 text-amber-400 text-sm">
            Could not load categories. Open this page while logged in as admin, or check API URL.
          </div>
        )}

        <div className="gold-card overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-stone-600">Loading…</div>
          ) : roots.length === 0 ? (
            <div className="p-8 text-center text-stone-600">
              No categories yet. Add a root category to get started.
            </div>
          ) : (
            <ul className="divide-y divide-gold-500/10">
              {pageRoots.map((cat) => (
                <li key={cat.id} className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      {(cat as CategoryRow).image_url || cat.image ? (
                        <img
                          src={(cat as CategoryRow).image_url || (cat.image as string)}
                          alt=""
                          className="h-10 w-10 rounded object-cover border border-stone-200 shrink-0"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded bg-white border border-stone-200 shrink-0" />
                      )}
                      <span className="font-medium text-black truncate">{cat.name_en}</span>
                      <span className="text-stone-500 text-sm truncate">/{cat.slug}</span>
                      {!cat.is_active && (
                        <span className="text-xs px-2 py-0.5 rounded bg-stone-100 text-stone-500">inactive</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openAddSub(cat.id)}
                        className="p-2 text-lime-800 hover:bg-lime-100 rounded text-sm"
                        title="Add subcategory"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(cat)}
                        className="p-2 text-lime-800 hover:bg-lime-100 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete "${cat.name_en}"? Subcategories or products may block this.`))
                            deleteMutation.mutate(cat.slug)
                        }}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {Array.isArray(cat.subcategories) && cat.subcategories.length > 0 && (
                    <ul className="mt-2 ml-4 pl-4 border-l border-stone-200 space-y-2">
                      {cat.subcategories.map((sub) => {
                        const s = sub as CategoryRow
                        return (
                        <li key={s.id} className="flex items-center justify-between gap-2 text-sm">
                          <span className="flex items-center gap-2 text-stone-800 min-w-0">
                            {s.image ? (
                              <img src={s.image} alt="" className="h-8 w-8 rounded object-cover border border-stone-200 shrink-0" />
                            ) : (
                              <div className="h-8 w-8 rounded bg-white border border-stone-200 shrink-0" />
                            )}
                            <ChevronRight className="w-4 h-4 text-stone-400 shrink-0" />
                            {s.name_en}
                            <span className="text-stone-500">/{s.slug}</span>
                          </span>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                openEdit({
                                  id: s.id,
                                  name_en: s.name_en,
                                  name_ar: s.name_ar || '',
                                  slug: s.slug,
                                  parent: cat.id,
                                  display_order: s.display_order ?? 0,
                                  is_active: s.is_active ?? true,
                                  image: s.image || undefined,
                                  image_url: s.image || undefined,
                                } as CategoryRow)
                              }
                              className="p-1 text-lime-800 hover:bg-lime-100 rounded"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Delete subcategory "${s.name_en}"?`))
                                  deleteMutation.mutate(s.slug)
                              }}
                              className="p-1 text-red-400 hover:bg-red-500/10 rounded"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </li>
                      )})}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        {!isLoading && total > pageSize && (
          <div className="mt-3 flex items-center justify-between text-xs text-stone-700">
            <div>
              Page {page} of {totalPages} ({total} root categories)
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1 rounded-full border border-lime-400/60 disabled:opacity-40 hover:bg-lime-100"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => (p < totalPages ? p + 1 : p))}
                disabled={page >= totalPages}
                className="px-3 py-1 rounded-full border border-lime-400/60 disabled:opacity-40 hover:bg-lime-100"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
