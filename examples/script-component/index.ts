import { GameEngine } from '../../src';
import { Scene } from '../../src/core/Scene';
import { Entity } from '../../src/ecs/Entity';
import { scriptRegistry } from '../../src/ecs/ScriptRegistry';
import { ScriptInstance } from '../../src/ecs/ScriptComponent';

class PlayerController implements ScriptInstance {
    entity: Entity;
    speed = 120;
    vx = 0;
    vy = 0;
    init() {
        // ensure transform exists
        if (!this.entity.getComponent('transform')) {
            this.entity.addComponent({ type: 'transform', position: { x: 320, y: 240 }, rotation: 0, scale: { x: 1, y: 1 } });
        }
        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
    }

    onKeyDown = (e: KeyboardEvent) => {
        switch (e.code) {
            case 'ArrowLeft': this.vx = -1; break;
            case 'ArrowRight': this.vx = 1; break;
            case 'ArrowUp': this.vy = -1; break;
            case 'ArrowDown': this.vy = 1; break;
        }
    }

    onKeyUp = (e: KeyboardEvent) => {
        switch (e.code) {
            case 'ArrowLeft': if (this.vx < 0) this.vx = 0; break;
            case 'ArrowRight': if (this.vx > 0) this.vx = 0; break;
            case 'ArrowUp': if (this.vy < 0) this.vy = 0; break;
            case 'ArrowDown': if (this.vy > 0) this.vy = 0; break;
        }
    }

    update(dt: number) {
        const t = this.entity.getComponent('transform');
        if (!t) return;
        t.position.x += this.vx * this.speed * dt;
        t.position.y += this.vy * this.speed * dt;
    }

    destroy() {
        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('keyup', this.onKeyUp);
    }
}

scriptRegistry.register('PlayerController', PlayerController as any);

