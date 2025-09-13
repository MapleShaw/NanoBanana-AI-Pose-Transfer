import React from 'react';
import { ImageDimensions, IMAGE_SIZE_OPTIONS } from '../services/geminiService';

interface ImageSizeSelectorProps {
  selectedSize: ImageDimensions;
  onSizeChange: (size: ImageDimensions) => void;
}

const ImageSizeSelector: React.FC<ImageSizeSelectorProps> = ({ selectedSize, onSizeChange }) => {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4a2 2 0 012-2h2M4 16v4a2 2 0 002 2h2m8-16h2a2 2 0 012 2v2m-4 12h2a2 2 0 002-2v-2" />
        </svg>
        输出尺寸
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {IMAGE_SIZE_OPTIONS.map((size, index) => (
          <button
            key={index}
            onClick={() => onSizeChange(size)}
            className={`p-3 rounded-lg border text-sm font-medium transition-all duration-200 ${
              selectedSize.width === size.width && selectedSize.height === size.height
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20'
            }`}
          >
            <div className="text-xs text-slate-400 mb-1">
              {size.width} × {size.height}
            </div>
            <div>{size.label}</div>
          </button>
        ))}
      </div>
      <div className="text-xs text-slate-500 mt-2">
        💡 推荐使用全身竖屏或高清正方形获得最佳效果
      </div>
    </div>
  );
};

export default ImageSizeSelector;
