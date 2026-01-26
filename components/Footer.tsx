export default function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-gray-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* CTA Section */}
        <div className="mb-12 rounded-lg bg-gradient-to-r from-blue-900/30 to-purple-900/30 p-8 text-center">
          <h3 className="mb-4 text-2xl font-bold text-white">지금 시작하세요</h3>
          <p className="mb-6 text-gray-300">AI 기반 자산 관리로 더 스마트한 투자를 경험하세요</p>
          <button className="rounded-lg bg-blue-600 px-8 py-3 font-medium text-white shadow-lg transition hover:bg-blue-700">
            무료로 시작하기
          </button>
        </div>

        {/* Footer Links */}
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h4 className="mb-4 text-lg font-semibold text-white">
              Asset<span className="text-blue-500">AI</span>
            </h4>
            <p className="text-sm text-gray-400">
              AI 기반 자산 관리 플랫폼으로 더 나은 투자 결정을 내리세요
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-white">Product</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href="#" className="transition hover:text-white">
                  Features
                </a>
              </li>
              <li>
                <a href="#" className="transition hover:text-white">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#" className="transition hover:text-white">
                  API
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-white">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href="#" className="transition hover:text-white">
                  이용약관
                </a>
              </li>
              <li>
                <a href="#" className="transition hover:text-white">
                  개인정보처리방침
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
          © 2026 AssetAI. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
