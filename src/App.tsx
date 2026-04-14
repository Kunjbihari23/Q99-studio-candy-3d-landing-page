import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useEffect } from "react";
import CandyLoader from "./components/common/CandyLoader";
import ContactUs from "./components/contact/ContactUs";
import ExperienceWorld from "./components/experience/ExperienceWorld";
import GameExperiences from "./components/game-experiences/GameExperiences";
gsap.registerPlugin(ScrollTrigger);

function App() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 2,
      wheelMultiplier: 1,
    });

    // Set up ScrollTrigger proxy for Lenis
    ScrollTrigger.scrollerProxy(document.body, {
      scrollTop(value) {
        if (arguments.length && value !== undefined) {
          lenis.scrollTo(value, { offset: 0, immediate: false });
        }
        return lenis.scroll;
      },
      getBoundingClientRect() {
        return {
          top: 0,
          left: 0,
          width: window.innerWidth,
          height: window.innerHeight,
        };
      },
    });

    lenis.on("scroll", ScrollTrigger.update);

    const tickerCallback = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);
    ScrollTrigger.refresh();

    // Handle window resize
    const handleResize = () => {
      ScrollTrigger.refresh();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      lenis.destroy();
      gsap.ticker.remove(tickerCallback);
      window.removeEventListener("resize", handleResize);
    };
  }, []);
  return (
    <CandyLoader>
      <ExperienceWorld />
      <GameExperiences />
      <ContactUs />
    </CandyLoader>
  );
}

export default App;
