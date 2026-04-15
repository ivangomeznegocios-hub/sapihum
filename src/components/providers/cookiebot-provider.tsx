import Script from 'next/script'
import { CookiebotBridge } from './cookiebot-bridge'

const cookiebotDomainGroupId = process.env.NEXT_PUBLIC_COOKIEBOT_DOMAIN_GROUP_ID?.trim()

export function CookiebotProvider() {
    return (
        <>
            {cookiebotDomainGroupId ? (
                <Script
                    id="cookiebot"
                    src="https://consent.cookiebot.com/uc.js"
                    data-cbid={cookiebotDomainGroupId}
                    data-blockingmode="auto"
                    strategy="afterInteractive"
                />
            ) : null}
            <CookiebotBridge hasCookiebot={Boolean(cookiebotDomainGroupId)} />
        </>
    )
}
