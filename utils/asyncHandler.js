// Wrapper pour gérer les exceptions dans les fonctions asynchrones
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

module.exports = asyncHandler

