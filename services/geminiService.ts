

import { GoogleGenAI, Type } from "@google/genai";
import type { GoogleGenAI as GoogleGenAIType } from "@google/genai";
import { PromptOptions, PromptVariation, AnalyzedPrompt, AnalysisLevel, PromptFormat, VariationAspect } from '../types';

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
  const { idea, videoStyle, cameraAngle, visualStyle, imageData, negativePrompts, duration, promptFormat } = options;

  if (promptFormat === 'Description') {
      const systemInstruction = `You are a world-class prompt engineer for a generative AI text-to-video model. Your task is to craft a vivid, detailed, and coherent descriptive paragraph that can be used as a prompt.
- Combine the user's core idea and stylistic choices into a single, narrative description.
- The description should be rich in visual detail, covering subjects, actions, setting, lighting, and mood.
- Do not use JSON, markdown, or any structured format. The output must be a single block of text.
- Weave the genre, camera angle, quality style, and duration into the description naturally and creatively.
- For example, instead of 'duration: 5s', you might say 'a brief 5-second shot'.
- The entire final description MUST NOT exceed 990 characters.`;

      const userPromptText = `
        Core Idea: "${idea}"
        ---
        Values to incorporate:
        Genre: "${videoStyle}"
        Camera Angle / Shot: "${cameraAngle}"
        Quality Style: "${visualStyle}"
        Duration: ${duration} seconds
        Negative Prompts (elements to avoid): ${negativePrompts?.join(', ') || 'None'}
        ${imageData ? "\n--- \nReference Image Provided: Draw inspiration from its composition, color palette, and subject matter to enrich the description." : ""}
      `;
      
      const textPart = { text: userPromptText };
      const contents = imageData ? { parts: [textPart, { inlineData: imageData }] } : userPromptText;

      try {
        console.log("Sending request to Gemini API for description prompt generation...");
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents,
          config: {
            systemInstruction,
            temperature: 0.8,
            maxOutputTokens: 400,
            thinkingConfig: { thinkingBudget: 100 },
          },
        });
        const description = response.text.trim();
        if (!description) {
            throw new Error("The API returned an empty description.");
        }
        console.log("Received description prompt.");
        return description;
      } catch (error) {
        console.error("Error in generateVideoPrompt (Description) service:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to generate description prompt: ${error.message}`);
        }
        throw new Error("An unknown error occurred while generating the description prompt.");
      }
  }

  // --- Default JSON Logic ---
  const systemInstruction = `You are a world-class prompt engineer for a generative AI text-to-video model. Your task is to take a user's core idea and stylistic choices and convert them into a structured JSON object.
- Analyze the 'Core Idea' to extract a concise 'subject', 'action_detail', 'setting_detail', and 'lighting_mood'.
- Populate the 'prompt_components' and 'technical_parameters' fields based on the user's input and your analysis.
- 'genre', 'quality_style', 'camera_shot', and 'duration_seconds' must be populated directly from the user's provided values.
- If a reference image is provided, draw inspiration from its composition, color palette, and subject matter to enrich the JSON fields.
- The total character count of the generated JSON output, including all formatting, MUST NOT exceed 990 characters. Be concise in your descriptions for 'subject', 'action_detail', 'setting_detail', and 'lighting_mood' to meet this constraint.
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
        maxOutputTokens: 600,
        thinkingConfig: { thinkingBudget: 200 },
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

export const generatePromptVariations = async (originalPrompt: string, variationAspects: VariationAspect[], promptFormat: PromptFormat): Promise<PromptVariation[]> => {
    const ai = getAiClient();
    let systemInstruction: string;
    let responseSchema: any;
    let userPrompt: string;
    const numVariations = 5;

    if (promptFormat === 'Description') {
        systemInstruction = `You are a creative prompt engineer specializing in text-to-video generation. Your task is to create ${numVariations} distinct variations of a given prompt description.

