import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Section from "../global/Section";
import { ASSETS } from "../../utils/assets";

// Module-level flag: once the intro has played, never wait again
let introHasPlayed = false;

const HeroSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLSpanElement>(null);
  const btnRef = useRef<HTMLAnchorElement>(null);
  const [bgReady, setBgReady] = useState(introHasPlayed);

  useEffect(() => {
    if (introHasPlayed) return;
    const handler = () => {
      introHasPlayed = true;
      setBgReady(true);
    };
    window.addEventListener("heroBackgroundReady", handler);
    const fallback = setTimeout(handler, 2500);
    return () => {
      window.removeEventListener("heroBackgroundReady", handler);
      clearTimeout(fallback);
    };
  }, []);

  useGSAP(
    () => {
      if (!bgReady) return;
      const els = [
        logoRef.current,
        titleRef.current,
        subtitleRef.current,
        btnRef.current,
      ];

      if (introHasPlayed && bgReady) {
        // Remount: quick fade-in, no dramatic intro
        gsap.fromTo(
          els,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.4,
            stagger: 0.08,
            ease: "power2.out",
          },
        );

        // Restart continuous animations
        gsap.to(logoRef.current, {
          y: -15,
          duration: 2,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          delay: 0.5,
        });
        gsap.to(titleRef.current, {
          scale: 1.03,
          duration: 2,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
          delay: 0.5,
        });
        return;
      }

      // First-time cinematic intro
      introHasPlayed = true;
      gsap.set(els, { opacity: 0 });

      const tl = gsap.timeline({ delay: 0.1 });

      tl.fromTo(
        logoRef.current,
        { scale: 0, opacity: 0, y: 60 },
        { scale: 1, opacity: 1, y: 0, duration: 1.2, ease: "back.out(2)" },
      );

      gsap.to(logoRef.current, {
        y: -15,
        duration: 2,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: 1.4,
      });

      gsap.to(titleRef.current, {
        scale: 1.03,
        duration: 2,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
        delay: 2.2,
      });

      tl.fromTo(
        [titleRef.current, subtitleRef.current, btnRef.current],
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, stagger: 0.22, ease: "power3.out" },
        "-=0.5",
      );
    },
    { scope: containerRef, dependencies: [bgReady] },
  );

  return (
    <div>
      <div ref={containerRef}>
        <Section
          divClassname="flex flex-col items-center justify-center text-center px-4"
          className="relative py-4 sm:py-8 lg:py-12"
        >
          {/* Logo */}
          <div className="flex justify-center items-center">
            <img
              ref={logoRef}
              className="glow-shadow z-10 aspect-square will-change-transform opacity-0"
              style={{ width: "min(35vh, 45vw, 18rem)" }}
              src={ASSETS.images.heroBackground}
              alt="Jelzy Candy Rush Logo"
            />
          </div>

          {/* Title */}
          <h1
            ref={titleRef}
            className="text-gradient-candy z-10 mt-2 sm:mt-3 font-bold font-orbitron leading-tight tracking-wide will-change-transform opacity-0"
            style={{ fontSize: "min(6vh, 5vw, 3.5rem)" }}
          >
            Jelzy Candy Rush
          </h1>

          {/* Subtitle */}
          <span
            ref={subtitleRef}
            className="z-10 text-subtle-gradient mt-1 sm:mt-2 font-semibold will-change-transform text-white/90 drop-shadow-md opacity-0 max-w-[80vw] sm:max-w-xl"
            style={{ fontSize: "min(2.8vh, 2.2vw, 1.25rem)" }}
          >
            Match Sweet. Crush Big. Win Every Level
          </span>

          {/* Button */}
          <a
            ref={btnRef}
            className="mt-3 sm:mt-5 z-10 inline-block transition-transform duration-300 hover:scale-110 will-change-transform opacity-0"
            target="_blank"
            href="https://play.google.com/store/apps/details?id=com.app.devstree.candy&hl=en_IN"
          >
            <img
              className="drop-shadow-lg"
              style={{ width: "min(14vh, 18vw, 10rem)" }}
              src={ASSETS.images.heroPlaystoreBtn}
              alt="google play store button"
            />
          </a>
        </Section>
      </div>
    </div>
  );
};

export default HeroSection;
