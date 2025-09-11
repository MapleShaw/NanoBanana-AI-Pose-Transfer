import React, { useState, useRef, useCallback, useEffect } from 'react';
import ImageUploader from './components/ImageUploader';
import DrawingCanvas, { type DrawingCanvasRef } from './components/DrawingCanvas';
import PoseEditor, { type PoseEditorRef } from './components/PoseEditor';
import PosePresets from './components/PosePresets';
import Tabs from './components/Tabs';
import { generateImageFromPose } from './services/geminiService';
import { type Pose } from './lib/poses';

const Header: React.FC = () => (
  <header className="fixed top-0 left-0 right-0 z-10 bg-black/30 backdrop-blur-md">
    <div className="container mx-auto flex items-center gap-4 h-20 px-4 md:px-8 border-b border-white/10">
       <div className="p-2 bg-white/10 rounded-lg">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.25 22.5l-.648-1.938a3.375 3.375 0 00-2.456-2.456L11.25 18l1.938-.648a3.375 3.375 0 002.456-2.456L16.25 13l.648 1.938a3.375 3.375 0 002.456 2.456L21.75 18l-1.938.648a3.375 3.375 0 00-2.456 2.456z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-slate-100 tracking-wide">AI Pose Transfer Studio</h1>
    </div>
  </header>
);

const Spinner: React.FC = () => (
  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400"></div>
);

const fileToBase64 = (file: File): Promise<{base64: string, mimeType: string}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const [header, data] = result.split(',');
      const mimeType = header.match(/:(.*?);/)?.[1] || 'application/octet-stream';
      resolve({ base64: data, mimeType });
    };
    reader.onerror = error => reject(error);
  });
};

const Card: React.FC<{ children: React.ReactNode, title: string, step: number }> = ({ children, title, step }) => (
  <div className="group relative glass-pane p-6 rounded-2xl shadow-2xl transition-all duration-300">
     <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-400 to-purple-500 opacity-0 group-hover:opacity-15 transition-opacity duration-300 glow-effect pointer-events-none"></div>
    <h2 className="text-xl font-semibold mb-4 text-slate-200 flex items-center gap-3">
       <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-cyan-300 font-bold border border-white/20">{step}</span>
      {title}
    </h2>
    {children}
  </div>
);

const loadingMessages = [
  "Warming up the AI's digital paintbrush...", "Analyzing the pose structure...", "Blending pixels and possibilities...", "Rendering the final masterpiece...", "This can take a moment, creativity is brewing!",
];

type PoseMode = 'Editor' | 'Presets' | 'Draw';

