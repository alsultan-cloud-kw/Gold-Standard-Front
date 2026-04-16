import { Award, Users, TrendingUp, Shield } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const MILESTONE_IDS = ['founded', 'firstBranch', 'expansion', 'digital', 'innovation'] as const
const VALUE_IDS = ['trust', 'quality', 'customer', 'innovation'] as const
const VALUE_ICONS = {
  trust: Shield,
  quality: Award,
  customer: Users,
  innovation: TrendingUp,
} as const

export default function AboutPage() {
  const { t } = useTranslation()

  const stats = [
    { value: '15+', labelKey: 'aboutPage.statYears' as const },
    { value: '5', labelKey: 'aboutPage.statBranches' as const },
    { value: '50K+', labelKey: 'aboutPage.statCustomers' as const },
    { value: '100%', labelKey: 'aboutPage.statCertified' as const },
  ]

  return (
    <div className="min-h-screen py-8 bg-gradient-to-b from-lime-50/50 via-white to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-black mb-4">{t('aboutPage.title')}</h1>
          <p className="text-lg text-stone-800 font-medium max-w-3xl mx-auto">{t('aboutPage.hero')}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <div key={index} className="product-card-lime text-center">
              <div className="text-3xl md:text-4xl font-bold text-black mb-2">{stat.value}</div>
              <div className="text-sm font-semibold text-black/75">{t(stat.labelKey)}</div>
            </div>
          ))}
        </div>

        {/* Our Story */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-black mb-8 text-center">{t('aboutPage.storyTitle')}</h2>
          <div className="relative">
            <div className="absolute left-1/2 -translate-x-1/2 h-full w-0.5 bg-lime-400/70" />
            <div className="space-y-8">
              {MILESTONE_IDS.map((id, index) => (
                <div
                  key={id}
                  className={`flex items-center ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}
                >
                  <div
                    className={`w-1/2 ${index % 2 === 0 ? 'pe-8 text-end' : 'ps-8 text-start'}`}
                  >
                    <div
                      className={`product-card-lime inline-block max-w-md ${index % 2 === 0 ? 'text-end' : 'text-start'}`}
                    >
                      <span className="text-yellow-950 font-bold text-sm">{t(`aboutPage.m.${id}.year`)}</span>
                      <h3 className="text-lg font-bold text-black mt-1">{t(`aboutPage.m.${id}.title`)}</h3>
                      <p className="text-sm text-black/75 mt-1 leading-relaxed">{t(`aboutPage.m.${id}.description`)}</p>
                    </div>
                  </div>
                  <div className="w-4 h-4 rounded-full bg-yellow-300 border-4 border-black z-10 shrink-0" />
                  <div className="w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Our Values */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-black mb-8 text-center">{t('aboutPage.valuesTitle')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUE_IDS.map((id) => {
              const Icon = VALUE_ICONS[id]
              return (
                <div key={id} className="product-card-lime text-center">
                  <div className="w-14 h-14 rounded-lg bg-black/10 flex items-center justify-center mx-auto mb-4 border border-black/10">
                    <Icon className="w-7 h-7 text-black" />
                  </div>
                  <h3 className="text-lg font-bold text-black mb-2">{t(`aboutPage.v.${id}.title`)}</h3>
                  <p className="text-sm text-black/75 leading-relaxed">{t(`aboutPage.v.${id}.description`)}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-8">
          <div className="product-card-lime">
            <h3 className="text-2xl font-bold text-black mb-4">{t('aboutPage.missionTitle')}</h3>
            <p className="text-black/80 leading-relaxed font-medium">{t('aboutPage.missionBody')}</p>
          </div>
          <div className="product-card-lime">
            <h3 className="text-2xl font-bold text-black mb-4">{t('aboutPage.visionTitle')}</h3>
            <p className="text-black/80 leading-relaxed font-medium">{t('aboutPage.visionBody')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
