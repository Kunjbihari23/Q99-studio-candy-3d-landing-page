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
    <div ref={containerRef}>
      <Section
        divClassname="flex flex-col items-center justify-center text-center px-4"
        className="relative py-10 sm:py-16 lg:py-24"
      >
        {/* Logo */}
        <div className="flex justify-center items-center">
          <img
            ref={logoRef}
            className="glow-shadow z-10 aspect-square w-[clamp(12rem,25vw,22rem)] sm:w-[clamp(16rem,300vw,28rem)] will-change-transform opacity-0"
            src={ASSETS.images.heroBackground}
            alt="Jelzy Candy Rush Logo"
          />
        </div>

        {/* Title */}
        <h1
          ref={titleRef}
          className="text-gradient-candy z-10 mt-4 text-[clamp(2.5rem,8vw,5rem)] font-bold font-orbitron leading-tight tracking-wide will-change-transform opacity-0"
        >
          Jelzy Candy Rush
        </h1>

        {/* Subtitle */}
        <span
          ref={subtitleRef}
          className="z-10 text-subtle-gradient mt-2 text-[clamp(1rem,3vw,1.75rem)] font-semibold max-w-[90%] sm:max-w-xl will-change-transform text-white/90 drop-shadow-md opacity-0"
        >
          Match Sweet. Crush Big. Win Every Level
        </span>

        {/* Button */}
        <a
          ref={btnRef}
          className="mt-6 sm:mt-8 z-10 inline-block transition-transform duration-300 hover:scale-110 will-change-transform opacity-0"
          target="_blank"
          href="https://play.google.com/store/apps/details?id=com.app.devstree.chess&hl=en_IN"
        >
          <img
            className="w-36 sm:w-44 md:w-48 drop-shadow-lg"
            src={ASSETS.images.heroPlaystoreBtn}
            alt="google play store button"
          />
        </a>
      </Section>
    </div>
  );
};

export default HeroSection;
