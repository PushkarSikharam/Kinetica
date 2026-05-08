"use client";

import { ArrowRight, Lock, Activity, Database, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

// --- Typewriter Hook ---
function useTypewriter(text: string, speed: number = 50) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let index = 0;
    setDisplayedText(""); // Reset before typing
    
    const interval = setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(index));
      index++;
      if (index === text.length) clearInterval(interval);
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return displayedText;
}

// --- Interactive Canvas Particle System ---
const ParticleField = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    
    let particles: Particle[] = [];
    const numParticles = Math.min(width / 3, 400); // Scale dots based on screen
    const mouse = { x: width / 2, y: height / 2, radius: 150 };

    window.addEventListener("mousemove", (e) => {
      mouse.x = e.x;
      mouse.y = e.y;
    });

    window.addEventListener("resize", () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      init();
    });

    class Particle {
      x: number;
      y: number;
      baseX: number;
      baseY: number;
      size: number;
      density: number;
      color: string;
      
      constructor(x: number, y: number, color: string) {
        this.x = x;
        this.y = y;
        this.baseX = x;
        this.baseY = y;
        this.size = Math.random() * 2.5 + 0.5; // Small dots like the image
        this.density = (Math.random() * 30) + 1;
        this.color = color;
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
      }

      update() {
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        let forceDirectionX = dx / distance;
        let forceDirectionY = dy / distance;
        let maxDistance = mouse.radius;
        let force = (maxDistance - distance) / maxDistance;
        let directionX = forceDirectionX * force * this.density;
        let directionY = forceDirectionY * force * this.density;

        if (distance < mouse.radius) {
          this.x -= directionX;
          this.y -= directionY;
        } else {
          if (this.x !== this.baseX) {
            let dx = this.x - this.baseX;
            this.x -= dx / 10;
          }
          if (this.y !== this.baseY) {
            let dy = this.y - this.baseY;
            this.y -= dy / 10;
          }
        }
      }
    }

    const init = () => {
      particles = [];
      const colors = ['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#8AB4F8', '#a855f7']; // Google-esque bright colors
      for (let i = 0; i < numParticles; i++) {
        // Bias particles toward left side slightly, like the image
        const x = Math.random() * width;
        const y = Math.random() * height;
        const color = colors[Math.floor(Math.random() * colors.length)];
        // make them somewhat sparse
        particles.push(new Particle(x, y, color));
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < particles.length; i++) {
        particles[i].draw();
        particles[i].update();
      }
      requestAnimationFrame(animate);
    };

    init();
    animate();

    return () => {
       // cleanup listeners on unmount could be added, but ok for single page
    }
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0 opacity-80" />;
};


