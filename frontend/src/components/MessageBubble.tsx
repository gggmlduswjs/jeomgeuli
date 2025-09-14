import { ReactNode } from "react";
import clsx from "clsx";

export type BubbleRole = "user" | "assistant" | "system";
export type MessageBubbleProps = {
  role: BubbleRole;
  children?: ReactNode;
  text?: string;
  className?: string;
};

export function MessageBubble({ role, children, text, className }: MessageBubbleProps) {
  const isUser = role === "user";
  return (
    <div
      role="article"
      aria-label={isUser ? "사용자 메시지" : role === "assistant" ? "도우미 메시지" : "시스템 메시지"}
      className={clsx(
        "w-full flex",
        isUser ? "justify-end" : "justify-start",
        className
      )}
    >
      <div
        className={clsx(
          "max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-6",
          isUser
            ? "bg-primary text-white shadow-lg"
            : "bg-card text-fg border border-border shadow-card"
        )}
      >
        {children ?? text}
      </div>
    </div>
  );
}

export default MessageBubble;
