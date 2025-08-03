
import { GoogleGenAI, Type } from "@google/genai";
import type { GoogleGenAI as GoogleGenAIType } from "@google/genai";
import { PromptOptions, PromptVariation, AnalyzedPrompt, AnalysisLevel } from '../types';

let activeApiKeys: string[] = [];
let lastUsedIndex = -1;

export const updateApiKeys = (keys: string[]) => {
  console.log("Updating active API keys in service:", keys);
  activeApiKeys = keys;
  lastUsedIndex = -1;
};


const getAiClient = (): GoogleGenAIType => {
  if (activeApiKeys.length === 0) {
    throw new Error("API is disabled or no keys are active. Please enable 'API Default' in Settings.");
  }
  lastUsedIndex = (lastUsedIndex + 1) % activeApiKeys.length;
  const apiKey = activeApiKeys[lastUsedIndex];
  console.log(`Using API Key (index: ${lastUsedIndex}, total: ${activeApiKeys.length})`);
  return new GoogleGenAI({ apiKey });
};

export const generateCreativeIdea = async (userInput: string, mode: 'Prompt' | 'Motion'): Promise<string> => {
  const ai = getAiClient();
  let systemInstruction: string;
  const wordCount = mode === 'Prompt' ? '3 to 10 words' : '5 to 15 words';
  const focus = mode === 'Prompt' ? 'a natural, everyday scenario' : 'themes of motion graphics, abstract visuals, and dynamic movement';

  systemInstruction = `You are a creative assistant that generates concise video concepts. Based on the user's keywords, create a single, compelling video idea. 
- The idea must be ${wordCount} long.
- The focus should be on ${focus}.
- VERY IMPORTANT: Only output the generated idea. Do not include any extra text, quotation marks, or explanations.`;
  
  const userPrompt = `Keywords: "${userInput}"`;

  try {
    console.log(`Sending request to Gemini API for creative idea generation in ${mode} mode...`);
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.9,
        topP: 1.0,
      },
    });

    const idea = response.text.trim();
    if (!idea) {
      throw new Error("The API returned an empty idea.");
    }
    console.log("Received creative idea:", idea);
    return idea;

  } catch (error) {
    console.error("Error in generateCreativeIdea service:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate idea: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating the idea.");
  }
};

