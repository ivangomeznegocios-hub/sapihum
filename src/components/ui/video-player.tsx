'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Loader2, Settings } from 'lucide-react'

interface VideoPlayerProps {
    /** YouTube URL or video ID */
    src: string
    /** Optional title for accessibility */
    title?: string
    /** Optional poster/thumbnail image */
    poster?: string
    /** Custom aspect ratio (default: 16/9) */
    aspectRatio?: string
    /** Show custom controls overlay */
    showControls?: boolean
}

/**
 * Extracts YouTube video ID from various URL formats
 * Supports: youtube.com/watch?v=, youtu.be/, youtube.com/embed/
 */
function extractYouTubeId(url: string): string | null {
    if (!url) return null

    // If it's already just an ID (11 characters)
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
        return url
    }

    // Match various YouTube URL formats
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/
    ]

    for (const pattern of patterns) {
        const match = url.match(pattern)
        if (match) return match[1]
    }

    return null
}

function extractVimeoId(url: string): string | null {
    if (!url) return null
    const match = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/)
    return match ? match[1] : null
}

// Format seconds to MM:SS
function formatTime(seconds: number): string {
    if (isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Declare YT types for TypeScript
declare global {
    interface Window {
        YT: any
        onYouTubeIframeAPIReady: () => void
    }
}

/**
 * Custom Video Player Component with Full Custom Controls
 * 
 * Hides YouTube's native controls completely and provides custom UI:
 * - Play/Pause button
 * - Progress bar with seek
 * - Volume control
 * - Fullscreen toggle
 * - Time display
 */
export function VideoPlayer({
    src,
    title = 'Video',
    poster,
    aspectRatio = '16/9',
    showControls = true
}: VideoPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [hasStarted, setHasStarted] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const [volume, setVolume] = useState(100)
    const [progress, setProgress] = useState(0)
    const [duration, setDuration] = useState(0)
    const [currentTime, setCurrentTime] = useState(0)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [showControlsOverlay, setShowControlsOverlay] = useState(false)
    const [isBuffering, setIsBuffering] = useState(false)

    const containerRef = useRef<HTMLDivElement>(null)
    const playerRef = useRef<any>(null)
    const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const videoId = extractYouTubeId(src)
    const vimeoId = extractVimeoId(src)

    // Load YouTube IFrame API
    useEffect(() => {
        if (!hasStarted || !videoId) return

        // Load API script if not loaded
        if (!window.YT) {
            const tag = document.createElement('script')
            tag.src = 'https://www.youtube.com/iframe_api'
            const firstScriptTag = document.getElementsByTagName('script')[0]
            firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
        }

        // Initialize player when API is ready
        const initPlayer = () => {
            if (playerRef.current) return

            playerRef.current = new window.YT.Player(`yt-player-${videoId}`, {
                videoId: videoId,
                playerVars: {
                    autoplay: 1,
                    controls: 0, // Hide YouTube controls completely
                    modestbranding: 1,
                    rel: 0,
                    showinfo: 0,
                    iv_load_policy: 3,
                    fs: 0, // We handle fullscreen ourselves
                    playsinline: 1,
                    enablejsapi: 1,
                    disablekb: 1, // Disable keyboard controls (we handle them)
                    origin: window.location.origin
                },
                events: {
                    onReady: (event: any) => {
                        setDuration(event.target.getDuration())
                        setIsLoading(false)
                        setIsPlaying(true)
                        startProgressTracking()
                    },
                    onStateChange: (event: any) => {
                        switch (event.data) {
                            case window.YT.PlayerState.PLAYING:
                                setIsPlaying(true)
                                setIsBuffering(false)
                                startProgressTracking()
                                break
                            case window.YT.PlayerState.PAUSED:
                                setIsPlaying(false)
                                break
                            case window.YT.PlayerState.BUFFERING:
                                setIsBuffering(true)
                                break
                            case window.YT.PlayerState.ENDED:
                                setIsPlaying(false)
                                stopProgressTracking()
                                break
                        }
                    }
                }
            })
        }

        if (window.YT && window.YT.Player) {
            initPlayer()
        } else {
            window.onYouTubeIframeAPIReady = initPlayer
        }

        return () => {
            stopProgressTracking()
            if (playerRef.current) {
                playerRef.current.destroy()
                playerRef.current = null
            }
        }
    }, [hasStarted, videoId])

    // Progress tracking
    const startProgressTracking = useCallback(() => {
        stopProgressTracking()
        progressIntervalRef.current = setInterval(() => {
            if (playerRef.current && playerRef.current.getCurrentTime) {
                const time = playerRef.current.getCurrentTime()
                const dur = playerRef.current.getDuration()
                setCurrentTime(time)
                setDuration(dur)
                setProgress((time / dur) * 100)
            }
        }, 250)
    }, [])

    const stopProgressTracking = useCallback(() => {
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current)
            progressIntervalRef.current = null
        }
    }, [])

    // Fullscreen change listener
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement)
        }
        document.addEventListener('fullscreenchange', handleFullscreenChange)
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }, [])

    // Auto-hide controls
    const showControlsTemporarily = useCallback(() => {
        setShowControlsOverlay(true)
        if (hideControlsTimeoutRef.current) {
            clearTimeout(hideControlsTimeoutRef.current)
        }
        hideControlsTimeoutRef.current = setTimeout(() => {
            if (isPlaying) {
                setShowControlsOverlay(false)
            }
        }, 3000)
    }, [isPlaying])

    if (vimeoId) {
        return (
            <div
                className="relative overflow-hidden rounded-xl bg-black"
                style={{ aspectRatio }}
            >
                <iframe
                    src={`https://player.vimeo.com/video/${vimeoId}?title=0&byline=0&portrait=0`}
                    className="absolute top-0 left-0 w-full h-full"
                    frameBorder="0"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    title={title}
                />
            </div>
        )
    }

    if (!videoId) {
        return (
            <div
                className="flex items-center justify-center bg-gray-900 text-gray-400 rounded-xl"
                style={{ aspectRatio }}
            >
                <p className="text-sm">URL de video no válida (Solo YouTube o Vimeo)</p>
            </div>
        )
    }

    function handlePlay() {
        setIsLoading(true)
        setHasStarted(true)
    }

    function togglePlay() {
        if (!playerRef.current) return
        if (isPlaying) {
            playerRef.current.pauseVideo()
        } else {
            playerRef.current.playVideo()
        }
    }

    function toggleMute() {
        if (!playerRef.current) return
        if (isMuted) {
            playerRef.current.unMute()
            playerRef.current.setVolume(volume)
        } else {
            playerRef.current.mute()
        }
        setIsMuted(!isMuted)
    }

    function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
        const newVolume = parseInt(e.target.value)
        setVolume(newVolume)
        if (playerRef.current) {
            playerRef.current.setVolume(newVolume)
            if (newVolume === 0) {
                playerRef.current.mute()
                setIsMuted(true)
            } else if (isMuted) {
                playerRef.current.unMute()
                setIsMuted(false)
            }
        }
    }

    function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
        if (!playerRef.current || !duration) return
        const rect = e.currentTarget.getBoundingClientRect()
        const percent = (e.clientX - rect.left) / rect.width
        const seekTime = percent * duration
        playerRef.current.seekTo(seekTime, true)
    }

    function toggleFullscreen() {
        if (!containerRef.current) return
        if (document.fullscreenElement) {
            document.exitFullscreen()
        } else {
            containerRef.current.requestFullscreen()
        }
    }

    // Generate thumbnail URL if not provided
    const thumbnailUrl = poster || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`

    return (
        <div
            ref={containerRef}
            className="relative overflow-hidden rounded-xl bg-black group"
            style={{ aspectRatio }}
            onMouseMove={showControlsTemporarily}
            onMouseEnter={() => setShowControlsOverlay(true)}
            onMouseLeave={() => isPlaying && setShowControlsOverlay(false)}
        >
            {/* Poster/Thumbnail - shown before play */}
            {!hasStarted && (
                <div className="absolute inset-0 z-10">
                    {/* Thumbnail Image */}
                    <img
                        src={thumbnailUrl}
                        alt={title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                        }}
                    />

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                    {/* Play button */}
                    <button
                        onClick={handlePlay}
                        disabled={isLoading}
                        className="absolute inset-0 flex items-center justify-center cursor-pointer group/play"
                        aria-label={`Reproducir ${title}`}
                    >
                        <div className="relative">
                            <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
                            <div className="relative h-20 w-20 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center shadow-2xl transition-all duration-300 group-hover/play:scale-110 group-hover/play:bg-primary">
                                {isLoading ? (
                                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                                ) : (
                                    <Play className="h-8 w-8 text-white ml-1" fill="white" />
                                )}
                            </div>
                        </div>
                    </button>

                    {/* Title overlay at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-white font-semibold text-lg line-clamp-2 drop-shadow-lg">
                            {title}
                        </h3>
                    </div>
                </div>
            )}

            {/* YouTube Player Container - invisible iframe */}
            {hasStarted && (
                <div className="absolute inset-0">
                    <div id={`yt-player-${videoId}`} className="w-full h-full" />

                    {/* Invisible overlay to capture clicks and hide YouTube UI */}
                    <div
                        className="absolute inset-0 z-10"
                        onClick={togglePlay}
                        style={{
                            // Leave a small gap at bottom for our controls
                            bottom: showControls ? '60px' : '0'
                        }}
                    />
                </div>
            )}

            {/* Buffering indicator */}
            {isBuffering && hasStarted && (
                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                    <Loader2 className="h-12 w-12 text-white animate-spin" />
                </div>
            )}

            {/* Custom Controls Overlay */}
            {showControls && hasStarted && (
                <div
                    className={`absolute bottom-0 left-0 right-0 z-30 transition-all duration-300 ${showControlsOverlay || !isPlaying ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                        }`}
                >
                    {/* Gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent pointer-events-none" />

                    <div className="relative p-3 space-y-2">
                        {/* Progress bar */}
                        <div
                            className="h-1.5 bg-white/20 rounded-full cursor-pointer group/progress hover:h-2 transition-all"
                            onClick={handleSeek}
                        >
                            <div
                                className="h-full bg-primary rounded-full relative"
                                style={{ width: `${progress}%` }}
                            >
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover/progress:opacity-100 transition-opacity" />
                            </div>
                        </div>

                        {/* Controls row */}
                        <div className="flex items-center gap-3">
                            {/* Play/Pause */}
                            <button
                                onClick={togglePlay}
                                className="text-white hover:text-primary transition-colors p-1"
                                aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
                            >
                                {isPlaying ? (
                                    <Pause className="h-6 w-6" fill="currentColor" />
                                ) : (
                                    <Play className="h-6 w-6 ml-0.5" fill="currentColor" />
                                )}
                            </button>

                            {/* Volume */}
                            <div className="flex items-center gap-2 group/volume">
                                <button
                                    onClick={toggleMute}
                                    className="text-white hover:text-primary transition-colors p-1"
                                    aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}
                                >
                                    {isMuted || volume === 0 ? (
                                        <VolumeX className="h-5 w-5" />
                                    ) : (
                                        <Volume2 className="h-5 w-5" />
                                    )}
                                </button>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={isMuted ? 0 : volume}
                                    onChange={handleVolumeChange}
                                    className="w-0 group-hover/volume:w-20 transition-all duration-200 accent-primary h-1 cursor-pointer"
                                />
                            </div>

                            {/* Time display */}
                            <span className="text-white/90 text-sm font-mono">
                                {formatTime(currentTime)} / {formatTime(duration)}
                            </span>

                            {/* Spacer */}
                            <div className="flex-1" />

                            {/* Title (truncated) */}
                            <span className="text-white/70 text-sm truncate max-w-[200px] hidden sm:block">
                                {title}
                            </span>

                            {/* Fullscreen */}
                            <button
                                onClick={toggleFullscreen}
                                className="text-white hover:text-primary transition-colors p-1"
                                aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
                            >
                                {isFullscreen ? (
                                    <Minimize className="h-5 w-5" />
                                ) : (
                                    <Maximize className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

/**
 * Compact video player for cards/grids
 */
export function VideoPlayerCompact({
    src,
    title = 'Video'
}: {
    src: string
    title?: string
}) {
    return (
        <VideoPlayer
            src={src}
            title={title}
            aspectRatio="16/9"
            showControls={false}
        />
    )
}

/**
 * Full-width video player for detail pages
 */
export function VideoPlayerFull({
    src,
    title = 'Video',
    poster
}: {
    src: string
    title?: string
    poster?: string
}) {
    return (
        <div className="w-full max-w-4xl mx-auto">
            <VideoPlayer
                src={src}
                title={title}
                poster={poster}
                aspectRatio="16/9"
                showControls={true}
            />
        </div>
    )
}
