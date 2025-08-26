import { System } from '../ecs/System';
import { Entity } from '../ecs/Entity';
import { SpriteComponent } from './Sprite';
import { RenderStrategy } from './Renderer';
import { Texture } from './Texture';
import { Vector2 } from '../math/Vector2';
import { Camera2D } from './Camera2D';
import { Color } from '../math/Color';

export interface TransformComponent {
    type: 'transform';
    position: Vector2;
    rotation: number;
    scale: Vector2;
}

export class RenderSystem extends System {
    requiredComponents = ['transform', 'sprite'];
    private renderer: RenderStrategy;
    private textures = new Map<string, Texture>();
    private _backgroundColor: Color = new Color(0, 0, 0, 255);
    private camera: Camera2D | null = null;
    private layerOrder: Array<{ name: string; bit: number; mask?: number; visible?: boolean; opacity?: number }> | null = null;

    constructor(renderer: RenderStrategy) {
        super();
        this.renderer = renderer;
    }

    setRenderer(renderer: RenderStrategy): void {
        this.renderer = renderer;
    }

    getRenderer(): RenderStrategy {
        return this.renderer;
    }

    registerTexture(name: string, texture: Texture): void {
        this.textures.set(name, texture);
    }

    unregisterTexture(name: string): void {
        this.textures.delete(name);
    }

    getTexture(name: string): Texture | undefined {
        return this.textures.get(name);
    }

    setBackgroundColor(color: Color): void {
        this._backgroundColor = color;
        // Apply background color if renderer supports it
        if ('setBackgroundColor' in this.renderer) {
            (this.renderer as any).setBackgroundColor(color);
        }
    }

    getBackgroundColor(): Color {
        return this._backgroundColor;
    }

    update(entities: Entity[], _deltaTime: number): void {
        // Clear the screen
        this.renderer.clear();
        // Apply camera transform if available
        if (this.camera && 'applyCameraTransform' in this.renderer) {
            (this.renderer as any).applyCameraTransform(
                this.camera.position.x,
                this.camera.position.y,
                this.camera.zoom,
                this.camera.rotation
            );
        }

        // Get all renderable entities
        const renderableEntities = this.getEntitiesWithComponents(
            entities,
            this.requiredComponents
        );

        // Sort entities by z-index if available (for rendering order)
        const sortedEntities = this.sortEntitiesByZIndex(renderableEntities);

        // If we have a layer order, group entities by layer and respect visibility/opacity
        if (this.layerOrder && this.layerOrder.length > 0) {
            for (const layer of this.layerOrder) {
                // skip invisible layers
                if (layer.visible === false) continue;

                // set global alpha if supported
                if ('setGlobalAlpha' in this.renderer && layer.opacity !== undefined) {
                    try {
                        (this.renderer as any).setGlobalAlpha(layer.opacity);
                    } catch (e) {
                        // ignore if not supported
                    }
                }

                // render entities that belong to this layer
                sortedEntities.forEach((entity) => {
                    const entityLayer = entity.getLayer ? entity.getLayer() : null;
                    if (entityLayer === layer.name || entityLayer === layer.bit) {
                        this.renderEntity(entity);
                    }
                });

                // reset alpha after layer
                if ('resetGlobalAlpha' in this.renderer) {
                    try {
                        (this.renderer as any).resetGlobalAlpha();
                    } catch (e) {
                        // ignore
                    }
                }
            }
        } else {
            // No layer order provided - render all
            sortedEntities.forEach((entity) => {
                this.renderEntity(entity);
            });
        }

        // Reset transform if renderer supports it
        if (this.camera && 'resetTransform' in this.renderer) {
            (this.renderer as any).resetTransform();
        }

        // Present the rendered frame
        this.renderer.present();
    }

    setCamera(camera: Camera2D | null): void {
        this.camera = camera;
    }

    setLayerOrder(layers: Array<{ name: string; bit: number; mask?: number }>) {
        this.layerOrder = layers;
    }

