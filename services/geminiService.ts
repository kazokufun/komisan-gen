
import { GoogleGenAI, Type } from "@google/genai";
import type { GoogleGenAI as GoogleGenAIType } from "@google/genai";
import { PromptOptions, PromptVariation, AnalyzedPrompt, AnalysisLevel, PromptFormat } from '../types';

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
- For example, instead of 'duration: 5s', you might say 'a brief 5-second shot'.`;

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

export const generatePromptVariations = async (originalPrompt: string, instruction: string, promptFormat: PromptFormat): Promise<PromptVariation[]> => {
    const ai = getAiClient();
    let systemInstruction: string;
    let responseSchema: any;
    let userPrompt: string;
    const numVariations = 3;

    if (promptFormat === 'Description') {
        systemInstruction = `You are a creative prompt engineer specializing in text-to-video generation. Your task is to create ${numVariations} distinct variations of a given prompt description.

**Key Constraints:**
1.  **Follow Instructions:** If a specific user instruction is given, prioritize it for creating variations.
2.  **Creative Freedom:** Creatively alter elements like color palettes, shapes, movement, or environment, while keeping the core subject.
3.  **English Only:** The output must be in English.
4.  **Output Format:** Your final output must be a valid JSON array of objects, each with an "english" key containing the prompt. Do not add any extra text, commentary, or markdown formatting.`;
        
        userPrompt = `
          Original prompt description: "${originalPrompt}"

          ${instruction ? `**User Instruction for Variations:**\n"${instruction}"` : `**Instruction:** Generate creative variations by altering elements like color, mood, or setting.`}

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
        switch (level) {
            case 'Akurat':
                return `You are a precise and objective video analyst. Your task is to analyze the provided video and factually describe its contents in a single, concise paragraph. Focus strictly on what is visually present. Avoid interpretation, inferring emotion, or adding creative flair. The output should be a direct, factual report in text format. Do not use JSON or markdown.`;
            case 'Detail':
                return `You are a highly meticulous and descriptive video analyst. Your task is to provide an exhaustive, verbose analysis of the video in a single, detailed paragraph. Delve into minute details: textures, subtle background elements, specific color palettes, lighting nuances, and the precise choreography of movements. Aim for a rich, dense description that captures every possible visual aspect. The output must be text only. Do not use JSON or markdown.`;
            case 'Normal':
            default:
                return `You are a world-class video analyst. Your task is to analyze the provided video and generate a vivid, descriptive paragraph that could be used as a prompt to recreate a similar video. Capture the scene, subjects, actions, style, camera work, and mood in a flowing narrative. The output must be a single block of text. Do not use JSON, markdown, or any structured format.`;
        }
    }

    // JSON format instructions
    switch (level) {
        case 'Akurat':
            return `You are a precise and objective video analyst. Your task is to analyze the provided video and factually describe its contents in JSON format. Focus strictly on what is visually present. Avoid interpretation, inferring emotion, or adding creative flair. The output should be a direct, factual report. Your final output must be a valid JSON object matching the provided schema. Do not include any extra text, commentary, or markdown formatting.`;
        case 'Detail':
            return `You are a highly meticulous and descriptive video analyst. Your task is to provide an exhaustive, verbose analysis of the video in JSON format. Delve into minute details: textures, subtle background elements, specific color palettes, lighting nuances, and the precise choreography of movements. Aim for a rich, dense description that captures every possible visual aspect. Your final output must be a valid JSON object matching the provided schema. Do not include any extra text, commentary, or markdown formatting.`;
        case 'Normal':
        default:
            return `You are a world-class video analyst and prompt engineer. Your task is to analyze the provided video and generate a structured, detailed prompt in JSON format that could be used to recreate a similar video. Your final output must be a valid JSON object matching the provided schema. Do not include any extra text, commentary, or markdown formatting.`;
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
            config: { systemInstruction }
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
            }
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
