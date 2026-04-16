import { Link } from 'react-router-dom'
import { ArrowRight, ShoppingCart } from 'lucide-react'
import { useCart } from '../../contexts/CartContext'
import type { Product } from '../../types'
import ProductPriceTrendArrow from '../ProductPriceTrendArrow'
import { productImageSrc } from '../../utils/productImage'
import { productUnitPrice, formatKwd } from '../../utils/productPrice'
import type { ProductFetchTrendMap } from '../../hooks/useProductPriceTrendSincePreviousFetch'

interface FeaturedProductsProps {
  title: string
  products: Product[]
  viewAllLink?: string
  fetchTrends?: ProductFetchTrendMap
}

export default function FeaturedProducts({ title, products, viewAllLink, fetchTrends }: FeaturedProductsProps) {
  const { addToCart } = useCart()

  if (!products || products.length === 0) {
    return null
  }

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold gold-gradient-text-on-light mb-2">{title}</h2>
            <p className="text-stone-900/60">Handpicked pieces from our collection</p>
          </div>
          {viewAllLink && (
            <Link
              to={viewAllLink}
              className="hidden sm:flex items-center gap-2 text-amber-800 font-semibold hover:text-amber-950 transition-colors"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.slice(0, 8).map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onAddToCart={() => addToCart(product)}
              fetchTrends={fetchTrends}
            />
          ))}
        </div>

        {viewAllLink && (
          <div className="text-center mt-8 sm:hidden">
            <Link
              to={viewAllLink}
              className="inline-flex items-center gap-2 text-amber-800 font-semibold hover:text-amber-950 transition-colors"
            >
              View All Products
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

function ProductCard({
  product,
  onAddToCart,
  fetchTrends,
}: {
  product: Product
  onAddToCart: () => void
  fetchTrends?: ProductFetchTrendMap
}) {
  const imageSrc = productImageSrc(product)
  const ft = fetchTrends?.[product.id]
  const trendOverride = ft?.trend ?? null
  const percentOverride = ft?.percent ?? null
  return (
    <div className="product-card-lime group">
      <Link to={`/products/${product.slug}`}>
        <div className="relative overflow-hidden rounded-lg mb-4 aspect-[4/3] ring-1 ring-black/10">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={product.name_en}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-white/60 flex items-center justify-center">
              <span className="text-black/50 text-sm">No Image</span>
            </div>
          )}
          
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.is_featured && (
              <span className="px-2 py-1 text-xs font-semibold bg-black/85 text-white rounded shadow-sm">
                Featured
              </span>
            )}
            <span className="px-2 py-1 text-xs font-semibold bg-white/90 text-black rounded shadow-sm ring-1 ring-black/10">
              {product.carat?.display_name_en}
            </span>
          </div>

          {/* Quick Add Button */}
          <button
            onClick={(e) => {
              e.preventDefault()
              onAddToCart()
            }}
            className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-black text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:bg-zinc-800"
          >
            <ShoppingCart className="w-5 h-5" />
          </button>
        </div>
      </Link>

      <Link to={`/products/${product.slug}`}>
        <h3 className="text-base font-semibold text-black group-hover:underline decoration-black/40 transition-colors line-clamp-1 mb-1">
          {product.name_en}
        </h3>
      </Link>
      
      <p className="text-sm text-black/65 mb-3">
        {product.weight_grams}g • {product.category?.name_en}
      </p>
      
      <div className="flex items-center justify-between gap-2">
        <div className="price-tag-lime flex-wrap">
          <ProductPriceTrendArrow
            product={product}
            variant="light"
            showPercent
            trendOverride={trendOverride}
            percentOverride={percentOverride}
          />
          <span>{productUnitPrice(product).toLocaleString()} KWD</span>
        </div>
        {product.live_buy_price_per_gram != null && (
          <span className="text-xs text-black/55">
            {formatKwd(product.live_buy_price_per_gram)} KWD/g
          </span>
        )}
      </div>
    </div>
  )
}
