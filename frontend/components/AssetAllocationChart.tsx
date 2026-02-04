import { 
    PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PieChart as PieIcon, BarChart3, Target, Info } from 'lucide-react';
import { Tooltip as RadixTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AssetData {
    symbol: string;
    name: string;
    value: number;
    color: string;
}

interface AssetAllocationChartProps {
    data: AssetData[];
}

type ChartMode = 'pie' | 'bar' | 'radar';

export default function AssetAllocationChart({ data }: AssetAllocationChartProps) {
    const [mode, setMode] = useState<ChartMode>('pie');
    const total = data.reduce((acc, curr) => acc + curr.value, 0);

    const chartData = data.map(item => ({
        ...item,
        percent: total > 0 ? ((item.value / total) * 100).toFixed(1) : "0.0",
        fullValue: item.value
    }));

    const renderChart = () => {
        switch (mode) {
            case 'pie':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: 'hsl(var(--card))' }}
                                itemStyle={{ color: 'hsl(var(--foreground))', fontSize: '12px' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                );
            case 'bar':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="vertical" margin={{ left: -20, right: 30 }}>
                            <XAxis type="number" hide />
                            <YAxis 
                                dataKey="name" 
                                type="category" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                            />
                            <Tooltip 
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: 'hsl(var(--card))' }}
                            />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                );
            case 'radar':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                            <PolarGrid stroke="hsl(var(--border))" />
                            <PolarAngleAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                            <Radar
                                name="비중"
                                dataKey="value"
                                stroke="hsl(var(--primary))"
                                fill="hsl(var(--primary))"
                                fillOpacity={0.6}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                );
        }
    };

    return (
        <div className="flex flex-col space-y-6">
            <div className="flex items-center justify-between px-2">
                <div className="flex bg-muted p-1 rounded-lg">
                    {[
                        { id: 'pie', icon: PieIcon, label: '분포' },
                        { id: 'bar', icon: BarChart3, label: '순위' },
                        { id: 'radar', icon: Target, label: '균형' }
                    ].map((btn) => (
                        <Button
                            key={btn.id}
                            variant={mode === btn.id ? "secondary" : "ghost"}
                            size="sm"
                            className={`h-8 gap-2 px-3 ${mode === btn.id ? "bg-background shadow-sm" : ""}`}
                            onClick={() => setMode(btn.id as ChartMode)}
                        >
                            <btn.icon className="h-3.5 w-3.5" />
                            <span className="text-[11px] font-bold">{btn.label}</span>
                        </Button>
                    ))}
                </div>
                <TooltipProvider>
                    <RadixTooltip>
                        <TooltipTrigger asChild>
                            <div className="p-2 cursor-help text-muted-foreground hover:text-foreground transition-colors">
                                <Info className="h-4 w-4" />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[200px] text-[10px] leading-relaxed">
                            차트 모드를 전환하여 자산의 분포, 상대적 순위 및 포트폴리오의 전체적인 균형을 분석할 수 있습니다.
                        </TooltipContent>
                    </RadixTooltip>
                </TooltipProvider>
            </div>

            <div className="h-[250px] w-full relative">
                {renderChart()}
                {mode === 'pie' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total</span>
                        <span className="text-lg font-black text-foreground">{(total / 1000000).toFixed(1)}M</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-2 px-4 border-t border-border pt-6">
                {chartData.map((asset) => (
                    <div key={asset.symbol} className="flex items-center justify-between group">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: asset.color }} />
                            <span className="text-[11px] font-medium text-muted-foreground truncate max-w-[80px] group-hover:text-foreground transition-colors">{asset.name}</span>
                        </div>
                        <span className="text-[11px] font-bold text-foreground">{asset.percent}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
