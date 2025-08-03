

import React, { useState, useCallback, useEffect } from 'react';
import { PromptOptions, PromptVariation, AnalyzedPrompt, AnalysisLevel, ApiSettings } from './types';
import { VIDEO_STYLES, CAMERA_ANGLES, VISUAL_STYLES, NEGATIVE_PROMPTS } from './constants';
import { generateVideoPrompt, generatePromptVariations, analyzeVideoForPrompt, generateCreativeIdea, updateApiKeys } from './services/geminiService';
import Dropdown from './components/Dropdown';
import ThemeToggle from './components/ThemeToggle';
import LoadingCat from './components/LoadingCat';
import AnimatedBackground from './components/AnimatedBackground';
import ImageUploader from './components/ImageUploader';
import VideoUploader from './components/VideoUploader';
import SettingsIcon from './components/icons/SettingsIcon';
import SettingsModal from './components/SettingsModal';
import AnimationsClick from './components/AnimationsClick';
import AnimationsKomi from './components/AnimationsKomi';
import NegativePromptSelector from './components/NegativePromptSelector';
import LoadingPage from './components/LoadingPage';
import DurationSelector from './components/DurationSelector';

import VideoIcon from './components/icons/VideoIcon';
import CameraIcon from './components/icons/CameraIcon';
import PaletteIcon from './components/icons/PaletteIcon';
import CopyIcon from './components/icons/CopyIcon';
import CheckIcon from './components/icons/CheckIcon';
import SaveIcon from './components/icons/SaveIcon';
import ClearDataIcon from './components/icons/ClearDataIcon';
import BanIcon from './components/icons/BanIcon';
import ClockIcon from './components/icons/ClockIcon';

const DURATION_OPTIONS = [5, 8, 10];

