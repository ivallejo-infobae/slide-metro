import { src, dest, task, watch, series, parallel } from 'gulp';
// PLUMBER
import plumber from 'gulp-plumber';
// HTML
import htmlmin from 'gulp-htmlmin';
// CSS
import sass from 'gulp-sass';
import postcss from 'gulp-postcss';
import cleancss from 'gulp-clean-css';
import autoprefixer from 'autoprefixer';
import rename from 'gulp-rename';
import sourcemaps from 'gulp-sourcemaps'
// JS
import babel from 'gulp-babel';
import terser from 'gulp-terser';
import concat from 'gulp-concat';
// PRODUCTION PLUGIN
import gulpif from 'gulp-if';
import del from 'del';
import yargs from 'yargs'
// BROWSERSYNC
import {init as server, stream, reload} from 'browser-sync';

const PRODUCTION = yargs.argv.prod;

task('cleanDocs', () => del(['docs/**']))

// task('clean-images', () => del(['app/img/**']))

const paths = {
  html: {
    htmlFile: 'dev/html-dev/*.html',
    dest: 'docs/'
  },
  styles: {
    cssSources: 'dev/css/*.css',
    scss: 'dev/scss/*.scss',
    scssWatch: 'dev/scss/**/*.scss',
    dest: 'docs/css'
  },
  js: {
    jsSources: 'dev/js-dev/src/*.js',
    jsMain: 'dev/js-dev/main.js',
    dest: 'docs/js'
  },
  fonts: {
    files: 'dev/fonts/**',
    dest: 'docs/fonts'
  },
  images: {
    files: 'dev/images/**',
    dest: 'docs/img'
  },
  docs: {
    src: 'app/**',
    dest: 'docs/'
  }
}

task('html', () => {
  return src(paths.html.htmlFile)
  .pipe(plumber())
  .pipe(htmlmin({
    collapseWhitespace: true,
    removeComments: true
  }))
  .pipe(rename('index.html'))
  .pipe(dest(paths.html.dest))
})

task('styles', () => {
  return src(paths.styles.scss)
  // .pipe(plumber())
  .pipe(gulpif(!PRODUCTION, sourcemaps.init()))
  // .pipe(sourcemaps.init())
  .pipe(sass({outputStyle: "compressed"}).on('error', sass.logError))
  .pipe(postcss([autoprefixer()]))
  .pipe(rename('styles.min.css'))
  .pipe(gulpif(!PRODUCTION, sourcemaps.write()))
  // .pipe(sourcemaps.write())
  .pipe(dest(paths.styles.dest))
  .pipe(stream())
})

task('mainJs', () => {
  return(src(paths.js.jsMain))
  .pipe(plumber())
  .pipe(babel())
  .pipe(terser())
  .pipe(rename('main.min.js'))
  .pipe(dest(paths.js.dest))
})

task('resourcesCss', () => {
  return src(paths.styles.cssSources)
  .pipe(concat('resources.min.css'))
  .pipe(cleancss({compatibility: 'ie8'}))
  .pipe(dest(paths.styles.dest))
})

task('resourcesJs', () => {
  return(src(paths.js.jsSources))
  .pipe(concat('resources.min.js'))
  .pipe(terser())
  .pipe(dest(paths.js.dest))
})  

task('resourcesImages', () => {
  return(src(paths.images.files))
  .pipe(dest(paths.images.dest))
})

task('startServer', (done) => {
  server({
    server: 'docs/',
    injectChanges: true,
    open: false
  })
  done();
})

task('watch', () => {
  watch(paths.html.htmlFile, series('html')).on('change', reload)
  watch(paths.styles.scss, series('styles'))
  watch(paths.styles.cssSources, series('resourcesCss'))
  watch(paths.js.jsSources, series('resourcesJs'))
  watch(paths.js.jsMain, series('mainJs')).on('change', reload)
  watch(paths.images.files, series('resourcesImages'))
});

task('default', series('cleanDocs', parallel('html', 'styles', 'mainJs', 'resourcesCss', 'resourcesJs', 'resourcesImages'), 'startServer', 'watch'))

task('bundle', series('cleanDocs', parallel('html', 'styles', 'mainJs', 'resourcesCss', 'resourcesJs', 'resourcesImages')))

task('production', series('bundle'))