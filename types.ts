
export type PromptFormat = 'JSON' | 'Description';

export type AnalysisLevel = 'Normal' | 'Akurat' | 'Detail';

export interface PromptOptions {
  idea: string;
  videoStyle: string;
  cameraAngle: string;
  visualStyle: string;
  imageData?: {
    mimeType: string;
    data: string;
  };
  videoData?: {
    mimeType: string;
    data: string;
  };
  negativePrompts?: string[];
  duration?: number;
  promptFormat: PromptFormat;
}

export interface RadioOption {
  id: string;
  label: string;
  description: string;
}

export interface PromptVariation {
    english: string;
    indonesian: string;
}

export interface AnalyzedPrompt {
  sceneDescription: string;
  keySubjects: string[];
  actions: string[];
  qualityStyle: string;
  cameraMovement: string;
  mood: string;
}

export interface ApiKeyConfig {
  id: 'default' | 'api1' | 'api2' | 'api3';
  label: string;
  key: string;
  enabled: boolean;
}

export type ApiSettings = Record<ApiKeyConfig['id'], ApiKeyConfig>;
