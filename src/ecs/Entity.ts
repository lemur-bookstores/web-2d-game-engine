import { Component } from './Component';
import { v4 as uuidv4 } from 'uuid';

export class Entity {
    public readonly id: string;
    public active: boolean;
    private components: Map<string, Component>;
    // Layer bitmask or name can be attached to entity for rendering/collision filtering
    private _layer: string | number = 'default';

    constructor(id?: string) {
        this.id = id || uuidv4();
        this.active = true;
        this.components = new Map();
    }

    addComponent<T extends Component>(component: T): void {
        this.components.set(component.type, component);
    }

    /**
     * Set the entity layer by name or bit
     */
    setLayer(layer: string | number): void {
        this._layer = layer;
    }

    /**
     * Get the entity layer
     */
    getLayer(): string | number {
        return this._layer;
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

        // copy layer
        cloned.setLayer(this.getLayer());

        return cloned;
    }

    destroy(): void {
        this.active = false;
        this.components.clear();
    }

    toJSON(): any {
        return {
            id: this.id,
            active: this.active,
            layer: this._layer,
            components: this.getComponents().map(c => ({ ...c }))
        };
    }
}
