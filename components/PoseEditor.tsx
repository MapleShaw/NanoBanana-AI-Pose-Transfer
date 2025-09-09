import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import { type Joint } from '../lib/poses';

const initialJoints: Joint[] = [
    { id: 'head', x: 128, y: 40 }, { id: 'neck', x: 128, y: 70 },
    { id: 'l_shoulder', x: 98, y: 80 }, { id: 'r_shoulder', x: 158, y: 80 },
    { id: 'l_elbow', x: 78, y: 120 }, { id: 'r_elbow', x: 178, y: 120 },
    { id: 'l_hand', x: 58, y: 160 }, { id: 'r_hand', x: 198, y: 160 },
    { id: 'hip', x: 128, y: 130 }, { id: 'l_hip', x: 108, y: 130 },
    { id: 'r_hip', x: 148, y: 130 }, { id: 'l_knee', x: 98, y: 180 },
    { id: 'r_knee', x: 158, y: 180 }, { id: 'l_foot', x: 88, y: 230 },
    { id: 'r_foot', x: 168, y: 230 },
];

const connections: [string, string][] = [
    ['neck', 'l_shoulder'], ['neck', 'r_shoulder'], ['l_shoulder', 'l_elbow'],
    ['l_elbow', 'l_hand'], ['r_shoulder', 'r_elbow'], ['r_elbow', 'r_hand'],
    ['neck', 'hip'], ['l_hip', 'r_hip'], ['l_hip', 'l_knee'],
    ['l_knee', 'l_foot'], ['r_hip', 'r_knee'], ['r_knee', 'r_foot'],
];

const JOINT_RADIUS = 8;
export interface PoseEditorRef { 
    getCanvasDataURL: () => string | null;
    setJoints: (newJoints: Joint[]) => void;
}

// The canonical pose definition in a 256x280 design space
const DESIGN_WIDTH = 256;
const DESIGN_HEIGHT = 280;

const PoseEditor = forwardRef<PoseEditorRef, {}>((props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [joints, setJoints] = useState<Joint[]>(initialJoints);
  const [draggingJoint, setDraggingJoint] = useState<string | null>(null);
  const transformRef = useRef({ scale: 1, offsetX: 0, offsetY: 0 });

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    const { scale, offsetX, offsetY } = transformRef.current;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    const t = (p: {x: number, y: number}) => ({ x: p.x * scale + offsetX, y: p.y * scale + offsetY });

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 5 * scale;
    ctx.lineCap = 'round';
    connections.forEach(([startId, endId]) => {
      const start = joints.find(j => j.id === startId);
      const end = joints.find(j => j.id === endId);
      if (start && end) {
        ctx.beginPath();
        const startT = t(start);
        const endT = t(end);
        ctx.moveTo(startT.x, startT.y);
        ctx.lineTo(endT.x, endT.y);
        ctx.stroke();
      }
    });
    
    const head = joints.find(j => j.id === 'head');
    if (head) {
        const headT = t(head);
        ctx.beginPath();
        ctx.arc(headT.x, headT.y, 15 * scale, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.9)';
        ctx.lineWidth = 3 * scale;
        ctx.fill();
        ctx.stroke();
    }

    joints.filter(j => j.id !== 'head').forEach(joint => {
      const jointT = t(joint);
      ctx.beginPath();
      ctx.arc(jointT.x, jointT.y, JOINT_RADIUS * scale, 0, Math.PI * 2);
      ctx.fillStyle = draggingJoint === joint.id ? 'rgba(0, 255, 255, 1)' : 'rgba(255, 255, 255, 0.9)';
      ctx.fill();
    });
  }, [joints, draggingJoint]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const observer = new ResizeObserver(entries => {
        const entry = entries[0];
        const dpr = window.devicePixelRatio || 1;
        const rect = entry.contentRect;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const scale = Math.min(rect.width / DESIGN_WIDTH, rect.height / DESIGN_HEIGHT) * 0.9;
        const offsetX = (rect.width - DESIGN_WIDTH * scale) / 2;
        const offsetY = (rect.height - DESIGN_HEIGHT * scale) / 2;
        transformRef.current = { scale, offsetX, offsetY };
        
        draw(ctx);
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [draw]);

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>): {x: number, y: number} => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const { scale, offsetX, offsetY } = transformRef.current;
    return {
        x: (e.clientX - rect.left - offsetX) / scale,
        y: (e.clientY - rect.top - offsetY) / scale
    };
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    for (const joint of joints) {
      const dx = pos.x - joint.x;
      const dy = pos.y - joint.y;
      if (Math.sqrt(dx * dx + dy * dy) < JOINT_RADIUS + 5) {
        setDraggingJoint(joint.id);
        return;
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggingJoint) return;
    const pos = getMousePos(e);
    setJoints(prevJoints => prevJoints.map(j => 
        j.id === draggingJoint ? { ...j, x: pos.x, y: pos.y } : j
    ));
  };
  
  const handleMouseUp = () => setDraggingJoint(null);

  useImperativeHandle(ref, () => ({
    getCanvasDataURL: () => {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = DESIGN_WIDTH;
      tempCanvas.height = DESIGN_HEIGHT;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return null;

      tempCtx.fillStyle = 'white';
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

      tempCtx.strokeStyle = 'black';
      tempCtx.lineWidth = 5;
      tempCtx.lineCap = 'round';

      connections.forEach(([startId, endId]) => {
        const start = joints.find(j => j.id === startId);
        const end = joints.find(j => j.id === endId);
        if (start && end) {
          tempCtx.beginPath();
          tempCtx.moveTo(start.x, start.y);
          tempCtx.lineTo(end.x, end.y);
          tempCtx.stroke();
        }
      });
      const head = joints.find(j => j.id === 'head');
      if (head) {
        tempCtx.beginPath();
        tempCtx.arc(head.x, head.y, 15, 0, Math.PI * 2);
        tempCtx.stroke();
      }
      return tempCanvas.toDataURL('image/png');
    },
    setJoints: (newJoints: Joint[]) => {
      setJoints(JSON.parse(JSON.stringify(newJoints)));
    }
  }));

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="bg-black/30 rounded-lg w-full h-full cursor-grab active:cursor-grabbing shadow-inner"
    />
  );
});

export default PoseEditor;