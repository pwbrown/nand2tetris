import * as esbuild from 'esbuild';

await esbuild.build({
    entryPoints: ['./src/n2t.ts'],
    bundle: true,
    platform: 'node',
    outfile: './bin/n2t.js',
    banner: {
        /** Banner includes shebang and a descriptive comment */
        js: `#!/usr/bin/env node

/**
 * Author: Philip Brown (2025)
 * Source: https://github.com/pwbrown/nand2tetris/src/n2t.ts
 * 
 * Written in TypeScript.
 * Using NodeJS v16 (to avoid compatability issues with the Coursera Nand2Tetris auto-grading system)
 * Bundled and compiled using ESBuild.
 * 
 * OSS Dependencies Bundled:
 *   - Commander.js (https://www.npmjs.com/package/commander): Streamline command line processing
 */`,
    },
});