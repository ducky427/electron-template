module.exports = function(grunt) {
'use strict';

var moment = require('moment'),
      path = require('path'),
        fs = require('fs-plus'),
      asar = require('asar');

var os = (function(){
  var platform = process.platform;
  if (/^win/.test(platform))    { return "windows"; }
  if (/^darwin/.test(platform)) { return "mac"; }
  if (/^linux/.test(platform))  { return "linux"; }
  return null;
})();

var exe = {
  windows:  "electron.exe",
  mac:  "Electron.app/Contents/MacOS/Electron",
  linux:  "electron"
};

var electron_path = "electron";

//------------------------------------------------------------------------------
// ShellJS
//------------------------------------------------------------------------------

require('shelljs/global');
// shelljs/global makes the following imports:
//   cwd, pwd, ls, find, cp, rm, mv, mkdir, test, cat,
//   str.to, str.toEnd, sed, grep, which, echo,
//   pushd, popd, dirs, ln, exit, env, exec, chmod,
//   tempdir, error

var shellconfig = require('shelljs').config;
shellconfig.silent = false; // hide shell cmd output?
shellconfig.fatal = false;   // stop if cmd failed?

//------------------------------------------------------------------------------
// Grunt Config
//------------------------------------------------------------------------------


grunt.initConfig({

  'download-electron': {
    version: '0.30.3',
    outputDir: 'electron'
  }

});

//------------------------------------------------------------------------------
// Third-party tasks
//------------------------------------------------------------------------------


grunt.loadNpmTasks('grunt-download-electron');
if (os === "mac") {
  grunt.loadNpmTasks('grunt-appdmg');
}
grunt.loadNpmTasks('winresourcer');

//------------------------------------------------------------------------------
// Setup Tasks
//------------------------------------------------------------------------------

grunt.registerTask('setup', [
  'download-electron',
  'ensure-config-exists',
  'run-app-bower'
]);

grunt.registerTask('ensure-config-exists', function() {
  pushd("app");
  if (!test("-f", "config.json")) {
    grunt.log.writeln("Creating default config.json...");
    cp("example.config.json", "config.json");
  }
  popd();
});

grunt.registerTask('run-app-bower', function() {
  exec("bower install");
});

grunt.registerTask('cljsbuild-prod', function() {
  grunt.log.writeln("\nCleaning and building ClojureScript production files...");
  exec("lein do clean, with-profile production cljsbuild once");
});

grunt.registerTask('launch', function(async) {
  var IsAsync = (async == "true");
  grunt.log.writeln("\nLaunching development version...");
  var local_exe = exe[os];
  exec(path.join(electron_path, local_exe) + " app", {async:IsAsync});
});

grunt.registerTask('check-old', function() {
  grunt.log.writeln("\nChecking clojure dependencies");
  exec("lein ancient :all", {silent:false});
  grunt.log.writeln("\nChecking npm dependencies");
  exec("node_modules/npm-check-updates/bin/npm-check-updates -g", {silent:false});
  exec("node_modules/.bin/npm-check-updates", {silent:false});
  grunt.log.writeln("\nChecking bower dependencies");
  exec("bower list", {silent:false});
});

//------------------------------------------------------------------------------
// Release
//------------------------------------------------------------------------------

grunt.registerTask('release', function() {

  var build = getBuildMeta();
  var paths = getReleasePaths(build);
  var done = this.async();

  prepRelease(                   build, paths);
  copyElectronAndBuildToRelease( build, paths);
  setReleaseConfig(              build, paths);
  installNodeDepsToRelease(      build, paths);
  stampRelease(                  build, paths);
  makeAsarRelease(               build, paths, done);

});

grunt.registerTask('fresh-release', ['cljsbuild-prod', 'release']);

//------------------------------------------------------------------------------
// Release - config
//------------------------------------------------------------------------------

var electronShell = {
  windows: {
    exeToRename: "electron.exe",
    renamedExe:  "{{name}}.exe",
    resources:   "resources",
    installExt:  "exe"
  },
  mac: {
    exeToRename: "Electron.app",
    renamedExe:  "{{name}}.app",
    plist:       "Electron.app/Contents/Info.plist",
    resources:   "Electron.app/Contents/Resources",
    installExt:  "dmg"
  },
  linux: {
    exeToRename: "electron",
    renamedExe:  "{{name}}",
    resources:   "resources"
  }
}[os];

function getBuildMeta() {
  grunt.log.writeln("Getting project metadata...");
  var tokens = cat("project.clj").split(" ");
  var build = {
    name:    tokens[1],
    version: tokens[2].replace(/"/g, "").trim(),
    date:    moment().format("YYYY-MM-DD"),
    commit:  exec("git rev-list HEAD --count", {silent:true}).output.trim()
  };
  build.releaseName = build.name + "-v" + build.version + "-" + os;
  grunt.log.writeln("name:    "+build.name.cyan);
  grunt.log.writeln("version: "+build.version.cyan);
  grunt.log.writeln("date:    "+build.date.cyan);
  grunt.log.writeln("commit:  "+build.commit.cyan);
  grunt.log.writeln("release: "+build.releaseName.cyan);
  return build;
}

function getReleasePaths(build) {
  var paths = {
    electron: "electron",
    builds: "builds",
    devApp: "app",
    rootPkg: "package.json"
  };
  paths.release = path.join(paths.builds, build.releaseName);
  paths.resources = path.join(paths.release, electronShell.resources);
  paths.install = paths.release + "." + electronShell.installExt;
  paths.releaseApp = paths.resources + path.sep + paths.devApp;
  paths.devPkg = paths.devApp + "/package.json";
  paths.prodCfg = paths.devApp + "/prod.config.json";
  paths.releasePkg = paths.releaseApp + "/package.json";
  paths.releaseCfg = paths.releaseApp + "/config.json";
  paths.exeToRename = path.join(paths.release, electronShell.exeToRename);
  paths.renamedExe = path.join(paths.release, electronShell.renamedExe);
  paths.releaseResources = path.join(paths.resources, paths.devApp, "components");
  return paths;
}

//------------------------------------------------------------------------------
// Release - subtasks
//------------------------------------------------------------------------------

function prepRelease(build, paths) {
  grunt.log.writeln("\nCleaning previous release...");
  mkdir('-p', paths.builds);
  rm('-rf', paths.install, paths.release);
}

function copyElectronAndBuildToRelease(build, paths) {
  grunt.log.writeln("\nCopying Electron and {{name}} to release folder...");
  grunt.log.writeln(paths.electron + " ==> " + paths.release.cyan);
  grunt.log.writeln(paths.devApp + " ==> " + paths.resources.cyan);
  cp('-r', paths.electron + "/", paths.release);
  cp('-r', paths.devApp, paths.resources);

  //delete extra resources

  rm('-rf', path.join(paths.releaseApp, "js", "p", "out"));

}

function setReleaseConfig(build, paths) {
  grunt.log.writeln("\nRemoving config to force default release settings...");
  rm('-f', paths.releaseCfg);
  cp(paths.prodCfg, paths.releaseCfg);
}

function installNodeDepsToRelease(build, paths) {
  grunt.log.writeln("\nCopying node dependencies to release...");
  cp('-f', paths.rootPkg, paths.releaseApp);
  pushd(paths.releaseApp);
  exec('npm install --no-optional --production');
  popd();
  cp('-f', paths.devPkg, paths.releaseApp);
}

function makeAsarRelease(build, paths, done) {
  var new_path = path.join(paths.releaseApp, "..", "app.asar");
  grunt.log.writeln("Release: " + paths.releaseApp + ", Asar: " + new_path);
  asar.createPackage(paths.releaseApp, new_path , function(err) {
    grunt.log.writeln("Asar file created.");
    cp(path.join(paths.releaseApp, "img", "logo.icns"), paths.resources);
    rm('-rf', path.join(paths.releaseApp));
    switch (os) {
      case "mac":     finalizeMacRelease(     build, paths); break;
      case "linux":   finalizeLinuxRelease(   build, paths); break;
      case "windows": finalizeWindowsRelease( build, paths); break;
    }
    done(err);
  });
}

function stampRelease(build, paths) {
  grunt.log.writeln("\nStamping release with build metadata...");
  var pkg = grunt.file.readJSON(paths.releasePkg);
  pkg.version = build.version;
  pkg["build-commit"] = build.commit;
  pkg["build-date"] = build.date;
  JSON.stringify(pkg, null, "  ").to(paths.releasePkg);
}

function updateVersionInReadme(build, paths) {
  grunt.log.writeln("\nUpdating version and download links in readme...");
  sed('-i', /v\d+\.\d+/g, "v"+build.version, "README.md");
}

//------------------------------------------------------------------------------
// Release - finalization
//------------------------------------------------------------------------------

function finalizeMacRelease(build, paths) {

  grunt.log.writeln("\nChanging Electron app icon and bundle name...");
  var plist = path.join(__dirname, paths.release, electronShell.plist);
  exec("defaults write " + plist + " CFBundleIconFile logo.icns");
  exec("defaults write " + plist + " CFBundleDisplayName {{name}}");
  exec("defaults write " + plist + " CFBundleName {{name}}");
  exec("defaults write " + plist + " CFBundleIdentifier com.example");
  mv(paths.exeToRename, paths.renamedExe);
  var app = paths.renamedExe;

  grunt.log.writeln("\nCreating dmg image...");
  grunt.config.set("appdmg", {
    options: {
      "title": "{{name}}",
      "background": "scripts/dmg/TestBkg.png",
      "icon-size": 80,
      "contents": [
        { "x": 448, "y": 344, "type": "link", "path": "/Applications" },
        { "x": 192, "y": 344, "type": "file", "path": app }
      ]
    },
    target: {
      dest: paths.install
    }
  });
  grunt.task.run("appdmg");
}

function finalizeLinuxRelease(build, paths) {
  mv(paths.exeToRename, paths.renamedExe);
}

function finalizeWindowsRelease(build, paths) {
  grunt.log.writeln("\nChanging electron app icon and bundle name...");
  mv(paths.exeToRename, paths.renamedExe);
  var app = paths.renamedExe;
  grunt.config.set("winresourcer", {
    main: {
      operation: "Update",
      exeFile: app,
      resourceType: "Icongroup",
      resourceName: "1",
      resourceFile: "app/img/logo.ico"
    }
  });
  grunt.task.run("winresourcer");

  grunt.config.set("makensis", {
    version:    build.version,
    releaseDir: paths.release,
    outFile:    paths.install
  });
  grunt.task.run("makensis");
}

grunt.registerTask('makensis', function() {
  grunt.log.writeln("\nCreating installer...");
  var config = grunt.config.get("makensis");
  exec(["makensis",
    "/DPRODUCT_VERSION=" + config.version,
    "/DRELEASE_DIR=../" + config.releaseDir,
    "/DOUTFILE=../" + config.outFile,
    "scripts/build-windows-exe.nsi"].join(" "));
});

//------------------------------------------------------------------------------
// Test Tasks
//------------------------------------------------------------------------------


//------------------------------------------------------------------------------
// Default Task
//------------------------------------------------------------------------------

grunt.registerTask('default', ['setup']);

// end module.exports
};
