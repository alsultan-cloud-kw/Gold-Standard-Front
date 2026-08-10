/** Build-time SEO catalog — keep in sync with src/locales seo.* strings. */

export const SITE_ORIGIN = 'https://www.goldstandardkw.com'
export const SITE_NAME = 'Gold Standard'
export const SITE_OG_IMAGE = `${SITE_ORIGIN}/og/share-kw.jpg`

export const PRERENDER_PAGES = [
  {
    path: '/',
    titleEn: 'Buy Gold Kuwait · Certified Bullion & Coins | Gold Standard',
    titleAr: 'شراء ذهب الكويت · سبائك وعملات معتمدة | جولد ستاندرد',
    descEn:
      'Kuwait gold dealer for investment and savings. Live prices, MOCI hallmark, insured delivery, authenticity checks, and buyback. Branch of Sultan Gold, Central Gold Market.',
    descAr:
      'تاجر ذهب كويتي للاستثمار والادخار. أسعار مباشرة، ختم وزارة التجارة، شحن مؤمَّن، تحقق من الأصالة، وإعادة شراء. فرع ذهب السلطان في سوق الذهب المركزي.',
    priority: '1.0',
    changefreq: 'daily',
  },
  {
    path: '/prices',
    titleEn: 'Gold Price Kuwait Today · Live Buy & Sell KWD/g | Gold Standard',
    titleAr: 'سعر الذهب اليوم الكويت · شراء وبيع د.ك/غ | جولد ستاندرد',
    descEn:
      'Live gold price in Kuwait (KWD per gram) for 24K, 22K, 21K, 18K plus silver, platinum, and palladium. Buy and sell rates, chart, and gram calculator updated continuously.',
    descAr:
      'أسعار الذهب المباشرة في الكويت بالدينار للغرام للعيارات 24 و22 و21 و18 مع الفضة والبلاتين والبلاديوم. أسعار شراء وبيع ومخطط وحاسبة غرام تُحدَّث باستمرار.',
    priority: '0.95',
    changefreq: 'hourly',
  },
  {
    path: '/products',
    titleEn: 'Buy Gold Bars & Coins Kuwait · MOCI Certified | Gold Standard',
    titleAr: 'شراء سبائك وعملات ذهب الكويت · ختم وزارة التجارة | جولد ستاندرد',
    descEn:
      'Shop certified gold bars and coins in Kuwait at live KWD prices. MOCI hallmark, insured shipping, serial authenticity, and transparent making charges.',
    descAr:
      'تسوّق سبائك وعملات ذهب معتمدة في الكويت بأسعار الدينار المباشرة. ختم وزارة التجارة، شحن مؤمَّن، أرقام تسلسلية، ورسوم صناعة شفافة.',
    priority: '0.9',
    changefreq: 'daily',
  },
  {
    path: '/about',
    titleEn: 'About Gold Standard Kuwait · Investment Gold Company',
    titleAr: 'من نحن · جولد ستاندرد الكويت — شركة ذهب للاستثمار',
    descEn:
      'Gold Standard is a licensed Kuwait gold company for investment and savings — a branch of Sultan Gold — supplying high-purity bars, coins, and institutional solutions from Central Gold Market.',
    descAr:
      'جولد ستاندرد شركة ذهب مرخّصة في الكويت للاستثمار والادخار، وفرع من ذهب السلطان، لتوريد سبائك وعملات عالية النقاء وحلول مؤسسية من سوق الذهب المركزي.',
    priority: '0.7',
    changefreq: 'monthly',
  },
  {
    path: '/branches',
    titleEn: 'Gold Shop Central Gold Market Kuwait · Gold Standard Showroom',
    titleAr: 'محل ذهب سوق الذهب المركزي الكويت · صالة جولد ستاندرد',
    descEn:
      'Visit Gold Standard at No. 147, Central Gold Market, 1st Floor, Kuwait City. Hours, Google Maps directions, and 5.0 showroom rating.',
    descAr:
      'زُر جولد ستاندرد رقم 147، سوق الذهب المركزي، الدور الأول، مدينة الكويت. ساعات العمل واتجاهات خرائط جوجل وتقييم 5.0.',
    priority: '0.85',
    changefreq: 'monthly',
  },
  {
    path: '/contact',
    titleEn: 'Contact Gold Standard Kuwait · Phone, Email & Showroom',
    titleAr: 'تواصل جولد ستاندرد الكويت · هاتف وبريد وصالة عرض',
    descEn:
      'Contact Gold Standard Kuwait to buy gold, arrange buyback, or visit the Central Gold Market showroom. Call +965 9853 8538 or email info@goldstandardkw.com.',
    descAr:
      'تواصل مع جولد ستاندرد الكويت لشراء الذهب أو إعادة الشراء أو زيارة صالة سوق الذهب المركزي. اتصل +965 9853 8538 أو راسل info@goldstandardkw.com.',
    priority: '0.8',
    changefreq: 'monthly',
  },
  {
    path: '/zakat',
    titleEn: 'Gold Zakat Calculator Kuwait · Nisab & Live Prices | Gold Standard',
    titleAr: 'حاسبة زكاة الذهب الكويت · نصاب وأسعار مباشرة | جولد ستاندرد',
    descEn:
      'Calculate gold and silver zakat in Kuwait with live KWD prices, Awqaf-aligned nisab, and Hijri-year records. Free zakat center from Gold Standard.',
    descAr:
      'احسب زكاة الذهب والفضة في الكويت بأسعار الدينار المباشرة ونصاب الأوقاف وسجلات السنوات الهجرية. مركز زكاة مجاني من جولد ستاندرد.',
    priority: '0.8',
    changefreq: 'weekly',
  },
  {
    path: '/holdings',
    titleEn: 'Gold Holdings Kuwait · Metal Wallet | Gold Standard',
    titleAr: 'حيازات الذهب الكويت · محفظة المعادن | جولد ستاندرد',
    descEn:
      'Plan gold holdings in Kuwait at live market rates. Build savings with certified metal — instant purchase and target-price orders coming soon.',
    descAr:
      'خطّط لحيازات الذهب في الكويت بأسعار السوق المباشرة. ابنِ ادخارك بمعدن معتمد — الشراء الفوري وأوامر السعر المستهدف قريباً.',
    priority: '0.75',
    changefreq: 'weekly',
  },
  {
    path: '/verify',
    titleEn: 'Verify Gold Authenticity Kuwait | Gold Standard',
    titleAr: 'تحقق من أصالة الذهب الكويت | جولد ستاندرد',
    descEn:
      'Verify certified gold product authenticity in Kuwait. Check serials and digital passport records from Gold Standard before you buy or accept a transfer.',
    descAr:
      'تحقق من أصالة منتجات الذهب المعتمدة في الكويت. راجع الأرقام التسلسلية والجواز الرقمي من جولد ستاندرد قبل الشراء أو قبول التحويل.',
    priority: '0.7',
    changefreq: 'monthly',
  },
]

