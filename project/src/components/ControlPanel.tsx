import { motion } from 'framer-motion';
import { Layers, Zap, Flame, Download, RotateCcw } from 'lucide-react';

interface ControlPanelProps {
  visualizationMode: 'holographic' | 'engraving' | 'forge';
  onModeChange: (mode: 'holographic' | 'engraving' | 'forge') => void;
  onDownload?: () => void;
  onReset: () => void;
  isSimulating: boolean;
}

export function ControlPanel({
  visualizationMode,
  onModeChange,
  onDownload,
  onReset,
  isSimulating,
}: ControlPanelProps) {
  const modes = [
    {
      id: 'holographic' as const,
      name: 'Holographic',
      icon: Layers,
      description: 'Transparent hologram effect',
      color: 'cyan',
    },
    {
      id: 'engraving' as const,
      name: 'Engraving',
      icon: Zap,
      description: 'Wireframe mesh style',
      color: 'blue',
    },
    {
      id: 'forge' as const,
      name: 'Forge',
      icon: Flame,
      description: 'Hot metal appearance',
      color: 'orange',
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="backdrop-blur-xl bg-black/40 border border-cyan-500/20 rounded-2xl p-6 shadow-2xl"
        >
          <div className="flex items-center justify-between gap-6 flex-wrap">
            <div className="flex-1 min-w-[300px]">
              <p className="text-sm text-gray-400 mb-3">Visualization Mode</p>
              <div className="grid grid-cols-3 gap-3">
                {modes.map((mode) => {
                  const Icon = mode.icon;
                  const isActive = visualizationMode === mode.id;

                  return (
                    <motion.button
                      key={mode.id}
                      onClick={() => !isSimulating && onModeChange(mode.id)}
                      disabled={isSimulating}
                      whileHover={!isSimulating ? { scale: 1.02 } : {}}
                      whileTap={!isSimulating ? { scale: 0.98 } : {}}
                      className={`relative p-4 rounded-xl transition-all ${
                        isActive
                          ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-2 border-cyan-400'
                          : 'bg-white/5 border-2 border-gray-700 hover:border-gray-600'
                      } ${isSimulating ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Icon
                          className={`w-6 h-6 ${
                            isActive
                              ? mode.color === 'cyan'
                                ? 'text-cyan-400'
                                : mode.color === 'blue'
                                ? 'text-blue-400'
                                : 'text-orange-400'
                              : 'text-gray-400'
                          }`}
                        />
                        <span className={`text-sm font-medium ${isActive ? 'text-white' : 'text-gray-400'}`}>
                          {mode.name}
                        </span>
                      </div>

                      {isActive && (
                        <motion.div
                          layoutId="activeMode"
                          className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-xl"
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3">
              {onDownload && (
                <motion.button
                  onClick={onDownload}
                  disabled={isSimulating}
                  whileHover={!isSimulating ? { scale: 1.05 } : {}}
                  whileTap={!isSimulating ? { scale: 0.95 } : {}}
                  className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-400 hover:to-emerald-500 transition-all ${
                    isSimulating ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Download className="w-5 h-5" />
                  Download
                </motion.button>
              )}

              <motion.button
                onClick={onReset}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 rounded-xl font-semibold flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white transition-all"
              >
                <RotateCcw className="w-5 h-5" />
                New Project
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
