import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { chromium } from '@playwright/test'

dotenv.config({ path: '.env.local', quiet: true })

const baseUrl = process.env.GROWTH_PHASE11_BASE_URL || 'http://127.0.0.1:3011'
const runId = Date.now().toString()
const password = 'Phase11!123456'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
const stripeSecretKey = process.env.STRIPE_SECRET_KEY

if (!supabaseUrl || !serviceRoleKey || !webhookSecret || !stripeSecretKey) {
    throw new Error('Missing required env vars for staging validation')
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
})
const stripe = new Stripe(stripeSecretKey)

function nowIso() {
    return new Date().toISOString()
}

function buildEmail(label) {
    return `growth-phase11-${label}-${runId}@example.com`
}

function buildName(label) {
    return `Growth ${label} ${runId}`
}

async function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForProfile(userId, timeoutMs = 15000) {
    const deadline = Date.now() + timeoutMs
    while (Date.now() < deadline) {
        const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
        if (data) return data
        await wait(500)
    }

    throw new Error(`Profile not found for user ${userId}`)
}

async function findUserByEmail(email) {
    const normalized = email.trim().toLowerCase()

    for (let page = 1; page <= 10; page += 1) {
        const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 })
        if (error) throw error

        const user = (data?.users ?? []).find((entry) => entry.email?.trim().toLowerCase() === normalized)
        if (user) return user
        if ((data?.users ?? []).length < 200) break
    }

    return null
}

async function createUser({ email, fullName, metadata = {}, role = 'psychologist' }) {
    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            full_name: fullName,
            name: fullName,
            ...metadata,
        },
    })

    if (error) throw error
    if (!data.user) throw new Error(`User was not created for ${email}`)

    await waitForProfile(data.user.id)
    await supabase.from('profiles').update({ full_name: fullName, role }).eq('id', data.user.id)

    return data.user
}

async function ensureInviteCodeAndProfile(userId) {
    const { data: inviteCode, error: inviteError } = await supabase
        .from('invite_codes')
        .insert({ owner_id: userId })
        .select('id, code')
        .single()

    if (inviteError) throw inviteError

    const { data: existingProfile, error: existingProfileError } = await supabase
        .from('growth_profiles')
        .select('id, referral_code')
        .eq('user_id', userId)
        .eq('program_type', 'member')
        .maybeSingle()

    if (existingProfileError) throw existingProfileError

    let growthProfile = existingProfile
    if (!growthProfile) {
        const { data: insertedProfile, error: insertedProfileError } = await supabase
            .from('growth_profiles')
            .insert({
                user_id: userId,
                program_type: 'member',
                status: 'active',
                referral_code: inviteCode.code,
                referral_link_slug: String(inviteCode.code).toLowerCase(),
                created_from_invite_code_id: inviteCode.id,
                metadata: { test_run: runId, source: 'phase11-validation' },
            })
            .select('id, referral_code')
            .single()

        if (insertedProfileError) throw insertedProfileError
        growthProfile = insertedProfile
    }

    return { inviteCode, growthProfile }
}

async function ensureRegisteredAttribution({ ownerProfileId, ownerUserId, inviteeUserId, inviteeEmail, inviteeName, code }) {
    const { data: existing } = await supabase
        .from('growth_attributions')
        .select('id')
        .eq('invitee_user_id', inviteeUserId)
        .maybeSingle()

    if (existing?.id) return existing.id

    const createdAt = nowIso()
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
        .from('growth_attributions')
        .insert({
            owner_profile_id: ownerProfileId,
            owner_user_id: ownerUserId,
            invitee_user_id: inviteeUserId,
            invitee_email: inviteeEmail,
            invitee_name: inviteeName,
            referral_code_used: code,
            source_type: 'member',
            source_channel: 'direct',
            capture_method: 'manual_code',
            status: 'registered',
            captured_at: createdAt,
            registered_at: createdAt,
            attribution_expires_at: expiresAt,
            metadata: { test_run: runId, source: 'phase11-validation' },
        })
        .select('id')
        .single()

    if (error) throw error

    return data.id
}

async function postStripeEvent(event) {
    const payload = JSON.stringify(event)
    const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: webhookSecret })

    const response = await fetch(`${baseUrl}/api/payments/webhook/stripe`, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'stripe-signature': signature,
        },
        body: payload,
    })

    const text = await response.text()
    const body = text ? JSON.parse(text) : null

    if (!response.ok) {
        throw new Error(`Webhook ${event.type} failed (${response.status}): ${JSON.stringify(body)}`)
    }

    return body
}