**Key Constraints:**
1.  **Focused Variation:** You MUST only alter the aspects specified by the user: "${variationAspects.join(', ')}". For example, if the user chose 'Background', only change the background description. If they chose 'Colors', only change the color descriptions. All other elements like subject, action, style, camera angles, etc., MUST be preserved.
2.  **Creative Freedom:** Be creative with the changes for the specified aspect.
3.  **English Only:** The output must be in English.
4.  **Output Format:** Your final output must be a valid JSON array of objects, each with an "english" key containing the prompt. Do not add any extra text, commentary, or markdown formatting.
5.  **Character Limit:** Each generated variation description (the value of the "english" key) MUST NOT exceed 990 characters.`;
        
        userPrompt = `
          Original prompt description: "${originalPrompt}"

          **User-selected aspects to vary:**
          "${variationAspects.join(', ')}"

          Now, generate ${numVariations} English-only variations based on these instructions, ensuring your output is a valid JSON array.
        `;

        responseSchema = {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    english: { type: Type.STRING, description: "The creative variation of the prompt in English." }
                },
                required: ["english"]
            }
        };

        try {
            console.log("Sending request to Gemini API for description prompt variations...");
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash", contents: userPrompt,
                config: { systemInstruction, responseMimeType: "application/json", responseSchema }
            });
            const parsedResponse = JSON.parse(response.text);
            if (!parsedResponse || !Array.isArray(parsedResponse) || parsedResponse.length === 0) {
                throw new Error("API returned invalid or empty variations data.");
            }
            console.log("Received description prompt variations.");
            // Map to PromptVariation with empty indonesian string
            return (parsedResponse as { english: string }[]).map(p => ({ 
                english: p.english, 
                indonesian: '' 
            }));
        } catch(error) {
            console.error("Error in generatePromptVariations (Description):", error);
            if (error instanceof Error) throw new Error(`Failed to generate variations: ${error.message}`);
            throw new Error("An unknown error occurred while generating variations.");
        }

    } else { // JSON
        systemInstruction = `You are an expert prompt engineer for a generative AI text-to-video model. Your task is to take a user's JSON prompt and generate ${numVariations} creative variations.

**Key Constraints:**
1.  **Maintain Structure:** Each variation must be a valid JSON object with the exact same structure as the original ('prompt_components' and 'technical_parameters').
2.  **Focused Variation:** You MUST only alter the values related to the aspects specified by the user: "${variationAspects.join(', ')}". All other key-value pairs in the JSON structure MUST remain identical to the original prompt.
    - If 'Background' is chosen, alter 'setting_detail'.
    - If 'Subject' is chosen, alter 'subject'.
    - If 'Colors' is chosen, alter 'lighting_mood' or add color descriptions to other relevant fields.
    - If 'Visual Style' is chosen, alter 'quality_style'.
    - Adapt creatively for other aspects like 'Element', 'Texture', 'Pattern Animations'.
