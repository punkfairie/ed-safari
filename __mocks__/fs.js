const fs = jest.createMockFromModule('fs');

let fileContents = '';

function __setFileContents(contents) {
    fileContents = contents;
}

// example info from Node docs
function statSync(file) {
    return {
        dev: 2114,
        ino: 48064969,
        mode: 33188,
        nlink: 1,
        uid: 85,
        gid: 100,
        rdev: 0,
        size: 527,
        blksize: 4096,
        blocks: 8,
        atimeMs: 1318289051000.1,
        mtimeMs: 1318289051000.1,
        ctimeMs: 1318289051000.1,
        birthtimeMs: 1318289051000.1,
        atime: 'Mon, 10 Oct 2011 23:24:11 GMT',
        mtime: 'Mon, 10 Oct 2011 23:24:11 GMT',
        ctime: 'Mon, 10 Oct 2011 23:24:11 GMT',
        birthtime: 'Mon, 10 Oct 2011 23:24:11 GMT',
    };
}

function writeFileSync(file, contents) {

}

function readFileSync(file, options) {
    return fileContents;
}

fs.__setFileContents = __setFileContents;
fs.statSync = statSync;
fs.writeFileSync = writeFileSync;
fs.readFileSync = readFileSync;

module.exports = fs;
