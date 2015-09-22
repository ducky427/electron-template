# electron

A Leiningen template for creating [Electron](https://github.com/atom/electron) based clojurescript project with support for [Reagent](https://reagent-project.github.io/).

This template is heavily based on the work done by Shaun LeBron and Chris Oakman on the [cuttle](https://github.com/oakmac/cuttle) project.

## Usage

Create a new application project:

```
lein new electron <name>
```

## Features

* [Figwheel](https://github.com/bhauman/lein-figwheel) support.
* For production, platform specific binary produced for Mac OSX (.app) and Windows (.exe). Its further possible to creat a Setup exe and an installer DMG.
* Bower support for front-end dependencies and NPM support for node dependencies.
* Basic application menu in the generated electron app.
* Grunt task for checking of outdated cljs/node/bower dependencies.

See app's [README.md](/resources/leiningen/new/electron/README.md) for more details.

## Requirements

* JDK 1.7+
* Leiningen 2.x

## License

Copyright © 2015 Rohit Aggarwal

Distributed under the The MIT License (MIT).

