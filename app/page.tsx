"use client";
import Image from "next/image";
import Music from "./components/music";
import { useEffect, useState } from "react";
import { MdDarkMode } from "react-icons/md";
import { FaBriefcase } from "react-icons/fa";

export default function Home() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isNight, setIsNight] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // setState only inside callbacks, so no "setState in effect" lint error
    const first = setTimeout(() => setCurrentTime(new Date()), 0);
    const id = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  // close the khata with the Escape key
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const toggleDayNight = () => setIsNight(!isNight);

  return (
    <div
      className={`${
        isNight
          ? "bg-[url('/night-tea-mobile.jpg')] md:bg-[url('/night-teashop.jpg')]"
          : "bg-[url('/day-tea-mobile.png')] md:bg-[url('/morning-teashop.jpg')]"
      } relative min-h-dvh overflow-hidden bg-cover bg-center`}
    >
      <div
        className={`pointer-events-none absolute inset-0 bg-black transition-opacity duration-500 md:hidden ${
          isNight ? "opacity-50" : "opacity-0"
        }`}
      />

      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent" />

      <div className="relative z-70 mt-6 flex items-center justify-between px-4 md:mt-10 md:px-20">
        <div className="flex items-center gap-2 rounded-4xl bg-white/20 px-3 py-2 pr-4 backdrop-blur-lg md:gap-3 md:pr-5">
          <Image
            src="/logo.jpg"
            alt="logo"
            height={1500}
            width={1500}
            className="h-8 w-auto origin-center rounded-full"
          />
          <h1 className="pt-1 font-[family-name:var(--font-anek)] text-base font-bold text-[#1F1A14] md:pt-2 md:text-lg">
            चिया चौतारी
          </h1>
        </div>

        <div className="flex items-center gap-2 rounded-full bg-white/30 px-4 py-2 backdrop-blur md:px-5 md:py-3">
          <h1 className="whitespace-nowrap text-sm md:text-base">
            {currentTime
              ? currentTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })
              : "--:--"}
          </h1>
          <div
            onClick={toggleDayNight}
            className={`flex w-10 cursor-pointer rounded-full text-lg shadow-xl transition-all ${
              isNight ? "justify-end bg-black/90" : "bg-neutral-400"
            }`}
          >
            <MdDarkMode className="w-5 rounded-full bg-white text-black" />
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute z-60 mt-16 flex w-full flex-col items-center justify-center px-4 text-center font-[family-name:var(--font-anek)] font-bold text-[#FFB703] md:mt-30">
        <p className="text-base text-white text-shadow-lg md:text-xl">
          भरतपुर–६, चितवन
        </p>
        <h1 className="origin-center text-7xl mt-8 [word-spacing:-0.08em] sm:text-7xl md:text-[120px]">
          तातो चिया, मिठो गफ
        </h1>
        <p className="mt-2 text-sm text-white/90 md:absolute md:bottom-5 md:-mb-6 md:text-lg">
          -A nostalgic Nepali chiya pasal experience.-
        </p>
      </div>

      <Music />

      <div className="absolute bottom-14 z-50 flex w-full flex-wrap items-center justify-center gap-2 px-4 text-center text-xs text-white/90 md:bottom-15 md:text-sm">
        <h1>शुभ बिहानी, खाता धेरै भइसक्यो, अलि अलि घटाइदिनु।</h1>
        <button
          className="rounded-full bg-white px-3 py-1 text-black"
          onClick={() => setOpen(true)}
        >
          खाता
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()} 
            className="flex flex-col items-center gap-3"
          >
            <Image
              src="/khaata.jpg"
              alt="khata"
              width={1000}
              height={1000}
              className="h-150 max-h-[75vh] w-auto max-w-[92vw]"
            />
            <button
              onClick={() => setOpen(false)}
              className="rounded-full bg-white px-4 py-1 text-sm text-black"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <a
        href="https://abishekpariyar.com"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Abishek Pariyar portfolio"
        className="absolute bottom-0 z-50 flex w-full items-center justify-center gap-2 pb-2 text-xs text-white"
      >
        Abishek Pariyar
        <FaBriefcase />
      </a>
    </div>
  );
}