function buildCheckoutCompletedEvent({ eventId, sessionId, subscriptionId, customerId, email, membershipLevel, invoiceId, amount = 9900 }) {
    return {
        id: eventId,
        object: 'event',
        type: 'checkout.session.completed',
        data: {
            object: {
                id: sessionId,
                object: 'checkout.session',
                mode: 'subscription',
                payment_status: 'paid',
                subscription: subscriptionId,
                customer: customerId,
                customer_email: email,
                amount_total: amount,
                currency: 'mxn',
                invoice: invoiceId,
                metadata: {
                    membership_level: String(membershipLevel),
                    purchase_type: 'subscription_payment',
                },
            },
        },
    }
}

function buildRenewalEvent({ eventId, subscriptionId, customerId, email, invoiceId, paymentIntentId, amount = 9900 }) {
    return {
        id: eventId,
        object: 'event',
        type: 'invoice.payment_succeeded',
        data: {
            object: {
                id: invoiceId,
                object: 'invoice',
                subscription: subscriptionId,
                customer: customerId,
                customer_email: email,
                payment_intent: paymentIntentId,
                amount_paid: amount,
                currency: 'mxn',
                parent: {
                    subscription_details: {
                        metadata: {
                            membership_level: '1',
                        },
                    },
                },
            },
        },
    }
}

function buildCancellationEvent({ eventId, subscriptionId, customerId }) {
    const nowSeconds = Math.floor(Date.now() / 1000)

    return {
        id: eventId,
        object: 'event',
        type: 'customer.subscription.updated',
        data: {
            object: {
                id: subscriptionId,
                object: 'subscription',
                customer: customerId,
                status: 'canceled',
                cancel_at_period_end: false,
                canceled_at: nowSeconds,
                current_period_start: nowSeconds - 3600,
                current_period_end: nowSeconds,
                items: {
                    data: [{ price: { id: `price_phase11_${runId}` } }],
                },
                metadata: { membership_level: '1' },
            },
        },
    }
}

function buildRefundEvent({ eventId, chargeId, paymentIntentId, amount = 9900 }) {
    return {
        id: eventId,
        object: 'event',
        type: 'charge.refunded',
        data: {
            object: {
                id: chargeId,
                object: 'charge',
                payment_intent: paymentIntentId,
                amount,
                amount_refunded: amount,
                currency: 'mxn',
                billing_details: {
                    email: buildEmail('refund-charge'),
                },
                metadata: {
                    purchase_type: 'subscription_payment',
                },
                refunds: {
                    data: [
                        {
                            id: `re_${runId}`,
                            reason: 'requested_by_customer',
                        },
                    ],
                },
            },
        },
    }
}

async function waitForSingle(table, column, value, timeoutMs = 15000) {
    const deadline = Date.now() + timeoutMs

    while (Date.now() < deadline) {
        const { data, error } = await supabase.from(table).select('*').eq(column, value).maybeSingle()
        if (error) throw error
        if (data) return data
        await wait(500)
    }

    throw new Error(`Row not found in ${table} where ${column}=${value}`)
}

