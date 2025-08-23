import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
    plugins: [
        dts({
            insertTypesEntry: true,
            include: ['src/**/*'],
            exclude: ['src/**/*.test.ts']
        })
    ],
    server: {
        open: '/examples/index.html'
    },
    optimizeDeps: {
        include: ['gl-matrix']
    },
    build: {
        lib: {
            entry: 'src/index.ts',
            name: 'GameEngine',
            formats: ['es', 'umd', 'cjs'],
            fileName: (format) => `gameengine.${format}.js`
        },
        rollupOptions: {
            external: ['box2d-wasm'],
            output: {
                globals: {
                    'box2d-wasm': 'Box2D'
                }
            }
        },
        sourcemap: true,
        minify: false
    },
    resolve: {
        alias: {
            '@': '/src'
        }
    }
});
