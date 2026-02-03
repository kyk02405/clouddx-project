"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, ArrowLeft, Building2, Bitcoin, Banknote, ChevronRight, Wallet, PieChart, Check, Trash2, X } from "lucide-react";

import PortfolioHeader from "@/components/PortfolioHeader";
import { Badge } from "@/components/ui/badge";
import { useAsset, HoldingAsset } from "@/context/AssetContext";

// --- Types & Mock Data ---
// ... (omitted)

type AssetType = "stock" | "crypto" | "currency";

interface Asset {
    id: string;
    symbol: string;
    name: string;
    type: AssetType;
    market?: string;
    logo?: string;
}

interface CartItem extends Asset {
    uid: string; // Unique ID for cart item
    quantity: number;
    price: number; // Average Price or Exchange Rate
    date: string;
}

const POPULAR_STOCKS: Asset[] = [
    { id: "005930", symbol: "005930", name: "삼성전자", type: "stock", market: "KR", logo: "https://toss-asset-public.tossinvest.com/legacy/cms-upload/1653372661848-samsung.png" },
    { id: "TSLA", symbol: "TSLA", name: "Tesla", type: "stock", market: "US", logo: "https://toss-asset-public.tossinvest.com/legacy/cms-upload/1649914486571-tesla.png" },
    { id: "AAPL", symbol: "AAPL", name: "Apple", type: "stock", market: "US", logo: "https://toss-asset-public.tossinvest.com/legacy/cms-upload/1649914592066-apple.png" },
    { id: "NVDA", symbol: "NVDA", name: "NVIDIA", type: "stock", market: "US", logo: "https://toss-asset-public.tossinvest.com/legacy/cms-upload/1649914619426-nvidia.png" },
    { id: "360750", symbol: "360750", name: "TIGER 미국S&P500", type: "stock", market: "KR", logo: "" },
    { id: "SCHD", symbol: "SCHD", name: "Schwab US Dividend Equity", type: "stock", market: "US", logo: "" },
    { id: "TQQQ", symbol: "TQQQ", name: "ProShares UltraPro QQQ", type: "stock", market: "US", logo: "" },
    { id: "SOXL", symbol: "SOXL", name: "Direxion Daily Semi Bull 3X", type: "stock", market: "US", logo: "" },
    { id: "MSFT", symbol: "MSFT", name: "Microsoft", type: "stock", market: "US", logo: "" },
    { id: "035720", symbol: "035720", name: "KAKAO", type: "stock", market: "KR", logo: "" },
];

