import Script from 'next/script'
import { buildGoogleConsentModeState } from '@/lib/consent'

export function TrackingBootstrap() {
    const consentDefaults = buildGoogleConsentModeState(null)

    const bootstrapScript = `
        window.dataLayer = window.dataLayer || [];
        window.__sapihumTracking = window.__sapihumTracking || {};
        window.gtag = window.gtag || function(){ window.dataLayer.push(arguments); };
        window.gtag('consent', 'default', {
            ad_storage: '${consentDefaults.ad_storage}',
            ad_user_data: '${consentDefaults.ad_user_data}',
            ad_personalization: '${consentDefaults.ad_personalization}',
            analytics_storage: '${consentDefaults.analytics_storage}',
            functionality_storage: '${consentDefaults.functionality_storage}',
            personalization_storage: '${consentDefaults.personalization_storage}',
            security_storage: '${consentDefaults.security_storage}',
            wait_for_update: 500
        });
    `

    return (
        <Script
            id="tracking-bootstrap"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{ __html: bootstrapScript }}
        />
    )
}
