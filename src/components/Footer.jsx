import React from "react";
import {
  FaDiscord,
  FaInstagram,
  FaTwitter,
  FaGithub,
  FaLinkedin,
} from "react-icons/fa";
import { NavLink } from "react-router-dom";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-black text-gray-300 py-10 border-t border-gray-800 relative overflow-hidden">
      {/* Glitch Room Title with glitch effect */}
      <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-8 glitch">
        The Glitch Room
      </h2>

      {/* Links */}
      <div className="max-w-[1100px] mx-auto px-6 grid md:grid-cols-4 sm:grid-cols-2 gap-10 text-center md:text-left">
        {/* Explore */}
        <div>
          <h4 className="text-xl font-bold text-pink-500 mb-3">Explore</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <NavLink to="/about" className="hover:text-pink-400 transition">
                About
              </NavLink>
            </li>
            <li>
              <a href="/features" className="hover:text-pink-400 transition">
                Features
              </a>
            </li>
            <li>
              <Link to="/process" className="hover:text-pink-400 transition">
                How It Works
              </Link>
            </li>
            <li>
              <a href="#community" className="hover:text-pink-400 transition">
                Community
              </a>
            </li>
          </ul>
        </div>

        {/* Resources */}
        <div>
          <h4 className="text-xl font-bold text-cyan-400 mb-3">Resources</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="#blog" className="hover:text-cyan-300 transition">
                Blog
              </a>
            </li>
            <li>
              <Link
                to="/helpCenter#faq"
                className="hover:text-cyan-300 transition"
              >
                FAQs
              </Link>
            </li>
            <li>
              <Link to="/helpCenter" className="hover:text-cyan-300 transition">
                Help Center
              </Link>
            </li>
            <li>
              <a href="#guidelines" className="hover:text-cyan-300 transition">
                Community Guidelines
              </a>
            </li>
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h4 className="text-xl font-bold text-purple-400 mb-3">Legal</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="#privacy" className="hover:text-purple-300 transition">
                Privacy Policy
              </a>
            </li>
            <li>
              <a href="#terms" className="hover:text-purple-300 transition">
                Terms of Service
              </a>
            </li>
            <li>
              <a href="#cookies" className="hover:text-purple-300 transition">
                Cookie Policy
              </a>
            </li>
          </ul>
        </div>

        {/* Connect */}
        <div>
          <h4 className="text-xl font-bold text-green-400 mb-3">Connect</h4>
          <div className="flex justify-center md:justify-start space-x-4 text-2xl">
            <a href="#" className="hover:text-green-300 transition">
              <FaDiscord />
            </a>
            <a href="#" className="hover:text-green-300 transition">
              <FaInstagram />
            </a>
            <a href="#" className="hover:text-green-300 transition">
              <FaTwitter />
            </a>
            <a href="#" className="hover:text-green-300 transition">
              <FaGithub />
            </a>
            <a href="#" className="hover:text-green-300 transition">
              <FaLinkedin />
            </a>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="mt-10 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} The Glitch Room. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
