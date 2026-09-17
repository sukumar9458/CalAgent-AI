"use client";

import {
  ArrowUp,
  Calendar,
  HelpCircle,
  LoaderCircle,
  LogOut,
  Mic,
  PanelLeft,
  Plus,
  Sparkles,
  Square,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  FormEvent,
  KeyboardEvent,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import {
  listThreads,
  loadThread,
  streamAgentChat,
  ThreadSummary,
} from "@/lib/agent";
import { ScrollArea } from "../ui/scroll-area";
import { Textarea } from "../ui/textarea";
import { cn } from "@/lib/utils";
import TasksPanel from "./tasks-panel";
import { MarkdownMessage } from "./markdown-message";
import { useVoice } from "@/lib/use-voice";

type Props = {
  sessionToken: string;
  connections?: ReactNode;
  footer?: ReactNode;
};

type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
};

const WELCOME =
  "Welcome! I am your AI Executive Assistant. I can manage your action items, extract tasks from meeting notes, and organize your schedule. How can I assist you today?";

const SUGGESTIONS = [
  { icon: "✨", text: "Extract action items from meeting notes" },
  {
    icon: "📝",
    text: "Summarize notes: John to deploy backend schema by Friday...",
  },
  { icon: "📋", text: "List my pending action items" },
  {
    icon: "📅",
    text: "Schedule a 30-min Strategy Sync for tomorrow at 2:00 PM",
  },
];

function WelcomeMessage(): Message {
  return {
    id: "welcome",
    role: "assistant",
    content: WELCOME,
  };
}

