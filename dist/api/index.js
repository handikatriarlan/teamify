"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const main_1 = require("../src/main");
const server = (0, main_1.bootstrap)();
async function handler(req, res) {
    const instance = await server;
    instance(req, res);
}
//# sourceMappingURL=index.js.map