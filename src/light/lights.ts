import { Entity } from "@/ecs";
import { LightInstance, LightBounds, createLightComponent, LightComponent } from "./LightComponent";
import { LightingSystem, lightRegistry } from "./LightingSystem";

export class PointLight implements LightInstance {
    id: string = '';
    entity?: Entity;
    position: Vector2D = { x: 0, y: 0 };
    color: Color = { r: 255, g: 255, b: 255, a: 1 };
    intensity: number = 1;
    radius: number = 100;
    enabled: boolean = true;
    castShadows: boolean = true;

    // Propiedades específicas de point light
    attenuation = { constant: 1, linear: 0.09, quadratic: 0.032 };

    init(): void {
        this.id = 'pointlight_' + Math.random().toString(36).substr(2, 9);
        console.log(`💡 PointLight ${this.id} inicializada`);
    }

    update(_dt: number): void {
        // Actualización específica de point light
    }

    render(context: CanvasRenderingContext2D, _camera?: any): void {
        if (!this.enabled) return;

        // Renderizado optimizado para point light
        const gradient = context.createRadialGradient(
            this.position.x, this.position.y, 0,
            this.position.x, this.position.y, this.radius
        );

        const alpha = (this.color.a || 1) * this.intensity;
        gradient.addColorStop(0, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${alpha})`);
        gradient.addColorStop(0.7, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${alpha * 0.3})`);
        gradient.addColorStop(1, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0)`);

        context.save();
        context.globalCompositeOperation = 'lighter';
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        context.fill();
        context.restore();
    }

    getBounds(): LightBounds {
        return {
            x: this.position.x - this.radius,
            y: this.position.y - this.radius,
            width: this.radius * 2,
            height: this.radius * 2
        };
    }
}

export class SpotLight implements LightInstance {
    id: string = '';
    entity?: Entity;
    position: Vector2D = { x: 0, y: 0 };
    color: Color = { r: 255, g: 255, b: 255, a: 1 };
    intensity: number = 1;
    radius: number = 150;
    enabled: boolean = true;
    castShadows: boolean = true;

    // Propiedades específicas de spotlight
    direction: Vector2D = { x: 1, y: 0 };
    angle: number = 45; // Ángulo interior en grados
    outerAngle: number = 60; // Ángulo exterior en grados

    init(): void {
        this.id = 'spotlight_' + Math.random().toString(36).substr(2, 9);
        console.log(`🔦 SpotLight ${this.id} inicializada`);
    }

    update(_dt: number): void {
        // Normalizar dirección
        const length = Math.sqrt(this.direction.x * this.direction.x + this.direction.y * this.direction.y);
        if (length > 0) {
            this.direction.x /= length;
            this.direction.y /= length;
        }
    }

    render(context: CanvasRenderingContext2D, _camera?: any): void {
        if (!this.enabled) return;

        const ctx = context;
        const startAngle = Math.atan2(this.direction.y, this.direction.x) - (this.outerAngle * Math.PI / 180) / 2;
        const endAngle = Math.atan2(this.direction.y, this.direction.x) + (this.outerAngle * Math.PI / 180) / 2;

        // Crear gradiente para spotlight
        const gradient = ctx.createRadialGradient(
            this.position.x, this.position.y, 0,
            this.position.x, this.position.y, this.radius
        );

        const alpha = (this.color.a || 1) * this.intensity;
        gradient.addColorStop(0, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${alpha})`);
        gradient.addColorStop(1, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0)`);

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = gradient;

        // Crear path del cono de luz
        ctx.beginPath();
        ctx.moveTo(this.position.x, this.position.y);
        ctx.arc(this.position.x, this.position.y, this.radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    getBounds(): LightBounds {
        return {
            x: this.position.x - this.radius,
            y: this.position.y - this.radius,
            width: this.radius * 2,
            height: this.radius * 2
        };
    }
}

export class AnimatedLight implements LightInstance {
    id: string = '';
    entity?: Entity;
    position: Vector2D = { x: 0, y: 0 };
    color: Color = { r: 255, g: 255, b: 255, a: 1 };
    intensity: number = 1;
    radius: number = 100;
    enabled: boolean = true;
    castShadows: boolean = true;

    // Propiedades de animación
    baseIntensity: number = 1;
    intensityVariation: number = 0.3;
    animationSpeed: number = 2;
    baseRadius: number = 100;
    radiusVariation: number = 20;

    private time: number = 0;

    init(): void {
        this.id = 'animatedlight_' + Math.random().toString(36).substr(2, 9);
        this.baseIntensity = this.intensity;
        this.baseRadius = this.radius;
    }

    update(dt: number): void {
        this.time += dt * this.animationSpeed;

        // Animación de parpadeo
        this.intensity = this.baseIntensity + Math.sin(this.time) * this.intensityVariation;
        this.radius = this.baseRadius + Math.sin(this.time * 1.5) * this.radiusVariation;

        // Mantener valores válidos
        this.intensity = Math.max(0, this.intensity);
        this.radius = Math.max(10, this.radius);
    }

    render(context: CanvasRenderingContext2D, _camera?: any): void {
        if (!this.enabled) return;

        // Crear efecto de parpadeo con múltiples gradientes
        const innerGradient = context.createRadialGradient(
            this.position.x, this.position.y, 0,
            this.position.x, this.position.y, this.radius * 0.5
        );

        const outerGradient = context.createRadialGradient(
            this.position.x, this.position.y, this.radius * 0.5,
            this.position.x, this.position.y, this.radius
        );

        const alpha = (this.color.a || 1) * this.intensity;

        // Gradiente interior más brillante
        innerGradient.addColorStop(0, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${alpha})`);
        innerGradient.addColorStop(1, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${alpha * 0.7})`);

        // Gradiente exterior más suave
        outerGradient.addColorStop(0, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${alpha * 0.7})`);
        outerGradient.addColorStop(1, `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0)`);

        context.save();
        context.globalCompositeOperation = 'lighter';

        // Renderizar núcleo interior
        context.fillStyle = innerGradient;
        context.beginPath();
        context.arc(this.position.x, this.position.y, this.radius * 0.5, 0, Math.PI * 2);
        context.fill();

        // Renderizar halo exterior
        context.fillStyle = outerGradient;
        context.beginPath();
        context.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        context.fill();

        context.restore();
    }

    getBounds(): LightBounds {
        return {
            x: this.position.x - this.radius,
            y: this.position.y - this.radius,
            width: this.radius * 2,
            height: this.radius * 2
        };
    }
}

