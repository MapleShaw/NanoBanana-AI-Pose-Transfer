import React from 'react';

// The canonical pose definition in a 256x280 design space
export const DESIGN_WIDTH = 256;
export const DESIGN_HEIGHT = 280;

export type Point = { x: number; y: number };
export type Joint = Point & { id: string };

export interface Pose {
  name: string;
  joints: Joint[];
  Icon: React.FC<{className?: string}>;
}

const connections: [string, string][] = [
    ['neck', 'l_shoulder'], ['neck', 'r_shoulder'], ['l_shoulder', 'l_elbow'],
    ['l_elbow', 'l_hand'], ['r_shoulder', 'r_elbow'], ['r_elbow', 'r_hand'],
    ['neck', 'hip'], ['l_hip', 'r_hip'], ['l_hip', 'l_knee'],
    ['l_knee', 'l_foot'], ['r_hip', 'r_knee'], ['r_knee', 'r_foot'],
];

const createPoseIcon = (joints: Joint[]): React.FC<{className?: string}> => {
  return ({ className }) => {
    const jointMap = new Map(joints.map(j => [j.id, j]));
    const head = jointMap.get('head');

    return React.createElement(
      'svg',
      {
        viewBox: `0 0 ${DESIGN_WIDTH} ${DESIGN_HEIGHT}`,
        className: className,
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: '15',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      },
      head && React.createElement('circle', { cx: head.x, cy: head.y, r: '20', strokeWidth: '12' }),
      ...connections.map(([startId, endId], i) => {
        const start = jointMap.get(startId);
        const end = jointMap.get(endId);
        if (start && end) {
          return React.createElement('line', { key: i, x1: start.x, y1: start.y, x2: end.x, y2: end.y });
        }
        return null;
      })
    );
  };
};


const standingJoints: Joint[] = [
    { id: 'head', x: 128, y: 40 }, { id: 'neck', x: 128, y: 70 },
    { id: 'l_shoulder', x: 108, y: 80 }, { id: 'r_shoulder', x: 148, y: 80 },
    { id: 'l_elbow', x: 108, y: 120 }, { id: 'r_elbow', x: 148, y: 120 },
    { id: 'l_hand', x: 108, y: 160 }, { id: 'r_hand', x: 148, y: 160 },
    { id: 'hip', x: 128, y: 130 }, { id: 'l_hip', x: 112, y: 130 },
    { id: 'r_hip', x: 144, y: 130 }, { id: 'l_knee', x: 112, y: 180 },
    { id: 'r_knee', x: 144, y: 180 }, { id: 'l_foot', x: 112, y: 230 },
    { id: 'r_foot', x: 144, y: 230 },
];

const wavingJoints: Joint[] = [
    { id: 'head', x: 128, y: 40 }, { id: 'neck', x: 128, y: 70 },
    { id: 'l_shoulder', x: 108, y: 80 }, { id: 'r_shoulder', x: 148, y: 80 },
    { id: 'l_elbow', x: 108, y: 120 }, { id: 'r_elbow', x: 188, y: 60 },
    { id: 'l_hand', x: 108, y: 160 }, { id: 'r_hand', x: 218, y: 40 },
    { id: 'hip', x: 128, y: 130 }, { id: 'l_hip', x: 112, y: 130 },
    { id: 'r_hip', x: 144, y: 130 }, { id: 'l_knee', x: 112, y: 180 },
    { id: 'r_knee', x: 144, y: 180 }, { id: 'l_foot', x: 112, y: 230 },
    { id: 'r_foot', x: 144, y: 230 },
];

const runningJoints: Joint[] = [
    { id: 'head', x: 140, y: 40 }, { id: 'neck', x: 138, y: 70 },
    { id: 'l_shoulder', x: 118, y: 75 }, { id: 'r_shoulder', x: 158, y: 75 },
    { id: 'l_elbow', x: 148, y: 110 }, { id: 'r_elbow', x: 128, y: 115 },
    { id: 'l_hand', x: 178, y: 130 }, { id: 'r_hand', x: 98, y: 140 },
    { id: 'hip', x: 128, y: 130 }, { id: 'l_hip', x: 112, y: 130 },
    { id: 'r_hip', x: 144, y: 130 }, { id: 'l_knee', x: 154, y: 180 },
    { id: 'r_knee', x: 92, y: 170 }, { id: 'l_foot', x: 184, y: 230 },
    { id: 'r_foot', x: 72, y: 210 },
];

const jumpingJoints: Joint[] = [
    { id: 'head', x: 128, y: 30 }, { id: 'neck', x: 128, y: 60 },
    { id: 'l_shoulder', x: 98, y: 55 }, { id: 'r_shoulder', x: 158, y: 55 },
    { id: 'l_elbow', x: 68, y: 35 }, { id: 'r_elbow', x: 188, y: 35 },
    { id: 'l_hand', x: 48, y: 20 }, { id: 'r_hand', x: 208, y: 20 },
    { id: 'hip', x: 128, y: 110 }, { id: 'l_hip', x: 108, y: 110 },
    { id: 'r_hip', x: 148, y: 110 }, { id: 'l_knee', x: 98, y: 160 },
    { id: 'r_knee', x: 158, y: 160 }, { id: 'l_foot', x: 88, y: 200 },
    { id: 'r_foot', x: 168, y: 200 },
];

