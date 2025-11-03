import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hero } from './components/Hero';
import { UploadZone } from './components/UploadZone';
import { Scene3D } from './components/Scene3D';
import { ControlPanel } from './components/ControlPanel';
import { uploadImage } from './lib/storage';
import { createProject, updateProject } from './lib/api';
import { Loader2 } from 'lucide-react';

type AppState = 'hero' | 'upload' | 'processing' | 'viewer';

function App() {
  const [appState, setAppState] = useState<AppState>('hero');
  const [currentProject, setCurrentProject] = useState<any>(null);
  const [visualizationMode, setVisualizationMode] = useState<'holographic' | 'engraving' | 'forge'>('holographic');
  const [isSimulating, setIsSimulating] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');

  const handleStart = useCallback(() => {
    setAppState('upload');
  }, []);

  const handleFileSelect = useCallback(async (file: File) => {
    try {
      setAppState('processing');
      setProcessingMessage('Uploading image...');

      const imageUrl = await uploadImage(file);

      setProcessingMessage('Creating project...');
      const project = await createProject({
        title: file.name.replace(/\.[^/.]+$/, ''),
        original_image_url: imageUrl,
        visualization_mode: visualizationMode,
      });

      setCurrentProject(project);

      setProcessingMessage('Generating 3D model with AI...');
      await updateProject(project.id, { status: 'processing' });

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-3d-model`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            projectId: project.id,
            imageUrl: imageUrl,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate 3D model');
      }

      const result = await response.json();

      setProcessingMessage('Finalizing...');
      const updatedProject = await updateProject(project.id, {
        status: 'completed',
        model_url: result.modelUrl,
        metadata: result.metadata,
      });

      setCurrentProject(updatedProject);
      setAppState('viewer');
      setIsSimulating(true);
    } catch (error) {
      console.error('Error processing file:', error);
      setProcessingMessage('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));

      if (currentProject) {
        await updateProject(currentProject.id, { status: 'failed' });
      }

      setTimeout(() => {
        setAppState('upload');
      }, 3000);
    }
  }, [visualizationMode, currentProject]);

  const handleModeChange = useCallback((mode: 'holographic' | 'engraving' | 'forge') => {
    setVisualizationMode(mode);
    if (currentProject) {
      updateProject(currentProject.id, { visualization_mode: mode });
    }
  }, [currentProject]);

  const handleDownload = useCallback(() => {
    if (currentProject?.model_url) {
      const link = document.createElement('a');
      link.href = currentProject.model_url;
      link.download = `${currentProject.title}.glb`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [currentProject]);

  const handleReset = useCallback(() => {
    setCurrentProject(null);
    setIsSimulating(false);
    setAppState('hero');
    setVisualizationMode('holographic');
  }, []);

  const handleSimulationComplete = useCallback(() => {
    setIsSimulating(false);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-slate-900 to-black">
      <AnimatePresence mode="wait">
        {appState === 'hero' && (
          <motion.div
            key="hero"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Hero onStartClick={handleStart} />
          </motion.div>
        )}

        {appState === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col"
          >
            <div className="flex-1 flex items-center justify-center">
              <UploadZone onFileSelect={handleFileSelect} isProcessing={false} />
            </div>

            <div className="p-6">
              <button
                onClick={() => setAppState('hero')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ← Back
              </button>
            </div>
          </motion.div>
        )}

        {appState === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex items-center justify-center"
          >
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-8 relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 animate-spin" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)' }} />
                <div className="absolute inset-2 rounded-full bg-gray-900" />
                <Loader2 className="absolute inset-0 m-auto w-12 h-12 text-cyan-400 animate-spin" />
              </div>

              <h2 className="text-3xl font-bold text-white mb-4">
                Creating Your 3D Model
              </h2>

              <p className="text-xl text-cyan-400 mb-8">
                {processingMessage}
              </p>

              <div className="max-w-md mx-auto">
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-600"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 5, ease: 'linear' }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {appState === 'viewer' && currentProject && (
          <motion.div
            key="viewer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-screen w-full"
          >
            <div className="absolute top-6 left-6 z-40">
              <div className="backdrop-blur-xl bg-black/40 border border-cyan-500/20 rounded-xl px-6 py-4">
                <h3 className="text-2xl font-bold text-white mb-1">
                  {currentProject.title}
                </h3>
                <p className="text-sm text-gray-400">
                  {isSimulating ? 'Laser simulation in progress...' : '3D Model Ready'}
                </p>
              </div>
            </div>

            <Scene3D
              modelUrl={currentProject.model_url}
              visualizationMode={visualizationMode}
              isSimulating={isSimulating}
              onSimulationComplete={handleSimulationComplete}
            />

            <ControlPanel
              visualizationMode={visualizationMode}
              onModeChange={handleModeChange}
              onDownload={handleDownload}
              onReset={handleReset}
              isSimulating={isSimulating}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
