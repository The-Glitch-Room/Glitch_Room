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
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { containsProfanity, PROFANITY_ERROR_MSG } from "../utils/profanityFilter";

// ── Categories ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "all", label: "All Topics", color: "#ffffff", emoji: "🌐" },
  { id: "general", label: "General", color: "#00F0FF", emoji: "💬" },
  { id: "glitch", label: "Glitch Help", color: "#FF00C8", emoji: "⚡" },
  { id: "ai", label: "AI & ML", color: "#a855f7", emoji: "🤖" },
  { id: "webdev", label: "Web Dev", color: "#10b981", emoji: "🌐" },
  { id: "creative", label: "Creative", color: "#f59e0b", emoji: "🎨" },
  { id: "offtopic", label: "Off-Topic", color: "#6b7280", emoji: "😂" },
];

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto py-8 sm:py-12"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-xl bg-[#0c0c14] border border-white/10 rounded-3xl shadow-2xl my-auto max-h-[85vh] flex flex-col overflow-hidden"
      >
        {/* Top glow bar */}
        <div className="h-[2px] w-full bg-gradient-to-r from-[#FF00C8] via-purple-500 to-[#00F0FF] shrink-0" />

        <div className="p-6 sm:p-8 overflow-y-auto flex-1">
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

          {/* Category Dropdown */}
          <div className="mb-4">
            <label className="text-gray-400 text-xs font-mono mb-1.5 block uppercase tracking-wider">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.filter((c) => c.id !== "all").map((cat) => (
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
                  title="Code (`code`)"
                  onClick={() => insertMarkdown("`", "`")}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-white/10 transition cursor-pointer"
                >
                  <Code size={14} />
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
            <div className="w-full bg-[#05050b] border border-white/10 rounded-xl p-4 min-h-[140px] max-h-[220px] overflow-y-auto mb-4 font-sans text-sm">
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

// ── Post Card ─────────────────────────────────────────────────────────────────
const PostCard = ({ post, onLike, onClick, likedIds }) => {
  const cat = CATEGORIES.find((c) => c.id === post.category) || CATEGORIES[1];
  const liked = likedIds.has(post.id);
  const timeAgo = (iso) => {
    if (!iso) return "just now";
    const diff = (Date.now() - new Date(iso)) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group relative bg-[#0f0f18] border border-white/10 rounded-2xl p-6 cursor-pointer hover:border-white/25 transition-all shadow-xl overflow-hidden flex flex-col justify-between"
      onClick={() => onClick(post)}
    >
      <div
        className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          background: `linear-gradient(90deg, transparent, ${cat.color}, transparent)`,
        }}
      />

      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl overflow-hidden shrink-0 ring-1 ring-white/10">
              {post.avatar_url ? (
                <img
                  src={post.avatar_url}
                  alt={post.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#FF00C8]/40 to-[#00F0FF]/40 flex items-center justify-center text-xs font-black text-white">
                  {post.username?.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <span className="text-white text-xs font-semibold truncate block">
                {post.username}
              </span>
              <span className="text-gray-500 text-[10px]">
                {timeAgo(post.created_at)}
              </span>
            </div>
          </div>

          <span
            className="flex items-center gap-1 text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full border shrink-0"
            style={{
              color: cat.color,
              borderColor: `${cat.color}30`,
              background: `${cat.color}0c`,
            }}
          >
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
          </span>
        </div>

        <h3 className="text-white font-bold text-base leading-snug mb-2 group-hover:text-[#00F0FF] transition-colors">
          {post.title}
        </h3>

        {post.body && (
          <div className="line-clamp-3 text-gray-400 text-xs leading-relaxed mb-4">
            <MarkdownBody content={post.body} />
          </div>
        )}

        {post.code && (
          <div className="bg-[#080810] border border-white/6 rounded-xl p-3 my-3 overflow-hidden">
            <pre className="text-green-400 text-xs font-mono line-clamp-3">
              {post.code}
            </pre>
          </div>
        )}

        {post.image_url && (
          <div className="rounded-xl overflow-hidden mb-4 border border-white/6 max-h-48">
            <img
              src={post.image_url}
              alt="post attachment"
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 text-xs font-medium text-gray-500 pt-3 border-t border-white/5 mt-4">
        <motion.button
          whileTap={{ scale: 0.75 }}
          onClick={(e) => {
            e.stopPropagation();
            onLike(post);
          }}
          className={`flex items-center gap-1.5 transition cursor-pointer ${
            liked ? "text-[#FF00C8]" : "hover:text-white"
          }`}
        >
          <motion.div
            animate={liked ? { scale: [1, 1.4, 1], rotate: [0, -12, 12, 0] } : {}}
            transition={{ duration: 0.3 }}
          >
            <Heart size={14} className={liked ? "fill-[#FF00C8]" : ""} />
          </motion.div>
          <AnimatePresence mode="wait">
            <motion.span
              key={post.likes}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15 }}
            >
              {post.likes || 0}
            </motion.span>
          </AnimatePresence>
        </motion.button>

        <div className="flex items-center gap-1.5 hover:text-white transition">
          <MessageSquare size={14} />
          <span>{post.comment_count || 0} comments</span>
        </div>
      </div>
    </motion.div>
  );
};

// ── Main Page Component ───────────────────────────────────────────────────────
const Community = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("new");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [likedIds, setLikedIds] = useState(new Set());

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null));
  }, []);

  const fetchPosts = async () => {
    setLoading(true);

    // 1. Fetch base community posts safely
    let query = supabase.from("community_posts").select("*");
    if (category !== "all") query = query.eq("category", category);
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

    // Filter out Daily Standup check-in logs so Community ONLY displays discussions created via Create Post
    const validCategories = ["general", "glitch", "ai", "webdev", "creative", "offtopic"];
    let results = (rawPosts || []).filter((p) => {
      const cat = (p.category || "").toLowerCase();
      const title = (p.title || "").toLowerCase();
      const isRoomCategory = cat.startsWith("room_") || !validCategories.includes(cat);
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
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, user_id, username, full_name, avatar_url")
        .in("id", userIds);

      (profs || []).forEach((p) => {
        const uId = p.id || p.user_id;
        if (uId) profilesMap[uId] = p;
      });
    }

    // Enrich posts with dynamic profile info & comment count
    results = results.map((p) => {
      const prof = profilesMap[p.user_id];
      return {
        ...p,
        username: prof?.username || prof?.full_name || p.username || "Anonymous",
        avatar_url: prof?.avatar_url || p.avatar_url || null,
        comment_count: commentCountsMap[p.id] || 0,
      };
    });

    setPosts(results);

    const stored = JSON.parse(localStorage.getItem("liked_posts") || "[]");
    setLikedIds(new Set(stored));
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, [category, sort]);

  const handleSearch = (e) => {
    if (e.key === "Enter") fetchPosts();
  };

  const handleLike = async (post) => {
    if (!user) {
      navigate("/");
      return;
    }
    const already = likedIds.has(post.id);
    const newLiked = new Set(likedIds);
    const delta = already ? -1 : 1;

    if (already) newLiked.delete(post.id);
    else newLiked.add(post.id);

    setLikedIds(newLiked);
    localStorage.setItem("liked_posts", JSON.stringify([...newLiked]));

    await supabase
      .from("community_posts")
      .update({ likes: Math.max(0, (post.likes || 0) + delta) })
      .eq("id", post.id);

    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id ? { ...p, likes: Math.max(0, (p.likes || 0) + delta) } : p
      )
    );
  };

  return (
    <div className="relative min-h-screen bg-[#070709] text-white flex flex-col justify-between selection:bg-[#00F0FF]/20 overflow-hidden font-sans">
      {/* Dynamic Moving Glitch Background Particles (Explore & Home Page Treatment) */}
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

        {/* HERO HEADER SECTION (Matching Explore Page Spacing & Entrance Animation) */}
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
            {/* LEFT SIDEBAR: Topics & Search */}
            <div className="lg:col-span-1 space-y-6">
              {/* Topics/Categories Box (Horizontal slider on mobile, vertical sidebar on desktop) */}
              <div className="bg-[#0f0f18] border border-white/10 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3 sm:space-y-4">
                <h3 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 pb-2.5 sm:pb-3 border-b border-white/10">
                  <Tag size={14} className="text-[#FF00C8]" />
                  <span>Topics & Categories</span>
                </h3>

                <motion.div 
                    drag="x"
                    dragConstraints={{ left: -250, right: 0 }}
                    dragElastic={0.1}
                    className="flex lg:flex-col gap-2 lg:gap-0 overflow-x-auto no-scrollbar pb-1 lg:pb-0 lg:space-y-1.5 cursor-grab active:cursor-grabbing"
                  >
                  {CATEGORIES.map((cat) => {
                    const active = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
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
                          <span className="w-2 h-2 rounded-full bg-[#00F0FF] shrink-0" />
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
                  <span>Search Community</span>
                </h3>
                <div className="relative">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={handleSearch}
                    placeholder="Search posts..."
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
                  <span>Create Post</span>
                </motion.button>
              </div>

              {/* Posts Feed Grid */}
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2, 3, 4].map((n) => (
                    <div
                      key={n}
                      className="bg-[#0f0f18] border border-white/5 rounded-2xl p-5 h-48 animate-pulse"
                    />
                  ))}
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-20 bg-[#0f0f18] border border-white/10 rounded-3xl p-8">
                  <p className="text-4xl mb-3">💬</p>
                  <p className="text-white font-bold text-base mb-1">
                    No posts found
                  </p>
                  <p className="text-gray-400 text-xs mb-6">
                    Be the first to share something in this topic!
                  </p>
                  {user && (
                    <button
                      onClick={() => setShowCreate(true)}
                      className="px-5 py-2.5 rounded-xl bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-bold hover:bg-purple-600/40 transition cursor-pointer"
                    >
                      Create a Post
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onLike={handleLike}
                      likedIds={likedIds}
                      onClick={(p) => navigate(`/community/${p.id}`)}
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
            user={user}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Community;
