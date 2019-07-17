const test = require('tape')
const { spawn } = require('child_process')
const streamString = require('stream-string')

test(async (t) => {
  t.plan(2)
  const cmd = spawn('./cli.js', [ '-f', 'json', 'parse', 'Hello, World!' ])
  const stdout = await streamString(cmd.stdout)
  t.equal(stdout, '["Hello, World"]')
  cmd.on('close', (code) => {
    t.equal(code, 0)
    t.end()
  })
})

test(async (t) => {
  t.plan(2)
  const cmd = spawn('./cli.js', [
    '-f', 'ijson',
    '-i', 'https://www.w3.org/People/Sandro/tree-of-trust/alice',
    'parse' ])
  const stdout = await streamString(cmd.stdout)
  t.equal(stdout, '[\n  "I trust this: \\"https://www.w3.org/People/Sandro/tree-of-trust/bob\\"",\n  "Alice is cool"\n]\n')
  cmd.on('close', (code) => {
    t.equal(code, 0)
    t.end()
  })
})

// for any more abstract a cmd-line & the output.
