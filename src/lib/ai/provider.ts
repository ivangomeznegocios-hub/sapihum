/**
 * AI Provider Configuration
 * 
 * This module provides a provider-agnostic interface for AI models.
 * Supports: OpenAI, Anthropic, Google (Gemini), and Groq.
 * 
 * Configure via environment variables:
 * - AI_PROVIDER: 'openai' | 'anthropic' | 'google' | 'groq'
 * - AI_API_KEY: Your API key for the selected provider
 * - AI_MODEL_NAME: Model name (e.g., 'gpt-4', 'claude-3-opus', 'gemini-pro', 'llama-3.1-70b')
 */

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'groq'

export interface AIConfig {
    provider: AIProvider
    apiKey: string
    modelName: string
}

export function getAIConfig(): AIConfig {
    const provider = (process.env.AI_PROVIDER || 'openai') as AIProvider
    const apiKey = process.env.AI_API_KEY || ''
    const modelName = process.env.AI_MODEL_NAME || getDefaultModel(provider)

    return {
        provider,
        apiKey,
        modelName,
    }
}

function getDefaultModel(provider: AIProvider): string {
    switch (provider) {
        case 'openai':
            return 'gpt-4o'
        case 'anthropic':
            return 'claude-3-5-sonnet-20241022'
        case 'google':
            return 'gemini-1.5-pro'
        case 'groq':
            return 'llama-3.1-70b-versatile'
        default:
            return 'gpt-4o'
    }
}

/**
 * Get the appropriate model configuration for Vercel AI SDK
 * 
 * Usage with Vercel AI SDK:
 * 
 * ```ts
 * import { openai } from '@ai-sdk/openai'
 * import { anthropic } from '@ai-sdk/anthropic'
 * import { google } from '@ai-sdk/google'
 * import { groq } from '@ai-sdk/groq'
 * import { getAIConfig } from '@/lib/ai/provider'
 * 
 * const config = getAIConfig()
 * 
 * // You would then use the appropriate provider based on config.provider
 * // Example for OpenAI:
 * // const model = openai(config.modelName)
 * ```
 */
export function getProviderImportPath(): string {
    const { provider } = getAIConfig()

    switch (provider) {
        case 'openai':
            return '@ai-sdk/openai'
        case 'anthropic':
            return '@ai-sdk/anthropic'
        case 'google':
            return '@ai-sdk/google'
        case 'groq':
            return '@ai-sdk/groq'
        default:
            return '@ai-sdk/openai'
    }
}

/**
 * Environment variable documentation for AI configuration.
 * This is exported for reference.
 */
export const AI_ENV_DOCS = {
    AI_PROVIDER: 'The AI provider to use: openai, anthropic, google, or groq',
    AI_API_KEY: 'API key for the selected provider',
    AI_MODEL_NAME: 'Specific model name to use (optional, uses sensible defaults)',
    EXAMPLES: {
        openai: {
            AI_PROVIDER: 'openai',
            AI_MODEL_NAME: 'gpt-4o, gpt-4-turbo, gpt-3.5-turbo',
        },
        anthropic: {
            AI_PROVIDER: 'anthropic',
            AI_MODEL_NAME: 'claude-3-5-sonnet-20241022, claude-3-opus-20240229',
        },
        google: {
            AI_PROVIDER: 'google',
            AI_MODEL_NAME: 'gemini-1.5-pro, gemini-1.5-flash',
        },
        groq: {
            AI_PROVIDER: 'groq',
            AI_MODEL_NAME: 'llama-3.1-70b-versatile, mixtral-8x7b-32768',
        },
    },
}
