"use client"

import { useEffect, useRef, useCallback } from "react"
import { useAuthStore } from "@/store/useAuthStore"

interface SSEEvent {
    type: string
    [key: string]: any
}

interface UseSSEOptions {
    onNewDailyLog?: (data: any) => void
    onNewAlert?: (data: any) => void
    onAlertUpdated?: (data: any) => void
    onError?: (error: Event) => void
}

/**
 * Custom hook for SSE (Server-Sent Events) integration.
 * Manages connection lifecycle: connects on mount, disconnects on unmount.
 * Automatically reconnects on connection loss.
 */
export function useSSE(options: UseSSEOptions = {}) {
    const { accessToken } = useAuthStore()
    const eventSourceRef = useRef<EventSource | null>(null)
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const connect = useCallback(() => {
        if (!accessToken) return

        // Close existing connection
        if (eventSourceRef.current) {
            eventSourceRef.current.close()
        }

        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"
        const url = `${baseUrl}/events/stream?token=${encodeURIComponent(accessToken)}`

        const eventSource = new EventSource(url)
        eventSourceRef.current = eventSource

        eventSource.onmessage = (event) => {
            try {
                const data: SSEEvent = JSON.parse(event.data)

                switch (data.type) {
                    case "new_daily_log":
                        options.onNewDailyLog?.(data)
                        break
                    case "new_alert":
                        options.onNewAlert?.(data)
                        break
                    case "alert_updated":
                        options.onAlertUpdated?.(data)
                        break
                    default:
                        console.log("[SSE] Unknown event type:", data.type)
                }
            } catch (err) {
                console.error("[SSE] Failed to parse event:", err)
            }
        }

        eventSource.onerror = (error) => {
            console.error("[SSE] Connection error:", error)
            options.onError?.(error)
            eventSource.close()

            // Auto-reconnect after 5 seconds
            reconnectTimeoutRef.current = setTimeout(() => {
                console.log("[SSE] Reconnecting...")
                connect()
            }, 5000)
        }
    }, [accessToken, options])

    useEffect(() => {
        connect()

        return () => {
            // Cleanup on unmount
            if (eventSourceRef.current) {
                eventSourceRef.current.close()
                eventSourceRef.current = null
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current)
                reconnectTimeoutRef.current = null
            }
        }
    }, [connect])

    const disconnect = useCallback(() => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close()
            eventSourceRef.current = null
        }
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
            reconnectTimeoutRef.current = null
        }
    }, [])

    return { disconnect }
}
