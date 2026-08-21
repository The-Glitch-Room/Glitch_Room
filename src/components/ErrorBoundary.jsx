import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#070709] text-white flex flex-col items-center justify-center p-6 text-center font-sans relative">
          <div className="bg-[#0c0c16] border border-purple-500/30 rounded-3xl p-8 max-w-md w-full space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-[#FF00C8]/15 border border-[#FF00C8]/30 flex items-center justify-center mx-auto text-[#FF00C8]">
              ⚡
            </div>
            <h2 className="text-lg font-bold text-white">Temporary Room View Issue</h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              We encountered a minor display issue loading this section. Tap below to reload cleanly.
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 rounded-xl bg-[#FF00C8] hover:bg-[#d600a8] text-white text-xs font-bold transition shadow-lg shadow-[#FF00C8]/25 cursor-pointer"
              >
                Reload Page
              </button>
              <button
                type="button"
                onClick={() => (window.location.href = "/pro-rooms")}
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-gray-200 text-xs font-bold transition cursor-pointer"
              >
                Pro Rooms List
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
