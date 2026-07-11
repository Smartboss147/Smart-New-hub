import { useState } from 'react';
import { Film, Sparkles, Send, Plus, Trash2, Mic, Video } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid'; // Need to install uuid

interface Scene {
  id: string;
  script: string;
}

export default function VideoGenerator() {
  const [prompt, setPrompt] = useState('');
  const [scenes, setScenes] = useState<Scene[]>([{ id: uuidv4(), script: '' }]);
  const [isGenerating, setIsGenerating] = useState(false);

  const addScene = () => {
    setScenes([...scenes, { id: uuidv4(), script: '' }]);
  };

  const removeScene = (id: string) => {
    setScenes(scenes.filter(scene => scene.id !== id));
  };

  const updateSceneScript = (id: string, script: string) => {
    setScenes(scenes.map(scene => scene.id === id ? { ...scene, script } : scene));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/video-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, scenes })
      });
      const data = await res.json();
      console.log('API response:', data);
      alert('Video generation initiated!');
    } catch (err) {
      console.error(err);
      alert('Failed to initiate video generation.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Film className="w-6 h-6 text-sky-400" />
          AI Video Creator
        </h2>
        
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">AI Prompt Generation</h3>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full h-32 p-4 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none mb-4"
            placeholder="E.g., A movie about a lost cat in the city..."
          />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">Manual Sequence Editor</h3>
            <button onClick={addScene} className="text-sky-400 hover:text-sky-300 flex items-center gap-1">
              <Plus className="w-5 h-5" /> Add Scene
            </button>
          </div>
          
          {scenes.map((scene, index) => (
            <div key={scene.id} className="bg-slate-950 p-4 rounded-xl mb-4 border border-slate-800 relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm font-medium">Scene {index + 1}</span>
                <button onClick={() => removeScene(scene.id)} className="text-red-500 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <textarea
                value={scene.script}
                onChange={(e) => updateSceneScript(scene.id, e.target.value)}
                className="w-full p-3 bg-slate-900 border border-slate-800 rounded-lg text-white mb-3"
                placeholder="Write script for this scene..."
              />
              <div className="flex gap-2">
                <button className="flex-1 py-2 px-3 bg-slate-800 rounded-lg text-slate-300 flex items-center justify-center gap-2 text-sm">
                  <Video className="w-4 h-4" /> Upload Video
                </button>
                <button className="flex-1 py-2 px-3 bg-slate-800 rounded-lg text-slate-300 flex items-center justify-center gap-2 text-sm">
                  <Mic className="w-4 h-4" /> Upload Sound
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full py-4 px-4 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          {isGenerating ? (
            <Sparkles className="w-6 h-6 animate-spin" />
          ) : (
            <Send className="w-6 h-6" />
          )}
          <span>Generate Full Movie</span>
        </button>
      </div>
    </div>
  );
}
