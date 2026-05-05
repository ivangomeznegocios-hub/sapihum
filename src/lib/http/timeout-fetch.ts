export class RequestTimeoutError extends Error {
    constructor(label: string, timeoutMs: number) {
        super(`${label} timed out after ${timeoutMs}ms`)
        this.name = 'RequestTimeoutError'
    }
}

export function createTimeoutFetch(timeoutMs: number, label = 'request'): typeof fetch {
    return async (input, init = {}) => {
        const controller = new AbortController()
        const upstreamSignal = init.signal
        const timeoutId = setTimeout(() => {
            controller.abort(new RequestTimeoutError(label, timeoutMs))
        }, timeoutMs)

        const abortFromUpstream = () => {
            controller.abort(upstreamSignal?.reason)
        }

        if (upstreamSignal?.aborted) {
            abortFromUpstream()
        } else {
            upstreamSignal?.addEventListener('abort', abortFromUpstream, { once: true })
        }

        try {
            return await fetch(input, {
                ...init,
                signal: controller.signal,
            })
        } finally {
            clearTimeout(timeoutId)
            upstreamSignal?.removeEventListener('abort', abortFromUpstream)
        }
    }
}

export async function withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    label = 'operation'
): Promise<T> {
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
            reject(new RequestTimeoutError(label, timeoutMs))
        }, timeoutMs)
    })

    try {
        return await Promise.race([promise, timeoutPromise])
    } finally {
        if (timeoutId) {
            clearTimeout(timeoutId)
        }
    }
}
