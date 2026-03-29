import { useState, useRef, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Plus, Search, Edit2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { productsApi } from '../../services/api'
import AdminNav from '../../components/admin/AdminNav'
import type { Product } from '../../types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

type Paginated<T> = { count: number; next: string | null; previous: string | null; results: T[] }
type CategoryOpt = { id: string; name_en: string; slug?: string; parent?: string | null }
type SubCat = { id: string; name_en: string; slug?: string }
type CategoryRoot = { id: string; name_en: string; subcategories?: SubCat[] }
type MetalTypeOpt = { id: string; display_name_en: string; name?: string }
type CaratOpt = { id: string; display_name_en: string; carat_value?: number }

function asResults<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  const p = data as Paginated<T> | undefined
  return p?.results ?? []
}

function primaryImageUrl(product: Product & { primary_image?: { image?: string; image_url?: string } }): string | null {
  const img = product.primary_image
  if (!img) return null
  if (img.image_url) return img.image_url
  if (img.image?.startsWith('http')) return img.image
  if (img.image) {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
    const origin = apiBase.replace(/\/api\/?$/, '')
    return `${origin}${img.image.startsWith('/') ? '' : '/'}${img.image}`
  }
  return null
}

const STATUS_OPTIONS = ['active', 'inactive', 'out_of_stock', 'discontinued'] as const
const MAKING_TYPES = [
  { value: 'per_gram', label: 'Per gram' },
  { value: 'fixed', label: 'Fixed' },
  { value: 'percentage', label: 'Percentage' },
] as const

