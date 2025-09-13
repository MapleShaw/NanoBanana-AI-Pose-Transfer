
// 使用代理服务器调用 Gemini API
const API_BASE_URL = 'http://localhost:3001';

export interface ImageDimensions {
  width: number;
  height: number;
  label: string;
}

export const IMAGE_SIZE_OPTIONS: ImageDimensions[] = [
  { width: 512, height: 512, label: "正方形 (1:1)" },
  { width: 512, height: 768, label: "竖屏 (2:3)" },
  { width: 768, height: 512, label: "横屏 (3:2)" },
  { width: 512, height: 896, label: "全身竖屏 (4:7)" },
  { width: 896, height: 512, label: "全身横屏 (7:4)" },
  { width: 1024, height: 1024, label: "高清正方形 (1:1)" }
];

export const generateImageFromPose = async (
  originalImageBase64: string,
  originalImageMimeType: string,
  poseImageBase64: string,
  poseImageMimeType: string,
  dimensions?: ImageDimensions
): Promise<string | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/generate-pose`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        originalImage: {
          base64: originalImageBase64,
          mimeType: originalImageMimeType,
        },
        poseImage: {
          base64: poseImageBase64,
          mimeType: poseImageMimeType,
        },
        dimensions,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success) {
      return result.imageData;
    } else {
      throw new Error(result.error || 'Failed to generate image');
    }

  } catch (error) {
    console.error('Error calling Gemini API via proxy:', error);
    throw new Error('Failed to generate image from AI model. Please check the console for details.');
  }
};
