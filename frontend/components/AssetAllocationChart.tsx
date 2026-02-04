"use client";

import React from 'react';

interface AssetData {
    symbol: string;
    name: string;
    value: number;
    color: string;
}

interface AssetAllocationChartProps {
    data: AssetData[];
}

export default function AssetAllocationChart({ data }: AssetAllocationChartProps) {
    const total = data.reduce((acc, curr) => acc + curr.value, 0);
    let cumulativePercent = 0;

    // SVG Circle calculations
    const radius = 70;
    const circumference = 2 * Math.PI * radius;

    return (
        <div className="flex flex-col items-center justify-center space-y-8 py-4">
            <div className="relative w-64 h-64">
                <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
                    {data.map((asset, index) => {
                        const percent = (asset.value / total) * 100;
                        const strokeDasharray = `${(percent * circumference) / 100} ${circumference}`;
                        const strokeDashoffset = -(cumulativePercent * circumference) / 100;
                        cumulativePercent += percent;

                        return (
                            <circle
                                key={asset.symbol}
                                cx="100"
                                cy="100"
                                r={radius}
                                fill="transparent"
                                stroke={asset.color}
                                strokeWidth="25"
                                strokeDasharray={strokeDasharray}
                                strokeDashoffset={strokeDashoffset}
                                className="transition-all duration-700 ease-in-out hover:strokeWidth-[30] cursor-pointer"
                            />
                        );
                    })}
                    {/* Inner Circle for Doughnut effect */}
                    <circle cx="100" cy="100" r="55" className="fill-background" />

                    {/* Center Text */}
                    <g className="rotate-90 origin-center">
                        <text x="100" y="95" textAnchor="middle" className="text-sm font-medium fill-muted-foreground">Total</text>
                        <text x="100" y="120" textAnchor="middle" className="text-xl font-bold fill-foreground">
                            ${(total / 1000).toFixed(1)}K
                        </text>
                    </g>
                </svg>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-4 w-full px-4">
                {data.map((asset) => (
                    <div key={asset.symbol} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: asset.color }} />
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-foreground">{asset.name}</span>
                            <span className="text-[10px] text-muted-foreground">{((asset.value / total) * 100).toFixed(1)}%</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
