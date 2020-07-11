//var mustache = require("gulp-mustache");
var gulp = require("gulp");

var options = { extension : 'html' } ;
function MustacheBuilder(){
	return gulp.src("./src/html/*.html").
		pipe(gulp.dest("./dist"));
//		pipe(mustache("./src/html/varunaPages.json")).
}

exports.default = MustacheBuilder;