window.addEventListener('load', async () => {
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    const engine = new GameEngine({ canvas, width: 640, height: 480, renderer: 'canvas2d' });

    const scene = new Scene('script-example');
    engine.addScene(scene);

    await engine.initialize();

    // Create entity and attach script by name (serializable)
    const player = new Entity('player');
    player.addComponent({ type: 'sprite', texture: 'player', width: 32, height: 32 });
    player.addComponent({ type: 'transform', position: { x: 320, y: 240 }, rotation: 0, scale: { x: 1, y: 1 } });
    // Use the modern scripts array to allow multiple scripts per entity
    player.addComponent({ type: 'script', scripts: [{ scriptName: 'PlayerController' }] } as any);
    scene.addEntity(player);

    // Register a quick placeholder texture so we can see something
    const renderSystems = engine.getGameLoop().getSystems().filter(s => (s as any).constructor?.name === 'RenderSystem') as any[];
    const rs = renderSystems[0];
    const canvasImg = document.createElement('canvas');
    canvasImg.width = 32; canvasImg.height = 32; const ctx = canvasImg.getContext('2d')!; ctx.fillStyle = '#39d353'; ctx.fillRect(0, 0, 32, 32);
    rs.registerTexture('player', { width: 32, height: 32, getImage: () => canvasImg } as any);

    scene.getEntities().forEach(e => { /* ensure scene has entities */ });

    engine.setActiveScene(scene);
    engine.start();

    // --- Save / Load helper UI (example wiring) ---
    const wrap = document.createElement('div');
    wrap.style.position = 'absolute';
    wrap.style.right = '8px';
    wrap.style.top = '8px';
    wrap.style.display = 'flex';
    wrap.style.flexDirection = 'column';
    wrap.style.gap = '6px';

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save Scene';
    const loadBtn = document.createElement('button');
    loadBtn.textContent = 'Load Scene';

    wrap.appendChild(saveBtn);
    wrap.appendChild(loadBtn);
    document.body.appendChild(wrap);

    const serializeScene = (s: any) => {
        const out: any = { entities: [] };
        for (const e of s.getEntities()) {
            const ent: any = { id: e.id, components: [] };
            for (const c of e.getAllComponents()) {
                // shallow copy component but keep script serialization shape
                if (c.type === 'script') {
                    const sw: any = {};
                    if (c.scriptName) {
                        sw.scriptName = c.scriptName;
                        if (c.instance && c.instance.getAllProperties) sw.state = c.instance.getAllProperties();
                        else if (c.state) sw.state = c.state;
                    }
                    if (Array.isArray(c.scripts)) {
                        sw.scripts = c.scripts.map((se: any) => ({ scriptName: se.scriptName, state: se.instance?.getAllProperties ? se.instance.getAllProperties() : se.state }));
                    }
                    ent.components.push(sw);
                } else {
                    ent.components.push(JSON.parse(JSON.stringify(c)));
                }
            }
            out.entities.push(ent);
        }
        return out;
    };

    const deserializeScene = (s: any, data: any) => {
        // clear existing entities
        for (const e of [...s.getEntities()]) {
            s.removeEntity(e.id);
        }

        for (const ent of data.entities) {
            const ne = new (window as any).Entity(ent.id);
            for (const c of ent.components) {
                if (c.type === 'script' || c.scriptName || c.scripts) {
                    // ensure saved shape is normalized
                    const sc: any = { type: 'script' };
                    if (c.scriptName) sc.scripts = [{ scriptName: c.scriptName, state: c.state }];
                    if (Array.isArray(c.scripts)) sc.scripts = c.scripts.map((x: any) => ({ scriptName: x.scriptName, state: x.state }));
                    ne.addComponent(sc);
                } else {
                    ne.addComponent(c);
                }
            }
            s.addEntity(ne);
        }
    };

    saveBtn.onclick = () => {
        const json = serializeScene(scene);
        const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'scene.json'; a.click();
        URL.revokeObjectURL(url);
    };

    loadBtn.onclick = async () => {
        // Simple file prompt
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = () => {
            const file = input.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    const parsed = JSON.parse(String(reader.result));
                    deserializeScene(scene, parsed);
                } catch (err) {
                    console.error('Failed to parse scene file', err);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    // --- Inspector UI: show entities and script properties from registry metadata ---
    const inspector = document.createElement('div');
    inspector.style.position = 'absolute';
    inspector.style.left = '8px';
    inspector.style.top = '8px';
    inspector.style.width = '260px';
    inspector.style.maxHeight = '80vh';
    inspector.style.overflow = 'auto';
    inspector.style.background = 'rgba(0,0,0,0.6)';
    inspector.style.color = '#fff';
    inspector.style.padding = '8px';
    inspector.style.fontFamily = 'system-ui, Arial';
    inspector.style.fontSize = '13px';
    inspector.style.borderRadius = '6px';

    const title = document.createElement('div');
    title.textContent = 'Inspector';
    title.style.fontWeight = '600';
    title.style.marginBottom = '6px';
    inspector.appendChild(title);

    const entitySelect = document.createElement('select');
    entitySelect.style.width = '100%';
    inspector.appendChild(entitySelect);

    const scriptsContainer = document.createElement('div');
    scriptsContainer.style.marginTop = '8px';
    inspector.appendChild(scriptsContainer);

    document.body.appendChild(inspector);

    const refreshEntityList = () => {
        const ents = scene.getEntities();
        entitySelect.innerHTML = '';
        for (const e of ents) {
            const o = document.createElement('option');
            o.value = e.id;
            o.textContent = `${e.id}`;
            entitySelect.appendChild(o);
        }
    };

    const parseValueForType = (raw: string, type: string) => {
        try {
            if (type === 'number') return Number(raw);
            if (type === 'boolean') return raw === 'true' || raw === '1';
            if (type === 'vector' || type === 'color' || type === 'object' || type === 'array') return JSON.parse(raw);
            return raw;
        } catch (_) {
            return raw;
        }
    };

    const renderInspectorForEntity = (entityId: string) => {
        scriptsContainer.innerHTML = '';
        const ent = scene.getEntity(entityId);
        if (!ent) return;
        const sc = ent.getComponent('script') as any;
        if (!sc) {
            scriptsContainer.textContent = 'No script component on entity';
            return;
        }

        const entries = Array.isArray(sc.scripts) ? sc.scripts : (sc.scriptName ? [{ scriptName: sc.scriptName, state: sc.state, instance: sc.instance }] : []);

        entries.forEach((entry: any, idx: number) => {
            const box = document.createElement('div');
            box.style.borderTop = '1px solid rgba(255,255,255,0.08)';
            box.style.paddingTop = '8px';
            box.style.marginTop = '8px';

            const hdr = document.createElement('div');
            hdr.textContent = `Script: ${entry.scriptName || '<unknown>'}`;
            hdr.style.fontWeight = '600';
            box.appendChild(hdr);

            const props = scriptRegistry.getScriptProperties(entry.scriptName);
            if (!props || props.length === 0) {
                const p = document.createElement('div');
                p.textContent = 'No serialized properties detected';
                p.style.opacity = '0.8';
                box.appendChild(p);
            } else {
                props.forEach((prop) => {
                    const row = document.createElement('div');
                    row.style.display = 'flex';
                    row.style.flexDirection = 'column';
                    row.style.marginTop = '6px';

                    const label = document.createElement('label');
                    label.textContent = `${prop.name} (${prop.type})`;
                    label.style.fontSize = '12px';
                    label.style.opacity = '0.9';
                    row.appendChild(label);

                    const valueInput = document.createElement('input');
                    valueInput.style.width = '100%';
                    valueInput.style.padding = '4px';
                    valueInput.style.borderRadius = '4px';
                    valueInput.style.border = '1px solid rgba(0,0,0,0.2)';

                    // fill current value from instance if present, otherwise from state
                    let currentVal: any = undefined;
                    if (entry.instance && entry.instance.getProperty) {
                        try { currentVal = entry.instance.getProperty(prop.name); } catch (_) { }
                    }
                    if (currentVal === undefined) {
                        currentVal = (entry.state && entry.state[prop.name] !== undefined) ? entry.state[prop.name] : prop.initialValue;
                    }

                    // string/number/boolean use simple inputs; complex types use JSON textarea
                    if (prop.type === 'number' || typeof currentVal === 'number') {
                        valueInput.type = 'number';
                        valueInput.value = String(currentVal ?? '0');
                    } else if (prop.type === 'boolean' || typeof currentVal === 'boolean') {
                        valueInput.type = 'text';
                        valueInput.value = String(currentVal ?? 'false');
                    } else if (prop.type === 'vector' || prop.type === 'color' || prop.type === 'array' || typeof currentVal === 'object') {
                        // use JSON editor in an input for compactness
                        valueInput.type = 'text';
                        try { valueInput.value = JSON.stringify(currentVal); } catch { valueInput.value = String(currentVal); }
                    } else {
                        valueInput.type = 'text';
                        valueInput.value = String(currentVal ?? '');
                    }

                    const applyBtn = document.createElement('button');
                    applyBtn.textContent = 'Apply';
                    applyBtn.style.marginTop = '6px';

                    applyBtn.onclick = () => {
                        const raw = valueInput.value;
                        const parsed = parseValueForType(raw, prop.type);

                        // write to runtime instance if present
                        if (entry.instance) {
                            try {
                                if (entry.instance.setProperty) {
                                    entry.instance.setProperty(prop.name, parsed);
                                } else if (entry.instance.setAllProperties) {
                                    const s = entry.instance.getAllProperties ? entry.instance.getAllProperties() : {};
                                    s[prop.name] = parsed;
                                    entry.instance.setAllProperties(s);
                                } else {
                                    entry.instance[prop.name] = parsed;
                                }
                            } catch (err) {
                                console.error('Failed to set property on instance', err);
                            }
                        }

                        // also persist to component state so serialized scene keeps it
                        if (!entry.state) entry.state = {};
                        entry.state[prop.name] = parsed;
                    };

                    row.appendChild(valueInput);
                    row.appendChild(applyBtn);
                    box.appendChild(row);
                });
            }

            scriptsContainer.appendChild(box);
        });
    };

    entitySelect.onchange = () => renderInspectorForEntity(entitySelect.value);

    // initial population
    refreshEntityList();
    if (entitySelect.options.length > 0) entitySelect.selectedIndex = 0;
    renderInspectorForEntity(entitySelect.value);

    // refresh entity list occasionally (in case example adds/removes entities at runtime)
    setInterval(() => {
        refreshEntityList();
        // keep inspector in sync with runtime instance state
        if (entitySelect.value) renderInspectorForEntity(entitySelect.value);
    }, 800);
});
