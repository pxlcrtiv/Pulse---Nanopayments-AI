import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { motion, AnimatePresence } from 'motion/react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, YAxis } from 'recharts';
import { Activity, Cpu, Hexagon, Zap, Wallet, Play, Sparkles, Server } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type AgentTask = {
  id: number;
  prompt: string;
  result: string;
  status: 'running' | 'completed' | 'error';
  cost: number;
};

type ChartDataPoint = {
  time: string;
  burnRate: number;
};

const DUMMY_TASKS = [
  "Analyze optimal orbital trajectories for a Mars resupply mission.",
  "Synthesize a summary of quantum entanglement experiments from 2024.",
  "Generate a Python script to perform sentiment analysis on real-time tweets.",
  "Draft a comprehensive business plan for a synthetic biology startup.",
];

export default function App() {
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [totalUsdcSpent, setTotalUsdcSpent] = useState(0);
  const totalUsdcRef = useRef(0);
  const lastUsdcRef = useRef(0);
  const [chartData, setChartData] = useState<ChartDataPoint[]>(Array(20).fill(0).map((_, i) => ({ time: i.toString(), burnRate: 0 })));
  
  const [promptInput, setPromptInput] = useState("");
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the task results
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [tasks]);

  // Chart update loop
  useEffect(() => {
    const interval = setInterval(() => {
      const currentTotal = totalUsdcRef.current;
      const delta = currentTotal - lastUsdcRef.current;
      lastUsdcRef.current = currentTotal;

      setChartData(prev => {
        const newData = [...prev, { time: new Date().toLocaleTimeString([], { second: '2-digit', minute: '2-digit' }), burnRate: delta }];
        if (newData.length > 20) newData.shift();
        return newData;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const spawnAgent = async (overridePrompt?: string) => {
    const finalPrompt = overridePrompt || promptInput;
    if (!finalPrompt.trim()) return;

    const task: AgentTask = { id: Date.now(), prompt: finalPrompt, result: "", status: 'running', cost: 0 };
    setTasks(prev => [task, ...prev]);
    if (!overridePrompt) setPromptInput("");

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const responseStream = await ai.models.generateContentStream({
        model: "gemini-3-flash-preview",
        contents: finalPrompt + " (Respond concisely, acting as an autonomous analytical agent.)",
      });

      for await (const chunk of responseStream) {
        if (!chunk.text) continue;
        const text = chunk.text;
        // Pricing simulation: $0.000005 per character
        const cost = text.length * 0.000005;

        setTasks(prev => prev.map(t => 
          t.id === task.id ? { ...t, result: t.result + text, cost: t.cost + cost } : t
        ));
        setTotalUsdcSpent(prev => prev + cost);
        totalUsdcRef.current += cost;
      }

      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'completed' } : t));
    } catch (error: any) {
      console.error(error);
      setTasks(prev => prev.map(t => 
        t.id === task.id ? { ...t, status: 'error', result: t.result + '\n\n[ERR: ' + error.message + ']' } : t
      ));
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-hidden flex flex-col relative selection:bg-brand-blue/30">
      {/* Background Orbs (Hidden to match Elegant Dark) */}
      <div className="hidden absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyan-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="hidden absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />

      <main className="max-w-[1440px] w-full mx-auto p-6 sm:p-10 h-screen flex flex-col relative z-10 gap-6">
        
        {/* Header / Top Nav */}
        <header className="h-[80px] shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/[0.1] pb-4 sm:pb-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-blue to-[#00D1FF] flex items-center justify-center">
              <Hexagon className="w-4 h-4 text-white" fill="currentColor" />
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-[20px] font-semibold tracking-[-0.02em] m-0">Pulse <span className="font-light opacity-60 text-[20px]">OS</span></h1>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/[0.03] border border-white/[0.08] backdrop-blur-[20px] rounded-xl px-4 py-2">
            <div className="w-2 h-2 bg-brand-green rounded-full"></div>
            <div className="flex flex-col">
              <span className="text-[13px] font-medium leading-none mb-1">Mainnet Active</span>
              <span className="font-mono text-brand-blue font-semibold text-sm leading-none">
                ${totalUsdcSpent.toFixed(6)} <span className="opacity-40">USDC</span>
              </span>
            </div>
          </div>
        </header>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
          
          {/* Left Column: Controls & Active Agents */}
          <div className="lg:col-span-5 flex flex-col gap-6 h-full">
            
            {/* Control Panel */}
            <div className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-[20px] rounded-[24px] p-6 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                <Cpu className="w-32 h-32" />
              </div>
              
              <h2 className="text-sm uppercase tracking-widest font-mono text-white/50 mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Deploy Agent
              </h2>
              
              <textarea 
                className="w-full bg-white/[0.02] border border-white/[0.08] rounded-[16px] p-4 text-sm font-sans placeholder-white/30 focus:outline-none focus:border-brand-blue/50 focus:ring-1 focus:ring-brand-blue/50 transition-all resize-none min-h-[100px]"
                placeholder="Describe the task for the autonomous agent... (e.g. 'Analyze market sentiment for AAPL based on latest news.')"
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    spawnAgent();
                  }
                }}
              />
              
              <div className="mt-4 flex flex-wrap gap-2">
                <button 
                  onClick={() => spawnAgent()}
                  disabled={!promptInput.trim()}
                  className="w-full bg-white text-black font-semibold py-3.5 px-6 rounded-[14px] text-sm transition-all hover:bg-white/90 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="w-4 h-4" fill="currentColor" /> Initialize Task
                </button>
              </div>

              {/* Quick Prompts */}
              <div className="mt-6">
                 <p className="text-[12px] opacity-50 font-medium mb-3">Quick Execution</p>
                 <div className="flex flex-col gap-2">
                   {DUMMY_TASKS.slice(0, 2).map((t, i) => (
                     <button
                        key={i}
                        onClick={() => spawnAgent(t)}
                        className="text-left text-xs bg-white/[0.05] border border-white/[0.1] text-white rounded-[14px] px-4 py-3 font-medium transition-all hover:bg-white/[0.08] line-clamp-1"
                     >
                       {t}
                     </button>
                   ))}
                 </div>
              </div>
            </div>

            {/* Micro-Economy Stats */}
            <div className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-[20px] rounded-[24px] p-6 flex flex-col flex-1 min-h-0">
               <div className="flex items-center justify-between mb-6">
                 <h2 className="text-sm uppercase tracking-widest font-mono text-white/50 flex items-center gap-2">
                   <Activity className="w-4 h-4" /> Network Pulse
                 </h2>
                 <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-green"></span>
                  </span>
               </div>
               
               <div className="flex-1 w-full bg-black/20 rounded-2xl border border-white/5 p-4 flex flex-col justify-end">
                 <div className="text-[14px] opacity-50 mb-2">USDC Burn Rate (per sec)</div>
                 <div className="h-[120px] w-full">
                   <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorBurn" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2775CA" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#2775CA" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px', fontFamily: 'SF Mono, Courier New, monospace' }}
                        itemStyle={{ color: '#2775CA' }}
                        formatter={(val: number) => [`$${val.toFixed(6)}/s`, 'Rate']}
                      />
                      <Area type="monotone" dataKey="burnRate" stroke="#2775CA" strokeWidth={2} fillOpacity={1} fill="url(#colorBurn)" isAnimationActive={false} />
                    </AreaChart>
                   </ResponsiveContainer>
                 </div>
               </div>
            </div>
          </div>

          {/* Right Column: Active Tasks logs */}
          <div className="lg:col-span-7 bg-white/[0.03] border border-white/[0.08] backdrop-blur-[20px] rounded-[24px] flex flex-col relative overflow-hidden">
            <div className="px-6 py-5 flex items-center justify-between mb-2">
              <h2 className="m-0 text-[18px] font-semibold flex items-center gap-2">
                <Server className="w-4 h-4" /> Real-Time Transaction Stream
              </h2>
              <div className="px-3 py-1 rounded-full text-[12px] font-semibold uppercase tracking-[0.05em] bg-white/[0.03] border border-white/[0.08] backdrop-blur-[20px]">
                {tasks.filter(t => t.status === 'running').length} Active
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-3 custom-scrollbar relative">
              {tasks.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/20">
                  <Zap className="w-12 h-12 mb-4 opacity-50" />
                  <p className="font-mono text-sm uppercase tracking-widest">Awaiting execution orders</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {tasks.map((task) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white/[0.02] rounded-[16px] flex flex-col p-4 gap-3 border border-transparent"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex gap-4 items-start">
                          <div className="w-9 h-9 shrink-0 bg-brand-blue/10 rounded-lg flex items-center justify-center text-brand-blue mt-1">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <div className="text-[14px] font-medium text-white line-clamp-1">{task.prompt}</div>
                            <div className="text-[11px] opacity-40 font-mono">0x{task.id.toString().slice(-6)}...f912</div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[14px] font-semibold font-mono text-[#ffffff]">${task.cost.toFixed(6)}</div>
                          <div className={cn(
                            "text-[11px] font-medium mt-0.5 uppercase tracking-widest",
                            task.status === 'running' ? "text-brand-blue" :
                            task.status === 'completed' ? "text-brand-green" :
                            "text-red-500"
                          )}>
                            {task.status}
                          </div>
                        </div>
                      </div>
                  
                      {/* Task Body */}
                      <div className="pl-[52px] text-[13px] text-white/70 whitespace-pre-wrap leading-relaxed">
                        {task.result || (
                          <span className="opacity-40 animate-pulse font-mono">allocating resources...</span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
              <div ref={endOfMessagesRef} />
            </div>
            
            {/* Bottom fading edge */}
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black to-transparent pointer-events-none" />
          </div>

        </div>
      </main>
    </div>
  );
}
