"use client";

export default function Loader() {
  return (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm transition-all duration-300">
      <div className="relative flex items-center justify-center">
        <div className="h-20 w-20 rounded-full border-[3px] border-[#d4af37]/20 border-t-[#d4af37] animate-spin"></div>
        <div className="absolute h-12 w-12 rounded-full border-[3px] border-black/10 border-b-black animate-spin [animation-direction:reverse] [animation-duration:1.2s]"></div>
      </div>

      <div className="mt-6 text-center">
        <h2 className="text-lg font-semibold tracking-[0.3em] uppercase text-black">
          Perfumery
        </h2>
        <p className="mt-2 text-sm text-gray-500 animate-pulse">
          Loading Experience...
        </p>
      </div>
    </div>
  );
}
