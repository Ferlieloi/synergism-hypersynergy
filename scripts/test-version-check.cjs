const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const esbuild = require('esbuild')

const source = fs.readFileSync('src/mod/class/hs-core/github/hs-version-tags.ts', 'utf8')
const { code } = esbuild.transformSync(source, { loader: 'ts', format: 'cjs' })
const moduleObject = { exports: {} }
vm.runInNewContext(code, { module: moduleObject, exports: moduleObject.exports })
const { latestStableVersionTag, isCurrentVersionLatest } = moduleObject.exports

const latest = latestStableVersionTag([
  { name: 'v2.14.3-dev' },
  { name: 'v2.14.2-dev' },
  { name: 'v2.14.3' },
  { name: 'v2.14.0a' },
  { name: 'not-a-version' }
])
assert.equal(latest, 'v2.14.3')
assert.equal(isCurrentVersionLatest('v2.14.3', latest), true)

assert.equal(latestStableVersionTag([
  { name: 'v2.14.4-dev' },
  { name: 'v2.14.4-rc1' },
  { name: 'v2.14.3' }
]), 'v2.14.3')
assert.equal(latestStableVersionTag([{ name: 'v2.14.4-dev' }]), null)
assert.equal(isCurrentVersionLatest('v2.14.3', 'v2.14.4'), false)
assert.equal(isCurrentVersionLatest('v2.14.3-dev', 'v2.14.3'), true)
assert.equal(isCurrentVersionLatest('v2.14.2-dev', 'v2.14.3'), false)
assert.equal(latestStableVersionTag([{ name: 'v2.14.3' }, { name: 'v2.14.3a' }]), 'v2.14.3a')

console.log('Version check regression cases passed.')
