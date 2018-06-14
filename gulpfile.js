const gulp = require('gulp');
const uglify = require('gulp-uglify');
const watch = require('gulp-watch');
const babel = require('gulp-babel');

gulp.task('prod', () => {
    gulp.src('src/mySALESGUIDE.js')
        .pipe(babel({presets: ['es2015']}))
        .pipe(uglify())
        .pipe(gulp.dest('dist'));
});

gulp.task('dev', () => {
    gulp.src('src/mySALESGUIDE.js')
        .pipe(babel({presets: ['es2015']}))
        .pipe(gulp.dest('dist'));
});

gulp.task('watch', function() {
    gulp.watch('src/*.js', ['dev']);
});

gulp.task('default', ['prod']);
