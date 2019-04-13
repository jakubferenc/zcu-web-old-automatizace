// ==========================================
// 1. DEPENDENCIES
// ==========================================
// gulp-dev-dependencies
const gulp = require('gulp');
// check package.json for gulp plugins
const gulpLoadPlugins = require('gulp-load-plugins');

// dev-dependencies
const browserSync = require('browser-sync').create();
const del = require('del');
const fs = require('fs');
const rollup = require('rollup').rollup;
const rollupNodeResolve = require('rollup-plugin-node-resolve');
const rollupBabel = require('rollup-plugin-babel');
const rollupUglify = require('rollup-plugin-uglify');
const runSequence = require('run-sequence');
const postcssAutoprefixer = require('autoprefixer');
const postcssCssnano = require('cssnano');

const pkg = require('./package.json');

const $ = gulpLoadPlugins();

const version = pkg.version;


// ==========================================
// 2. CONFIG
// ==========================================
const config = {
  // BUILD TASKS
  tasks: {
    dev: ['pug', 'css', 'js', 'images', 'pdf', 'audio', 'fonts'],
    build: {
      assets: ['css', 'js', 'images', 'pdf', 'audio', 'fonts'],
      html: ['pug'],
      revision: ['rev'],
    },
  },
  // COMMAND ARGUMENTS
  cmd: {
    // check if 'gulp --production'
    // http://stackoverflow.com/questions/28538918/pass-parameter-to-gulp-task#answer-32937333
    production: process.argv.indexOf('--production') > -1 || false,
    // cviceni: {
    //   index: process.argv.indexOf('--cviceni') || false,
    //   value: config.cmd.cviceni.index > -1 ? process.argv[config.cmd.cviceni.index + 1] : false,
    // },
  },
  // FOLDERS
  src: {
    folder: 'src/',
    data: {
      folder: 'src/data/',
      json: 'src/data/**/*.json',
      bundle: 'src/data/cviceni.json',
    },
    fonts: {
      folder: 'src/fonts/',
      files: 'src/fonts/**/*.*',
    },
    img: {
      folder: 'src/img/',
      files: 'src/img/**/*.{jpg,png,svg,gif}',
    },
    js: {
      app: 'src/js/app.js',
      components: 'src/js/components/components.js',
      files: 'src/js/**/*.js',
      library: 'src/js/lib/',
      vendorFiles: 'src/js/vendor/**/*.js',
    },
    pug: {
      views: 'src/views/**/*.pug',
      index: 'src/views/index.pug',
      partials: 'src/views/_partials/**/*.pug',
    },
    scss: 'src/scss/**/*.scss',
    text: {
      folder: 'src/text/',
      html: 'src/text/**/*.html',
    },
    scaffolding: {
      folder: 'src/scaffolding/',
      data: {
        folder: 'src/scaffolding/data/',
      },
      views: {
        folder: 'src/scaffolding/views/',
        cviceni: {
          folder: 'src/scaffolding/views/cviceni/',
        },
      },
      text: {
        folder: 'src/scaffolding/text/',

      },
    },
  },
  tmp: {
    folder: 'tmp/',
    data: {
      folder: 'tmp/data/',
      cviceni: 'tmp/data/cviceni.json',
    },
    js: {
      folder: 'tmp/js/',
      src: 'tmp/js/**/*.js',
    },
    pug: {
      folder: 'tmp/pug/',
      index: 'tmp/pug/index.pug',
      src: 'tmp/pug/**/*.pug',
    },
  },
  dist: {
    folder: 'dist/',
    audio: 'dist/cviceni/assets/audio/',
    cviceni: 'dist/cviceni/',
    css: 'dist/cviceni/assets/css/',
    fonts: 'dist/cviceni/assets/fonts/',
    img: 'dist/cviceni/assets/img/',
    js: 'dist/cviceni/assets/js/',
    jsVendor: 'dist/cviceni/assets/js/vendor/',
    pdf: 'dist/cviceni/assets/pdf/',
  },
  // plugin settings
  // SERVER
  browserSync: {
    // proxy: 'localhost:' + config.port,
    // port: 3000,
    server: 'dist/',
    files: null,
    // files: 'dist/**/*.*',
    ghostMode: {
      click: true,
      // location: true,
      forms: true,
      scroll: true,
    },
    injectChanges: true,
    logFileChanges: true,
    logLevel: 'info',
    notify: false,
    reloadDelay: 380,
  },
  // IMAGES
  images: {},
  // PLUMBER
  plumber: {
    errorHandler: $.notify.onError('Error: <%= error.message %>'),
  },
  // POSTCSS
  postcss: {
    plugins: [
      postcssAutoprefixer({
        cascade: true,
        precision: 10,
      }),
      postcssCssnano(),
    ],
  },
  // PUG
  pug: {
    pretty: true
  },
  // ROLLUP
  rollup: {
    bundle: {
      input: 'src/js/app.js',
      plugins: [
        rollupNodeResolve(),
        rollupBabel({
          exclude: 'node_modules/**',
        }),
      ],
    },
    output: {
      file: 'dist/assets/js/app.build.js',
      format: 'iife',
      name: 'mdh',
      sourcemap: true,
    },
  },
  components: {
    bundle: {
      input: 'src/js/components/components.js',
      plugins: [
        rollupNodeResolve(),
        rollupBabel({
          exclude: 'node_modules/**',
        }),
      ],
    },
    output: {
      file: 'dist/cviceni/assets/js/components.build.js',
      format: 'iife',
      name: 'components',
      sourcemap: true,
    }
  },
  // SASS
  sass: {
    errLogToConsole: true,
    outputStyle: 'expanded',
  },
};


// ==========================================
// 3. FUNCTIONS
// ==========================================
function startBrowserSync() {
  if (browserSync.active) {
    return;
  }
  browserSync.init(config.browserSync);
}

function reload() {
  return browserSync.reload();
}

// ==========================================
// 4. TASKS
// ==========================================
// CLEAN
gulp.task('clean', (done) => {
  return del(['dist'], done);
});

// SERVER
gulp.task('serve', () => {
  return startBrowserSync();
});

gulp.task('reload', () => {
  return reload();
});

// pug:index (pug -> html)
gulp.task('pug', () => {
  return gulp.src(['src/views/**/*.pug'])
    .pipe($.pug(config.pug))
    .pipe(gulp.dest('dist/'))
    .pipe(browserSync.stream());
});
gulp.watch(['src/views/**/*.pug'], ['pug', 'reload']);


// SASS
gulp.task('css', () => {
  gulp.src('src/scss/**/*.scss')
    .pipe($.sass(config.sass).on('error', $.sass.logError))
    .pipe(gulp.dest('dist/assets/css'))
    .pipe(browserSync.stream());
});
gulp.watch('src/scss/**/*.scss', ['css', 'reload']);


gulp.task('js', async () => {
  const bundle = await rollup(config.rollup.bundle);
  bundle.write(config.rollup.output);
});
gulp.watch('src/js/**/*.js', ['js', 'reload']);

// IMAGES
gulp.task('images', () => {
  gulp.src('src/img/**/*.{jpg,png,svg,gif}')
    .pipe(gulp.dest('dist/assets/img'));
});


// GULP
gulp.task('default', ['clean'], () => {

  runSequence(['pug', 'css', 'js', 'images', 'serve']);
});

// GULP
gulp.task('build', ['clean'], () => {

  runSequence(['pug', 'css', 'js', 'images']);
});
