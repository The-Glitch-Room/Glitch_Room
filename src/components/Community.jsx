import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import Navbar from "./Navbar";
import Footer from "./Footer";
import PageHeading from "./PageHeading";
import GlitchBackground from "./GlitchBackground";
import Button from "./Button";
import {
  MessageSquare,
  Heart,
  Plus,
  X,
  Image,
  Code,
  ChevronRight,
  Search,
  Flame,
  Clock,
  TrendingUp,
  Tag,
  Filter,
  Bold,
  Italic,
  Heading,
  Quote,
  List,
  ListOrdered,
  Link,
  Eye,
  Edit3,
  MoreVertical,
  Trash2,
  Terminal,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useAuth } from "./AuthContext";
import { containsProfanity, PROFANITY_ERROR_MSG } from "../utils/profanityFilter";
import DeveloperConnectModal from "./DeveloperConnectModal";

// ── Purposeful Post Types (The Glitch Lounge MVP) ─────────────────────────────
export const POST_TYPES = [
  {
    id: "all",
    label: "All Discussions",
    emoji: "🌐",
    color: "#FFFFFF",
    description: "Everything happening in The Glitch Lounge",
  },
  {
    id: "need_help",
    label: "Need Help",
    emoji: "🐛",
    color: "#EF4444",
    legacy: ["glitch", "need_help"],
    description: "Bugs, blockers & debugging questions",
  },
  {
    id: "showcase",
    label: "Showcase",
    emoji: "🚀",
    color: "#00F0FF",
    legacy: ["showcase", "creative", "webdev"],
    description: "Projects, tools, demos & creative builds",
  },
  {
    id: "discussion",
    label: "Discussion",
    emoji: "💡",
    color: "#A855F7",
    legacy: ["discussion", "general", "offtopic"],
    description: "Architecture, frameworks & developer thoughts",
  },
  {
    id: "learning",
    label: "Learning",
    emoji: "📚",
    color: "#10B981",
    legacy: ["learning", "ai"],
    description: "Tutorials, cheat-sheets & technical insights",
  },
];

export const REACTIONS = [
  { id: "heart", label: "Love", emoji: "❤️" },
  { id: "fire", label: "Fire", emoji: "🔥" },
  { id: "clever", label: "Clever", emoji: "💡" },
  { id: "rocket", label: "Ship it", emoji: "🚀" },
];

export const getPostType = (category) => {
  const cat = (category || "").toLowerCase();
  for (const type of POST_TYPES) {
    if (type.id !== "all" && (type.id === cat || (type.legacy && type.legacy.includes(cat)))) {
      return type;
    }
  }
  return POST_TYPES[3]; // default to Discussion
};

// Legacy fallback helper for existing code referencing CATEGORIES
export const CATEGORIES = POST_TYPES;

const SORT_OPTIONS = [
  { id: "new", label: "Newest", icon: Clock },
  { id: "top", label: "Top", icon: TrendingUp },
  { id: "hot", label: "Hot", icon: Flame },
];

// -----------------------Markdown------------------------------------------------
const MarkdownBody = ({ content }) => (
  <ReactMarkdown
    components={{
      h1: ({ children }) => (
        <h1 className="text-2xl font-black text-white mb-3 mt-4">{children}</h1>
      ),
      h2: ({ children }) => (
        <h2 className="text-xl font-black text-white mb-2 mt-4">{children}</h2>
      ),
      h3: ({ children }) => (
        <h3 className="text-lg font-bold text-white mb-2 mt-3">{children}</h3>
      ),
      p: ({ children }) => (
        <p className="text-gray-300 text-sm leading-relaxed mb-3">{children}</p>
      ),
      strong: ({ children }) => (
        <strong className="text-white font-bold">{children}</strong>
      ),
      em: ({ children }) => (
        <em className="text-gray-300 italic">{children}</em>
      ),
      ul: ({ children }) => (
        <ul className="list-disc list-inside text-gray-300 text-sm space-y-1 mb-3 pl-2">
          {children}
        </ul>
      ),
      ol: ({ children }) => (
        <ol className="list-decimal list-inside text-gray-300 text-sm space-y-1 mb-3 pl-2">
          {children}
        </ol>
      ),
      li: ({ children }) => (
        <li className="text-gray-300 text-sm">{children}</li>
      ),
      blockquote: ({ children }) => (
        <blockquote className="border-l-2 border-[#FF00C8] pl-4 my-3 text-gray-400 italic text-sm">
          {children}
        </blockquote>
      ),
      code: ({ children, className }) => (
        <code
          className={
            className
              ? "font-mono"
              : "bg-white/8 text-[#00F0FF] text-xs px-1.5 py-0.5 rounded font-mono"
          }
        >
          {children}
        </code>
      ),
      pre: ({ children }) => {
        // Fenced code blocks always arrive as <pre><code>...</code></pre> —
        // intercepting here (rather than relying on a since-removed
        // `inline` prop on `code`) is the reliable way to tell a fenced
        // block apart from genuine inline code with modern react-markdown.
        const codeEl = Array.isArray(children) ? children[0] : children;
        const codeClassName = codeEl?.props?.className || "";
        const match = /language-(\w+)/.exec(codeClassName);
        const language = match ? match[1] : "text";
        const codeString = String(codeEl?.props?.children ?? "").replace(/\n$/, "");
        return (
          <div className="my-3 rounded-xl overflow-hidden border border-white/8 bg-[#080810]">
            <div className="flex items-center justify-between px-4 py-2 bg-white/[0.03] border-b border-white/8">
              <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500">
                {language}
              </span>
            </div>
            <SyntaxHighlighter
              language={language}
              style={oneDark}
              customStyle={{
                margin: 0,
                background: "transparent",
                padding: "1rem",
                fontSize: "0.75rem",
              }}
              wrapLongLines
            >
              {codeString}
            </SyntaxHighlighter>
          </div>
        );
      },
      hr: () => <hr className="border-white/8 my-4" />,
      a: ({ href, children }) => (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="text-[#00F0FF] underline hover:text-[#00F0FF]/80 transition"
        >
          {children}
        </a>
      ),
    }}
  >
    {content}
  </ReactMarkdown>
);

