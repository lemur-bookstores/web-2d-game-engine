import { Entity } from "@/ecs";
import { LightComponent, LightEntry, LightInstance } from "./LightComponent";
import { LightRegistry } from "./LightRegistry";

export class LightingSystem {
    private lightRegistry: LightRegistry;
    private ambientLight: Color = { r: 30, g: 30, b: 40, a: 1 };
    private shadowsEnabled: boolean = true;
    private bloomEnabled: boolean = false;

    // Canvas para efectos de iluminación
    private lightingCanvas?: HTMLCanvasElement;
    private lightingContext?: CanvasRenderingContext2D | null;

    // Configuración de rendering
    private blendMode: GlobalCompositeOperation = 'multiply';

    constructor(lightRegistry: LightRegistry) {
        this.lightRegistry = lightRegistry;
        this.initializeLightingCanvas();
    }

    /**
     * Inicializa el canvas para efectos de iluminación
     */
    private initializeLightingCanvas(): void {
        this.lightingCanvas = document.createElement('canvas');
        this.lightingContext = this.lightingCanvas.getContext('2d');

        if (this.lightingContext) {
            // Configurar propiedades para mejor rendimiento
            this.lightingContext.imageSmoothingEnabled = true;
        }
    }

    /**
     * Actualiza el sistema de iluminación
     */
    update(entities: Entity[], dt: number): void {
        for (const entity of entities) {
            const lightComponent = entity.getComponent<LightComponent>('light');
            if (!lightComponent) continue;

            this.updateLightComponent(lightComponent, entity, dt);
        }
    }

    /**
     * Actualiza un componente de luz específico
     */
    private updateLightComponent(lightComponent: LightComponent, entity: Entity, dt: number): void {
        const handleLightEntry = (entry: LightEntry) => {
            if (!entry) return;

            // Crear instancia si no existe
            if (!entry.instance && entry.lightType) {
                const lightInstance = this.lightRegistry.create(entry.lightType);
                if (lightInstance) {
                    lightInstance.entity = entity;

                    // Restaurar estado si existe
                    if (entry.state && lightInstance.setAllProperties) {
                        lightInstance.setAllProperties(entry.state);
                    }

                    entry.instance = lightInstance;
                    lightInstance.init?.();
                }
            }

            // Actualizar instancia
            if (entry.instance) {
                // Sincronizar posición con entidad si tiene transform
                const transform = entity.getComponent?.('transform');
                if (transform && transform.position) {
                    entry.instance.position = {
                        x: transform.position.x,
                        y: transform.position.y
                    };
                }

                entry.instance.update?.(dt);
            }
        };

        // Manejar luz única (legacy)
        if (lightComponent.lightType || lightComponent.instance) {
            handleLightEntry(lightComponent);
        }

        // Manejar múltiples luces
        if (Array.isArray(lightComponent.lights)) {
            for (const lightEntry of lightComponent.lights) {
                handleLightEntry(lightEntry);
            }
        }
    }

    /**
     * Renderiza la iluminación
     */
    render(context: CanvasRenderingContext2D, entities: any[], camera?: any): void {
        if (!this.lightingCanvas || !this.lightingContext) return;

        const { width, height } = context.canvas;

        // Ajustar tamaño del canvas de iluminación
        if (this.lightingCanvas.width !== width || this.lightingCanvas.height !== height) {
            this.lightingCanvas.width = width;
            this.lightingCanvas.height = height;
        }

        // Limpiar canvas de iluminación
        this.lightingContext.clearRect(0, 0, width, height);

        // Aplicar luz ambiente
        this.renderAmbientLight();

        // Renderizar todas las luces
        this.renderLights(entities, camera);

        // Aplicar efectos post-processing si están habilitados
        if (this.bloomEnabled) {
            this.applyBloom();
        }

        // Componer iluminación en el contexto principal
        context.save();
        context.globalCompositeOperation = this.blendMode;
        context.drawImage(this.lightingCanvas, 0, 0);
        context.restore();
    }

    /**
     * Renderiza la luz ambiente
     */
    private renderAmbientLight(): void {
        if (!this.lightingContext || !this.lightingCanvas) return;

        const { r, g, b, a } = this.ambientLight;
        this.lightingContext.fillStyle = `rgba(${r}, ${g}, ${b}, ${a || 1})`;
        this.lightingContext.fillRect(0, 0, this.lightingCanvas.width, this.lightingCanvas.height);
    }

