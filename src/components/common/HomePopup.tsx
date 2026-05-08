"use client";
import React from "react";
import { X } from "lucide-react";

interface Props {
  onClose: () => void;
}

const HomePopup: React.FC<Props> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60">
      <div className="relative w-[90%] max-w-md bg-white rounded-2xl shadow-xl p-6 animate-fadeIn">
        
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-black"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-semibold mb-2 text-center">
          Welcome to Perfumery ✨
        </h2>

        <p className="text-sm text-gray-600 text-center mb-4">
          Discover your signature scent with us.
        </p>

        <button
          onClick={onClose}
          className="w-full mt-2 bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition"
        >
          Explore Now
        </button>
      </div>
    </div>
  );
};

export default HomePopup;
