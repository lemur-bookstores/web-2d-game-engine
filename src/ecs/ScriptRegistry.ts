import { ScriptInstance } from './ScriptComponent';

type ScriptConstructor = new (...args: any[]) => ScriptInstance;

export class ScriptRegistry {
    private map = new Map<string, ScriptConstructor>();

    register(name: string, ctor: ScriptConstructor): void {
        this.map.set(name, ctor);
    }

    create(name: string, ...args: any[]): ScriptInstance | null {
        const C = this.map.get(name);
        if (!C) return null;
        return new C(...args);
    }

    has(name: string): boolean {
        return this.map.has(name);
    }
}

export const scriptRegistry = new ScriptRegistry();
