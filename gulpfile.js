const gulp = require('gulp');
const clean = require('gulp-clean');
const htmlmin = require('gulp-htmlmin');
const terser = require('gulp-terser');
const rename = require('gulp-rename');
const sourcemaps = require('gulp-sourcemaps');
const cleanCSS = require('gulp-clean-css');
const replace = require('gulp-replace');
const obfuscate = require('gulp-obfuscate');
const del = require('del');
const { exec } = require('child_process');
const path = require('path');
const crypto = require('crypto');

// Generate a unique build ID based on timestamp and random string
const buildId = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

// Helper function to handle minified filenames
function getMinifiedPath(filePath) {
    const parsed = path.parse(filePath);
    // If the file already has .min in its name, return as is
    if (parsed.base.includes('.min')) {
        return filePath;
    }
    // Otherwise add .min before the extension
    return path.join(parsed.dir, `${parsed.name}.min${parsed.ext}`);
}

// Clean dist directory
function cleanDist() {
    return del(['dist/**/*']);
}

// Process HTML files
function processHTML() {
    return gulp.src('public/**/*.html')
        // Handle script tags, preserving any existing .min.js
        .pipe(replace(/<script src="([^"]+)(?:\.min)?\.js(?:\?[^"]*)?"><\/script>/g, 
            (match, path) => {
                const minPath = getMinifiedPath(path + '.js');
                return `<script src="${minPath}?v=${buildId}"></script>`;
            }))
        // Handle link tags, preserving any existing .min.css
        .pipe(replace(/<link[^>]+href="([^"]+)(?:\.min)?\.css(?:\?[^"]*)?("[^>]*>)/g, 
            (match, path, rest) => {
                const minPath = getMinifiedPath(path + '.css');
                return `<link rel="stylesheet" href="${minPath}?v=${buildId}"${rest}`;
            }))
        .pipe(htmlmin({
            collapseWhitespace: true,
            removeComments: true,
            minifyCSS: true,
            minifyJS: true
        }))
        .pipe(gulp.dest('dist'));
}

// Process JavaScript files
function processJS() {
    return gulp.src([
        'public/**/*.js',
        '!public/**/*.min.js'  // Exclude already minified files
    ], { base: 'public' })  // Preserve directory structure
        .pipe(sourcemaps.init())
        .pipe(terser({
            compress: {
                drop_console: false
            },
            mangle: {
                keep_fnames: true
            }
        }))
        .pipe(rename((path) => {
            // Only add .min if it's not already there
            if (!path.basename.endsWith('.min')) {
                path.basename += '.min';
            }
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('dist'));
}

// Process CSS files
function processCSS() {
    return gulp.src([
        'public/**/*.css',
        '!public/**/*.min.css'  // Exclude already minified files
    ], { base: 'public' })  // Preserve directory structure
        .pipe(sourcemaps.init())
        .pipe(cleanCSS())
        .pipe(rename((path) => {
            // Only add .min if it's not already there
            if (!path.basename.endsWith('.min')) {
                path.basename += '.min';
            }
        }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('dist'));
}

// Copy other assets (images, fonts, etc.)
function copyAssets() {
    return gulp.src([
        'public/**/*',
        '!public/**/*.html',
        '!public/**/*.js',
        '!public/**/*.css',
        // Include minified files that already exist in public
        'public/**/*.min.js',
        'public/**/*.min.css'
    ], { base: 'public' })  // Preserve directory structure
        .pipe(gulp.dest('dist'));
}

// Watch for changes
function watchFiles() {
    gulp.watch('public/**/*.html', processHTML);
    gulp.watch('public/**/*.js', processJS);
    gulp.watch('public/**/*.css', processCSS);
    gulp.watch([
        'public/**/*',
        '!public/**/*.html',
        '!public/**/*.js',
        '!public/**/*.css'
    ], copyAssets);
}

// Define complex tasks
const build = gulp.series(
    cleanDist,
    gulp.parallel(processHTML, processJS, processCSS, copyAssets)
);

// Pre-deploy task that ensures a clean build
function preDeploy(done) {
    // Clean dist directory
    cleanDist();
    // Run the build
    build();
    // Add a deployment message
    const deployMessage = `Deploying version ${buildId}`;
    exec("firebase deploy", (error, stdout, stderr) => {
        if (error) {
            console.error(`Deploy error: ${error}`);
            return done(error);
        }
        console.log(`Deploy output: ${stdout}`);
        done();
    });
}

// Export tasks
exports.clean = cleanDist;
exports.build = build;
exports.watch = watchFiles;
exports.deploy = preDeploy;  // New deploy task
exports.default = build; 