export const generateVideoPrompt = async (options: PromptOptions): Promise<string> => {
  const ai = getAiClient();
  const { idea, videoStyle, cameraAngle, visualStyle, imageData, negativePrompts, duration } = options;

  const systemInstruction = `You are a world-class prompt engineer for a generative AI text-to-video model. Your task is to take a user's core idea and stylistic choices and convert them into a structured JSON object.
- Analyze the 'Core Idea' to extract a concise 'subject', 'action_detail', 'setting_detail', and 'lighting_mood'.
- Populate the 'prompt_components' and 'technical_parameters' fields based on the user's input and your analysis.
- 'genre', 'quality_style', 'camera_shot', and 'duration_seconds' must be populated directly from the user's provided values.
- If a reference image is provided, draw inspiration from its composition, color palette, and subject matter to enrich the JSON fields.
- Your final output MUST be a valid JSON object that strictly adheres to the provided schema. Do not add any extra text, commentary, or markdown formatting.`;
  
  const userPromptText = `
    Core Idea: "${idea}"
    ---
    Values to use:
    Genre: "${videoStyle}"
    Camera Angle / Shot: "${cameraAngle}"
    Quality Style: "${visualStyle}"
    Duration: ${duration} seconds
    Negative Prompts: ${JSON.stringify(negativePrompts || [])}
    ${imageData ? "\n--- \nReference Image Provided: Analyze the image and incorporate its elements into the JSON fields." : ""}
  `;
  
  const textPart = { text: userPromptText };
  const contents = imageData ? { parts: [textPart, { inlineData: imageData }] } : userPromptText;
  
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
        prompt_components: {
            type: Type.OBJECT,
            properties: {
                genre: { type: Type.STRING },
                subject: { type: Type.STRING, description: "The main character(s) or object(s) of the video. Should be a concise phrase." },
                action_detail: { type: Type.STRING, description: "The specific actions or movements taking place." },
                setting_detail: { type: Type.STRING, description: "Description of the environment, background, and location." },
                camera_shot: { type: Type.STRING },
                lighting_mood: { type: Type.STRING, description: "The mood or atmosphere conveyed by lighting (e.g., 'dramatic, high-contrast', 'soft, warm lighting')." },
                quality_style: { type: Type.STRING }
            },
            required: ["genre", "subject", "action_detail", "setting_detail", "camera_shot", "lighting_mood", "quality_style"]
        },
        technical_parameters: {
            type: Type.OBJECT,
            properties: {
                duration_seconds: { type: Type.INTEGER, description: "The duration of the video in seconds." },
                negative_prompts: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "A list of elements to exclude from the generation."
                }
            },
            required: ["duration_seconds"]
        }
    },
    required: ["prompt_components", "technical_parameters"]
  };

  try {
    console.log("Sending request to Gemini API for JSON prompt generation...");
    const generationResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.7,
      },
    });
    
    const jsonString = generationResponse.text.trim();
    if (!jsonString) {
        throw new Error("The API returned an empty prompt.");
    }
    console.log("Received JSON prompt.");
    
    // Prettify the JSON for display
    const parsedJson = JSON.parse(jsonString);
    return JSON.stringify(parsedJson, null, 2);

  } catch (error) {
    console.error("Error in generateVideoPrompt service:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate prompt: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating the prompt.");
  }
};

