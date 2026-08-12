import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  AlignLeft,
  Code2,
  Link2,
  Rocket,
  Lightbulb,
  Eye,
  CheckCircle2,
} from "lucide-react";

const FORMAT_TABS = [
  { id: "text", label: "Text", icon: AlignLeft },
  { id: "code", label: "Code", icon: Code2 },
  { id: "link", label: "Link", icon: Link2 },
];

// Previous submissions are stored as JSON strings: {format, content}.
// Older plain-text submissions (pre-redesign) fall back to format: "text".
const parsePrevious = (raw) => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      parsed.format &&
      "content" in parsed
    ) {
      return parsed;
    }
  } catch (e) {
    // not JSON — legacy plain text submission
  }
  return { format: "text", content: raw };
};

/**
 * ChallengeWorkspace — shared split-screen layout for all challenge types.
 * Left: problem statement, challenge code, hint, reveal-solution.
 * Right: tabbed answer workspace (Text / Code / Link) + submit.
 *
 * No internal scrollboxes — both panels grow naturally with page scroll.
 * On desktop the left panel sticks under the top bar as you scroll; it
 * never gets its own scrollbar.
 *
 * Props:
 *  color            accent hex, e.g. "#FF00C8"
 *  category, title, description, difficulty, diffStyle {text,bg,dot}
 *  earnablePoints   number
 *  note             optional italic note under description (e.g. creative prompt)
 *  challengeCode    optional string shown in a code block
 *  codeFileLabel    filename shown in the code block header
 *  hint             optional string
 *  canReveal        whether reveal-solution is offered (default true)
 *  solutionVisible, onRevealSolution, solution
 *  previousSubmission  { answer, points_earned } | null   (answer is the raw stored string)
 *  onSubmit         ({ format, content }) => void
 *  submitLabel, resubmitLabel
 *  backTo, backLabel   (used only for the mobile back link inside the workspace panel)
 */
