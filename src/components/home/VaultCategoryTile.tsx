import { memo } from 'react'
import { Link } from 'react-router-dom'
import type { Category } from '@/types'
import { categoryImageSrc } from '@/utils/categoryImage'

type Props = {
  category: Category
  label: string
}

function VaultCategoryTileInner({ category, label }: Props) {
  const img = categoryImageSrc(category)

  return (
    <Link
      to={`/products?category=${encodeURIComponent(category.slug)}`}
      className="vault-category-tile group min-w-0"
      aria-label={label}
    >
      {img ? (
        <img
          src={img}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className="absolute inset-0 bg-[#1A1F2E]" aria-hidden />
      )}

      <div className="vault-category-tile-overlay" aria-hidden />

      <div className="vault-category-tile-label">
        <span className="vault-category-tile-text">{label}</span>
        <span className="vault-category-tile-underline" aria-hidden />
      </div>
    </Link>
  )
}

export const VaultCategoryTile = memo(VaultCategoryTileInner)
