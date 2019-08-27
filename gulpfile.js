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

const makeCzechDateFromYMD = (dateString) => {

  return dateString.split("-").reverse().join(". ");
};

const sortArrayByEndYearDesc = (list) => list.sort(function (a, b) { return Date.parse(a.value) - Date.parse(b.value); });

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

const preparePublikacePodleDataItem = (item) => {

  const thisItem = item;

  // create a slug used for image name or the url of detail page
  thisItem.slug = slug(item.title);
  thisItem.slug = thisItem.slug.toLowerCase();

  // obrazky
  if (thisItem.has_picture !== false) {

    thisItem.obrazekSrc = `${jsonNastaveni.publikace.obrazek.nahled_small.cesta}/${thisItem.slug}.jpg`;
    thisItem.obrazekZaNazvem = jsonNastaveni.publikace.obrazek.nahled_small.za_nazvem;

  } else {
    thisItem.obrazekSrc = jsonNastaveni.publikace.obrazek.nahrada_obrazku.cesta;
    thisItem.obrazekZaNazvem = jsonNastaveni.publikace.obrazek.nahled_small.za_nazvem;
  }

  // podrobnosti
  thisItem.podrobnostiUrl = `${jsonNastaveni.publikace.podrobnosti.cesta}/${thisItem.slug}${jsonNastaveni.publikace.podrobnosti.za_nazvem}`;

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
  if (thisItem.name_suffix === '') {
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

const generatePublikacePodleRokuDB = () => {

  const jsonOriginalPublikace = JSON.parse(fs.readFileSync('./data/publikace.json'));

  const newListPublikace = {};

  // only for the pure data file
  for (const publikaceType in jsonOriginalPublikace['publikace']) {

    for (const item in jsonOriginalPublikace['publikace'][publikaceType]) {

      const thisTempItem = jsonOriginalPublikace['publikace'][publikaceType][item];
      const thisTempItemYear = thisTempItem['published_date'];


      // check if the year value is already in the array
      // if not, create a new year in the array
      if ( newListPublikace[thisTempItemYear] === undefined ) {
        newListPublikace[thisTempItemYear] = [];
      }

      // add the item to the second level of the associate array
      newListPublikace[thisTempItemYear].push(thisTempItem);

    }
  }

  const finalObject = { publikacePodleRoku: newListPublikace };

  // vytvoř nový upravený soubor
  fs.writeFileSync('./data/publikace_podle_roku.json', JSON.stringify(finalObject, null, 2));


};

const generateProjektyPodleRokuDB = () => {

  const jsonOriginalPublikace = JSON.parse(fs.readFileSync('./data/projekty.json'));

  let newListProjektyUnsorted = {};

  // only for the pure data file
  for (const projekt in jsonOriginalPublikace['projekty']) {


    const thisTempItem = jsonOriginalPublikace['projekty'][projekt];
    const thisTempItemYear = thisTempItem['date_start'].split("-")[0];


    // check if the year value is already in the array
    // if not, create a new year in the array
    if ( newListProjektyUnsorted[thisTempItemYear] === undefined ) {
      newListProjektyUnsorted[thisTempItemYear] = [];
    }

    // add the item to the second level of the associate array
    newListProjektyUnsorted[thisTempItemYear].push(thisTempItem);


  }

  // sort by end of the year
  for (yearKey in newListProjektyUnsorted) {

    sortArrayByEndYearDesc(newListProjektyUnsorted[yearKey])

  }


  const finalObject = { projektyPodleRoku: newListProjektyUnsorted };

  // vytvoř nový upravený soubor
  fs.writeFileSync('./data/projekty_podle_roku.json', JSON.stringify(finalObject, null, 2));


};

const prepareProjektItem = (item) => {

  const thisItem = item;

  // keywords
  thisItem.keywords_string = thisItem.keywords.join(', ');

  // co investigators
  thisItem.co_investigator_string = thisItem.co_investigator.join(', ');

  // make a title if subtitle exists
  if (thisItem.subtitle !== undefined && thisItem.subtitle !== '') {
    thisItem.title = `${thisItem.title}: ${thisItem.subtitle}`;
  }

  // convert date to czech format
  thisItem.date_start_formatted = makeCzechDateFromYMD(thisItem.date_start);
  thisItem.date_end_formatted = makeCzechDateFromYMD(thisItem.date_end);

  // reduce all types of team members to one array
  thisItem.team_members_all = [];

  if (item.team_members !== undefined && item.team_members !== '') {

    Object.keys(item.team_members).forEach((key) => {

      // iterate over team members type
      // currently: academic, student_doctorate, student_other

      item.team_members[key].forEach((member) => {
        // add member from each category to reduced array for all types of members
        thisItem.team_members_all.push(member);

      });

    });

  }
  // END reduce all types of team members to one array


  // create a slug used for image name or the url of detail page
  thisItem.slug = slug(thisItem.title);
  thisItem.slug = thisItem.slug.toLowerCase();

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

gulp.task('generatePublikaceByYear', () => {

  return generatePublikacePodleRokuDB();

});

gulp.task('generateProjektyByYear', () => {

  return generateProjektyPodleRokuDB();

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

gulp.task('prepare', ['generatePublikaceByYear', 'generateProjektyByYear', 'mergeJson'], () => {


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


  for (const rokVydani in jsonOriginal['publikacePodleRoku']) {

    for (const item in jsonOriginal['publikacePodleRoku'][rokVydani]) {

      const thisTempItem = jsonOriginal['publikacePodleRoku'][rokVydani][item];


      jsonOriginal['publikacePodleRoku'][rokVydani][item] = Object.assign({}, thisTempItem, preparePublikacePodleDataItem(thisTempItem));

    }
  }

  for (const rokProjektu in jsonOriginal['projektyPodleRoku']) {

    for (const item in jsonOriginal['projektyPodleRoku'][rokProjektu]) {

      const thisTempItem = jsonOriginal['projektyPodleRoku'][rokProjektu][item];

      jsonOriginal['projektyPodleRoku'][rokProjektu][item] = Object.assign({}, thisTempItem, prepareProjektItem(thisTempItem));

    }
  }

  // vytvoř nový upravený soubor
  fs.writeFileSync('./tmp/data/data_merged_upravene.json', JSON.stringify(jsonOriginal, null, 2));


});