// Clase para luces direccionales (como luz del sol)
export class DirectionalLight implements LightInstance {
    id: string = '';
    entity?: Entity;
    position: Vector2D = { x: 0, y: 0 }; // No usado en directional
    color: Color = { r: 255, g: 248, b: 220, a: 1 };
    intensity: number = 0.7;
    radius: number = 0; // No aplicable
    enabled: boolean = true;
    castShadows: boolean = true;

    // Propiedades específicas
    direction: Vector2D = { x: 0, y: 1 }; // Hacia abajo por defecto
    coverage: number = 1; // Cobertura de la pantalla (0-1)

    init(): void {
        this.id = 'directional_' + Math.random().toString(36).substr(2, 9);
    }

    update(_dt: number): void {
        // Normalizar dirección
        const length = Math.sqrt(this.direction.x * this.direction.x + this.direction.y * this.direction.y);
        if (length > 0) {
            this.direction.x /= length;
            this.direction.y /= length;
        }
    }

    render(context: CanvasRenderingContext2D, _camera?: any): void {
        if (!this.enabled) return;

        const canvas = context.canvas;
        const alpha = (this.color.a || 1) * this.intensity * this.coverage;

        context.save();
        context.globalCompositeOperation = 'lighter';
        context.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${alpha})`;
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.restore();
    }

    getBounds(): LightBounds {
        // Cubre toda la pantalla
        return { x: -Infinity, y: -Infinity, width: Infinity, height: Infinity };
    }
}

// ===== UTILIDADES DE ILUMINACIÓN =====

export class LightingUtils {
    /**
     * Calcula la distancia entre dos puntos
     */
    static distance(p1: Vector2D, p2: Vector2D): number {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Interpola entre dos colores
     */
    static lerpColor(color1: Color, color2: Color, factor: number): Color {
        factor = Math.max(0, Math.min(1, factor));

        return {
            r: Math.round(color1.r + (color2.r - color1.r) * factor),
            g: Math.round(color1.g + (color2.g - color1.g) * factor),
            b: Math.round(color1.b + (color2.b - color1.b) * factor),
            a: color1.a !== undefined && color2.a !== undefined ?
                color1.a + (color2.a - color1.a) * factor : 1
        };
    }

    /**
     * Convierte HSV a RGB para crear colores dinámicos
     */
    static hsvToRgb(h: number, s: number, v: number): Color {
        h = ((h % 360) + 360) % 360; // Normalizar hue
        s = Math.max(0, Math.min(1, s));
        v = Math.max(0, Math.min(1, v));

        const c = v * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = v - c;

        let r = 0, g = 0, b = 0;

        if (h < 60) {
            r = c; g = x; b = 0;
        } else if (h < 120) {
            r = x; g = c; b = 0;
        } else if (h < 180) {
            r = 0; g = c; b = x;
        } else if (h < 240) {
            r = 0; g = x; b = c;
        } else if (h < 300) {
            r = x; g = 0; b = c;
        } else {
            r = c; g = 0; b = x;
        }

        return {
            r: Math.round((r + m) * 255),
            g: Math.round((g + m) * 255),
            b: Math.round((b + m) * 255),
            a: 1
        };
    }

    /**
     * Calcula la atenuación de una luz basada en distancia
     */
    static calculateAttenuation(distance: number, constant: number, linear: number, quadratic: number): number {
        return 1.0 / (constant + linear * distance + quadratic * distance * distance);
    }

    /**
     * Verifica si un punto está dentro del rango de una luz
     */
    static isPointInLightRange(point: Vector2D, light: LightInstance): boolean {
        const lightPos = light.position;
        const radius = (light as any).radius || 100;

        return this.distance(point, lightPos) <= radius;
    }

    /**
     * Obtiene todas las luces que afectan a un punto específico
     */
    static getLightsAffectingPoint(point: Vector2D, entities: any[]): LightInstance[] {
        const affectingLights: LightInstance[] = [];

        for (const entity of entities) {
            const lightComp = entity.getComponent?.('light') as LightComponent;
            if (!lightComp) continue;

            const checkLight = (lightInstance: LightInstance) => {
                if (lightInstance && lightInstance.enabled && this.isPointInLightRange(point, lightInstance)) {
                    affectingLights.push(lightInstance);
                }
            };

            // Verificar luz única
            if (lightComp.instance) {
                checkLight(lightComp.instance);
            }

            // Verificar múltiples luces
            if (Array.isArray(lightComp.lights)) {
                for (const entry of lightComp.lights) {
                    if (entry.instance) {
                        checkLight(entry.instance);
                    }
                }
            }
        }

        return affectingLights;
    }

    /**
     * Calcula la iluminación total en un punto específico
     */
    static calculateLightingAtPoint(point: Vector2D, entities: any[], ambientLight: Color): Color {
        const lights = this.getLightsAffectingPoint(point, entities);

        let totalR = ambientLight.r;
        let totalG = ambientLight.g;
        let totalB = ambientLight.b;

        for (const light of lights) {
            const distance = this.distance(point, light.position);
            const radius = (light as any).radius || 100;

            if (distance <= radius) {
                const attenuation = 1 - (distance / radius);
                const contribution = attenuation * light.intensity;

                totalR += light.color.r * contribution;
                totalG += light.color.g * contribution;
                totalB += light.color.b * contribution;
            }
        }

        return {
            r: Math.min(255, totalR),
            g: Math.min(255, totalG),
            b: Math.min(255, totalB),
            a: 1
        };
    }
}

// ===== MANAGER DE EFECTOS ESPECIALES =====

export class LightingEffects {
    private effects: Map<string, any> = new Map();

    /**
     * Agrega un efecto de parpadeo a una luz
     */
    addFlickerEffect(lightInstance: LightInstance, options: {
        intensity?: number;
        speed?: number;
        randomness?: number;
    } = {}): void {
        const effect = {
            type: 'flicker',
            baseIntensity: lightInstance.intensity,
            intensity: options.intensity || 0.3,
            speed: options.speed || 5,
            randomness: options.randomness || 0.5,
            time: 0,
            phase: Math.random() * Math.PI * 2
        };

        this.effects.set(lightInstance.id, effect);
    }

    /**
     * Agrega efecto de respiración (fade in/out suave)
     */
    addBreathingEffect(lightInstance: LightInstance, options: {
        minIntensity?: number;
        maxIntensity?: number;
        speed?: number;
    } = {}): void {
        const effect = {
            type: 'breathing',
            minIntensity: options.minIntensity || 0.3,
            maxIntensity: options.maxIntensity || 1.0,
            speed: options.speed || 1,
            time: 0
        };

        this.effects.set(lightInstance.id, effect);
    }

    /**
     * Actualiza todos los efectos activos
     */
    updateEffects(entities: any[], dt: number): void {
        for (const entity of entities) {
            const lightComp = entity.getComponent('light') as LightComponent;
            if (!lightComp) continue;

            const updateLightEffects = (lightInstance: LightInstance) => {
                if (!lightInstance) return;

                const effect = this.effects.get(lightInstance.id);
                if (!effect) return;

                effect.time += dt;

                switch (effect.type) {
                    case 'flicker':
                        this.updateFlickerEffect(lightInstance, effect, dt);
                        break;
                    case 'breathing':
                        this.updateBreathingEffect(lightInstance, effect);
                        break;
                }
            };

            // Actualizar luz única
            if (lightComp.instance) {
                updateLightEffects(lightComp.instance);
            }

            // Actualizar múltiples luces
            if (Array.isArray(lightComp.lights)) {
                for (const entry of lightComp.lights) {
                    if (entry.instance) {
                        updateLightEffects(entry.instance);
                    }
                }
            }
        }
    }

    private updateFlickerEffect(light: LightInstance, effect: any, _dt: number): void {
        const noise = (Math.random() - 0.5) * effect.randomness;
        const wave = Math.sin(effect.time * effect.speed + effect.phase);
        const flicker = wave + noise;

        light.intensity = effect.baseIntensity + (flicker * effect.intensity);
        light.intensity = Math.max(0, light.intensity);
    }

    private updateBreathingEffect(light: LightInstance, effect: any): void {
        const wave = Math.sin(effect.time * effect.speed);
        const normalizedWave = (wave + 1) / 2; // Normalizar a 0-1

        light.intensity = effect.minIntensity + (effect.maxIntensity - effect.minIntensity) * normalizedWave;
    }

    /**
     * Remueve un efecto de una luz
     */
    removeEffect(lightInstance: LightInstance): void {
        this.effects.delete(lightInstance.id);
    }

    /**
     * Limpia todos los efectos
     */
    clearAllEffects(): void {
        this.effects.clear();
    }
}

// ===== EJEMPLO COMPLETO DE INTEGRACIÓN =====

export class GameLightingManager {
    private lightingSystem: LightingSystem;
    private lightingEffects: LightingEffects;
    private isEnabled: boolean = true;

    constructor() {
        this.lightingSystem = new LightingSystem(lightRegistry);
        this.lightingEffects = new LightingEffects();

        this.setupDefaultConfiguration();
    }

    private setupDefaultConfiguration(): void {
        // Configuración por defecto
        this.lightingSystem.setAmbientLight({ r: 25, g: 30, b: 40, a: 0.9 });
        this.lightingSystem.setShadowsEnabled(true);
        this.lightingSystem.setBlendMode('multiply');
    }

    /**
     * Actualiza el sistema completo de iluminación
     */
    update(entities: Entity[], dt: number): void {
        if (!this.isEnabled) return;

        this.lightingSystem.update(entities, dt);
        this.lightingEffects.updateEffects(entities, dt);
    }

    /**
     * Renderiza la iluminación
     */
    render(context: CanvasRenderingContext2D, entities: Entity[], camera?: any): void {
        if (!this.isEnabled) return;

        this.lightingSystem.render(context, entities, camera);
    }

    /**
     * Crea una luz con efecto específico
     */
    createLightWithEffect(entity: Entity, lightType: string, effectType?: 'flicker' | 'breathing', effectOptions?: any): LightComponent {
        const lightComponent = createLightComponent(lightType);

        // Agregar componente a la entidad
        entity.addComponent?.(lightComponent);

        // Si se especifica un efecto, configurarlo después de la primera actualización
        if (effectType && effectOptions) {
            setTimeout(() => {
                if (lightComponent.instance) {
                    switch (effectType) {
                        case 'flicker':
                            this.lightingEffects.addFlickerEffect(lightComponent.instance, effectOptions);
                            break;
                        case 'breathing':
                            this.lightingEffects.addBreathingEffect(lightComponent.instance, effectOptions);
                            break;
                    }
                }
            }, 100);
        }

        return lightComponent;
    }

    /**
     * Configuración de diferentes ambientes
     */
    setEnvironmentPreset(preset: 'day' | 'night' | 'dusk' | 'dawn' | 'indoor'): void {
        switch (preset) {
            case 'day':
                this.lightingSystem.setAmbientLight({ r: 200, g: 220, b: 255, a: 0.9 });
                break;
            case 'night':
                this.lightingSystem.setAmbientLight({ r: 10, g: 15, b: 30, a: 0.95 });
                break;
            case 'dusk':
                this.lightingSystem.setAmbientLight({ r: 100, g: 60, b: 80, a: 0.85 });
                break;
            case 'dawn':
                this.lightingSystem.setAmbientLight({ r: 150, g: 120, b: 100, a: 0.8 });
                break;
            case 'indoor':
                this.lightingSystem.setAmbientLight({ r: 40, g: 35, b: 30, a: 0.7 });
                break;
        }
    }

    // Getters y setters
    setEnabled(enabled: boolean): void {
        this.isEnabled = enabled;
    }

    isLightingEnabled(): boolean {
        return this.isEnabled;
    }

    getLightingSystem(): LightingSystem {
        return this.lightingSystem;
    }

    getLightingEffects(): LightingEffects {
        return this.lightingEffects;
    }
}


lightRegistry.register('AnimatedLight', AnimatedLight, {
    description: 'Luz con animación de parpadeo y variación de tamaño',
    category: 'effect'
});

lightRegistry.register('DirectionalLight', DirectionalLight, {
    description: 'Luz direccional que cubre toda la escena (como luz solar)',
    category: 'advanced'
});

lightRegistry.register('PointLight', PointLight, {
    description: 'Luz puntual que irradia en todas las direcciones',
    category: 'basic'
});

lightRegistry.register('SpotLight', SpotLight, {
    description: 'Luz direccional en forma de cono',
    category: 'basic'
});