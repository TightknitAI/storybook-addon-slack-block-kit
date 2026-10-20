import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { defineConfig, type UserConfig } from 'tsdown';

const entries = {
  index: 'src/index.ts',
  preview: 'src/preview.ts',
  manager: 'src/manager.tsx',
  preset: 'src/preset.ts'
};

// TS 7 keeps `renderer.tsx`'s `import '…/style.css'` in declaration output,
// and consumers who don't skip lib checks then fail with TS2882. The JS
// bundles still import the stylesheet; only the .d.ts / .d.cts copies drop
// it. This runs on the written files because the .d.cts is emitted outside
// the plugin pipeline.
async function stripCssFromDts(outDir: string, name: string): Promise<void> {
  for (const ext of ['d.ts', 'd.cts']) {
    const file = join(outDir, `${name}.${ext}`);
    const code = await readFile(file, 'utf8');
    await writeFile(file, code.replace(/^import ["'][^"']+\.css["'];\n/gm, ''));
  }
}

// One build per entry so each dist file is self-contained, with no shared
// chunks between them (the same output tsup's `splitting: false` gave).
export default defineConfig(
  Object.entries(entries).map(
    ([name, file]): UserConfig => ({
      entry: { [name]: file },
      format: ['esm', 'cjs'],
      // Keep the dist/*.{js,cjs,d.ts,d.cts} names that the `exports` map and
      // `preset.ts`'s `managerEntries` / `previewAnnotations` point at.
      fixedExtension: false,
      dts: true,
      target: 'es2022',
      platform: 'node',
      sourcemap: true,
      // The builds run in parallel, so none of them cleans dist/; the build
      // script does that before tsdown starts.
      clean: false,
      treeshake: true,
      // Gives the CJS build an `import.meta.url` shim for `preset.ts`.
      shims: true,
      hooks: {
        'build:done': ({ options }) => stripCssFromDts(options.outDir, name)
      },
      deps: {
        neverBundle: [
          /^react($|\/)/,
          /^react-dom($|\/)/,
          /^storybook($|\/)/,
          /^@storybook\/react-vite($|\/)/,
          'slack-blocks-to-jsx'
        ]
      }
    })
  )
);