export const generatePromptVariations = async (originalPrompt: string, videoStyle: string, visualStyle: string, instruction: string, simple: boolean = false): Promise<PromptVariation[]> => {
    const ai = getAiClient();
    let systemInstruction: string;
    let responseSchema: any;
    let userPrompt: string;
    const numVariations = 3;

    if (simple) {
        systemInstruction = `You are an expert prompt engineer for a generative AI text-to-video model. Your task is to take a user's JSON prompt and generate creative variations.

**Key Constraints:**
1.  **Maintain Structure:** Each variation must be a valid JSON object with the exact same structure as the original ('prompt_components' and 'technical_parameters').
2.  **Creative Alterations:** Creatively alter fields like 'subject', 'action_detail', 'setting_detail', and 'lighting_mood'.
3.  **Preserve Technicals:** Keep 'genre', 'quality_style', 'camera_shot', and 'duration_seconds' the same as the original, unless the user's instruction explicitly asks to change them.
4.  **Follow Instructions:** Prioritize the user's instruction for creating variations.
5.  **Output Format:** Your final output MUST be a valid JSON array of these prompt objects. Do not add any extra text, commentary, or markdown formatting.`;
        
        userPrompt = `
            Original JSON prompt:
            \`\`\`json
            ${originalPrompt}
            \`\`\`

            ${instruction ? `**User Instruction for Variations:**\n"${instruction}"` : `**Instruction:** Generate creative variations of the JSON prompt above.`}

            Now, generate ${numVariations} variations based on these instructions.
        `;

        responseSchema = {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    prompt_components: {
                        type: Type.OBJECT,
                        properties: {
                            genre: { type: Type.STRING },
                            subject: { type: Type.STRING },
                            action_detail: { type: Type.STRING },
                            setting_detail: { type: Type.STRING },
                            camera_shot: { type: Type.STRING },
                            lighting_mood: { type: Type.STRING },
                            quality_style: { type: Type.STRING }
                        },
                        required: ["genre", "subject", "action_detail", "setting_detail", "camera_shot", "lighting_mood", "quality_style"]
                    },
                    technical_parameters: {
                        type: Type.OBJECT,
                        properties: {
                            duration_seconds: { type: Type.INTEGER },
                            negative_prompts: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING }
                            }
                        },
                        required: ["duration_seconds"]
                    }
                },
                required: ["prompt_components", "technical_parameters"]
            }
        };

    } else { // Original behavior for Analyze mode
        systemInstruction = `You are a creative prompt engineer specializing in text-to-video generation. Your task is to create ${numVariations} distinct variations of a given prompt.

**Key Constraints:**
1.  **Follow Instructions:** If a specific user instruction is given, prioritize it for creating variations.
2.  **Maintain Styles (if no other instruction overrides):** Adhere to the original 'Genre' and 'Quality Style' unless the user asks to change them.
3.  **Creative Freedom (if no instruction):** If no specific instruction is provided, creatively alter elements like color palettes, shapes, movement, or environment, while keeping the core subject and styles.
4.  **Provide Translations:** For each of the 3 English variations, you must also provide a natural-sounding Indonesian translation.
5.  **Output Format:** Your final output must be a valid JSON array of objects, each with "english" and "indonesian" keys. Do not add any extra text, commentary, or markdown formatting.`;
        
        userPrompt = `
          Original prompt: "${originalPrompt}"

          **Styles to Maintain (if applicable):**
          - Genre: "${videoStyle}"
          - Quality Style: "${visualStyle}"

          ${instruction ? `**User Instruction for Variations:**\n"${instruction}"` : `**Instruction:** Generate creative variations by altering elements like color, mood, or setting, while keeping the core subject and the styles listed above.`}

          Now, generate ${numVariations} variations based on these instructions, ensuring your output is a valid JSON array.
        `;

        responseSchema = {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    english: {
                        type: Type.STRING,
                        description: "The creative variation of the prompt in English, based on the instructions."
                    },
                    indonesian: {
                        type: Type.STRING,
                        description: "The Indonesian translation of the creative variation."
                    }
                },
                required: ["english", "indonesian"]
            }
        };
    }

    try {
        console.log("Sending request to Gemini API for prompt variations...");
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userPrompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema
            }
        });

        const parsedResponse = JSON.parse(response.text);
        if (!parsedResponse || !Array.isArray(parsedResponse) || parsedResponse.length === 0) {
            throw new Error("API returned invalid or empty variations data.");
        }
        console.log("Received prompt variations.");

        if (simple) {
            // Map array of JSON objects to PromptVariation[] structure
            return (parsedResponse as any[]).map(p => ({ 
                english: JSON.stringify(p, null, 2), 
                indonesian: '' 
            }));
        } else {
            // The response is already in the correct format
            return parsedResponse as PromptVariation[];
        }

    } catch(error) {
        console.error("Error in generatePromptVariations service:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to generate variations: ${error.message}`);
        }
        throw new Error("An unknown error occurred while generating variations.");
    }
}

