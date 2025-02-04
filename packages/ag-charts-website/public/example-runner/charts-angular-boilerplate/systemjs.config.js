(function (global) {
    var ANGULAR_VERSION = '^17';

    var sjsPaths = {};
    if (typeof systemJsPaths !== 'undefined') {
        sjsPaths = systemJsPaths;
    }

    System.config({
        // DEMO ONLY! REAL CODE SHOULD NOT TRANSPILE IN THE BROWSER
        transpiler: 'ts',
        typescriptOptions: {
            target: 'es2020',
            emitDecoratorMetadata: true,
            experimentalDecorators: true,
        },
        meta: {
            typescript: {
                exports: 'ts',
            },
            '*.css': { loader: 'css' },
        },
        paths: {
            // paths serve as alias
            'npm:': 'https://cdn.jsdelivr.net/npm/',
            ...sjsPaths,
        },
        // map tells the System loader where to look for things
        map: {
            '@angular/compiler': 'npm:@angular/compiler@' + ANGULAR_VERSION + '/fesm2022/compiler.mjs',
            '@angular/platform-browser-dynamic':
                'npm:@angular/platform-browser-dynamic@' + ANGULAR_VERSION + '/fesm2022/platform-browser-dynamic.mjs',
            '@angular/core': 'npm:@angular/core@' + ANGULAR_VERSION + '/fesm2022/core.mjs',
            '@angular/core/primitives/signals':
                'npm:@angular/core@' + ANGULAR_VERSION + '/fesm2022/primitives/signals.mjs',
            '@angular/common': 'npm:@angular/common@' + ANGULAR_VERSION + '/fesm2022/common.mjs',
            '@angular/common/http': 'npm:@angular/common@' + ANGULAR_VERSION + '/fesm2022/http.mjs',

            '@angular/platform-browser':
                'npm:@angular/platform-browser@' + ANGULAR_VERSION + '/fesm2022/platform-browser.mjs',
            '@angular/platform-browser/animations':
                'npm:@angular/platform-browser@' + ANGULAR_VERSION + '/fesm2022/animations.mjs',

            '@angular/forms': 'npm:@angular/forms@' + ANGULAR_VERSION + '/fesm2022/forms.mjs',
            '@angular/animations': 'npm:@angular/animations@' + ANGULAR_VERSION + '/fesm2022/animations.mjs',
            '@angular/animations/browser': 'npm:@angular/animations@' + ANGULAR_VERSION + '/fesm2022/browser.mjs',

            rxjs: 'npm:rxjs@7.8.1/dist/bundles/rxjs.umd.min.js',
            'rxjs/operators': 'npm:rxjs@7.8.1/dist/bundles/rxjs.umd.min.js',

            css: 'npm:systemjs-plugin-css@0.1.37/css.js',

            clone: 'npm:clone@2.1.2',

            ts: 'npm:plugin-typescript@8.0.0/lib/plugin.js',
            tslib: 'npm:tslib@2.3.1/tslib.js',
            typescript: 'npm:typescript@4.4/lib/typescript.min.js',

            // appLocation comes from index.html
            app: appLocation,
            ...systemJsMap,
        },
        // packages tells the System loader how to load when no filename and/or no extension
        packages: {
            app: {
                defaultExtension: 'ts',
            },
            'ag-charts-angular': {
                main: './fesm2022/ag-charts-angular.mjs',
                defaultExtension: 'mjs',
            },
            rxjs: {
                defaultExtension: false,
            },
        },
    });
})(this);

window.addEventListener('error', (e) => {
    console.error('ERROR', e.message, e.filename);
});
