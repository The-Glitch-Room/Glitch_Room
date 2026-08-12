import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Users, Gift, Sparkles, UserCheck, Share2, Award } from "lucide-react";
import { useAuth } from "./AuthContext";
import { getUserReferralCode, fetchUserReferralStats } from "../utils/referralHelper";

const ReferralSection = () => {
  const { user, openAuth } = useAuth();
  const [refCode, setRefCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalInvites: 0,
    completedInvites: 0,
    earnedBits: 0,
    referrals: [],
  });

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const initReferrals = async () => {
      setLoading(true);
      const code = await getUserReferralCode(user.id);
      setRefCode(code);

      const userStats = await fetchUserReferralStats(user.id);
      setStats(userStats);
      setLoading(false);
    };

    initReferrals();
  }, [user]);

  const referralLink = `${window.location.origin}/auth?ref=${refCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  if (!user) {
    return (
      <div className="bg-[#0f0f13] border border-white/5 rounded-3xl p-6 sm:p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#FF00C8]/10 via-transparent to-[#00F0FF]/10" />
        <div className="relative z-10 max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#FF00C8] to-[#00F0FF] flex items-center justify-center mx-auto mb-4 shadow-[0_0_25px_rgba(255,0,200,0.4)]">
            <Users className="text-white" size={24} />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Invite a Glitcher</h2>
          <p className="text-gray-400 text-xs leading-relaxed mb-6">
            Earn <span className="text-[#FF00C8] font-bold">+100 gBits</span> for every friend who joins with your link and solves their first challenge!
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={openAuth}
            className="px-6 py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#FF00C8] to-[#00F0FF] shadow-[0_0_20px_rgba(0,240,255,0.3)] cursor-pointer"
          >
            Sign In to Unlock Referral Link
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-3xl overflow-hidden bg-[#0f0f13] border border-white/5 p-6 md:p-8">
      {/* Background glow effects */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#FF00C8]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-[#00F0FF]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 mb-3 text-[10px] font-bold font-mono tracking-widest uppercase bg-[#FF00C8]/10 border border-[#FF00C8]/30 rounded-full text-[#FF00C8]">
            <Sparkles size={11} /> Viral Referral System
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
            Invite a Glitcher <span className="text-[#FF00C8] text-xl font-mono">+100 gBits</span>
          </h2>
          <p className="text-gray-400 text-xs mt-1 max-w-xl">
            Share your unique invite link. When your friend completes their first challenge, you both get rewarded!
          </p>
        </div>

        {/* Quick Stats Pill */}
        <div className="flex items-center gap-3 bg-[#070709] border border-white/10 rounded-2xl p-3.5 shrink-0">
          <div className="text-center px-3 border-r border-white/10">
            <p className="text-[10px] text-gray-500 font-mono uppercase">Invited</p>
            <p className="text-lg font-black text-white">{stats.totalInvites}</p>
          </div>
          <div className="text-center px-3 border-r border-white/10">
            <p className="text-[10px] text-gray-500 font-mono uppercase">Solvers</p>
            <p className="text-lg font-black text-[#22c55e]">{stats.completedInvites}</p>
          </div>
          <div className="text-center px-3">
            <p className="text-[10px] text-gray-500 font-mono uppercase">Earned</p>
            <p className="text-lg font-black text-[#FF00C8]">+{stats.earnedBits}</p>
          </div>
        </div>
      </div>

      {/* Referral Link & Code Box */}
      <div className="relative z-10 bg-[#070709] border border-white/10 rounded-2xl p-5 mb-8">
        <label className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest block mb-2">
          Your Unique Invite Link
        </label>
        <div className="flex flex-col sm:flex-row items-stretch gap-3">
          <div className="flex-1 bg-[#11111a] border border-white/5 rounded-xl px-4 py-3 text-xs font-mono text-gray-300 truncate flex items-center justify-between">
            <span className="truncate">{referralLink}</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30 shrink-0 ml-2">
              CODE: {refCode}
            </span>
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={copyToClipboard}
            className={`px-5 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
              copied
                ? "bg-[#22c55e] text-black shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                : "bg-gradient-to-r from-[#FF00C8] to-[#00F0FF] text-white shadow-[0_0_20px_rgba(255,0,200,0.3)]"
            }`}
          >
            {copied ? (
              <>
                <Check size={16} /> Link Copied!
              </>
            ) : (
              <>
                <Copy size={16} /> Copy Invite Link
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Step by step mechanism */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#070709]/60 border border-white/5 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#FF00C8]/10 border border-[#FF00C8]/30 flex items-center justify-center shrink-0 text-[#FF00C8] font-bold text-xs">
            1
          </div>
          <div>
            <h4 className="text-xs font-bold text-white mb-1">Send Link</h4>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Share your link with coders, debuggers, or tech friends.
            </p>
          </div>
        </div>

        <div className="bg-[#070709]/60 border border-white/5 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/30 flex items-center justify-center shrink-0 text-[#00F0FF] font-bold text-xs">
            2
          </div>
          <div>
            <h4 className="text-xs font-bold text-white mb-1">Friend Solves 1 Challenge</h4>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              They sign up & solve any Glitch or Debug challenge.
            </p>
          </div>
        </div>

        <div className="bg-[#070709]/60 border border-white/5 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/30 flex items-center justify-center shrink-0 text-[#22c55e] font-bold text-xs">
            3
          </div>
          <div>
            <h4 className="text-xs font-bold text-white mb-1">Instant Payout</h4>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              You receive +100 gBits and they receive +25 welcome bonus!
            </p>
          </div>
        </div>
      </div>

      {/* Referrals List */}
      {stats.referrals.length > 0 && (
        <div className="relative z-10">
          <h4 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <UserCheck size={13} className="text-[#00F0FF]" /> Your Referred Glitchers ({stats.referrals.length})
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {stats.referrals.map((item, idx) => (
              <div
                key={item.id || idx}
                className="bg-[#070709] border border-white/5 rounded-xl p-3 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#00F0FF]" />
                  <span className="font-mono text-gray-300">
                    Glitcher #{item.invitee_id?.slice(0, 8)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-gray-500">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                  {item.status === "completed" ? (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/30">
                      +100 gBits Rewarded
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      Awaiting First Solve
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferralSection;
