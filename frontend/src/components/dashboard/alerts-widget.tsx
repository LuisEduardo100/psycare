"use client"

import { Link } from "@/i18n/routing"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import api from "@/lib/api"
import { AlertTriangle, CheckCircle } from "lucide-react"

interface Alert {
    id: string
    patient: { full_name: string }
    severity: 'LOW' | 'MEDIUM' | 'HIGH'
    trigger_source: string
    status: 'PENDING' | 'VIEWED' | 'CONTACTED' | 'RESOLVED'
    created_at: string
}

export function AlertsWidget() {
    const [alerts, setAlerts] = useState<Alert[]>([])
    const [loading, setLoading] = useState(true)

    const fetchAlerts = async () => {
        try {
            // Fetch pending or viewed alerts, high/medium severity
            const response = await api.get('/alerts?status=PENDING&severity=HIGH')
            // Or just get all and filter client side for widget
            setAlerts(response.data)
        } catch (error) {
            console.error("Failed to fetch alerts", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAlerts()
        const interval = setInterval(fetchAlerts, 30000) // Poll every 30s
        return () => clearInterval(interval)
    }, [])

    const handleAcknowledge = async (id: string) => {
        try {
            await api.patch(`/alerts/${id}/status`, { status: "VIEWED" })
            fetchAlerts()
        } catch (error) {
            console.error("Failed to update alert", error)
        }
    }

    if (loading) return <div>Loading alerts...</div>

    return (
        <Card className="col-span-1 md:col-span-2">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        Sentinel Alerts
                    </CardTitle>
                    <Link href="/dashboard/alerts" className="text-sm text-primary font-medium hover:underline">
                        Ver todos
                    </Link>
                </div>
                <CardDescription>
                    High priority risks detected by the system.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {alerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-6 text-muted-foreground">
                        <CheckCircle className="h-8 w-8 mb-2 text-green-500" />
                        <p>No pending alerts.</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Patient</TableHead>
                                <TableHead>Trigger</TableHead>
                                <TableHead>Severity</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {alerts.map((alert) => (
                                <TableRow key={alert.id}>
                                    <TableCell className="font-medium">{alert.patient?.full_name || 'Unknown'}</TableCell>
                                    <TableCell>{alert.trigger_source}</TableCell>
                                    <TableCell>
                                        <Badge variant={alert.severity === 'HIGH' ? 'destructive' : 'default'}>
                                            {alert.severity}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{alert.status}</TableCell>
                                    <TableCell>
                                        {alert.status === 'PENDING' && (
                                            <Button size="sm" variant="outline" onClick={() => handleAcknowledge(alert.id)}>
                                                Ack
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    )
}