export default function AdminProducts() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSlug, setEditingSlug] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingBarcodeValue, setEditingBarcodeValue] = useState<string>('')
  const [editingBarcodeImageUrl, setEditingBarcodeImageUrl] = useState<string>('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Client-side pagination for products table
  const [page, setPage] = useState(1)
  const pageSize = 10

  const [form, setForm] = useState({
    sku: '',
    name_ar: '',
    name_en: '',
    slug: '',
    parent_category_id: '', // root category
    subcategory_id: '', // optional; product assigned to subcategory or parent if empty
    category_id: '', // derived on save: subcategory_id || parent_category_id
    metal_type_id: '',
    carat_id: '',
    weight_grams: '',
    making_charge_type: 'per_gram',
    making_charge_amount: '0',
    description_ar: '',
    description_en: '',
    status: 'active',
    is_featured: false,
  })

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['adminProducts'],
    queryFn: () => productsApi.getProductsAdmin({ page_size: 200 }),
  })

  const { data: categoriesData } = useQuery({
    queryKey: ['adminCategoriesFlat'],
    queryFn: () => productsApi.getCategories({ page_size: 500 }),
  })

  const { data: categoryTree } = useQuery({
    queryKey: ['adminCategoriesTree'],
    queryFn: () => productsApi.getCategoriesAdminTree(),
  })

  const { data: metalTypesData } = useQuery({
    queryKey: ['metalTypes'],
    queryFn: () => productsApi.getMetalTypes(),
  })

  const { data: caratsData } = useQuery({
    queryKey: ['carats'],
    queryFn: () => productsApi.getCarats(),
  })

  const productList = useMemo(() => {
    const list = asResults<Product>(productsData)
    if (!searchQuery.trim()) return list
    const q = searchQuery.toLowerCase()
    return list.filter(
      (p) =>
        p.name_en?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        (p as Product & { serial_number?: string }).serial_number?.toLowerCase().includes(q) ||
        p.slug?.toLowerCase().includes(q)
    )
  }, [productsData, searchQuery])

  const total = productList.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const pageItems = productList.slice(start, end)

  const categories = useMemo(() => asResults<CategoryOpt>(categoriesData), [categoriesData])
  const roots = useMemo(() => (Array.isArray(categoryTree) ? (categoryTree as CategoryRoot[]) : []), [categoryTree])
  const metalTypes = useMemo(() => asResults<MetalTypeOpt>(metalTypesData), [metalTypesData])
  const carats = useMemo(() => asResults<CaratOpt>(caratsData), [caratsData])

  function resetForm() {
    setForm({
      sku: '',
      name_ar: '',
      name_en: '',
      slug: '',
      parent_category_id: '',
      subcategory_id: '',
      category_id: '',
      metal_type_id: '',
      carat_id: '',
      weight_grams: '',
      making_charge_type: 'per_gram',
      making_charge_amount: '0',
      description_ar: '',
      description_en: '',
      status: 'active',
      is_featured: false,
    })
    setEditingSlug(null)
    setEditingId(null)
    setEditingBarcodeValue('')
    setEditingBarcodeImageUrl('')
    setImageFile(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  function openAdd() {
    resetForm()
    setDialogOpen(true)
  }

  async function openEdit(product: Product) {
    resetForm()
    setEditingSlug(product.slug)
    setEditingId(product.id)
    try {
      const detail = (await productsApi.getProduct(product.slug)) as Record<string, unknown>
      const cat = detail.category as { id?: string; parent?: string | null } | undefined
      const metal = detail.metal_type as { id?: string } | undefined
      const carat = detail.carat as { id?: string } | undefined
      let parent_category_id = ''
      let subcategory_id = ''
      if (cat?.id) {
        if (cat.parent) {
          parent_category_id = String(cat.parent)
          subcategory_id = String(cat.id)
        } else {
          parent_category_id = String(cat.id)
        }
      }
      setForm({
        sku: String(detail.sku ?? ''),
        name_ar: String(detail.name_ar ?? ''),
        name_en: String(detail.name_en ?? ''),
        slug: String(detail.slug ?? ''),
        parent_category_id,
        subcategory_id,
        category_id: cat?.id ? String(cat.id) : '',
        metal_type_id: metal?.id ? String(metal.id) : '',
        carat_id: carat?.id ? String(carat.id) : '',
        weight_grams: String(detail.weight_grams ?? ''),
        making_charge_type: String(detail.making_charge_type ?? 'per_gram'),
        making_charge_amount: String(detail.making_charge_amount ?? '0'),
        description_ar: String(detail.description_ar ?? ''),
        description_en: String(detail.description_en ?? ''),
        status: String(detail.status ?? 'active'),
        is_featured: Boolean(detail.is_featured),
      })
      setEditingBarcodeValue(String(detail.barcode_value ?? ''))
      setEditingBarcodeImageUrl(String(detail.barcode_image_url ?? ''))
    } catch {
      setForm((f) => ({
        ...f,
        sku: product.sku,
        name_en: product.name_en,
        name_ar: product.name_ar,
        slug: product.slug,
        weight_grams: String(product.weight_grams ?? ''),
      }))
      setEditingBarcodeValue(String((product as Product & { barcode_value?: string }).barcode_value ?? ''))
      setEditingBarcodeImageUrl(String((product as Product & { barcode_image_url?: string }).barcode_image_url ?? ''))
    }
    setDialogOpen(true)
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const weight = parseFloat(form.weight_grams)
      if (Number.isNaN(weight) || weight < 0) throw new Error('Invalid weight')
      const making = parseFloat(form.making_charge_amount)
      if (Number.isNaN(making)) throw new Error('Invalid making charge')

      const payload = {
        sku: form.sku.trim(),
        name_ar: form.name_ar.trim(),
        name_en: form.name_en.trim(),
        slug: form.slug.trim() || undefined,
        category_id: form.subcategory_id || form.parent_category_id,
        metal_type_id: form.metal_type_id,
        carat_id: form.carat_id,
        weight_grams: weight,
        making_charge_type: form.making_charge_type,
        making_charge_amount: making,
        description_ar: form.description_ar.trim() || undefined,
        description_en: form.description_en.trim() || undefined,
        status: form.status,
        is_featured: form.is_featured,
      }

      if (!payload.category_id || !payload.metal_type_id || !payload.carat_id)
        throw new Error('Select a category (and subcategory if needed), metal type, and carat')

      if (editingSlug) {
        await productsApi.updateProduct(editingSlug, payload)
        if (imageFile && editingId) {
          await productsApi.createProductImage(editingId, imageFile, true)
        }
        return
      }

      const created = (await productsApi.createProduct(payload)) as { id?: string; serial_number?: string }
      const id = created?.id
      if (imageFile && id) {
        await productsApi.createProductImage(id, imageFile, true)
      }
      return created
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] })
      const serial = created?.serial_number
      toast.success(
        editingSlug
          ? 'Product updated'
          : serial
            ? `Product created. Serial number: ${serial}`
            : 'Product created'
      )
      setDialogOpen(false)
      resetForm()
    },
    onError: (e: Error) => toast.error(e.message || 'Save failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: (slug: string) => productsApi.deleteProduct(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] })
      toast.success('Product deleted')
    },
    onError: () => toast.error('Delete failed'),
  })

  const inputClass =
    'w-full px-3 py-2 bg-charcoal-800 border border-gold-500/30 rounded-lg text-gold-100 text-sm'

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <AdminNav />
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold gold-gradient-text-on-light">{t('admin.products')}</h1>
            <p className="gold-gradient-text-on-light">{t('admin.productsSubtitle')}</p>
          </div>
          <button type="button" onClick={openAdd} className="gold-button flex items-center gap-2">
            <Plus className="w-5 h-5" />
            {t('admin.addProduct')}
          </button>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gold-400/60" />
            <input
              type="text"
              placeholder="Search by name, SKU, serial, slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-charcoal-800 border border-gold-500/30 rounded-lg text-gold-100"
            />
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm() }}>
          <DialogContent className="bg-charcoal-900 border-gold-500/30 text-gold-100 max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingSlug ? 'Edit product' : 'Add product'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gold-100/60">SKU *</label>
                  <input
                    className={inputClass}
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    disabled={!!editingSlug}
                  />
                </div>
                <div>
                  <label className="text-xs text-gold-100/60">Serial number</label>
                  <input
                    className={inputClass + ' bg-charcoal-900/80'}
                    readOnly
                    value={
                      editingSlug
                        ? (productList.find((p) => p.slug === editingSlug) as Product & { serial_number?: string })?.serial_number ?? '—'
                        : 'Auto-generated on save'
                    }
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gold-100/60">Barcode</label>
                {editingSlug ? (
                  <div className="mt-1 p-3 rounded-lg border border-gold-500/20 bg-charcoal-900/60">
                    <p className="text-sm text-gold-100 font-mono break-all">
                      {editingBarcodeValue || '—'}
                    </p>
                    {editingBarcodeImageUrl ? (
                      <img
                        src={editingBarcodeImageUrl}
                        alt="Product barcode"
                        className="mt-2 h-14 w-auto bg-white rounded p-1 border border-gold-500/20"
                      />
                    ) : (
                      <p className="text-xs text-gold-100/50 mt-2">Barcode image not available.</p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gold-100/50 mt-1">
                    Barcode value and image are auto-generated after product creation.
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gold-100/60">Weight (g) *</label>
                  <input
                    type="number"
                    step="0.001"
                    className={inputClass}
                    value={form.weight_grams}
                    onChange={(e) => setForm({ ...form, weight_grams: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gold-100/60">Name (EN) *</label>
                <input className={inputClass} value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-gold-100/60">Name (AR) *</label>
                <input className={inputClass} value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} />
              </div>
              {roots.length > 0 ? (
                <>
                  <div>
                    <label className="text-xs text-gold-100/60">Category (parent) *</label>
                    <select
                      className={inputClass}
                      value={form.parent_category_id}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          parent_category_id: e.target.value,
                          subcategory_id: '',
                        })
                      }
                    >
                      <option value="">— Select category —</option>
                      {roots.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name_en}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gold-100/50 mt-1">
                      If this category has subcategories, you can narrow the product to one below.
                    </p>
                  </div>
                  {(() => {
                    const root = roots.find((r) => r.id === form.parent_category_id)
                    const subs = root?.subcategories
                    if (!subs || subs.length === 0) return null
                    return (
                      <div>
                        <label className="text-xs text-gold-100/60">Subcategory</label>
                        <select
                          className={inputClass}
                          value={form.subcategory_id}
                          onChange={(e) => setForm({ ...form, subcategory_id: e.target.value })}
                        >
                          <option value="">— Use parent category only —</option>
                          {subs.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name_en}
                            </option>
                          ))}
                        </select>
                      </div>
                    )
                  })()}
                </>
              ) : (
                <div>
                  <label className="text-xs text-gold-100/60">Category *</label>
                  <select
                    className={inputClass}
                    value={form.parent_category_id}
                    onChange={(e) =>
                      setForm({ ...form, parent_category_id: e.target.value, subcategory_id: '' })
                    }
                  >
                    <option value="">— Select —</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name_en}
                        {c.parent ? ' (subcategory)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="text-xs text-gold-100/60">Metal type *</label>
                <select
                  className={inputClass}
                  value={form.metal_type_id}
                  onChange={(e) => setForm({ ...form, metal_type_id: e.target.value })}
                >
                  <option value="">— Select —</option>
                  {metalTypes.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.display_name_en}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gold-100/60">Carat *</label>
                <select
                  className={inputClass}
                  value={form.carat_id}
                  onChange={(e) => setForm({ ...form, carat_id: e.target.value })}
                >
                  <option value="">— Select —</option>
                  {carats.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.display_name_en}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gold-100/60">Making charge type</label>
                  <select
                    className={inputClass}
                    value={form.making_charge_type}
                    onChange={(e) => setForm({ ...form, making_charge_type: e.target.value })}
                  >
                    {MAKING_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gold-100/60">Making charge amount</label>
                  <input
                    type="number"
                    step="0.001"
                    className={inputClass}
                    value={form.making_charge_amount}
                    onChange={(e) => setForm({ ...form, making_charge_amount: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gold-100/60">Status</label>
                <select
                  className={inputClass}
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                />
                Featured
              </label>
              <div>
                <label className="text-xs text-gold-100/60">Product image</label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="w-full text-sm text-gold-100/70 file:mr-2 file:rounded file:border-0 file:bg-gold-500/20 file:px-2 file:py-1"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                />
                <p className="text-xs text-gold-100/50 mt-1">
                  {editingSlug ? 'Optional — replaces primary if set.' : 'Optional — set as primary after create.'}
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  disabled={saveMutation.isPending}
                  onClick={() => saveMutation.mutate()}
                  className="gold-button flex-1 disabled:opacity-50"
                >
                  {saveMutation.isPending ? 'Saving…' : editingSlug ? 'Update' : 'Create'}
                </button>
                <button type="button" onClick={() => setDialogOpen(false)} className="px-4 py-2 rounded-lg border border-gold-500/30">
                  Cancel
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <div className="gold-card overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-gold-500/20">
                <th className="text-left align-middle py-3 px-4 text-gold-100/60 font-medium w-[22%]">
                  Product
                </th>
                <th className="text-left align-middle py-3 px-4 text-gold-100/60 font-medium w-[14%]">
                  Category
                </th>
                <th className="text-left align-middle py-3 px-4 text-gold-100/60 font-medium font-mono text-xs w-[12%]">
                  SKU
                </th>
                <th className="text-left align-middle py-3 px-4 text-gold-100/60 font-medium font-mono text-xs w-[14%]">
                  Serial
                </th>
                <th className="text-right align-middle py-3 px-4 text-gold-100/60 font-medium w-[10%]">
                  Price
                </th>
                <th className="text-center align-middle py-3 px-4 text-gold-100/60 font-medium w-[10%]">
                  Status
                </th>
                <th className="text-center align-middle py-3 px-4 text-gold-100/60 font-medium w-[14%]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center align-middle text-gold-100/60">
                    Loading...
                  </td>
                </tr>
              ) : productList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center align-middle text-gold-100/60">
                    No products. Add one to get started.
                  </td>
                </tr>
              ) : (
              pageItems.map((product) => {
                  const src = primaryImageUrl(product as Product & { primary_image?: { image?: string; image_url?: string } })
                  const categoryName =
                    product.category && typeof product.category === 'object' && 'name_en' in product.category
                      ? (product.category as { name_en: string }).name_en
                      : '—'
                  return (
                    <tr key={product.id} className="border-b border-gold-500/10 align-middle">
                      <td className="py-3 px-4 align-middle text-left">
                        <div className="flex items-center gap-3 min-w-0">
                          {src ? (
                            <img
                              src={src}
                              alt=""
                              className="w-10 h-10 shrink-0 rounded object-cover bg-charcoal-800"
                            />
                          ) : (
                            <div className="w-10 h-10 shrink-0 rounded bg-charcoal-800" />
                          )}
                          <span className="text-gold-100 truncate" title={product.name_en}>
                            {product.name_en}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 align-middle text-left text-gold-100/80">
                        <div className="truncate" title={categoryName}>
                          {categoryName}
                        </div>
                      </td>
                      <td className="py-3 px-4 align-middle text-left text-gold-100/60 font-mono text-xs whitespace-nowrap">
                        {product.sku}
                      </td>
                      <td className="py-3 px-4 align-middle text-left text-gold-100/70 font-mono text-xs whitespace-nowrap">
                        {(product as Product & { serial_number?: string }).serial_number ?? '—'}
                      </td>
                      <td className="py-3 px-4 align-middle text-right text-gold-400 whitespace-nowrap tabular-nums">
                        {(() => {
                          const live = (product as Product).live_total_price
                          const base = (product as Product).current_price
                          const value = live != null ? live : base
                          return value != null ? `${Number(value).toLocaleString()} KWD` : '—'
                        })()}
                      </td>
                      <td className="py-3 px-4 align-middle text-center">
                        <span className="inline-block px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400 whitespace-nowrap">
                          {product.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 align-middle text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(product)}
                            className="p-2 text-gold-400 hover:bg-gold-500/10 rounded align-middle"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Delete ${product.name_en}?`)) deleteMutation.mutate(product.slug)
                            }}
                            className="p-2 text-red-400 hover:bg-red-500/10 rounded align-middle"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
          {total > pageSize && (
            <div className="flex items-center justify-between mt-3 text-xs text-gold-100/70">
              <div>
                Page {page} of {totalPages} ({total} products)
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1 rounded-full border border-gold-500/60 disabled:opacity-40 hover:bg-gold-500/10"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => (p < totalPages ? p + 1 : p))}
                  disabled={page >= totalPages}
                  className="px-3 py-1 rounded-full border border-gold-500/60 disabled:opacity-40 hover:bg-gold-500/10"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