export const STORE_NAP = {
  phone: '+96598538538',
  email: 'info@goldstandardkw.com',
  addressEn: 'Gold Standard · No. 147, Central Gold Market, 1st Floor, Kuwait City 85951',
  addressAr:
    'شركة جولد ستاندارد · Gold Standard، رقم 147، سوق الذهب المركزي، الدور الأول، مدينة الكويت 85951',
  lat: 29.3762196,
  lng: 47.972631,
  instagram: 'https://www.instagram.com/goldstandard.kw/',
  placeUrl:
    'https://www.google.com/maps/place/%D8%B4%D8%B1%D9%83%D8%A9+%D8%B0%D9%87%D8%A8+%D8%A7%D9%84%D8%B3%D9%84%D8%B7%D8%A7%D9%86+_+Sultan+gold%D8%8C+%D8%B1%D9%82%D9%85+147%D8%8C+%D8%B3%D9%88%D9%82+%D8%A7%D9%84%D8%B0%D9%87%D8%A8+%D8%A7%D9%84%D9%85%D8%B1%D9%83%D8%B2%D9%8A+%D8%A7%D9%84%D8%AF%D9%88%D8%B1+%D8%A7%D9%84%D8%A3%D9%88%D9%84+%D9%85%D8%AD%D9%84%D8%8C+%D9%85%D8%AF%D9%8A%D9%86%D8%A9+%D8%A7%D9%84%D9%83%D9%88%D9%8A%D8%AA+85951/@29.3762196,47.972631,17z',
}
