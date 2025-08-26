import { RenderStrategy } from './Renderer';
import { Texture } from './Texture';
import { Vector2 } from '../math/Vector2';
import { Color } from '../math/Color';

export class WebGLRenderer implements RenderStrategy {
    private gl!: WebGLRenderingContext;
    private shaderProgram!: WebGLProgram;
    private vertexBuffer!: WebGLBuffer;
    private indexBuffer!: WebGLBuffer;
    private textures = new Map<string, WebGLTexture>();

    // Shader sources
    private static readonly VERTEX_SHADER_SOURCE = `
        attribute vec2 a_position;
        attribute vec2 a_texCoord;

        uniform mat3 u_transform;
        uniform mat3 u_projection;

        varying vec2 v_texCoord;

        void main() {
            vec3 position = u_projection * u_transform * vec3(a_position, 1.0);
            gl_Position = vec4(position.xy, 0.0, 1.0);
            v_texCoord = a_texCoord;
        }
    `;

    private static readonly FRAGMENT_SHADER_SOURCE = `
        precision mediump float;

        varying vec2 v_texCoord;
        uniform sampler2D u_texture;
        uniform vec4 u_tint;

        void main() {
            vec4 texColor = texture2D(u_texture, v_texCoord);
            gl_FragColor = texColor * u_tint;
        }
    `;

    initialize(canvas: HTMLCanvasElement): void {
        this.gl = canvas.getContext('webgl')!;
        if (!this.gl) {
            throw new Error('WebGL not supported');
        }

        // Enable blending for transparency if supported by the context (tests may provide a minimal/mock context)
        if (typeof (this.gl as any).enable === 'function') {
            this.gl.enable((this.gl as any).BLEND);
        }
        if (typeof (this.gl as any).blendFunc === 'function') {
            this.gl.blendFunc((this.gl as any).SRC_ALPHA, (this.gl as any).ONE_MINUS_SRC_ALPHA);
        }

        this.initializeShaders();
        this.initializeBuffers();
        this.setupProjectionMatrix(canvas.width, canvas.height);
    }

    clear(): void {
        this.gl.clearColor(0, 0, 0, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }

    drawSprite(
        texture: Texture,
        position: Vector2,
        size: Vector2,
        rotation: number = 0,
        tint: Color = new Color(255, 255, 255, 255)
    ): void {
        if (!this.shaderProgram) return;

        this.gl.useProgram(this.shaderProgram);

        // Bind texture
        const webglTexture = this.getOrCreateTexture(texture);
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, webglTexture);

        const textureLocation = this.gl.getUniformLocation(this.shaderProgram, 'u_texture');
        this.gl.uniform1i(textureLocation, 0);

        // Set tint
        const tintLocation = this.gl.getUniformLocation(this.shaderProgram, 'u_tint');
        this.gl.uniform4f(tintLocation, tint.r / 255, tint.g / 255, tint.b / 255, tint.a / 255);

        // Create transform matrix
        const transform = this.createTransformMatrix(position, size, rotation);
        const transformLocation = this.gl.getUniformLocation(this.shaderProgram, 'u_transform');
        this.gl.uniformMatrix3fv(transformLocation, false, transform);

        // Bind buffers and draw
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

        const positionLocation = this.gl.getAttribLocation(this.shaderProgram, 'a_position');
        const texCoordLocation = this.gl.getAttribLocation(this.shaderProgram, 'a_texCoord');

        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.enableVertexAttribArray(texCoordLocation);

        // Position attribute (2 floats)
        this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 16, 0);
        // Texture coordinate attribute (2 floats)
        this.gl.vertexAttribPointer(texCoordLocation, 2, this.gl.FLOAT, false, 16, 8);

        this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
    }

    present(): void {
        // WebGL presents automatically
    }

    destroy(): void {
        if (this.gl && this.shaderProgram) {
            this.gl.deleteProgram(this.shaderProgram);
        }

        // Clean up textures
        this.textures.forEach((texture) => {
            this.gl.deleteTexture(texture);
        });
        this.textures.clear();

        if (this.vertexBuffer) {
            this.gl.deleteBuffer(this.vertexBuffer);
        }
        if (this.indexBuffer) {
            this.gl.deleteBuffer(this.indexBuffer);
        }
    }

    private initializeShaders(): void {
        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, WebGLRenderer.VERTEX_SHADER_SOURCE);
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, WebGLRenderer.FRAGMENT_SHADER_SOURCE);

        if (!vertexShader || !fragmentShader) {
            throw new Error('Failed to create shaders');
        }

        this.shaderProgram = this.gl.createProgram()!;
        this.gl.attachShader(this.shaderProgram, vertexShader);
        this.gl.attachShader(this.shaderProgram, fragmentShader);
        this.gl.linkProgram(this.shaderProgram);

        if (!this.gl.getProgramParameter(this.shaderProgram, this.gl.LINK_STATUS)) {
            const info = this.gl.getProgramInfoLog(this.shaderProgram);
            throw new Error('Failed to link shader program: ' + info);
        }
    }

    private createShader(type: number, source: string): WebGLShader | null {
        const shader = this.gl.createShader(type)!;
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            const info = this.gl.getShaderInfoLog(shader);
            this.gl.deleteShader(shader);
            throw new Error('Failed to compile shader: ' + info);
        }

        return shader;
    }

    private initializeBuffers(): void {
        // Vertex data: position (x, y) and texture coordinates (u, v)
        const vertices = new Float32Array([
            -0.5, -0.5, 0.0, 1.0,  // Bottom-left
            0.5, -0.5, 1.0, 1.0,  // Bottom-right
            0.5, 0.5, 1.0, 0.0,  // Top-right
            -0.5, 0.5, 0.0, 0.0   // Top-left
        ]);

        const indices = new Uint16Array([
            0, 1, 2,  // First triangle
            2, 3, 0   // Second triangle
        ]);

        this.vertexBuffer = this.gl.createBuffer()!;
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);

        this.indexBuffer = this.gl.createBuffer()!;
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, indices, this.gl.STATIC_DRAW);
    }

    private setupProjectionMatrix(width: number, height: number): void {
        // Orthographic projection matrix
        const projection = new Float32Array([
            2 / width, 0, 0,
            0, -2 / height, 0,
            -1, 1, 1
        ]);

        this.gl.useProgram(this.shaderProgram);
        const projectionLocation = this.gl.getUniformLocation(this.shaderProgram, 'u_projection');
        this.gl.uniformMatrix3fv(projectionLocation, false, projection);
    }

    private createTransformMatrix(position: Vector2, size: Vector2, rotation: number): Float32Array {
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);

        return new Float32Array([
            cos * size.x, sin * size.x, 0,
            -sin * size.y, cos * size.y, 0,
            position.x, position.y, 1
        ]);
    }

    private getOrCreateTexture(texture: Texture): WebGLTexture {
        const textureKey = texture.getImage().src;

        if (this.textures.has(textureKey)) {
            return this.textures.get(textureKey)!;
        }

        const webglTexture = this.gl.createTexture()!;
        this.gl.bindTexture(this.gl.TEXTURE_2D, webglTexture);

        this.gl.texImage2D(
            this.gl.TEXTURE_2D,
            0,
            this.gl.RGBA,
            this.gl.RGBA,
            this.gl.UNSIGNED_BYTE,
            texture.getImage()
        );

        // Set texture parameters
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

        this.textures.set(textureKey, webglTexture);
        return webglTexture;
    }
}