// ── Create Post Modal ─────────────────────────────────────────────────────────
const CreatePostModal = ({ onClose, onCreated, user }) => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("general");
  const [imageUrl, setImageUrl] = useState("");
  const [mode, setMode] = useState("text"); // text | code | image
  const [isPreview, setIsPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const insertMarkdown = (prefix, suffix = "") => {
    const textarea = document.getElementById("create-post-body-textarea");
    if (!textarea) {
      setBody((prev) => prev + prefix + suffix);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = body.substring(start, end);
    const replacement = prefix + (selectedText || "text") + suffix;
    const newBody = body.substring(0, start) + replacement + body.substring(end);
    setBody(newBody);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selectedText.length || 4)
      );
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please add a title to your post.");
      return;
    }

    if (containsProfanity(title) || containsProfanity(body)) {
      setError(PROFANITY_ERROR_MSG);
      return;
    }

    setSubmitting(true);
    setError("");

    const postData = {
      user_id: user?.id,
      title: title.trim(),
      category,
      body: mode === "text" ? body.trim() : null,
      code: mode === "code" ? body.trim() : null,
      image_url: mode === "image" ? imageUrl.trim() : null,
      likes: 0,
    };

    const { error: err } = await supabase
      .from("community_posts")
      .insert([postData]);

    setSubmitting(false);

    if (err) {
      setError("Failed to create post. Please try again.");
      console.error(err);
    } else {
      onCreated();
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto py-6 sm:py-10"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-3xl sm:max-w-4xl bg-[#0c0c14] border border-white/10 rounded-3xl shadow-2xl my-auto overflow-hidden"
      >
        {/* Top glow bar */}
        <div className="h-[2px] w-full bg-gradient-to-r from-[#FF00C8] via-purple-500 to-[#00F0FF]" />

        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-black text-white">Create a Post</h2>
              <p className="text-gray-400 text-xs mt-0.5">
                Share with the community
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="flex gap-2 mb-5 p-1 bg-white/[0.03] border border-white/6 rounded-2xl">
            {[
              { id: "text", label: "Text Post", icon: MessageSquare },
              { id: "code", label: "Code Snippet", icon: Code },
              { id: "image", label: "Image URL", icon: Image },
            ].map((m) => {
              const Icon = m.icon;
              const active = mode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    active
                      ? "bg-white/10 text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  <Icon size={14} />
                  {m.label}
                </button>
              );
            })}
          </div>

          {/* Post Type Selector */}
          <div className="mb-5">
            <label className="text-gray-400 text-xs font-mono mb-2 block uppercase tracking-wider">
              Post Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {POST_TYPES.filter((c) => c.id !== "all").map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex flex-col items-start p-3 rounded-2xl text-left border transition cursor-pointer ${
                      isSelected
                        ? "shadow-lg"
                        : "border-white/8 bg-white/[0.02] text-gray-400 hover:border-white/20 hover:text-white"
                    }`}
                    style={
                      isSelected
                        ? {
                            borderColor: `${cat.color}70`,
                            backgroundColor: `${cat.color}15`,
                            boxShadow: `0 0 15px ${cat.color}18`,
                          }
                        : {}
                    }
                  >
                    <div
                      className="flex items-center gap-1.5 font-bold text-xs"
                      style={{ color: isSelected ? cat.color : "#d1d5db" }}
                    >
                      <span className="text-sm">{cat.emoji}</span>
                      <span>{cat.label}</span>
                    </div>
                    <span className="text-[10px] text-gray-500 line-clamp-1 mt-1 font-mono">
                      {cat.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Post Title..."
            className="w-full bg-white/[0.03] border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#FF00C8]/40 transition mb-4 font-semibold"
          />

          {/* Dynamic Content Input */}
          {mode === "text" && (
            <div className="mb-3 bg-white/[0.02] border border-white/8 rounded-2xl p-1.5 flex items-center justify-between gap-1 flex-wrap font-mono text-xs">
              <div className="flex items-center gap-0.5 flex-wrap">
                <button
                  type="button"
                  title="Bold (**text**)"
                  onClick={() => insertMarkdown("**", "**")}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                >
                  <Bold size={14} />
                </button>

                <button
                  type="button"
                  title="Italic (*text*)"
                  onClick={() => insertMarkdown("*", "*")}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                >
                  <Italic size={14} />
                </button>

                <button
                  type="button"
                  title="Heading (### Title)"
                  onClick={() => insertMarkdown("### ")}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                >
                  <Heading size={14} />
                </button>

                <button
                  type="button"
                  title="Inline Code (`code`)"
                  onClick={() => insertMarkdown("`", "`")}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-white/10 transition cursor-pointer"
                >
                  <Code size={14} />
                </button>
                <button
                  type="button"
                  title="Code Block (```lang)"
                  onClick={() => insertMarkdown("```js\n", "\n```")}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-white/10 transition cursor-pointer"
                >
                  <Terminal size={14} />
                </button>

                <button
                  type="button"
                  title="Link ([title](url))"
                  onClick={() => insertMarkdown("[", "](https://)")}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                >
                  <Link size={14} />
                </button>

                <button
                  type="button"
                  title="Quote (> quote)"
                  onClick={() => insertMarkdown("> ")}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                >
                  <Quote size={14} />
                </button>

                <button
                  type="button"
                  title="Bullet List (- item)"
                  onClick={() => insertMarkdown("- ")}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                >
                  <List size={14} />
                </button>

                <button
                  type="button"
                  title="Numbered List (1. item)"
                  onClick={() => insertMarkdown("1. ")}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                >
                  <ListOrdered size={14} />
                </button>
              </div>

              {/* Write vs Preview Toggle */}
              <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-xl border border-white/6">
                <button
                  type="button"
                  onClick={() => isPreview && setIsPreview(false)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                    !isPreview
                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Edit3 size={12} />
                  <span>Write</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPreview(true)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                    isPreview
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Eye size={12} />
                  <span>Preview</span>
                </button>
              </div>
            </div>
          )}

          {mode === "image" ? (
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.png"
              className="w-full bg-white/[0.03] border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#00F0FF]/40 transition mb-4 font-mono text-xs"
            />
          ) : mode === "code" ? (
            <textarea
              id="create-post-body-textarea"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="// Paste your code snippet here..."
              rows={6}
              className="w-full bg-black/50 border border-white/8 rounded-xl px-4 py-3 text-green-300 text-xs focus:outline-none focus:border-[#00F0FF]/40 transition mb-4 font-mono resize-none"
            />
          ) : isPreview ? (
            <div className="w-full bg-[#05050b] border border-white/10 rounded-xl p-5 min-h-[160px] mb-4 font-sans text-sm">
              {body.trim() ? (
                <MarkdownBody content={body} />
              ) : (
                <span className="text-gray-600 italic text-xs font-mono">
                  Nothing to preview yet. Write some markdown above!
                </span>
              )}
            </div>
          ) : (
            <textarea
              id="create-post-body-textarea"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your post content... (Markdown supported)"
              rows={5}
              className="w-full bg-white/[0.03] border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#FF00C8]/40 transition mb-4 resize-none"
            />
          )}

          {error && (
            <p className="text-red-400 text-xs font-mono mb-4 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-white/5 text-gray-400 text-xs font-semibold hover:bg-white/10 transition cursor-pointer"
            >
              Cancel
            </button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#FF00C8] to-purple-600 text-white text-sm font-bold disabled:opacity-50 cursor-pointer"
            >
              {submitting ? "Posting..." : "Post it ✦"}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};


// ── Delete Confirmation Modal ─────────────────────────────────────────────────
const DeleteConfirmModal = ({ onClose, onConfirm, deleting }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
    onClick={(e) => e.target === e.currentTarget && onClose()}
  >
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-[#0c0c14] border border-white/10 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl overflow-hidden relative"
    >
      <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto mb-4">
        <Trash2 size={22} />
      </div>
      <h3 className="text-lg font-black text-white mb-2">Delete Post?</h3>
      <p className="text-gray-400 text-xs mb-6 leading-relaxed">
        Are you sure you want to permanently delete this post? This action cannot be undone.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={deleting}
          className="flex-1 py-2.5 rounded-xl bg-white/5 text-gray-400 text-xs font-semibold hover:bg-white/10 transition cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={deleting}
          className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs font-bold disabled:opacity-50 transition cursor-pointer shadow-lg shadow-red-500/20"
        >
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </motion.div>
  </motion.div>
);

// ── Edit Post Modal ───────────────────────────────────────────────────────────
const EditPostModal = ({ post, onClose, onUpdated }) => {
  const [title, setTitle] = useState(post.title || "");
  const [body, setBody] = useState(post.body || post.code || "");
  const [category, setCategory] = useState(post.category || "general");
  const [imageUrl, setImageUrl] = useState(post.image_url || "");
  const [mode, setMode] = useState(post.code ? "code" : post.image_url ? "image" : "text");
  const [isPreview, setIsPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const insertMarkdown = (prefix, suffix = "") => {
    const textarea = document.getElementById("edit-post-body-textarea");
    if (!textarea) {
      setBody((prev) => prev + prefix + suffix);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = body.substring(start, end);
    const replacement = prefix + (selectedText || "text") + suffix;
    const newBody = body.substring(0, start) + replacement + body.substring(end);
    setBody(newBody);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selectedText.length || 4)
      );
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please add a title to your post.");
      return;
    }

    if (containsProfanity(title) || containsProfanity(body)) {
      setError(PROFANITY_ERROR_MSG);
      return;
    }

    setSubmitting(true);
    setError("");

    const updateData = {
      title: title.trim(),
      category,
      body: mode === "text" ? body.trim() : null,
      code: mode === "code" ? body.trim() : null,
      image_url: mode === "image" ? imageUrl.trim() : null,
    };

    const { error: err } = await supabase
      .from("community_posts")
      .update(updateData)
      .eq("id", post.id);

    setSubmitting(false);

    if (err) {
      setError("Failed to update post. Please try again.");
      console.error(err);
    } else {
      onUpdated();
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto py-6 sm:py-10"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-3xl sm:max-w-4xl bg-[#0c0c14] border border-white/10 rounded-3xl shadow-2xl my-auto overflow-hidden"
      >
        <div className="h-[2px] w-full bg-gradient-to-r from-[#FF00C8] via-purple-500 to-[#00F0FF]" />

        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-black text-white">Edit Post</h2>
              <p className="text-gray-400 text-xs mt-0.5">Update your post details</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex gap-2 mb-5 p-1 bg-white/[0.03] border border-white/6 rounded-2xl">
            {[
              { id: "text", label: "Text Post", icon: MessageSquare },
              { id: "code", label: "Code Snippet", icon: Code },
              { id: "image", label: "Image URL", icon: Image },
            ].map((m) => {
              const Icon = m.icon;
              const active = mode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    active
                      ? "bg-white/10 text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  <Icon size={14} />
                  {m.label}
                </button>
              );
            })}
          </div>

          {/* Post Type Selector */}
          <div className="mb-5">
            <label className="text-gray-400 text-xs font-mono mb-2 block uppercase tracking-wider">
              Post Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {POST_TYPES.filter((c) => c.id !== "all").map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex flex-col items-start p-3 rounded-2xl text-left border transition cursor-pointer ${
                      isSelected
                        ? "shadow-lg"
                        : "border-white/8 bg-white/[0.02] text-gray-400 hover:border-white/20 hover:text-white"
                    }`}
                    style={
                      isSelected
                        ? {
                            borderColor: `${cat.color}70`,
                            backgroundColor: `${cat.color}15`,
                            boxShadow: `0 0 15px ${cat.color}18`,
                          }
                        : {}
                    }
                  >
                    <div
                      className="flex items-center gap-1.5 font-bold text-xs"
                      style={{ color: isSelected ? cat.color : "#d1d5db" }}
                    >
                      <span className="text-sm">{cat.emoji}</span>
                      <span>{cat.label}</span>
                    </div>
                    <span className="text-[10px] text-gray-500 line-clamp-1 mt-1 font-mono">
                      {cat.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Post Title..."
            className="w-full bg-white/[0.03] border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#FF00C8]/40 transition mb-4 font-semibold"
          />

          {mode === "text" && (
            <div className="mb-3 bg-white/[0.02] border border-white/8 rounded-2xl p-1.5 flex items-center justify-between gap-1 flex-wrap font-mono text-xs">
              <div className="flex items-center gap-0.5 flex-wrap">
                <button
                  type="button"
                  title="Bold (**text**)"
                  onClick={() => insertMarkdown("**", "**")}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                >
                  <Bold size={14} />
                </button>
                <button
                  type="button"
                  title="Italic (*text*)"
                  onClick={() => insertMarkdown("*", "*")}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                >
                  <Italic size={14} />
                </button>
                <button
                  type="button"
                  title="Heading (### Title)"
                  onClick={() => insertMarkdown("### ")}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                >
                  <Heading size={14} />
                </button>
                <button
                  type="button"
                  title="Inline Code (`code`)"
                  onClick={() => insertMarkdown("`", "`")}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-white/10 transition cursor-pointer"
                >
                  <Code size={14} />
                </button>
                <button
                  type="button"
                  title="Code Block (```lang)"
                  onClick={() => insertMarkdown("```js\n", "\n```")}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-white/10 transition cursor-pointer"
                >
                  <Terminal size={14} />
                </button>
                <button
                  type="button"
                  title="Link ([title](url))"
                  onClick={() => insertMarkdown("[", "](https://)")}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                >
                  <Link size={14} />
                </button>
                <button
                  type="button"
                  title="Quote (> quote)"
                  onClick={() => insertMarkdown("> ")}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                >
                  <Quote size={14} />
                </button>
                <button
                  type="button"
                  title="Bullet List (- item)"
                  onClick={() => insertMarkdown("- ")}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                >
                  <List size={14} />
                </button>
                <button
                  type="button"
                  title="Numbered List (1. item)"
                  onClick={() => insertMarkdown("1. ")}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                >
                  <ListOrdered size={14} />
                </button>
              </div>

              <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-xl border border-white/6">
                <button
                  type="button"
                  onClick={() => isPreview && setIsPreview(false)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                    !isPreview
                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Edit3 size={12} />
                  <span>Write</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPreview(true)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                    isPreview
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Eye size={12} />
                  <span>Preview</span>
                </button>
              </div>
            </div>
          )}

          {mode === "image" ? (
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.png"
              className="w-full bg-white/[0.03] border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#00F0FF]/40 transition mb-4 font-mono text-xs"
            />
          ) : mode === "code" ? (
            <textarea
              id="edit-post-body-textarea"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="// Paste your code snippet here..."
              rows={6}
              className="w-full bg-black/50 border border-white/8 rounded-xl px-4 py-3 text-green-300 text-xs focus:outline-none focus:border-[#00F0FF]/40 transition mb-4 font-mono resize-none"
            />
          ) : isPreview ? (
            <div className="w-full bg-[#05050b] border border-white/10 rounded-xl p-5 min-h-[160px] mb-4 font-sans text-sm">
              {body.trim() ? (
                <MarkdownBody content={body} />
              ) : (
                <span className="text-gray-600 italic text-xs font-mono">
                  Nothing to preview yet.
                </span>
              )}
            </div>
          ) : (
            <textarea
              id="edit-post-body-textarea"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your post content..."
              rows={5}
              className="w-full bg-white/[0.03] border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#FF00C8]/40 transition mb-4 resize-none"
            />
          )}

          {error && (
            <p className="text-red-400 text-xs font-mono mb-4 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-white/5 text-gray-400 text-xs font-semibold hover:bg-white/10 transition cursor-pointer"
            >
              Cancel
            </button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#FF00C8] to-purple-600 text-white text-sm font-bold disabled:opacity-50 cursor-pointer"
            >
              {submitting ? "Saving..." : "Save Changes ✦"}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ── Post Card ─────────────────────────────────────────────────────────────────
const PostCard = ({
  post,
  onReaction,
  userReaction,
  onClick,
  onAuthorClick,
  user,
  onEdit,
  onDelete,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const type = getPostType(post.category);

  const timeAgo = (iso) => {
    if (!iso) return "just now";
    const diff = (Date.now() - new Date(iso)) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const authorName = post.username || "Anonymous";
  const authorInitials = authorName.replace(/^@/, "").slice(0, 2).toUpperCase() || "GL";

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.18 }}
      className="group relative bg-[#0d0d16] border border-white/10 hover:border-white/20 rounded-2xl p-5 sm:p-6 cursor-pointer transition-all shadow-xl hover:shadow-cyan-950/20 overflow-hidden flex flex-col justify-between"
      onClick={() => onClick(post)}
    >
      {/* Type Accent Top Highlight Line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] opacity-70 group-hover:opacity-100 transition-opacity"
        style={{
          background: `linear-gradient(90deg, transparent, ${type.color}, transparent)`,
        }}
      />

      <div>
        {/* Top Bar: Author capsule & Post Type pill & Menu */}
        <div className="flex items-center justify-between gap-3 mb-3">
          {/* Author Capsule (Click to open DeveloperConnectModal) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAuthorClick(post.authorProfile || post);
            }}
            className="flex items-center gap-2.5 min-w-0 text-left group/author hover:opacity-90 transition cursor-pointer p-1 -m-1 rounded-xl hover:bg-white/[0.04]"
            title="Click to view developer profile & socials"
          >
            <div className="w-8 h-8 rounded-xl overflow-hidden shrink-0 ring-1 ring-white/15 bg-[#121220] flex items-center justify-center">
              {post.avatar_url ? (
                <img
                  src={post.avatar_url}
                  alt={authorName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-xs font-black text-white"
                  style={{
                    background: `linear-gradient(135deg, ${type.color}40, #00F0FF40)`,
                  }}
                >
                  {authorInitials}
                </div>
              )}
            </div>
            <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
              <span className="text-white text-xs font-bold truncate group-hover/author:text-[#00F0FF] transition">
                {authorName}
              </span>
              <span className="text-gray-500 text-[10px] font-mono">• {timeAgo(post.created_at)}</span>
            </div>
          </button>

          <div className="flex items-center gap-2 shrink-0">
            {/* Purposeful Post Type Badge */}
            <span
              className="flex items-center gap-1 text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full border shadow-sm"
              style={{
                color: type.color,
                borderColor: `${type.color}35`,
                backgroundColor: `${type.color}10`,
              }}
            >
              <span>{type.emoji}</span>
              <span>{type.label}</span>
            </span>

            {/* Author Menu */}
            {user?.id === post.user_id && (
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen((prev) => !prev);
                  }}
                  className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                >
                  <MoreVertical size={15} />
                </button>

                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -4 }}
                      className="absolute right-0 top-full mt-1 w-32 bg-[#0c0c14] border border-white/10 rounded-xl shadow-2xl py-1 z-30 overflow-hidden font-sans text-xs"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onEdit(post);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-white/10 transition text-left cursor-pointer"
                      >
                        <Edit3 size={13} className="text-purple-400" />
                        <span>Edit Post</span>
                      </button>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          onDelete(post);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition text-left cursor-pointer"
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-white font-bold text-base sm:text-lg leading-snug mb-2 group-hover:text-[#00F0FF] transition-colors">
          {post.title}
        </h3>

        {/* Excerpt / Markdown */}
        {post.body && (
          <div className="line-clamp-2 text-gray-400 text-xs sm:text-sm leading-relaxed mb-3">
            <MarkdownBody content={post.body} />
          </div>
        )}

        {/* Code Snippet preview */}
        {post.code && (
          <div className="bg-[#080810] border border-white/8 rounded-xl p-3 my-2.5 overflow-hidden">
            <pre className="text-green-400 text-xs font-mono line-clamp-3">
              {post.code}
            </pre>
          </div>
        )}

        {/* Image Attachment Preview */}
        {post.image_url && (
          <div className="rounded-xl overflow-hidden mb-3 border border-white/8 max-h-48">
            <img
              src={post.image_url}
              alt="post attachment"
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      {/* Discussion & Reaction Footer Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3.5 border-t border-white/5 mt-3 text-xs">
        {/* Multi-Reaction Bar (❤️, 🔥, 💡, 🚀) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {REACTIONS.map((r) => {
            const isActive = userReaction === r.id;
            return (
              <motion.button
                key={r.id}
                whileTap={{ scale: 0.85 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onReaction(post, r.id);
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                  isActive
                    ? "bg-[#00F0FF]/15 border-[#00F0FF]/40 text-cyan-300 shadow-sm shadow-cyan-500/20"
                    : "bg-white/[0.03] border-white/8 text-gray-400 hover:text-white hover:border-white/20"
                }`}
                title={`React with ${r.label}`}
              >
                <span className="text-xs">{r.emoji}</span>
              </motion.button>
            );
          })}

          <span className="text-gray-500 text-[11px] font-mono ml-1 font-semibold">
            {post.likes || 0}
          </span>
        </div>

        {/* Discussion comments count & Join Discussion CTA */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-gray-400 font-medium">
            <MessageSquare size={13} className="text-gray-500 group-hover:text-purple-400 transition" />
            <span>
              {post.comment_count || 0} {post.comment_count === 1 ? "reply" : "replies"}
            </span>
          </div>

          <span className="text-[11px] font-semibold text-[#00F0FF] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
            Discuss <ChevronRight size={13} />
          </span>
        </div>
      </div>
    </motion.article>
  );
};

// ── Main Page Component ───────────────────────────────────────────────────────
const Community = () => {
  const navigate = useNavigate();
  const { user: ctxUser } = useAuth() || {};
  const [user, setUser] = useState(null);
  const activeUser = user || ctxUser;
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("new");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [deletingPost, setDeletingPost] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedDev, setSelectedDev] = useState(null);
  const [authorFilter, setAuthorFilter] = useState(null);
  const [userReactions, setUserReactions] = useState({});

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("glitch_community_reactions") || "{}");
      setUserReactions(stored);
    } catch {
      setUserReactions({});
    }
  }, []);

  const handleConfirmDelete = async () => {
    if (!deletingPost) return;
    setDeleting(true);
    const { error: err } = await supabase
      .from("community_posts")
      .delete()
      .eq("id", deletingPost.id);

    setDeleting(false);
    if (err) {
      console.error("Error deleting post:", err);
    } else {
      setDeletingPost(null);
      fetchPosts();
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUser(session.user);
    });
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setUser(data.user);
    });
  }, []);

  const fetchPosts = async () => {
    setLoading(true);

    // 1. Fetch base community posts safely
    let query = supabase.from("community_posts").select("*");

    // Post Type filtering with legacy compatibility
    if (category !== "all") {
      const activeType = POST_TYPES.find((t) => t.id === category);
      if (activeType?.legacy && activeType.legacy.length > 0) {
        query = query.in("category", activeType.legacy);
      } else {
        query = query.eq("category", category);
      }
    }

    if (sort === "new") query = query.order("created_at", { ascending: false });
    else if (sort === "top") query = query.order("likes", { ascending: false });
    else query = query.order("created_at", { ascending: false });

    const { data: rawPosts, error: postsErr } = await query;
    if (postsErr) {
      console.error("Error fetching community posts:", postsErr);
      setPosts([]);
      setLoading(false);
      return;
    }

    // Filter out standup check-ins & room categories
    let results = (rawPosts || []).filter((p) => {
      const cat = (p.category || "").toLowerCase();
      const title = (p.title || "").toLowerCase();
      const isRoomCategory = cat.startsWith("room_");
      const isStandupTitle = title.includes("daily standup");
      return !isRoomCategory && !isStandupTitle;
    });

    // 2. Client-side search filter
    if (search.trim()) {
      results = results.filter(
        (p) =>
          p.title?.toLowerCase().includes(search.toLowerCase()) ||
          p.body?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // 3. Batch fetch comment counts and user profiles safely to prevent PGRST200
    const postIds = results.map((p) => p.id);
    const userIds = Array.from(new Set(results.map((p) => p.user_id))).filter(Boolean);

    let commentCountsMap = {};
    if (postIds.length > 0) {
      const { data: comments } = await supabase
        .from("community_comments")
        .select("post_id");

      (comments || []).forEach((c) => {
        commentCountsMap[c.post_id] = (commentCountsMap[c.post_id] || 0) + 1;
      });
    }

    let profilesMap = {};
    if (userIds.length > 0) {
      const { data: profs, error: profErr } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, bio, github_url, twitter_url, discord_url, linkedin_url")
        .in("id", userIds);

      if (profErr) console.error("profiles fetch error:", profErr);

      (profs || []).forEach((p) => {
        profilesMap[p.id] = p;
      });
    }

    // Enrich posts with dynamic profile info, social links & comment count
    results = results.map((p) => {
      const prof = profilesMap[p.user_id];
      return {
        ...p,
        username: prof?.username || prof?.full_name || p.username || "Anonymous",
        avatar_url: prof?.avatar_url || p.avatar_url || null,
        comment_count: commentCountsMap[p.id] || 0,
        authorProfile: prof || null,
      };
    });

    // 4. Author filter (if developer profile clicked "View all posts")
    if (authorFilter) {
      const cleanFilter = authorFilter.toLowerCase().replace(/^@/, "");
      results = results.filter((p) => {
        const u = (p.username || "").toLowerCase().replace(/^@/, "");
        return u === cleanFilter;
      });
    }

    setPosts(results);
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, [category, sort, authorFilter]);

  const handleSearch = (e) => {
    if (e.key === "Enter") fetchPosts();
  };

  const handleReaction = async (post, reactionId) => {
    if (!activeUser) {
      navigate("/");
      return;
    }

    const currentReaction = userReactions[post.id];
    const isRemoving = currentReaction === reactionId;
    const isChanging = currentReaction && currentReaction !== reactionId;

    let delta = 0;
    const newReactions = { ...userReactions };

    if (isRemoving) {
      delete newReactions[post.id];
      delta = -1;
    } else if (isChanging) {
      newReactions[post.id] = reactionId;
      delta = 0;
    } else {
      newReactions[post.id] = reactionId;
      delta = 1;
    }

    setUserReactions(newReactions);
    try {
      localStorage.setItem("glitch_community_reactions", JSON.stringify(newReactions));
    } catch (e) {
      console.warn("Could not save reaction to localStorage", e);
    }

    if (delta !== 0) {
      const newCount = Math.max(0, (post.likes || 0) + delta);
      await supabase
        .from("community_posts")
        .update({ likes: newCount })
        .eq("id", post.id);

      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, likes: newCount } : p))
      );
    }
  };

  return (
    <div className="relative min-h-screen bg-[#070709] text-white flex flex-col justify-between selection:bg-[#00F0FF]/20 overflow-hidden font-sans">
      {/* Dynamic Moving Glitch Background Particles */}
      <GlitchBackground />

      {/* Smooth Seamless Top Cyber Grid with Vertical Fade Gradient */}
      <div
        className="absolute top-0 left-0 right-0 h-[1100px] z-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(0,240,255,0.25) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0,240,255,0.25) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
          maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0) 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0) 100%)",
        }}
      />

      {/* Ambient Cyan Radial Glow with Smooth Radial Falloff */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[750px] rounded-full blur-3xl opacity-20 pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 25%, rgba(0, 240, 255, 0.25) 0%, rgba(0, 240, 255, 0.08) 50%, transparent 80%)",
        }}
      />

      <div className="relative z-10 flex flex-col flex-1">
        <Navbar />

        {/* HERO HEADER SECTION */}
        <section className="relative pt-36 md:pt-44 pb-12 px-6 mb-8 md:mb-16 text-center">
          <div className="max-w-4xl mx-auto">
            <PageHeading
              eyebrow="COMMUNITY FEED"
              title="The Glitch Lounge"
              subtitle="Discuss challenges, showcase builds, ask for help, and learn together with fellow developers."
              align="center"
              accent="cyan"
              size="xl"
            />
          </div>
        </section>

        {/* MAIN CONTENT AREA */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 space-y-16 pb-20 flex-1 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start"
          >
            {/* LEFT SIDEBAR: Purposeful Post Types & Search */}
            <div className="lg:col-span-1 space-y-6">
              {/* Post Types Box */}
              <div className="bg-[#0f0f18] border border-white/10 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3 sm:space-y-4">
                <h3 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 pb-2.5 sm:pb-3 border-b border-white/10">
                  <Tag size={14} className="text-[#00F0FF]" />
                  <span>Discussion Types</span>
                </h3>

                <motion.div 
                    drag="x"
                    dragConstraints={{ left: -250, right: 0 }}
                    dragElastic={0.1}
                    className="flex lg:flex-col gap-2 lg:gap-0 overflow-x-auto no-scrollbar pb-1 lg:pb-0 lg:space-y-1.5 cursor-grab active:cursor-grabbing"
                  >
                  {POST_TYPES.map((cat) => {
                    const active = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setCategory(cat.id);
                          if (authorFilter) setAuthorFilter(null);
                        }}
                        className={`shrink-0 lg:w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer border whitespace-nowrap ${
                          active
                            ? "bg-white/10 text-white border-white/20 shadow-sm"
                            : "bg-transparent text-gray-400 border-transparent hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{cat.emoji}</span>
                          <span>{cat.label}</span>
                        </div>
                        {active && (
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: cat.color }}
                          />
                        )}
                      </button>
                    );
                  })}
                </motion.div>
              </div>

              {/* Search Box */}
              <div className="bg-[#0f0f18] border border-white/10 rounded-2xl p-5 shadow-xl space-y-3">
                <h3 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-white/10">
                  <Search size={14} className="text-[#00F0FF]" />
                  <span>Search Lounge</span>
                </h3>
                <div className="relative">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={handleSearch}
                    placeholder="Search posts or code..."
                    className="w-full bg-[#07070d] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#00F0FF]/50 transition font-sans"
                  />
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Posts Feed & Feed Controls */}
            <div className="lg:col-span-3 space-y-6">
              {/* Top Feed Bar: Sort Pills + Create Post CTA */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0f0f18] border border-white/10 rounded-2xl p-4 shadow-xl">
                {/* Sort Options */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-gray-500 mr-1">
                    Sort:
                  </span>
                  {SORT_OPTIONS.map((s) => {
                    const Icon = s.icon;
                    const active = sort === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setSort(s.id)}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                          active
                            ? "bg-white/10 text-white border-white/20 shadow-sm"
                            : "bg-transparent text-gray-400 border-transparent hover:text-white"
                        }`}
                      >
                        <Icon size={13} />
                        <span>{s.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Create Post Button */}
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    if (!user) navigate("/");
                    else setShowCreate(true);
                  }}
                  className="px-5 py-2.5 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#FF00C8]/20 cursor-pointer shrink-0"
                  style={{
                    background: "linear-gradient(90deg, #FF00C8, #a855f7)",
                  }}
                >
                  <Plus size={15} />
                  <span>Start Discussion</span>
                </motion.button>
              </div>

              {/* Active Author Filter Pill */}
              {authorFilter && (
                <div className="flex items-center justify-between bg-cyan-950/30 border border-cyan-500/30 rounded-2xl px-4 py-2.5 text-xs">
                  <div className="flex items-center gap-2 text-cyan-300">
                    <span>
                      Filtering discussions by <strong className="text-white">@{authorFilter.replace(/^@/, "")}</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAuthorFilter(null)}
                    className="flex items-center gap-1 text-gray-400 hover:text-white px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition cursor-pointer"
                  >
                    <X size={12} />
                    <span>Clear Filter</span>
                  </button>
                </div>
              )}

              {/* Discussion Stream */}
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className="bg-[#0f0f18] border border-white/5 rounded-2xl p-6 h-36 animate-pulse"
                    />
                  ))}
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-20 bg-[#0f0f18] border border-white/10 rounded-3xl p-8">
                  <p className="text-4xl mb-3">💬</p>
                  <p className="text-white font-bold text-base mb-1">
                    No discussions found
                  </p>
                  <p className="text-gray-400 text-xs mb-6">
                    {authorFilter
                      ? `No posts found from @${authorFilter.replace(/^@/, "")}.`
                      : "Be the first to share something in this topic!"}
                  </p>
                  {authorFilter && (
                    <button
                      onClick={() => setAuthorFilter(null)}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition cursor-pointer mr-2"
                    >
                      Clear Filter
                    </button>
                  )}
                  {user && (
                    <button
                      onClick={() => setShowCreate(true)}
                      className="px-5 py-2.5 rounded-xl bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-bold hover:bg-purple-600/40 transition cursor-pointer"
                    >
                      Start Discussion
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onReaction={handleReaction}
                      userReaction={userReactions[post.id]}
                      onClick={(p) => navigate(`/community/${p.id}`)}
                      onAuthorClick={(dev) => setSelectedDev(dev)}
                      user={activeUser}
                      onEdit={setEditingPost}
                      onDelete={setDeletingPost}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </main>

        <Footer />
      </div>

      <AnimatePresence>
        {showCreate && (
          <CreatePostModal
            onClose={() => setShowCreate(false)}
            onCreated={fetchPosts}
            user={activeUser}
          />
        )}
        {editingPost && (
          <EditPostModal
            post={editingPost}
            onClose={() => setEditingPost(null)}
            onUpdated={fetchPosts}
          />
        )}
        {deletingPost && (
          <DeleteConfirmModal
            deleting={deleting}
            onClose={() => setDeletingPost(null)}
            onConfirm={handleConfirmDelete}
          />
        )}
      </AnimatePresence>

      {/* Developer Connect & Profile Discovery Modal */}
      <DeveloperConnectModal
        developer={selectedDev}
        isOpen={Boolean(selectedDev)}
        onClose={() => setSelectedDev(null)}
        currentUser={activeUser}
        onFilterByAuthor={(authorUsername) => {
          setAuthorFilter(authorUsername);
          setSelectedDev(null);
        }}
      />
    </div>
  );
};

export default Community;