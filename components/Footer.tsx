import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Company Info */}
          <div>
            <h3 className="text-lg font-bold text-gradient mb-4">CovaEX</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              안전하고 신뢰할 수 있는 암호화폐 거래 플랫폼
            </p>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              서비스
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/markets" className="text-sm text-zinc-600 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400">
                  코인 시세
                </Link>
              </li>
              <li>
                <Link href="/portfolio" className="text-sm text-zinc-600 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400">
                  포트폴리오
                </Link>
              </li>
              <li>
                <Link href="/analytics" className="text-sm text-zinc-600 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400">
                  분석
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              고객지원
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/help" className="text-sm text-zinc-600 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400">
                  도움말
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-sm text-zinc-600 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-zinc-600 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400">
                  문의하기
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              법적 고지
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="text-sm text-zinc-600 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400">
                  이용약관
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-zinc-600 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400">
                  개인정보처리방침
                </Link>
              </li>
              <li>
                <Link href="/disclaimer" className="text-sm text-zinc-600 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400">
                  면책조항
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 border-t border-zinc-200 pt-8 dark:border-zinc-800">
          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            © {currentYear} CovaEX. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