const getSystemInstructionForAnalysis = (level: AnalysisLevel): string => {
    switch (level) {
        case 'Akurat':
            return `You are a precise and objective video analyst. Your task is to analyze the provided video and factually describe its contents in JSON format. Focus strictly on what is visually present. Avoid interpretation, inferring emotion, or adding creative flair. The output should be a direct, factual report.
Key analysis points:
- **Scene Description:** A literal, objective description of the environment.
- **Key Subjects:** A list of all clearly identifiable people and objects.
- **Actions:** A factual list of concrete movements and events.
- **Quality Style:** Technical style, e.g., 'Live-action', '3D Render', '2D Animation'.
- **Camera Movement:** Technical description, e.g., 'Static tripod shot', 'Handheld tracking shot'.
- **Mood:** Describe visual cues for mood, e.g., 'low-key lighting', 'fast cuts', 'saturated colors', rather than interpreting the emotion itself.
Your final output must be a valid JSON object matching the provided schema. Do not include any extra text, commentary, or markdown formatting.`;
        case 'Detail':
            return `You are a highly meticulous and descriptive video analyst. Your task is to provide an exhaustive, verbose analysis of the video in JSON format. Delve into minute details: textures, subtle background elements, specific color palettes, lighting nuances, and the precise choreography of movements. Aim for a rich, dense description that captures every possible visual aspect.
Key analysis points:
- **Scene Description:** An exhaustive description, including textures, background details, and atmospheric elements.
- **Key Subjects:** A detailed list of subjects, including their appearance and attire.
- **Actions:** A step-by-step breakdown of all movements, both large and small.
- **Quality Style:** A detailed analysis, including sub-styles, textures, and potential artistic influences.
- **Camera Movement:** A precise description, mentioning speed, angle changes, and potential lens effects.
- **Mood:** An evocative and rich description of the emotional atmosphere, supported by specific visual evidence.
Your final output must be a valid JSON object matching the provided schema. Do not include any extra text, commentary, or markdown formatting.`;
        case 'Normal':
        default:
            return `You are a world-class video analyst and prompt engineer. Your task is to analyze the provided video and generate a structured, detailed prompt in JSON format that could be used to recreate a similar video.
Key analysis points:
- **Scene Description:** Vividly describe the environment, setting, and background elements.
- **Key Subjects:** Identify the main characters, objects, or focal points.
- **Actions:** Detail the primary movements and events unfolding in the video.
- **Quality Style:** Determine the overall aesthetic (e.g., cinematic, hyperrealistic, anime, documentary).
- **Camera Movement:** Describe the camera work (e.g., static shot, drone shot, point-of-view, low angle).
- **Mood:** Capture the emotional tone or atmosphere of the video (e.g., dramatic, cheerful, mysterious).
Your final output must be a valid JSON object matching the provided schema. Do not include any extra text, commentary, or markdown formatting.`;
    }
};

export const analyzeVideoForPrompt = async (videoData: { mimeType: string, data: string }, analysisLevel: AnalysisLevel): Promise<AnalyzedPrompt> => {
  const ai = getAiClient();
  const systemInstruction = getSystemInstructionForAnalysis(analysisLevel);
  const userPromptText = `Analyze the attached video and generate a text-to-video prompt based on its content and your instructions.`;

  const textPart = { text: userPromptText };
  const videoPart = { inlineData: videoData };
  
  const contents = { parts: [textPart, videoPart] };

  try {
    console.log(`Sending request to Gemini API for video analysis with level: ${analysisLevel}...`);
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    sceneDescription: {
                        type: Type.STRING,
                        description: "A detailed description of the main scene, environment, and setting."
                    },
                    keySubjects: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "An array of the main subjects, characters, or objects in the video."
                    },
                    actions: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "An array describing the key actions and movements happening."
                    },
                    qualityStyle: {
                        type: Type.STRING,
                        description: "The overall visual aesthetic (e.g., 'Cinematic', 'Documentary', '3D Render')."
                    },
                    cameraMovement: {
                        type: Type.STRING,
                        description: "The style of camera work used (e.g., 'Static Shot', 'Drone Shot', 'POV')."
                    },
                    mood: {
                        type: Type.STRING,
                        description: "The emotional tone or atmosphere of the video (e.g., 'Dramatic', 'Peaceful', 'Energetic')."
                    }
                },
                required: ["sceneDescription", "keySubjects", "actions", "qualityStyle", "cameraMovement", "mood"]
            }
        }
    });

    const analyzedPrompt = JSON.parse(response.text);
    if (!analyzedPrompt) {
        throw new Error("API returned invalid or empty JSON data for video analysis.");
    }
    console.log("Received video analysis prompt.");
    return analyzedPrompt;

  } catch(error) {
    console.error("Error in analyzeVideoForPrompt service:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to analyze video: ${error.message}`);
    }
    throw new Error("An unknown error occurred while analyzing the video.");
  }
};
