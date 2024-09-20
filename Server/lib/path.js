const path = require("path");

/**
 * Check if a path contains another path
 * @param {string} target The path to check if it contains the other path
 * @param {string} contained The path to check if it is contained in the other path
 * @returns {boolean} True if the target path contains the contained path, false otherwise
 */
function pathContains(target, contained) {
    const targetResolved = path.resolve(target);
    const containedResolved = path.resolve(contained);

    return targetResolved.includes(containedResolved);
}

module.exports = {
    pathContains,
};
