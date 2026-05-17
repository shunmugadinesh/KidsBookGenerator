import React, { useState, useRef, useEffect } from 'react';
import { Upload, Image as ImageIcon, Sparkles, BookOpen, Download, AlertCircle, Loader2, XCircle } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export default function App() {
  const [referenceImage, setReferenceImage] = useState(null);
  const [appMode, setAppMode] = useState('book'); // 'book' or 'habit'

  // Model Selectors (Common)
  const [selectedModel, setSelectedModel] = useState('pollinations');
  const [habitTextModel, setHabitTextModel] = useState('ollama');

  // Unified Error and Progress states
  const [error, setError] = useState(null);
  const [allProgress, setAllProgress] = useState('');
  const fileInputRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Alphabet Book Module States
  const [selectedLetter, setSelectedLetter] = useState('A');
  const [generatedImages, setGeneratedImages] = useState({});
  const [modelUsed, setModelUsed] = useState({});
  const [editablePrompt, setEditablePrompt] = useState('');
  const [generatingAll, setGeneratingAll] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Automatically parsed story lines for Alphabet Book
  const [bookStories, setBookStories] = useState({});

  // Custom book prompts (so user edits to letters persist)
  const [customBookPrompts, setCustomBookPrompts] = useState({});

  // Load letters data from backend single source of truth on mount
  useEffect(() => {
    const loadLettersData = async () => {
      try {
        const response = await fetch('/book-data');
        const data = await response.json();
        if (data && data.letters) {
          const prompts = {};
          const stories = {};

          data.letters.forEach(item => {
            const letter = item.l;
            const word = item.word;
            const scene = item.scene;
            const fact = item.fact;

            // Reconstruct full Pixar prompt dynamically from backend scene data
            prompts[letter] = `Rithvin, a 3-year-old boy with warm golden brown skin, black short curly hair, dark brown eyes, chubby cute cheeks, cheerful joyful expression, wearing a bright red t-shirt and matching red shorts with small playful patterns, fully clothed.\n\nRendered as an ultra-realistic 3D Pixar-style cartoon character. Soft studio lighting, subsurface skin scattering, big expressive sparkly eyes, clean crisp render.\n\n${scene}.\n\nLetter "${letter}" for ${word}. Centered full-body or 3/4 body composition, clean soft pastel background with subtle ${word.toLowerCase()}-themed color wash, single large glowing letter "${letter}" visible as a prop or in background. Warm joyful lighting, storybook magic, ultra-detailed, Pixar animation quality, no clutter, no other characters, no text overlay, portrait orientation, A5 page size.\n\nThe word "${word}" should appear as the label text below the scene in english script — large, bold, rounded, child-friendly font style.\n\nNEGATIVE: ugly, deformed, extra fingers, extra limbs, mutated hands, poorly drawn face, scary, creepy, horror, adult face, realistic human photo, blurry, low quality, dark, violent, text overlay, watermark, logo, nsfw, nude, naked, shirtless, bare chest, bare skin, topless, undressed, exposed body, multiple children, crowded scene, busy background, cluttered, dark background, bad anatomy, out of frame, cropped, distorted`;

            stories[letter] = `${letter} is for ${word}. ${fact}`;
          });

          setCustomBookPrompts(prev => {
            // Keep user edits if any, otherwise merge
            return { ...prompts, ...prev };
          });
          setBookStories(stories);
        }
      } catch (err) {
        console.error("Failed to load book data from backend single source of truth:", err);
      }
    };

    loadLettersData();
  }, []);

  // Habit Chart Module States
  const [habitTitle, setHabitTitle] = useState('Potty Training');
  const [habitTotalScenes, setHabitTotalScenes] = useState(3);
  const [habitTotalPages, setHabitTotalPages] = useState(3);
  const [habitPrompts, setHabitPrompts] = useState({});
  const [selectedHabitPage, setSelectedHabitPage] = useState('Page 1');
  const [habitGeneratedImages, setHabitGeneratedImages] = useState({});
  const [habitModelUsed, setHabitModelUsed] = useState({});
  const [habitStoryTexts, setHabitStoryTexts] = useState({});
  const [habitEditablePrompt, setHabitEditablePrompt] = useState('');
  const [isGeneratingHabitPlan, setIsGeneratingHabitPlan] = useState(false);
  const [isGeneratingHabitImage, setIsGeneratingHabitImage] = useState(false);
  const [generatingAllHabits, setGeneratingAllHabits] = useState(false);
  const [habitPlanProgress, setHabitPlanProgress] = useState({ done: 0, total: 0 });

  // Audio & Video Studio States
  const [rightPanelTab, setRightPanelTab] = useState('prompt'); // 'prompt' or 'media'
  const [selectedVoice, setSelectedVoice] = useState('en-US-AnaNeural');
  const [selectedBgm, setSelectedBgm] = useState('playful_toyland');
  const [customBgmPrompt, setCustomBgmPrompt] = useState('gentle bedtime piano loop, calming instrumental');
  const [isCompilingVideo, setIsCompilingVideo] = useState(false);
  const [generatedVideos, setGeneratedVideos] = useState({}); // mapping: pageKey -> videoUrl
  const [isCompilingFullVideo, setIsCompilingFullVideo] = useState(false);
  const [fullBookVideoUrl, setFullBookVideoUrl] = useState(null);
  const [centerViewMode, setCenterViewMode] = useState('page'); // 'page' or 'movie'

  // Audio Previewing States
  const [playingBgm, setPlayingBgm] = useState(null); // 'calm_piano', etc., or null
  const [playingVoice, setPlayingVoice] = useState(false);
  const previewAudioRef = useRef(null);

  const MODEL_LABELS = {
    pollinations: 'Pollinations AI',
    gemini: 'Gemini Flash Image',
    huggingface: 'HuggingFace FLUX'
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferenceImage(reader.result);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const isBook = appMode === 'book';

  // Active Key (e.g. "A" or "Page 1")
  const activePageKey = isBook ? selectedLetter : selectedHabitPage;

  // Active Maps
  const activeGeneratedImages = isBook ? generatedImages : habitGeneratedImages;
  const activeModelUsed = isBook ? modelUsed : habitModelUsed;
  const activeStories = isBook ? bookStories : habitStoryTexts;

  // Active Prompt and prompt editor sync
  const activePromptText = isBook ? editablePrompt : habitEditablePrompt;

  // Unified page list
  const pagesList = isBook ? Object.keys(customBookPrompts).sort() : Object.keys(habitPrompts).sort((a, b) => {
    const numA = parseInt(a.split(' ')[1]) || 0;
    const numB = parseInt(b.split(' ')[1]) || 0;
    return numA - numB;
  });

  // Active generating indicators
  const isGeneratingActiveImage = isBook ? isGenerating : isGeneratingHabitImage;
  const isGeneratingAllActive = isBook ? generatingAll : generatingAllHabits;

  // Automatically load page prompt whenever page, mode, or dynamic prompts change
  useEffect(() => {
    stopAllPreviews();
    if (isBook) {
      setEditablePrompt(customBookPrompts[selectedLetter] || '');
    } else {
      const pageData = habitPrompts[selectedHabitPage];
      const p = typeof pageData === 'object' ? pageData.prompt : pageData;
      setHabitEditablePrompt(p || '');
    }
  }, [selectedLetter, selectedHabitPage, appMode, customBookPrompts, habitPrompts]);

  // Clean up previews on unmount
  useEffect(() => {
    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
    };
  }, []);

  const handlePromptChange = (val) => {
    if (isBook) {
      setEditablePrompt(val);
      setCustomBookPrompts(prev => ({ ...prev, [selectedLetter]: val }));
    } else {
      setHabitEditablePrompt(val);
      setHabitPrompts(prev => {
        const pageData = prev[selectedHabitPage];
        if (typeof pageData === 'object') {
          return { ...prev, [selectedHabitPage]: { ...pageData, prompt: val } };
        }
        return { ...prev, [selectedHabitPage]: val };
      });
    }
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleGenerateImage = async (pageKey = activePageKey, promptText = activePromptText, signal = null) => {
    const isGeneratingSetter = isBook ? setIsGenerating : setIsGeneratingHabitImage;
    isGeneratingSetter(true);
    setError(null);

    if (!signal) {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      abortControllerRef.current = new AbortController();
      signal = abortControllerRef.current.signal;
    }

    try {
      const response = await fetch('/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          image: referenceImage,
          model: selectedModel
        }),
        signal
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Generation failed");

      if (isBook) {
        setGeneratedImages(prev => ({ ...prev, [pageKey]: data.image }));
        setModelUsed(prev => ({ ...prev, [pageKey]: selectedModel }));
      } else {
        setHabitGeneratedImages(prev => ({ ...prev, [pageKey]: data.image }));
        setHabitModelUsed(prev => ({ ...prev, [pageKey]: selectedModel }));
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(`Failed to generate image for ${pageKey}. ${err.message}`);
    } finally {
      isGeneratingSetter(false);
    }
  };

  const handleGenerateAll = async () => {
    const isGeneratingAllSetter = isBook ? setGeneratingAll : setGeneratingAllHabits;
    isGeneratingAllSetter(true);
    setError(null);

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    for (let i = 0; i < pagesList.length; i++) {
      if (signal.aborted) break;
      const pageKey = pagesList[i];
      setAllProgress(`Generating ${pageKey} (${i + 1}/${pagesList.length})...`);

      if (isBook) {
        setSelectedLetter(pageKey);
      } else {
        setSelectedHabitPage(pageKey);
      }

      const promptToUse = isBook
        ? customBookPrompts[pageKey]
        : (typeof habitPrompts[pageKey] === 'object' ? habitPrompts[pageKey].prompt : habitPrompts[pageKey]);

      try {
        await handleGenerateImage(pageKey, promptToUse, signal);
      } catch (err) {
        if (err.name === 'AbortError') break;
        console.error(`Failed bulk generation for ${pageKey}:`, err);
      }
    }
    isGeneratingAllSetter(false);
    setAllProgress('');
  };

  // Reset full book video URL whenever the app mode changes
  useEffect(() => {
    setFullBookVideoUrl(null);
    setCenterViewMode('page');
  }, [appMode]);

  // Automatically switch center lane view back to page image mode when selecting a new page
  useEffect(() => {
    setCenterViewMode('page');
  }, [activePageKey]);

  const compilePageVideoSegment = async (pageKey) => {
    const imgSrc = activeGeneratedImages[pageKey];
    const storyText = activeStories[pageKey] || '';

    if (!imgSrc) {
      throw new Error(`Please generate an image for page ${pageKey} first.`);
    }
    if (!storyText.trim()) {
      throw new Error(`Story narration text cannot be empty for page ${pageKey}.`);
    }

    const bgmValue = selectedBgm === 'ai_musicgen' ? customBgmPrompt : selectedBgm;
    const response = await fetch('/generate-audio-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: imgSrc,
        text: storyText,
        voice: selectedVoice,
        bgm: bgmValue,
        page_key: pageKey
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Video compilation failed");

    setGeneratedVideos(prev => ({ ...prev, [pageKey]: data.video_url }));
    return data.video_url;
  };

  const handleGenerateVideo = async (pageKey = activePageKey) => {
    setIsCompilingVideo(true);
    setError(null);

    try {
      await compilePageVideoSegment(pageKey);
    } catch (err) {
      console.error(err);
      setError(`Failed to compile narrated video for ${pageKey}: ${err.message}`);
    } finally {
      setIsCompilingVideo(false);
    }
  };

  const handleCompileFullMovie = async () => {
    setIsCompilingFullVideo(true);
    setError(null);
    setAllProgress("Verifying page files...");

    try {
      // 1. Verify that all pages have a generated image first
      const missingImages = [];
      for (const pageKey of pagesList) {
        if (!activeGeneratedImages[pageKey]) {
          missingImages.push(pageKey);
        }
      }

      if (missingImages.length > 0) {
        throw new Error(`Missing generated images for: ${missingImages.join(', ')}. Please generate images for these pages first!`);
      }

      const compiledFilenames = [];

      // 2. Loop and compile/ensure videos for each page sequentially
      for (let i = 0; i < pagesList.length; i++) {
        const pageKey = pagesList[i];
        setAllProgress(`Compiling segment ${pageKey} (${i + 1}/${pagesList.length})...`);

        let videoUrl = generatedVideos[pageKey];
        if (!videoUrl) {
          videoUrl = await compilePageVideoSegment(pageKey);
        }

        const fname = videoUrl.split('/').pop();
        compiledFilenames.push(fname);
      }

      // 3. Trigger backend instant concat merging
      setAllProgress("Merging segments into continuous storybook movie...");
      const response = await fetch('/compile-full-movie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_filenames: compiledFilenames })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Merge compilation failed");

      setFullBookVideoUrl(data.video_url);
      setCenterViewMode('movie');
      setRightPanelTab('media'); // Automatically open the video player tab
      setAllProgress("");
    } catch (err) {
      console.error(err);
      setError(`Movie compilation failed: ${err.message}`);
      setAllProgress("");
    } finally {
      setIsCompilingFullVideo(false);
    }
  };

  const stopAllPreviews = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    setPlayingBgm(null);
    setPlayingVoice(false);
  };

  const handlePreviewBgm = (bgmKey) => {
    if (playingBgm === bgmKey) {
      stopAllPreviews();
      return;
    }

    stopAllPreviews();

    const BGM_URLS = {
      calm_piano: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      happy_ukulele: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
      magical_fairytale: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
      playful_toyland: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3"
    };

    const url = BGM_URLS[bgmKey];
    if (!url) return;

    setPlayingBgm(bgmKey);
    const audio = new Audio(url);
    previewAudioRef.current = audio;
    audio.play().catch(err => {
      console.error("Failed to play BGM preview:", err);
      stopAllPreviews();
    });
    audio.onended = () => {
      stopAllPreviews();
    };
  };

  const handlePreviewVoice = async (voiceKey) => {
    if (playingVoice) {
      stopAllPreviews();
      return;
    }

    stopAllPreviews();
    setPlayingVoice(true);

    try {
      const response = await fetch(`/preview-voice?voice=${encodeURIComponent(voiceKey)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Failed to fetch voice preview URL");

      const audio = new Audio(data.audio_url);
      previewAudioRef.current = audio;
      audio.play().catch(err => {
        console.error("Failed to play voice preview:", err);
        stopAllPreviews();
      });
      audio.onended = () => {
        stopAllPreviews();
      };
    } catch (err) {
      console.error(err);
      setError(`Voice preview failed: ${err.message}`);
      stopAllPreviews();
    }
  };

  const bakePage = (page, imgSrc, storyText, titleText) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          const bannerHeight = Math.round(img.height * 0.20); // 20% fixed footer banner
          const canvasW = img.width;
          const canvasH = img.height + bannerHeight;

          const canvas = document.createElement('canvas');
          canvas.width = canvasW;
          canvas.height = canvasH;
          const ctx = canvas.getContext('2d');

          // Draw the original image
          ctx.drawImage(img, 0, 0, canvasW, img.height);

          // Draw white banner at bottom
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, img.height, canvasW, bannerHeight);

          // Draw a thin indigo separator line
          ctx.fillStyle = '#c7d2fe'; // indigo-200
          ctx.fillRect(0, img.height, canvasW, 4);

          // Draw story text centred in the banner
          ctx.fillStyle = '#1e293b'; // slate-800
          ctx.textAlign = 'center';

          // Word-wrap and dynamically scale the font size down to fit within the white space
          const maxWidth = canvasW * 0.88;
          const maxAllowedH = bannerHeight * 0.65; // leave 35% generous margin!
          let fontSize = Math.max(18, Math.round(bannerHeight * 0.16)); // elegant, smaller base size (32px)
          let lines = [];
          let lineH = fontSize * 1.35;
          let totalTextH = 0;

          while (fontSize > 8) {
            ctx.font = `bold ${fontSize}px Georgia, serif`;
            const words = storyText.split(' ');
            lines = [];
            let current = '';
            for (const word of words) {
              const test = current ? `${current} ${word}` : word;
              if (ctx.measureText(test).width > maxWidth && current) {
                lines.push(current);
                current = word;
              } else {
                current = test;
              }
            }
            if (current) lines.push(current);

            lineH = fontSize * 1.35;
            totalTextH = (lines.length - 1) * lineH + fontSize;
            if (totalTextH <= maxAllowedH) {
              break;
            }
            fontSize -= 2;
          }

          // Force top baseline alignment to make overlaps mathematically impossible
          ctx.textBaseline = 'top';
          ctx.font = `bold ${fontSize}px Georgia, serif`;

          // Centered padding, but never allow it to go above the banner (min 16px padding)
          const padding = Math.max(16, (bannerHeight - totalTextH) / 2);
          const startY = img.height + padding;

          lines.forEach((line, i) => {
            ctx.fillText(line, canvasW / 2, startY + i * lineH);
          });

          // Convert canvas to Blob
          canvas.toBlob((blob) => {
            resolve(blob);
          }, 'image/png');
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = (e) => reject(e);
      img.src = imgSrc;
    });
  };

  const handleDownloadPage = async (pageKey = activePageKey) => {
    const imgSrc = activeGeneratedImages[pageKey];
    const storyText = activeStories[pageKey] || '';
    if (!imgSrc) return;

    try {
      const blob = await bakePage(pageKey, imgSrc, storyText, isBook ? 'Book' : habitTitle);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const downloadName = isBook ? `Letter_${pageKey}.png` : `${habitTitle || 'Habit'}_${pageKey}.png`;
      a.download = downloadName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download page:", err);
    }
  };

  const handleDownloadAll = async () => {
    const zip = new JSZip();
    const folderName = isBook ? 'ABCD_Book_Pages' : `${habitTitle || 'Habit'}_Pages`;
    const folder = zip.folder(folderName);

    // Get list of pages that have generated images
    const generatedPages = pagesList.filter(pageKey => activeGeneratedImages[pageKey]);
    if (generatedPages.length === 0) return;

    const bakePromises = generatedPages.map(async (pageKey) => {
      const imgSrc = activeGeneratedImages[pageKey];
      const storyText = activeStories[pageKey] || '';
      const blob = await bakePage(pageKey, imgSrc, storyText, isBook ? 'Book' : habitTitle);
      return { pageKey, blob };
    });

    try {
      const results = await Promise.all(bakePromises);
      results.forEach(({ pageKey, blob }) => {
        const fileName = isBook ? `Letter_${pageKey}.png` : `${habitTitle || 'Habit'}_${pageKey}.png`;
        folder.file(fileName, blob);
      });
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `${folderName}.zip`);
    } catch (err) {
      console.error("Failed to download all pages:", err);
    }
  };

  const handleGenerateHabitChart = async () => {
    setIsGeneratingHabitPlan(true);
    setHabitPrompts({});
    setHabitStoryTexts({});
    setHabitEditablePrompt('');
    setHabitPlanProgress({ done: 0, total: 0 });
    setError(null);
    let firstPageSet = false;

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/generate-habit-chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: habitTitle,
          total_scenes: parseInt(habitTotalScenes),
          total_pages: parseInt(habitTotalPages),
          text_model: habitTextModel
        }),
        signal: abortControllerRef.current.signal
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Generation failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete last chunk
        for (const line of lines) {
          if (!line.trim()) continue;
          let msg;
          try { msg = JSON.parse(line); } catch { continue; }

          if (msg.type === 'meta') {
            setHabitPlanProgress({ done: 0, total: msg.total });
          } else if (msg.type === 'page') {
            const page = msg.page;
            const pageData = msg.data;
            setHabitPrompts(prev => ({ ...prev, [page]: pageData }));
            setHabitStoryTexts(prev => ({ ...prev, [page]: pageData.story || '' }));
            setHabitPlanProgress(prev => ({ ...prev, done: prev.done + 1 }));
            if (!firstPageSet) {
              firstPageSet = true;
              setSelectedHabitPage(page);
              setHabitEditablePrompt(pageData.prompt || '');
            }
          } else if (msg.type === 'error') {
            throw new Error(msg.detail || 'Stream error');
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Generation stopped by user.');
        return;
      }
      setError('Failed to generate habit plan. ' + err.message);
    } finally {
      setIsGeneratingHabitPlan(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl">
            <BookOpen className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Kids Book Generator</h1>
            <p className="text-xs text-slate-500 font-medium tracking-wider">AI Automation Studio</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Sparkles className="w-4 h-4 text-amber-500" />
          Powered by {MODEL_LABELS[selectedModel] || selectedModel}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left Sidebar - Controls */}
        <div className="w-72 bg-white border-r border-slate-200 flex flex-col" style={{ height: 'calc(100vh - 57px)' }}>

          {/* Generator Mode Selection */}
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-xs font-semibold text-slate-800 mb-2 flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-slate-400" />
              Generator Mode
            </h2>
            <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
              <button
                onClick={() => setAppMode('book')}
                className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${appMode === 'book' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Alphabet Book
              </button>
              <button
                onClick={() => setAppMode('habit')}
                className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${appMode === 'habit' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Habit Chart
              </button>
            </div>
          </div>

          {/* Image Upload Section */}
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-xs font-semibold text-slate-800 mb-2 flex items-center gap-2">
              <ImageIcon className="w-3 h-3 text-slate-400" />
              1. Child Reference Photo
            </h2>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`relative rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden group
                ${referenceImage ? 'border-indigo-200 bg-indigo-50/50' : 'border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-slate-100'} 
                h-28 flex flex-col items-center justify-center text-center p-2`}
            >
              {referenceImage ? (
                <>
                  <img src={referenceImage} alt="Reference" className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-50 transition-opacity" />
                  <div className="relative z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                    Change Photo
                  </div>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 text-indigo-500 mb-1" />
                  <p className="text-xs font-medium text-slate-700">Upload Photo</p>
                </>
              )}
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
            </div>
          </div>

          {/* Model Selection */}
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-xs font-semibold text-slate-800 mb-2 flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-slate-400" />
              Image Model
            </h2>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="pollinations">Pollinations (Free)</option>
              <option value="gemini">Gemini Flash</option>
              <option value="huggingface">HuggingFace FLUX</option>
            </select>
          </div>

          {/* Text Model Selection (Only for Habit Chart) */}
          {appMode === 'habit' && (
            <div className="p-4 border-b border-slate-100">
              <h2 className="text-xs font-semibold text-slate-800 mb-2 flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-slate-400" />
                Text Model
              </h2>
              <select
                value={habitTextModel}
                onChange={(e) => setHabitTextModel(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ollama">Ollama (Local Qwen3)</option>
                <option value="openrouter">OpenRouter (Cloud Free)</option>
              </select>
            </div>
          )}

          {/* Module-Specific Controls & Page Navigators */}
          <div className="p-4 border-b border-slate-100 flex-1 overflow-y-auto">
            {isBook ? (
              <>
                <h2 className="text-xs font-semibold text-slate-800 mb-2 flex items-center gap-2">
                  <BookOpen className="w-3 h-3 text-slate-400" />
                  2. Select Letter Page
                </h2>
                <div className="grid grid-cols-7 gap-1.5">
                  {Object.keys(customBookPrompts).sort().map(letter => (
                    <button
                      key={letter}
                      onClick={() => { setSelectedLetter(letter); }}
                      className={`relative p-1.5 rounded-lg text-center font-bold text-sm transition-all
                        ${selectedLetter === letter
                          ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-600 ring-offset-1'
                          : generatedImages[letter]
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}
                      `}
                    >
                      {letter}
                    </button>
                  ))}
                </div>
                <div className="mt-2 text-xs text-slate-400 text-center">
                  {Object.keys(generatedImages).length}/{Object.keys(customBookPrompts).length} pages generated
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xs font-semibold text-slate-800 mb-2 flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-slate-400" />
                  2. Habit Details
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Chart Title</label>
                    <input
                      type="text"
                      value={habitTitle}
                      onChange={(e) => setHabitTitle(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="e.g. Potty Training"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Total Scenes</label>
                      <input
                        type="number"
                        min="1" max="16"
                        value={habitTotalScenes}
                        onChange={(e) => setHabitTotalScenes(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Total Pages</label>
                      <input
                        type="number"
                        min="1" max={habitTotalScenes}
                        value={habitTotalPages}
                        onChange={(e) => setHabitTotalPages(Math.max(1, Math.min(habitTotalScenes, parseInt(e.target.value) || 1)))}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleGenerateHabitChart}
                    disabled={isGeneratingHabitPlan}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all
                      ${isGeneratingHabitPlan ? 'bg-indigo-400 text-white cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg'}`}
                  >
                    {isGeneratingHabitPlan ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />{' '}
                        {habitPlanProgress.total === 0
                          ? 'Analyzing...'
                          : `Pages ready: ${habitPlanProgress.done} / ${habitPlanProgress.total}`}
                      </>
                    ) : (
                      <><Sparkles className="w-4 h-4" /> Generate Chart Plan</>
                    )}
                  </button>
                </div>

                {Object.keys(habitPrompts).length > 0 && (
                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <h3 className="text-xs font-semibold text-slate-800 mb-2">3. Select Page</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.keys(habitPrompts)
                        .sort((a, b) => {
                          const numA = parseInt(a.split(' ')[1]) || 0;
                          const numB = parseInt(b.split(' ')[1]) || 0;
                          return numA - numB;
                        })
                        .map(page => (
                          <button
                            key={page}
                            onClick={() => { setSelectedHabitPage(page); }}
                            className={`relative p-2 rounded-lg text-center font-bold text-xs transition-all truncate
                              ${selectedHabitPage === page
                                ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-600 ring-offset-1'
                                : habitGeneratedImages[page]
                                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}
                            `}
                          >
                            {page}
                          </button>
                        ))}
                    </div>
                    <div className="mt-2 text-xs text-slate-400 text-center">
                      {Object.keys(habitGeneratedImages).length}/{Object.keys(habitPrompts).length} pages generated
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Unified Sidebar Action Buttons (Generate All & Download All ZIP) */}
          {(isBook || Object.keys(habitPrompts).length > 0) && (
            <div className="p-4 space-y-2 border-t border-slate-100 bg-slate-50/50">
              {allProgress && (
                <div className="p-2.5 mb-1 bg-indigo-50 border border-indigo-100 rounded-xl text-[10px] text-indigo-700 font-bold flex items-center gap-1.5 animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {allProgress}
                </div>
              )}
              <button
                onClick={handleGenerateAll}
                disabled={isGeneratingAllActive}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm
                  ${isGeneratingAllActive ? 'bg-amber-400 text-white cursor-wait' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}
              >
                {isGeneratingAllActive ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> {allProgress}</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Auto-Generate All Pages</>
                )}
              </button>
              {Object.keys(activeGeneratedImages).length > 0 && (
                <>
                  <button
                    onClick={handleCompileFullMovie}
                    disabled={isCompilingFullVideo || isGeneratingAllActive}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md
                      ${(isCompilingFullVideo || isGeneratingAllActive)
                        ? 'bg-indigo-400 text-white cursor-wait'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                  >
                    {isCompilingFullVideo ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Merging Movie...</>
                    ) : (
                      <><BookOpen className="w-4 h-4" /> 🎬 Compile Full Book Video</>
                    )}
                  </button>
                  <button
                    onClick={handleDownloadAll}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-600 text-white shadow-md transition-all"
                  >
                    <Download className="w-4 h-4" /> Download All ({Object.keys(activeGeneratedImages).length})
                  </button>
                </>
              )}
            </div>
          )}

        </div>

        {/* Right Area - Canvas & Prompt Editor (Reused Symmetrically) */}
        <div className="flex-1 bg-slate-50 flex flex-col" style={{ height: 'calc(100vh - 57px)' }}>
          <div className="flex-1 p-4 flex gap-4 w-full overflow-hidden">

            {/* Center Panel: Canvas */}
            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-slate-800">
                  {centerViewMode === 'movie'
                    ? `🎬 Continuous Full ${isBook ? 'Storybook' : habitTitle} Movie`
                    : (isBook ? `Letter ${activePageKey} Page` : `${habitTitle} - ${activePageKey}`)}
                </h2>
                <div className="flex items-center gap-2">
                  {/* View Mode Pill Switcher */}
                  {fullBookVideoUrl && (
                    <div className="flex bg-slate-200 p-0.5 rounded-xl border border-slate-300">
                      <button
                        onClick={() => setCenterViewMode('page')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${centerViewMode === 'page'
                          ? 'bg-white text-indigo-600 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                          }`}
                      >
                        🖼️ Page Preview
                      </button>
                      <button
                        onClick={() => setCenterViewMode('movie')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${centerViewMode === 'movie'
                          ? 'bg-white text-indigo-600 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                          }`}
                      >
                        🎬 Full Movie
                      </button>
                    </div>
                  )}

                  {centerViewMode === 'page' && activeModelUsed[activePageKey] && (
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs font-medium rounded-full">
                      via {MODEL_LABELS[activeModelUsed[activePageKey]]}
                    </span>
                  )}
                  {centerViewMode === 'page' && activeGeneratedImages[activePageKey] && (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wide rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Generated
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 flex-1 flex flex-col min-h-0">
                <div className="flex-1 bg-slate-100 rounded-xl overflow-hidden relative border border-slate-200 flex items-center justify-center min-h-0">
                  {centerViewMode === 'movie' && fullBookVideoUrl ? (
                    /* Continuous Full-Length Storybook Movie Playout */
                    <div className="flex flex-col h-full w-full bg-black relative">
                      <video
                        key={fullBookVideoUrl}
                        src={fullBookVideoUrl}
                        controls
                        autoPlay
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute bottom-4 right-4 flex gap-2">
                        <a
                          href={fullBookVideoUrl}
                          download={`${isBook ? 'Full_Storybook_Movie' : habitTitle}_complete.mp4`}
                          className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
                        >
                          <Download className="w-3.5 h-3.5" /> Download Full Movie
                        </a>
                      </div>
                    </div>
                  ) : isGeneratingActiveImage ? (
                    <div className="flex flex-col items-center text-indigo-600">
                      <Loader2 className="w-8 h-8 animate-spin mb-3" />
                      <p className="font-medium animate-pulse text-sm">Painting your masterpiece...</p>
                    </div>
                  ) : activeGeneratedImages[activePageKey] ? (
                    <div className="flex flex-col h-full w-full bg-white overflow-hidden">
                      {/* Image Section */}
                      <div className="flex-1 bg-slate-50 relative min-h-0 flex items-center justify-center p-2">
                        <img
                          src={activeGeneratedImages[activePageKey]}
                          alt={`Generated illustration for ${activePageKey}`}
                          className="w-full h-full object-contain rounded-lg shadow-sm border border-slate-200"
                        />
                      </div>
                      {/* Storybook Text Banner */}
                      <div className="px-4 py-3 bg-white border-t-2 border-indigo-100 flex-shrink-0">
                        <textarea
                          value={activeStories[activePageKey] || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (isBook) {
                              setBookStories(prev => ({ ...prev, [activePageKey]: val }));
                            } else {
                              setHabitStoryTexts(prev => ({ ...prev, [activePageKey]: val }));
                            }
                          }}
                          rows={2}
                          className="w-full text-center text-base font-bold text-slate-800 leading-relaxed font-serif tracking-wide resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200 rounded-lg p-2 bg-transparent border border-transparent hover:border-indigo-100 transition-colors"
                          placeholder="Story text will appear here after generating..."
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-slate-400 p-6">
                      <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p className="font-medium text-slate-500 mb-1">Canvas is empty</p>
                      <p className="text-xs">Click generate to render the '{activePageKey}' illustration</p>
                    </div>
                  )}
                </div>

                {centerViewMode === 'page' && (
                  <>
                    {error && (
                      <div className="mt-2 p-2 bg-red-50 text-red-700 rounded-lg border border-red-100 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <p className="text-xs">{error}</p>
                      </div>
                    )}

                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => handleGenerateImage(activePageKey, activePromptText)}
                        disabled={isGeneratingActiveImage || isGeneratingAllActive || (!isBook && Object.keys(habitPrompts).length === 0)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all
                          ${(isGeneratingActiveImage || (!isBook && Object.keys(habitPrompts).length === 0)) ? 'bg-indigo-400 text-white cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg'}`}
                      >
                        {isGeneratingActiveImage ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                        ) : (
                          <><Sparkles className="w-4 h-4" /> Generate '{activePageKey}'</>
                        )}
                      </button>

                      {activeGeneratedImages[activePageKey] && (
                        <button
                          onClick={() => handleDownloadPage(activePageKey)}
                          className="px-4 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
                          title="Download Page with Text"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right Panel: Tabbed Studio */}
            <div className="w-80 flex flex-col min-h-0">
              {/* Tab Selector */}
              <div className="flex border-b border-slate-200 mb-3 bg-slate-100 p-1 rounded-xl shrink-0">
                <button
                  onClick={() => setRightPanelTab('prompt')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${rightPanelTab === 'prompt'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Prompt Editor
                </button>
                <button
                  onClick={() => setRightPanelTab('media')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${rightPanelTab === 'media'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Audio & Video
                </button>
              </div>

              {rightPanelTab === 'prompt' ? (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden">
                    <textarea
                      value={activePromptText}
                      onChange={(e) => handlePromptChange(e.target.value)}
                      className="flex-1 w-full p-4 text-xs text-slate-600 leading-relaxed font-mono resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200 rounded-2xl"
                      placeholder="Page prompt will load here..."
                    />
                  </div>

                  <div className="mt-2 bg-amber-50 border border-amber-100 rounded-xl p-3 shrink-0">
                    <p className="text-xs text-amber-700 font-medium">
                      <strong>Tip:</strong> Edit the prompt above, then click Generate. Your custom details will be used immediately.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col min-h-0 overflow-y-auto space-y-4 pr-1">
                  {/* TTS Selection */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm shrink-0">
                    <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">1. Narration Voice</h4>
                    <div className="flex gap-2">
                      <select
                        value={selectedVoice}
                        onChange={(e) => setSelectedVoice(e.target.value)}
                        className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="en-US-AriaNeural">Edge: Aria (US Female)</option>
                        <option value="en-US-GuyNeural">Edge: Guy (US Male)</option>
                        <option value="en-US-AnaNeural">Edge: Ana (US Child)</option>
                        <option value="en-IN-NeerjaNeural">Edge: Neerja (IN Female)</option>
                        <option value="en-GB-SoniaNeural">Edge: Sonia (UK Female)</option>
                        <option value="gtts">Google TTS (Standard)</option>
                        <option value="eleven_21m00Tcm4TlvDq8ikWAM">ElevenLabs: Rachel (Premium)</option>
                      </select>
                      <button
                        onClick={() => handlePreviewVoice(selectedVoice)}
                        className={`px-3 flex items-center justify-center rounded-xl border font-bold text-xs transition-all shadow-sm ${playingVoice
                          ? 'bg-rose-500 border-rose-500 text-white animate-pulse'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        title="Listen to Voice Preview"
                      >
                        {playingVoice ? 'Stop' : 'Listen'}
                      </button>
                    </div>
                  </div>

                  {/* BGM Selection */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm shrink-0">
                    <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">2. Background Music</h4>
                    <div className="flex gap-2">
                      <select
                        value={selectedBgm}
                        onChange={(e) => setSelectedBgm(e.target.value)}
                        className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="none">No Background Music</option>
                        <option value="calm_piano">Bedtime Lullaby (Calm Piano)</option>
                        <option value="happy_ukulele">Preschool Joy (Happy Ukulele)</option>
                        <option value="magical_fairytale">Adventure (Fairytale Orchestral)</option>
                        <option value="playful_toyland">Whimsical (Playful Toyland)</option>
                        <option value="ai_musicgen">AI Generated Music (MusicGen)</option>
                      </select>
                      {selectedBgm !== 'none' && selectedBgm !== 'ai_musicgen' && (
                        <button
                          onClick={() => handlePreviewBgm(selectedBgm)}
                          className={`px-3 flex items-center justify-center rounded-xl border font-bold text-xs transition-all shadow-sm ${playingBgm === selectedBgm
                            ? 'bg-rose-500 border-rose-500 text-white animate-pulse'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          title="Listen to BGM Preview"
                        >
                          {playingBgm === selectedBgm ? 'Stop' : 'Listen'}
                        </button>
                      )}
                    </div>

                    {selectedBgm === 'ai_musicgen' && (
                      <div className="mt-2">
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">AI Music Prompt</label>
                        <textarea
                          value={customBgmPrompt}
                          onChange={(e) => setCustomBgmPrompt(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none h-16 resize-none font-mono"
                          placeholder="e.g. calm soft acoustic guitar loop, happy upbeat kindergarten music"
                        />
                      </div>
                    )}
                  </div>

                  {/* Actions & Player */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex-1 flex flex-col min-h-0">
                    <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider shrink-0">3. Compilation</h4>

                    <button
                      onClick={() => handleGenerateVideo()}
                      disabled={isCompilingVideo || !activeGeneratedImages[activePageKey]}
                      className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all mb-4 shrink-0
                        ${(isCompilingVideo || !activeGeneratedImages[activePageKey])
                          ? 'bg-indigo-400 text-white cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg'}`}
                    >
                      {isCompilingVideo ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Compiling Video...</>
                      ) : (
                        <><Sparkles className="w-4 h-4" /> Compile Narrated Video</>
                      )}
                    </button>

                    {/* Continuous Full Movie Indicator */}
                    {fullBookVideoUrl && (
                      <div className="mb-4 p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-center shrink-0">
                        <span className="text-[10px] uppercase font-bold text-indigo-700 tracking-wider flex items-center justify-center gap-1.5 animate-pulse">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Movie ready in Center Canvas!
                        </span>
                      </div>
                    )}

                    {/* HTML5 Video Player */}
                    {generatedVideos[activePageKey] ? (
                      <div className="space-y-3 flex-1 flex flex-col justify-end min-h-0">
                        <div className="rounded-xl overflow-hidden border border-slate-200 bg-black flex-1 flex items-center justify-center relative min-h-[150px]">
                          <video
                            key={generatedVideos[activePageKey]}
                            src={generatedVideos[activePageKey]}
                            controls
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <a
                          href={generatedVideos[activePageKey]}
                          download={`${isBook ? 'Book' : habitTitle}_${activePageKey}.mp4`}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-600 text-white shadow-md transition-all text-center shrink-0"
                        >
                          <Download className="w-4 h-4" /> Download MP4 Video
                        </a>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 min-h-[180px]">
                        <BookOpen className="w-8 h-8 text-slate-300 mb-2" />
                        <p className="text-xs text-slate-400 font-semibold">No video compiled yet</p>
                        <p className="text-[10px] text-slate-400 mt-1 max-w-[180px] mx-auto leading-relaxed">
                          Generate the page image first, write your story narration, then click Compile to render your video.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
