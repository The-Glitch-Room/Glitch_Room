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
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { containsProfanity, PROFANITY_ERROR_MSG } from "../utils/profanityFilter";

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
      code: ({ inline, children }) =>
        inline ? (
          <code className="bg-white/8 text-[#00F0FF] text-xs px-1.5 py-0.5 rounded font-mono">
            {children}
          </code>
        ) : (
          <pre className="bg-[#080810] border border-white/8 rounded-xl p-4 overflow-x-auto my-3">
            <code className="text-green-300 text-xs font-mono whitespace-pre-wrap">
              {children}
            </code>
          </pre>
        ),
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
    setPost(postData);

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
        <button
          onClick={() => navigate("/community")}
          className="flex items-center gap-2 text-gray-500 hover:text-white text-sm mb-8 transition cursor-pointer"
        >
          <ArrowLeft size={15} /> Back to Community
        </button>

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
    </div>
  );
};

export default CommunityPost;
