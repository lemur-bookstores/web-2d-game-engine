import { Component } from './Component';
import { v4 as uuidv4 } from 'uuid';

export class Entity {
    public readonly id: string;
    public active: boolean;
    private components: Map<string, Component>;

    constructor(id?: string) {
        this.id = id || uuidv4();
        this.active = true;
        this.components = new Map();
    }

    addComponent<T extends Component>(component: T): void {
        this.components.set(component.type, component);
    }

    removeComponent(type: string): void {
        this.components.delete(type);
    }

    getComponent<T extends Component>(type: string): T | undefined {
        return this.components.get(type) as T;
    }

    hasComponent(type: string): boolean {
        return this.components.has(type);
    }

    getComponents(): Component[] {
        return Array.from(this.components.values());
    }

    clone(): Entity {
        const cloned = new Entity();
        cloned.active = this.active;

        this.components.forEach((component, _type) => {
            cloned.addComponent({ ...component });
        });

        return cloned;
    }

    destroy(): void {
        this.active = false;
        this.components.clear();
    }
}
