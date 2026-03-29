import { useState } from 'react'
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react'

const testimonials = [
  {
    id: 1,
    name: 'Ahmed Al-Rashid',
    role: 'Regular Customer',
    avatar: 'AR',
    rating: 5,
    text: 'Excellent service and transparent pricing. The live gold price feature helps me make informed decisions. Highly recommended for anyone looking to buy gold in Kuwait.',
  },
  {
    id: 2,
    name: 'Fatima Hassan',
    role: 'Jewelry Enthusiast',
    avatar: 'FH',
    rating: 5,
    text: 'The quality of their jewelry is exceptional. I bought a 22K gold necklace and the craftsmanship is beautiful. The staff was very helpful in explaining the pricing.',
  },
  {
    id: 3,
    name: 'Mohammed Al-Sabah',
    role: 'Business Owner',
    avatar: 'MS',
    rating: 5,
    text: 'As a business owner, I appreciate their professional approach and accurate gold pricing. Their multi-branch system makes it convenient to trade from any location.',
  },
  {
    id: 4,
    name: 'Sarah Johnson',
    role: 'Expat Resident',
    avatar: 'SJ',
    rating: 4,
    text: 'Great experience shopping here. The website is easy to use and the prices are updated in real-time. Delivery was prompt and secure.',
  },
]

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0)

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
  }

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  return (
    <section className="py-20 bg-siteBg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold gold-gradient-text mb-4">What Our Customers Say</h2>
          <p className="text-slate-700 max-w-2xl mx-auto">
            Trusted by thousands of customers across Kuwait
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Navigation Buttons */}
          <button
            onClick={prevTestimonial}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 lg:-translate-x-12 w-10 h-10 rounded-full bg-sky-200 border border-gold-500/30 flex items-center justify-center text-gold-400 hover:bg-gold-500/10 transition-colors z-10"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <button
            onClick={nextTestimonial}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 lg:translate-x-12 w-10 h-10 rounded-full bg-sky-200 border border-gold-500/30 flex items-center justify-center text-gold-400 hover:bg-gold-500/10 transition-colors z-10"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Testimonial Card */}
          <div className="gold-card relative overflow-hidden">
            <Quote className="absolute top-4 right-4 w-12 h-12 text-gold-500/10" />
            
            <div className="text-center py-8 px-4">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold text-charcoal-950">
                  {testimonials[currentIndex].avatar}
                </span>
              </div>

              {/* Rating */}
              <div className="flex items-center justify-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < testimonials[currentIndex].rating
                        ? 'text-gold-400 fill-gold-400'
                        : 'text-gold-400/20'
                    }`}
                  />
                ))}
              </div>

              {/* Text */}
              <p className="text-lg text-gold-100/80 italic mb-6 max-w-2xl mx-auto">
                "{testimonials[currentIndex].text}"
              </p>

              {/* Author */}
              <div>
                <h4 className="text-lg font-semibold text-gold-100">
                  {testimonials[currentIndex].name}
                </h4>
                <p className="text-sm text-gold-100/60">
                  {testimonials[currentIndex].role}
                </p>
              </div>
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'w-6 bg-gold-500'
                    : 'bg-gold-500/30 hover:bg-gold-500/50'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
