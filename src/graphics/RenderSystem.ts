import { System } from '../ecs/System';
import { Entity } from '../ecs/Entity';
import { SpriteComponent } from './Sprite';
import { RenderStrategy } from './Renderer';
import { Texture } from './Texture';
import { Vector2 } from '../math/Vector2';
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

        // Get all renderable entities
        const renderableEntities = this.getEntitiesWithComponents(
            entities,
            this.requiredComponents
        );

        // Sort entities by z-index if available (for rendering order)
        const sortedEntities = this.sortEntitiesByZIndex(renderableEntities);

        // Render each entity
        sortedEntities.forEach((entity) => {
            this.renderEntity(entity);
        });

        // Present the rendered frame
        this.renderer.present();
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
        return entities.sort((a, b) => {
            const spriteA = a.getComponent<SpriteComponent>('sprite');
            const spriteB = b.getComponent<SpriteComponent>('sprite');

            const zIndexA = (spriteA as any)?.zIndex || 0;
            const zIndexB = (spriteB as any)?.zIndex || 0;

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
