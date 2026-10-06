import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import AuthModal from "./AuthModal";
import Onboarding from "./Onboarding";
import { linkReferralSignup } from "../utils/referralHelper";
import { ensureSignupBonus } from "../utils/pointsHelper";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authInitialView, setAuthInitialView] = useState("login");
  const [activeReferralCode, setActiveReferralCode] = useState(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const ref = urlParams.get("ref");
      if (ref) return ref.trim().toUpperCase();
      return localStorage.getItem("gr_referral_code") || null;
    }
    return null;
  });
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Check URL parameters for referral code e.g. ?ref=GLITCH-XXXX
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get("ref");
    if (refCode) {
      const cleanRef = refCode.trim().toUpperCase();
      localStorage.setItem("gr_referral_code", cleanRef);
      setActiveReferralCode(cleanRef);
    }

    // Handle URL hash error parameters (e.g., expired confirmation links)
    if (window.location.hash && window.location.hash.includes("error=")) {
      try {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const errorDesc = hashParams.get("error_description");
        if (errorDesc) {
          const cleanErr = decodeURIComponent(errorDesc).replace(/\+/g, " ");
          setAuthInitialView("login");
          setIsAuthOpen(true);
          setTimeout(() => {
            window.dispatchEvent(
              new CustomEvent("set_auth_modal_error", {
                detail: { error: cleanErr },
              })
            );
          }, 200);
        }
      } catch (err) {
        console.error("Error parsing auth URL hash:", err);
      }
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }

    // Single robust session initialization
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        const u = session?.user || null;
        setUser(u);
        setLoading(false);
        if (u) {
          ensureSignupBonus(u.id);
        } else if (refCode || localStorage.getItem("gr_referral_code")) {
          // If unauthenticated and arrived via referral link, auto-open AuthModal in signup mode
          if (refCode) {
            setAuthInitialView("signup");
            setTimeout(() => {
              setIsAuthOpen(true);
            }, 600);
          }
        }
      })
      .catch((err) => {
        console.error("Auth session check error:", err);
        setUser(null);
        setLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const currentUser = session?.user || null;
        setUser(currentUser);
        setLoading(false);

        if (_event === "SIGNED_IN" && currentUser) {
          ensureSignupBonus(currentUser.id);

          const savedRefCode =
            localStorage.getItem("gr_referral_code") ||
            currentUser.user_metadata?.referral_code;
          if (savedRefCode) {
            linkReferralSignup(currentUser.id, savedRefCode)
              .then(() => {
                localStorage.removeItem("gr_referral_code");
                setActiveReferralCode(null);
              })
              .catch((e) => console.error("Referral linking error:", e));
          }

          const key = `onboarding_done_${currentUser.id}`;
          const alreadyOnboarded = localStorage.getItem(key);

          if (!alreadyOnboarded) {
            const createdAt = new Date(currentUser.created_at).getTime();
            // Show onboarding tour for newly created accounts (within 24 hours) that have not completed it
            const isNewUser = Date.now() - createdAt < 24 * 60 * 60 * 1000;

            if (isNewUser) {
              setTimeout(() => setShowOnboarding(true), 600);
            }
          }
        }

        if (_event === "SIGNED_OUT") {
          setShowOnboarding(false);
        }
      }
    );

    const handleOpenAuth = (e) => {
      const targetView = e?.detail?.view || "login";
      setAuthInitialView(targetView);
      setIsAuthOpen(true);
    };
    const handleTriggerOnboarding = () => setShowOnboarding(true);

    window.addEventListener("open_auth_modal", handleOpenAuth);
    window.addEventListener("trigger_onboarding", handleTriggerOnboarding);

    return () => {
      listener.subscription.unsubscribe();
      window.removeEventListener("open_auth_modal", handleOpenAuth);
      window.removeEventListener("trigger_onboarding", handleTriggerOnboarding);
    };
  }, []);

  const openAuth = (view = "login") => {
    setAuthInitialView(view);
    setIsAuthOpen(true);
  };
  const closeAuth = () => {
    setIsAuthOpen(false);
    setAuthInitialView("login");
  };

  const finishOnboarding = () => {
    if (user) {
      localStorage.setItem(`onboarding_done_${user.id}`, "true");
    }
    setShowOnboarding(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        openAuth,
        closeAuth,
        referralCode: activeReferralCode,
      }}
    >
      {children}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={closeAuth}
        initialView={authInitialView}
        referralCode={activeReferralCode}
      />
      {showOnboarding && <Onboarding onFinish={finishOnboarding} />}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