const App: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
  const [activePoseMode, setActivePoseMode] = useState<PoseMode>('Editor');
  const [selectedPreset, setSelectedPreset] = useState<Pose | null>(null);

  const drawingCanvasRef = useRef<DrawingCanvasRef>(null);
  const poseEditorRef = useRef<PoseEditorRef>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (selectedPreset && poseEditorRef.current) {
      poseEditorRef.current.setJoints(selectedPreset.joints);
      // Automatically switch to the editor to show the loaded pose
      setActivePoseMode('Editor');
    }
  }, [selectedPreset]);

  const getPoseData = useCallback((): string | null => {
    switch(activePoseMode) {
      case 'Editor': 
      case 'Presets': // Presets now load into the editor, so we get data from there.
        return poseEditorRef.current?.getCanvasDataURL() ?? null;
      case 'Draw': 
        return drawingCanvasRef.current?.getCanvasDataURL() ?? null;
      default: 
        return null;
    }
  }, [activePoseMode]);
  
  const handleGeneration = useCallback(async () => {
    if (!uploadedFile) return;

    setIsLoading(true);
    setError(null);
    setGeneratedImageUrl(null);
    
    intervalRef.current = setInterval(() => setLoadingMessage(p => loadingMessages[(loadingMessages.indexOf(p) + 1) % loadingMessages.length]), 2500);

    try {
      const poseDataUrl = getPoseData();
      if (!poseDataUrl) {
        setError("Please create a pose first using one of the available modes.");
        setIsLoading(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }

      const [poseHeader, poseBase64] = poseDataUrl.split(',');
      const poseMimeType = poseHeader.match(/:(.*?);/)?.[1] || 'image/png';
      const { base64: originalImageBase64, mimeType: originalImageMimeType } = await fileToBase64(uploadedFile);

      const resultBase64 = await generateImageFromPose(originalImageBase64, originalImageMimeType, poseBase64, poseMimeType);
      
      if(resultBase64) {
        setGeneratedImageUrl(`data:image/png;base64,${resultBase64}`);
      } else {
        setError("The AI model did not return an image. Please try a different pose or source image.");
      }

    } catch (err) {
      console.error(err);
      const message = (err instanceof Error ? err.message : "An unknown error occurred.")
      if (err && typeof err === 'object' && 'error' in err) {
         setError(`Error calling Gemini API:\n${JSON.stringify(err)}`);
      } else {
         setError(message);
      }
    } finally {
      setIsLoading(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [uploadedFile, getPoseData]);
  
  const handleDownload = useCallback(() => {
    if (!generatedImageUrl) return;
    const link = document.createElement('a');
    link.href = generatedImageUrl;
    link.download = 'ai-pose-transfer.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [generatedImageUrl]);
  
  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const poseTabs: PoseMode[] = ['Editor', 'Presets', 'Draw'];

  return (
    <div className="min-h-screen bg-black text-slate-100 font-sans">
      <Header />
      <main className="container mx-auto px-4 md:px-8 pt-28 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card title="Upload Your Image" step={1}>
            <ImageUploader onImageUpload={setUploadedFile} />
          </Card>
          <Card title="Create Target Pose" step={2}>
            <Tabs<PoseMode> tabs={poseTabs} activeTab={activePoseMode} setActiveTab={setActivePoseMode} />
            <div className="mt-4 relative h-80">
              <div className={`w-full h-full ${activePoseMode === 'Editor' ? 'block' : 'hidden'}`}>
                <PoseEditor ref={poseEditorRef} />
              </div>
              {activePoseMode === 'Presets' && <PosePresets selectedPose={selectedPreset} onSelect={setSelectedPreset} />}
              {activePoseMode === 'Draw' && <DrawingCanvas ref={drawingCanvasRef} />}
            </div>
          </Card>
        </div>

        <div className="text-center mb-8">
          <button
            onClick={handleGeneration}
            disabled={!uploadedFile || isLoading}
            className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed disabled:text-slate-400 text-white font-bold py-4 px-10 rounded-full text-lg transition-all duration-300 ease-in-out shadow-[0_0_20px_rgba(0,255,255,0.3)] hover:shadow-[0_0_30px_rgba(0,255,255,0.5)] transform hover:scale-105 flex items-center justify-center mx-auto gap-3"
          >
            {isLoading ? <Spinner /> : 
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                 <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            }
            {isLoading ? 'Generating...' : 'Generate New Image'}
          </button>
        </div>
        
        <div className="glass-pane p-6 rounded-2xl shadow-2xl min-h-[400px] flex justify-center items-center relative">
          <h2 className="text-xl font-semibold text-slate-200 absolute top-6 left-6 flex items-center gap-3">
             <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-cyan-300 font-bold border border-white/20">3</span>
             Result
          </h2>
           {isLoading && (
            <div className="flex flex-col items-center gap-4 transition-opacity duration-500 animate-fade-in">
              <Spinner />
              <p className="text-slate-400">{loadingMessage}</p>
            </div>
           )}
           {error && (
            <div className="text-center text-red-400 flex flex-col items-center gap-2 animate-fade-in">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <p className="font-semibold mt-2">Oops, something went wrong!</p>
                <p className="text-sm text-slate-500 max-w-md">{error}</p>
            </div>
           )}
           {generatedImageUrl && !isLoading && (
              <div className="flex flex-col items-center gap-4 animate-fade-in">
                <img src={generatedImageUrl} alt="Generated result" className="max-w-full max-h-[500px] object-contain rounded-lg shadow-lg" />
                 <button
                    onClick={handleDownload}
                    className="mt-4 bg-white/10 hover:bg-white/20 border border-white/20 text-slate-200 font-bold py-2 px-6 rounded-full transition-colors duration-300 flex items-center gap-2"
                >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                </button>
              </div>
           )}
           {!isLoading && !error && !generatedImageUrl && (
             <div className="text-center text-slate-500 flex flex-col items-center gap-4 animate-fade-in">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p>Your generated image will appear here.</p>
            </div>
           )}
        </div>
      </main>
    </div>
  );
};

export default App;