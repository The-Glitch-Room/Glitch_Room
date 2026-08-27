import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import Navbar from "./Navbar";
import Footer from "./Footer";
import {
  Heart,
  MessageSquare,
  ArrowLeft,
  Send,
  Code,
  ChevronDown,
  Terminal,
  Edit3,
  Trash2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useAuth } from "./AuthContext";
import { containsProfanity, PROFANITY_ERROR_MSG } from "../utils/profanityFilter";
import { Bold, Italic, Heading, Quote, List, ListOrdered, Link, Eye, X } from "lucide-react";

const CATEGORIES = [
  { id: "general", label: "General", color: "#00F0FF", emoji: "💬" },
  { id: "glitch", label: "Glitch Help", color: "#FF00C8", emoji: "⚡" },
  { id: "ai", label: "AI & ML", color: "#a855f7", emoji: "🤖" },
  { id: "webdev", label: "Web Dev", color: "#10b981", emoji: "🌐" },
  { id: "creative", label: "Creative", color: "#f59e0b", emoji: "🎨" },
  { id: "offtopic", label: "Off-Topic", color: "#6b7280", emoji: "😂" },
];

const timeAgo = (iso) => {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

// ── Markdown Renderer ─────────────────────────────────────────────────────────
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
          className="text-[#00F0FF] hover:underline text-sm"
        >
          {children}
        </a>
      ),
    }}
  >
    {content}
  </ReactMarkdown>
);

