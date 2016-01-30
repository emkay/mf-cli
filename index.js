const fs = require('fs')
const path = require('path')
const homedir = require('homedir')
const level = require('level')
const sl = require('level-sublevel')
const incr = require('level-incr')
const chokidar = require('chokidar')
const watchDir = process.argv[2]
const watcher = chokidar.watch(watchDir)
const mkdirp = require('mkdirp')
const dbDir = path.resolve(homedir(process.env.USER), '.mf/db')

mkdirp.sync(dbDir)
const db = sl(level(dbDir))

function onStart () {
  fs.readdir(watchDir, (err, files) => {
    if (err) return console.error(err)
    files.forEach(file => {
      const sub = db.sublevel(path.resolve(watchDir, file))
      sub.get('add', (e, r) => {
        if (e || !r) return
        console.log('adds for ', file, r)
      })

      sub.get('change', (e, r) => {
        if (e || !r) return
        console.log('changes for ', file, r)
      })
    })
  })
}

function onAdd (p, stats) {
  const sub = incr(db.sublevel(p))
  sub.incr('add')
}

function onChange (p, stats) {
  const sub = incr(db.sublevel(p))
  sub.incr('change')
}

watcher.on('add', onAdd)
watcher.on('change', onChange)
setInterval(onStart, 2000)
