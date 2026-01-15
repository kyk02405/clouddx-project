export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-800">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
            로그인
          </h1>
          
          <form className="space-y-4">
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
              >
                이메일
              </label>
              <input
                id="email"
                type="email"
                placeholder="email@example.com"
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
              >
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              로그인
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              계정이 없으신가요?{" "}
              <a href="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                회원가입
              </a>
            </p>
          </div>

          <div className="mt-4">
            <button
              type="button"
              className="w-full py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium rounded-lg transition-colors"
            >
              데모 로그인 (Coming soon)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
