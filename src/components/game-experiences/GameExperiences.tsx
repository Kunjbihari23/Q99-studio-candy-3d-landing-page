import { useCallback, useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const EXPERIENCES = [
  { id: 1, src: "/Images/experience/exp1.jpeg", title: "Vibrant Puzzles" },
  { id: 2, src: "/Images/experience/exp2.jpeg", title: "Epic Powerups" },
  { id: 3, src: "/Images/experience/exp3.jpeg", title: "Candy Combos" },
  { id: 4, src: "/Images/experience/exp4.jpeg", title: "Global Leaderboards" },
];

const MOBILE_BREAKPOINT = 768;

const GameExperiences = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(1);
  const activeIndexRef = useRef(activeIndex);
  const hasEnteredRef = useRef(false);
  const triggerLayoutRef = useRef<
    (activeIdx: number, isInitial?: boolean) => void
  >(() => {});

  const getXSpacing = useCallback(
    () => (window.innerWidth < MOBILE_BREAKPOINT ? 140 : 250),
    [],
  );

  useEffect(() => {
    activeIndexRef.current = activeIndex;
    if (hasEnteredRef.current) {
      triggerLayoutRef.current(activeIndex, false);
    }
  }, [activeIndex]);

  useGSAP(
    () => {
      if (!containerRef.current) return;

      const cards = cardsRef.current.filter(
        (card): card is HTMLDivElement => card !== null,
      );
      if (cards.length === 0) return;

      const triggerLayout = (activeIdx: number, isInitial = false) => {
        const xSpacing = getXSpacing();

        cards.forEach((card, i) => {
          const diff = i - activeIdx;
          const absDiff = Math.abs(diff);
          const isActive = diff === 0;
          const zIndex = 10 - absDiff;
          const scale = Math.max(0.58, isActive ? 1 : 0.82 - absDiff * 0.1);
          const xOffset = diff * xSpacing;
          const yOffset = absDiff * 30;

          gsap.killTweensOf(card);
          gsap.set(card, { zIndex });
          gsap.to(card, {
            x: xOffset,
            y: yOffset,
            scale,
            rotationY: diff * -25,
            rotationZ: diff * 5,
            rotationX: 0,
            opacity: isActive ? 1 : 0.45,
            duration: isInitial ? 1.4 : 0.55,
            delay: isInitial ? i * 0.1 : 0,
            ease: isInitial ? "back.out(1.12)" : "power2.out",
            overwrite: "auto",
            force3D: true,
          });
        });
      };

      triggerLayoutRef.current = triggerLayout;

      gsap.set(cards, {
        y: 320,
        opacity: 0,
        rotationX: 40,
        scale: 0.6,
        transformPerspective: 1200,
        transformOrigin: "50% 50% -200px",
      });

      const scrollTrigger = ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top 55%",
        once: true,
        onEnter: () => {
          hasEnteredRef.current = true;
          triggerLayout(activeIndexRef.current, true);
        },
      });

      const handleResize = () => {
        if (hasEnteredRef.current) {
          triggerLayout(activeIndexRef.current, false);
        }
      };
      window.addEventListener("resize", handleResize, { passive: true });

      return () => {
        window.removeEventListener("resize", handleResize);
        scrollTrigger.kill();
      };
    },
    { scope: containerRef },
  );

  const handleCardClick = useCallback((index: number) => {
    setActiveIndex((current) => (current === index ? current : index));
  }, []);

  const navigate = useCallback((direction: "next" | "prev") => {
    setActiveIndex((current) =>
      direction === "next"
        ? (current + 1) % EXPERIENCES.length
        : (current - 1 + EXPERIENCES.length) % EXPERIENCES.length,
    );
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative w-full min-h-[120vh] bg-[#12061f] py-32 overflow-hidden flex flex-col items-center z-20"
    >
      <div className="absolute inset-0 top-0 h-40 bg-linear-to-b from-[#12061f] to-transparent z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#2a0d45_0%,transparent_70%)] opacity-60" />

      <div className="container-custom relative z-20 text-center mb-20 pointer-events-none">
        <span className="inline-flex rounded-full border border-white/14 bg-white/8 px-4 py-1 font-orbitron text-sm uppercase tracking-[0.3em] text-[#ff8ac5] shadow-[0_0_20px_rgba(255,138,197,0.3)]">
          Sneak Peek
        </span>
        <h2 className="mt-6 font-orbitron text-5xl md:text-7xl font-bold text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
          Game{" "}
          <span className="text-transparent bg-clip-text bg-linear-to-r from-[#76e0ff] to-[#ff74c6]">
            Experiences
          </span>
        </h2>

        {/* Navigation Dot & Arrows */}
        <div className="flex items-center justify-center gap-8 mt-12 pointer-events-auto">
          <button
            onClick={() => navigate("prev")}
            className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center text-white bg-white/5 hover:bg-white/10 hover:border-white/30 transition-all group active:scale-95 cursor-pointer"
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="group-hover:-translate-x-1 transition-transform"
            >
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>

          <div className="flex justify-center gap-4">
            {EXPERIENCES.map((exp, i) => (
              <button
                key={exp.id}
                onClick={() => handleCardClick(i)}
                className={`w-4 h-4 rounded-full transition-all duration-300 cursor-pointer ${
                  activeIndex === i
                    ? "bg-[#76e0ff] scale-125 shadow-[0_0_15px_#76e0ff]"
                    : "bg-white/20 hover:bg-white/40"
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => navigate("next")}
            className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center text-white bg-white/5 hover:bg-white/10 hover:border-white/30 transition-all group active:scale-95 cursor-pointer"
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="group-hover:translate-x-1 transition-transform"
            >
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </div>

      <div className="relative w-full max-w-7xl mx-auto flex justify-center items-center h-[540px] md:h-[640px] perspective-[1500px] mt-10">
        {EXPERIENCES.map((exp, i) => {
          const isActive = activeIndex === i;

          return (
            <div
              key={exp.id}
              ref={(el) => {
                cardsRef.current[i] = el;
              }}
              onClick={() => handleCardClick(i)}
              className="absolute w-[240px] sm:w-[280px] md:w-[320px] lg:w-[400px] aspect-9/16 rounded-[2.5rem] overflow-hidden border border-white/10 group will-change-transform cursor-pointer shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)]"
            >
              <div
                className={`absolute inset-0 bg-linear-to-b from-black/20 via-transparent to-black/90 z-10 transition-opacity duration-500`}
              />

              <img
                src={exp.src}
                alt={exp.title}
                className={`w-full h-full object-cover transition-transform duration-700 ease-out object-center ${isActive ? "scale-105" : "scale-100 group-hover:scale-105"}`}
              />

              <div
                className={`absolute bottom-0 left-0 right-0 p-8 z-20 transition-all duration-500 flex flex-col items-center justify-end ${isActive ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 group-hover:translate-y-2 group-hover:opacity-100"}`}
              >
                <h3 className="font-orbitron font-bold text-2xl md:text-3xl text-white drop-shadow-lg shadow-black text-center uppercase tracking-wider">
                  {exp.title}
                </h3>
                <div className="mt-4 w-16 h-1.5 bg-linear-to-r from-[#76e0ff] to-[#ff74c6] rounded-full shadow-[0_0_15px_rgba(255,116,198,0.6)]" />
              </div>

              {/* Active Glow */}
              <div
                className={`absolute inset-0 shadow-[inset_0_0_60px_rgba(118,224,255,0.3)] transition-opacity duration-500 z-30 pointer-events-none rounded-[2.5rem] border-2 border-[#76e0ff]/30 ${isActive ? "opacity-100" : "opacity-0"}`}
              />

              {/* Hover Glow (Inactive cards) */}
              <div
                className={`absolute inset-0 bg-white/5 transition-opacity duration-500 z-30 pointer-events-none rounded-[2.5rem] ${!isActive ? "opacity-0 group-hover:opacity-100" : "opacity-0"}`}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default GameExperiences;