3.  **Output Format:** Your final output MUST be a valid JSON array of these prompt objects. Do not add any extra text, commentary, or markdown formatting.
4.  **Character Limit:** The total character count of each generated JSON variation, including all formatting, MUST NOT exceed 990 characters. Keep descriptions concise to meet this constraint.`;
        
        userPrompt = `
            Original JSON prompt:
            \`\`\`json
            ${originalPrompt}
            \`\`\`

            **User-selected aspects to vary:**
            "${variationAspects.join(', ')}"

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
                            negative_prompts: { type: Type.ARRAY, items: { type: Type.STRING } }
                        },
                        required: ["duration_seconds"]
                    }
                },
                required: ["prompt_components", "technical_parameters"]
            }
        };

        try {
            console.log("Sending request to Gemini API for JSON prompt variations...");
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash", contents: userPrompt,
                config: { systemInstruction, responseMimeType: "application/json", responseSchema }
            });
            const parsedResponse = JSON.parse(response.text);
            if (!parsedResponse || !Array.isArray(parsedResponse) || parsedResponse.length === 0) {
                throw new Error("API returned invalid or empty variations data.");
            }
            console.log("Received JSON prompt variations.");
            return (parsedResponse as any[]).map(p => ({ 
                english: JSON.stringify(p, null, 2), 
                indonesian: '' 
            }));
        } catch(error) {
            console.error("Error in generatePromptVariations (JSON):", error);
            if (error instanceof Error) throw new Error(`Failed to generate variations: ${error.message}`);
            throw new Error("An unknown error occurred while generating variations.");
        }
    }
}

const getSystemInstructionForAnalysis = (level: AnalysisLevel, promptFormat: PromptFormat): string => {
    if (promptFormat === 'Description') {
        const baseInstruction = "The output must be a single block of text and MUST NOT exceed 990 characters. Do not use JSON, markdown, or any structured format.";
        switch (level) {
            case 'Akurat':
                return `You are a precise and objective video analyst. Your task is to analyze the provided video and factually describe its contents in a single, concise paragraph. Focus strictly on what is visually present. Avoid interpretation, inferring emotion, or adding creative flair. ${baseInstruction}`;
            case 'Detail':
                return `You are a highly meticulous and descriptive video analyst. Your task is to provide a very detailed analysis of the video in a single paragraph. Delve into details like textures, background elements, color palettes, lighting, and movements. ${baseInstruction}`;
            case 'Normal':
            default:
                return `You are a world-class video analyst. Your task is to analyze the provided video and generate a vivid, descriptive paragraph that could be used as a prompt to recreate a similar video. Capture the scene, subjects, actions, style, camera work, and mood in a flowing narrative. ${baseInstruction}`;
        }
    }

    // JSON format instructions
    const jsonBaseInstruction = `Your final output must be a valid JSON object matching the provided schema, and its total character count MUST NOT exceed 990. Do not include any extra text, commentary, or markdown formatting. Keep all text values concise to meet this constraint.`;
    switch (level) {
        case 'Akurat':
            return `You are a precise and objective video analyst. Your task is to analyze the provided video and factually describe its contents in JSON format. Focus strictly on what is visually present. Avoid interpretation or emotion. ${jsonBaseInstruction}`;
        case 'Detail':
            return `You are a highly meticulous and descriptive video analyst. Your task is to provide a very detailed analysis of the video in JSON format. Delve into details like textures, background elements, color palettes, lighting, and movements. ${jsonBaseInstruction}`;
        case 'Normal':
        default:
            return `You are a world-class video analyst and prompt engineer. Your task is to analyze the provided video and generate a structured, detailed prompt in JSON format that could be used to recreate a similar video. ${jsonBaseInstruction}`;
    }
};

export const analyzeVideoForPrompt = async (videoData: { mimeType: string, data: string }, analysisLevel: AnalysisLevel, promptFormat: PromptFormat): Promise<AnalyzedPrompt | string> => {
  const ai = getAiClient();
  const systemInstruction = getSystemInstructionForAnalysis(analysisLevel, promptFormat);
  const userPromptText = `Analyze the attached video and generate a response based on your instructions.`;

  const textPart = { text: userPromptText };
  const videoPart = { inlineData: videoData };
  const contents = { parts: [textPart, videoPart] };

  try {
    console.log(`Sending request to Gemini API for video analysis with level: ${analysisLevel} and format: ${promptFormat}...`);
    
    if (promptFormat === 'Description') {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents,
            config: { 
                systemInstruction,
                maxOutputTokens: 400,
                thinkingConfig: { thinkingBudget: 100 },
            }
        });
        const description = response.text.trim();
        if (!description) {
            throw new Error("API returned an empty analysis description.");
        }
        console.log("Received video analysis description.");
        return description;
    }

    // JSON Logic
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    sceneDescription: { type: Type.STRING, description: "A detailed description of the main scene, environment, and setting." },
                    keySubjects: { type: Type.ARRAY, items: { type: Type.STRING }, description: "An array of the main subjects, characters, or objects in the video." },
                    actions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "An array describing the key actions and movements happening." },
                    qualityStyle: { type: Type.STRING, description: "The overall visual aesthetic (e.g., 'Cinematic', 'Documentary', '3D Render')." },
                    cameraMovement: { type: Type.STRING, description: "The style of camera work used (e.g., 'Static Shot', 'Drone Shot', 'POV')." },
                    mood: { type: Type.STRING, description: "The emotional tone or atmosphere of the video (e.g., 'Dramatic', 'Peaceful', 'Energetic')." }
                },
                required: ["sceneDescription", "keySubjects", "actions", "qualityStyle", "cameraMovement", "mood"]
            },
            maxOutputTokens: 600,
            thinkingConfig: { thinkingBudget: 200 },
        }
    });

    const analyzedPrompt = JSON.parse(response.text);
    if (!analyzedPrompt) {
        throw new Error("API returned invalid or empty JSON data for video analysis.");
    }
    console.log("Received video analysis prompt.");
    return analyzedPrompt as AnalyzedPrompt;

  } catch(error) {
    console.error("Error in analyzeVideoForPrompt service:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to analyze video: ${error.message}`);
    }
    throw new Error("An unknown error occurred while analyzing the video.");
  }
};
