import { GS_MAIN_LOCATION } from '@/constants/location'

/** Official Gold Standard customer contact (website + documents). */
export const GS_CONTACT = {
  phone: '+965 9853 8538',
  phoneTel: '+96598538538',
  email: 'info@goldstandardkw.com',
  addressEn: GS_MAIN_LOCATION.addressEn,
  addressAr: GS_MAIN_LOCATION.addressAr,
  googleRating: GS_MAIN_LOCATION.googleRating,
  googleMapsDirectionsUrl: GS_MAIN_LOCATION.directionsUrl,
  googleMapsPlaceUrl: GS_MAIN_LOCATION.placeUrl,
} as const
