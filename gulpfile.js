var gulp = require('gulp');
var util = require('gulp-util');
var shell = require('gulp-shell')

var replace = require('gulp-replace');
 


gulp.task('default', function() {
  // place code for your default task here
  console.log("build version 0.0.5 with: gulp build --num  5");
});

gulp.task('build',['copy','version','vsts-build-extension'])
{

}

gulp.task('vsts-build-extension',['version'], function(){
    return gulp.src('_out/buildtask/*.js', {read: false})
  .pipe(shell('tfx extension create --manifest-globs vss-extension.json'
,
{cwd:"_out"}
))
    
});

gulp.task('copy', function()
{
     gulp.src(['images/**/*']).pipe(gulp.dest('_out/images'));
     gulp.src(['overview.md']).pipe(gulp.dest('_out'));
     gulp.src(['buildtask/node_modules/*']).pipe(gulp.dest('_out/buildtask/node_modules'));
});


gulp.task('version',['copy'], function(){
  gulp.src(['buildtask/*'])
    .pipe(replace('0.0.1', '0.0.'+util.env.num))
    .pipe(replace('G_VERSION', '0.0.'+util.env.num))
    .pipe(gulp.dest('_out/buildtask'));
  gulp.src(['vss-extension.json'])
    .pipe(replace('G_VERSION', '0.0.'+util.env.num))
    .pipe(gulp.dest('_out/'));
  gulp.src(['overview.md'])
    .pipe(replace('G_VERSION', '0.0.'+util.env.num))
    .pipe(gulp.dest('_out/'));
});