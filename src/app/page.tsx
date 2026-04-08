import Link from "next/link";

export default async function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-white to-zinc-100 dark:from-zinc-900 dark:to-zinc-800">
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
        <div className="max-w-3xl w-full text-center">
  

          {/* Title */}
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            AI 视频创作平台
          </h1>
          <p className="mb-2 text-xl text-zinc-600 dark:text-zinc-400">
            故事转视频，一键生成
          </p>
          <p className="mb-12 text-zinc-500 dark:text-zinc-500">
            支持小说改编、原创剧本、分镜设计、AI生成图片视频
          </p>

          {/* Main Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link
              href="/projects"
              className="w-full sm:w-auto flex items-center justify-center gap-2 h-14 px-8 rounded-xl bg-gradient-to-r from-zinc-600 to-zinc-700 text-white font-medium shadow-lg shadow-zinc-500/25 hover:shadow-xl hover:shadow-zinc-500/30 transition-all hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              开始创作
            </Link>
            <Link
              href="/projects"
              className="w-full sm:w-auto flex items-center justify-center gap-2 h-14 px-8 rounded-xl border-2 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium hover:border-zinc-400 dark:hover:border-zinc-600 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              我的项目
            </Link>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
            <div className="p-6 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
              <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-zinc-100 dark:bg-zinc-700/50 flex items-center justify-center">
                <svg className="w-6 h-6 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">小说导入</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">上传小说，AI自动分析提取角色、场景、情节</p>
            </div>

            <div className="p-6 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
              <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-zinc-100 dark:bg-zinc-700/50 flex items-center justify-center">
                <svg className="w-6 h-6 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">分镜设计</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">专业分镜编辑器，支持镜头语言、版本管理</p>
            </div>

            <div className="p-6 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
              <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-zinc-100 dark:bg-zinc-700/50 flex items-center justify-center">
                <svg className="w-6 h-6 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">AI生成</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">一键生成图片视频，支持多种AI模型</p>
            </div>
          </div>

          {/* Workflow */}
          <div className="p-8 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-6">创作流程</h3>
            <div className="flex items-center justify-between">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-700/50 flex items-center justify-center text-zinc-600 dark:text-zinc-400 font-medium mb-2">1</div>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">项目规划</span>
              </div>
              <svg className="w-8 h-8 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-700/50 flex items-center justify-center text-zinc-600 dark:text-zinc-400 font-medium mb-2">2</div>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">故事开发</span>
              </div>
              <svg className="w-8 h-8 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-700/50 flex items-center justify-center text-zinc-600 dark:text-zinc-400 font-medium mb-2">3</div>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">分镜设计</span>
              </div>
              <svg className="w-8 h-8 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-700/50 flex items-center justify-center text-zinc-600 dark:text-zinc-400 font-medium mb-2">4</div>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">素材生成</span>
              </div>
            </div>
            <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-500">
              💡 在项目规划阶段可选择「手动规划」或「小说导入」两种方式
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-zinc-400 dark:text-zinc-500">
        <p>AI 视频创作平台 · 让创作更简单</p>
      </footer>
    </div>
  );
}
