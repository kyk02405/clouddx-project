"use client";

import { Card, CardContent } from "@/components/ui/card";

const presets = [
    {
        id: 1,
        title: "BTC ±5% 변동 알림",
        description: "비트코인 가격이 5% 이상 변동 시 알림",
        icon: "🔔",
    },
    {
        id: 2,
        title: "급락 알림",
        description: "보유 자산이 10% 이상 하락 시 즉시 알림",
        icon: "🚨",
    },
    {
        id: 3,
        title: "뉴스 키워드 알림",
        description: "선택한 키워드가 포함된 뉴스 발생 시 알림",
        icon: "📰",
    },
];

export default function AlertPresets() {
    return (
        <section className="bg-background px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <h2 className="mb-6 text-2xl font-bold text-foreground">Alert Presets</h2>

                <div className="grid gap-4 md:grid-cols-3">
                    {presets.map((preset) => (
                        <Card
                            key={preset.id}
                            className="cursor-pointer transition hover:shadow-md hover:border-primary"
                        >
                            <CardContent className="p-6">
                                <div className="mb-3 text-3xl">{preset.icon}</div>
                                <h3 className="mb-2 font-semibold text-foreground">{preset.title}</h3>
                                <p className="text-sm text-muted-foreground">{preset.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
