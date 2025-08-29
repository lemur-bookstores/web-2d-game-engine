import { describe, it, expect, beforeEach } from 'vitest';
import { Scene } from '../../src/core/Scene';
import { LightingSystem, lightRegistry } from '../../src/light/LightingSystem';
// Ensure built-in light types (PointLight, SpotLight, etc.) are registered
import '../../src/light/lights';

describe('LightInstance normalization with Scene resolver', () => {
    let scene: Scene;
    let lighting: LightingSystem;

    beforeEach(() => {
        scene = new Scene('test-scene');
        scene.addLayer('enemy', 0x0004, undefined, true, 1);

        lighting = new LightingSystem(lightRegistry);
        lighting.setScene(scene as any);
    });

    it('should resolve layer name to layerMask on instance.setProperty', () => {
        const inst = lightRegistry.create('PointLight') as any;
        expect(inst).toBeTruthy();

        // Apply layer by name
        inst.setProperty('layer', 'enemy');

        // After normalization, proxy should provide layerMask
        const mask = inst.getProperty('layerMask');
        expect(mask).toBe(0x0004);
    });
});
