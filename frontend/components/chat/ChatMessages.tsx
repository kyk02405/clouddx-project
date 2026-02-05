'use client';

import { Message } from '@/types/chat';

interface UserMessageProps {
    content: string;
}

export function UserMessage({ content }: UserMessageProps) {
    return (
        <div className="flex gap-3 px-4 py-3 justify-end">
            <div className="max-w-[80%] bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3">
                <p className="text-sm whitespace-pre-wrap">{content}</p>
            </div>
        </div>
    );
}

interface AssistantMessageProps {
    content: string;
    sources?: { type: string; title: string; url?: string }[];
    isStreaming?: boolean;
}

export function AssistantMessage({ content, sources, isStreaming }: AssistantMessageProps) {
    return (
        <div className="flex gap-3 px-4 py-3">
            {/* AI 아바타 */}
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                AI
            </div>

            <div className="flex-1 max-w-[85%]">
                {/* 메시지 내용 */}
                <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                    <div className="prose prose-sm dark:prose-invert max-w-none text-sm whitespace-pre-wrap">
                        {content || (isStreaming && <span className="text-zinc-400">생각 중...</span>)}
                        {isStreaming && (
                            <span className="inline-block w-2 h-4 bg-emerald-500 animate-pulse ml-1 rounded-sm" />
                        )}
                    </div>
                </div>

                {/* 출처 표시 */}
                {sources && sources.length > 0 && !isStreaming && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium">출처:</span>
                        {sources.map((source, idx) => (
                            <span
                                key={idx}
                                className="text-[10px] px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-500 dark:text-zinc-400 font-medium"
                            >
                                {source.type === 'price' && '📊'}
                                {source.type === 'news' && '📰'}
                                {source.type === 'portfolio' && '💼'}
                                {source.title}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

interface ChatMessagesProps {
    messages: Message[];
}

export function ChatMessages({ messages }: ChatMessagesProps) {
    if (messages.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-2xl font-bold shadow-xl mb-6">
                    AI
                </div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
                    tutum AI에게 물어보세요
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm">
                    포트폴리오 분석, 시세 정보, 투자 조언 등 금융 관련 질문에 답변해 드립니다.
                </p>

                {/* 추천 질문 */}
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
                    {[
                        '비트코인 현재 시세 알려줘',
                        '내 포트폴리오 분석해줘',
                        '리밸런싱이 필요한지 알려줘',
                        '이더리움 최근 동향은?',
                    ].map((suggestion, idx) => (
                        <button
                            key={idx}
                            className="text-left text-sm px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-600 dark:text-zinc-300 transition-colors"
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto py-4">
            {messages.map((message) => (
                message.role === 'user' ? (
                    <UserMessage key={message.id} content={message.content} />
                ) : (
                    <AssistantMessage
                        key={message.id}
                        content={message.content}
                        sources={message.sources}
                        isStreaming={message.isStreaming}
                    />
                )
            ))}
        </div>
    );
}
