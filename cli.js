#!/usr/bin/env node
const debug = require('debug')('flextag-cli')
const got = require('got-integrity')
const jsonic = require('jsonic')
const streamString = require('stream-string')
const fs = require('fs')
const tty = require('tty')
const yargs = require('yargs')
// for now do them separately
const flextagParser = require('flextag-parser')

yargs // eslint-disable-line
  .usage('$0 [options] [command]')
  .options('input-from', {
    alias: 'i',
    describe: 'filename or URL to read input from'
  })
  .option('output-to', {
    alias: 'o',
    describe: 'filename to send output to, instead of stdout'
  })
  .option('format-output', {
    alias: 'f',
    describe: 'format to use for any data produced (js, json, ijson, csv)',
    default: 'console'
  })
  .command('parse [text-to-parse]', 'parse a document for statements', {}, parse)
  .strict()
  .demandCommand()
  .help()
  .argv

async function read (options) {
  let source = process.stdin
  let filename = options.i
  if (filename) {
    if (filename.match(/^https?:\/\//i)) {
      // SHOULD use live-source doc without refresh
      // and maybe live-source should allow reading from file:
      // with suitable API confirmation { allowFileAccess: true }
      const x = await got(filename)
      return x.body
    } else {
      source = fs.createReadStream(filename)
    }
  } else {
    if (tty.isatty(0)) {
      console.error('[ Reading from console until end-of-file ]')
    }
  }

  try {
    return streamString(source)
  } catch (e) {
    console.error('Error reading input:', e)
    process.exit(1)
  }
}

function write (data, options) {
  let out = []
  let format = options.f.toLowerCase()
  switch (format) {
    case 'json':
      out.push(JSON.stringify(data))
      break
    case 'ijson':
      out.push(JSON.stringify(data, null, 2))
      out.push('\n')
      break
    case 'jsonic':
      for (const i of data) {
        out.push(jsonic.stringify(i))
        out.push('\n')
      }
      break
    case 'console':
      for (const i of data) {
        console.log('%o', i)
      }
      break
    default:
      console.error('unknown output format')
      process.exit(1)
  }

  let stream = process.stdout
  if (options.o) {
    stream = fs.createWriteStream(options.o)
  }
  stream.write(out.join(''))
}

async function parse (argv) {
  // console.log(argv)
  let input = argv['text-to-parse']
  if (input === undefined) {
    input = await read(argv)
  }
  debug('parsing %o', input)
  let data = [...flextagParser.parse(input)]
  if (!argv.ast) {
    data = data.map(x => x.toString())
  }
  debug('writing %o', data)
  write(data, argv)
}
