'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Protocol = function Protocol() {
  _classCallCheck(this, Protocol);
};

Protocol.MASK_DELETE_ON_EXIT = 1 << 0;
Protocol.MASK_EXCLUSIVE = 1 << 1;

Protocol.MEMORY = 'memory';
Protocol.DISK = 'disk';
Protocol.DB = 'db';

exports.default = Protocol;