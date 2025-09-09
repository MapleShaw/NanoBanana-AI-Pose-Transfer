import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef, useCallback } from 'react';

export interface DrawingCanvasRef {
  clearCanvas: () => void;
  getCanvasDataURL: () => string | null;
  loadImage: (dataUrl: string) => void;
}

const DrawingCanvas = forwardRef<DrawingCanvasRef>((props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isCanvasEmpty, setIsCanvasEmpty] = useState(true);

  const getContext = useCallback(() => canvasRef.current?.getContext('2d') || null, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const context = getContext();
    if (canvas && context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      setIsCanvasEmpty(true);
    }
  }, [getContext]);

  const loadImage = useCallback((dataUrl: string) => {
    const canvas = canvasRef.current;
    const context = getContext();
    if (!canvas || !context) return;
    
    const img = new Image();
    img.onload = () => {
      clearCanvas();
      const canvasAR = canvas.width / canvas.height;
      const imgAR = img.width / img.height;
      let drawWidth, drawHeight, x, y;

      if(canvasAR > imgAR) {
        drawHeight = canvas.height;
        drawWidth = imgAR * drawHeight;
        x = (canvas.width - drawWidth) / 2;
        y = 0;
      } else {
        drawWidth = canvas.width;
        drawHeight = drawWidth / imgAR;
        x = 0;
        y = (canvas.height - drawHeight) / 2;
      }

      context.drawImage(img, x, y, drawWidth, drawHeight);
      setIsCanvasEmpty(false);
    }
    img.src = dataUrl;
  }, [getContext, clearCanvas]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = canvas?.parentElement;
    if (!canvas || !container) return;

    const resizeObserver = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      const context = getContext();
      if (!context) return;
      context.scale(dpr, dpr);
      context.lineCap = 'round';
      context.strokeStyle = 'black';
      context.lineWidth = 5;
    });
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [getContext]);

  const startDrawing = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
    const context = getContext();
    if (!context) return;
    const { offsetX, offsetY } = nativeEvent;
    context.beginPath();
    context.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const finishDrawing = () => {
    getContext()?.closePath();
    setIsDrawing(false);
    
    if (canvasRef.current) {
        const data = canvasRef.current.toDataURL();
        const emptyCanvas = document.createElement('canvas');
        emptyCanvas.width = canvasRef.current.width;
        emptyCanvas.height = canvasRef.current.height;
        setIsCanvasEmpty(data === emptyCanvas.toDataURL());
    }
  };

  const draw = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const context = getContext();
    if (!context) return;
    const { offsetX, offsetY } = nativeEvent;
    context.lineTo(offsetX, offsetY);
    context.stroke();
  };
  
  useImperativeHandle(ref, () => ({
    clearCanvas,
    loadImage,
    getCanvasDataURL: () => {
      if (isCanvasEmpty || !canvasRef.current) return null;
      
      const originalCanvas = canvasRef.current;
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = originalCanvas.width;
      tempCanvas.height = originalCanvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return null;

      // Fill with white background to ensure high contrast
      tempCtx.fillStyle = 'white';
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      tempCtx.drawImage(originalCanvas, 0, 0);

      return tempCanvas.toDataURL('image/png');
    },
  }));

  return (
    <div className="w-full h-full relative">
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseUp={finishDrawing}
        onMouseMove={draw}
        onMouseLeave={finishDrawing}
        className="bg-white rounded-lg w-full h-full cursor-crosshair shadow-inner"
      />
      <button
        onClick={clearCanvas}
        className="absolute bottom-2 right-2 bg-slate-200/40 hover:bg-red-500/80 text-slate-700 hover:text-white font-bold p-2 rounded-full transition-all duration-300 text-sm flex items-center gap-2"
        aria-label="Clear Canvas"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
});

export default DrawingCanvas;