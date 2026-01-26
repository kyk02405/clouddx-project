import { Card, CardContent } from "@/components/ui/card";

const features = [
    {
        step: "1",
        title: "자산 업로드",
        description: "CSV 파일 업로드 또는 OCR로 자산 내역을 간편하게 등록하세요",
        icon: "📤",
    },
    {
        step: "2",
        title: "자동 정리",
        description: "AI가 자산을 자동으로 분류하고 실시간 시세와 매칭합니다",
        icon: "🤖",
    },
    {
        step: "3",
        title: "AI 분석",
        description: "뉴스와 시장 데이터를 기반으로 인사이트를 제공받으세요",
        icon: "📈",
    },
];

export default function FeaturesSection() {
    return (
        <section id="features" className="bg-muted/50 px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <div className="mb-12 text-center">
                    <h2 className="mb-4 text-3xl font-bold text-foreground">How It Works</h2>
                    <p className="text-muted-foreground">3단계로 시작하는 스마트 자산 관리</p>
                </div>

                <div className="grid gap-8 md:grid-cols-3">
                    {features.map((feature) => (
                        <Card key={feature.step} className="text-center">
                            <CardContent className="pt-6">
                                {/* Step number */}
                                <div className="mb-4 flex justify-center">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                                        {feature.step}
                                    </div>
                                </div>

                                {/* Icon */}
                                <div className="mb-4 text-5xl">{feature.icon}</div>

                                {/* Content */}
                                <h3 className="mb-3 text-xl font-semibold text-foreground">{feature.title}</h3>
                                <p className="text-muted-foreground">{feature.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
