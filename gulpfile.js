/* Gulp plugins */
const gulp = require('gulp'); // gulp base api
const stylus = require('gulp-stylus'); // needed for converting .styl files to css
const gtcm = require('../gulp-tcm'); // create type definition for css modules used in typescript

/* Utilitys */
const del = require('del'); // rm -rf in node.
const rollup = require('rollup'); // module bundler
const merge2 = require('merge2'); // stream merger

/* Rollup Plugins */
const replace = require('rollup-plugin-replace');
const typescript = require('rollup-plugin-typescript2'); // add typescript support
const resolve = require('rollup-plugin-node-resolve'); // needed for nodejs modules
const commonjs = require('rollup-plugin-commonjs'); //  needed for nodejs modules
const postCss = require('rollup-plugin-postcss'); // css processor for prefixing/minimizing/packing

/* PostCSS Plugins */
const autoprefixer = require('autoprefixer'); // use the caniuse-db to add browser prefixes
const cssnano = require('cssnano'); // minimize css files
const mqp = require('css-mqpacker'); // combine equal mediaquerys to one

/* Tasks:
  tcm: Create type definitions for CSS classes.
  copysrc: Copy .ts or .tsx source files to the build directory (workaround for typescript not finding css modules).
  copyassets: Copy everything in the asset folder to dist.
  build: Transpile and bundles typescript files and css modules.
  clean: Removes build and dist folder. Basically start from scratch.
*/

gulp.task(function tcm () {
  return gulp.src('./src/**/*.styl') // find all .styl files in src and sub directorys
    .pipe(stylus()) // convert to css
    .pipe(gtcm({ // create typings from css
      camelCase: true
    }))
    .pipe(gulp.dest('./build'));
});

gulp.task(function copysrc () {
  return gulp.src('./src/**/*.ts+(|x)') // find all .ts and .tsx files ..
    .pipe(gulp.dest('./build')); // and copy them to build
});

gulp.task(function copyassets () {
  return merge2([
    gulp.src('./src/index.html'), // find all asset files ..
    gulp.src('./src/assets/**/*.*')
  ]).pipe(gulp.dest('./dist')); // and copy them to dist
});

gulp.task('build', gulp.series('tcm', 'copyassets', 'copysrc', async function (done) {
  const bundle = await rollup.rollup({
    input: './build/index.tsx', // entrypoint
    plugins: [
      resolve({ // allow rollup to find nodejs_modules ..
        jsnext: true,
        main: true,
        browser: true
      }),
      commonjs({ // and to use them.
        namedExports: {
          'node_modules/react-dom/index.js': ['render'],
          'node_modules/react/index.js': ['createElement', 'Component']
        }
      }),
      typescript({ // add support for typescript
        typescript: require('typescript'), // use our typscript compiler, instead of the bundled one
        tsconfigOverride: { // overwrite tsconfig for rollup
          'compilerOptions': {
            'rootDir': './build/',
            'module': 'ES2015'
          },
          'include': [
            './build/**/*.ts',
            './build/**/*.tsx'
          ]
        }
      }),
      postCss({ // import and use css files
        extract: true, // we want a css file. Default: inject css string to head
        namedExports: true, // export classname map as object e.g. {'item__frame--active': 'index_item__frame--active_xasda'}
        modules: { // use modules. classnames will be rewitten to {file}_{class}_{unique string} to awoid collisions
          /* Our tcm creates typedefinition using camelCase e.g. .item__frame--active becomes itemFrameActive, to prevent illegal javascript names.
             To mimic this behavior for our translation table, we need to tranform the json here as well. */
          getJSON: function (filepath, json) {
            var newJSON = {};
            Object.keys(json).forEach(function (key) { // iterate over every key..
              var newKey = key.replace(/([-_]+)./g, function (match) { // and find any character next to '-' or '_' (including themself) ..
                return match.substr(-1).toUpperCase(); // and convert them to uppercase. (item__frame--active => [__f => F, --a => A])
              });

              newJSON[newKey] = json[key];
            });
            return newJSON;
          }
        },
        plugins: [autoprefixer(), mqp(), cssnano()] // transform our css e.g. add prefixes, pack media querys and minimize it
      }),
      replace({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV) // help react running in a browser... (Facebook!! Why??)
      })
    ]
  });

  await bundle.write({ // write the bundled files
    file: 'dist/index.js', // output
    name: 'reactApp', // required but ignored (WTF??)
    sourceMap: 'inline', // sourcemaps for chrome dev tool.
    format: 'iife', // export as an immediate invoked function expression (iife) for scope isolation. => http://www.nicoespeon.com/en/2013/05/properly-isolate-variables-in-javascript/
    globals: [] // if we use jquery or any dependencies that are loaded from our html page, we can add them here. Rollup will happily ignore them.
  });

  done();
}));

gulp.task('clean', function (done) {
  return del(['build', 'dist', '.rpt2_cache'], done.bind(this)); // delete 'build' and 'dist' folder.
});