// ── Comment Component ─────────────────────────────────────────────────────────
const Comment = ({ comment, onReply, user }) => {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const [replyError, setReplyError] = useState("");

  const handleReply = async () => {
    if (!replyText.trim() || !user) return;
    if (containsProfanity(replyText)) {
      setReplyError(PROFANITY_ERROR_MSG);
      return;
    }
    setReplyError("");
    setSubmitting(true);
    const { data: profileData } = await supabase
      .from("profiles")
      .select("username, full_name, avatar_url")
      .eq("id", user.id)
      .single();
    await supabase.from("community_comments").insert({
      post_id: comment.post_id,
      parent_id: comment.id,
      user_id: user.id,
      username:
        profileData?.username ||
        profileData?.full_name ||
        user.email?.split("@")[0],
      avatar_url: profileData?.avatar_url || null,
      body: replyText.trim(),
      likes: 0,
      created_at: new Date().toISOString(),
    });
    setReplyText("");
    setShowReply(false);
    setSubmitting(false);
    onReply();
  };

  const replies = comment.replies || [];

  return (
    <div className="group">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-xl overflow-hidden shrink-0 ring-1 ring-white/8 mt-0.5">
          {comment.avatar_url ? (
            <img
              src={comment.avatar_url}
              alt={comment.username}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#FF00C8]/40 to-[#00F0FF]/40 flex items-center justify-center text-xs font-black text-white">
              {comment.username?.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Bubble */}
          <div className="bg-[#0f0f13] border border-white/5 rounded-2xl rounded-tl-sm px-4 py-3 mb-1">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-white text-xs font-bold">
                {comment.username}
              </span>
              <span className="text-gray-600 text-[10px]">
                {timeAgo(comment.created_at)}
              </span>
            </div>
            {comment.code ? (
              <div className="bg-[#080810] border border-white/5 rounded-lg px-3 py-2 my-2">
                <pre className="text-green-300 text-xs font-mono whitespace-pre-wrap">
                  {comment.code}
                </pre>
              </div>
            ) : (
              <div className="text-sm">
                <MarkdownBody content={comment.body || ""} />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 px-1 mb-2">
            {user && (
              <button
                onClick={() => setShowReply(!showReply)}
                className="text-[10px] text-gray-600 hover:text-[#FF00C8] transition font-semibold cursor-pointer"
              >
                Reply
              </button>
            )}
            {replies.length > 0 && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="flex items-center gap-1 text-[10px] text-gray-600 hover:text-gray-400 transition cursor-pointer"
              >
                <ChevronDown
                  size={10}
                  className={`transition-transform ${showReplies ? "rotate-180" : ""}`}
                />
                {replies.length} {replies.length === 1 ? "reply" : "replies"}
              </button>
            )}
          </div>

          {/* Reply input */}
          <AnimatePresence>
            {showReply && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-3"
              >
                <div className="flex gap-2">
                  <textarea
                    value={replyText}
                    onChange={(e) => {
                      setReplyText(e.target.value);
                      if (replyError) setReplyError("");
                    }}
                    placeholder="Write a reply... (supports **bold**, *italic*)"
                    rows={2}
                    className="flex-1 bg-white/[0.03] border border-white/8 rounded-xl px-3 py-2 text-white text-xs placeholder-gray-600 focus:outline-none focus:border-[#FF00C8]/30 transition resize-none"
                  />
                  <button
                    onClick={handleReply}
                    disabled={submitting || !replyText.trim()}
                    className="px-3 py-2 rounded-xl bg-[#FF00C8]/15 border border-[#FF00C8]/25 text-[#FF00C8] hover:bg-[#FF00C8]/25 transition disabled:opacity-40 cursor-pointer"
                  >
                    <Send size={13} />
                  </button>
                </div>
                {replyError && (
                  <p className="text-red-400 text-[11px] mt-1.5">{replyError}</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Nested replies */}
          <AnimatePresence>
            {showReplies && replies.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3 pl-4 border-l border-white/5"
              >
                {replies.map((reply) => (
                  <Comment
                    key={reply.id}
                    comment={reply}
                    onReply={onReply}
                    user={user}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto py-8 sm:py-12"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-xl bg-[#0c0c14] border border-white/10 rounded-3xl shadow-2xl my-auto max-h-[85vh] flex flex-col overflow-hidden text-left"
      >
        <div className="h-[2px] w-full bg-gradient-to-r from-[#FF00C8] via-purple-500 to-[#00F0FF] shrink-0" />

        <div className="p-6 sm:p-8 overflow-y-auto flex-1">
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

          <div className="mb-4">
            <label className="text-gray-400 text-xs font-mono mb-1.5 block uppercase tracking-wider">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                    category === cat.id
                      ? "border-purple-500/60 bg-purple-500/15 text-white"
                      : "border-white/8 bg-white/[0.02] text-gray-400 hover:border-white/20"
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
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
            <div className="w-full bg-[#05050b] border border-white/10 rounded-xl p-4 min-h-[140px] max-h-[220px] overflow-y-auto mb-4 font-sans text-sm">
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

// ── Main Post Detail ──────────────────────────────────────────────────────────
const CommunityPost = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [commentBody, setCommentBody] = useState("");
  const [commentMode, setCommentMode] = useState("text");
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null));
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    setLoading(true);
    const { data: postData } = await supabase
      .from("community_posts")
      .select("*")
      .eq("id", postId)
      .single();

    if (postData?.user_id) {
      const { data: authorProfile, error: authorErr } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .eq("id", postData.user_id)
        .maybeSingle();

      if (authorErr) console.error("author profile fetch error:", authorErr);

      // Same source of truth the post card list uses (Community.jsx) —
      // the current profile row, not whatever was snapshotted on the post
      // at creation time. This is what fixes the avatar/username mismatch
      // between the card and this full-post view.
      setPost({
        ...postData,
        username:
          authorProfile?.username ||
          authorProfile?.full_name ||
          postData.username ||
          "Anonymous",
        avatar_url: authorProfile?.avatar_url || postData.avatar_url || null,
      });
    } else {
      setPost(postData);
    }

    const { data: allComments } = await supabase
      .from("community_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    const top = (allComments || []).filter((c) => !c.parent_id);
    const nested = top.map((c) => ({
      ...c,
      replies: (allComments || []).filter((r) => r.parent_id === c.id),
    }));
    setComments(nested);

    const stored = JSON.parse(localStorage.getItem("liked_posts") || "[]");
    setLiked(stored.includes(postId));
    setLoading(false);
  };

  const handleConfirmDelete = async () => {
    if (!post) return;
    setDeleting(true);
    const { error: err } = await supabase
      .from("community_posts")
      .delete()
      .eq("id", post.id);
    setDeleting(false);
    if (err) {
      console.error("Error deleting post:", err);
    } else {
      setShowDeleteModal(false);
      navigate("/community");
    }
  };

  const handleLike = async () => {
    if (!user) return;
    const stored = JSON.parse(localStorage.getItem("liked_posts") || "[]");
    const newLiked = liked
      ? stored.filter((id) => id !== postId)
      : [...stored, postId];
    localStorage.setItem("liked_posts", JSON.stringify(newLiked));
    setLiked(!liked);
    const delta = liked ? -1 : 1;
    await supabase
      .from("community_posts")
      .update({ likes: Math.max(0, (post.likes || 0) + delta) })
      .eq("id", postId);
    setPost((p) => ({ ...p, likes: Math.max(0, (p.likes || 0) + delta) }));
  };

  const handleComment = async () => {
    if (!commentBody.trim() || !user) return;
    if (containsProfanity(commentBody)) {
      setCommentError(PROFANITY_ERROR_MSG);
      return;
    }
    setCommentError("");
    setSubmitting(true);
    const { data: profileData } = await supabase
      .from("profiles")
      .select("username, full_name, avatar_url")
      .eq("id", user.id)
      .single();
    await supabase.from("community_comments").insert({
      post_id: postId,
      parent_id: null,
      user_id: user.id,
      username:
        profileData?.username ||
        profileData?.full_name ||
        user.email?.split("@")[0],
      avatar_url: profileData?.avatar_url || null,
      body: commentMode === "text" ? commentBody.trim() : null,
      code: commentMode === "code" ? commentBody.trim() : null,
      likes: 0,
      created_at: new Date().toISOString(),
    });
    setCommentBody("");
    setSubmitting(false);
    fetchPost();
  };

  const cat = CATEGORIES.find((c) => c.id === post?.category) || CATEGORIES[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#080810]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-10 h-10 border-2 border-t-transparent border-[#FF00C8] rounded-full"
        />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#080810] flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-gray-400">Post not found.</p>
          <button
            onClick={() => navigate("/community")}
            className="mt-4 text-[#FF00C8] text-sm hover:underline cursor-pointer"
          >
            ← Back to Community
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080810] text-white flex flex-col">
      <Navbar />

      <main className="max-w-3xl mx-auto w-full px-6 py-32 flex-1">
        {/* Back */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate("/community")}
            className="flex items-center gap-2 text-gray-500 hover:text-white text-sm transition cursor-pointer"
          >
            <ArrowLeft size={15} /> Back to Community
          </button>

          {user?.id === post?.user_id && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-purple-300 border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 transition cursor-pointer"
              >
                <Edit3 size={13} />
                Edit Post
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 transition cursor-pointer"
              >
                <Trash2 size={13} />
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Post */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0f0f13] border border-white/5 rounded-3xl p-6 lg:p-8 mb-8 relative overflow-hidden"
        >
          <div
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{
              background: `linear-gradient(90deg, transparent, ${cat.color}, transparent)`,
            }}
          />

          {/* Author */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl overflow-hidden ring-1 ring-white/8">
              {post.avatar_url ? (
                <img
                  src={post.avatar_url}
                  alt={post.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#FF00C8]/40 to-[#00F0FF]/40 flex items-center justify-center text-sm font-black text-white">
                  {post.username?.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <p className="text-white text-sm font-bold">{post.username}</p>
              <p className="text-gray-600 text-[10px]">
                {timeAgo(post.created_at)}
              </p>
            </div>
            <span
              className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border"
              style={{
                color: cat.color,
                background: `${cat.color}15`,
                borderColor: `${cat.color}25`,
              }}
            >
              {cat.emoji} {cat.label}
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-black text-white mb-4">
            {post.title}
          </h1>

          {post.code ? (
            <div className="bg-[#080810] border border-white/5 rounded-xl p-5 mb-4 overflow-x-auto">
              <div className="flex items-center gap-2 mb-3">
                <Code size={12} className="text-green-400" />
                <span className="text-xs text-gray-500 font-mono">
                  code snippet
                </span>
              </div>
              <pre className="text-green-300 text-sm font-mono whitespace-pre-wrap leading-relaxed">
                {post.code}
              </pre>
            </div>
          ) : post.image_url ? (
            <img
              src={post.image_url}
              alt=""
              className="w-full rounded-xl mb-4 border border-white/5 max-h-96 object-cover"
              onError={(e) => (e.target.style.display = "none")}
            />
          ) : post.body ? (
            <div className="mb-4">
              <MarkdownBody content={post.body} />
            </div>
          ) : null}

          {/* Like */}
          <div className="flex items-center gap-4 pt-4 border-t border-white/5">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 text-sm font-semibold transition-all cursor-pointer ${liked ? "text-[#FF00C8]" : "text-gray-500 hover:text-[#FF00C8]"}`}
            >
              <Heart size={16} fill={liked ? "#FF00C8" : "none"} />
              {post.likes || 0} likes
            </button>
            <span className="flex items-center gap-2 text-sm text-gray-500">
              <MessageSquare size={16} />
              {comments.length} comments
            </span>
          </div>
        </motion.div>

        {/* Comment input */}
        {user ? (
          <div className="bg-[#0f0f13] border border-white/5 rounded-2xl p-5 mb-8">
            <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-3">
              Add a Comment
            </p>
            <div className="flex gap-2 mb-3">
              {[
                { id: "text", label: "Text" },
                { id: "code", label: "Code" },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setCommentMode(m.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                    commentMode === m.id
                      ? "bg-[#FF00C8]/15 border-[#FF00C8]/30 text-[#FF00C8]"
                      : "bg-white/[0.03] border-white/8 text-gray-500"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <textarea
              value={commentBody}
              onChange={(e) => {
                setCommentBody(e.target.value);
                if (commentError) setCommentError("");
              }}
              placeholder={
                commentMode === "code"
                  ? "Paste your code..."
                  : "Write a comment... (supports **bold**, *italic*, ## headings)"
              }
              rows={3}
              className={`w-full border border-white/8 rounded-xl px-4 py-3 text-sm placeholder-gray-600 focus:outline-none focus:border-[#FF00C8]/30 transition resize-none mb-1 ${
                commentMode === "code"
                  ? "bg-[#080810] text-green-300 font-mono"
                  : "bg-white/[0.03] text-white"
              }`}
            />
            {commentMode === "text" && (
              <p className="text-[10px] text-gray-600 mb-3">
                Supports **bold**, *italic*, ## headings, `code`, and - lists
              </p>
            )}
            {commentError && (
              <p className="text-red-400 text-xs mb-3">{commentError}</p>
            )}
            <div className="flex justify-end">
              <motion.button
                onClick={handleComment}
                disabled={submitting || !commentBody.trim()}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF00C8] to-purple-600 text-white text-sm font-bold disabled:opacity-40 cursor-pointer"
              >
                <Send size={13} /> {submitting ? "Posting..." : "Comment"}
              </motion.button>
            </div>
          </div>
        ) : (
          <div className="bg-[#0f0f13] border border-white/5 rounded-2xl p-5 mb-8 text-center">
            <p className="text-gray-500 text-sm mb-3">
              Sign in to leave a comment
            </p>
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 rounded-xl border border-[#FF00C8]/30 text-[#FF00C8] text-sm font-semibold cursor-pointer hover:bg-[#FF00C8]/5 transition"
            >
              Sign In
            </button>
          </div>
        )}

        {/* Comments */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-5">
            {comments.length} Comment{comments.length !== 1 ? "s" : ""}
          </p>
          {comments.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-white/8 rounded-2xl">
              <p className="text-3xl mb-2">💬</p>
              <p className="text-gray-600 text-sm">
                No comments yet — be the first!
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {comments.map((comment) => (
                <Comment
                  key={comment.id}
                  comment={comment}
                  onReply={fetchPost}
                  user={user}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />

      <AnimatePresence>
        {showEditModal && post && (
          <EditPostModal
            post={post}
            onClose={() => setShowEditModal(false)}
            onUpdated={fetchPost}
          />
        )}
        {showDeleteModal && (
          <DeleteConfirmModal
            deleting={deleting}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={handleConfirmDelete}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default CommunityPost;