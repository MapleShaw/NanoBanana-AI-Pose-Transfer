
import { GoogleGenAI, Modality } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const generateImageFromPose = async (
  originalImageBase64: string,
  originalImageMimeType: string,
  poseImageBase64: string,
  poseImageMimeType: string
): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: originalImageBase64,
              mimeType: originalImageMimeType,
            },
          },
          {
            inlineData: {
              data: poseImageBase64,
              mimeType: poseImageMimeType,
            },
          },
          {
            text: 'Recreate the first image, making the person adopt the pose of the stick figure in the second image. Maintain the original subject’s appearance, clothing, and the background style.',
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });
    
    // The model can return multiple parts, we need to find the image part.
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
        return part.inlineData.data;
      }
    }
    
    // If no image part is found in the response
    return null;

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw new Error('Failed to generate image from AI model. Please check the console for details.');
  }
};