const sittingJoints: Joint[] = [
    { id: 'head', x: 128, y: 60 }, { id: 'neck', x: 128, y: 90 },
    { id: 'l_shoulder', x: 108, y: 100 }, { id: 'r_shoulder', x: 148, y: 100 },
    { id: 'l_elbow', x: 98, y: 140 }, { id: 'r_elbow', x: 158, y: 140 },
    { id: 'l_hand', x: 88, y: 180 }, { id: 'r_hand', x: 168, y: 180 },
    { id: 'hip', x: 128, y: 150 }, { id: 'l_hip', x: 108, y: 150 },
    { id: 'r_hip', x: 148, y: 150 }, { id: 'l_knee', x: 108, y: 200 },
    { id: 'r_knee', x: 148, y: 200 }, { id: 'l_foot', x: 188, y: 200 },
    { id: 'r_foot', x: 68, y: 200 },
];

const thinkingJoints: Joint[] = [
    { id: 'head', x: 128, y: 40 }, { id: 'neck', x: 128, y: 70 },
    { id: 'l_shoulder', x: 108, y: 80 }, { id: 'r_shoulder', x: 148, y: 80 },
    { id: 'l_elbow', x: 108, y: 120 }, { id: 'r_elbow', x: 128, y: 80 },
    { id: 'l_hand', x: 108, y: 160 }, { id: 'r_hand', x: 118, y: 50 },
    { id: 'hip', x: 128, y: 130 }, { id: 'l_hip', x: 112, y: 130 },
    { id: 'r_hip', x: 144, y: 130 }, { id: 'l_knee', x: 112, y: 180 },
    { id: 'r_knee', x: 144, y: 180 }, { id: 'l_foot', x: 112, y: 230 },
    { id: 'r_foot', x: 144, y: 230 },
];

const dancingJoints: Joint[] = [
    { id: 'head', x: 128, y: 40 }, { id: 'neck', x: 128, y: 70 },
    { id: 'l_shoulder', x: 108, y: 80 }, { id: 'r_shoulder', x: 148, y: 80 },
    { id: 'l_elbow', x: 78, y: 60 }, { id: 'r_elbow', x: 178, y: 110 },
    { id: 'l_hand', x: 58, y: 40 }, { id: 'r_hand', x: 208, y: 130 },
    { id: 'hip', x: 128, y: 130 }, { id: 'l_hip', x: 112, y: 130 },
    { id: 'r_hip', x: 144, y: 130 }, { id: 'l_knee', x: 92, y: 180 },
    { id: 'r_knee', x: 164, y: 170 }, { id: 'l_foot', x: 72, y: 230 },
    { id: 'r_foot', x: 184, y: 210 },
];

const lyingDownJoints: Joint[] = [
    { id: 'head', x: 40, y: 140 }, { id: 'neck', x: 70, y: 140 },
    { id: 'l_shoulder', x: 80, y: 120 }, { id: 'r_shoulder', x: 80, y: 160 },
    { id: 'l_elbow', x: 60, y: 100 }, { id: 'r_elbow', x: 120, y: 160 },
    { id: 'l_hand', x: 40, y: 110 }, { id: 'r_hand', x: 150, y: 160 },
    { id: 'hip', x: 130, y: 140 }, { id: 'l_hip', x: 130, y: 120 },
    { id: 'r_hip', x: 130, y: 160 }, { id: 'l_knee', x: 180, y: 120 },
    { id: 'r_knee', x: 180, y: 160 }, { id: 'l_foot', x: 230, y: 120 },
    { id: 'r_foot', x: 230, y: 160 },
];


export const posePresets: Pose[] = [
  { name: 'Standing', joints: standingJoints, Icon: createPoseIcon(standingJoints) },
  { name: 'Waving', joints: wavingJoints, Icon: createPoseIcon(wavingJoints) },
  { name: 'Running', joints: runningJoints, Icon: createPoseIcon(runningJoints) },
  { name: 'Jumping', joints: jumpingJoints, Icon: createPoseIcon(jumpingJoints) },
  { name: 'Sitting', joints: sittingJoints, Icon: createPoseIcon(sittingJoints) },
  { name: 'Thinking', joints: thinkingJoints, Icon: createPoseIcon(thinkingJoints) },
  { name: 'Dancing', joints: dancingJoints, Icon: createPoseIcon(dancingJoints) },
  { name: 'Lying Down', joints: lyingDownJoints, Icon: createPoseIcon(lyingDownJoints) },
];