    /**
     * Renderiza todas las luces activas
     */
    private renderLights(entities: any[], camera?: any): void {
        if (!this.lightingContext) return;

        for (const entity of entities) {
            const lightComponent = entity.getComponent('light') as LightComponent;
            if (!lightComponent) continue;

            this.renderEntityLights(lightComponent, camera);
        }
    }

    /**
     * Renderiza las luces de una entidad específica
     */
    private renderEntityLights(lightComponent: LightComponent, camera?: any): void {
        const renderLightEntry = (entry: any) => {
            if (!entry?.instance || !entry.instance.enabled) return;

            // Usar método de renderizado personalizado si existe
            if (entry.instance.render) {
                entry.instance.render(this.lightingContext!, camera);
            } else {
                // Renderizado por defecto
                this.renderDefaultLight(entry.instance);
            }
        };

        // Renderizar luz única
        if (lightComponent.instance) {
            renderLightEntry(lightComponent);
        }

        // Renderizar múltiples luces
        if (Array.isArray(lightComponent.lights)) {
            for (const lightEntry of lightComponent.lights) {
                renderLightEntry(lightEntry);
            }
        }
    }

    /**
     * Renderizado por defecto de una luz
     */
    private renderDefaultLight(light: LightInstance): void {
        if (!this.lightingContext) return;

        const ctx = this.lightingContext;
        const { position, color, intensity, radius } = light as any;

        if (!position || !color || typeof intensity !== 'number') return;

        // Crear gradiente radial
        const gradient = ctx.createRadialGradient(
            position.x, position.y, 0,
            position.x, position.y, radius || 100
        );

        const alpha = (color.a || 1) * intensity;
        gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`);
        gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);

        // Renderizar luz
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(position.x, position.y, radius || 100, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    /**
     * Aplica efecto bloom
     */
    private applyBloom(): void {
        if (!this.lightingContext || !this.lightingCanvas) return;

        // Implementación básica de bloom
        const imageData = this.lightingContext.getImageData(0, 0, this.lightingCanvas.width, this.lightingCanvas.height);
        const data = imageData.data;

        // Aplicar filtro de blur (simplificado)
        for (let i = 0; i < data.length; i += 4) {
            const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
            if (brightness > 128) {
                data[i] = Math.min(255, data[i] * 1.2);     // R
                data[i + 1] = Math.min(255, data[i + 1] * 1.2); // G
                data[i + 2] = Math.min(255, data[i + 2] * 1.2); // B
            }
        }

        this.lightingContext.putImageData(imageData, 0, 0);
    }

    /**
     * Limpia recursos de luces destruidas
     */
    cleanup(entities: Entity[]): void {
        for (const entity of entities) {
            const lightComponent = entity.getComponent<LightComponent>('light');
            if (!lightComponent) continue;

            const cleanupEntry = (entry: LightEntry) => {
                if (!entry?.instance) return;

                try {
                    // Guardar estado antes de destruir
                    if (entry.instance.getAllProperties) {
                        entry.state = entry.instance.getAllProperties();
                    }

                    entry.instance.destroy?.();
                    this.lightRegistry.cleanupLightInstance(entry.instance);
                } catch (err) {
                    console.error('Error limpiando luz:', err);
                }

                entry.instance = undefined;
            };

            if (lightComponent.instance) {
                cleanupEntry(lightComponent);
            }

            if (Array.isArray(lightComponent.lights)) {
                for (const lightEntry of lightComponent.lights) {
                    cleanupEntry(lightEntry);
                }
            }
        }
    }

    // Métodos de configuración
    setAmbientLight(color: Color): void {
        this.ambientLight = { ...color };
    }

    setShadowsEnabled(enabled: boolean): void {
        this.shadowsEnabled = enabled;
    }

    setBloomEnabled(enabled: boolean): void {
        this.bloomEnabled = enabled;
    }

    setBlendMode(mode: GlobalCompositeOperation): void {
        this.blendMode = mode;
    }
}

// ===== INSTANCIAS GLOBALES =====
export const lightRegistry = new LightRegistry();