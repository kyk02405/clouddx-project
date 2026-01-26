import { Button } from "@/components/ui/button";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* CTA Section */}
        <div className="mb-12 rounded-lg bg-primary/10 p-8 text-center">
          <h3 className="mb-4 text-2xl font-bold text-foreground">지금 시작하세요</h3>
          <p className="mb-6 text-muted-foreground">AI 기반 자산 관리로 더 스마트한 투자를 경험하세요</p>
          <Button size="lg">무료로 시작하기</Button>
        </div>

        {/* Footer Links */}
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h4 className="mb-4 text-lg font-semibold text-foreground">
              Tutum
            </h4>
            <p className="text-sm text-muted-foreground">
              AI 기반 자산 관리 플랫폼으로 더 나은 투자 결정을 내리세요
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-foreground">제품</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="transition hover:text-foreground">
                  기능 소개
                </a>
              </li>
              <li>
                <a href="#" className="transition hover:text-foreground">
                  요금 안내
                </a>
              </li>
              <li>
                <a href="#" className="transition hover:text-foreground">
                  API 문서
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-foreground">법적 고지</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="transition hover:text-foreground">
                  이용약관
                </a>
              </li>
              <li>
                <a href="#" className="transition hover:text-foreground">
                  개인정보처리방침
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          © 2026 Tutum. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
