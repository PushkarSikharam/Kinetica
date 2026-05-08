"use client";

import { Activity, Users, Database, Globe, ArrowUpRight } from "lucide-react";
import { useState } from "react";

export default function AdminDashboard() {
  
  // Note: This is an aggregated dummy list representing what the backend would return.
  // The system legally tracks coarse location based on IP strings ("Delhi", "Mumbai").
  const regionData = [
    { city: "Mumbai", users: 0, percent: 0 },
    { city: "Bengaluru", users: 0, percent: 0 },
    { city: "Delhi", users: 0, percent: 0 },
    { city: "Hyderabad", users: 0, percent: 0 },
    { city: "Chennai", users: 0, percent: 0 },
  ];

  return (
    <div className="animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4 border-b border-zinc-800/50 pb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white leading-none mb-2 mt-2">Executive Command Center</h1>
          <p className="text-zinc-500">System architecture and global biological data streams.</p>
        </div>
      </div>

      {/* Primary Data Metric */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        
        <div className="bg-[#0a0a0a] rounded-2xl p-6 border border-zinc-800 flex flex-col justify-between shadow-lg">
           <div className="flex items-center gap-2 text-blue-400 font-medium mb-6 text-sm">
             <Users className="w-4 h-4" /> Global Handshake Count
           </div>
           <div>
              <div className="text-5xl font-medium tracking-tighter text-white mb-2">0</div>
              <div className="text-zinc-500 text-sm flex items-center gap-1">
                 <span className="text-zinc-400 font-medium">Awaiting Launch</span>
              </div>
           </div>
        </div>

        <div className="bg-[#0a0a0a] rounded-2xl p-6 border border-zinc-800 flex flex-col justify-between shadow-lg">
           <div className="flex items-center gap-2 text-purple-400 font-medium mb-6 text-sm">
             <Activity className="w-4 h-4" /> Telemetry Processing
           </div>
           <div>
              <div className="text-5xl font-medium tracking-tighter text-white mb-2">0</div>
              <div className="text-zinc-500 text-sm flex items-center gap-1">
                 Total system meal logs parsed
              </div>
           </div>
        </div>

        <div className="bg-[#0a0a0a] rounded-2xl p-6 border border-zinc-800 flex flex-col justify-between shadow-lg">
           <div className="flex items-center gap-2 text-emerald-400 font-medium mb-6 text-sm">
             <Database className="w-4 h-4" /> Catalog Volume
           </div>
           <div>
              <div className="text-5xl font-medium tracking-tighter text-white mb-2">0</div>
              <div className="text-zinc-500 text-sm flex items-center gap-1">
                 Immutable Indian 100g Baselines
              </div>
           </div>
        </div>

      </div>

      {/* Regional Geographical View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Heat Map List */}
        <div className="bg-[#0a0a0a] rounded-2xl p-8 border border-zinc-800 shadow-lg">
           <div className="flex items-center gap-2 text-zinc-300 font-medium tracking-tight mb-8">
             <Globe className="w-5 h-5 text-zinc-500" />
             Geographical Density
           </div>
           
           <div className="space-y-6">
             {regionData.map((region, i) => (
                <div key={region.city}>
                   <div className="flex justify-between items-end mb-2">
                      <div className="flex items-center gap-3">
                         <span className="text-zinc-600 font-mono text-sm">0{i+1}</span>
                         <span className="text-zinc-200 font-medium">{region.city}</span>
                      </div>
                      <span className="text-zinc-500 text-sm font-mono">{region.users.toLocaleString()}</span>
                   </div>
                   <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                      <div 
                         className="h-full bg-blue-500/50 rounded-full"
                         style={{ width: `${region.percent}%` }}
                      />
                   </div>
                </div>
             ))}
           </div>
        </div>

        <div className="bg-[#0a0a0a] rounded-2xl p-8 border border-zinc-800 shadow-lg flex flex-col items-center justify-center text-center">
             <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
                 <Activity className="w-6 h-6 text-zinc-600" />
             </div>
             <h3 className="text-lg font-medium text-zinc-300 mb-2">Real-time Visualizer Offline</h3>
             <p className="text-zinc-500 max-w-sm text-sm">
                The D3.js active web-socket visualizer is disabled during local development to conserve memory. Run `npm run prod` to view global heat blips.
             </p>
        </div>

      </div>

    </div>
  );
}
