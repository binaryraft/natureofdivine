'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Package, Truck, Calendar, MapPin, Hash, User } from 'lucide-react';
import { Order } from '@/lib/definitions';
import { cn } from '@/lib/utils';

interface OrderTicketProps {
  order: Order;
}

export function OrderTicket({ order }: OrderTicketProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      <Card id={`ticket-${order.id}`} className="relative overflow-hidden border-2 border-dashed border-primary/30 bg-card/50 backdrop-blur-sm print:shadow-none print:border-solid print:bg-white">
        {/* Ticket Header (Punch holes style) */}
        <div className="absolute top-1/2 -left-3 h-6 w-6 rounded-full bg-background border-r-2 border-primary/30 -translate-y-1/2 print:hidden" />
        <div className="absolute top-1/2 -right-3 h-6 w-6 rounded-full bg-background border-l-2 border-primary/30 -translate-y-1/2 print:hidden" />
        
        <div className="p-6 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-primary/10 pb-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-headline text-primary">Nature of the Divine</h2>
              <p className="text-xs tracking-widest uppercase text-muted-foreground">Official Shipment Ticket</p>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider mb-2">
                <Hash className="h-3 w-3" /> {order.id.substring(0, 12)}
              </div>
              <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/5 flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-primary/70" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-tighter text-muted-foreground">Recipient</p>
                  <p className="font-bold">{order.name}</p>
                  <p className="text-xs text-muted-foreground">{order.email}</p>
                  <p className="text-xs text-muted-foreground">{order.phone}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/5 flex items-center justify-center shrink-0">
                  <MapPin className="h-4 w-4 text-primary/70" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-tighter text-muted-foreground">Shipping Address</p>
                  <p className="text-sm leading-relaxed">
                    {order.address}<br />
                    {order.street && <>{order.street}<br /></>}
                    {order.city}, {order.state} {order.pinCode}<br />
                    {order.country}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/5 flex items-center justify-center shrink-0">
                  <Package className="h-4 w-4 text-primary/70" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] uppercase tracking-tighter text-muted-foreground mb-1">Purchased Items</p>
                  <div className="space-y-2">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start border-b border-dashed border-slate-100 pb-1 last:border-0">
                        <div>
                          <p className="font-bold text-xs leading-tight">{item.name}</p>
                          <p className="text-[9px] text-muted-foreground uppercase">{item.type} {item.variant ? `• ${item.variant}` : ''}</p>
                        </div>
                        <p className="text-xs font-bold">₹{item.price}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-2 border-t border-primary/20">
                    <p className="text-xs font-bold text-primary flex justify-between">
                      <span>Total Paid:</span>
                      <span>₹{order.price}</span>
                    </p>
                    <p className="text-[9px] text-muted-foreground uppercase mt-1">Method: {order.paymentMethod.toUpperCase()}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/5 flex items-center justify-center shrink-0">
                  <Truck className="h-4 w-4 text-primary/70" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-tighter text-muted-foreground">Logistics Status</p>
                  <p className="text-sm font-medium">{order.status === 'new' ? 'Awaiting Dispatch' : order.status.toUpperCase()}</p>
                  {order.shippingDetails?.trackingNumber && (
                    <p className="text-xs text-primary font-mono mt-1">Tracking: {order.shippingDetails.trackingNumber}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-primary/10 pt-6 flex flex-col items-center gap-4">
            <div className="text-center space-y-1">
              <p className="text-[10px] text-muted-foreground italic">Thank you for your resonance with the Divine Architecture.</p>
              <p className="text-[10px] font-bold text-primary/50 tracking-[0.3em] uppercase">Alfas B • Nature of the Divine</p>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute bottom-0 right-0 p-2 opacity-5">
           <Package className="h-24 w-24" />
        </div>
      </Card>

      <Button 
        variant="outline" 
        className="w-full gap-2 rounded-xl group border-primary/20 hover:border-primary hover:bg-primary/5 transition-all print:hidden"
        onClick={handlePrint}
      >
        <Download className="h-4 w-4 group-hover:translate-y-0.5 transition-transform" />
        Download Order Ticket
      </Button>
      <p className="text-[10px] text-center text-muted-foreground print:hidden">
        Keep this ticket as a record of your Order ID. You can use it to recover your order if you lose access to your account.
      </p>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #ticket-${order.id}, #ticket-${order.id} * {
            visibility: visible;
          }
          #ticket-${order.id} {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: 1px solid #000 !important;
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
}
