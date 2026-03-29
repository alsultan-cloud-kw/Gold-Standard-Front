import { useQuery } from '@tanstack/react-query'
import { Package, AlertTriangle, ArrowRightLeft, Plus } from 'lucide-react'
import { inventoryApi } from '../../services/api'
import AdminNav from '../../components/admin/AdminNav'

export default function AdminInventory() {
  const { data: lowStock } = useQuery({
    queryKey: ['lowStock'],
    queryFn: inventoryApi.getLowStock,
  })

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <AdminNav />
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold gold-gradient-text">Inventory</h1>
            <p className="text-gold-100/60">Manage stock across all branches</p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-charcoal-800 border border-gold-500/30 rounded-lg text-gold-400 flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5" />
              Transfer
            </button>
            <button className="gold-button flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Adjust Stock
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="gold-card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-gold-500/10 flex items-center justify-center">
                <Package className="w-6 h-6 text-gold-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gold-100">1,234</h3>
                <p className="text-sm text-gold-100/60">Total Items</p>
              </div>
            </div>
          </div>
          <div className="gold-card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gold-100">7</h3>
                <p className="text-sm text-gold-100/60">Low Stock</p>
              </div>
            </div>
          </div>
          <div className="gold-card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Package className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gold-100">3</h3>
                <p className="text-sm text-gold-100/60">Out of Stock</p>
              </div>
            </div>
          </div>
        </div>

        <div className="gold-card">
          <h2 className="text-xl font-bold text-gold-100 mb-4">Low Stock Alerts</h2>
          <div className="space-y-3">
            {(lowStock as any[])?.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-charcoal-800 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gold-100">{item.product_name}</p>
                  <p className="text-xs text-gold-100/60">{item.branch_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-red-400">{item.available_quantity} left</p>
                  <p className="text-xs text-gold-100/60">Min: {item.low_stock_threshold}</p>
                </div>
              </div>
            )) || <p className="text-gold-100/60 text-center py-8">No low stock items</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
