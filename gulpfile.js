// ==========================================
// 1. DEPENDENCIES
// ==========================================
// gulp-dev-dependencies
const gulp = require('gulp');
// check package.json for gulp plugins
const gulpLoadPlugins = require('gulp-load-plugins');

// dev-dependencies
const del = require('del');
const fs = require('fs');

const runSequence = require('run-sequence');


const pkg = require('./package.json');

const $ = gulpLoadPlugins();

const version = pkg.version;

const slug = require('slug');

// ==========================================
// FUNCTIONS
// ==========================================
const isEven = (n) => {
  return n % 2 == 0;
}

// ==========================================
// CONFIG
// ==========================================
const config = {
  pug: {
    locals: {
      isEven,
    }
  }
};

// ==========================================
// 4. TASKS
// ==========================================
// CLEAN
gulp.task('clean', (done) => {
  return del(['dist'], done);
});


// pug:index (pug -> html)
gulp.task('pug', () => {
  return gulp.src(['src/views/pages/*.pug'])
    .pipe(
      $.data(
        (file) => {
          return JSON.parse(fs.readFileSync('./tmp/data/publikace_upravene.json'))
        }
      )
    )
    .pipe($.pug(config.pug))
    .pipe(gulp.dest('dist/'))
});



// GULP
gulp.task('default', ['clean'], () => {

  runSequence(['pug']);
});


// GULP
gulp.task('build', ['clean', 'prepare'], () => {

  runSequence(['pug']);
});

gulp.task('prepare', () => {

  const jsonNastaveni = JSON.parse(fs.readFileSync('./nastaveni.json'))

  const jsonPublikaceOriginal = JSON.parse(fs.readFileSync('./data/publikace.json'))

  for (const item in jsonPublikaceOriginal['publikacePreklady']) {

    let thisItem = jsonPublikaceOriginal['publikacePreklady'][item];

    // create a slug used for image name or the url of detail page
    thisItem.slug = slug(thisItem.title);
    thisItem.slug = thisItem.slug.toLowerCase();

    // obrazky
    thisItem.obrazekSrc = `${jsonNastaveni.publikace.obrazek.nahled.cesta}/${thisItem.slug}.jpg${jsonNastaveni.publikace.obrazek.nahled.za_nazvem}`;

    // podrobnosti
    thisItem.podrobnostiUrl = `${jsonNastaveni.publikace.podrobnosti.cesta}/${thisItem.slug}${jsonNastaveni.publikace.podrobnosti.za_nazvem}`;


  }

  // vytvoř nový upravený soubor
  fs.writeFile('./tmp/data/publikace_upravene.json', JSON.stringify(jsonPublikaceOriginal, null, 2));


});