export default function ChatPanel({
  sessionToken,
  connections,
  footer,
}: Props) {
  const [threadId, setThreadId] = useState(() => crypto.randomUUID());
  const [messages, setMessages] = useState<Message[]>([WelcomeMessage()]);
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [prompt, setPrompt] = useState("");
  const [running, setRunning] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const {
    isListening,
    isSpeaking,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  } = useVoice({
    onTranscript: (transcript) => {
      setPrompt((prev) => (prev ? `${prev} ${transcript}` : transcript));
    },
  });

  const showEmpty =
    messages.length === 1 && messages[0]?.id === "welcome" && !running;

  const bottomRef = useRef<HTMLDivElement>(null);

  const refreshThreads = useCallback(async () => {
    try {
      const data = await listThreads(sessionToken);
      setThreads(data.threads);
    } catch {}
  }, [sessionToken]);

  useEffect(() => {
    refreshThreads();
  }, [refreshThreads]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, progress]);

  function startNewChat() {
    if (running) return;
    stopSpeaking();
    setThreadId(crypto.randomUUID());
    setMessages([WelcomeMessage()]);
    setPrompt("");
  }

  async function resumeThread(nextThreadId: string) {
    if (running || loadingThread || nextThreadId === threadId) return;
    stopSpeaking();
    setLoadingThread(true);
    setProgress(null);

    try {
      const data = await loadThread(sessionToken, nextThreadId);
      setThreadId(data.threadId);
      setMessages(
        data.messages.length > 0 ? data.messages : [WelcomeMessage()],
      );
      setPrompt("");
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "system",
          content: "Could not load the chat",
        },
      ]);
    } finally {
      setLoadingThread(false);
    }
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || running || loadingThread) return;

    stopSpeaking();
    const assistantId = crypto.randomUUID();

    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
      },
      {
        id: assistantId,
        role: "assistant",
        content: "",
      },
    ]);

    setPrompt("");
    setRunning(true);
    setProgress(null);

    let fullReply = "";

    try {
      await streamAgentChat(
        sessionToken,
        {
          message: trimmed,
          threadId,
        },
        (event) => {
          if (event.type === "progress" && event.message) {
            setProgress(event.message);
          }
          if (event.type === "token" && event.token) {
            setProgress(null);
            fullReply += event.token;
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantId
                  ? {
                      ...message,
                      content: message.content + event.token,
                    }
                  : message,
              ),
            );
          }

          if (event.type === "error") {
            setProgress(null);
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantId
                  ? {
                      ...message,
                      content: event.message ?? "Agent failed",
                    }
                  : message,
              ),
            );
          }
        },
      );

      if (voiceOutputEnabled && fullReply) {
        speak(fullReply);
      }

      refreshThreads();
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "system",
          content: "Could not load the chat response",
        },
      ]);
    } finally {
      setRunning(false);
      setProgress(null);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    sendMessage(prompt);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage(prompt);
    }
  }

  return (
    <div className="flex h-svh w-full overflow-hidden bg-[#f8faf9] text-neutral-900">
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-neutral-900/20 backdrop-blur-2xs md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-neutral-200/80 bg-[#f8faf9] transition-transform duration-200 md:static md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#0f766e] text-white shadow-xs">
              <Sparkles className="size-4" />
            </div>
            <div>
              <p className="font-heading text-sm font-bold text-neutral-900 leading-tight">
                CalAgent AI
              </p>
              <p className="text-[11px] font-medium text-neutral-500">
                Workspace 1.2
              </p>
            </div>
          </div>

          <Button
            size="icon-sm"
            variant="ghost"
            className="size-8 rounded-lg text-neutral-400 hover:text-neutral-700"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <PanelLeft className="size-4" />
          </Button>
        </div>

        <div className="space-y-3 px-3 pb-2">
          {/* New Chat Button */}
          <button
            type="button"
            onClick={startNewChat}
            className="flex w-full items-center justify-between rounded-xl border border-neutral-200/90 bg-white px-3 py-2 text-xs font-semibold text-neutral-800 shadow-2xs transition-all hover:border-neutral-300 hover:bg-neutral-50"
          >
            <span className="flex items-center gap-1.5">
              <Plus className="size-3.5 text-neutral-500" />
              New Chat
            </span>
            <kbd className="rounded border border-neutral-200/70 bg-neutral-100 px-1.5 py-0.5 font-mono text-[10px] font-medium text-neutral-500">
              ⌘N
            </kbd>
          </button>

          {/* CONNECTIONS Component */}
          {connections}

          {/* ACTION ITEMS & TASKS Component */}
          <TasksPanel sessionToken={sessionToken} />
        </div>

        <Separator className="my-1 border-neutral-200/60" />

        {/* RECENT CHATS Section */}
        <div className="flex min-h-0 flex-1 flex-col px-3 pt-2">
          <p className="mb-2 px-1 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
            RECENT CHATS
          </p>
          <ScrollArea className="min-h-0 flex-1 pr-1">
            {threads.length === 0 ? (
              <p className="px-2 py-3 text-xs leading-relaxed text-neutral-400">
                No recent conversations. Start one above!
              </p>
            ) : (
              <div className="space-y-1.5">
                {threads.map((thread, idx) => {
                  const active = thread.id === threadId;
                  const mockTime =
                    idx === 0
                      ? "11:34 AM"
                      : idx === 1
                        ? "Sep 05"
                        : "Sep 02";
                  const mockSubtitle =
                    idx === 0
                      ? "High priority action items extracted"
                      : idx === 1
                        ? "Reviewed product sprint timelines"
                        : "Test conversation";

                  return (
                    <button
                      key={thread.id}
                      type="button"
                      disabled={running || loadingThread}
                      onClick={() => resumeThread(thread.id)}
                      className={cn(
                        "group flex w-full flex-col gap-0.5 rounded-xl border p-2.5 text-left transition-all disabled:opacity-50",
                        active
                          ? "border-neutral-200/80 bg-neutral-100/90 shadow-2xs"
                          : "border-transparent hover:bg-neutral-100/60",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate text-xs font-semibold text-neutral-900">
                          {thread.title}
                        </span>
                        <span className="shrink-0 text-[10px] font-medium text-neutral-400">
                          {mockTime}
                        </span>
                      </div>
                      <span className="truncate text-[11px] font-normal text-neutral-500">
                        {mockSubtitle}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        <Separator className="border-neutral-200/60" />

        {/* User Footer */}
        <div className="flex items-center justify-between border-t border-neutral-200/80 bg-[#f8faf9] p-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-xs font-bold text-white">
              N
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-neutral-900 leading-tight">
                shettysukumar251@gmail.com
              </p>
              <p className="truncate text-[10px] font-medium text-neutral-500">
                Free Tier Workspace
              </p>
            </div>
          </div>
          {footer}
        </div>
      </aside>

      {/* Main Assistant Content Area */}
      <section className="relative flex min-w-0 flex-1 flex-col bg-[#f8faf9]">
        {/* Main Header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200/70 bg-[#f8faf9]/80 px-4 backdrop-blur-md md:px-6">
          <div className="flex items-center gap-3">
            <Button
              size="icon-sm"
              variant="ghost"
              className="md:hidden size-8 text-neutral-600"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <PanelLeft className="size-4" />
            </Button>
            <div>
              <p className="text-sm font-bold text-neutral-900 leading-tight">
                Assistant
              </p>
              <p className="text-xs font-medium text-neutral-500">
                Schedule, reschedule, and brief your day
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (isSpeaking) stopSpeaking();
                setVoiceOutputEnabled(!voiceOutputEnabled);
              }}
              className="flex h-8 items-center gap-1.5 rounded-full border border-neutral-200/90 bg-white px-3 text-xs font-medium text-neutral-700 shadow-2xs hover:bg-neutral-50 transition-all"
            >
              {voiceOutputEnabled ? (
                <>
                  <Volume2 className="size-3.5 text-emerald-600" />
                  <span>Voice Replies ON</span>
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                </>
              ) : (
                <>
                  <VolumeX className="size-3.5 text-neutral-400" />
                  <span>Voice Replies OFF</span>
                  <span className="size-1.5 rounded-full bg-neutral-300" />
                </>
              )}
            </button>

            <button
              type="button"
              className="flex size-7 items-center justify-center rounded-full border border-neutral-200/90 bg-white text-neutral-500 hover:text-neutral-900 shadow-2xs"
              title="Help & Info"
            >
              <HelpCircle className="size-4" />
            </button>
          </div>
        </header>

        {/* Chat Stream & Messages */}
        <div className="relative flex min-h-0 flex-1 flex-col">
          <ScrollArea className="h-full min-h-0 flex-1">
            <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
              {showEmpty ? (
                <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
                  <div className="mb-4 flex size-12 items-center justify-center rounded-2xl border border-teal-100/80 bg-teal-50 text-teal-600 shadow-2xs">
                    <Sparkles className="size-5" />
                  </div>
                  <h2 className="font-heading text-3xl font-bold tracking-tight text-neutral-900">
                    Meeting Assistant
                  </h2>
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-neutral-600">
                    {WELCOME}
                  </p>

                  <div className="mt-8 flex flex-col items-center gap-2.5 w-full max-w-md">
                    {SUGGESTIONS.map((item) => (
                      <button
                        key={item.text}
                        type="button"
                        onClick={() => sendMessage(item.text)}
                        disabled={running || loadingThread}
                        className="flex w-full items-center justify-center gap-2 rounded-full border border-neutral-200/90 bg-white px-4 py-2 text-xs font-medium text-neutral-700 shadow-2xs transition-all hover:border-neutral-300 hover:bg-neutral-50 hover:shadow-xs disabled:opacity-50"
                      >
                        <span>{item.icon}</span>
                        <span className="truncate">{item.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {loadingThread ? (
                    <div className="flex items-center gap-2 text-sm text-neutral-500">
                      <LoaderCircle className="size-4 animate-spin text-teal-600" />
                      Loading Chat...
                    </div>
                  ) : (
                    messages.map((message) => {
                      if (message.id === "welcome" && messages.length > 1) {
                        return null;
                      }

                      return (
                        <div
                          key={message.id}
                          className={cn(
                            "message-enter flex w-full min-w-0",
                            message.role === "user"
                              ? "justify-end"
                              : "justify-start",
                          )}
                        >
                          <div
                            className={cn(
                              "min-w-0 max-w-[min(100%,42rem)] rounded-2xl p-4 text-sm shadow-2xs transition-all",
                              message.role === "user"
                                ? "rounded-br-md bg-[#0f766e] text-white"
                                : message.role === "assistant"
                                  ? "rounded-bl-md border border-neutral-200/80 bg-white text-neutral-900"
                                  : "bg-neutral-100 text-neutral-600",
                            )}
                          >
                            {!message.content && running ? (
                              <span className="inline-flex items-center gap-2 text-xs text-neutral-500">
                                <LoaderCircle className="size-3.5 animate-spin text-teal-600" />
                                Thinking...
                              </span>
                            ) : message.role === "user" ? (
                              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                                {message.content}
                              </p>
                            ) : (
                              <>
                                <MarkdownMessage
                                  content={message.content}
                                  tone={
                                    message.role === "system"
                                      ? "system"
                                      : "assistant"
                                  }
                                />
                                {message.role === "assistant" &&
                                  message.content && (
                                    <button
                                      type="button"
                                      onClick={() => speak(message.content)}
                                      className="mt-2.5 flex items-center gap-1.5 text-[11px] font-medium text-neutral-400 hover:text-neutral-800 transition-colors"
                                      title="Listen to response"
                                    >
                                      <Volume2 className="size-3.5" />
                                      <span>
                                        {isSpeaking ? "Speaking..." : "Listen"}
                                      </span>
                                    </button>
                                  )}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}

                  {progress ? (
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <LoaderCircle className="size-3.5 animate-spin text-teal-600" />
                      {progress}
                    </div>
                  ) : null}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Bottom Floating Composer Bar */}
          <div className="shrink-0 px-4 pb-4 pt-2 sm:px-6">
            <form
              onSubmit={onSubmit}
              className="mx-auto flex w-full max-w-2xl items-center gap-2 rounded-2xl border border-neutral-200/90 bg-white p-2 shadow-lg transition-all focus-within:border-neutral-300 focus-within:shadow-xl"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl text-neutral-400 ml-1">
                <Calendar className="size-4" />
              </div>

              <Textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                rows={1}
                onKeyDown={onKeyDown}
                disabled={running}
                placeholder={
                  isListening
                    ? "Listening to your voice..."
                    : "Ask about your calendar or speak your prompt... (Press / for commands)"
                }
                className="max-h-36 min-h-[40px] flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm shadow-none focus-visible:ring-0 text-neutral-900 placeholder:text-neutral-400"
              />

              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition-all hover:bg-neutral-100 hover:text-neutral-900",
                  isListening &&
                    "mic-pulse border-rose-500 bg-rose-600 text-white hover:bg-rose-700",
                )}
                title={isListening ? "Stop listening" : "Speak prompt"}
              >
                {isListening ? (
                  <Square className="size-3.5 fill-current" />
                ) : (
                  <Mic className="size-3.5" />
                )}
              </button>

              <button
                type="submit"
                disabled={!prompt.trim() || running}
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#0f766e] text-white shadow-xs transition-all hover:bg-[#0d9488] disabled:opacity-40"
                aria-label="Send Message"
              >
                {running ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <ArrowUp className="size-4" />
                )}
              </button>
            </form>

            {/* Sub-Composer Status Line */}
            <div className="mx-auto mt-2 flex max-w-2xl items-center justify-between px-2 text-[11px] font-medium text-neutral-400">
              <p className="flex items-center gap-1.5">
                <span>Model: MeetAgent-4o Core</span>
                <span>•</span>
                <span>Sync:</span>
                <span className="font-semibold text-emerald-600">Active</span>
              </p>

              <p className="flex items-center gap-1">
                <span>Press</span>
                <kbd className="rounded border border-neutral-200 bg-neutral-100 px-1 py-0.2 font-mono text-[10px] text-neutral-600 font-semibold">
                  ↵
                </kbd>
                <span>to execute</span>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
