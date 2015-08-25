
# {{name}}

## Requirements

* JDK 1.7+
* Leiningen 2.5.1
* io.js 3.1.0 [This is done to match the verion of io.js being used in Electron v0.31.0]
* [NSIS](http://nsis.sourceforge.net/) (*Windows only*)

On Mac/Linux, installing io.js using [Node Version Manager](https://github.com/creationix/nvm) is recommended.

This project uses Electron v0.31.0. Please check [Electron's GH site](https://github.com/atom/electron) for the latest version. The version is specified in `Gruntfile.js` under the `Grunt Config` section.

## Setup

On Mac/Linux:

```
scripts/setup.sh
```

On Windows:

```
scripts\setup.bat
```

This will install the node dependencies for the project, along with grunt and bower and will also run `grunt setup`.


## Development mode

Start the figwheel server:

```
lein figwheel
```

If you are on OSX/Linux and have `rlwrap` installed, you can start the figwheel server with:

```
rlwrap lein figwheel
```

This will give better readline support.

More about [figwheel](https://github.com/bhauman/lein-figwheel) here.


In another terminal window, launch the electron app:

```
grunt launch
```

You can edit the `src/cljs/{{sanitized}}/core.cljs` file and the changes should show up in the electron app without the need to re-launch.

## Dependencies

Node dependencies are in `package.json` file. Bower dependencies are in `bower.json` file. Clojure/ClojureScript dependencies are in `project.clj`.


## Icons

Please replace the icons provided with your application's icons. The development icons are from [node-appdmg](https://github.com/LinusU/node-appdmg) project.

Files to replace:

* app/img/logo.icns
* app/img/logo.ico
* app/img/logo_96x96.png
* scripts/dmg/TestBkg.png
* scripts/dmg/TestBkg@2x.png

## Building for release

On windows before doing a production build, please edit the `scripts/build-windows-exe.nsi` file. The file is the script for creating the NSIS based setup file.

On Mac OSX, please edit the variables for the plist in `finalizeMacRelease` function in `Gruntfile.js`.

To build platform specific release file:

```
grunt fresh-release
```

This will create the binary in the `builds` folder.

Note: you will need to be on OSX to create a DMG file and on Windows to create the setup .exe file.


## Grunt commands

To run a command, type `grunt <command>` in the terminal.


| Command       | Description                                                                               |
|---------------|-------------------------------------------------------------------------------------------|
| setup         | Download electron project, installs bower dependencies and setups up the app config file. |
| launch        | Launches the electron app                                                                 |
| fresh-release | Creates a platform specific binary installer                                              |
| outdated      | List all outdated clj/cljs/node/bower dependencies                                        |

## Leiningen commands

To run a command, type `lein <command>` in the terminal.

| Command       | Description                                                                               |
|---------------|-------------------------------------------------------------------------------------------|
| cljfmt fix    | Auto-formats all clj/cljs code. See [cljfmt](https://github.com/weavejester/cljfmt)       |
| kibit         | Statically analyse clj/cljs and give suggestions                                          |
