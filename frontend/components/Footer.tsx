import Link from "next/link";
import { Github, Twitter, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative w-full border-t border-zinc-100 dark:border-zinc-800 mt-20 bg-background pt-16 pb-24 overflow-hidden">
      
      <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-16 mb-20">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-xl font-black tracking-tighter text-foreground mb-4">tutum</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              AI 기반 자산 관리의 새로운 기준.<br />
              복잡한 투자를 가장 단순하게.
            </p>
            <div className="flex gap-4">
              <Link href="#" className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-indigo-500 transition-colors">
                <Github className="w-4 h-4" />
              </Link>
              <Link href="#" className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-indigo-500 transition-colors">
                <Twitter className="w-4 h-4" />
              </Link>
              <Link href="#" className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-indigo-500 transition-colors">
                <Mail className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Sitemap Columns */}
          <div>
            <h4 className="font-bold text-foreground mb-4">서비스</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/features" className="hover:text-indigo-500 transition-colors">주요 기능</Link></li>
              <li><Link href="/pricing" className="hover:text-indigo-500 transition-colors">요금제</Link></li>
              <li><Link href="/changelog" className="hover:text-indigo-500 transition-colors">업데이트</Link></li>
              <li><Link href="/docs" className="hover:text-indigo-500 transition-colors">가이드</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-foreground mb-4">회사</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-indigo-500 transition-colors">소개</Link></li>
              <li><Link href="/careers" className="hover:text-indigo-500 transition-colors">채용</Link></li>
              <li><Link href="/contact" className="hover:text-indigo-500 transition-colors">문의하기</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-foreground mb-4">법적 고지</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="/privacy" className="hover:text-indigo-500 transition-colors">개인정보처리방침</Link></li>
              <li><Link href="/terms" className="hover:text-indigo-500 transition-colors">이용약관</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-zinc-100 dark:border-zinc-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-zinc-400 font-medium">
                © 2026 TUTUM INC. ALL RIGHTS RESERVED.
            </p>
            <div className="flex gap-6 text-xs text-zinc-400">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> All Systems Operational</span>
            </div>
        </div>
      </div>

      {/* Big Fading Logo - Background */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none select-none -z-0 w-full overflow-hidden flex justify-center">
        <h1 className="text-[12rem] sm:text-[18rem] font-black tracking-tighter leading-[0.8] text-transparent bg-clip-text bg-gradient-to-t from-zinc-300 to-transparent dark:from-zinc-800 dark:to-transparent transform translate-y-[30%]">
          tutum
        </h1>
      </div>
    </footer>
  );
}
