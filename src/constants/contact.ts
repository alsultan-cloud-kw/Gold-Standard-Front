import { GS_MAIN_LOCATION } from '@/constants/location'

/** Official Gold Standard customer contact (website + documents). */
export const GS_CONTACT = {
  /** Direct call line — voice only; does not support WhatsApp chat. */
  phone: '+965 9853 8538',
  phoneTel: '+96598538538',
  /** Switchboard / exchange (رقم البدالة). */
  switchboard: '+965 2209 5001',
  switchboardDisplay: '2209 5001',
  switchboardLocal: '22095001',
  switchboardTel: '+96522095001',
  email: 'info@goldstandardkw.com',
  addressEn: GS_MAIN_LOCATION.addressEn,
  addressAr: GS_MAIN_LOCATION.addressAr,
  googleRating: GS_MAIN_LOCATION.googleRating,
  googleMapsDirectionsUrl: GS_MAIN_LOCATION.directionsUrl,
  googleMapsPlaceUrl: GS_MAIN_LOCATION.placeUrl,
} as const
