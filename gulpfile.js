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

gulp.task('watch', function() {
    gulp.watch('src/*.js', ['prod']);
});

gulp.task('default', ['prod']);
