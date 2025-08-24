import { Animation } from '../graphics/SpriteSheet';

export interface AnimationComponent {
    type: 'animation';
    spriteSheet: string; // key in AssetManager
    currentAnimation: string;
    currentFrame: number;
    frameTime: number; // seconds per frame
    elapsedTime: number;
    loop?: boolean;
    playing?: boolean;
    // optional map of named animations metadata (cached at system level normally)
    animations?: Record<string, Animation>;
}