    private renderEntity(entity: Entity): void {
        const transform = entity.getComponent<TransformComponent>('transform');
        const sprite = entity.getComponent<SpriteComponent>('sprite');

        if (!transform || !sprite) {
            console.log(`Entity ${entity.id} missing components - transform: ${!!transform}, sprite: ${!!sprite}`);
            return;
        }

        const texture = this.textures.get(sprite.texture);
        if (!texture) {
            console.warn(`Texture '${sprite.texture}' not found for entity ${entity.id}`);
            console.log('Available textures:', Array.from(this.textures.keys()));
            return;
        }

        // console.log(`Rendering entity ${entity.id} with texture '${sprite.texture}' at (${transform.position.x}, ${transform.position.y})`);

        // Calculate final position and size
        const finalPosition = new Vector2(
            transform.position.x,
            transform.position.y
        );

        const finalSize = new Vector2(
            sprite.width * transform.scale.x,
            sprite.height * transform.scale.y
        );

        // Simple viewport culling: if camera present, convert world pos to screen and
        // skip rendering if outside viewport bounds with a small margin
        if (this.camera) {
            const screenPos = this.camera.worldToScreen(finalPosition);
            const margin = 50; // allow some margin
            if (
                screenPos.x + finalSize.x / 2 < -margin ||
                screenPos.x - finalSize.x / 2 > this.camera.viewport.width + margin ||
                screenPos.y + finalSize.y / 2 < -margin ||
                screenPos.y - finalSize.y / 2 > this.camera.viewport.height + margin
            ) {
                return; // culled
            }
        }

        // Render the sprite
        // console.log(`[RenderSystem] About to call renderer.drawSprite for entity ${entity.id}`);
        // console.log(`[RenderSystem] Renderer type:`, this.renderer.constructor.name);

        if (this.hasUVMapping(sprite)) {
            // console.log(`[RenderSystem] Using UV mapping for entity ${entity.id}`);
            this.renderSpriteWithUV(texture, finalPosition, finalSize, transform.rotation, sprite);
        } else {
            // console.log(`[RenderSystem] Using standard drawSprite for entity ${entity.id}`);
            this.renderer.drawSprite(
                texture,
                finalPosition,
                finalSize,
                transform.rotation,
                sprite.tint
            );
        }
    }

    private hasUVMapping(sprite: SpriteComponent): boolean {
        return sprite.uvX !== undefined || sprite.uvY !== undefined ||
            sprite.uvWidth !== undefined || sprite.uvHeight !== undefined;
    }

    private renderSpriteWithUV(
        texture: Texture,
        position: Vector2,
        size: Vector2,
        rotation: number,
        sprite: SpriteComponent
    ): void {
        // Check if renderer supports UV mapping (Canvas2D does, WebGL should too)
        if ('drawSpriteUV' in this.renderer) {
            // Convert normalized UV coordinates (0-1) to pixel coordinates
            const uvX = (sprite.uvX || 0) * texture.width;
            const uvY = (sprite.uvY || 0) * texture.height;
            const uvWidth = (sprite.uvWidth !== undefined ? sprite.uvWidth : 1) * texture.width;
            const uvHeight = (sprite.uvHeight !== undefined ? sprite.uvHeight : 1) * texture.height;

            // console.log(`[RenderSystem] UV conversion - Original: (${sprite.uvX}, ${sprite.uvY}, ${sprite.uvWidth}, ${sprite.uvHeight}) Converted: (${uvX}, ${uvY}, ${uvWidth}, ${uvHeight})`);

            (this.renderer as any).drawSpriteUV(
                texture,
                position,
                size,
                uvX,
                uvY,
                uvWidth,
                uvHeight,
                rotation,
                sprite.flipX || false,
                sprite.flipY || false,
                sprite.tint
            );
        } else {
            // Fallback to regular sprite rendering
            this.renderer.drawSprite(texture, position, size, rotation, sprite.tint);
        }
    }

    private sortEntitiesByZIndex(entities: Entity[]): Entity[] {
        // If layerOrder is provided, sort by layer index first, then zIndex
        return entities.sort((a, b) => {
            const spriteA = a.getComponent<SpriteComponent>('sprite');
            const spriteB = b.getComponent<SpriteComponent>('sprite');

            const zIndexA = (spriteA as any)?.zIndex || 0;
            const zIndexB = (spriteB as any)?.zIndex || 0;

            let layerIdxA = 0;
            let layerIdxB = 0;

            const layerA = a.getLayer ? a.getLayer() : null;
            const layerB = b.getLayer ? b.getLayer() : null;

            if (this.layerOrder) {
                const idxA = this.layerOrder.findIndex(l => l.name === layerA || l.bit === layerA);
                const idxB = this.layerOrder.findIndex(l => l.name === layerB || l.bit === layerB);
                layerIdxA = idxA >= 0 ? idxA : this.layerOrder.length;
                layerIdxB = idxB >= 0 ? idxB : this.layerOrder.length;
            }

            if (layerIdxA !== layerIdxB) return layerIdxA - layerIdxB;

            return zIndexA - zIndexB;
        });
    }

    // Utility methods for debugging and development
    getEntityCount(): number {
        return this.requiredComponents.length;
    }

    getRenderableEntityCount(entities: Entity[]): number {
        return this.getEntitiesWithComponents(entities, this.requiredComponents).length;
    }

    // Statistics for performance monitoring
    getStats(): RenderStats {
        return {
            textureCount: this.textures.size,
            rendererType: this.renderer.constructor.name,
        };
    }
}

export interface RenderStats {
    textureCount: number;
    rendererType: string;
}
