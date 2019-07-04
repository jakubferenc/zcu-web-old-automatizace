/* eslint-disable no-restricted-syntax */
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
// GLOBALS
// ==========================================
const jsonNastaveni = JSON.parse(fs.readFileSync('./nastaveni.json'));

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
// FUNCTIONS
// ==========================================

const preparePublikaceItem = (item) => {

  const thisItem = item;

  // create a slug used for image name or the url of detail page
  thisItem.slug = slug(item.title);
  thisItem.slug = thisItem.slug.toLowerCase();

  // obrazky
  if (thisItem.has_picture !== false) {

    thisItem.obrazekSrc = `${jsonNastaveni.publikace.obrazek.nahled.cesta}/${thisItem.slug}.jpg`;
    thisItem.obrazekZaNazvem = jsonNastaveni.publikace.obrazek.nahled.za_nazvem;


  } else {
    thisItem.obrazekSrc = jsonNastaveni.publikace.obrazek.nahrada_obrazku.cesta;
    thisItem.obrazekZaNazvem = '';
  }

  // podrobnosti
  thisItem.podrobnostiUrl = `${jsonNastaveni.publikace.podrobnosti.cesta}/${thisItem.slug}${jsonNastaveni.publikace.podrobnosti.za_nazvem}`;

  // podrobnosti html
  gulp.src('src/views/_partials/detail-publikace.pug')
    .pipe(
      $.data(
        (file) => thisItem
      )
    )
    .pipe($.pug(config.pug))
    .pipe($.rename(`${thisItem.slug}.html`))
    .pipe(gulp.dest('tmp/views/podrobnosti/'));


  return thisItem;

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


  const jsonPublikaceOriginal = JSON.parse(fs.readFileSync('./data/publikace.json'));

  for (const publikaceType in jsonPublikaceOriginal['publikace']) {

    for (const item in jsonPublikaceOriginal['publikace'][publikaceType]) {

      const thisTempItem = jsonPublikaceOriginal['publikace'][publikaceType][item];

      jsonPublikaceOriginal['publikace'][publikaceType][item] = Object.assign({}, thisTempItem, preparePublikaceItem(thisTempItem));

    }
  }

  // vytvoř nový upravený soubor
  fs.writeFileSync('./tmp/data/publikace_upravene.json', JSON.stringify(jsonPublikaceOriginal, null, 2));


});
