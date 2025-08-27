// Core exports
export * from './core';
export * from './math';
export * from './types';

// Main engine class
export { Engine as GameEngine } from './core/Engine';

// Script API
export type { ScriptInstance } from './ecs/ScriptComponent';
export { scriptRegistry } from './ecs/ScriptRegistry';

// Version
export const VERSION = '0.5.0';

