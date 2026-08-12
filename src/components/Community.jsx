import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import Navbar from "./Navbar";
import Footer from "./Footer";
import PageHeading from "./PageHeading";
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
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { containsProfanity, PROFANITY_ERROR_MSG } from "../utils/profanityFilter";

// ── Categories ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "all", label: "All", color: "#ffffff", emoji: "🌐" },
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
          className="text-[#00F0FF] hover:underline"
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
  const [mode, setMode] = useState("text"); // text | code | image
  const [imageUrl, setImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!body.trim() && mode !== "image") {
      setError("Post body is required.");
      return;
    }
    if (containsProfanity(title) || containsProfanity(body)) {
      setError(PROFANITY_ERROR_MSG);
      return;
    }
    setSubmitting(true);
    setError("");

    const { data: profileData } = await supabase
      .from("profiles")
      .select("username, full_name, avatar_url")
      .eq("id", user.id)
      .single();

    const { error: insertErr } = await supabase.from("community_posts").insert({
      user_id: user.id,
      username:
        profileData?.username ||
        profileData?.full_name ||
        user.email?.split("@")[0],
      avatar_url: profileData?.avatar_url || null,
      title: title.trim(),
      body: mode !== "image" ? body.trim() : "",
      image_url: mode === "image" ? imageUrl.trim() : null,
      code: mode === "code" ? body.trim() : null,
      category,
      likes: 0,
      created_at: new Date().toISOString(),
    });

    setSubmitting(false);
    if (insertErr) {
      setError(insertErr.message);
      return;
    }
    onCreated();
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.93, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="relative bg-[#0a0a0e] border border-white/8 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl"
      >
        {/* Top glow bar */}
        <div className="h-[2px] w-full bg-gradient-to-r from-[#FF00C8] via-purple-500 to-[#00F0FF]" />

        <div className="p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-black text-white">Create a Post</h2>
              <p className="text-gray-600 text-xs mt-0.5">
                Share with the community
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-white transition cursor-pointer"
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
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="// Paste your code snippet here..."
              rows={6}
              className="w-full bg-black/50 border border-white/8 rounded-xl px-4 py-3 text-green-300 text-xs focus:outline-none focus:border-[#00F0FF]/40 transition mb-4 font-mono resize-none"
            />
          ) : (
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="What's on your mind?"
              rows={5}
              className="w-full bg-white/[0.03] border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#FF00C8]/40 transition mb-4 resize-none"
            />
          )}

          {mode === "text" && (
            <p className="text-[10px] text-gray-600 mb-3">
              Supports **bold**, *italic*, ## headings, `code`, and - lists
            </p>
          )}

          {error && <p className="text-red-400 text-xs mb-4">{error}</p>}

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-white/5 text-gray-400 text-sm font-semibold hover:bg-white/8 transition cursor-pointer"
            >
              Cancel
            </button>
            <motion.button
              onClick={handleSubmit}
              disabled={submitting}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
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
      whileHover={{ y: -2 }}
      className="group relative bg-[#0f0f13] border border-white/5 rounded-2xl p-5 cursor-pointer hover:border-white/10 transition-all overflow-hidden"
      onClick={() => onClick(post)}
    >
      <div
        className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          background: `linear-gradient(90deg, transparent, ${cat.color}, transparent)`,
        }}
      />

      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl overflow-hidden shrink-0 ring-1 ring-white/8">
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
            <span className="text-gray-600 text-[10px]">
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

      <div className="flex items-center gap-4 text-xs font-medium text-gray-500 pt-3 border-t border-white/4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onLike(post);
          }}
          className={`flex items-center gap-1.5 transition cursor-pointer ${
            liked ? "text-[#FF00C8]" : "hover:text-white"
          }`}
        >
          <Heart size={14} className={liked ? "fill-[#FF00C8]" : ""} />
          <span>{post.likes || 0}</span>
        </button>

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

    let results = rawPosts || [];

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

    if (sort === "hot") {
      results.sort(
        (a, b) => b.likes + b.comment_count * 2 - (a.likes + a.comment_count * 2)
      );
    }

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
    <div className="min-h-screen bg-[#06060c] text-white flex flex-col font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-20 flex-1 w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <PageHeading
              badge="Community"
              title="The Glitch Lounge"
              description="Discuss challenges, showcase builds, and learn together."
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              if (!user) navigate("/");
              else setShowCreate(true);
            }}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#FF00C8] to-purple-600 text-white font-bold text-sm flex items-center gap-2 shadow-[0_0_20px_rgba(255,0,200,0.3)] shrink-0 cursor-pointer"
          >
            <Plus size={16} />
            <span>Create Post</span>
          </motion.button>
        </div>

        {/* Category Pills & Sort Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-8">
          <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const active = category === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition cursor-pointer shrink-0 border ${
                    active
                      ? "bg-white/10 text-white border-white/20 shadow-sm"
                      : "bg-[#0b0b12] text-gray-500 border-white/5 hover:border-white/10 hover:text-gray-300"
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearch}
                placeholder="Search posts..."
                className="w-full bg-[#0b0b12] border border-white/6 rounded-2xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#00F0FF]/40 transition"
              />
            </div>

            <div className="flex items-center gap-1 bg-[#0b0b12] border border-white/6 p-1 rounded-2xl">
              {SORT_OPTIONS.map((s) => {
                const Icon = s.icon;
                const active = sort === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSort(s.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      active
                        ? "bg-white/10 text-white"
                        : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    <Icon size={12} />
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Posts Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="bg-[#0f0f13] border border-white/5 rounded-2xl p-5 h-48 animate-pulse"
              />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 bg-[#0f0f13] border border-white/5 rounded-3xl">
            <p className="text-4xl mb-3">💬</p>
            <p className="text-white font-bold text-base mb-1">
              No posts found
            </p>
            <p className="text-gray-500 text-xs mb-6">
              Be the first to share something in this category!
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
      </main>

      <AnimatePresence>
        {showCreate && (
          <CreatePostModal
            onClose={() => setShowCreate(false)}
            onCreated={fetchPosts}
            user={user}
          />
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

export default Community;
