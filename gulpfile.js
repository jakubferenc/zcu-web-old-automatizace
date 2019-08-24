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

let jsonNastaveni = undefined;

if (process.env.NODE_ENV.indexOf('production') > -1) {
  jsonNastaveni = JSON.parse(fs.readFileSync('./nastaveni.production.json'));
} else if (process.env.NODE_ENV.indexOf('development') > -1) {
  jsonNastaveni = JSON.parse(fs.readFileSync('./nastaveni.development.json'));
} else {
  jsonNastaveni = JSON.parse(fs.readFileSync('./nastaveni.development.json'));
}


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
    .pipe(gulp.dest('./tmp/views/podrobnosti/'));


  return thisItem;

};

const prepareAbsolventItem = (item) => {

  const thisItem = item;

  // create fullname
  thisItem.fullname = `${thisItem.firstname} ${thisItem.surname}`;

  // create a slug used for image name or the url of detail page
  thisItem.slug = slug(item.fullname);
  thisItem.slug = thisItem.slug.toLowerCase();

  // create full academic name
  if (thisItem.name_suffix === "") {
    thisItem.fullname_academic = `${thisItem.name_prefix} ${thisItem.fullname}`;
  } else {
    thisItem.fullname_academic = `${thisItem.name_prefix} ${thisItem.fullname}, ${thisItem.name_suffix}`;
  }


  // obrazek
  thisItem.obrazekSrc = `${jsonNastaveni.absolventi.obrazek.nahled.cesta}/${thisItem.slug}.jpg`;

  // podrobnosti
  thisItem.podrobnostiUrl = `${jsonNastaveni.absolventi.podrobnosti.cesta}/${thisItem.slug}${jsonNastaveni.publikace.podrobnosti.za_nazvem}`;


  // podrobnosti html
  gulp.src('src/views/_partials/detail-absolvent.pug')
    .pipe(
      $.data(
        (file) => thisItem
      )
    )
    .pipe($.pug(config.pug))
    .pipe($.rename(`${thisItem.slug}.html`))
    .pipe(gulp.dest(`./dist/${jsonNastaveni.absolventi.podrobnosti.cesta}`));

  return thisItem;

};

// ==========================================
// 4. TASKS
// ==========================================
// CLEAN
gulp.task('clean', (done) => {
  return del(['dist', 'tmp/**/*'], done);
});

gulp.task('images', () => {
  return gulp.src('./images/**/*')
  .pipe(gulp.dest('./dist/images'));
});

// pug:index (pug -> html)
gulp.task('pug', () => {
  return gulp.src(['src/views/pages/*.pug'])
    .pipe(
      $.data(
        (file) => {
          return JSON.parse(fs.readFileSync('./tmp/data/data_merged_upravene.json'))
        }
      )
    )
    .pipe($.pug(config.pug))
    .pipe(gulp.dest('dist/'))
});



// GULP
gulp.task('default', ['build'], () => {

  runSequence(['pug', 'images']);
});


// GULP
gulp.task('build', ['clean', 'prepare'], () => {

  runSequence(['pug']);
});

gulp.task('mergeJson', () => {
  return gulp.src('./data/**/*.json')
  .pipe($.mergeJson({
    fileName: 'data_merged.json',
  }))
  .pipe(gulp.dest('./tmp/data'));
});

gulp.task('prepare', ['mergeJson'], () => {


  const jsonOriginal = JSON.parse(fs.readFileSync('./tmp/data/data_merged.json'));

  for (const publikaceType in jsonOriginal['publikace']) {

    for (const item in jsonOriginal['publikace'][publikaceType]) {

      const thisTempItem = jsonOriginal['publikace'][publikaceType][item];

      jsonOriginal['publikace'][publikaceType][item] = Object.assign({}, thisTempItem, preparePublikaceItem(thisTempItem));

    }
  }

  for (const item in jsonOriginal['absolventi']) {

    const thisTempItem = jsonOriginal['absolventi'][item];

    jsonOriginal['absolventi'][item] = Object.assign({}, thisTempItem, prepareAbsolventItem(thisTempItem));

  }

  // vytvoř nový upravený soubor
  fs.writeFileSync('./tmp/data/data_merged_upravene.json', JSON.stringify(jsonOriginal, null, 2));


});
