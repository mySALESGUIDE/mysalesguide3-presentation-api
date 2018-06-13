const gulp = require('gulp');
const uglify = require('gulp-uglify');
const watch = require('gulp-watch');
const babel = require('gulp-babel');
// const requirejsOptimize = require('gulp-requirejs-optimize');

gulp.task('watch', function() {
    gulp.watch('src/*.js', ['prod']);
});

gulp.task('prod', () => {
    gulp.src('src/mySALESGUIDE.js')
        .pipe(babel({presets: ['es2015']}))
        // .pipe(requirejsOptimize())
        .pipe(uglify())
        .pipe(gulp.dest('dist'));
});

gulp.task('default', ['prod']);
