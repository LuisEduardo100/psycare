"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuthStore } from "@/store/useAuthStore"

interface UserAvatarProps {
    userId?: string
    fallbackName?: string
    className?: string
    src?: string // Allow pre-defined src if available (optimization) or from file input preview
    hasAvatar?: boolean
}

export function UserAvatar({ userId, fallbackName, className, src: propSrc, hasAvatar }: UserAvatarProps) {
    const { accessToken } = useAuthStore()
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
    const [error, setError] = useState(false)

    useEffect(() => {
        // If a direct src is provided (e.g. from file preview), use it
        if (propSrc) {
            setAvatarUrl(propSrc)
            return
        }

        // Optimization: If we know user has no avatar, don't fetch
        if (hasAvatar === false) {
            return;
        }

        if (!userId || !accessToken) return

        const fetchAvatar = async () => {
            try {
                // Ensure we don't duplicate /api/v1 if it's already in the env var
                let baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                if (baseUrl.endsWith('/api/v1')) {
                    baseUrl = baseUrl.substring(0, baseUrl.length - 7);
                }

                const response = await fetch(`${baseUrl}/api/v1/users/${userId}/avatar`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                })

                if (!response.ok) {
                    throw new Error('Avatar load failed')
                }

                const blob = await response.blob()
                const objectUrl = URL.createObjectURL(blob)
                setAvatarUrl(objectUrl)
                setError(false)

                // Cleanup
                return () => URL.revokeObjectURL(objectUrl)
            } catch (err) {
                setError(true)
                // console.error("Failed to load avatar", err)
            }
        }

        fetchAvatar()
    }, [userId, accessToken, propSrc, hasAvatar])

    return (
        <Avatar className={className}>
            {!error && avatarUrl ? (
                <AvatarImage src={avatarUrl} alt={fallbackName || "User"} />
            ) : null}
            <AvatarFallback>{fallbackName?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
        </Avatar>
    )
}
