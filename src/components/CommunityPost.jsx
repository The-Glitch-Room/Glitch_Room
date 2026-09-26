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
import DeveloperConnectModal from "./DeveloperConnectModal";
import { POST_TYPES, getPostType, REACTIONS } from "./Community";

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
const Comment = ({ comment, onReply, user, postAuthorId, onAuthorClick }) => {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const [replyError, setReplyError] = useState("");

  const handleOpenReply = () => {
    if (!showReply && !replyText) {
      const targetUser = (comment.username || "dev").replace(/^@/, "");
      setReplyText(`@${targetUser} `);
    }
    setShowReply(!showReply);
  };

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
        {/* Avatar (Click to connect) */}
        <button
          type="button"
          onClick={() => onAuthorClick && onAuthorClick(comment.authorProfile || comment)}
          className="w-8 h-8 rounded-xl overflow-hidden shrink-0 ring-1 ring-white/10 mt-0.5 cursor-pointer hover:ring-[#00F0FF]/50 transition bg-[#121220]"
          title="Click to view developer profile & socials"
        >
          {comment.avatar_url ? (
            <img
              src={comment.avatar_url}
              alt={comment.username}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#FF00C8]/40 to-[#00F0FF]/40 flex items-center justify-center text-xs font-black text-white">
              {comment.username?.replace(/^@/, "").slice(0, 2).toUpperCase() || "GL"}
            </div>
          )}
        </button>

        <div className="flex-1 min-w-0">
          {/* Bubble */}
          <div className="bg-[#0f0f13] border border-white/5 rounded-2xl rounded-tl-sm px-4 py-3 mb-1">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => onAuthorClick && onAuthorClick(comment.authorProfile || comment)}
                className="text-white text-xs font-bold hover:text-[#00F0FF] transition cursor-pointer"
                title="Click to view developer profile"
              >
                {comment.username}
              </button>
              {comment.user_id === postAuthorId && (
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                  OP
                </span>
              )}
              <span className="text-gray-600 text-[10px] font-mono">
                • {timeAgo(comment.created_at)}
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
                onClick={handleOpenReply}
                className="text-[10px] text-gray-500 hover:text-[#00F0FF] transition font-semibold cursor-pointer"
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
                    postAuthorId={postAuthorId}
                    onAuthorClick={onAuthorClick}
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto py-6 sm:py-10"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-3xl sm:max-w-4xl bg-[#0c0c14] border border-white/10 rounded-3xl shadow-2xl my-auto overflow-hidden text-left"
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
  const [commentError, setCommentError] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedDev, setSelectedDev] = useState(null);
  const [userReactions, setUserReactions] = useState({});

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null));
    fetchPost();

    try {
      const stored = JSON.parse(localStorage.getItem("glitch_community_reactions") || "{}");
      setUserReactions(stored);
    } catch {
      setUserReactions({});
    }
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
        .select("id, username, full_name, avatar_url, bio, github_url, twitter_url, discord_url, linkedin_url")
        .eq("id", postData.user_id)
        .maybeSingle();

      if (authorErr) console.error("author profile fetch error:", authorErr);

      setPost({
        ...postData,
        authorProfile: authorProfile || null,
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

    const commentUserIds = Array.from(
      new Set((allComments || []).map((c) => c.user_id))
    ).filter(Boolean);

    let commentProfiles = {};
    if (commentUserIds.length > 0) {
      const { data: cProfs } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, bio, github_url, twitter_url, discord_url, linkedin_url")
        .in("id", commentUserIds);

      (cProfs || []).forEach((p) => {
        commentProfiles[p.id] = p;
      });
    }

    const enrichComment = (c) => {
      const prof = commentProfiles[c.user_id];
      return {
        ...c,
        authorProfile: prof || null,
        username: prof?.username || prof?.full_name || c.username || "Anonymous",
        avatar_url: prof?.avatar_url || c.avatar_url || null,
      };
    };

    const top = (allComments || []).filter((c) => !c.parent_id);
    const nested = top.map((c) => ({
      ...enrichComment(c),
      replies: (allComments || [])
        .filter((r) => r.parent_id === c.id)
        .map(enrichComment),
    }));
    setComments(nested);
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

  const handleReaction = async (reactionId) => {
    if (!user) {
      navigate("/");
      return;
    }
    const currentReaction = userReactions[postId];
    const isRemoving = currentReaction === reactionId;
    const isChanging = currentReaction && currentReaction !== reactionId;

    let delta = 0;
    const newReactions = { ...userReactions };

    if (isRemoving) {
      delete newReactions[postId];
      delta = -1;
    } else if (isChanging) {
      newReactions[postId] = reactionId;
      delta = 0;
    } else {
      newReactions[postId] = reactionId;
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
        .eq("id", postId);
      setPost((p) => ({ ...p, likes: newCount }));
    }
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

  const type = getPostType(post?.category);

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
          <p className="text-gray-400">Discussion not found.</p>
          <button
            onClick={() => navigate("/community")}
            className="mt-4 text-[#FF00C8] text-sm hover:underline cursor-pointer"
          >
            ← Back to The Glitch Lounge
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080810] text-white flex flex-col font-sans">
      <Navbar />

      <main className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-32 flex-1">
        {/* Back */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate("/community")}
            className="flex items-center gap-2 text-gray-400 hover:text-white text-xs sm:text-sm transition cursor-pointer font-semibold"
          >
            <ArrowLeft size={15} /> Back to Lounge
          </button>

          {user?.id === post?.user_id && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-purple-300 border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 transition cursor-pointer"
              >
                <Edit3 size={13} />
                Edit Post
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-400 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 transition cursor-pointer"
              >
                <Trash2 size={13} />
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Main Post Card */}
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0f0f16] border border-white/10 rounded-3xl p-6 sm:p-8 mb-8 relative overflow-hidden shadow-2xl"
        >
          <div
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{
              background: `linear-gradient(90deg, transparent, ${type.color}, transparent)`,
            }}
          />

          {/* Author Capsule & Post Type Badge */}
          <div className="flex items-center justify-between gap-3 mb-6">
            <button
              type="button"
              onClick={() => setSelectedDev(post.authorProfile || post)}
              className="flex items-center gap-3 text-left group/author hover:opacity-90 transition cursor-pointer p-1 -m-1 rounded-2xl hover:bg-white/[0.04]"
              title="Click to view developer profile & socials"
            >
              <div className="w-11 h-11 rounded-2xl overflow-hidden ring-1 ring-white/15 bg-[#121220] flex items-center justify-center shrink-0">
                {post.avatar_url ? (
                  <img
                    src={post.avatar_url}
                    alt={post.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-sm font-black text-white"
                    style={{
                      background: `linear-gradient(135deg, ${type.color}40, #00F0FF40)`,
                    }}
                  >
                    {post.username?.replace(/^@/, "").slice(0, 2).toUpperCase() || "GL"}
                  </div>
                )}
              </div>
              <div>
                <p className="text-white text-sm font-bold group-hover/author:text-[#00F0FF] transition">
                  {post.username}
                </p>
                <p className="text-gray-500 text-[10px] font-mono">
                  {timeAgo(post.created_at)}
                </p>
              </div>
            </button>

            <span
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-bold border shadow-sm"
              style={{
                color: type.color,
                background: `${type.color}15`,
                borderColor: `${type.color}35`,
              }}
            >
              <span>{type.emoji}</span>
              <span>{type.label}</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white mb-4 leading-tight">
            {post.title}
          </h1>

          {post.code ? (
            <div className="bg-[#080810] border border-white/8 rounded-2xl p-5 mb-5 overflow-x-auto">
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
              className="w-full rounded-2xl mb-5 border border-white/8 max-h-96 object-cover"
              onError={(e) => (e.target.style.display = "none")}
            />
          ) : post.body ? (
            <div className="mb-5 leading-relaxed text-gray-200">
              <MarkdownBody content={post.body} />
            </div>
          ) : null}

          {/* Multi-Reaction Bar & Comments Count */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-5 border-t border-white/8">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              {REACTIONS.map((r) => {
                const isActive = userReactions[postId] === r.id;
                return (
                  <motion.button
                    key={r.id}
                    whileTap={{ scale: 0.85 }}
                    onClick={() => handleReaction(r.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                      isActive
                        ? "bg-[#00F0FF]/15 border-[#00F0FF]/40 text-cyan-300 shadow-sm shadow-cyan-500/25"
                        : "bg-white/[0.03] border-white/8 text-gray-400 hover:text-white hover:border-white/20"
                    }`}
                    title={`React with ${r.label}`}
                  >
                    <span className="text-sm">{r.emoji}</span>
                    <span className="text-[11px] font-mono hidden sm:inline">{r.label}</span>
                  </motion.button>
                );
              })}
              <span className="text-gray-500 text-xs font-mono ml-1 font-semibold">
                {post.likes || 0} reaction{post.likes === 1 ? "" : "s"}
              </span>
            </div>

            <span className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
              <MessageSquare size={14} className="text-[#00F0FF]" />
              {comments.length} comment{comments.length === 1 ? "" : "s"}
            </span>
          </div>
        </motion.article>

        {/* Add Comment Box */}
        {user ? (
          <div className="bg-[#0f0f16] border border-white/8 rounded-3xl p-5 sm:p-6 mb-8 shadow-xl">
            <p className="text-xs font-mono text-gray-400 uppercase tracking-widest font-bold mb-3">
              Add to the Discussion
            </p>
            <div className="flex gap-2 mb-3">
              {[
                { id: "text", label: "Text" },
                { id: "code", label: "Code" },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setCommentMode(m.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                    commentMode === m.id
                      ? "bg-[#00F0FF]/15 border-[#00F0FF]/30 text-cyan-300"
                      : "bg-white/[0.03] border-white/8 text-gray-500 hover:text-gray-300"
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
                  : "Write a comment or answer... (supports markdown, @mentions, code)"
              }
              rows={3}
              className={`w-full border border-white/8 rounded-2xl px-4 py-3 text-sm placeholder-gray-600 focus:outline-none focus:border-[#00F0FF]/40 transition resize-none mb-1 font-sans ${
                commentMode === "code"
                  ? "bg-[#080810] text-green-300 font-mono text-xs"
                  : "bg-white/[0.03] text-white"
              }`}
            />
            {commentMode === "text" && (
              <p className="text-[10px] text-gray-600 mb-3 font-mono">
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
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF00C8] to-purple-600 text-white text-xs font-bold disabled:opacity-40 cursor-pointer shadow-lg shadow-purple-500/20"
              >
                <Send size={13} /> {submitting ? "Posting..." : "Reply to Discussion"}
              </motion.button>
            </div>
          </div>
        ) : (
          <div className="bg-[#0f0f16] border border-white/8 rounded-2xl p-6 mb-8 text-center">
            <p className="text-gray-400 text-sm mb-3">
              Sign in to join the discussion and share your thoughts
            </p>
            <button
              onClick={() => navigate("/")}
              className="px-5 py-2 rounded-xl border border-[#00F0FF]/30 text-cyan-300 text-xs font-bold cursor-pointer hover:bg-[#00F0FF]/10 transition"
            >
              Sign In to Participate
            </button>
          </div>
        )}

        {/* Discussion Comments List */}
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-5 font-mono">
            {comments.length} Discussion Response{comments.length !== 1 ? "s" : ""}
          </p>
          {comments.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-white/8 rounded-2xl bg-white/[0.01]">
              <p className="text-3xl mb-2">💬</p>
              <p className="text-gray-400 text-sm font-semibold">
                No replies yet.
              </p>
              <p className="text-gray-600 text-xs mt-1">
                Be the first to share an answer or perspective!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <Comment
                  key={comment.id}
                  comment={comment}
                  onReply={fetchPost}
                  user={user}
                  postAuthorId={post.user_id}
                  onAuthorClick={(dev) => setSelectedDev(dev)}
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

      {/* Developer Connect & Social Discovery Modal */}
      <DeveloperConnectModal
        developer={selectedDev}
        isOpen={Boolean(selectedDev)}
        onClose={() => setSelectedDev(null)}
        currentUser={user}
        onFilterByAuthor={() => {
          setSelectedDev(null);
          navigate("/community");
        }}
      />
    </div>
  );
};

export default CommunityPost;