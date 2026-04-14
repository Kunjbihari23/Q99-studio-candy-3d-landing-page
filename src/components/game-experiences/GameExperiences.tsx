import { useCallback, useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ASSETS } from "../../utils/assets";

gsap.registerPlugin(ScrollTrigger);

const EXPERIENCES = [
  { id: 1, src: ASSETS.images.experiences[0], title: "Vibrant Puzzles" },
  { id: 2, src: ASSETS.images.experiences[1], title: "Epic Powerups" },
  { id: 3, src: ASSETS.images.experiences[2], title: "Candy Combos" },
  { id: 4, src: ASSETS.images.experiences[3], title: "Global Leaderboards" },
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
    () =>
      window.innerWidth < MOBILE_BREAKPOINT
        ? 140
        : Math.min(250, window.innerWidth * 0.15),
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
      className="relative z-20 flex w-full flex-col items-center overflow-hidden bg-[#12061f] py-6 sm:py-16 lg:py-24"
      style={{ minHeight: "fit-content" }}
    >
      <div className="absolute inset-0 h-40 bg-linear-to-b from-[#12061f] to-transparent z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#2a0d45_0%,transparent_70%)] opacity-60" />

      <div className="container-custom pointer-events-none relative z-20 mb-6 sm:mb-14 text-center">
        <span className="inline-flex rounded-full border border-white/14 bg-white/8 px-3 py-0.5 font-orbitron text-xs uppercase tracking-[0.3em] text-[#ff8ac5] shadow-[0_0_20px_rgba(255,138,197,0.3)]">
          Sneak Peek
        </span>
        <h2
          className="mt-3 sm:mt-6 font-orbitron font-bold text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]"
          style={{ fontSize: "min(6vh, 5vw, 3.5rem)" }}
        >
          Game{" "}
          <span className="text-transparent bg-clip-text bg-linear-to-r from-[#76e0ff] to-[#ff74c6]">
            Experiences
          </span>
        </h2>

        {/* Navigation Dot & Arrows */}
        <div className="pointer-events-auto mt-4 sm:mt-10 flex items-center justify-center gap-3 sm:gap-8">
          <button
            onClick={() => navigate("prev")}
            className="group flex h-9 w-9 sm:h-12 sm:w-12 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-all hover:border-white/30 hover:bg-white/10 active:scale-95"
          >
            <svg
              width="24"
              height="24"
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

          <div className="flex justify-center gap-2 sm:gap-4">
            {EXPERIENCES.map((exp, i) => (
              <button
                key={exp.id}
                onClick={() => handleCardClick(i)}
                className={`h-3 w-3 sm:h-3.5 sm:w-3.5 cursor-pointer rounded-full transition-all duration-300 ${
                  activeIndex === i
                    ? "bg-[#76e0ff] scale-125 shadow-[0_0_15px_#76e0ff]"
                    : "bg-white/20 hover:bg-white/40"
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => navigate("next")}
            className="group flex h-9 w-9 sm:h-12 sm:w-12 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-all hover:border-white/30 hover:bg-white/10 active:scale-95"
          >
            <svg
              width="24"
              height="24"
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

      <div
        className="relative mx-auto mt-4 sm:mt-8 flex w-full max-w-7xl items-center justify-center perspective-[1500px]"
        style={{ height: "min(460px, 55vh)" }}
      >
        {EXPERIENCES.map((exp, i) => {
          const isActive = activeIndex === i;

          return (
            <div
              key={exp.id}
              ref={(el) => {
                cardsRef.current[i] = el;
              }}
              onClick={() => handleCardClick(i)}
              className="group absolute aspect-9/16 cursor-pointer overflow-hidden rounded-[1.5rem] border border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] will-change-transform"
              style={{ width: "min(250px, 22vw, 35vh)" }}
            >
              <div className="absolute inset-0 bg-linear-to-b from-black/20 via-transparent to-black/90 z-10 transition-opacity duration-500" />

              <img
                src={exp.src}
                alt={exp.title}
                className={`w-full h-full object-cover transition-transform duration-700 ease-out object-center ${isActive ? "scale-105" : "scale-100 group-hover:scale-105"}`}
              />

              <div
                className={`absolute bottom-0 left-0 right-0 z-20 flex flex-col items-center justify-end p-3 sm:p-5 transition-all duration-500 ${isActive ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 group-hover:translate-y-2 group-hover:opacity-100"}`}
              >
                <h3
                  className="text-center font-orbitron font-bold uppercase tracking-wider text-white drop-shadow-lg shadow-black"
                  style={{ fontSize: "min(2.5vh, 1.8vw, 1.1rem)" }}
                >
                  {exp.title}
                </h3>
                <div className="mt-2 w-12 h-1 bg-linear-to-r from-[#76e0ff] to-[#ff74c6] rounded-full shadow-[0_0_15px_rgba(255,116,198,0.6)]" />
              </div>

              {/* Active Glow */}
              <div
                className={`absolute inset-0 shadow-[inset_0_0_60px_rgba(118,224,255,0.3)] transition-opacity duration-500 z-30 pointer-events-none rounded-[1.5rem] border-2 border-[#76e0ff]/30 ${isActive ? "opacity-100" : "opacity-0"}`}
              />

              {/* Hover Glow (Inactive cards) */}
              <div
                className={`absolute inset-0 bg-white/5 transition-opacity duration-500 z-30 pointer-events-none rounded-[1.5rem] ${!isActive ? "opacity-0 group-hover:opacity-100" : "opacity-0"}`}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default GameExperiences;
