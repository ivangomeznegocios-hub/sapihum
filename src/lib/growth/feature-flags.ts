function readBooleanFlag(name: string, defaultValue = false) {
    const value = process.env[name]
    if (value === undefined) return defaultValue
    return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase())
}

export function getGrowthRewardFeatureFlags() {
    return {
        rewards: readBooleanFlag('ENABLE_GROWTH_REWARDS'),
        stripeDiscounts: readBooleanFlag('ENABLE_GROWTH_STRIPE_DISCOUNTS'),
        stripeUpgrades: readBooleanFlag('ENABLE_GROWTH_STRIPE_UPGRADES'),
        rewardCron: readBooleanFlag('ENABLE_GROWTH_REWARD_CRON'),
        advancedPrograms: readBooleanFlag('ENABLE_GROWTH_ADVANCED_PROGRAMS'),
    }
}

export function isAdvancedGrowthRewardConfig(config: {
    benefit_kind?: unknown
    target_membership_level?: unknown
}) {
    return config.benefit_kind === 'free_membership_level'
        || (
            config.target_membership_level !== undefined
            && config.target_membership_level !== null
            && config.target_membership_level !== 'current'
        )
}
