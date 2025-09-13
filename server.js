import express from 'express';
import cors from 'cors';
import { GoogleGenAI, Modality } from '@google/genai';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env.local' });

const app = express();
const port = 3001;

const API_KEY = process.env.VITE_GEMINI_API_KEY;

console.log('🔍 API Key found:', API_KEY ? 'Yes (length: ' + API_KEY.length + ')' : 'No');

if (!API_KEY) {
  console.error('❌ VITE_GEMINI_API_KEY is not set in .env.local');
  console.log('📝 Please create .env.local file with: VITE_GEMINI_API_KEY=your_api_key');
  process.exit(1);
}

// 配置 GoogleGenAI，添加更多选项
const ai = new GoogleGenAI({ 
  apiKey: API_KEY,
  // 可能需要添加代理或其他配置
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    apiKeyConfigured: !!API_KEY,
    timestamp: new Date().toISOString()
  });
});

// 测试 Gemini API 连接
app.get('/api/test-gemini', async (req, res) => {
  try {
    console.log('🧪 Testing Gemini API connection...');
    
    // 简单的文本测试请求
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [{ text: 'Hello, just testing the connection. Please respond with "OK".' }]
      }
    });
    
    console.log('✅ Gemini API test successful');
    res.json({ 
      success: true, 
      message: 'Gemini API connection works',
      response: response.candidates[0].content.parts[0].text
    });
    
  } catch (error) {
    console.error('❌ Gemini API test failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: error.toString()
    });
  }
});

app.post('/api/generate-pose', async (req, res) => {
  try {
    const { originalImage, poseImage, dimensions } = req.body;
    
    console.log('📦 Request received:', {
      hasOriginalImage: !!originalImage?.base64,
      hasPoseImage: !!poseImage?.base64,
      dimensions: dimensions || 'default'
    });
    
    if (!originalImage?.base64 || !poseImage?.base64) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required image data' 
      });
    }
    
    console.log('🚀 Calling Gemini API...');
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: originalImage.base64,
              mimeType: originalImage.mimeType,
            },
          },
          {
            inlineData: {
              data: poseImage.base64,
              mimeType: poseImage.mimeType,
            },
          },
          {
            text: `Generate a full-body image based on the first image, with the person adopting the exact pose shown in the second image (stick figure). 

CRITICAL REQUIREMENTS:
1. POSE ACCURACY: The person must match the EXACT pose, body position, limb angles, and orientation of the stick figure. Pay special attention to:
   - Arm positions and angles
   - Leg positions and stance
   - Head orientation and tilt
   - Overall body posture and balance

2. FULL BODY GENERATION: Always generate a complete full-body image showing the person from head to toe, even if the original image was cropped (half-body, portrait, etc.). Extend and complete any missing body parts naturally.

3. PRESERVE IDENTITY: Maintain the original person's:
   - Facial features and appearance
   - Clothing style and colors
   - Hair style and color
   - Body proportions and build

4. BACKGROUND & COMPOSITION: 
   - Keep the original background style or create a suitable neutral background
   - Ensure proper lighting and shadows that match the pose
   - Make the composition balanced and natural

5. IMAGE QUALITY: Generate a high-quality, realistic image with proper proportions and natural-looking pose transitions.

${dimensions ? `OUTPUT DIMENSIONS: Generate the image in ${dimensions.width}x${dimensions.height} pixels (${dimensions.label}).` : 'OUTPUT DIMENSIONS: Generate the image in 512x768 pixels for optimal full-body display.'}

Focus on making the pose transfer as accurate as possible while maintaining photorealistic quality.`,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });
    
    // Find the image part in the response
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
        return res.json({ success: true, imageData: part.inlineData.data });
      }
    }
    
    console.log('❌ No image found in response');
    res.json({ success: false, error: 'No image generated' });
    
  } catch (error) {
    console.error('❌ Error calling Gemini API:', error);
    
    // 更详细的错误信息
    let errorMessage = 'Failed to generate image';
    if (error.message) {
      errorMessage = error.message;
    }
    
    // 检查是否是网络连接问题
    if (error.message && error.message.includes('fetch failed')) {
      errorMessage = 'Network connection failed. Please check your internet connection and API key.';
      console.log('💡 Troubleshooting tips:');
      console.log('   1. Check your internet connection');
      console.log('   2. Verify your API key is correct');
      console.log('   3. Check if you can access Google services');
    }
    
    res.status(500).json({ 
      success: false, 
      error: errorMessage
    });
  }
});

app.listen(port, () => {
  console.log(`🚀 Proxy server running at http://localhost:${port}`);
});
