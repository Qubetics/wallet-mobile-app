const f = global.fetch.bind(global);
module.exports = f;
module.exports.default = f;
module.exports.fetch = f;
module.exports.Headers = global.Headers;
module.exports.Request = global.Request;
module.exports.Response = global.Response;
