'use client';

import { useState, useEffect } from 'react';
import { LogEntry, getLogs } from '@/lib/log-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, RefreshCw, Filter, Search, Clock, AlertTriangle, CheckCircle2, XCircle, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { fetchLogs } from '@/lib/actions'; // We'll need to export this wrapper

export function LogsManager() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failure'>('all');
    const [levelFilter, setLevelFilter] = useState<'all' | 'info' | 'warn' | 'error'>('all');
    const { toast } = useToast();

    const loadLogs = async () => {
        setIsLoading(true);
        try {
            // We use a server action wrapper to fetch logs to avoid exposing Firestore logic directly to client if not needed
            // But since getLogs is 'use server' in log-store, we can import it directly? 
            // Next.js allows importing server actions directly into client components.
            // Let's try importing getLogs from log-store directly first.
            const fetchedLogs = await getLogs(200);
            setLogs(fetchedLogs);
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load logs.' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadLogs();
        // Optional: Auto-refresh every 30s
        const interval = setInterval(loadLogs, 30000);
        return () => clearInterval(interval);
    }, []);

    const filteredLogs = logs.filter(log => {
        const matchesSearch = 
            log.message.toLowerCase().includes(search.toLowerCase()) || 
            log.action?.toLowerCase().includes(search.toLowerCase()) ||
            log.userId?.toLowerCase().includes(search.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
        const matchesLevel = levelFilter === 'all' || log.level === levelFilter;

        return matchesSearch && matchesStatus && matchesLevel;
    });

    const getStatusIcon = (status?: string, level?: string) => {
        if (level === 'error') return <XCircle className="h-4 w-4 text-red-500" />;
        if (status === 'success') return <CheckCircle2 className="h-4 w-4 text-green-500" />;
        if (status === 'failure') return <XCircle className="h-4 w-4 text-red-500" />;
        if (level === 'warn') return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
        return <Activity className="h-4 w-4 text-blue-500" />;
    };

    const getDurationColor = (ms?: number) => {
        if (!ms) return 'text-muted-foreground';
        if (ms < 200) return 'text-green-600';
        if (ms < 1000) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <Card className="h-full flex flex-col min-h-[600px]">
            <CardHeader className="pb-4">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5"/> System Logs
                        </CardTitle>
                        <CardDescription>
                            Real-time monitoring of system actions, performance, and errors.
                        </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={loadLogs} disabled={isLoading}>
                        <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                        Refresh
                    </Button>
                </div>
                
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search logs by message, action, or user..." 
                            className="pl-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="success">Success</SelectItem>
                            <SelectItem value="failure">Failure</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={levelFilter} onValueChange={(v: any) => setLevelFilter(v)}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Level" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Levels</SelectItem>
                            <SelectItem value="info">Info</SelectItem>
                            <SelectItem value="warn">Warning</SelectItem>
                            <SelectItem value="error">Error</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-[600px] px-6">
                    {isLoading && logs.length === 0 ? (
                        <div className="flex justify-center p-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            No logs found matching your filters.
                        </div>
                    ) : (
                        <div className="space-y-1 pb-6">
                            {filteredLogs.map((log) => (
                                <div key={log.id} className="group border-b last:border-0 hover:bg-muted/40 transition-colors p-3 rounded-lg text-sm">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-3">
                                            {getStatusIcon(log.status, log.level)}
                                            <span className="font-semibold text-foreground/90">{log.action || 'System Event'}</span>
                                            {log.status && (
                                                <Badge variant="outline" className={cn("text-[10px] h-5 px-1.5 uppercase", 
                                                    log.status === 'success' ? "border-green-500/30 text-green-700 bg-green-500/10" : 
                                                    log.status === 'failure' ? "border-red-500/30 text-red-700 bg-red-500/10" : 
                                                    "border-blue-500/30 text-blue-700 bg-blue-500/10"
                                                )}>
                                                    {log.status}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            {log.duration && (
                                                <span className={cn("font-mono font-medium", getDurationColor(log.duration))}>
                                                    {log.duration}ms
                                                </span>
                                            )}
                                            <span title={new Date(log.timestamp).toLocaleString()}>
                                                {formatDistanceToNow(log.timestamp, { addSuffix: true })}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-between items-start pl-7">
                                        <p className="text-muted-foreground leading-relaxed break-words max-w-[80%]">
                                            {log.message}
                                        </p>
                                        {log.userId && log.userId !== 'system' && (
                                            <Badge variant="secondary" className="text-[10px] font-mono opacity-50">
                                                {log.userId.substring(0, 8)}...
                                            </Badge>
                                        )}
                                    </div>

                                    {log.data && (
                                        <Accordion type="single" collapsible className="w-full mt-2 pl-7">
                                            <AccordionItem value="details" className="border-none">
                                                <AccordionTrigger className="py-1 text-xs text-primary hover:no-underline">View Details</AccordionTrigger>
                                                <AccordionContent>
                                                    <pre className="bg-muted p-3 rounded-md text-[10px] font-mono overflow-auto max-h-[200px]">
                                                        {JSON.stringify(log.data, null, 2)}
                                                    </pre>
                                                </AccordionContent>
                                            </AccordionItem>
                                        </Accordion>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
