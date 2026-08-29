const { runDriverCode } = require("../utils/pistonRunner");
module.exports = (code, input) => runDriverCode(code, "python", input);