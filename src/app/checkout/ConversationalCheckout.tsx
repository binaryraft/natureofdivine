
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, Truck, CreditCard, AlertCircle } from 'lucide-react';
import { z } from 'zod';
import { calculateOrderTotalAction, placeOrder } from '@/lib/actions';
import { Stock } from '@/lib/definitions';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useLocation } from '@/hooks/useLocation';
import { countries as countryList } from '@/lib/countries';

type Step = 'name' | 'email' | 'phone' | 'country' | 'postal' | 'state' | 'city' | 'address' | 'landmark' | 'variant' | 'payment' | 'processing';

interface Message {
    id: string;
    role: 'bot' | 'user';
    content: React.ReactNode;
}

interface FormData {
    variant: 'paperback' | 'hardcover';
    name: string;
    email: string;
    phone: string;
    country: string;
    state: string;
    city: string;
    pinCode: string;
    address: string;
    street: string; // Used for landmark
    paymentMethod?: 'cod' | 'prepaid';
    totalPrice?: number;
}

export function ConversationalCheckout({ stock }: { stock: Stock }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const { priceData } = useLocation();
    const scrollRef = useRef<HTMLDivElement>(null);
    const messageIdCounter = useRef(0);

    const [messages, setMessages] = useState<Message[]>([]);
    const [currentStep, setCurrentStep] = useState<Step>('variant');

    // Load from localStorage or use defaults
    const [formData, setFormData] = useState<FormData>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('checkout_form_data');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    return {
                        variant: 'paperback',
                        name: '',
                        email: '',
                        phone: '',
                        country: 'IN',
                        state: '',
                        city: '',
                        pinCode: '',
                        address: '',
                        street: '',
                        ...parsed
                    };
                } catch (e) { }
            }
        }
        return {
            variant: 'paperback',
            name: '',
            email: '',
            phone: '',
            country: 'IN',
            state: '',
            city: '',
            pinCode: '',
            address: '',
            street: '',
        };
    });

    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Save to localStorage whenever formData changes
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('checkout_form_data', JSON.stringify(formData));
        }
    }, [formData]);

    const addBotMessage = (content: React.ReactNode) => {
        messageIdCounter.current += 1;
        setMessages(prev => [...prev, { id: `bot-${messageIdCounter.current}`, role: 'bot', content }]);
    };

    const addUserMessage = (content: string) => {
        messageIdCounter.current += 1;
        setMessages(prev => [...prev, { id: `user-${messageIdCounter.current}`, role: 'user', content }]);
    };

    const scrollToBottom = () => {
        setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 100);
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        addBotMessage(
            <div className="space-y-2">
                <p className="text-lg font-medium">Welcome to Nature of the Divine.</p>
                <p>I'm here to help you order your copy. Which edition would you like?</p>
                <div className="flex gap-2 mt-2 flex-wrap">
                    <Button variant="outline" onClick={() => handleVariantSelect('paperback')} disabled={stock.paperback <= 0}>
                        Paperback {stock.paperback <= 0 && '(Out of Stock)'}
                    </Button>
                    <Button variant="outline" onClick={() => handleVariantSelect('hardcover')} disabled={stock.hardcover <= 0}>
                        Hardcover {stock.hardcover <= 0 && '(Out of Stock)'}
                    </Button>
                </div>
            </div>
        );
    }, []);

    const handleVariantSelect = (variant: 'paperback' | 'hardcover') => {
        const variantStock = variant === 'paperback' ? stock.paperback : stock.hardcover;

        if (variantStock <= 0) {
            addUserMessage(`I'd like the ${variant} edition.`);
            const alt = variant === 'paperback' ? 'hardcover' : 'paperback';
            const altStock = alt === 'paperback' ? stock.paperback : stock.hardcover;

            if (altStock > 0) {
                addBotMessage(
                    <div className="space-y-3">
                        <p>Sorry, {variant} is out of stock. We have {alt} available. Would you like that?</p>
                        <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleVariantSelect(alt)}>Yes, {alt}</Button>
                            <Button size="sm" variant="outline" onClick={() => addBotMessage("I understand. Check back later!")}>No thanks</Button>
                        </div>
                    </div>
                );
            } else {
                addBotMessage("Both editions are out of stock. Please check back later.");
            }
            return;
        }

        setFormData(prev => ({ ...prev, variant }));
        addUserMessage(`I'd like the ${variant} edition.`);

        const savedName = formData.name || user?.displayName;
        const savedEmail = formData.email || user?.email;
        const savedPhone = formData.phone || user?.phoneNumber;

        if (savedName || savedEmail || savedPhone) {
            const savedDetails = [];
            if (savedName) savedDetails.push(`Name: ${savedName}`);
            if (savedEmail) savedDetails.push(`Email: ${savedEmail}`);
            if (savedPhone) savedDetails.push(`Phone: ${savedPhone}`);

            addBotMessage(
                <div className="space-y-3">
                    <p>I found your saved details:</p>
                    <div className="bg-muted/50 p-3 rounded-lg text-sm space-y-1">
                        {savedDetails.map((detail, idx) => <p key={idx}>• {detail}</p>)}
                    </div>
                    <p>Would you like to use these?</p>
                    <div className="flex gap-2">
                        <Button size="sm" onClick={() => {
                            addUserMessage("Yes, use saved details");
                            if (savedName) setFormData(prev => ({ ...prev, name: savedName }));
                            if (savedEmail) setFormData(prev => ({ ...prev, email: savedEmail }));
                            if (savedPhone) setFormData(prev => ({ ...prev, phone: savedPhone }));
                            checkSavedAddress();
                        }}>
                            Yes, use these
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => {
                            addUserMessage("No, I'll enter new details");
                            setCurrentStep('name');
                            addBotMessage("No problem! What is your full name?");
                        }}>
                            No, change details
                        </Button>
                    </div>
                </div>
            );
        } else {
            setCurrentStep('name');
            addBotMessage("Great choice! What is your full name?");
        }
    };

    const checkSavedAddress = () => {
        if (formData.country && formData.state && formData.city && formData.pinCode && formData.address) {
            addBotMessage(
                <div className="space-y-3">
                    <p>I found a saved address:</p>
                    <div className="bg-muted/50 p-3 rounded-lg text-sm space-y-1">
                        <p>{formData.address}</p>
                        <p>{formData.city}, {formData.state} - {formData.pinCode}</p>
                        <p>{formData.country}</p>
                    </div>
                    <p>Ship to this address?</p>
                    <div className="flex gap-2">
                        <Button size="sm" onClick={() => {
                            addUserMessage("Yes, ship here");
                            calculateTotal();
                        }}>
                            Yes
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => {
                            addUserMessage("No, change address");
                            setFormData(prev => ({ ...prev, country: '', state: '', city: '', pinCode: '', address: '', street: '' }));
                            askCountry();
                        }}>
                            No, change
                        </Button>
                    </div>
                </div>
            );
        } else {
            askCountry();
        }
    };

    const askCountry = () => {
        setCurrentStep('country');
        addBotMessage("Got it. Which country should I ship your book to?");
    };

    const askPostalCode = () => {
        setCurrentStep('postal');
        addBotMessage("And what's the Postal or ZIP Code for that location?");
    };

    const askState = () => {
        setCurrentStep('state');
        addBotMessage("Which State or Province is that in?");
    };

    const askCity = () => {
        setCurrentStep('city');
        addBotMessage("In which City or District?");
    };

    const askAddress = () => {
        setCurrentStep('address');
        addBotMessage("Please provide your street address (House No, Building, Street).");
    };

    const askLandmark = () => {
        setCurrentStep('landmark');
        addBotMessage("Any nearby landmark to help the delivery partner find you?");
    };

    const handleSubmit = async () => {
        if (currentStep === 'name') {
            if (inputValue.length < 2) return toast({ title: "Name too short" });
            setFormData(prev => ({ ...prev, name: inputValue }));
            addUserMessage(inputValue);
            setInputValue('');
            setCurrentStep('email');
            addBotMessage(`Nice to meet you, ${inputValue}. What's your email?`);
        } else if (currentStep === 'email') {
            if (!z.string().email().safeParse(inputValue).success) return toast({ title: "Invalid email" });
            setFormData(prev => ({ ...prev, email: inputValue }));
            addUserMessage(inputValue);
            setInputValue('');
            setCurrentStep('phone');
            addBotMessage("Great. Could you share your phone number for delivery updates?");
        } else if (currentStep === 'phone') {
            if (inputValue.length < 10) return toast({ title: "Phone too short" });
            setFormData(prev => ({ ...prev, phone: inputValue }));
            addUserMessage(inputValue);
            setInputValue('');
            checkSavedAddress();
        } else if (currentStep === 'country') {
            const normalizedInput = inputValue.trim().toLowerCase();
            
            // 1. Try exact match on name or code
            let match = countryList.find(c => 
                c.name.toLowerCase() === normalizedInput || 
                c.iso2.toLowerCase() === normalizedInput
            );

            // 2. If no exact match, try "starts with"
            if (!match) {
                match = countryList.find(c => c.name.toLowerCase().startsWith(normalizedInput));
            }

            // 3. Fallback to "includes" but only if not too ambiguous
            if (!match) {
                match = countryList.find(c => c.name.toLowerCase().includes(normalizedInput));
            }

            if (!match) return toast({ title: "Country not found", description: "Try typing the full name, like 'India' or 'United Arab Emirates'." });

            setFormData(prev => ({ ...prev, country: match.iso2 }));
            addUserMessage(match.name);
            setInputValue('');
            askPostalCode();
        } else if (currentStep === 'postal') {
            if (inputValue.length < 3) return toast({ title: "Invalid code" });
            setFormData(prev => ({ ...prev, pinCode: inputValue }));
            addUserMessage(inputValue);

            const pin = inputValue;
            setInputValue('');

            if (formData.country === 'IN' && pin.length === 6) {
                setLoading(true);
                try {
                    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
                    const data = await res.json();
                    if (data[0].Status === 'Success') {
                        const po = data[0].PostOffice[0];
                        setFormData(prev => ({ ...prev, city: po.District, state: po.State }));
                        addBotMessage(`I've automatically found ${po.District}, ${po.State}.`);
                        askAddress();
                        setLoading(false);
                        return;
                    }
                } catch (e) { }
                setLoading(false);
            }
            askState();
        } else if (currentStep === 'state') {
            if (inputValue.length < 2) return toast({ title: "Please enter a valid state" });
            setFormData(prev => ({ ...prev, state: inputValue }));
            addUserMessage(inputValue);
            setInputValue('');
            askCity();
        } else if (currentStep === 'city') {
            if (inputValue.length < 2) return toast({ title: "Please enter a valid city" });
            setFormData(prev => ({ ...prev, city: inputValue }));
            addUserMessage(inputValue);
            setInputValue('');
            askAddress();
        } else if (currentStep === 'address') {
            if (inputValue.length < 5) return toast({ title: "Address seems too short" });
            setFormData(prev => ({ ...prev, address: inputValue }));
            addUserMessage(inputValue);
            setInputValue('');
            askLandmark();
        } else if (currentStep === 'landmark') {
            const landmark = inputValue.trim();
            setFormData(prev => ({ ...prev, street: landmark }));
            addUserMessage(landmark || "None");
            setInputValue('');
            
            // Use local variables to avoid stale state in calculateTotal
            await calculateTotal(formData.country, formData.variant);
        }
    };

    const calculateTotal = async (countryCode: string, variant: string) => {
        addBotMessage(<div className="flex gap-2"><Loader2 className="animate-spin h-4 w-4" /><span>Just a moment, calculating your total...</span></div>);

        const result = await calculateOrderTotalAction(countryCode, variant);

        if (result.success) {
            const formattedTotal = new Intl.NumberFormat('en-IN', { style: 'currency', currency: result.currency }).format(result.totalPrice || 0);
            setFormData(prev => ({ ...prev, totalPrice: result.totalPrice }));
            
            addBotMessage(
                <div className="space-y-3">
                    <p className="text-lg font-medium">Order Summary</p>
                    <div className="bg-muted/50 p-3 rounded-lg text-sm space-y-2">
                        <div className="flex justify-between">
                            <span>{variant.charAt(0).toUpperCase() + variant.slice(1)} Edition:</span>
                            <span>{formattedTotal}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                            <span>Shipping:</span>
                            <span>Included</span>
                        </div>
                        <div className="flex justify-between font-bold border-t pt-2 mt-2 text-base">
                            <span>Total Amount:</span>
                            <span>{formattedTotal}</span>
                        </div>
                    </div>
                </div>
            );
            askPayment();
        } else {
            addBotMessage(
                <div className="space-y-3">
                    <div className="text-destructive flex gap-2">
                        <AlertCircle className="h-4 w-4" />
                        <span>{result.message || "I'm having trouble calculating the price right now."}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Could you try again in a minute?
                    </p>
                </div>
            );
        }
    };

    const askPayment = () => {
        setCurrentStep('payment');
        addBotMessage(
            <div className="space-y-3">
                <p>How would you like to complete the payment?</p>
                <div className="grid gap-2">
                    <Button variant="outline" className="justify-start h-auto py-4" onClick={() => handlePaymentSelect('prepaid')}>
                        <CreditCard className="mr-3 h-5 w-5 text-primary" />
                        <div className="text-left"><p className="font-semibold">Pay Online</p><p className="text-xs text-muted-foreground">UPI, Cards, Net Banking</p></div>
                    </Button>
                    <Button variant="outline" className="justify-start h-auto py-4" onClick={() => handlePaymentSelect('cod')}>
                        <Truck className="mr-3 h-5 w-5 text-primary" />
                        <div className="text-left"><p className="font-semibold">Cash on Delivery</p><p className="text-xs text-muted-foreground">Pay when your book arrives</p></div>
                    </Button>
                </div>
            </div>
        );
    };

    const handlePaymentSelect = async (method: 'cod' | 'prepaid') => {
        setFormData(prev => ({ ...prev, paymentMethod: method }));
        addUserMessage(method === 'cod' ? 'Cash on Delivery' : 'Pay Online');

        setCurrentStep('processing');
        addBotMessage(<div className="flex gap-2"><Loader2 className="animate-spin h-4 w-4" /><span>Processing your order...</span></div>);

        if (!user) {
            toast({ title: "Please login to complete order" });
            return;
        }

        try {
            const result = await placeOrder({
                ...formData,
                userId: user.uid,
                paymentMethod: method,
                shippingMethod: { carrier: 'Standard', service: 'Standard', rate: 0 }
            });

            if (result.success) {
                if (result.paymentData?.redirectUrl) {
                    window.location.href = result.paymentData.redirectUrl;
                } else {
                    router.push(`/orders?success=true&orderId=${result.orderId}`);
                }
            } else {
                addBotMessage(`Oops! ${result.message}`);
            }
        } catch (e: any) {
            addBotMessage(`I encountered an error: ${e.message}`);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto h-[600px] flex flex-col bg-card rounded-xl shadow-sm border overflow-hidden">
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth">
                {messages.map((msg) => (
                    <div key={msg.id} className={cn("flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300", msg.role === 'user' ? "justify-end" : "justify-start")}>
                        <div className={cn("max-w-[85%] rounded-2xl px-4 py-3 text-sm md:text-base", msg.role === 'user' ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted text-foreground rounded-bl-none shadow-sm")}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-muted rounded-2xl rounded-bl-none px-4 py-3">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 border-t bg-background">
                {['name', 'email', 'phone', 'country', 'postal', 'state', 'city', 'address', 'landmark'].includes(currentStep) && (
                    <div className="flex gap-2">
                        <Input
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                            placeholder={
                                currentStep === 'name' ? "Enter your name..." :
                                    currentStep === 'email' ? "Enter your email..." :
                                        currentStep === 'phone' ? "Enter your phone number..." :
                                            currentStep === 'country' ? "Which country?" :
                                                currentStep === 'postal' ? "PIN/ZIP Code" :
                                                    currentStep === 'state' ? "State/Province" :
                                                        currentStep === 'city' ? "City/District" :
                                                            currentStep === 'address' ? "Street Address..." :
                                                                "Landmark (optional)..."
                            }
                            className="flex-1"
                            autoFocus
                        />
                        <Button onClick={handleSubmit}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
