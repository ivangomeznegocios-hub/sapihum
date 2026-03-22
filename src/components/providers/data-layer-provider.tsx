import Script from 'next/script'
import { cookies } from 'next/headers'
import { getUserProfile } from '@/lib/supabase/server'
import {
  CONSENT_COOKIE_NAME,
  hasAnalyticsConsent,
  parseConsentCookie,
} from '@/lib/consent'

export async function DataLayerProvider() {
  const cookieStore = await cookies()
  const consentCookie = cookieStore.get(CONSENT_COOKIE_NAME)?.value ?? null
  const consent = parseConsentCookie(consentCookie)

  if (!hasAnalyticsConsent(consent)) {
    return null
  }

  const profile = await getUserProfile()

  let userType = 'guest'
  let membershipTier = 'null'

  if (profile) {
    const level = profile.membership_level || 0

    if (level === 0) {
      userType = 'free_member'
      membershipTier = 'registro_gratuito'
    } else {
      userType = 'premium_member'
      if (level === 1) membershipTier = 'nivel_1_comunidad'
      else if (level === 2) membershipTier = 'nivel_2_especializacion'
      else if (level >= 3) membershipTier = 'nivel_3_avanzado'
      else membershipTier = 'premium'
    }
  }

  const dataLayerScript = `
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      'event': 'page_context',
      'user_type': '${userType}',
      'membership_tier': '${membershipTier}'
    });
  `

    return (
    <Script
      id="datalayer-init"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: dataLayerScript }}
    />
  )
}