const App: React.FC = () => {
    type Theme = 'light' | 'dark';
    type Mode = 'Prompt' | 'Motion' | 'Analyze';
    type CopyStatusState = {
      type: 'main' | 'variation' | 'idle';
      lang?: 'en' | 'id';
      index?: number;
    };

    interface FormState {
        prompt: {
            idea: string;
            videoStyle: string;
            cameraAngle: string;
            visualStyle: string;
        };
        motion: {
            idea: string;
            videoStyle: string;
            visualStyle: string;
            imageFile: File | null;
            imageBase64: string | null;
        };
        analyze: {
            videoFile: File | null;
            videoBase64: string | null;
            analysisLevel: AnalysisLevel;
        };
    }
    
    const initialFormState: FormState = {
        prompt: {
            idea: '',
            videoStyle: VIDEO_STYLES[0].id,
            cameraAngle: CAMERA_ANGLES[0].id,
            visualStyle: VISUAL_STYLES[0].id,
        },
        motion: {
            idea: '',
            videoStyle: VIDEO_STYLES[0].id,
            visualStyle: VISUAL_STYLES[0].id,
            imageFile: null,
            imageBase64: null,
        },
        analyze: {
            videoFile: null,
            videoBase64: null,
            analysisLevel: 'Normal',
        },
    };

    const initialApiSettings: ApiSettings = {
        default: { id: 'default', label: 'API Default', key: process.env.API_KEY || '', enabled: true },
        api1: { id: 'api1', label: 'API 1', key: '', enabled: false },
        api2: { id: 'api2', label: 'API 2', key: '', enabled: false },
        api3: { id: 'api3', label: 'API 3', key: '', enabled: false },
    };

    const [isAppLoading, setIsAppLoading] = useState(true);
    const [theme, setTheme] = useState<Theme>('light');
    const [mode, setMode] = useState<Mode>('Prompt');
    const [formState, setFormState] = useState<FormState>(initialFormState);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedPromptEn, setGeneratedPromptEn] = useState('');
    const [generatedPromptId, setGeneratedPromptId] = useState('');
    const [copyStatus, setCopyStatus] = useState<CopyStatusState>({ type: 'idle' });

    const [isVariationLoading, setIsVariationLoading] = useState(false);
    const [variationError, setVariationError] = useState<string | null>(null);
    const [promptVariations, setPromptVariations] = useState<PromptVariation[]>([]);
    const [variationInstruction, setVariationInstruction] = useState('');
    const [activeVariationIndex, setActiveVariationIndex] = useState<number | null>(null);
    
    const [analyzedPrompt, setAnalyzedPrompt] = useState<AnalyzedPrompt | null>(null);

    const [saveMessage, setSaveMessage] = useState('');

    const [ideaInput, setIdeaInput] = useState('');
    const [isIdeaLoading, setIsIdeaLoading] = useState(false);
    const [ideaError, setIdeaError] = useState<string | null>(null);

    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [apiSettings, setApiSettings] = useState<ApiSettings>(initialApiSettings);
    
    const [negativePrompts, setNegativePrompts] = useState<string[]>([]);
    const [duration, setDuration] = useState<number>(DURATION_OPTIONS[0]);
    
    const isApiDisabled = !apiSettings.default.enabled;


    useEffect(() => {
        // Handle Theme
        const storedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (storedTheme === 'dark' || (!storedTheme && systemPrefersDark)) {
            setTheme('dark');
            document.documentElement.classList.add('dark');
        } else {
            setTheme('light');
            document.documentElement.classList.remove('dark');
        }

        // Load saved state from localStorage
        const savedStateJSON = localStorage.getItem('komiSanPromptGeneratorState');
        if (savedStateJSON) {
            try {
                const savedData = JSON.parse(savedStateJSON);
                 if (savedData) {
                    if (savedData.formState) {
                        const mergedFormState: FormState = {
                            prompt: { ...initialFormState.prompt, ...savedData.formState.prompt },
                            motion: { ...initialFormState.motion, ...savedData.formState.motion, imageFile: null, imageBase64: null },
                            analyze: { ...initialFormState.analyze, ...savedData.formState.analyze, videoFile: null, videoBase64: null },
                        };
                        setFormState(mergedFormState);
                    }
                    setMode(savedData.mode || 'Prompt');
                    setNegativePrompts(savedData.negativePrompts || []);
                    setDuration(savedData.duration || DURATION_OPTIONS[0]);
                }
            } catch (e) {
                console.error("Failed to parse saved state from localStorage", e);
                localStorage.removeItem('komiSanPromptGeneratorState');
            }
        }
        
        // Load API settings from localStorage
        const savedApiSettingsJSON = localStorage.getItem('komiSanPromptGeneratorApiSettings');
        if (savedApiSettingsJSON) {
            try {
                const savedApiSettings = JSON.parse(savedApiSettingsJSON);
                // Merge with initial to ensure all keys are present, especially new ones
                const mergedSettings: ApiSettings = {
                    ...initialApiSettings,
                    ...Object.keys(initialApiSettings).reduce((acc, key) => {
                        if (savedApiSettings[key]) {
                            acc[key as keyof ApiSettings] = { ...initialApiSettings[key as keyof ApiSettings], ...savedApiSettings[key] };
                        }
                        return acc;
                    }, {} as ApiSettings)
                };
                
                // Ensure default key is always from env if available
                mergedSettings.default.key = process.env.API_KEY || '';
                setApiSettings(mergedSettings);
            } catch(e) {
                 console.error("Failed to parse saved API settings from localStorage", e);
                localStorage.removeItem('komiSanPromptGeneratorApiSettings');
            }
        }
    }, []);
    
    useEffect(() => {
        // This effect syncs the React state with the Gemini service
        const isMasterEnabled = apiSettings.default.enabled;
        let activeKeys: string[] = [];

        if (isMasterEnabled) {
            activeKeys = Object.values(apiSettings)
                .filter(config => config.enabled && config.key)
                .map(config => config.key);
        }
        
        // If master is off, activeKeys will be an empty array, effectively disabling the service.
        updateApiKeys(activeKeys);
    }, [apiSettings]);


    const handleThemeChange = (newTheme: Theme) => {
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };
    
    const handleSaveApiSettings = (newSettings: ApiSettings) => {
        setApiSettings(newSettings);
        localStorage.setItem('komiSanPromptGeneratorApiSettings', JSON.stringify(newSettings));
    };
    
    const isMotionMode = mode === 'Motion';
    const isAnalyzeMode = mode === 'Analyze';
    
    const handleModeChange = (newMode: Mode) => {
        resetOutputs();
        setMode(newMode);
        
        // If switching to Motion mode, default the camera angle to static shot
        if (newMode === 'Motion') {
            setFormState(prev => ({
                ...prev,
                prompt: { ...prev.prompt, cameraAngle: 'static-shot' }
            }));
        }
    };

    const resetOutputs = () => {
        setGeneratedPromptEn('');
        setGeneratedPromptId('');
        setPromptVariations([]);
        setAnalyzedPrompt(null);
        setError(null);
        setVariationError(null);
        setVariationInstruction('');
        setActiveVariationIndex(null);
        setCopyStatus({ type: 'idle' });
        setIdeaInput('');
        setIdeaError(null);
    }

    const handleImageChange = (file: File | null) => {
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormState(prev => ({
                    ...prev,
                    motion: { ...prev.motion, imageFile: file, imageBase64: reader.result as string }
                }));
            };
            reader.readAsDataURL(file);
        } else {
            setFormState(prev => ({
                ...prev,
                motion: { ...prev.motion, imageFile: null, imageBase64: null }
            }));
        }
    };

    const handleVideoChange = (file: File | null) => {
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormState(prev => ({
                    ...prev,
                    analyze: { ...prev.analyze, videoFile: file, videoBase64: reader.result as string }
                }));
            };
            reader.readAsDataURL(file);
        } else {
            setFormState(prev => ({
                ...prev,
                analyze: { ...prev.analyze, videoFile: null, videoBase64: null }
            }));
        }
    };

    const handleGenerateIdea = async () => {
        if (!ideaInput.trim() || isIdeaLoading || isLoading) return;

        setIsIdeaLoading(true);
        setIdeaError(null);

        try {
            const generatedIdea = await generateCreativeIdea(ideaInput, mode as 'Prompt' | 'Motion');
            
            setFormState(prev => {
                if (mode === 'Prompt') {
                    return { ...prev, prompt: { ...prev.prompt, idea: generatedIdea } };
                }
                if (mode === 'Motion') {
                    return { ...prev, motion: { ...prev.motion, idea: generatedIdea } };
                }
                return prev;
            });

        } catch (err) {
            if (err instanceof Error) {
                setIdeaError(err.message);
            } else {
                setIdeaError("An unexpected error occurred while generating the idea.");
            }
        } finally {
            setIsIdeaLoading(false);
        }
    };

    const handleSubmit = useCallback(async (event: React.FormEvent) => {
        event.preventDefault();
        setIsLoading(true);
        resetOutputs();
    
        if (isAnalyzeMode) {
            const { videoFile, videoBase64, analysisLevel } = formState.analyze;
            if (!videoFile || !videoBase64) {
                setError("Please upload a video file to analyze.");
                setIsLoading(false);
                return;
            }
            const base64Data = videoBase64.split(',')[1];
            if (!base64Data) {
                setError("Could not process the video file.");
                setIsLoading(false);
                return;
            }
            try {
                const result = await analyzeVideoForPrompt({
                    mimeType: videoFile.type,
                    data: base64Data,
                }, analysisLevel);
                setAnalyzedPrompt(result);
            } catch (err) {
                 if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError("An unexpected error occurred during video analysis.");
                }
            } finally {
                setIsLoading(false);
            }
        } else { // Prompt or Motion mode
            let options: PromptOptions;
            let currentIdea: string;
    
            if (isMotionMode) {
                const { idea, videoStyle, visualStyle, imageFile, imageBase64 } = formState.motion;
                currentIdea = idea;
                options = {
                    idea,
                    videoStyle,
                    cameraAngle: 'static-shot', // Motion mode is always static
                    visualStyle,
                    negativePrompts,
                    duration,
                };
                if (imageFile && imageBase64) {
                    const base64Data = imageBase64.split(',')[1];
                    if (base64Data) {
                        options.imageData = {
                            mimeType: imageFile.type,
                            data: base64Data,
                        };
                    }
                }
            } else { // Prompt mode
                const { idea, videoStyle, cameraAngle, visualStyle } = formState.prompt;
                currentIdea = idea;
                options = { idea, videoStyle, cameraAngle, visualStyle, negativePrompts, duration };
            }
    
            if (!currentIdea.trim()) {
                setError("Please enter a core idea for your video.");
                setIsLoading(false);
                return;
            }
    
            try {
                const jsonPrompt = await generateVideoPrompt(options);
                setGeneratedPromptEn(jsonPrompt);
                setGeneratedPromptId('');
            } catch (err) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError("An unexpected error occurred.");
                }
            } finally {
                setIsLoading(false);
            }
        }
    }, [formState, mode, isAnalyzeMode, isMotionMode, negativePrompts, duration]);


    const handleGenerateVariations = async () => {
        const originalPrompt = isAnalyzeMode && analyzedPrompt 
            ? JSON.stringify(analyzedPrompt, null, 2) 
            : generatedPromptEn;

        if (!originalPrompt) return;

        setIsVariationLoading(true);
        setVariationError(null);
        setPromptVariations([]);
        setActiveVariationIndex(null);

        try {
            let videoStyle = '';
            let visualStyle = '';

            if (isAnalyzeMode && analyzedPrompt) {
                videoStyle = analyzedPrompt.qualityStyle; // Note: Inconsistent naming, but following original logic
                visualStyle = analyzedPrompt.qualityStyle;
            } else if (isMotionMode) {
                videoStyle = formState.motion.videoStyle;
                visualStyle = formState.motion.visualStyle;
            } else { // Prompt mode
                videoStyle = formState.prompt.videoStyle;
                visualStyle = formState.prompt.visualStyle;
            }

            const variations = await generatePromptVariations(
                originalPrompt, 
                videoStyle, 
                visualStyle,
                variationInstruction,
                !isAnalyzeMode // `simple` is true for Prompt/Motion, false for Analyze
            );
            setPromptVariations(variations);
        } catch (err) {
             if (err instanceof Error) {
                setVariationError(err.message);
            } else {
                setVariationError("An unexpected error occurred while generating variations.");
            }
        } finally {
            setIsVariationLoading(false);
        }
    };

    const handleCopy = (type: 'main' | 'variation', lang: 'en' | 'id', index?: number) => {
        let textToCopy = '';
        if (type === 'main') {
            const jsonToCopy = isAnalyzeMode && analyzedPrompt 
                ? JSON.stringify(analyzedPrompt, null, 2)
                : !isAnalyzeMode && generatedPromptEn
                ? generatedPromptEn
                : null;
            if (jsonToCopy) {
                textToCopy = jsonToCopy;
            }
        } else if (type === 'variation' && index !== undefined && promptVariations[index]) {
            textToCopy = lang === 'en' ? promptVariations[index].english : promptVariations[index].indonesian;
        }
        
        if (textToCopy) {
          navigator.clipboard.writeText(textToCopy);
          setCopyStatus({ type, lang, index });
          setTimeout(() => setCopyStatus({ type: 'idle' }), 2000);
        }
    };

    const handleSaveState = () => {
        const stateToSave = {
            mode,
            formState: {
                prompt: formState.prompt,
                motion: {
                    idea: formState.motion.idea,
                    videoStyle: formState.motion.videoStyle,
                    visualStyle: formState.motion.visualStyle,
                },
                analyze: {
                    analysisLevel: formState.analyze.analysisLevel
                },
            },
            negativePrompts,
            duration,
        };
        localStorage.setItem('komiSanPromptGeneratorState', JSON.stringify(stateToSave));
        setSaveMessage('Your progress has been saved!');
        setTimeout(() => setSaveMessage(''), 3000);
    };

    const handleClearState = () => {
        localStorage.removeItem('komiSanPromptGeneratorState');
        localStorage.removeItem('komiSanPromptGeneratorApiSettings');
        setFormState(initialFormState);
        setApiSettings(initialApiSettings);
        setNegativePrompts([]);
        setDuration(DURATION_OPTIONS[0]);
        setMode('Prompt');
        resetOutputs();
        setSaveMessage('Saved data has been cleared.');
        setTimeout(() => setSaveMessage(''), 3000);
    };
    
    const analysisLevelMap: AnalysisLevel[] = ['Normal', 'Akurat', 'Detail'];
    
    const mainOutputJsonString = isAnalyzeMode && analyzedPrompt
        ? JSON.stringify(analyzedPrompt, null, 2)
        : !isAnalyzeMode && generatedPromptEn
        ? generatedPromptEn
        : null;

    return (
        <>
            {isAppLoading && <LoadingPage onAnimationEnd={() => setIsAppLoading(false)} />}
            <div className={`transition-opacity duration-500 ${isAppLoading ? 'opacity-0' : 'opacity-100'}`}>
                <AnimatedBackground />
                <AnimationsClick />
                <SettingsModal 
                    isOpen={isSettingsModalOpen}
                    onClose={() => setIsSettingsModalOpen(false)}
                    settings={apiSettings}
                    onSave={handleSaveApiSettings}
                />
                <div className="min-h-screen text-light-text-primary dark:text-dark-text font-sans p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-start transition-colors duration-300 mt-12">
                    <div className="relative z-10 flex justify-center mb-2">
                        <AnimationsKomi />
                    </div>
                    <main className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-8">
                        {/* Left Panel: Controls */}
                        <div className="md:col-span-2 bg-light-secondary/70 dark:bg-dark-secondary/50 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-light-secondary/30 dark:border-dark-accent/30">
                            
                            <div className="flex justify-between items-center mb-6">
                                <h1 className="text-2xl font-bold text-light-text-primary dark:text-dark-text">Choose Method</h1>
                                <div className="flex items-center gap-4">
                                   <ThemeToggle theme={theme} setTheme={handleThemeChange} />
                                   <button 
                                     onClick={() => setIsSettingsModalOpen(true)}
                                     className="text-light-text-secondary dark:text-dark-accent hover:text-brand-blue dark:hover:text-brand-blue transition-colors duration-200"
                                     aria-label="Open API Settings"
                                   >
                                     <SettingsIcon/>
                                   </button>
                                </div>
                            </div>

                            {isApiDisabled && (
                                <div className="bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg relative mb-4" role="alert">
                                    <strong className="font-bold">API Disabled! </strong>
                                    <span className="block sm:inline">Enable 'API Default' in Settings to use the application.</span>
                                </div>
                            )}

                            <div className="bg-light-surface/60 dark:bg-dark-primary/60 rounded-lg p-1 flex mb-6">
                                {(['Prompt', 'Motion', 'Analyze'] as Mode[]).map(m => (
                                    <button
                                        key={m}
                                        onClick={() => handleModeChange(m)}
                                        className={`w-1/3 py-2 px-4 rounded-md text-sm font-semibold transition-all duration-300 ${mode === m ? 'bg-light-secondary dark:bg-dark-surface shadow-md text-brand-blue dark:text-brand-blue' : 'text-light-text-secondary dark:text-dark-accent hover:bg-light-secondary/50 dark:hover:bg-dark-surface/50'}`}
                                    >
                                        {m === 'Prompt' ? 'Normal Prompt' : m === 'Motion' ? 'Motion Graphic' : 'Video Analysis'}
                                    </button>
                                ))}
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                 {!isAnalyzeMode && (
                                    <>
                                        <div>
                                            <label htmlFor="create-idea" className="text-lg font-semibold text-light-text-primary dark:text-dark-text mb-2 block">
                                                Create Idea
                                            </label>
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    id="create-idea"
                                                    type="text"
                                                    value={ideaInput}
                                                    onChange={(e) => setIdeaInput(e.target.value)}
                                                    placeholder="Enter keywords, e.g., 'cat, futuristic, city'"
                                                    className="flex-grow p-3 bg-light-surface/80 dark:bg-dark-surface/80 rounded-lg border-2 border-transparent focus:border-brand-blue/50 focus:ring-brand-blue/50 transition-all text-light-text-primary dark:text-dark-text placeholder:text-light-text-secondary dark:placeholder:text-dark-accent"
                                                    disabled={isApiDisabled || isIdeaLoading || isLoading}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleGenerateIdea}
                                                    disabled={isApiDisabled || isIdeaLoading || isLoading || !ideaInput.trim()}
                                                    className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 dark:disabled:bg-green-800 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center min-w-[80px]"
                                                >
                                                    {isIdeaLoading ? (
                                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                    ) : <CheckIcon />}
                                                </button>
                                            </div>
                                            {ideaError && <p className="text-red-600 dark:text-red-500 text-sm mt-2">Idea Error: {ideaError}</p>}
                                        </div>
                                        <div>
                                           <label htmlFor="core-idea" className="text-lg font-semibold text-light-text-primary dark:text-dark-text mb-2 block">
                                            {isMotionMode ? 'Animation Idea' : 'Core Idea'}
                                           </label>
                                            <textarea
                                                id="core-idea"
                                                value={isMotionMode ? formState.motion.idea : formState.prompt.idea}
                                                onChange={(e) => {
                                                    const newIdea = e.target.value;
                                                    setFormState(prev => isMotionMode 
                                                        ? { ...prev, motion: { ...prev.motion, idea: newIdea } }
                                                        : { ...prev, prompt: { ...prev.prompt, idea: newIdea } }
                                                    )
                                                }}
                                                placeholder={isMotionMode ? "e.g., Abstract liquid waves of color" : "e.g., A knight facing a dragon in a volcano"}
                                                className="w-full h-28 p-3 bg-light-surface/80 dark:bg-dark-surface/80 rounded-lg border-2 border-transparent focus:border-brand-blue/50 focus:ring-brand-blue/50 transition-all text-light-text-primary dark:text-dark-text placeholder:text-light-text-secondary dark:placeholder:text-dark-accent"
                                                required
                                            />
                                        </div>
                                        
                                        {isMotionMode && (
                                            <ImageUploader
                                                onImageChange={handleImageChange}
                                                previewUrl={formState.motion.imageBase64}
                                            />
                                        )}

                                        <Dropdown
                                          legend="Genre"
                                          options={VIDEO_STYLES}
                                          selectedValue={isMotionMode ? formState.motion.videoStyle : formState.prompt.videoStyle}
                                          onChange={(value) => setFormState(prev => isMotionMode 
                                            ? { ...prev, motion: { ...prev.motion, videoStyle: value } }
                                            : { ...prev, prompt: { ...prev.prompt, videoStyle: value } }
                                          )}
                                          icon={<VideoIcon />}
                                        />
                                        <Dropdown
                                          legend="Camera Angle"
                                          options={CAMERA_ANGLES}
                                          selectedValue={formState.prompt.cameraAngle}
                                          onChange={(value) => setFormState(prev => ({ ...prev, prompt: { ...prev.prompt, cameraAngle: value } }))}
                                          icon={<CameraIcon />}
                                          disabled={isMotionMode}
                                        />
                                        <Dropdown
                                          legend="Quality Style"
                                          options={VISUAL_STYLES}
                                          selectedValue={isMotionMode ? formState.motion.visualStyle : formState.prompt.visualStyle}
                                          onChange={(value) => setFormState(prev => isMotionMode 
                                            ? { ...prev, motion: { ...prev.motion, visualStyle: value } }
                                            : { ...prev, prompt: { ...prev.prompt, visualStyle: value } }
                                          )}
                                          icon={<PaletteIcon />}
                                        />
                                        
                                        <NegativePromptSelector
                                            options={NEGATIVE_PROMPTS}
                                            selected={negativePrompts}
                                            onChange={setNegativePrompts}
                                            disabled={isApiDisabled || isLoading || isVariationLoading || isIdeaLoading}
                                            icon={<BanIcon />}
                                        />
                                        
                                        <DurationSelector
                                            options={DURATION_OPTIONS}
                                            selectedValue={duration}
                                            onChange={setDuration}
                                            disabled={isApiDisabled || isLoading || isVariationLoading || isIdeaLoading}
                                            icon={<ClockIcon />}
                                        />
                                    </>
                                )}

                                {isAnalyzeMode && (
                                    <>
                                        <VideoUploader onVideoChange={handleVideoChange} previewUrl={formState.analyze.videoBase64} />
                                        <div>
                                            <label htmlFor="analysis-level" className="text-lg font-semibold text-light-text-primary dark:text-dark-text mb-2 block">
                                                Analysis Level: <span className="font-bold text-brand-blue">{formState.analyze.analysisLevel}</span>
                                            </label>
                                            <div className="flex items-center space-x-4 px-1">
                                                <span className="text-sm text-light-text-secondary dark:text-dark-accent">Normal</span>
                                                <input
                                                    id="analysis-level"
                                                    type="range"
                                                    min="0"
                                                    max="2"
                                                    step="1"
                                                    value={analysisLevelMap.indexOf(formState.analyze.analysisLevel)}
                                                    onChange={(e) => {
                                                        const newLevel = analysisLevelMap[parseInt(e.target.value, 10)];
                                                        setFormState(prev => ({
                                                            ...prev,
                                                            analyze: { ...prev.analyze, analysisLevel: newLevel }
                                                        }));
                                                    }}
                                                    className="w-full h-2 bg-light-surface dark:bg-dark-surface rounded-lg appearance-none cursor-pointer accent-brand-blue"
                                                />
                                                <span className="text-sm text-light-text-secondary dark:text-dark-accent">Detail</span>
                                            </div>
                                        </div>
                                    </>
                                )}


                                <button
                                    type="submit"
                                    disabled={isApiDisabled || isLoading || isVariationLoading || isIdeaLoading}
                                    className="w-full bg-brand-blue hover:bg-sky-600 disabled:bg-sky-300 dark:disabled:bg-blue-900/50 disabled:cursor-wait text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center text-lg"
                                >
                                    {isLoading ? 'Generating...' : isAnalyzeMode ? 'Analyze Video' : 'Generate Prompt'}
                                </button>
                            </form>
                            <div className="mt-4 space-y-2">
                                 <div className="flex space-x-2">
                                    <button
                                        onClick={handleSaveState}
                                        className="flex-1 flex items-center justify-center bg-light-text-secondary/80 hover:bg-light-text-secondary dark:bg-dark-surface dark:hover:bg-dark-accent text-light-primary dark:text-dark-text font-semibold py-2 px-3 rounded-lg transition-colors duration-200 text-sm"
                                    >
                                        <SaveIcon />
                                        Save Progress
                                    </button>
                                    <button
                                        onClick={handleClearState}
                                        className="flex-1 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-3 rounded-lg transition-colors duration-200 text-sm"
                                    >
                                        <ClearDataIcon />
                                        Clear Saved
                                    </button>
                                </div>
                                {saveMessage && (
                                    <p className="text-center text-sm text-green-600 dark:text-green-400 transition-opacity duration-300">
                                        {saveMessage}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Right Panel: Output */}
                        <div className="md:col-span-3 bg-light-secondary/70 dark:bg-dark-secondary/50 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-light-secondary/30 dark:border-dark-accent/30 min-h-[32rem] flex flex-col">
                            <h2 className="text-xl font-bold text-light-text-primary dark:text-dark-text mb-4 flex-shrink-0">
                               {mainOutputJsonString ? 'Generated Prompt (JSON)' : (isAnalyzeMode ? 'Analyzed Prompt (JSON)' : 'Generated Prompt')}
                            </h2>
                            
                            {/* Main output container */}
                            <div className="flex-grow bg-light-primary/50 dark:bg-dark-primary/70 rounded-lg text-light-text-primary dark:text-dark-text text-base leading-relaxed overflow-y-auto p-4 mb-4">
                                {isLoading && <div className="h-full flex justify-center items-center"><LoadingCat /></div>}
                                {error && <div className="text-red-600 dark:text-red-500 text-center p-4"><p>Error: {error}</p></div>}
                                
                                {!isLoading && !error && !mainOutputJsonString && (
                                     <div className="text-center text-light-text-secondary dark:text-dark-accent h-full flex flex-col justify-center items-center">
                                        <p>Your generated prompt will appear here. <br /> Fill out the form and click "Generate Prompt".</p>
                                    </div>
                                )}
                                
                                {!isLoading && !error && mainOutputJsonString && (
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="font-semibold text-light-text-primary dark:text-dark-text">JSON Output</h3>
                                            <button onClick={() => handleCopy('main', 'en')} className={`flex items-center text-sm font-medium py-1 px-3 rounded-md transition-colors ${copyStatus.type === 'main' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' : 'bg-light-surface hover:bg-light-accent dark:bg-dark-surface dark:hover:bg-dark-accent'}`}>
                                                {copyStatus.type === 'main' ? <CheckIcon /> : <CopyIcon />}
                                                {copyStatus.type === 'main' ? 'Copied!' : 'Copy JSON'}
                                            </button>
                                        </div>
                                        <pre className="text-sm bg-light-surface/50 dark:bg-dark-primary/80 p-4 rounded-md whitespace-pre-wrap break-words">
                                            {mainOutputJsonString}
                                        </pre>
                                    </div>
                                )}
                            </div>

                            {/* Variations Section */}
                            <div className="flex-shrink-0 pt-4 border-t border-light-accent/50 dark:border-dark-surface">
                                <div className="mb-2">
                                    <label htmlFor="variation-instruction" className="block text-sm font-medium text-light-text-primary dark:text-dark-text mb-1">
                                        Variation Instruction (Optional)
                                    </label>
                                    <textarea
                                        id="variation-instruction"
                                        value={variationInstruction}
                                        onChange={(e) => setVariationInstruction(e.target.value)}
                                        placeholder="e.g., 'Make it darker and more mysterious' or 'Change the setting to a futuristic city'"
                                        className="w-full h-20 p-3 bg-light-surface/80 dark:bg-dark-surface/80 rounded-lg border-2 border-transparent focus:border-brand-blue/50 focus:ring-brand-blue/50 transition-all text-light-text-primary dark:text-dark-text placeholder:text-light-text-secondary dark:placeholder:text-dark-accent text-sm"
                                    />
                                </div>

                                <button onClick={handleGenerateVariations} disabled={isApiDisabled || isVariationLoading || isLoading || (!generatedPromptEn && !analyzedPrompt)} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 dark:disabled:bg-indigo-900/50 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center text-lg">
                                     {isVariationLoading ? 'Generating...' : 'Create Variations'}
                                </button>

                                <div className="mt-4">
                                    {isVariationLoading && <div className="flex justify-center py-4"><LoadingCat /></div>}
                                    {variationError && <div className="text-red-600 dark:text-red-500 text-center p-4"><p>Variation Error: {variationError}</p></div>}
                                    
                                    {promptVariations.length > 0 && (
                                        !isAnalyzeMode ? (
                                            <div className="space-y-2 mt-4 max-h-96 overflow-y-auto pr-2">
                                                {promptVariations.map((variation, index) => (
                                                    <div key={index} className="bg-light-surface/50 dark:bg-dark-primary/60 rounded-lg overflow-hidden border border-light-accent/50 dark:border-dark-surface/50">
                                                        <button
                                                            onClick={() => {
                                                                setActiveVariationIndex(activeVariationIndex === index ? null : index);
                                                            }}
                                                            className="w-full text-left p-3 flex justify-between items-center font-semibold text-light-text-primary dark:text-dark-text hover:bg-light-surface dark:hover:bg-dark-surface transition-colors"
                                                            aria-expanded={activeVariationIndex === index}
                                                            aria-controls={`variation-content-${index}`}
                                                        >
                                                            <span>Variation {index + 1}</span>
                                                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform duration-200 ${activeVariationIndex === index ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        </button>
                                                        {activeVariationIndex === index && (
                                                            <div id={`variation-content-${index}`} className="p-3 pt-0 bg-light-primary/50 dark:bg-dark-primary/70">
                                                                <div className="flex justify-end mb-2">
                                                                    <button onClick={() => handleCopy('variation', 'en', index)} className={`flex items-center text-sm font-medium py-1 px-3 rounded-md transition-colors ${copyStatus.type === 'variation' && copyStatus.index === index ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' : 'bg-light-surface hover:bg-light-accent dark:bg-dark-surface dark:hover:bg-dark-accent'}`}>
                                                                        {copyStatus.type === 'variation' && copyStatus.index === index ? <CheckIcon /> : <CopyIcon />}
                                                                        {copyStatus.type === 'variation' && copyStatus.index === index ? 'Copied!' : 'Copy JSON'}
                                                                    </button>
                                                                </div>
                                                                <pre className="text-sm bg-light-surface/50 dark:bg-dark-primary/80 p-4 rounded-md whitespace-pre-wrap break-words">
                                                                    {variation.english}
                                                                </pre>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="space-y-4 pt-4 max-h-96 overflow-y-auto">
                                                {promptVariations.map((variation, index) => (
                                                    <div key={index} className="p-4 bg-light-secondary/50 dark:bg-dark-secondary/40 rounded-lg">
                                                        <h3 className="text-lg font-bold text-light-text-primary dark:text-dark-text mb-4">Variation {index + 1}</h3>
                                                        <div>
                                                            <div className="flex justify-between items-center mb-2">
                                                                <h4 className="font-semibold text-light-text-primary dark:text-dark-text">English</h4>
                                                                <button onClick={() => handleCopy('variation', 'en', index)} className={`flex items-center text-sm font-medium py-1 px-3 rounded-md transition-colors ${copyStatus.type === 'variation' && copyStatus.lang === 'en' && copyStatus.index === index ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' : 'bg-light-surface hover:bg-light-accent dark:bg-dark-surface dark:hover:bg-dark-accent'}`}>
                                                                    {copyStatus.type === 'variation' && copyStatus.lang === 'en' && copyStatus.index === index ? <CheckIcon/> : <CopyIcon/>}
                                                                    {copyStatus.type === 'variation' && copyStatus.lang === 'en' && copyStatus.index === index ? 'Copied!' : 'Copy'}
                                                                </button>
                                                            </div>
                                                            <p className="text-sm">{variation.english}</p>
                                                        </div>
                                                        <hr className="my-4 border-light-accent/50 dark:border-dark-surface" />
                                                        <div>
                                                            <div className="flex justify-between items-center mb-2">
                                                                <h4 className="font-semibold text-light-text-primary dark:text-dark-text">Indonesia</h4>
                                                                <button onClick={() => handleCopy('variation', 'id', index)} className={`flex items-center text-sm font-medium py-1 px-3 rounded-md transition-colors ${copyStatus.type === 'variation' && copyStatus.lang === 'id' && copyStatus.index === index ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' : 'bg-light-surface hover:bg-light-accent dark:bg-dark-surface dark:hover:bg-dark-accent'}`}>
                                                                    {copyStatus.type === 'variation' && copyStatus.lang === 'id' && copyStatus.index === index ? <CheckIcon/> : <CopyIcon/>}
                                                                    {copyStatus.type === 'variation' && copyStatus.lang === 'id' && copyStatus.index === index ? 'Tersalin!' : 'Salin'}
                                                                </button>
                                                            </div>
                                                            <p className="text-sm">{variation.indonesian}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
};

export default App;