import React from 'react';
import { posePresets, type Pose } from '../lib/poses';

interface PosePresetsProps {
  selectedPose: Pose | null;
  onSelect: (pose: Pose) => void;
}

const PosePresets: React.FC<PosePresetsProps> = ({ selectedPose, onSelect }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full h-full overflow-y-auto pr-2">
      {posePresets.map((pose) => {
        const Icon = pose.Icon;
        return (
          <button
            key={pose.name}
            onClick={() => onSelect(pose)}
            className={`group relative flex flex-col items-center justify-between p-2 aspect-square rounded-lg overflow-hidden transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/50 focus:ring-cyan-400 ${
              selectedPose?.name === pose.name
                ? 'ring-2 ring-cyan-400 bg-cyan-500/20'
                : 'ring-1 ring-white/20 hover:ring-white/40 bg-black/30'
            }`}
          >
            <div className="flex-grow w-full flex items-center justify-center p-1">
               <Icon className="w-full h-full object-contain invert transition-transform duration-200 group-hover:scale-110" />
            </div>
            <span className="block mt-2 text-xs font-medium text-slate-300 text-center">
              {pose.name}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default PosePresets;