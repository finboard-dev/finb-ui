"use client";

type MessageMentionProps = {
  name: string;
  className?: string;
};

export default function MessageMention({
  name,
  className = "",
}: MessageMentionProps) {
  return (
    <span
      className={`inline-flex items-center bg-blue-100 text-blue-800 rounded-md py-0.5 px-2 mx-0.5 font-medium text-sm ${className}`}
    >
      @{name}
    </span>
  );
}
