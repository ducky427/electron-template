(ns leiningen.new.electron
  (:require [leiningen.new.templates :refer [renderer name-to-path ->files sanitize-ns]]
            [leiningen.core.main :as main]
            [clojure.java.io :as io]
            [clojure.string :as str]))

(def render (renderer "electron"))

;; From: https://github.com/http-kit/lein-template/blob/master/src/leiningen/new/http_kit.clj
(defn binary [file-name]
  (let [f     (str/join "/" ["leiningen" "new" "electron" file-name])
        res   (io/resource f)]
    (println f)
    (println res)
    (io/input-stream res)))

(defn electron
  [name]
  (let [data {:name name
              :sanitized (name-to-path name)
              :project-ns (sanitize-ns name)}]
    (main/info "Generating fresh 'lein new' electron project.")
    (->files data
             ["project.clj" (render "project.clj" data)]
             ["bower.json" (render "bower.json" data)]
             ["Gruntfile.js" (render "Gruntfile.js" data)]
             ["package.json" (render "package.json" data)]
             [".gitignore" (render ".gitignore" data)]
             [".bowerrc" (render ".bowerrc" data)]
             ["README.md" (render "README.md" data)]

             ["src/cljs/{{sanitized}}/core.cljs" (render "src/cljs/core.cljs" data)]
             ["env/dev/cljs/{{sanitized}}/dev.cljs" (render "env/dev/cljs/dev.cljs" data)]
             ["env/prod/cljs/{{sanitized}}/prod.cljs" (render "env/prod/cljs/prod.cljs" data)]
             ["externs/misc.js" (render "externs/misc.js" data)]

             ["app/app.js" (render "app/app.js" data)]
             ["app/example.config.json" (render "app/example.config.json" data)]
             ["app/index.html" (render "app/index.html" data)]
             ["app/package.json" (render "app/package.json" data)]
             ["app/prod.config.json" (render "app/prod.config.json" data)]
             ["app/img/logo.icns" (binary "app/img/logo.icns")]
             ["app/img/logo.ico" (binary "app/img/logo.ico")]
             ["app/img/logo_96x96.png" (binary "app/img/logo_96x96.png")]

             ["scripts/dmg/TestBkg.png" (binary "scripts/dmg/TestBkg.png")]
             ["scripts/dmg/TestBkg@2x.png" (binary "scripts/dmg/TestBkg@2x.png")]
             ["scripts/build-windows-exe.nsi" (render "scripts/build-windows-exe.nsi" data)]
             ["scripts/setup.bat" (render "scripts/setup.bat" data)]
             ["scripts/setup.sh" (render "scripts/setup.sh" data) :executable true]


             )))
