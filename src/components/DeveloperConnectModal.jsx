import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { X, Copy, Check, ExternalLink, User, MessageSquare } from "lucide-react";
import { FaGithub, FaTwitter, FaDiscord, FaLinkedin } from "react-icons/fa";
import { supabase } from "../supabaseClient";

/**
 * DeveloperConnectModal — Clean Glitch Room Developer Discovery & Connection Card
 * Allows developers to discover each other through discussions and connect via
 * GitHub, Discord, Twitter/X, and LinkedIn.
 */
const DeveloperConnectModal = ({ developer, isOpen, onClose, currentUser, onFilterByAuthor }) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(developer || null);
  const [loading, setLoading] = useState(false);
  const [copiedDiscord, setCopiedDiscord] = useState(false);

  const targetUserId = developer?.user_id || developer?.id;

  useEffect(() => {
    if (!isOpen || !targetUserId) return;

    // If profile already has social links loaded, use it immediately
    if (developer?.github_url !== undefined || developer?.discord_url !== undefined) {
      setProfile(developer);
      return;
    }

    // Otherwise fetch complete profile from Supabase
    const fetchFullProfile = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, bio, github_url, twitter_url, discord_url, linkedin_url")
        .eq("id", targetUserId)
        .maybeSingle();

      if (!error && data) {
        setProfile(data);
      } else {
        setProfile(developer);
      }
      setLoading(false);
    };

    fetchFullProfile();
  }, [isOpen, targetUserId, developer]);

  if (!isOpen || !developer) return null;

  const handleCopyDiscord = (tag) => {
    if (!tag) return;
    navigator.clipboard.writeText(tag);
    setCopiedDiscord(true);
    setTimeout(() => setCopiedDiscord(false), 2000);
  };

  const isSelf = currentUser && (currentUser.id === targetUserId || currentUser.id === profile?.id);

  const displayName = profile?.full_name || profile?.username || "Anonymous Glitcher";
  const username = profile?.username ? `@${profile.username.replace(/^@/, "")}` : "@glitcher";
  const avatarUrl = profile?.avatar_url;
  const bio = profile?.bio;
  const initials = displayName.slice(0, 2).toUpperCase();

  const hasAnySocial =
    Boolean(profile?.github_url) ||
    Boolean(profile?.discord_url) ||
    Boolean(profile?.twitter_url) ||
    Boolean(profile?.linkedin_url);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        {/* Backdrop click to close */}
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-md bg-[#0c0c16] border border-white/15 rounded-3xl shadow-2xl shadow-black/90 overflow-hidden z-10 font-sans"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Cyber Glow Bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#00F0FF] via-purple-500 to-[#FF00C8]" />

          <div className="p-6">
            {/* Top row: Close button */}
            <div className="flex items-center justify-between pb-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#00F0FF] font-bold">
                Developer Profile
              </span>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Author Info Card */}
            <div className="flex items-start gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-white/15 shrink-0 bg-[#121220] flex items-center justify-center shadow-lg">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#00F0FF]/30 to-purple-600/30 flex items-center justify-center text-sm font-black text-white">
                    {initials}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-white text-base font-bold truncate leading-tight">
                  {displayName}
                </h3>
                <p className="text-cyan-400 text-xs font-mono truncate mt-0.5">
                  {username}
                </p>
                <span className="inline-block mt-2 text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-400">
                  Glitch Room Builder
                </span>
              </div>
            </div>

            {/* Bio */}
            {bio ? (
              <p className="text-gray-300 text-xs leading-relaxed mb-5 bg-white/[0.02] border border-white/8 rounded-xl p-3">
                {bio}
              </p>
            ) : (
              <p className="text-gray-500 italic text-xs leading-relaxed mb-5 bg-white/[0.02] border border-white/5 rounded-xl p-3">
                Building, solving, and sharing code in The Glitch Lounge.
              </p>
            )}

            {/* Social & Connection Links */}
            <div className="space-y-2 mb-6">
              <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-2">
                Connect & Socials
              </h4>

              {hasAnySocial ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* GitHub */}
                  {profile?.github_url && (
                    <a
                      href={
                        profile.github_url.startsWith("http")
                          ? profile.github_url
                          : `https://github.com/${profile.github_url.replace(/^@/, "")}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/25 text-gray-200 hover:text-white transition text-xs font-medium cursor-pointer group"
                    >
                      <FaGithub size={14} className="text-gray-400 group-hover:text-white shrink-0" />
                      <span className="truncate">GitHub</span>
                      <ExternalLink size={11} className="ml-auto text-gray-500 group-hover:text-gray-300 shrink-0" />
                    </a>
                  )}

                  {/* Discord */}
                  {profile?.discord_url && (
                    <button
                      type="button"
                      onClick={() => handleCopyDiscord(profile.discord_url)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 hover:border-[#5865F2]/40 text-gray-200 hover:text-white transition text-xs font-medium cursor-pointer group text-left"
                      title="Click to copy Discord Tag"
                    >
                      <FaDiscord size={14} className="text-[#5865F2] shrink-0" />
                      <span className="truncate flex-1">{profile.discord_url}</span>
                      {copiedDiscord ? (
                        <Check size={12} className="text-green-400 shrink-0 ml-auto" />
                      ) : (
                        <Copy size={11} className="text-gray-500 group-hover:text-gray-300 shrink-0 ml-auto" />
                      )}
                    </button>
                  )}

                  {/* Twitter / X */}
                  {profile?.twitter_url && (
                    <a
                      href={
                        profile.twitter_url.startsWith("http")
                          ? profile.twitter_url
                          : `https://x.com/${profile.twitter_url.replace(/^@/, "")}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 hover:border-[#1DA1F2]/40 text-gray-200 hover:text-white transition text-xs font-medium cursor-pointer group"
                    >
                      <FaTwitter size={14} className="text-[#1DA1F2] shrink-0" />
                      <span className="truncate">Twitter / X</span>
                      <ExternalLink size={11} className="ml-auto text-gray-500 group-hover:text-gray-300 shrink-0" />
                    </a>
                  )}

                  {/* LinkedIn */}
                  {profile?.linkedin_url && (
                    <a
                      href={
                        profile.linkedin_url.startsWith("http")
                          ? profile.linkedin_url
                          : `https://linkedin.com/in/${profile.linkedin_url.replace(/^@/, "")}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 hover:border-[#0A66C2]/40 text-gray-200 hover:text-white transition text-xs font-medium cursor-pointer group"
                    >
                      <FaLinkedin size={14} className="text-[#0A66C2] shrink-0" />
                      <span className="truncate">LinkedIn</span>
                      <ExternalLink size={11} className="ml-auto text-gray-500 group-hover:text-gray-300 shrink-0" />
                    </a>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 px-3 rounded-xl bg-white/[0.02] border border-white/5 text-gray-500 text-xs">
                  This developer hasn&apos;t added public social links yet.
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-white/10">
              {onFilterByAuthor && profile?.username && (
                <button
                  type="button"
                  onClick={() => {
                    onFilterByAuthor(profile.username);
                    onClose();
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-semibold transition cursor-pointer border border-white/10"
                >
                  <MessageSquare size={13} />
                  <span>View All Posts</span>
                </button>
              )}

              {isSelf ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate("/profile");
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25 text-xs font-bold transition cursor-pointer"
                >
                  <User size={13} />
                  <span>Edit My Profile</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition cursor-pointer"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DeveloperConnectModal;
