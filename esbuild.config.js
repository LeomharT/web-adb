import esbuild from 'esbuild';
import eslint from 'esbuild-plugin-eslint';
import { sassPlugin } from 'esbuild-sass-plugin';

console.time('\u001b[1;35mTotal time\u001b[1;36m');

await esbuild.build({
    entryPoints: ['./src/index.tsx'],
    outdir: 'dist',
    bundle: true,
    minify: false,
    watch: true,
    assetNames: 'assets/[name]-[hash]',
    loader: {
        '.png': 'file',
        '.svg': 'file',
        '.jpg': 'file'
    },
    plugins: [
        sassPlugin(),
        eslint({
            useEslintrc: true,
        })
    ]
}).then(v =>
{
    console.log("\u001b[1;32mNo issues found!\u001b[0m");
}).catch(e => console.error(e));

console.timeEnd('\u001b[1;35mTotal time\u001b[1;36m');
