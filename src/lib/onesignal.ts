import * as OneSignal from '@onesignal/node-onesignal'

let client: OneSignal.DefaultApi | null = null
let hasWarnedMissingConfig = false

function getOneSignalConfig() {
    return {
        appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID?.trim() || null,
        restApiKey: process.env.ONESIGNAL_REST_API_KEY?.trim() || null,
    }
}

function warnMissingConfig(missingVars: string[]) {
    if (hasWarnedMissingConfig) {
        return
    }

    hasWarnedMissingConfig = true
    console.warn(
        `OneSignal is not configured. Missing environment variable(s): ${missingVars.join(', ')}. Skipping push notification.`
    )
}

function getClient(restApiKey: string) {
    if (!client) {
        const configuration = OneSignal.createConfiguration({
            restApiKey,
        })
        client = new OneSignal.DefaultApi(configuration)
    }

    return client
}

interface PushNotificationProps {
    title: string
    message: string
    /** The Supabase user.id of the recipient */
    targetExternalId: string
    /** Optional URL to open when the notification is clicked */
    url?: string
}

export async function sendPushNotification({
    title,
    message,
    targetExternalId,
    url,
}: PushNotificationProps) {
    const { appId, restApiKey } = getOneSignalConfig()
    const missingVars = [
        ...(appId ? [] : ['NEXT_PUBLIC_ONESIGNAL_APP_ID']),
        ...(restApiKey ? [] : ['ONESIGNAL_REST_API_KEY']),
    ]

    if (!appId || !restApiKey) {
        warnMissingConfig(missingVars)
        return { success: false, error: 'OneSignal config missing' }
    }

    const onesignalClient = getClient(restApiKey)
    const notification = new OneSignal.Notification()
    notification.app_id = appId

    notification.include_aliases = {
        external_id: [targetExternalId],
    }

    notification.target_channel = 'push'

    notification.headings = {
        en: title,
        es: title,
    }
    notification.contents = {
        en: message,
        es: message,
    }

    if (url) {
        notification.url = url
    }

    try {
        const response = await onesignalClient.createNotification(notification)
        return { success: true, id: response.id }
    } catch (error) {
        console.error('Error sending OneSignal push notification:', error)
        return { success: false, error }
    }
}
