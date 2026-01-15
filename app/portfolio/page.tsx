import { redirect } from "next/navigation";

export default function PortfolioPage() {
  // In a real app, check auth status here
  // For now, this is just a placeholder
  const isLoggedIn = false;

  if (!isLoggedIn) {
    redirect("/login");
  }

  return (
    <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-800">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
          나의 자산
        </h1>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">총 자산</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                Coming soon
              </p>
            </div>

            <div className="p-6 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">총 손익</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                Coming soon
              </p>
            </div>

            <div className="p-6 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">수익률</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                Coming soon
              </p>
            </div>
          </div>

          <div className="p-6 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              보유 자산
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400">
              보유 자산이 없습니다
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