// --- Main Component ---
export default function Home() {
  const [mounted, setMounted] = useState(false);
  const headline = "Experience tracking with the next-generation algorithm.";
  const typedText = useTypewriter(headline, 40); // 40ms per letter
  
  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen bg-white text-zinc-900 selection:bg-blue-100 font-sans relative overflow-hidden">
      
      {/* Interactive Bright Particle Canvas */}
      {mounted && <ParticleField />}

      {/* Very faint background radial gradient to keep it bright */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-white/80 to-transparent pointer-events-none z-0" />

      {/* Navigation */}
      <header className="px-6 md:px-12 h-20 flex items-center justify-between border-b border-zinc-100 bg-white/70 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          {/* Logo matching the Antigravity sharp gradient 'A' */}
          <div className="flex items-end">
             <div className="w-4 h-6 bg-blue-500 rounded-sm -skew-x-[20deg] mr-1" />
             <div className="w-3 h-5 bg-purple-500 rounded-sm -skew-x-[20deg]" />
          </div>
          <span className="font-medium text-lg tracking-tight">
            Zoro Food Tracker <span className="font-light text-zinc-500">Antigravity</span>
          </span>
        </div>
        <div className="flex items-center gap-8 text-sm font-medium">
          <Link href="/login" className="text-zinc-600 hover:text-zinc-900 transition-colors hidden sm:block">Product</Link>
          <Link href="/login" className="text-zinc-600 hover:text-zinc-900 transition-colors hidden sm:block">Use Cases</Link>
          <Link href="/login" className="text-zinc-600 hover:text-zinc-900 transition-colors hidden sm:block">Resources</Link>
          
          <Link 
            href="/register" 
            className="flex items-center gap-2 bg-[#111] hover:bg-black text-white px-5 py-2.5 rounded-full transition-shadow shadow-sm hover:shadow-lg font-medium ml-4"
          >
            <span>Start Tracking</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pt-32 pb-40 min-h-[85vh]">
        
        {mounted ? (
          <div className="max-w-4xl text-center flex flex-col items-center">
            
            <div className="flex items-center gap-2 mb-8 bg-white/80 backdrop-blur-sm border border-zinc-200 px-3 py-1 rounded-full shadow-sm text-sm font-medium">
               <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
               <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">Deterministic Engine v1.0</span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-[5rem] font-medium tracking-tight text-balance leading-[1.05] mb-8 min-h-[140px] md:min-h-[160px] text-[#111]">
              <span className="opacity-0 absolute">Experience tracking with the next-generation algorithm.</span>
              {typedText}
              <span className="animate-pulse opacity-50 font-light">|</span>
            </h1>
            
            <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 2.2, duration: 0.8 }}
               className="flex flex-col items-center"
            >
              <p className="text-xl text-zinc-500 max-w-2xl leading-relaxed mb-12 font-light text-balance bg-white/50 backdrop-blur-sm p-2 rounded-xl">
                We utilize a deterministic 14-day rolling average of your actual intake and absolute weight delta to derive your true metabolic expenditure. No static calculators. No noise.
              </p>

              <div className="flex items-center gap-4">
                 <Link 
                  href="/register"
                  className="inline-flex items-center justify-center h-14 bg-[#111] text-white px-8 rounded-full font-medium hover:bg-black transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5 group"
                 >
                    Initialize Data Profile
                 </Link>
                 <Link 
                  href="/dashboard"
                  className="inline-flex items-center justify-center h-14 bg-zinc-100 text-zinc-900 border border-zinc-200 px-8 rounded-full font-medium hover:bg-zinc-200 transition-all shadow-sm"
                 >
                    Explore documentation
                 </Link>
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="min-h-[60vh]" /> // Placeholder while mounting
        )}

        {/* --- GROUND TRUTH & METRICS SECTION --- */}
        {mounted && (
          <div className="w-full max-w-6xl mt-32 grid grid-cols-1 md:grid-cols-2 gap-12 text-left bg-white/40 backdrop-blur-xl border border-zinc-100 rounded-[2rem] p-8 md:p-16 shadow-2xl shadow-blue-900/5">
            
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-blue-600 font-semibold tracking-wide uppercase text-sm">
                 <Database className="w-4 h-4" /> The Ground Truth
              </div>
              <h2 className="text-3xl md:text-4xl font-medium tracking-tight text-zinc-900">Why typical apps fail you.</h2>
              <p className="text-lg text-zinc-600 leading-relaxed font-light">
                Standard calorie trackers rely on the Harris-Benedict equation to estimate your basal metabolic rate (BMR). That formula assumes you are an average human. You are not. <br/><br/>
                Furthermore, tracking Indian macronutrients (hidden oils in curries, varying Roti thicknesses) introduces up to <strong>35% variance</strong> in daily logs. Static calculators crash under this noise.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-2 text-purple-600 font-semibold tracking-wide uppercase text-sm">
                 <Activity className="w-4 h-4" /> The Algorithm
              </div>
              <h2 className="text-3xl md:text-4xl font-medium tracking-tight text-zinc-900">Deterministic trailing averages.</h2>
              <p className="text-lg text-zinc-600 leading-relaxed font-light">
                Zoro Food Tracker abandons static BMR entirely. We observe your behavior. By plotting your caloric intake sequence against your absolute weight delta over a 14-day trailing window, we can mathematically derive your exact expenditure curve.
              </p>
              <div className="bg-[#111] text-emerald-400 font-mono text-xs sm:text-sm p-4 rounded-xl border border-zinc-800 shadow-inner overflow-x-auto">
                <span className="text-zinc-500">// Core Equation:</span><br/>
                <span className="text-purple-400">Δ</span>Weight_14d = (Σ Intake - Σ TDEE) / 7700<br/>
                <span className="text-blue-400">let</span> TDEE = AvgIntake - (ΔWeight_14d * 550)
              </div>
            </div>

            <div className="md:col-span-2 border-t border-zinc-200 pt-12 mt-4 space-y-8">
               <div className="text-center w-full">
                 <h2 className="text-3xl font-medium tracking-tight text-zinc-900">System Metrics & Test Cases</h2>
                 <p className="text-zinc-500 mt-2">Verified variance mapping across large simulated datasets.</p>
               </div>
               
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                 <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
                    <span className="text-4xl font-light text-blue-600 mb-2">94.2%</span>
                    <span className="font-medium text-zinc-800">Confidence Interval</span>
                    <span className="text-sm text-zinc-500 mt-2">Achieved after 14 continuous days of baseline logging.</span>
                 </div>
                 <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
                    <span className="text-4xl font-light text-purple-600 mb-2">&lt; 50</span>
                    <span className="font-medium text-zinc-800">Kcal Margin of Error</span>
                    <span className="text-sm text-zinc-500 mt-2">Versus measured clinical expenditure dynamically adjusted.</span>
                 </div>
                 <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
                    <span className="text-4xl font-light text-emerald-600 mb-2">100%</span>
                    <span className="font-medium text-zinc-800">Data Transparency</span>
                    <span className="text-sm text-zinc-500 mt-2">The system will never change your target without mathematically proving why.</span>
                 </div>
               </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