const ChallengeWorkspace = ({
  color,
  category,
  title,
  description,
  note,
  difficulty,
  diffStyle,
  earnablePoints,
  challengeCode,
  codeFileLabel = "challenge.js",
  hint,
  canReveal = true,
  solutionVisible,
  onRevealSolution,
  solution,
  previousSubmission,
  onSubmit,
  submitLabel = "🚀 Submit",
  resubmitLabel = "🔄 Re-submit",
  backTo,
  backLabel = "← Back",
}) => {
  const [format, setFormat] = useState("text");
  const [content, setContent] = useState({ text: "", code: "", link: "" });
  const [showPrevious, setShowPrevious] = useState(false);

  const prev = parsePrevious(previousSubmission?.answer);
  const prevFormatTab = prev
    ? FORMAT_TABS.find((t) => t.id === prev.format)
    : null;
  const hasContent = content[format].trim().length > 0;

  const handleSubmit = () => {
    if (!hasContent) return;
    onSubmit({ format, content: content[format].trim() });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-0 lg:items-start lg:rounded-2xl lg:overflow-hidden lg:border lg:border-white/5 lg:shadow-2xl">
      {/* ── LEFT: Problem panel ── */}
      <div className="relative bg-[#0f0f14] border border-white/5 lg:border-0 lg:border-r lg:border-white/5 rounded-2xl lg:rounded-none p-6 md:p-8 lg:sticky lg:top-20 lg:self-start">
        <div
          className="absolute top-0 left-0 right-0 h-[2px] lg:rounded-none rounded-t-2xl"
          style={{
            background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          }}
        />

        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
            {category}
          </span>
          <span
            className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg ${diffStyle.bg} ${diffStyle.text}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${diffStyle.dot}`} />
            {difficulty}
          </span>
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-lg"
            style={{
              background: `${color}15`,
              color,
              border: `1px solid ${color}30`,
            }}
          >
            +{earnablePoints} pts
          </span>
          {previousSubmission && (
            <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20">
              <CheckCircle2 size={11} /> Solved
            </span>
          )}
        </div>

        <h1 className="text-2xl md:text-3xl font-black text-white mb-3">
          {title}
        </h1>
        <p className="text-gray-400 text-sm leading-relaxed mb-1">
          {description}
        </p>
        {note && (
          <p className="text-gray-500 text-sm mt-2 mb-4 italic leading-relaxed">
            {note}
          </p>
        )}
        <div className="mb-6" />

        {challengeCode && (
          <div className="mb-6">
            <p
              className="text-xs font-bold uppercase tracking-widest mb-2"
              style={{ color }}
            >
              Challenge Code
            </p>
            <div className="bg-[#080810] border border-white/5 rounded-xl p-5 overflow-x-auto">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="w-3 h-3 rounded-full bg-green-500" />
                <span className="ml-2 text-xs text-gray-500">
                  {codeFileLabel}
                </span>
              </div>
              <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
                {challengeCode}
              </pre>
            </div>
          </div>
        )}

        {hint && (
          <div className="flex items-start gap-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 mb-6">
            <Lightbulb size={16} className="text-yellow-400 shrink-0 mt-0.5" />
            <p className="text-yellow-300 text-sm leading-relaxed">
              <span className="font-bold">Hint: </span>
              {hint}
            </p>
          </div>
        )}

        {canReveal && (
          <div>
            {!solutionVisible ? (
              <button
                onClick={onRevealSolution}
                className="flex items-center gap-2 bg-[#1a1a22] border border-white/10 text-gray-400 hover:text-white hover:border-white/20 px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer"
              >
                <Eye size={14} /> Reveal Solution (-5 pts)
              </button>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <p className="text-xs font-bold uppercase tracking-widest text-green-400 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 size={12} /> Solution
                </p>
                <div className="bg-[#080810] border border-green-500/20 rounded-xl p-5 overflow-x-auto">
                  <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
                    {solution || "No solution provided yet."}
                  </pre>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {backTo && (
          <Link
            to={backTo}
            className="hidden lg:inline-block mt-8 text-sm text-gray-500 hover:text-white transition"
          >
            {backLabel}
          </Link>
        )}
      </div>

      {/* ── RIGHT: Workspace panel ── */}
      <div className="bg-[#0f0f14] border border-white/5 lg:border-0 rounded-2xl lg:rounded-none p-6 md:p-8 flex flex-col">
        {previousSubmission && (
          <div className="mb-5">
            <button
              onClick={() => setShowPrevious(!showPrevious)}
              className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition cursor-pointer"
              style={{
                color,
                background: `${color}10`,
                border: `1px solid ${color}25`,
              }}
            >
              {showPrevious ? "🔼 Hide" : "🔽 View"} My Previous Answer
            </button>
            <AnimatePresence>
              {showPrevious && prev && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 bg-[#080810] rounded-xl p-4 overflow-hidden"
                  style={{ border: `1px solid ${color}25` }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {prevFormatTab && (
                      <prevFormatTab.icon size={12} style={{ color }} />
                    )}
                    <p
                      className="text-xs font-bold uppercase tracking-widest"
                      style={{ color }}
                    >
                      Your Previous Answer ({prev.format})
                    </p>
                  </div>
                  {prev.format === "code" ? (
                    <pre className="text-gray-300 text-sm whitespace-pre-wrap font-mono leading-relaxed">
                      {prev.content}
                    </pre>
                  ) : prev.format === "link" ? (
                    <a
                      href={prev.content}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm break-all hover:underline"
                      style={{ color }}
                    >
                      {prev.content}
                    </a>
                  ) : (
                    <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
                      {prev.content}
                    </p>
                  )}
                  {previousSubmission.points_earned > 0 && (
                    <p className="text-xs text-green-400 mt-2">
                      +{previousSubmission.points_earned} pts earned
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <p
          className="text-xs font-bold uppercase tracking-widest mb-3"
          style={{ color }}
        >
          {previousSubmission ? "Try Again (no points)" : "Your Answer"}
        </p>

        {/* Format tabs */}
        <div className="flex gap-2 mb-4">
          {FORMAT_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = format === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFormat(tab.id)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer"
                style={
                  active
                    ? {
                        background: `${color}15`,
                        borderColor: `${color}40`,
                        color,
                      }
                    : {
                        background: "rgba(255,255,255,0.03)",
                        borderColor: "rgba(255,255,255,0.07)",
                        color: "#6b7280",
                      }
                }
              >
                <Icon size={13} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Answer input */}
        <div className="mb-4">
          {format === "text" && (
            <textarea
              value={content.text}
              onChange={(e) =>
                setContent((c) => ({ ...c, text: e.target.value }))
              }
              placeholder="Write your approach, explanation, or solution here..."
              rows={10}
              className="w-full bg-[#080810] border border-white/5 rounded-xl p-4 text-gray-200 placeholder-gray-600 outline-none transition text-sm resize-y"
            />
          )}
          {format === "code" && (
            <textarea
              value={content.code}
              onChange={(e) =>
                setContent((c) => ({ ...c, code: e.target.value }))
              }
              placeholder="Paste your corrected code here..."
              spellCheck={false}
              rows={10}
              className="w-full bg-[#080810] border border-white/5 rounded-xl p-4 text-green-300 placeholder-gray-600 outline-none transition text-sm font-mono resize-y"
            />
          )}
          {format === "link" && (
            <div>
              <input
                type="url"
                value={content.link}
                onChange={(e) =>
                  setContent((c) => ({ ...c, link: e.target.value }))
                }
                placeholder="https://... (CodeSandbox, GitHub, Replit, Loom, etc.)"
                className="w-full bg-[#080810] border border-white/5 rounded-xl p-4 text-gray-200 placeholder-gray-600 outline-none transition text-sm"
              />
              <p className="text-[11px] text-gray-600 mt-2">
                Link to a live sandbox, repo, or short walkthrough video.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center flex-wrap gap-3 mt-auto pt-2">
          {backTo && (
            <Link
              to={backTo}
              className="lg:hidden text-sm text-gray-500 hover:text-white transition"
            >
              {backLabel}
            </Link>
          )}
          <motion.button
            whileHover={hasContent ? { scale: 1.03 } : {}}
            whileTap={hasContent ? { scale: 0.97 } : {}}
            onClick={handleSubmit}
            disabled={!hasContent}
            className="ml-auto px-6 py-3 rounded-xl text-sm font-bold text-white transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            style={{ background: `linear-gradient(135deg, ${color}, #a855f7)` }}
          >
            <Rocket size={14} />
            {previousSubmission ? resubmitLabel : submitLabel}
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default ChallengeWorkspace;
