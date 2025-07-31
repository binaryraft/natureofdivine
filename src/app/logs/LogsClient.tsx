
'use client';

import { useState, useEffect, useTransition } from 'react';
import { LogEntry } from '@/lib/log-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Trash2, Loader2, ServerCrash, Info, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const levelStyles: Record<LogEntry['level'], { icon: React.ElementType, badgeClass: string, iconClass: string }> = {
    info: { icon: Info, badgeClass: 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30', iconClass: 'text-blue-500' },
    warn: { icon: AlertTriangle, badgeClass: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30', iconClass: 'text-yellow-500' },
    error: { icon: ServerCrash, badgeClass: 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30', iconClass: 'text-red-500' },
};


export function LogsClient() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const fetchLogs = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/logs');
            if (!res.ok) {
                throw new Error('Failed to fetch logs');
            }
            const data = await res.json();
            setLogs(data);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    const clearLogs = async () => {
        startTransition(async () => {
             try {
                const res = await fetch('/api/logs', { method: 'DELETE' });
                if (!res.ok) {
                    throw new Error('Failed to clear logs');
                }
                await fetchLogs();
            } catch (e: any) {
                setError(e.message);
            }
        });
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    return (
        <div className="container mx-auto py-12 md:py-16">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Server Logs</CardTitle>
                            <CardDescription>Real-time logs from the server actions.</CardDescription>
                        </div>
                        <div className="flex gap-2">
                             <Button variant="outline" size="icon" onClick={fetchLogs} disabled={isLoading}>
                                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                            </Button>
                             <Button variant="destructive" size="icon" onClick={clearLogs} disabled={isPending}>
                                {isPending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading && !error && (
                        <div className="flex items-center justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <p className="ml-2">Loading logs...</p>
                        </div>
                    )}
                    {error && <p className="text-destructive text-center p-4">{error}</p>}
                    {!isLoading && !error && logs.length === 0 && (
                        <p className="text-muted-foreground text-center p-8">No logs found. Perform an action to see logs here.</p>
                    )}
                    {!isLoading && !error && logs.length > 0 && (
                        <Accordion type="single" collapsible className="w-full space-y-2">
                            {logs.map((log) => {
                                const { icon: Icon, badgeClass, iconClass } = levelStyles[log.level];
                                return (
                                    <AccordionItem value={`item-${log.id}`} key={log.id} className="bg-muted/30 rounded-lg px-4 border">
                                        <AccordionTrigger className="hover:no-underline">
                                            <div className="flex items-center gap-4 w-full">
                                                <Icon className={cn("h-5 w-5 shrink-0", iconClass)} />
                                                <Badge variant="outline" className={cn("capitalize font-mono text-xs", badgeClass)}>{log.level}</Badge>
                                                <span className="font-mono text-sm truncate flex-1 text-left">{log.message}</span>
                                                <span className="text-xs text-muted-foreground font-mono shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            {log.data && (
                                                <pre className="mt-2 w-full whitespace-pre-wrap break-all rounded-md bg-background p-4 text-xs font-mono border">
                                                    {JSON.stringify(log.data, null, 2)}
                                                </pre>
                                            )}
                                        </AccordionContent>
                                    </AccordionItem>
                                )
                            })}
                        </Accordion>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
