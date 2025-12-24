
'use client';

import { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, Save, Globe } from 'lucide-react';
import { countries, getCountryFlag } from '@/lib/countries';
import { getPricingConfig, updateCountryPrice, updateDefaultInternationalPrice, type PricingConfig } from '@/lib/pricing-store';

export function PricingManager() {
    const { toast } = useToast();
    const [config, setConfig] = useState<PricingConfig | null>(null);
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, startTransition] = useTransition();
    const [editPrices, setEditPrices] = useState<Record<string, string>>({}); // Buffer for edits

    const loadConfig = async () => {
        setIsLoading(true);
        try {
            const data = await getPricingConfig();
            setConfig(data);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to load pricing configuration.' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadConfig();
    }, []);

    const handleDefaultPriceUpdate = () => {
        if (!config) return;
        const price = parseInt(editPrices['DEFAULT'] || config.defaultInternationalPrice.toString());
        if (isNaN(price)) return;

        startTransition(async () => {
            try {
                await updateDefaultInternationalPrice(price);
                toast({ title: 'Success', description: 'Default international price updated.' });
                await loadConfig();
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to update default price.' });
            }
        });
    };

    const handleCountryPriceUpdate = (countryCode: string) => {
        const priceStr = editPrices[countryCode];
        if (!priceStr) return; // No change
        const price = parseInt(priceStr);
        if (isNaN(price)) return;

        startTransition(async () => {
            try {
                await updateCountryPrice(countryCode, price);
                toast({ title: 'Success', description: `Price for ${countryCode} updated.` });
                await loadConfig();
                // Clear edit buffer for this country
                setEditPrices(prev => {
                    const next = { ...prev };
                    delete next[countryCode];
                    return next;
                });
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to update price.' });
            }
        });
    };

    const filteredCountries = countries.filter(c => 
        c.name.toLowerCase().includes(search.toLowerCase()) || 
        c.iso2.toLowerCase().includes(search.toLowerCase())
    );

    if (isLoading || !config) {
        return (
            <div className="flex justify-center items-center p-8">
                <Loader2 className="animate-spin h-8 w-8" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Globe /> Global Settings</CardTitle>
                    <CardDescription>Set the default price for international shipments (Base Price + Shipping).</CardDescription>
                </CardHeader>
                <CardContent className="flex gap-4 items-end">
                    <div className="space-y-2 flex-1">
                        <Label>Default International Price (INR)</Label>
                        <Input 
                            type="number" 
                            value={editPrices['DEFAULT'] ?? config.defaultInternationalPrice} 
                            onChange={(e) => setEditPrices(prev => ({ ...prev, 'DEFAULT': e.target.value }))}
                        />
                    </div>
                    <Button onClick={handleDefaultPriceUpdate} disabled={isSaving}>
                        {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
                        <span className="ml-2">Update Default</span>
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Country Specific Pricing</CardTitle>
                            <CardDescription>Override the default price for specific countries.</CardDescription>
                        </div>
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search country..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md max-h-[600px] overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Country</TableHead>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Current Price (INR)</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredCountries.map(country => {
                                    const explicitPrice = config.countryPrices[country.iso2];
                                    const effectivePrice = explicitPrice ?? config.defaultInternationalPrice;
                                    const isEdited = editPrices[country.iso2] !== undefined;

                                    return (
                                        <TableRow key={country.iso2}>
                                            <TableCell className="font-medium">
                                                <span className="mr-2">{getCountryFlag(country.iso2)}</span>
                                                {country.name}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">{country.iso2}</TableCell>
                                            <TableCell>
                                                <Input 
                                                    className="w-32" 
                                                    type="number" 
                                                    placeholder={effectivePrice.toString()}
                                                    value={editPrices[country.iso2] ?? (explicitPrice || '')}
                                                    onChange={(e) => setEditPrices(prev => ({ ...prev, [country.iso2]: e.target.value }))}
                                                />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {isEdited && (
                                                    <Button size="sm" onClick={() => handleCountryPriceUpdate(country.iso2)} disabled={isSaving}>
                                                        <Save className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                {explicitPrice && !isEdited && (
                                                     <Badge variant="secondary">Overridden</Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
