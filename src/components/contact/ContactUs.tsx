const ContactUs = () => {
  const openLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <section className="relative w-full bg-[#0c0416] py-32 flex flex-col items-center justify-center overflow-hidden z-30">
      
      {/* Subtle background glow */}
      <div className="absolute inset-x-0 bottom-0 h-[500px] bg-linear-to-t from-[#1b2b0a]/30 to-transparent pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-[#fb00ff]/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="container-custom relative z-10 py-10 flex flex-col items-center text-center">
        <h2 className="font-orbitron text-3xl md:text-5xl text-white font-bold tracking-tight px-4 drop-shadow-[0_2px_15px_rgba(0,0,0,0.7)] leading-tight max-w-4xl">
          Let&apos;s build your next <span className="text-[#92cc41]">addictive</span> mobile game.
        </h2>
        
        <div className="flex flex-wrap items-center justify-center gap-14 mt-20 px-4">
          
          {/* Magenta Glow Candy Button */}
          <button 
            onClick={() => openLink('http://q99studio.com/contact/')}
            className="group relative px-14 py-6 cursor-pointer transition-all duration-300 active:scale-95 hover:scale-105"
          >
           
            
            {/* Main Surface */}
            <div className="relative px-14 py-6 rounded-[2.5rem] bg-[#b01c7d] border-t-4 border-white/30 border-l-2 border-white/10 overflow-hidden shadow-[0_10px_30px_rgba(176,28,125,0.4)]">
            <div className="absolute inset-0 rounded-[2.5rem] bg-[#b01c7d] opacity-50 blur-[20px] group-hover:blur-[30px] group-hover:opacity-100 transition-all duration-500 animate-pulse" />
              <span className="relative z-10 font-orbitron font-black text-2xl md:text-3xl text-white uppercase tracking-widest drop-shadow-[0_2px_10px_rgba(255,255,255,0.4)] italic">
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
            onClick={() => openLink('https://play.google.com/store/apps/details?id=com.app.devstree.candy&hl=en_IN')}
            className="group relative px-14 py-6 cursor-pointer transition-all duration-300 active:scale-95 hover:scale-105"
          >
          
            
            {/* Main Surface */}
            <div className="relative px-14 py-6 rounded-[2.5rem] bg-[#92cc41] border-t-4 border-white/50 border-l-2 border-white/20 overflow-hidden shadow-[0_10px_30px_rgba(146,204,65,0.4)]">
            <div className="absolute inset-0 rounded-[2.5rem] bg-[#92cc41] opacity-50 blur-[20px] group-hover:blur-[30px] group-hover:opacity-100 transition-all duration-500 animate-pulse" />
              <span className="relative z-10 font-orbitron font-black text-2xl md:text-3xl text-[#0c0416] uppercase tracking-widest drop-shadow-[0_1px_5px_rgba(0,0,0,0.2)] italic">
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
  )
}

export default ContactUs