async function run() {
    const summary = {
        runId,
        registrationUi: {},
        webhookIdempotency: {},
        rewards: {},
        manualAdminReview: {},
        cancellation: {},
        refund: {},
        cron: {},
    }

    const referrer = await createUser({
        email: buildEmail('referrer'),
        fullName: buildName('Referrer'),
    })
    const { inviteCode, growthProfile } = await ensureInviteCodeAndProfile(referrer.id)

    const browser = await chromium.launch({ headless: true })

    try {
        const inviteeEmail = buildEmail('register')
        const registrationContext = await browser.newContext()
        const registrationPage = await registrationContext.newPage()

        await registrationPage.goto(`${baseUrl}/auth/register?ref=${inviteCode.code}`, { waitUntil: 'networkidle' })

        summary.registrationUi = {
            uiInviteCode: await registrationPage.inputValue('#inviteCode'),
            storedRef: await registrationPage.evaluate(() => localStorage.getItem('invite_ref_code')),
        }

        await registrationPage.fill('#email', inviteeEmail)
        await registrationPage.fill('#password', password)
        await registrationPage.fill('#confirmPassword', password)
        await registrationPage.click('button[type="submit"]')
        await registrationPage.waitForLoadState('networkidle')

        const signedUpUser = await (async () => {
            const deadline = Date.now() + 20000

            while (Date.now() < deadline) {
                const user = await findUserByEmail(inviteeEmail)
                if (user) return user
                await wait(500)
            }

            throw new Error('Signed-up invitee user not found')
        })()

        await supabase.auth.admin.updateUserById(signedUpUser.id, { email_confirm: true })
        await waitForProfile(signedUpUser.id)

        await registrationPage.goto(`${baseUrl}/auth/login`, { waitUntil: 'networkidle' })
        await registrationPage.fill('#email', inviteeEmail)
        await registrationPage.fill('#password', password)
        await registrationPage.click('button[type="submit"]')
        await registrationPage.waitForURL(/\/dashboard/)

        const callbackStatus = await registrationPage.evaluate(async () => {
            const response = await fetch('/api/auth/post-callback', {
                method: 'POST',
                credentials: 'include',
            })

            return response.status
        })

        await wait(1500)

        const registeredAttribution = await waitForSingle('growth_attributions', 'invitee_user_id', signedUpUser.id)
        summary.registrationUi.callbackStatus = callbackStatus
        summary.registrationUi.attributionStatus = registeredAttribution.status

        await registrationContext.close()

        const successfulInvitees = [signedUpUser]

        for (let index = 2; index <= 4; index += 1) {
            const user = await createUser({
                email: buildEmail(`success-${index}`),
                fullName: buildName(`Success ${index}`),
            })

            await ensureRegisteredAttribution({
                ownerProfileId: growthProfile.id,
                ownerUserId: referrer.id,
                inviteeUserId: user.id,
                inviteeEmail: user.email,
                inviteeName: buildName(`Success ${index}`),
                code: inviteCode.code,
            })

            successfulInvitees.push(user)
        }

        const qualifiedConversions = []

        for (let index = 0; index < successfulInvitees.length; index += 1) {
            const user = successfulInvitees[index]
            const subscriptionId = `sub_phase11_success_${index + 1}_${runId}`
            const customerId = `cus_phase11_success_${index + 1}_${runId}`

            await postStripeEvent(buildCheckoutCompletedEvent({
                eventId: `evt_phase11_checkout_success_${index + 1}_${runId}`,
                sessionId: `cs_phase11_success_${index + 1}_${runId}`,
                subscriptionId,
                customerId,
                email: user.email,
                membershipLevel: 1,
                invoiceId: `in_phase11_initial_success_${index + 1}_${runId}`,
            }))

            const conversion = await waitForSingle('growth_conversions', 'provider_subscription_id', subscriptionId)
            await supabase
                .from('growth_conversions')
                .update({ qualification_due_at: new Date(Date.now() - 60_000).toISOString() })
                .eq('id', conversion.id)

            const renewalEvent = buildRenewalEvent({
                eventId: `evt_phase11_renew_success_${index + 1}_${runId}`,
                subscriptionId,
                customerId,
                email: user.email,
                invoiceId: `in_phase11_renew_success_${index + 1}_${runId}`,
                paymentIntentId: `pi_phase11_renew_success_${index + 1}_${runId}`,
            })

            const firstRenewalResponse = await postStripeEvent(renewalEvent)

            if (index === 0) {
                const duplicateSameEventResponse = await postStripeEvent(renewalEvent)
                const duplicateDifferentEventResponse = await postStripeEvent(buildRenewalEvent({
                    eventId: `evt_phase11_renew_success_dup_${runId}`,
                    subscriptionId,
                    customerId,
                    email: user.email,
                    invoiceId: `in_phase11_renew_success_${index + 1}_${runId}`,
                    paymentIntentId: `pi_phase11_renew_success_${index + 1}_${runId}`,
                }))

                summary.webhookIdempotency = {
                    firstRenewalResponse,
                    duplicateSameEventResponse,
                    duplicateDifferentEventResponse,
                }
            }

            const qualified = await waitForSingle('growth_conversions', 'provider_subscription_id', subscriptionId)
            qualifiedConversions.push(qualified)
        }

        const { data: referrerRewards } = await supabase
            .from('growth_rewards')
            .select('*')
            .eq('beneficiary_user_id', referrer.id)
            .order('created_at', { ascending: true })

        const automaticReward = (referrerRewards ?? []).find((reward) => reward.reason_type === 'referral_active_1')
        const manualReward = (referrerRewards ?? []).find((reward) => reward.reason_type === 'referral_active_4')
        const { data: automaticBenefit } = automaticReward
            ? await supabase.from('growth_membership_benefits').select('*').eq('reward_id', automaticReward.id).maybeSingle()
            : { data: null }

        summary.rewards = {
            rewardCount: (referrerRewards ?? []).length,
            automaticRewardStatus: automaticReward?.status ?? null,
            automaticRewardType: automaticReward?.reward_type ?? null,
            automaticBenefitType: automaticBenefit?.benefit_type ?? null,
            automaticBenefitDurationUnit: automaticBenefit?.metadata?.duration_unit ?? null,
            automaticBenefitStartsAt: automaticBenefit?.starts_at ?? null,
            automaticBenefitEndsAt: automaticBenefit?.ends_at ?? null,
            manualRewardStatus: manualReward?.status ?? null,
            manualRewardType: manualReward?.reward_type ?? null,
        }

        if (!manualReward?.id) {
            throw new Error('Manual reward was not created at threshold 4')
        }

        const adminUser = await createUser({
            email: buildEmail('admin'),
            fullName: buildName('Admin'),
            role: 'admin',
        })

        const adminContext = await browser.newContext()
        const adminPage = await adminContext.newPage()

        await adminPage.goto(`${baseUrl}/auth/login`, { waitUntil: 'networkidle' })
        await adminPage.fill('#email', adminUser.email)
        await adminPage.fill('#password', password)
        await adminPage.click('button[type="submit"]')
        await adminPage.waitForURL(/\/dashboard/)

        await adminPage.goto(`${baseUrl}/dashboard/admin/growth/review/rewards/${manualReward.id}`, { waitUntil: 'networkidle' })

        const reviewTitle = await adminPage.locator('h1').textContent()
        if (await adminPage.locator('button:has-text("Aprobar")').count()) {
            await adminPage.click('button:has-text("Aprobar")')
            await wait(1500)
        }
        if (await adminPage.locator('button:has-text("Otorgar")').count()) {
            await adminPage.click('button:has-text("Otorgar")')
            await wait(2000)
        }

        const manualRewardAfterGrant = await waitForSingle('growth_rewards', 'id', manualReward.id)
        const { data: manualBenefit } = await supabase
            .from('growth_membership_benefits')
            .select('*')
            .eq('reward_id', manualReward.id)
            .maybeSingle()

        await adminPage.goto(`${baseUrl}/dashboard/admin/growth/review/conversions/${qualifiedConversions[0].id}`, { waitUntil: 'networkidle' })

        summary.manualAdminReview = {
            reviewTitle,
            hasFraudButton: (await adminPage.locator('button:has-text("Marcar fraude")').count()) > 0,
            manualRewardStatus: manualRewardAfterGrant.status,
            manualBenefitType: manualBenefit?.benefit_type ?? null,
            manualBenefitDurationUnit: manualBenefit?.metadata?.duration_unit ?? null,
            manualBenefitStartsAt: manualBenefit?.starts_at ?? null,
            manualBenefitEndsAt: manualBenefit?.ends_at ?? null,
        }

        await adminContext.close()

        const cancelledUser = await createUser({
            email: buildEmail('cancel'),
            fullName: buildName('Cancel'),
        })

        await ensureRegisteredAttribution({
            ownerProfileId: growthProfile.id,
            ownerUserId: referrer.id,
            inviteeUserId: cancelledUser.id,
            inviteeEmail: cancelledUser.email,
            inviteeName: buildName('Cancel'),
            code: inviteCode.code,
        })

        const cancelledSubscriptionId = `sub_phase11_cancel_${runId}`
        const cancelledCustomerId = `cus_phase11_cancel_${runId}`

        await postStripeEvent(buildCheckoutCompletedEvent({
            eventId: `evt_phase11_checkout_cancel_${runId}`,
            sessionId: `cs_phase11_cancel_${runId}`,
            subscriptionId: cancelledSubscriptionId,
            customerId: cancelledCustomerId,
            email: cancelledUser.email,
            membershipLevel: 1,
            invoiceId: `in_phase11_initial_cancel_${runId}`,
        }))

        await postStripeEvent(buildCancellationEvent({
            eventId: `evt_phase11_cancelled_${runId}`,
            subscriptionId: cancelledSubscriptionId,
            customerId: cancelledCustomerId,
        }))

        const cancelledConversion = await waitForSingle('growth_conversions', 'provider_subscription_id', cancelledSubscriptionId)
        const cancelledAttribution = await waitForSingle('growth_attributions', 'invitee_user_id', cancelledUser.id)

        summary.cancellation = {
            conversionStatus: cancelledConversion.status,
            attributionStatus: cancelledAttribution.status,
        }

        const refundUser = await createUser({
            email: buildEmail('refund'),
            fullName: buildName('Refund'),
        })

        await ensureRegisteredAttribution({
            ownerProfileId: growthProfile.id,
            ownerUserId: referrer.id,
            inviteeUserId: refundUser.id,
            inviteeEmail: refundUser.email,
            inviteeName: buildName('Refund'),
            code: inviteCode.code,
        })

        const refundSubscriptionId = `sub_phase11_refund_${runId}`
        const refundCustomerId = `cus_phase11_refund_${runId}`

        await postStripeEvent(buildCheckoutCompletedEvent({
            eventId: `evt_phase11_checkout_refund_${runId}`,
            sessionId: `cs_phase11_refund_${runId}`,
            subscriptionId: refundSubscriptionId,
            customerId: refundCustomerId,
            email: refundUser.email,
            membershipLevel: 1,
            invoiceId: `in_phase11_initial_refund_${runId}`,
        }))

        const refundPaymentIntent = await stripe.paymentIntents.create({
            amount: 9900,
            currency: 'mxn',
            payment_method: 'pm_card_visa',
            confirm: true,
            payment_method_types: ['card'],
        })

        await postStripeEvent(buildRenewalEvent({
            eventId: `evt_phase11_renew_refund_${runId}`,
            subscriptionId: refundSubscriptionId,
            customerId: refundCustomerId,
            email: refundUser.email,
            invoiceId: `in_phase11_renew_refund_${runId}`,
            paymentIntentId: refundPaymentIntent.id,
        }))

        await postStripeEvent(buildRefundEvent({
            eventId: `evt_phase11_refund_${runId}`,
            chargeId: typeof refundPaymentIntent.latest_charge === 'string' ? refundPaymentIntent.latest_charge : `ch_phase11_refund_${runId}`,
            paymentIntentId: refundPaymentIntent.id,
        }))

        const refundedConversion = await waitForSingle('growth_conversions', 'provider_subscription_id', refundSubscriptionId)
        const { data: refundedRewards } = await supabase
            .from('growth_rewards')
            .select('id')
            .eq('conversion_id', refundedConversion.id)

        summary.refund = {
            conversionStatus: refundedConversion.status,
            linkedRewardCount: (refundedRewards ?? []).length,
        }

        const cronUser = await createUser({
            email: buildEmail('cron'),
            fullName: buildName('Cron'),
        })

        await ensureRegisteredAttribution({
            ownerProfileId: growthProfile.id,
            ownerUserId: referrer.id,
            inviteeUserId: cronUser.id,
            inviteeEmail: cronUser.email,
            inviteeName: buildName('Cron'),
            code: inviteCode.code,
        })

        const cronSubscriptionId = `sub_phase11_cron_${runId}`
        const cronCustomerId = `cus_phase11_cron_${runId}`

        await postStripeEvent(buildCheckoutCompletedEvent({
            eventId: `evt_phase11_checkout_cron_${runId}`,
            sessionId: `cs_phase11_cron_${runId}`,
            subscriptionId: cronSubscriptionId,
            customerId: cronCustomerId,
            email: cronUser.email,
            membershipLevel: 1,
            invoiceId: `in_phase11_initial_cron_${runId}`,
        }))

        const cronConversion = await waitForSingle('growth_conversions', 'provider_subscription_id', cronSubscriptionId)
        const cronSubscription = await waitForSingle('subscriptions', 'provider_subscription_id', cronSubscriptionId)

        await supabase
            .from('growth_conversions')
            .update({ qualification_due_at: new Date(Date.now() - 60_000).toISOString() })
            .eq('id', cronConversion.id)

        const { error: transactionError } = await supabase.from('payment_transactions').insert({
            user_id: cronUser.id,
            profile_id: cronUser.id,
            subscription_id: cronSubscription.id,
            email: cronUser.email,
            purchase_type: 'subscription_payment',
            purchase_reference_id: '1',
            amount: 99,
            currency: 'MXN',
            payment_provider: 'stripe',
            provider_payment_id: `pi_phase11_cron_${runId}`,
            provider_invoice_id: `in_phase11_cron_${runId}`,
            status: 'completed',
            completed_at: nowIso(),
        })

        if (transactionError) throw transactionError

        const cronResponse = await fetch(`${baseUrl}/api/cron/growth-consolidation`, {
            method: 'GET',
            headers: {
                authorization: 'Bearer phase11-test-secret',
            },
        })

        const cronBody = await cronResponse.json()
        const cronQualifiedConversion = await waitForSingle('growth_conversions', 'provider_subscription_id', cronSubscriptionId)

        summary.cron = {
            statusCode: cronResponse.status,
            body: cronBody,
            conversionStatus: cronQualifiedConversion.status,
            qualifiedByRule: cronQualifiedConversion.metadata?.consolidation?.qualified_by_rule ?? null,
        }

        console.log(JSON.stringify(summary, null, 2))
    } finally {
        await browser.close()
    }
}

run().catch((error) => {
    console.error(error)
    process.exit(1)
})
