import { RadioOption } from './types';

export const VIDEO_STYLES: RadioOption[] = [
  { id: 'cinematic', label: 'Cinematic', description: 'Dramatic, high-contrast lighting and epic feel.' },
  { id: 'anime', label: 'Anime', description: 'Japanese animation style, vibrant and expressive.' },
  { id: 'documentary', label: 'Documentary', description: 'Realistic, observational, and informative.' },
  { id: 'vlog', label: 'Vlog', description: 'Casual, first-person perspective, often handheld.' },
  { id: 'sci-fi', label: 'Sci-Fi', description: 'Futuristic, high-tech, and often otherworldly visuals.' },
  { id: 'animation-background', label: 'Animations Background', description: 'Motion graphics for backgrounds.' },
  { id: 'colors-animations', label: 'Colors Animations', description: 'Focus on vibrant, moving color patterns.' },
];

export const CAMERA_ANGLES: RadioOption[] = [
  { id: 'low-angle', label: 'Low Angle', description: 'Shot from below, making subjects look powerful.' },
  { id: 'high-angle', label: 'High Angle', description: 'Shot from above, making subjects look smaller.' },
  { id: 'dutch-angle', label: 'Dutch Angle', description: 'Tilted camera, creating a sense of unease.' },
  { id: 'pov', label: 'Point-of-View (POV)', description: 'See the scene from a character\'s eyes.' },
  { id: 'drone-shot', label: 'Drone Shot', description: 'Sweeping aerial view from high above.' },
  { id: 'static-shot', label: 'Static Shot', description: 'Fixed camera position, no movement.' },
];

export const VISUAL_STYLES: RadioOption[] = [
  { id: 'hyperrealistic', label: 'Hyperrealistic', description: 'Extremely high detail, like a real photo.' },
  { id: 'watercolor', label: 'Watercolor', description: 'Soft, flowing colors with a painted texture.' },
  { id: '3d-render', label: '3D Render', description: 'Polished, computer-generated digital models.' },
  { id: 'pixel-art', label: 'Pixel Art', description: 'Retro, blocky aesthetic like old video games.' },
  { id: 'claymation', label: 'Claymation', description: 'Stop-motion animation with clay models.' },
  { id: 'flat-style', label: 'Flat Style', description: 'Minimalist, two-dimensional with no depth.' },
  { id: '2d-style', label: '2D Style', description: 'Classic 2D animation look.' },
];

export const NEGATIVE_PROMPTS: string[] = [
  'ugly',
  'deformed',
  'bad anatomy',
  'extra fingers',
  'blurry',
  'low quality',
  'text',
  'watermark',
  'signature',
  'motion blur',
  'object merging',
];