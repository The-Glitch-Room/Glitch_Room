import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Trash2, X, Loader2 } from "lucide-react";
import { supabase } from "../../supabaseClient";

const DeleteRoomModal = ({ isOpen, onClose, room, onDeleted }) => {
  const [confirmName, setConfirmName] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen || !room) return null;

  const roomName = room.name || "this room";
  const isMatch = confirmName.trim().toLowerCase() === roomName.trim().toLowerCase();

  const handleDelete = async () => {
    if (!isMatch) return;
    setDeleting(true);
    setErrorMsg("");

    try {
      // Delete questions, checkins, members, and room from Supabase
      await supabase.from("room_questions").delete().eq("room_id", room.id);
      await supabase.from("room_checkins").delete().eq("room_id", room.id);
      await supabase.from("room_members").delete().eq("room_id", room.id);
      
      const { error } = await supabase.from("rooms").delete().eq("id", room.id);

      if (error) {
        throw error;
      }

      onDeleted();
    } catch (err) {
      console.error("Error deleting room:", err);
      setErrorMsg(err.message || "Failed to delete room. Please try again.");
      setDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md bg-[#0f0f18] border border-red-500/30 rounded-3xl p-6 overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.2)]"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition cursor-pointer"
          >
            <X size={16} />
          </button>

          <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 mb-4">
            <AlertTriangle size={24} />
          </div>

          <h3 className="text-xl font-black text-white mb-2">Delete Room?</h3>
          <p className="text-xs text-gray-300 leading-relaxed mb-4">
            This action cannot be undone. All questions, check-ins, members, and rankings for{" "}
            <span className="font-bold text-white">"{roomName}"</span> will be permanently deleted.
          </p>

          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-3.5 mb-4">
            <p className="text-[11px] text-red-300 font-medium leading-normal">
              Type <span className="font-mono font-bold text-white">"{roomName}"</span> below to confirm deletion:
            </p>
          </div>

          <input
            type="text"
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            placeholder={`Type "${roomName}"`}
            className="w-full bg-[#080810] border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 transition mb-4 font-mono"
          />

          {errorMsg && (
            <p className="text-xs text-red-400 font-semibold mb-3">{errorMsg}</p>
          )}

          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              disabled={deleting}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-400 bg-white/5 hover:bg-white/10 transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={handleDelete}
              disabled={!isMatch || deleting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-[0_0_20px_rgba(239,68,68,0.3)] transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {deleting ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={14} /> Delete Room Permanently
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DeleteRoomModal;
