import React, { useState, useRef, useEffect } from 'react';
import { Upload, Image as ImageIcon, Sparkles, BookOpen, Download, AlertCircle, Loader2, XCircle, FolderOpen } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import AgentReviewPanel from './components/AgentReviewPanel';

// ─── Star Rating component ────────────────────────────────────────────────────
function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          title={`Rate ${star} star${star > 1 ? 's' : ''}`}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 24,
            color: star <= (hovered || value) ? '#f59e0b' : '#e2e8f0',
            transition: 'color 0.15s, transform 0.1s',
            padding: '0 2px',
            outline: 'none'
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}


export default function App() {
  const [referenceImage, setReferenceImage] = useState(null);
  const [appMode, setAppMode] = useState('book'); // 'book' or 'habit'
  const [photoSectionOpen, setPhotoSectionOpen] = useState(false); // collapsible child photo

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
  const [selectedVoice, setSelectedVoice] = useState('en-US-AnaNeural');
  const [selectedBgm, setSelectedBgm] = useState('playful_toyland');
  const [customBgmPrompt, setCustomBgmPrompt] = useState('gentle bedtime piano loop, calming instrumental');
  const [isCompilingVideo, setIsCompilingVideo] = useState(false);
  const [generatedVideos, setGeneratedVideos] = useState({}); // mapping: pageKey -> videoUrl
  const [isCompilingFullVideo, setIsCompilingFullVideo] = useState(false);
  const [fullBookVideoUrl, setFullBookVideoUrl] = useState(null);
  const [centerViewMode, setCenterViewMode] = useState('page'); // 'page' or 'movie'

  // Phase 3 — Agent Review Panel & Rating state
  const [reviewPanelOpen, setReviewPanelOpen] = useState(false);
  const [agentOutputs, setAgentOutputs] = useState({});    // { scene_plan: {id, data}, character_sheet: {id, data} }
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [pageRatings, setPageRatings] = useState({});      // { "Page 1": 4, ... }
  const [similarityInfo, setSimilarityInfo] = useState(null); // from /search-similar
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState('editor'); // 'editor' or 'studio'

  // Local unsaved states for Story Narration and Prompt editors
  const [tempStoryText, setTempStoryText] = useState('');
  const [tempPromptText, setTempPromptText] = useState('');

  // Project loading/session list states
  const [projectsList, setProjectsList] = useState([]);
  const [selectedLoadProjectId, setSelectedLoadProjectId] = useState('');
  const [matchingProjectFound, setMatchingProjectFound] = useState(null);


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

  // Sync local editor buffers with active state
  useEffect(() => {
    setTempStoryText(activeStories[activePageKey] || '');
  }, [activePageKey, activeStories]);

  useEffect(() => {
    setTempPromptText(activePromptText || '');
  }, [activePageKey, activePromptText]);

  const handleSaveStoryEdit = () => {
    handleStoryChange(activePageKey, tempStoryText);
  };
  const handleCancelStoryEdit = () => {
    setTempStoryText(activeStories[activePageKey] || '');
  };
  const handleSavePromptEdit = () => {
    handlePromptChange(tempPromptText);
  };
  const handleCancelPromptEdit = () => {
    setTempPromptText(activePromptText || '');
  };

  // Fetch list of saved projects from DB
  const fetchProjectsList = async () => {
    try {
      const response = await fetch('/list-projects');
      if (response.ok) {
        const data = await response.json();
        setProjectsList(data);
      }
    } catch (err) {
      console.warn("Failed to load projects list:", err);
    }
  };

  // Close project session and clear state
  const handleCloseProject = () => {
    setCurrentProjectId(null);
    localStorage.removeItem('current_project_id');
    setHabitTitle('Potty Training');
    setHabitStoryTexts({});
    setHabitPrompts({});
    setHabitGeneratedImages({});
    setHabitModelUsed({});
    setGeneratedVideos({});
    setFullBookVideoUrl(null);
    setAgentOutputs({});
    setPageRatings({});
    setSimilarityInfo(null);
    setSelectedLoadProjectId('');
    setSelectedHabitPage('Page 1');
    fetchProjectsList();
  };

  // Fetch projects list when appMode is switched to any non-book mode
  useEffect(() => {
    if (appMode !== 'book') {
      fetchProjectsList();
    }
  }, [appMode]);

  // Clean up previews on unmount
  useEffect(() => {
    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
    };
  }, []);

  // Load last session project on mount if it exists
  useEffect(() => {
    const savedProjectId = localStorage.getItem('current_project_id');
    if (savedProjectId) {
      const projectId = parseInt(savedProjectId);
      if (projectId) {
        loadProjectFromDb(projectId);
      }
    }
  }, []);

  const loadProjectFromDb = async (projectId) => {
    try {
      const response = await fetch(`/get-project/${projectId}`);
      if (!response.ok) throw new Error("Project not found");
      const data = await response.json();
      
      setCurrentProjectId(data.project_id);
      setHabitTitle(data.title);
      localStorage.setItem('current_project_id', data.project_id.toString());
      
      const outputs = data.agent_outputs || [];
      const coreOutputs = {};
      const prompts = {};
      const stories = {};
      
      outputs.forEach(o => {
        if (o.page_name === 'scene_plan') {
          coreOutputs.scene_plan = { id: o.id, data: o.raw_output };
        } else if (o.page_name === 'character_sheet') {
          coreOutputs.character_sheet = { id: o.id, data: o.raw_output };
        } else if (o.page_name.startsWith('Page ')) {
          prompts[o.page_name] = {
            prompt: o.raw_output?.prompt || '',
            story: o.raw_output?.story || '',
            output_id: o.id
          };
          stories[o.page_name] = o.raw_output?.story || '';
        }
      });
      
      setAgentOutputs(coreOutputs);
      setHabitPrompts(prompts);
      setHabitStoryTexts(stories);
      setHabitGeneratedImages(data.images || {});
      setGeneratedVideos(data.videos || {});
      setFullBookVideoUrl(data.full_video || null);
      
      const sortedPages = Object.keys(prompts).sort((a, b) => {
        const numA = parseInt(a.split(' ')[1]) || 0;
        const numB = parseInt(b.split(' ')[1]) || 0;
        return numA - numB;
      });
      if (sortedPages.length > 0) {
        setSelectedHabitPage(sortedPages[0]);
      }
    } catch (err) {
      console.warn("Failed to restore project session:", err.message);
      localStorage.removeItem('current_project_id');
    }
  };

  const handleSaveCoreAgentOutput = (section, data) => {
    setAgentOutputs(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        data: data
      }
    }));
  };

  const updatePageAgentOutputInDb = async (outputId, promptText, storyText) => {
    try {
      await fetch('/update-review', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          output_id: outputId,
          edited_output: { prompt: promptText, story: storyText }
        })
      });
    } catch (err) {
      console.error("Failed to update page output in DB:", err);
    }
  };

  const handlePromptChange = (val) => {
    if (isBook) {
      setEditablePrompt(val);
      setCustomBookPrompts(prev => ({ ...prev, [selectedLetter]: val }));
    } else {
      setHabitEditablePrompt(val);
      setHabitPrompts(prev => {
        const pageData = prev[selectedHabitPage];
        if (typeof pageData === 'object' && pageData !== null) {
          if (pageData.output_id) {
            updatePageAgentOutputInDb(pageData.output_id, val, habitStoryTexts[selectedHabitPage] || '');
          }
          return { ...prev, [selectedHabitPage]: { ...pageData, prompt: val } };
        } else {
          return { ...prev, [selectedHabitPage]: { prompt: val, story: habitStoryTexts[selectedHabitPage] || '' } };
        }
      });
    }
  };

  const handleStoryChange = (pageKey, val) => {
    if (isBook) {
      setBookStories(prev => ({ ...prev, [pageKey]: val }));
    } else {
      setHabitStoryTexts(prev => ({ ...prev, [pageKey]: val }));
      setHabitPrompts(prev => {
        const pageData = prev[pageKey];
        const currentPrompt = typeof pageData === 'object' && pageData !== null ? (pageData.prompt || '') : (pageData || '');
        if (typeof pageData === 'object' && pageData !== null) {
          if (pageData.output_id) {
            updatePageAgentOutputInDb(pageData.output_id, currentPrompt, val);
          }
          return { ...prev, [pageKey]: { ...pageData, story: val } };
        }
        return { ...prev, [pageKey]: { prompt: currentPrompt, story: val } };
      });
    }
  };

  const handlePageRating = async (score) => {
    setPageRatings(prev => ({ ...prev, [activePageKey]: score }));
    if (!currentProjectId) return;
    try {
      await fetch('/save-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: currentProjectId,
          page_name: activePageKey,
          score: score,
          is_book_level: false
        })
      });
    } catch (err) {
      console.error('Rating save error:', err);
    }
  };

  const handleBookRate = async (score) => {
    const allRatings = {};
    pagesList.forEach(p => { allRatings[p] = score; });
    setPageRatings(allRatings);
    
    if (!currentProjectId) return;
    try {
      await fetch('/save-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: currentProjectId,
          page_name: 'all',
          score: score,
          is_book_level: true,
          feedback_text: score === 5 ? 'Book-level thumbs up' : 'Book-level thumbs down'
        })
      });
    } catch (err) {
      console.error('Book rating error:', err);
    }
  };

  const handleSaveProject = async () => {
    if (!currentProjectId) return;
    setIsSavingProject(true);
    setError(null);
    setSaveSuccess(false);
    
    const storiesData = {};
    const promptsData = {};
    const imagesData = {};
    const videosData = {};
    
    pagesList.forEach(page => {
      storiesData[page] = habitStoryTexts[page] || '';
      promptsData[page] = typeof habitPrompts[page] === 'object' ? habitPrompts[page].prompt : (habitPrompts[page] || '');
      imagesData[page] = habitGeneratedImages[page] || '';
      videosData[page] = generatedVideos[page] || '';
    });
    
    try {
      const response = await fetch('/save-project-assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: currentProjectId,
          stories: storiesData,
          prompts: promptsData,
          images: imagesData,
          videos: videosData,
          full_video: fullBookVideoUrl || null
        })
      });
      if (!response.ok) throw new Error("Failed to save project assets");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError("Failed to save project to DB: " + err.message);
    } finally {
      setIsSavingProject(false);
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

  const proceedWithCorePlanGeneration = async () => {
    setIsGeneratingHabitPlan(true);
    try {
      const response = await fetch('/generate-core-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: habitTitle,
          total_scenes: parseInt(habitTotalScenes),
          total_pages: parseInt(habitTotalPages),
          text_model: habitTextModel
        })
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Plan generation failed');
      }

      const data = await response.json();
      setCurrentProjectId(data.project_id);
      localStorage.setItem('current_project_id', data.project_id.toString());
      setAgentOutputs({
        scene_plan: data.scene_plan,
        character_sheet: data.character_sheet
      });
    } catch (err) {
      setError('Failed to generate plan. ' + err.message);
    } finally {
      setIsGeneratingHabitPlan(false);
    }
  };

  const handleGenerateCorePlan = async () => {
    setIsGeneratingHabitPlan(true);
    setHabitPrompts({});
    setHabitStoryTexts({});
    setHabitEditablePrompt('');
    setHabitPlanProgress({ done: 0, total: 0 });
    setError(null);
    setAgentOutputs({});       // reset review panel state
    setCurrentProjectId(null);
    setSimilarityInfo(null);
    setPageRatings({});
    setMatchingProjectFound(null);

    // Phase 3: pre-flight similarity check
    try {
      const simRes = await fetch('/search-similar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: habitTitle,
          age: 3, // default — will refine when ChildProfile is wired in UI
          style: 'Pixar-style illustration',
          product_type: 'habit_book'
        })
      });
      if (simRes.ok) {
        const simData = await simRes.json();
        setSimilarityInfo(simData);
        if (simData.found) {
          setMatchingProjectFound(simData);
          setIsGeneratingHabitPlan(false);
          return; // Pause execution for user decision popup
        }
      }
    } catch (simErr) {
      console.warn('Similarity check skipped:', simErr.message);
    }

    await proceedWithCorePlanGeneration();
  };

  const handleConfirmAndGeneratePages = async () => {
    if (!currentProjectId) return;
    setIsGeneratingHabitPlan(true); // show progress indicator
    setHabitPrompts({});
    setHabitStoryTexts({});
    setHabitPlanProgress({ done: 0, total: 0 });
    setError(null);

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/generate-story-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: currentProjectId,
          text_model: habitTextModel
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Story generation failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let firstPageSet = false;

      // Close the review modal so user sees the progress bar
      setReviewPanelOpen(false);

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
      setError('Failed to generate story pages. ' + err.message);
    } finally {
      setIsGeneratingHabitPlan(false);
    }
  };


  return (
    <>
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
        <div className="bg-white border-r border-slate-200 flex flex-col shrink-0" style={{ width: '40%', minWidth: '250px', maxWidth: '380px', height: 'calc(100vh - 57px)' }}>

          {/* Generator Mode Selection */}
          <div className="px-3 pt-3 pb-2 border-b border-slate-100">
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" /> Generator Mode
            </label>
            <select
              value={appMode}
              onChange={(e) => setAppMode(e.target.value)}
              className="w-full py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            >
              <option value="book">📚 Alphabet Book</option>
              <option value="habit">✅ Habit Training</option>
              <option value="rhymes">🎵 Rhymes</option>
              <option value="story">📖 Story</option>
            </select>
          </div>

          {/* Project Session Management — shown for non-alphabet modes */}
          {appMode !== 'book' && (
            <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/30">
              <div className="flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                  <FolderOpen className="w-3 h-3" />
                  Project Session
                </span>
                {currentProjectId && (
                  <button
                    onClick={handleCloseProject}
                    className="text-[10px] text-rose-500 hover:text-rose-700 font-bold hover:underline"
                    title="Close current project session"
                  >
                    ✕ Close
                  </button>
                )}
              </div>
              {currentProjectId ? (
                <div className="px-2 py-1.5 bg-indigo-50/60 border border-indigo-100 rounded-lg flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">ID:</span>
                  <span className="font-mono font-bold text-indigo-700">#{currentProjectId}</span>
                  <span className="text-slate-400 mx-1">·</span>
                  <span className="text-slate-600 font-semibold truncate max-w-[100px]">{habitTitle}</span>
                </div>
              ) : (
                <div className="flex gap-1">
                  <select
                    value={selectedLoadProjectId || ''}
                    onChange={(e) => {
                      setSelectedLoadProjectId(e.target.value);
                      if (e.target.value) loadProjectFromDb(parseInt(e.target.value));
                    }}
                    className="flex-1 py-1.5 px-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none"
                  >
                    <option value="">-- Open Existing --</option>
                    {projectsList.map((p) => (
                      <option key={p.id} value={p.id}>#{p.id} - {p.title}</option>
                    ))}
                  </select>
                  <button
                    onClick={fetchProjectsList}
                    className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-xs"
                    title="Refresh"
                  >🔄</button>
                </div>
              )}
            </div>
          )}

          {/* Image Upload Section — Collapsible Mini */}
          <div className="border-b border-slate-100">
            <button
              onClick={() => setPhotoSectionOpen(o => !o)}
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-50 transition-colors"
            >
              <span className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                <ImageIcon className="w-3 h-3" />
                Child Ref Photo
                {referenceImage && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />}
              </span>
              <span className="text-[10px] text-slate-400">{photoSectionOpen ? '▲' : '▼'}</span>
            </button>
            {photoSectionOpen && (
              <div className="px-3 pb-2">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative rounded-lg border-2 border-dashed cursor-pointer overflow-hidden group transition-all
                    ${referenceImage ? 'border-indigo-200 bg-indigo-50/50' : 'border-slate-200 hover:border-indigo-400 bg-slate-50'}
                    h-20 flex items-center justify-center`}
                >
                  {referenceImage ? (
                    <>
                      <img src={referenceImage} alt="Reference" className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-50 transition-opacity" />
                      <div className="relative z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white px-2 py-0.5 rounded-full text-[10px] font-medium">
                        Change
                      </div>
                    </>
                  ) : (
                    <div className="text-center">
                      <Upload className="w-4 h-4 text-indigo-500 mx-auto mb-0.5" />
                      <p className="text-[10px] text-slate-500">Upload Photo</p>
                    </div>
                  )}
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                </div>
              </div>
            )}
          </div>

          {/* Model Selection — moved to center action bar */}


          {/* Module-Specific Controls & Page Navigators */}
          <div className="px-3 py-3 flex-1 overflow-y-auto flex flex-col gap-3">
            {isBook ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                    <BookOpen className="w-3 h-3" /> Pages
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {Object.keys(generatedImages).length}/{Object.keys(customBookPrompts).length} done
                  </span>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Object.keys(customBookPrompts).sort().map(letter => (
                    <button
                      key={letter}
                      onClick={() => setSelectedLetter(letter)}
                      className={`p-1.5 rounded-md text-center font-bold text-xs transition-all
                        ${selectedLetter === letter
                          ? 'bg-indigo-600 text-white shadow ring-2 ring-indigo-600 ring-offset-1'
                          : generatedImages[letter]
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}
                      `}
                    >
                      {letter}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                {/* Title input */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                    {appMode === 'habit' ? 'Training Title' : appMode === 'rhymes' ? 'Rhyme Name' : 'Story Name'}
                  </label>
                  <input
                    type="text"
                    value={habitTitle}
                    onChange={(e) => setHabitTitle(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder={
                      appMode === 'habit' ? 'e.g. Potty Training' :
                      appMode === 'rhymes' ? 'e.g. Twinkle Twinkle' : 'e.g. The Magic Forest'
                    }
                  />
                </div>

                {/* Total Pages */}
                <div className="flex items-center gap-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Total Pages</label>
                  <input
                    type="number"
                    min="1" max="16"
                    value={habitTotalPages}
                    onChange={(e) => {
                      const v = Math.max(1, parseInt(e.target.value) || 1);
                      setHabitTotalPages(v);
                      setHabitTotalScenes(v);
                    }}
                    className="w-16 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none text-center"
                  />
                </div>

                {/* Model Selection */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Model Selection</label>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-500 w-8 shrink-0">Image:</span>
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="flex-1 py-1.5 px-2 bg-white border border-slate-200 rounded-lg text-[10px] font-medium text-slate-600 shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      >
                        <option value="pollinations">Pollinations (Free)</option>
                        <option value="gemini">Gemini Flash</option>
                        <option value="huggingface">HuggingFace FLUX</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-500 w-8 shrink-0">Text:</span>
                      <select
                        value={habitTextModel}
                        onChange={(e) => setHabitTextModel(e.target.value)}
                        className="flex-1 py-1.5 px-2 bg-white border border-slate-200 rounded-lg text-[10px] font-medium text-slate-600 shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      >
                        <option value="ollama">Ollama (Local)</option>
                        <option value="openrouter">OpenRouter (Cloud)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Generate / Review buttons — equal size, taller */}
                {agentOutputs.scene_plan?.id ? (
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleGenerateCorePlan}
                      disabled={isGeneratingHabitPlan}
                      className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all
                        ${isGeneratingHabitPlan ? 'bg-indigo-400 text-white cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'}`}
                    >
                      {isGeneratingHabitPlan ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> {habitPlanProgress.total === 0 ? 'Analyzing...' : `${habitPlanProgress.done}/${habitPlanProgress.total} pages`}</>
                      ) : (
                        <><Sparkles className="w-4 h-4" /> Re-generate Plan</>
                      )}
                    </button>
                    <button
                      onClick={() => setReviewPanelOpen(true)}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm bg-violet-600 hover:bg-violet-700 text-white shadow-md transition-all"
                    >
                      🤖 Review Core Agent
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleGenerateCorePlan}
                    disabled={isGeneratingHabitPlan}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all
                      ${isGeneratingHabitPlan ? 'bg-indigo-400 text-white cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'}`}
                  >
                    {isGeneratingHabitPlan ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> {habitPlanProgress.total === 0 ? 'Analyzing...' : `${habitPlanProgress.done}/${habitPlanProgress.total} pages`}</>
                    ) : (
                      <><Sparkles className="w-4 h-4" /> Generate Plan</>
                    )}
                  </button>
                )}

                {/* Similarity badge */}
                {similarityInfo?.found && !isGeneratingHabitPlan && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-[10px] text-blue-700 font-semibold">
                    <span>⚡</span>
                    <span>Similar found ({Math.round((similarityInfo.similarity_score || 0) * 100)}% match)</span>
                  </div>
                )}

                {/* Pages grid + Compile Movie + Save Project */}
                {Object.keys(habitPrompts).length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                        Pages &middot; {Object.keys(habitGeneratedImages).length}/{Object.keys(habitPrompts).length} done
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {Object.keys(habitPrompts)
                        .sort((a, b) => (parseInt(a.split(' ')[1]) || 0) - (parseInt(b.split(' ')[1]) || 0))
                        .map(page => (
                          <button
                            key={page}
                            onClick={() => setSelectedHabitPage(page)}
                            className={`p-1.5 rounded-lg text-center font-bold text-xs transition-all truncate
                              ${selectedHabitPage === page
                                ? 'bg-indigo-600 text-white shadow ring-2 ring-indigo-600 ring-offset-1'
                                : habitGeneratedImages[page]
                                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}
                            `}
                          >
                            {page}
                          </button>
                        ))}
                    </div>
                    {/* Compile Full Movie — above Save Project */}
                    {Object.keys(activeGeneratedImages).length > 0 && (
                      <button
                        onClick={handleCompileFullMovie}
                        disabled={isCompilingFullVideo || isGeneratingAllActive}
                        className={`mt-2 w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all shadow-md
                          ${(isCompilingFullVideo || isGeneratingAllActive)
                            ? 'bg-slate-400 text-white cursor-wait'
                            : 'bg-violet-600 hover:bg-violet-700 text-white'}`}
                      >
                        {isCompilingFullVideo
                          ? <><Loader2 className="w-4 h-4 animate-spin" /> Compiling Movie...</>
                          : <>🎬 Compile Full Movie</>}
                      </button>
                    )}
                    {/* Save Project — full width below compile */}
                    {currentProjectId && (
                      <button
                        onClick={handleSaveProject}
                        disabled={isSavingProject}
                        className={`mt-2 w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all shadow-md
                          ${saveSuccess ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                      >
                        {isSavingProject
                          ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                          : saveSuccess
                          ? <>✅ Project Saved!</>
                          : <>💾 Save Project</>}
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Save Project removed from bottom — moved inline above pages */}

        </div>

        {/* Right Area - Canvas & Prompt Editor */}
        <div className="flex-1 bg-slate-50 flex flex-col" style={{ height: 'calc(100vh - 57px)' }}>
          <div className="flex-1 p-3 flex gap-3 w-full overflow-hidden">

            {/* Center Panel: Canvas — 35% of 60% remaining = 58% of right area */}
            <div style={{ width: '58%' }} className="flex flex-col min-w-0">
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
                        <p className="w-full text-center text-base font-bold text-slate-800 leading-relaxed font-serif tracking-wide p-2">
                          {activeStories[activePageKey] || 'Story text will appear here after generating...'}
                        </p>
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

                    {/* Single page generate + download */}
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => handleGenerateImage(activePageKey, activePromptText)}
                        disabled={isGeneratingActiveImage || isGeneratingAllActive || (!isBook && Object.keys(habitPrompts).length === 0)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-bold text-xs transition-all
                          ${(isGeneratingActiveImage || (!isBook && Object.keys(habitPrompts).length === 0)) ? 'bg-indigo-400 text-white cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'}`}
                      >
                        {isGeneratingActiveImage ? (
                          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...</>
                        ) : (
                          <><Sparkles className="w-3.5 h-3.5" /> Generate '{activePageKey}'</>
                        )}
                      </button>

                      {activeGeneratedImages[activePageKey] && (
                        <button
                          onClick={() => handleDownloadPage(activePageKey)}
                          className="px-3 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                          title="Download Page with Text"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* ── Action Row: Generate All Pages | Download All ── */}
                    {(isBook || Object.keys(habitPrompts).length > 0) && (
                      <div className="mt-2 flex items-center gap-2">
                        {/* Image Model dropdown — book mode only (others use sidebar) */}
                        {isBook && (
                          <select
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            title="Image Model"
                            className="min-w-0 py-2 px-2 bg-white border border-slate-200 rounded-xl text-[10px] font-medium text-slate-600 shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
                          >
                            <option value="pollinations">🖼️ Pollinations</option>
                            <option value="gemini">🖼️ Gemini</option>
                            <option value="huggingface">🖼️ HuggingFace</option>
                          </select>
                        )}

                        {/* Generate All Pages */}
                        <button
                          onClick={handleGenerateAll}
                          disabled={isGeneratingAllActive}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-bold text-sm transition-all shadow-sm
                            ${isGeneratingAllActive ? 'bg-amber-400 text-white cursor-wait' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}
                        >
                          {isGeneratingAllActive
                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                            : <><Sparkles className="w-4 h-4" /> Generate All Pages</>}
                        </button>

                        {/* Download All */}
                        {Object.keys(activeGeneratedImages).length > 0 && (
                          <button
                            onClick={handleDownloadAll}
                            title={`Download All (${Object.keys(activeGeneratedImages).length})`}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition-all"
                          >
                            <Download className="w-4 h-4" />
                            Download All ({Object.keys(activeGeneratedImages).length})
                          </button>
                        )}
                      </div>
                    )}

                    {/* Progress bar */}
                    {allProgress && (
                      <div className="mt-1.5 flex items-center gap-1.5 p-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-[10px] text-indigo-700 font-bold animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        {allProgress}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Right Panel: Editor & Audio/Video Studio — 25% of 60% remaining = 42% of right area */}
            <div style={{ width: '42%' }} className="flex flex-col min-h-0 bg-white border border-slate-200 rounded-2xl p-3 shadow-sm overflow-hidden">
              
              {/* Tab Selector pills */}
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 mb-4 shrink-0">
                <button
                  onClick={() => setRightPanelTab('editor')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    rightPanelTab === 'editor'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  📝 Page Story &amp; Prompt Editor
                </button>
                <button
                  onClick={() => setRightPanelTab('studio')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    rightPanelTab === 'studio'
                      ? 'bg-white text-indigo-650 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  🎙️ Audio &amp; Video Studio
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 flex flex-col min-h-0 overflow-y-auto pr-1">
                {rightPanelTab === 'editor' ? (
                  /* Expanded Page Story & Prompt Editor */
                  <div className="flex-1 flex flex-col min-h-0 space-y-4">
                    {/* Narration Text Area */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10px] uppercase font-bold text-slate-400">Narration Text (Storyline)</label>
                        {tempStoryText !== (activeStories[activePageKey] || '') && (
                          <div className="flex items-center gap-1.5 animate-fadeIn">
                            <button
                              onClick={handleSaveStoryEdit}
                              className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[10px] font-bold transition-all border border-emerald-200"
                              title="Save story narration"
                            >
                              ✓ Save
                            </button>
                            <button
                              onClick={handleCancelStoryEdit}
                              className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 text-[10px] font-bold transition-all border border-rose-200"
                              title="Cancel edits"
                            >
                              ✕ Cancel
                            </button>
                          </div>
                        )}
                      </div>
                      <textarea
                        value={tempStoryText}
                        onChange={(e) => setTempStoryText(e.target.value)}
                        rows={3}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none font-medium text-slate-700"
                        placeholder="Story narration text will appear here..."
                      />
                    </div>

                    {/* Prompt Text Area */}
                    <div className="flex-1 flex flex-col min-h-0">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10px] uppercase font-bold text-slate-400">Image Generation Prompt</label>
                        {tempPromptText !== (activePromptText || '') && (
                          <div className="flex items-center gap-1.5 animate-fadeIn">
                            <button
                              onClick={handleSavePromptEdit}
                              className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[10px] font-bold transition-all border border-emerald-200"
                              title="Save image prompt"
                            >
                              ✓ Save
                            </button>
                            <button
                              onClick={handleCancelPromptEdit}
                              className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 text-[10px] font-bold transition-all border border-rose-200"
                              title="Cancel edits"
                            >
                              ✕ Cancel
                            </button>
                          </div>
                        )}
                      </div>
                      <textarea
                        value={tempPromptText}
                        onChange={(e) => setTempPromptText(e.target.value)}
                        className="w-full flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none font-mono text-slate-650"
                        placeholder="Image generation prompt..."
                      />
                    </div>

                    {/* Ratings */}
                    <div className="pt-3 border-t border-slate-100 space-y-3">
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Page Rating ({activePageKey})</span>
                        <div className="flex items-center gap-2">
                          <StarRating value={pageRatings[activePageKey] || 0} onChange={handlePageRating} />
                          <span className="text-xs font-semibold text-amber-600">
                            {pageRatings[activePageKey] ? `${pageRatings[activePageKey]} / 5` : 'Unrated'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Book-Level Rating (All Pages)</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleBookRate(5)}
                            className="flex-1 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition-all"
                          >
                            👍 Thumbs Up All
                          </button>
                          <button
                            onClick={() => handleBookRate(1)}
                            className="flex-1 py-1.5 rounded-lg text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-sm transition-all"
                          >
                            👎 Thumbs Down
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Expanded Audio & Video Studio */
                  <div className="flex-1 flex flex-col min-h-0 space-y-4">
                    {/* TTS Selection */}
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">1. Voice</h4>
                      <div className="flex gap-1.5">
                        <select
                          value={selectedVoice}
                          onChange={(e) => setSelectedVoice(e.target.value)}
                          className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 shadow-sm focus:outline-none"
                        >
                          <option value="en-US-AriaNeural">Edge: Aria (US Female)</option>
                          <option value="en-US-GuyNeural">Edge: Guy (US Male)</option>
                          <option value="en-US-AnaNeural">Edge: Ana (US Child)</option>
                          <option value="en-IN-NeerjaNeural">Edge: Neerja (IN Female)</option>
                          <option value="en-GB-SoniaNeural">Edge: Sonia (UK Female)</option>
                          <option value="gtts">Google TTS (Standard)</option>
                          <option value="eleven_21m00Tcm4TlvDq8ikWAM">ElevenLabs: Rachel</option>
                        </select>
                        <button
                          onClick={() => handlePreviewVoice(selectedVoice)}
                          className={`px-3 py-1.5 rounded-lg border font-bold text-[10px] transition-all shadow-sm ${playingVoice
                            ? 'bg-rose-500 border-rose-500 text-white animate-pulse'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                        >
                          {playingVoice ? 'Stop' : 'Listen'}
                        </button>
                      </div>
                    </div>

                    {/* BGM Selection */}
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">2. Background Music</h4>
                      <div className="flex gap-1.5">
                        <select
                          value={selectedBgm}
                          onChange={(e) => setSelectedBgm(e.target.value)}
                          className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 shadow-sm focus:outline-none"
                        >
                          <option value="none">No Background Music</option>
                          <option value="calm_piano">Bedtime Lullaby (Piano)</option>
                          <option value="happy_ukulele">Preschool Joy (Ukulele)</option>
                          <option value="magical_fairytale">Adventure (Fairytale)</option>
                          <option value="playful_toyland">Whimsical (Toyland)</option>
                          <option value="ai_musicgen">AI Generated Music</option>
                        </select>
                        {selectedBgm !== 'none' && selectedBgm !== 'ai_musicgen' && (
                          <button
                            onClick={() => handlePreviewBgm(selectedBgm)}
                            className={`px-3 py-1.5 rounded-lg border font-bold text-[10px] transition-all shadow-sm ${playingBgm === selectedBgm
                              ? 'bg-rose-500 border-rose-500 text-white animate-pulse'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                          >
                            {playingBgm === selectedBgm ? 'Stop' : 'Listen'}
                          </button>
                        )}
                      </div>
                      {selectedBgm === 'ai_musicgen' && (
                        <div className="mt-1.5">
                          <textarea
                            value={customBgmPrompt}
                            onChange={(e) => setCustomBgmPrompt(e.target.value)}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[10px] focus:ring-1 focus:ring-indigo-500 focus:outline-none h-12 resize-none"
                            placeholder="e.g. calm soft acoustic guitar loop"
                          />
                        </div>
                      )}
                    </div>

                    {/* Actions & Player */}
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex-1 flex flex-col min-h-0 justify-between">
                      <div>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">3. Video Generation</h4>
                        <button
                          onClick={() => handleGenerateVideo()}
                          disabled={isCompilingVideo || !activeGeneratedImages[activePageKey]}
                          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs transition-all mb-2
                            ${(isCompilingVideo || !activeGeneratedImages[activePageKey])
                              ? 'bg-indigo-400 text-white cursor-not-allowed'
                              : 'bg-indigo-650 hover:bg-indigo-700 text-white shadow-sm'}`}
                        >
                          {isCompilingVideo ? (
                            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Compiling...</>
                          ) : (
                            <><Sparkles className="w-3.5 h-3.5" /> Compile Narrated Video</>
                          )}
                        </button>

                        {fullBookVideoUrl && (
                          <div className="mb-2 p-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-center">
                            <span className="text-[9px] uppercase font-bold text-indigo-700 tracking-wider flex items-center justify-center gap-1 animate-pulse">
                              🎬 Full Movie Ready in Canvas!
                            </span>
                          </div>
                        )}
                      </div>

                      {/* HTML5 Video Player */}
                      {generatedVideos[activePageKey] ? (
                        <div className="space-y-2 flex-1 flex flex-col justify-end min-h-0 mt-2">
                          <div className="rounded-lg overflow-hidden border border-slate-200 bg-black flex-1 flex items-center justify-center relative min-h-[140px]">
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
                            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-bold text-[10px] bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition-all text-center"
                          >
                            <Download className="w-3 h-3" /> Download MP4 Video
                          </a>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-200 rounded-lg bg-white min-h-[140px] mt-2">
                          <BookOpen className="w-6 h-6 text-slate-300 mb-1" />
                          <p className="text-[10px] text-slate-400 font-semibold">No video compiled yet</p>
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
    </div>

      <AgentReviewPanel
        isOpen={reviewPanelOpen}
        onClose={() => setReviewPanelOpen(false)}
        agentOutputs={agentOutputs}
        onConfirm={handleConfirmAndGeneratePages}
        onSave={handleSaveCoreAgentOutput}
        isGeneratingPages={isGeneratingHabitPlan}
        pagesGeneratedCount={Object.keys(habitPrompts).length}
        similarityInfo={similarityInfo}
      />

      {matchingProjectFound && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-100 p-6 transform transition-all">
            <div className="flex items-center gap-3 text-indigo-650 mb-3">
              <div className="p-2 bg-indigo-50 rounded-xl">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <h3 className="text-base font-bold text-slate-900">ChromaDB Match Found!</h3>
            </div>
            
            <p className="text-xs text-slate-650 leading-relaxed mb-4">
              We found a similar previously generated project in the vector database:
              <strong className="block mt-1 text-slate-800 font-bold">"{matchingProjectFound.topic}"</strong>
              with a similarity match score of <strong className="text-indigo-650 font-bold">{Math.round((matchingProjectFound.similarity_score || 0) * 100)}%</strong>.
            </p>

            {matchingProjectFound.story_text && (
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 mb-5 max-h-36 overflow-y-auto">
                <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Preview Matching Story:</span>
                <p className="text-[11px] text-slate-600 leading-relaxed font-mono whitespace-pre-wrap">
                  {matchingProjectFound.story_text}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <button
                onClick={async () => {
                  const pid = matchingProjectFound.project_id;
                  setMatchingProjectFound(null);
                  setIsGeneratingHabitPlan(false);
                  if (pid) {
                    await loadProjectFromDb(pid);
                  }
                }}
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all text-center"
              >
                ⚡ Load Existing Project (Skip Agent Flow)
              </button>
              <button
                onClick={async () => {
                  setMatchingProjectFound(null);
                  await proceedWithCorePlanGeneration();
                }}
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white transition-all text-center"
              >
                🔄 Force Generate New Project (Agent Flow)
              </button>
              <button
                onClick={() => {
                  setMatchingProjectFound(null);
                  setIsGeneratingHabitPlan(false);
                }}
                className="w-full py-2 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-650 transition-all text-center"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
