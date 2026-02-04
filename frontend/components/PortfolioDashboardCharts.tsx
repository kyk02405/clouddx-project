"use client";

import React from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
    AreaChart, Area
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

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
                <p className="text-sm font-bold text-foreground mb-1">{label}</p>
                <p className="text-xs font-medium text-primary">
                    평가 금액: {payload[0].value.toLocaleString()}원
                </p>
                {payload[0].payload.percent && (
                    <p className="text-[10px] text-muted-foreground">
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

    const barData = data.slice(0, 5).map(item => ({
        name: item.symbol,
        value: item.value,
        color: item.color,
        percent: ((item.value / totalValue()) * 100).toFixed(1)
    }));

    return (
        <div className="grid gap-6 md:grid-cols-2">
            {/* Asset Value Bar Chart */}
            <Card className="border-border shadow-none bg-card">
                <CardHeader>
                    <CardTitle className="text-lg font-bold">Top 자산 분석</CardTitle>
                    <CardDescription className="text-xs font-medium text-muted-foreground">상위 5개 보유 자산의 평가 금액</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 600 }}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent', opacity: 0.1 }} />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
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
                <CardHeader>
                    <CardTitle className="text-lg font-bold">포트폴리오 추이 (Mock)</CardTitle>
                    <CardDescription className="text-xs font-medium text-muted-foreground">지난 6개월간의 자산 평가액 변동</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 600 }}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                                />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
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
