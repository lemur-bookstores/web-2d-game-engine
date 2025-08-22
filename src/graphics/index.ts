// Core rendering interfaces and classes
export type { RenderStrategy } from './Renderer';
export { WebGLRenderer } from './WebGLRenderer';
export { Canvas2DRenderer } from './Canvas2DRenderer';

// Texture and sprite management
export { Texture } from './Texture';
export { Sprite } from './Sprite';
export type { SpriteComponent } from './Sprite';
export { SpriteSheet } from './SpriteSheet';
export type { SpriteFrame, Animation } from './SpriteSheet';

// Animation system
export { AnimationState } from './Animation';
export type { AnimationComponent } from './Animation';
export { AnimationSystem } from './AnimationSystem';

// Rendering system
export { RenderSystem } from './RenderSystem';
export type { TransformComponent, RenderStats } from './RenderSystem';

// Type aliases for convenience
export type Renderer = import('./Renderer').RenderStrategy;
export type GraphicsRenderer = import('./WebGLRenderer').WebGLRenderer | import('./Canvas2DRenderer').Canvas2DRenderer;
