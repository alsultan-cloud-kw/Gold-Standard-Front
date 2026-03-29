import { useQuery } from '@tanstack/react-query'
import { MapPin, Phone, Clock, Navigation } from 'lucide-react'
import { inventoryApi } from '../services/api'

export default function BranchesPage() {
  const { data: branches, isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: inventoryApi.getBranches,
  })

  if (isLoading) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="gold-card h-32" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold gold-gradient-text mb-4">Our Branches</h1>
          <p className="text-gold-100/70 max-w-2xl mx-auto">
            Visit any of our branches across Kuwait for personalized service and expert advice.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(branches as any[])?.map((branch) => (
            <div key={branch.id} className="gold-card">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-lg bg-gold-500/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-gold-400">{branch.code}</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gold-100">{branch.name_en}</h3>
                  <span className="text-xs text-gold-400/60 uppercase">{branch.branch_type}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gold-100/60">{branch.address}, {branch.city}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gold-400 flex-shrink-0" />
                  <span className="text-sm text-gold-100/60">{branch.phone}</span>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gold-100/60">
                    <p>Sat-Thu: {branch.opening_time} - {branch.closing_time}</p>
                    {branch.is_open_friday && (
                      <p>Fri: {branch.friday_opening_time} - {branch.friday_closing_time}</p>
                    )}
                  </div>
                </div>
              </div>

              {branch.latitude && branch.longitude && (
                <a
                  href={`https://maps.google.com/?q=${branch.latitude},${branch.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-gold-500/10 text-gold-400 rounded-lg hover:bg-gold-500/20 transition-colors"
                >
                  <Navigation className="w-4 h-4" />
                  Get Directions
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
