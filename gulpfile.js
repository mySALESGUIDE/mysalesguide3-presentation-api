const gulp = require('gulp');
const watch = require('gulp-watch');
const babel = require('gulp-babel');

gulp.task('prod', () => {
    gulp.src('src/mySALESGUIDE.js')
        .pipe(babel({
            "presets": ["env"],
            "plugins": [
                "add-module-exports",
                "transform-es2015-modules-umd"
            ]
        }))
        .pipe(gulp.dest('dist'));
});

gulp.task('dev-fakeapp', () => {
    gulp.src('src/fakeapp.js')
        .pipe(babel({
            "presets": ["env"],
            "plugins": [
                "add-module-exports",
                "transform-es2015-modules-umd"
            ]
        }))
        .pipe(gulp.dest('example'));
    gulp.src('src/inc/*.js')
        .pipe(babel({
            "presets": ["env"],
            "plugins": [
                "add-module-exports",
                "transform-es2015-modules-umd"
            ]
        }))
        .pipe(gulp.dest('example/inc'));
});

gulp.task('dev', ['dev-fakeapp', 'prod']);

gulp.task('watch', function() {
    gulp.watch(['src/*.js','src/**/*.js'], ['dev']);
});

gulp.task('default', ['prod']);
