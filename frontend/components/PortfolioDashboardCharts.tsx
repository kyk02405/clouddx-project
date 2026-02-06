"use client";

import React from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
    AreaChart, Area
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardAssetData {
    symbol: string;
    name: string;
    value: number;
    color: string;
}

interface PortfolioDashboardChartsProps {
    data: DashboardAssetData[];
}

// Custom Tooltip for better aesthetics
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card border border-border p-3 rounded-xl shadow-xl">
                <p className="text-sm font-black text-foreground mb-1">{label}</p>
                <p className="text-xs font-black text-primary">
                    평가 금액: {payload[0].value.toLocaleString()}원
                </p>
                {payload[0].payload.percent && (
                    <p className="text-[11px] font-bold text-muted-foreground">
                        비중: {payload[0].payload.percent}%
                    </p>
                )}
            </div>
        );
    }
    return null;
};

export default function PortfolioDashboardCharts({ data }: PortfolioDashboardChartsProps) {
    // Sample performance data (Mocked for dashboard look)
    const performanceData = [
        { name: 'Jan', value: 4000 },
        { name: 'Feb', value: 3000 },
        { name: 'Mar', value: 5000 },
        { name: 'Apr', value: 4500 },
        { name: 'May', value: 6000 },
        { name: 'Jun', value: 5500 },
        { name: 'Jul', value: totalValue() }, // Current total
    ];

    function totalValue() {
        return data.reduce((acc, curr) => acc + curr.value, 0);
    }

    const total = totalValue();
    const barData = data.slice(0, 5).map(item => ({
        name: item.symbol,
        value: item.value,
        color: item.color,
        percent: total > 0 ? ((item.value / total) * 100).toFixed(1) : "0.0"
    }));

    return (
        <div className="grid gap-3 md:gap-6 grid-cols-2">
            {/* Asset Value Bar Chart */}
            <Card className="border-border shadow-none bg-card">
                <CardHeader className="p-3 md:p-6 pb-2 md:pb-4">
                    <CardTitle className="text-sm md:text-lg font-black truncate">Top 자산</CardTitle>
                    <CardDescription className="hidden md:block text-xs font-medium text-muted-foreground">상위 5개 보유 자산 평가액</CardDescription>
                </CardHeader>
                <CardContent className="p-2 md:p-6 pt-0">
                    <div className="h-[180px] md:h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData} margin={{ top: 5, right: 5, left: -35, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9, fontWeight: 600 }}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontWeight: 500 }}
                                    domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.25)]}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent', opacity: 0.1 }} />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={20}>
                                    {barData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Performance Trend Chart */}
            <Card className="border-border shadow-none bg-card">
                <CardHeader className="p-3 md:p-6 pb-2 md:pb-4">
                    <CardTitle className="text-sm md:text-lg font-black">추이</CardTitle>
                    <CardDescription className="hidden md:block text-xs font-medium text-muted-foreground">지난 6개월간 변동</CardDescription>
                </CardHeader>
                <CardContent className="p-2 md:p-6 pt-0">
                    <div className="h-[180px] md:h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={performanceData} margin={{ top: 5, right: 5, left: -35, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#34D399" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#34D399" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9, fontWeight: 600 }}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontWeight: 500 }}
                                    domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.25)]}
                                />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '15px', fontWeight: '900' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="value" 
                                    stroke="#34D399" 
                                    strokeWidth={3}
                                    fillOpacity={1} 
                                    fill="url(#colorValue)" 
                                 />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
