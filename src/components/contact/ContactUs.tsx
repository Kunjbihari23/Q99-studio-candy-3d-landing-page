const ContactUs = () => {
  const openLink = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <section className="relative z-30 flex w-full flex-col items-center justify-center overflow-hidden bg-[#0c0416] py-20 sm:py-24 lg:py-32">
      {/* Subtle background glow */}
      <div className="absolute inset-x-0 bottom-0 h-[500px] bg-linear-to-t from-[#1b2b0a]/30 to-transparent pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-[#fb00ff]/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="container-custom relative z-10 flex flex-col items-center py-8 text-center sm:py-10">
        <h2 className="max-w-4xl px-4 font-orbitron text-2xl leading-tight font-bold tracking-tight text-white drop-shadow-[0_2px_15px_rgba(0,0,0,0.7)] sm:text-3xl lg:text-5xl">
          Let&apos;s build your next{" "}
          <span className="text-[#92cc41]">addictive</span> mobile game.
        </h2>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-8 px-4 sm:mt-16 sm:gap-12 lg:mt-20 lg:gap-14">
          {/* Magenta Glow Candy Button */}
          <button
            onClick={() => openLink("http://q99studio.com/contact/")}
            className="group relative cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95"
          >
            {/* Main Surface */}
            <div className="relative overflow-hidden rounded-[2.5rem] border-t-4 border-l-2 border-white/10 border-t-white/30 bg-[#b01c7d] px-8 py-4 shadow-[0_10px_30px_rgba(176,28,125,0.4)] sm:px-14 sm:py-6">
              <div className="absolute inset-0 rounded-[2.5rem] bg-[#b01c7d] opacity-50 blur-[20px] group-hover:blur-[30px] group-hover:opacity-100 transition-all duration-500 animate-pulse" />
              <span className="relative z-10 font-orbitron text-xl font-black uppercase tracking-[0.2em] text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.4)] italic sm:text-2xl lg:text-3xl">
                Contact Us
              </span>

              {/* Glossy Reflection (Top) */}
              <div className="absolute top-2 left-8 w-20 h-4 bg-white/40 rounded-full blur-[2px] rotate-[-2deg]" />

              {/* Shimmer Sweep Animation */}
              <div className="absolute top-0 -left-[100%] w-1/2 h-full bg-linear-to-r from-transparent via-white/20 to-transparent skew-x-[-25deg] transition-all duration-700 group-hover:left-[150%]" />

              {/* Inner Bevel Light */}
              <div className="absolute inset-0 rounded-[2.5rem] shadow-[inset_0_-6px_10px_rgba(0,0,0,0.3),_inset_0_2px_10px_rgba(255,255,255,0.5)]" />
            </div>
          </button>

          {/* Lime Green Glow Candy Button */}
          <button
            onClick={() =>
              openLink(
                "https://play.google.com/store/apps/details?id=com.app.devstree.candy&hl=en_IN",
              )
            }
            className="group relative cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95"
          >
            {/* Main Surface */}
            <div className="relative overflow-hidden rounded-[2.5rem] border-t-4 border-l-2 border-white/20 border-t-white/50 bg-[#92cc41] px-8 py-4 shadow-[0_10px_30px_rgba(146,204,65,0.4)] sm:px-14 sm:py-6">
              <div className="absolute inset-0 rounded-[2.5rem] bg-[#92cc41] opacity-50 blur-[20px] group-hover:blur-[30px] group-hover:opacity-100 transition-all duration-500 animate-pulse" />
              <span className="relative z-10 font-orbitron text-xl font-black uppercase tracking-[0.2em] text-[#0c0416] drop-shadow-[0_1px_5px_rgba(0,0,0,0.2)] italic sm:text-2xl lg:text-3xl">
                Download Now
              </span>

              {/* Glossy Reflection (Top) */}
              <div className="absolute top-2 left-8 w-20 h-4 bg-white/60 rounded-full blur-[2px] rotate-[-2deg]" />

              {/* Shimmer Sweep Animation */}
              <div className="absolute top-0 -left-[100%] w-1/2 h-full bg-linear-to-r from-transparent via-white/30 to-transparent skew-x-[-25deg] transition-all duration-700 group-hover:left-[150%]" />

              {/* Inner Bevel Light */}
              <div className="absolute inset-0 rounded-[2.5rem] shadow-[inset_0_-6px_10px_rgba(0,0,0,0.2),_inset_0_2px_12px_rgba(255,255,255,0.7)]" />
            </div>
          </button>
        </div>
      </div>

      {/* Decorative Candy Pieces */}
      <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-[#92cc41] rounded-full blur-[1px] opacity-40 animate-pulse" />
      <div className="absolute bottom-1/3 right-1/4 w-4 h-4 bg-[#b01c7d] rotate-45 opacity-30 animate-bounce" />
    </section>
  );
};

export default ContactUs;
