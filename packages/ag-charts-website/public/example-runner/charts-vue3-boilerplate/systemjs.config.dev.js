(function (global) {
    System.config({
        transpiler: 'ts',
        typescriptOptions: {
            target: 'es2020',
        },
        paths: {
            'npm:': 'https://cdn.jsdelivr.net/npm/',
        },
        map: {
            // Transpilers
            css: boilerplatePath + 'css.js',
            ts: 'npm:plugin-typescript@8.0.0/lib/plugin.js',
            typescript: 'npm:typescript@4.3.5/lib/typescript.min.js',

            clone: 'npm:clone@2.1.2',

            // vuejs
            vue: 'npm:vue@3.2.29/dist/vue.esm-browser.js',
            '@vue/reactivity': 'npm:@vue/reactivity@3.0.0/dist/reactivity.esm-browser.js',

            app: appLocation + 'app',
            // systemJsMap comes from index.html
            ...systemJsMap,
        },

        packages: {
            vue: {
                defaultExtension: 'js',
            },
            app: {
                defaultExtension: 'js',
            },
            'ag-charts-vue3': {
                main: './dist/package/index.cjs.js',
                defaultExtension: 'js',
            },
            'ag-charts-community': {
                main: './dist/package/main.cjs.js',
                defaultExtension: 'js',
            },
            'ag-charts-enterprise': {
                main: './dist/package/main.cjs.js',
                defaultExtension: 'js',
            },
            'ag-charts-types': {
                main: './dist/package/main.cjs.js',
                defaultExtension: 'js',
            },
            'ag-charts-locale': {
                main: './dist/package/main.cjs.js',
                defaultExtension: 'js',
            },
        },
        meta: {
            typescript: {
                exports: 'ts',
            },
            '*.css': { loader: 'css' },
        },
    });
})(this);

window.addEventListener('error', (e) => {
    console.error('ERROR', e.message, e.filename);
});