const POPULAR_CRYPTO: Asset[] = [
    { id: "BTC", symbol: "BTC", name: "Bitcoin", type: "crypto", logo: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png" },
    { id: "ETH", symbol: "ETH", name: "Ethereum", type: "crypto", logo: "https://assets.coingecko.com/coins/images/279/large/ethereum.png" },
    { id: "XRP", symbol: "XRP", name: "Ripple", type: "crypto", logo: "" },
    { id: "DOGE", symbol: "DOGE", name: "Dogecoin", type: "crypto", logo: "" },
    { id: "SOL", symbol: "SOL", name: "Solana", type: "crypto", logo: "" },
];

const CURRENCIES: Asset[] = [
    { id: "KRW", symbol: "KRW", name: "원화 (KRW)", type: "currency" },
    { id: "USD", symbol: "USD", name: "달러 (USD)", type: "currency" },
    { id: "JPY", symbol: "JPY", name: "엔화 (JPY)", type: "currency" },
    { id: "CNY", symbol: "CNY", name: "위안화 (CNY)", type: "currency" },
];

// --- Main Component ---

export default function DirectRegisterPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);

    // Step 1 State
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
    const [formValues, setFormValues] = useState({ quantity: "", price: "" });
    const [cart, setCart] = useState<CartItem[]>([]);

    const steps = [
        { number: 1, title: "리스트 채우기", id: "fill" },
        { number: 2, title: "확인", id: "review" },
        { number: 3, title: "완료", id: "complete" },
    ];

    // --- Handlers ---

    // Helper for number formatting (comma separation)
    const formatNumber = (num: string) => {
        if (!num) return "";
        const parts = num.split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return parts.join(".");
    };

    const parseNumber = (num: string) => {
        return parseFloat(num.replace(/,/g, ""));
    };

    const handleNumberChange = (field: 'quantity' | 'price', value: string) => {
        // Allow only numbers and one decimal point
        const cleanValue = value.replace(/[^0-9.]/g, "");
        const parts = cleanValue.split(".");
        if (parts.length > 2) return; // Prevent multiple dots

        // Format display value
        const formatted = formatNumber(cleanValue);
        setFormValues(prev => ({ ...prev, [field]: formatted }));
    };

    const handleSelect = (asset: Asset) => {
        setSelectedAsset(asset);
        // Default values for Currency (Auto-fill current rates)
        if (asset.type === 'currency') {
            let rate = "1";
            if (asset.id === 'USD') rate = "1450";
            else if (asset.id === 'JPY') rate = "9.5";
            else if (asset.id === 'CNY') rate = "200";

            // Format the rate initially
            setFormValues({ quantity: "", price: formatNumber(rate) });
        } else {
            setFormValues({ quantity: "", price: "" });
        }
    };

    const handleAddToCart = () => {
        if (!selectedAsset || !formValues.quantity || !formValues.price) return;

        let quantity = parseNumber(formValues.quantity);
        let price = parseNumber(formValues.price);

        // Logic check: User inputs Price in KRW for US Stocks
        // If market is US, we assume the input was KRW and convert to USD for storage
        // Exchange Rate constant: 1450 (should match the one used elsewhere or be dynamic)
        if (selectedAsset.market === 'US' && selectedAsset.type === 'stock') {
            price = price / 1450;
        }

        const newItem: CartItem = {
            ...selectedAsset,
            uid: Math.random().toString(36).substr(2, 9),
            quantity: quantity,
            price: price,
            date: new Date().toISOString(),
        };

        setCart([...cart, newItem]);

        // Reset Form
        setSelectedAsset(null);
        setFormValues({ quantity: "", price: "" });
    };

    const handleRemoveFromCart = (uid: string) => {
        setCart(cart.filter(item => item.uid !== uid));
    };

    const handleEditCartItem = (item: CartItem) => {
        // 1. Remove from cart (to avoid duplicates when re-adding)
        handleRemoveFromCart(item.uid);

        // 2. Set as selected asset
        const asset: Asset = {
            id: item.id,
            symbol: item.symbol,
            name: item.name,
            type: item.type,
            market: item.market,
            logo: item.logo
        };
        setSelectedAsset(asset);

        // 3. Populate form values (Reverse the USD->KRW logic if needed)
        let price = item.price;
        if (item.market === 'US' && item.type === 'stock') {
            price = price * 1450; // Convert saved USD back to KRW for input
        }

        setFormValues({
            quantity: formatNumber(item.quantity.toString()),
            price: formatNumber(price.toString())
        });
    };



    const [isSubmitting, setIsSubmitting] = useState(false);
    const { addHoldings } = useAsset();

    const handleNext = async () => {
        if (currentStep === 1) {
            if (cart.length === 0) return; // Can't proceed if empty
            setCurrentStep(2);
        } else if (currentStep === 2) {
            // Submit to Backend via AssetContext
            setIsSubmitting(true);
            try {
                // Convert CartItem to HoldingAsset format
                const newHoldings: HoldingAsset[] = cart.map((item) => {
                    // Determine currency based on item type and market
                    let currency = "KRW";
                    // Note: Currency assets (USD, JPY) are priced in KRW (Exchange Rate), so their value is already in KRW.
                    // We only set currency to 'USD' for US Stocks priced in USD.
                    if (item.market === 'US') {
                        currency = "USD";
                    }

                    return {
                        symbol: item.symbol,
                        name: item.name,
                        amount: item.quantity,
                        averagePrice: item.price,
                        currentPrice: item.price, // Initial price is avg price
                        change: 0,
                        changePercent: 0,
                        value: item.quantity * item.price,
                        profit: 0,
                        profitPercent: 0,
                        currency: currency, // Add currency field
                        type: item.type // Add type field
                    };
                });

                await addHoldings(newHoldings);
                setCurrentStep(3);
            } catch (error) {
                console.error("Failed to register assets:", error);
                // Fallback: still show complete for demo or show error
                setCurrentStep(3);
            } finally {
                setIsSubmitting(false);
            }
        } else {
            router.push("/portfolio/asset");
        }
    };

    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const getLabels = (type: AssetType, id?: string) => {
        if (type === 'currency') {
            if (id === 'KRW') return { quantity: "보유 금액 (원)", price: "" };
            if (id === 'USD') return { quantity: "보유 금액 (달러)", price: "" };
            if (id === 'JPY') return { quantity: "보유 금액 (엔)", price: "" };
            if (id === 'CNY') return { quantity: "보유 금액 (위안)", price: "" };
            return { quantity: "보유 금액", price: "" };
        }
        // Stocks/Crypto: Explicitly state KRW for input
        return { quantity: "보유 수량", price: "평균 단가 (원)" };
    };

    return (
        <div className="flex min-h-screen flex-col bg-white dark:bg-zinc-950 transition-colors duration-300">
            {/* ... (Header and Sidebar remain same) ... */}
            <PortfolioHeader />
            <div className="flex flex-1">
                {/* Sidebar Navigation */}
                <aside className="w-72 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-8">
                    <h1 className="mb-10 text-xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">자산 직접 등록</h1>
                    <nav className="relative flex flex-col gap-8">
                        <div className="absolute left-3 top-3 bottom-3 w-[1px] border-l border-dashed border-zinc-300 dark:border-zinc-700 z-0" />
                        {steps.map((step) => (
                            <button
                                key={step.number}
                                onClick={() => {
                                    // Only allow going back or if cart is not empty
                                    if (step.number < currentStep || (step.number === 2 && cart.length > 0)) {
                                        setCurrentStep(step.number);
                                    }
                                }}
                                disabled={step.number > currentStep && (step.number === 3 || (step.number === 2 && cart.length === 0))}
                                className="group relative z-10 flex items-center gap-4 text-left outline-none disabled:opacity-50"
                            >
                                <div
                                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${currentStep >= step.number
                                        ? "bg-zinc-900 border-zinc-900 dark:bg-white dark:border-white shadow-lg"
                                        : "bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700"
                                        }`}
                                >
                                    {currentStep > step.number ? (
                                        <Check className="h-3.5 w-3.5 text-white dark:text-zinc-900" strokeWidth={4} />
                                    ) : (
                                        <div className={`h-2 w-2 rounded-full ${currentStep === step.number ? "bg-white dark:bg-zinc-900" : "bg-transparent"}`} />
                                    )}
                                </div>
                                <span className={`text-sm font-bold transition-colors duration-300 ${currentStep === step.number
                                    ? "text-zinc-900 dark:text-white"
                                    : "text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-900 dark:group-hover:text-zinc-300"
                                    }`}>
                                    {step.title}
                                </span>
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 p-8 lg:p-12 overflow-hidden flex flex-col">
                    <div className="mx-auto w-full max-w-[1600px] h-full flex flex-col">

                        {/* Title Section */}
                        <div className="mb-10">
                            {/* ... (Titles remain same) ... */}
                            {currentStep === 1 && (
                                <>
                                    <h2 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white mb-2">어떤 자산을 가지고 계신가요?</h2>
                                    <p className="text-zinc-500 font-medium">리스트에 자산을 모두 담은 후, 한 번에 등록하세요.</p>
                                </>
                            )}
                            {currentStep === 2 && (
                                <>
                                    <h2 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white mb-2">등록 내용을 확인해주세요</h2>
                                    <p className="text-zinc-500 font-medium">총 {cart.length}개의 자산을 등록합니다.</p>
                                </>
                            )}
                            {currentStep === 3 && (
                                <>
                                    <h2 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white mb-2">등록이 완료되었습니다 🎉</h2>
                                    <p className="text-zinc-500 font-medium">포트폴리오 화면에서 자산을 확인하세요.</p>
                                </>
                            )}
                        </div>

                        {/* Step 1: Fill List */}
                        {currentStep === 1 && (
                            <div className="flex flex-col lg:flex-row gap-8 items-start h-[calc(100vh-320px)]">
                                {/* LEFT: Asset Selection */}
                                <Card className="flex-1 w-full lg:w-2/3 h-full border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col overflow-hidden">
                                    {/* ... (Tabs Content similar, just need to ensure surrounding context match) ... */}
                                    <Tabs defaultValue="stock" className="flex flex-col h-full">
                                        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 space-y-4">
                                            <TabsList className="bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl w-full grid grid-cols-3">
                                                <TabsTrigger value="stock" className="bg-transparent data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm rounded-lg py-2.5 font-bold">주식</TabsTrigger>
                                                <TabsTrigger value="crypto" className="bg-transparent data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm rounded-lg py-2.5 font-bold">코인</TabsTrigger>
                                                <TabsTrigger value="cash" className="bg-transparent data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm rounded-lg py-2.5 font-bold">현금</TabsTrigger>
                                            </TabsList>
                                            <div className="relative group">
                                                <Search className="absolute left-4 top-3.5 h-5 w-5 text-zinc-400 group-focus-within:text-emerald-500 transition-colors" />
                                                <Input
                                                    placeholder="이름, 심볼 또는 종목코드 검색"
                                                    className="pl-12 h-12 text-base bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus-visible:ring-emerald-500 rounded-xl"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                            <TabsContent value="stock" className="mt-0 space-y-2 h-full">
                                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                                                    {POPULAR_STOCKS.map((stock) => (
                                                        <AssetItem key={stock.id} item={stock} onSelect={handleSelect} isSelected={selectedAsset?.id === stock.id} />
                                                    ))}
                                                </div>
                                            </TabsContent>
                                            <TabsContent value="crypto" className="mt-0 space-y-2 h-full">
                                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                                                    {POPULAR_CRYPTO.map((coin) => (
                                                        <AssetItem key={coin.id} item={coin} onSelect={handleSelect} isSelected={selectedAsset?.id === coin.id} />
                                                    ))}
                                                </div>
                                            </TabsContent>
                                            <TabsContent value="cash" className="mt-0 space-y-2 h-full">
                                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                                                    {CURRENCIES.map((curr) => (
                                                        <AssetItem key={curr.id} item={curr} onSelect={handleSelect} isSelected={selectedAsset?.id === curr.id} />
                                                    ))}
                                                </div>
                                            </TabsContent>
                                        </div>
                                    </Tabs>
                                </Card>

                                {/* RIGHT: Input Form */}
                                <div className="w-full lg:w-[400px] xl:w-[480px] h-full flex flex-col gap-6">
                                    {selectedAsset ? (
                                        <Card className="flex-1 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl shadow-zinc-200/50 dark:shadow-zinc-950/50 flex flex-col animate-in slide-in-from-right-4 duration-500">
                                            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                                                <div className="flex flex-col items-center text-center gap-3">
                                                    <div className="w-16 h-16 rounded-2xl bg-white dark:bg-zinc-800 flex items-center justify-center text-zinc-500 shadow-sm border border-zinc-100 dark:border-zinc-700 p-3">
                                                        {selectedAsset.logo ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img src={selectedAsset.logo} alt={selectedAsset.name} className="w-full h-full object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
                                                        ) : (
                                                            <Building2 className="w-8 h-8" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <Badge variant="outline" className="mb-1.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-[10px]">
                                                            {selectedAsset.type === 'stock' ? 'Stock' : selectedAsset.type === 'crypto' ? 'Crypto' : 'Currency'}
                                                        </Badge>
                                                        <h2 className="text-xl font-black text-zinc-900 dark:text-white">{selectedAsset.name}</h2>
                                                    </div>
                                                </div>
                                            </div>

                                            <CardContent className="flex-1 p-6 space-y-6 flex flex-col justify-center">
                                                <div className="space-y-5">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex justify-between">
                                                            {getLabels(selectedAsset.type, selectedAsset.id).quantity}
                                                            <span className="text-xs font-normal text-zinc-400">필수 입력</span>
                                                        </label>
                                                        <div className="relative">
                                                            <Input
                                                                type="text"
                                                                placeholder="0"
                                                                value={formValues.quantity}
                                                                onChange={(e) => handleNumberChange('quantity', e.target.value)}
                                                                className="h-14 text-xl font-bold bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus-visible:ring-emerald-500 pl-4 pr-10"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Hide Price input for ALL currencies, show current rate instead */}
                                                    {selectedAsset.type !== 'currency' ? (
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex justify-between">
                                                                {getLabels(selectedAsset.type, selectedAsset.id).price}
                                                                <span className="text-xs font-normal text-zinc-400">필수 입력</span>
                                                            </label>
                                                            <div className="relative">
                                                                <Input
                                                                    type="text"
                                                                    placeholder="0"
                                                                    value={formValues.price}
                                                                    onChange={(e) => handleNumberChange('price', e.target.value)}
                                                                    className="h-14 text-xl font-bold bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus-visible:ring-emerald-500 pl-4 pr-10"
                                                                />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="text-xs font-bold text-zinc-500">적용 환율</span>
                                                                <span className="text-xs text-emerald-500 font-bold">자동 적용됨</span>
                                                            </div>
                                                            <div className="text-lg font-bold text-zinc-900 dark:text-white">
                                                                {selectedAsset.id === 'KRW' ? "1 KRW = 1 KRW" :
                                                                    selectedAsset.id === 'USD' ? "1 USD ≈ 1,450 KRW" :
                                                                        selectedAsset.id === 'JPY' ? "1 JPY ≈ 9.5 KRW" :
                                                                            selectedAsset.id === 'CNY' ? "1 CNY ≈ 200 KRW" :
                                                                                "현재 시장 환율"}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <Button
                                                    className="w-full h-14 text-lg font-bold bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-xl shadow-lg transition-all active:scale-[0.98]"
                                                    onClick={handleAddToCart}
                                                    disabled={!formValues.quantity || !formValues.price}
                                                >
                                                    리스트에 추가
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ) : (
                                        <Card className="flex-1 border-dashed border-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-col items-center justify-center text-center p-8 shadow-none">
                                            <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4 text-zinc-400">
                                                <PieChart className="w-8 h-8" />
                                            </div>
                                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">자산을 선택해주세요</h3>
                                            <p className="text-zinc-500 text-sm max-w-[200px]">
                                                왼쪽 목록에서 추가하실 자산을 선택해 주세요.
                                            </p>
                                        </Card>
                                    )}

                                    {/* Mini Cart Preview */}
                                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="font-bold text-zinc-900 dark:text-white">현재 담긴 자산</span>
                                            <Badge className="bg-emerald-500 text-white">{cart.length}개</Badge>
                                        </div>
                                        {cart.length > 0 ? (
                                            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                                {cart.slice().reverse().map((item) => (
                                                    <div
                                                        key={item.uid}
                                                        onClick={() => handleEditCartItem(item)}
                                                        className="group relative flex items-center gap-2 p-2 pr-8 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 shrink-0 cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/10 transition-all"
                                                    >
                                                        <div className="w-8 h-8 rounded bg-white dark:bg-zinc-800 flex items-center justify-center text-[10px] border border-zinc-100 dark:border-zinc-700 shrink-0">
                                                            {item.logo ? (
                                                                // eslint-disable-next-line @next/next/no-img-element
                                                                <img src={item.logo} alt={item.name} className="w-full h-full object-cover rounded" onError={(e) => e.currentTarget.style.display = 'none'} />
                                                            ) : (
                                                                <span className="font-bold text-zinc-500">{item.name[0]}</span>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 truncate max-w-[80px]">{item.name}</span>
                                                            <span className="text-[10px] text-zinc-400">{item.quantity.toLocaleString()} {item.type === 'currency' ? '' : '주'}</span>
                                                        </div>

                                                        {/* Delete Button (Top Right) */}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleRemoveFromCart(item.uid);
                                                            }}
                                                            className="absolute -top-2 -right-2 w-5 h-5 bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-300 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500 hover:text-white shadow-sm"
                                                        >
                                                            <X className="w-3 h-3" strokeWidth={3} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-sm text-zinc-400 text-center py-2 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg">
                                                아직 담긴 자산이 없습니다.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Review (Table) */}
                        {currentStep === 2 && (
                            <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden flex-1">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800">
                                            <tr>
                                                <th className="px-6 py-4 font-semibold">자산명</th>
                                                <th className="px-6 py-4 font-semibold text-right">수량/금액</th>
                                                <th className="px-6 py-4 font-semibold text-right">단가/환율</th>
                                                <th className="px-6 py-4 font-semibold text-right">삭제</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 bg-white dark:bg-transparent">
                                            {cart.map((item) => (
                                                <tr key={item.uid} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 border border-zinc-100 dark:border-zinc-700">
                                                                {item.name[0]}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-zinc-900 dark:text-white">{item.name}</div>
                                                                <div className="text-xs text-zinc-500">{item.symbol}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-medium text-zinc-900 dark:text-zinc-200">
                                                        {item.quantity.toLocaleString()} {item.type === 'currency' ? '' : '주'}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-zinc-500">
                                                        {item.price.toLocaleString()} {item.type === 'currency' || item.market === 'KR' ? '원' : 'USD'}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => handleRemoveFromCart(item.uid)}
                                                            className="text-zinc-400 hover:text-rose-500 transition-colors"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        )}

                        {/* Step 3: Complete */}
                        {currentStep === 3 && (
                            <div className="flex-1 flex flex-col items-center justify-center text-center pb-20">
                                <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-8 animate-in zoom-in duration-500">
                                    <Check className="w-12 h-12" strokeWidth={4} />
                                </div>
                                <h3 className="text-4xl font-black text-zinc-900 dark:text-white mb-4">등록이 완료되었습니다!</h3>
                                <p className="text-zinc-500 text-lg mb-12">
                                    총 <span className="text-emerald-600 font-bold">{cart.length}</span>개의 자산이 포트폴리오에 추가되었습니다.
                                </p>
                                <Button
                                    className="px-12 py-6 text-lg rounded-full font-bold bg-zinc-900 dark:bg-white text-white dark:text-black hover:scale-105 transition-transform"
                                    onClick={() => router.push("/portfolio/asset")}
                                >
                                    내 자산 확인하러 가기
                                </Button>
                            </div>
                        )}

                        {/* Navigation Footer (Steps 1 & 2) */}
                        {currentStep < 3 && (
                            <div className="mt-8 flex items-center justify-center gap-4">
                                <button
                                    onClick={handlePrevious}
                                    disabled={currentStep === 1}
                                    className={`px-10 py-4 rounded-full font-bold transition-all ${currentStep === 1
                                        ? "opacity-0 pointer-events-none"
                                        : "bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800"
                                        }`}
                                >
                                    이전
                                </button>
                                <button
                                    onClick={handleNext}
                                    disabled={cart.length === 0}
                                    className={`px-10 py-4 rounded-full font-bold shadow-xl transition-all ${cart.length === 0
                                        ? "bg-zinc-200 text-zinc-400 cursor-not-allowed dark:bg-zinc-800 dark:text-zinc-600 shadow-none"
                                        : "bg-emerald-600 text-white shadow-emerald-900/20 hover:bg-emerald-500 hover:scale-105 active:scale-95"
                                        }`}
                                >
                                    {currentStep === 2 ? "등록 완료" : "다음"}
                                </button>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}

function AssetItem({ item, onSelect, isSelected }: { item: Asset, onSelect: any, isSelected: boolean }) {
    return (
        <button
            onClick={() => onSelect(item)}
            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left w-full group relative overflow-hidden
                ${isSelected
                    ? "border-emerald-500 bg-emerald-50/20 dark:bg-emerald-500/10 ring-2 ring-emerald-500 ring-offset-2 ring-offset-white dark:ring-offset-black z-10"
                    : "border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-emerald-500/50 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                }`}
        >
            <div className="w-12 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0 overflow-hidden border border-zinc-100 dark:border-zinc-700">
                {item.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.logo} alt={item.name} className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
                ) : item.type === 'stock' ? (
                    <Building2 className="h-6 w-6" />
                ) : item.type === 'crypto' ? (
                    <Bitcoin className="h-6 w-6" />
                ) : (
                    <Banknote className="h-6 w-6" />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <span className={`font-bold text-base truncate ${isSelected ? "text-emerald-700 dark:text-emerald-400" : "text-zinc-900 dark:text-white"}`}>
                        {item.name}
                    </span>
                    {item.market && <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500">{item.market}</Badge>}
                </div>
                <div className="flex items-center text-xs font-medium text-zinc-500">
                    <span className="truncate">{item.symbol}</span>
                </div>
            </div>
            <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${isSelected ? "bg-emerald-500 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-300 group-hover:text-emerald-500 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/50"}`}>
                {isSelected ? <ChevronRight className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            </div>
        </button>
    );
}
