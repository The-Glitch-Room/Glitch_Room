import React from "react";
import ReactMarkdown from "react-markdown";

/**
 * Normalizes raw text containing literal escaped characters (\n, \r\n)
 * or unicode bullet points (•, ◦, ▪, ▫) into clean Markdown.
 */
export const normalizeEventDescription = (rawText) => {
  if (!rawText) return "";
  let text = String(rawText);

  // 1. Unescape literal string representations of newlines ("\n", "\\n", "\r\n")
  text = text
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n");

  // 2. Normalize unicode bullets into Markdown list items
  text = text.replace(/^[ \t]*[•◦▪▫]\s*/gm, "- ");

  return text.trim();
};

/**
 * Universal Pro Room Description Markdown Renderer
 * Accurately formats paragraphs, headings, bullet lists, bold text, and code blocks
 * across all existing and future Pro Rooms.
 */
export const ProRoomDescriptionRenderer = ({ content, className = "" }) => {
  if (!content) return null;
  const normalized = normalizeEventDescription(content);

  return (
    <div className={`pro-room-description text-xs text-gray-300 leading-relaxed font-sans ${className}`}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="text-base sm:text-lg font-black text-white mt-4 mb-2 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm sm:text-base font-bold text-white mt-3.5 mb-2 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs sm:text-sm font-bold text-[#00F0FF] mt-3 mb-1.5 first:mt-0">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-xs font-bold text-purple-300 mt-2.5 mb-1 first:mt-0">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="text-gray-300 leading-relaxed mb-3 last:mb-0">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="text-white font-bold">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="text-purple-200 italic">{children}</em>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-outside ml-4 space-y-1.5 mb-3 text-gray-300">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside ml-4 space-y-1.5 mb-3 text-gray-300">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed pl-1 marker:text-[#00F0FF]">
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-[#FF00C8] pl-3 py-1 my-2 text-gray-400 italic bg-white/[0.02] rounded-r-lg">
              {children}
            </blockquote>
          ),
          code: ({ children, inline }) =>
            inline ? (
              <code className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[11px] text-[#00F0FF]">
                {children}
              </code>
            ) : (
              <pre className="p-3 rounded-xl bg-black/60 border border-white/10 overflow-x-auto font-mono text-[11px] text-gray-200 my-2">
                <code>{children}</code>
              </pre>
            ),
        }}
      >
        {normalized}
      </ReactMarkdown>
    </div>
  );
};

export default ProRoomDescriptionRenderer;
