"use strict";
/**
 * Metigan - Email Sending Library
 * Main entry point
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetiganError = exports.Metigan = exports.default = void 0;
// Re-export main class and types
var metigan_1 = require("./lib/metigan");
Object.defineProperty(exports, "default", { enumerable: true, get: function () { return __importDefault(metigan_1).default; } });
Object.defineProperty(exports, "Metigan", { enumerable: true, get: function () { return metigan_1.Metigan; } });
var errors_1 = require("./lib/errors");
Object.defineProperty(exports, "MetiganError", { enumerable: true, get: function () { return errors_1.MetiganError; } });
