const { finished } = require('stream/promises')

async function createPackageAndWait(asar, sourceDir, archivePath) {
    // @electron/asar currently resolves createPackage with the output stream
    // immediately after calling end(). Wait for the stream to close before
    // moving or deleting the folder containing the archive on Windows.
    const output = await asar.createPackage(sourceDir, archivePath)
    if (output && typeof output.on === 'function') await finished(output)
}

module.exports = { createPackageAndWait }
