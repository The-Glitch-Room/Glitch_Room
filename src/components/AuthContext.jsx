import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import AuthModal from "./AuthModal";
import Onboarding from "./Onboarding";
import { linkReferralSignup } from "../utils/referralHelper";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Check URL parameters for referral code e.g. ?ref=GLITCH-XXXX
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get("ref");
    if (refCode) {
      localStorage.setItem("gr_referral_code", refCode.trim().toUpperCase());
    }

    // Single robust session initialization
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user || null);
        setLoading(false);
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
          const savedRefCode = localStorage.getItem("gr_referral_code");
          if (savedRefCode) {
            linkReferralSignup(currentUser.id, savedRefCode)
              .then(() => localStorage.removeItem("gr_referral_code"))
              .catch((e) => console.error("Referral linking error:", e));
          }

          const key = `onboarding_done_${currentUser.id}`;
          const alreadyOnboarded = localStorage.getItem(key);

          if (!alreadyOnboarded) {
            const createdAt = new Date(currentUser.created_at).getTime();
            const lastSignIn = new Date(currentUser.last_sign_in_at).getTime();
            const isNewUser = Math.abs(createdAt - lastSignIn) < 5000;

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

    const handleOpenAuth = () => setIsAuthOpen(true);
    window.addEventListener("open_auth_modal", handleOpenAuth);

    return () => {
      listener.subscription.unsubscribe();
      window.removeEventListener("open_auth_modal", handleOpenAuth);
    };
  }, []);

  const openAuth = () => setIsAuthOpen(true);
  const closeAuth = () => setIsAuthOpen(false);

  const finishOnboarding = () => {
    if (user) {
      localStorage.setItem(`onboarding_done_${user.id}`, "true");
    }
    setShowOnboarding(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, openAuth, closeAuth }}>
      {children}
      <AuthModal isOpen={isAuthOpen} onClose={closeAuth} />
      {showOnboarding && <Onboarding onFinish={finishOnboarding} />}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
