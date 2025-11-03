import { motion } from 'framer-motion';
import { Zap, Layers, Sparkles } from 'lucide-react';

interface HeroProps {
  onStartClick: () => void;
}

export function Hero({ onStartClick }: HeroProps) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-gray-900 via-slate-900 to-black">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(17,24,39,1),rgba(0,0,0,1))]" />

      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center justify-center gap-2 mb-6">
            <Sparkles className="w-8 h-8 text-cyan-400" />
            <h1 className="text-7xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
              HoloForge
            </h1>
            <Sparkles className="w-8 h-8 text-cyan-400" />
          </div>

          <p className="text-2xl text-gray-300 mb-4">
            2D to 3D Object Creator
          </p>

          <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Transform any 2D image into a stunning 3D holographic object with AI-powered depth reconstruction.
            Watch as a futuristic laser simulation constructs your creation layer by layer.
          </p>

          <div className="flex flex-wrap gap-8 justify-center mb-16">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-3 px-6 py-3 rounded-xl bg-white/5 backdrop-blur-sm border border-cyan-500/20"
            >
              <Zap className="w-6 h-6 text-cyan-400" />
              <div className="text-left">
                <p className="text-sm text-gray-400">AI-Powered</p>
                <p className="text-white font-semibold">Depth Estimation</p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-3 px-6 py-3 rounded-xl bg-white/5 backdrop-blur-sm border border-cyan-500/20"
            >
              <Layers className="w-6 h-6 text-cyan-400" />
              <div className="text-left">
                <p className="text-sm text-gray-400">Real-Time</p>
                <p className="text-white font-semibold">Laser Simulation</p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-3 px-6 py-3 rounded-xl bg-white/5 backdrop-blur-sm border border-cyan-500/20"
            >
              <Sparkles className="w-6 h-6 text-cyan-400" />
              <div className="text-left">
                <p className="text-sm text-gray-400">Export</p>
                <p className="text-white font-semibold">3D Models</p>
              </div>
            </motion.div>
          </div>

          <motion.button
            onClick={onStartClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="group relative px-12 py-5 text-lg font-semibold text-white rounded-xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600" />
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative flex items-center gap-2">
              Start Creating
              <Zap className="w-5 h-5" />
            </span>
          </motion.button>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
    </div>
  );
}
