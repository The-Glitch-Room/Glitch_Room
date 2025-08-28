import React, { useEffect, useRef, useState } from "react";
import { TbMenu2, TbMenu3 } from "react-icons/tb";
import { NavLink } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { FiUser, FiStar, FiGrid } from "react-icons/fi"; // ✅ icons for dropdown

const Navbar = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [user, setUser] = useState(null);

  const [openDropdown, setOpenDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const toggleMenu = () => setShowMenu(!showMenu);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);

    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null);
      }
    );

    // 👇 close dropdown if clicked outside
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) alert(error.message);
      else setShowAuthModal(false);
    } else {
      const fullName = e.target.fullName.value;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) alert(error.message);
      else setShowAuthModal(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <header
      className={`bg-[#0B0C10] fixed top-0 right-0 left-0 z-50 ${
        isScrolled ? "drop-shadow-[0_4px_25px_rgba(0,0,0,0.7)]" : ""
      }`}
    >
      <nav className="max-w-[1150px] mx-auto px-10 py-5 md:h-[18vh] h-[16vh] flex justify-between items-center">
        {/* Logo */}
        <NavLink
          to="/"
          end
          className="relative text-xl md:text-2xl font-extrabold glitch-text"
          data-text="THE GLITCH ROOM"
        >
          THE GLITCH ROOM
        </NavLink>

        {/* Desktop Menu */}
        <ul className="md:flex items-center gap-x-10 hidden">
          <li>
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                isActive
                  ? "font-semibold tracking-wide text-[#FF00C8] text-sm"
                  : "font-semibold tracking-wide text-white hover:text-[#00F0FF] text-sm transition"
              }
            >
              Home
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/about"
              className={({ isActive }) =>
                isActive
                  ? "font-semibold tracking-wide text-[#D600FF] text-sm"
                  : "font-semibold tracking-wide text-white hover:text-[#D600FF] text-sm transition"
              }
            >
              About Us
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/explore"
              className={({ isActive }) =>
                isActive
                  ? "font-semibold tracking-wide text-[#00F0FF] text-sm"
                  : "font-semibold tracking-wide text-white hover:text-[#00F0FF] text-sm transition"
              }
            >
              Explore
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/challenges"
              className={({ isActive }) =>
                isActive
                  ? "font-semibold tracking-wide text-[#FF00C8] text-sm"
                  : "font-semibold tracking-wide text-white hover:text-[#FF00C8] text-sm transition"
              }
            >
              Challenges
            </NavLink>
          </li>
        </ul>

        {/* Nav action */}
        <div className="flex items-center gap-x-5 text-sm">
          {user ? (
            <>
              {/* Avatar + Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <img
                  src={`https://ui-avatars.com/api/?name=${
                    user.user_metadata?.full_name || "User"
                  }&background=0D1117&color=00F0FF`}
                  alt="avatar"
                  className="w-10 h-10 rounded-full border-2 border-[#00F0FF] shadow-[0_0_10px_#00F0FF] transition-transform duration-300 hover:scale-105 hover:shadow-[0_0_20px_#FF00FF] cursor-pointer"
                  onClick={() => setOpenDropdown(!openDropdown)}
                />

                {openDropdown && (
                  <div className="absolute right-0 mt-3 w-48 bg-[#1a1a1a] border border-[#00F0FF]/30 rounded-xl shadow-lg py-2 z-50 animate-fadeIn">
                    <a
                      href="/profile"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-[#00F0FF]/20 transition"
                    >
                      <FiUser /> Your Profile
                    </a>
                    <a
                      href="/points"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-[#00F0FF]/20 transition"
                    >
                      <FiStar /> Your Points
                    </a>
                    <Link
                      to="/dashboard"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-white hover:bg-[#00F0FF]/20 transition"
                    >
                      <FiGrid /> Dashboard
                    </Link>
                  </div>
                )}
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="bg-gradient-to-r from-[#FF00C8] to-[#00F0FF] text-white px-4 py-2 rounded-full font-semibold hover:from-[#D600FF] hover:to-[#00C3FF] transition cursor-pointer shadow-lg"
              >
                Logout
              </button>
            </>
          ) : (
            // Login / Signup Modal (same as your code)
            <div className="relative">
              <button
                onClick={() => setShowAuthModal(!showAuthModal)}
                className="bg-gradient-to-r from-[#FF00C8] to-[#00F0FF] text-white px-4 py-2 rounded-full font-semibold hover:from-[#D600FF] hover:to-[#00C3FF] transition cursor-pointer shadow-lg"
              >
                {isLogin ? "Login" : "Sign Up"}
              </button>

              {showAuthModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
                  <div className="bg-[#1A1A1A] p-6 rounded-2xl w-[90%] md:w-[400px] shadow-2xl relative border border-[#FF00C8]/40">
                    <h2 className="text-2xl font-bold text-center mb-4 text-[#00F0FF]">
                      {isLogin ? "Login" : "Create Account"}
                    </h2>

                    <form className="space-y-4" onSubmit={handleAuth}>
                      {!isLogin && (
                        <input
                          type="text"
                          name="fullName"
                          placeholder="Full Name"
                          className="w-full p-2 bg-[#0B0C10] border border-[#FF00C8]/40 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#00F0FF]"
                        />
                      )}
                      <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        className="w-full p-2 bg-[#0B0C10] border border-[#FF00C8]/40 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#00F0FF]"
                      />
                      <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        className="w-full p-2 bg-[#0B0C10] border border-[#FF00C8]/40 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#00F0FF]"
                      />

                      <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-[#FF00C8] to-[#00F0FF] text-white py-2 rounded-md hover:from-[#D600FF] hover:to-[#00C3FF] transition cursor-pointer shadow-lg"
                      >
                        {isLogin ? "Login" : "Sign Up"}
                      </button>
                    </form>

                    <p className="text-sm text-center mt-4 text-gray-300">
                      {isLogin
                        ? "Don't have an account?"
                        : "Already have an account?"}{" "}
                      <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-[#FF00C8] font-semibold hover:underline cursor-pointer"
                      >
                        {isLogin ? "Sign Up" : "Login"}
                      </button>
                    </p>

                    <button
                      onClick={() => setShowAuthModal(false)}
                      className="absolute top-3 right-3 text-gray-400 hover:text-white cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mobile menu */}
          <button className="text-white text-xl md:hidden" onClick={toggleMenu}>
            {showMenu ? <TbMenu3 /> : <TbMenu2 />}
          </button>
        </div>

        {/* Mobile dropdown nav */}
        <ul
          className={`flex flex-col gap-y-10 bg-[#1A1A1A]/95 backdrop-blur-xl rounded-xl shadow-xl p-10 items-center gap-x-20 top-60 md:hidden absolute -left-full transform -translate-1/2 transition-all duration-500 ${
            showMenu ? "left-1/2" : ""
          }`}
        >
          <li>
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                isActive
                  ? "font-semibold tracking-wide text-[#FF00C8] text-sm"
                  : "font-semibold tracking-wide text-white hover:text-[#FF00C8] text-sm transition"
              }
            >
              Home
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/about"
              className={({ isActive }) =>
                isActive
                  ? "font-semibold tracking-wide text-[#D600FF] text-sm"
                  : "font-semibold tracking-wide text-white hover:text-[#D600FF] text-sm transition"
              }
            >
              About Us
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/explore"
              className={({ isActive }) =>
                isActive
                  ? "font-semibold tracking-wide text-[#00F0FF] text-sm"
                  : "font-semibold tracking-wide text-white hover:text-[#00F0FF] text-sm transition"
              }
            >
              Explore
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/challenges"
              className={({ isActive }) =>
                isActive
                  ? "font-semibold tracking-wide text-[#FF00C8] text-sm"
                  : "font-semibold tracking-wide text-white hover:text-[#FF00C8] text-sm transition"
              }
            >
              Challenges
            </NavLink>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Navbar;
