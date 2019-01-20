var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
define("models/vector", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("models/movable", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("models/drawable", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("models/updatable", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("models/observable", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Observable = (function () {
        function Observable() {
            this.events = new Map();
        }
        Observable.prototype.on = function (event, fn) {
            if (!this.events.has(event)) {
                this.events.set(event, []);
            }
            this.events.get(event).push(fn);
        };
        Observable.prototype.once = function (event, fn) {
            if (this.events.has(event)) {
                return;
            }
            this.events.set(event, [fn]);
        };
        Observable.prototype.off = function (event) {
            this.events.delete(event);
        };
        Observable.prototype.emit = function (event) {
            var _this = this;
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            var events = this.events.get(event);
            if (events) {
                events.forEach(function (event) { return event.apply(_this, args); });
            }
        };
        return Observable;
    }());
    exports.Observable = Observable;
});
define("models/destroyable", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("models/character", ["require", "exports", "models/observable"], function (require, exports, observable_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.REGISTER = Symbol('register');
    exports.DEREGISTER = Symbol('deregister');
    var Character = (function (_super) {
        __extends(Character, _super);
        function Character(obs, x, y) {
            var _this = _super.call(this) || this;
            _this.alpha = 1;
            _this.friction = 0.95;
            _this.theta = 0;
            _this.velocity = 1;
            _this.id = Symbol(_this.constructor.name);
            _this.obs = obs;
            _this.x = x;
            _this.y = y;
            _this.obs.emit(exports.REGISTER, _this);
            return _this;
        }
        Character.prototype.draw = function (_) {
            throw new Error('draw not implemented');
        };
        Character.prototype.update = function () {
            if (!this.velocity) {
                return;
            }
            this.x += Math.cos(this.theta) * this.velocity;
            this.y += Math.sin(this.theta) * this.velocity;
            if (this.friction > 0) {
                this.velocity *= this.friction;
            }
        };
        Character.prototype.destroy = function () {
            this.obs.emit(exports.DEREGISTER, this);
            this.emit(exports.DEREGISTER, this);
        };
        return Character;
    }(observable_1.Observable));
    exports.Character = Character;
    var SphereCharacter = (function (_super) {
        __extends(SphereCharacter, _super);
        function SphereCharacter(obs, x, y, radius, isFilled) {
            if (isFilled === void 0) { isFilled = true; }
            var _this = _super.call(this, obs, x, y) || this;
            _this.color = 'white';
            _this.radius = radius;
            _this.isFilled = isFilled;
            return _this;
        }
        SphereCharacter.prototype.draw = function (ctx) {
            var _a = this, x = _a.x, y = _a.y, radius = _a.radius, color = _a.color;
            ctx.save();
            ctx.translate(x, y);
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2, false);
            if (this.isFilled) {
                ctx.fillStyle = color;
                ctx.fill();
            }
            else {
                ctx.strokeStyle = color;
                ctx.stroke();
            }
            ctx.closePath();
            ctx.restore();
        };
        return SphereCharacter;
    }(Character));
    exports.SphereCharacter = SphereCharacter;
    var RectangleCharacter = (function (_super) {
        __extends(RectangleCharacter, _super);
        function RectangleCharacter(obs, x, y, width, height) {
            var _this = _super.call(this, obs, x, y) || this;
            _this.color = 'white';
            _this.width = width;
            _this.height = height;
            return _this;
        }
        RectangleCharacter.prototype.draw = function (ctx) {
            var _a = this, x = _a.x, y = _a.y, width = _a.width, height = _a.height, color = _a.color;
            ctx.save();
            ctx.translate(x, y);
            ctx.beginPath();
            ctx.rect(0, 0, width, height);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.closePath();
            ctx.restore();
        };
        return RectangleCharacter;
    }(Character));
    exports.RectangleCharacter = RectangleCharacter;
});
define("utils/math2", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Math2 = (function () {
        function Math2() {
        }
        Math2.thetaToDegree = function (theta) {
            return (theta * Math.PI) / 2;
        };
        Math2.degreeToTheta = function (degree) {
            return (degree * Math.PI) / 180;
        };
        Math2.random = function (min, max) {
            return Math.floor(Math.random() * max) + min;
        };
        Math2.angle = function (x1, y1, x2, y2) {
            return Math.atan2(y2 - y1, x2 - x1);
        };
        Math2.angleBetween = function (p1, p2) {
            return Math.atan2(p2.y - p1.y, p2.x - p1.x);
        };
        Math2.randomTheta = function () {
            return Math2.random(0, 2 * Math.PI);
        };
        Math2.randomX = function () {
            return Math2.random(0, window.innerWidth);
        };
        Math2.randomY = function () {
            return Math2.random(0, window.innerHeight);
        };
        return Math2;
    }());
    exports.default = Math2;
});
define("models/bullet", ["require", "exports", "models/character"], function (require, exports, character_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Bullet = (function (_super) {
        __extends(Bullet, _super);
        function Bullet() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return Bullet;
    }(character_1.SphereCharacter));
    exports.Bullet = Bullet;
    var ShipBullet = (function (_super) {
        __extends(ShipBullet, _super);
        function ShipBullet() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.velocity = 8;
            _this.friction = 0;
            return _this;
        }
        return ShipBullet;
    }(Bullet));
    exports.ShipBullet = ShipBullet;
    var AlienBullet = (function (_super) {
        __extends(AlienBullet, _super);
        function AlienBullet() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.friction = 0;
            _this.velocity = 5;
            return _this;
        }
        return AlienBullet;
    }(Bullet));
    exports.AlienBullet = AlienBullet;
});
define("models/boundary", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Boundary = (function () {
        function Boundary(x0, x1, y0, y1) {
            if (x0 === void 0) { x0 = 0; }
            if (x1 === void 0) { x1 = window.innerWidth; }
            if (y0 === void 0) { y0 = 0; }
            if (y1 === void 0) { y1 = window.innerHeight; }
            this.x0 = x0;
            this.x1 = x1;
            this.y0 = y0;
            this.y1 = y1;
        }
        Object.defineProperty(Boundary.prototype, "midX", {
            get: function () {
                return this.x1 / 2;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Boundary.prototype, "midY", {
            get: function () {
                return this.y1 / 2;
            },
            enumerable: true,
            configurable: true
        });
        Boundary.prototype.ltX = function (x) {
            return x < this.x0;
        };
        Boundary.prototype.gtX = function (x) {
            return x > this.x1;
        };
        Boundary.prototype.ltY = function (y) {
            return y < this.y0;
        };
        Boundary.prototype.gtY = function (y) {
            return y > this.y1;
        };
        Boundary.prototype.isOutOfBound = function (x, y) {
            return this.gtX(x) || this.ltX(x) || this.gtY(y) || this.ltY(y);
        };
        Object.defineProperty(Boundary.prototype, "minX", {
            get: function () {
                return this.x0;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Boundary.prototype, "maxX", {
            get: function () {
                return this.x1;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Boundary.prototype, "minY", {
            get: function () {
                return this.y0;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Boundary.prototype, "maxY", {
            get: function () {
                return this.y1;
            },
            enumerable: true,
            configurable: true
        });
        return Boundary;
    }());
    exports.Boundary = Boundary;
    function withRepeatBoundary(boundary) {
        return function (TBase) {
            return (function (_super) {
                __extends(class_1, _super);
                function class_1() {
                    return _super !== null && _super.apply(this, arguments) || this;
                }
                class_1.prototype.update = function () {
                    _super.prototype.update.call(this);
                    var _a = this, x = _a.x, y = _a.y;
                    if (boundary.ltX(x))
                        this.x = boundary.maxX;
                    if (boundary.gtX(x))
                        this.x = boundary.minX;
                    if (boundary.ltY(y))
                        this.y = boundary.maxY;
                    if (boundary.gtY(y))
                        this.y = boundary.minY;
                };
                return class_1;
            }(TBase));
        };
    }
    exports.withRepeatBoundary = withRepeatBoundary;
    function withOutOfBound(boundary) {
        return function (TBase) {
            return (function (_super) {
                __extends(class_2, _super);
                function class_2() {
                    return _super !== null && _super.apply(this, arguments) || this;
                }
                class_2.prototype.update = function () {
                    _super.prototype.update.call(this);
                    if (boundary.isOutOfBound(this.x, this.y)) {
                        this.destroy();
                    }
                };
                return class_2;
            }(TBase));
        };
    }
    exports.withOutOfBound = withOutOfBound;
});
define("utils/time", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function sleep(duration) {
        return new Promise(function (resolve) {
            window.setTimeout(function () {
                resolve();
            }, duration);
        });
    }
    exports.sleep = sleep;
});
define("models/alien", ["require", "exports", "models/character", "utils/math2", "models/bullet", "models/boundary", "utils/time"], function (require, exports, character_2, math2_1, bullet_1, boundary_1, time_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    math2_1 = __importDefault(math2_1);
    exports.TRACK = Symbol('track');
    exports.SHOOT = Symbol('shoot');
    var Alien = (function (_super) {
        __extends(Alien, _super);
        function Alien() {
            var props = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                props[_i] = arguments[_i];
            }
            var _this = _super.apply(this, __spread(props)) || this;
            _this.friction = 0.99;
            _this.velocity = 5;
            _this.theta = math2_1.default.randomTheta();
            _this.trackers = [];
            _this.color = 'white';
            _this.programIntervalDuration = math2_1.default.random(2750, 3250);
            _this.shootDuration = 1000;
            _this.programInterval = 0;
            _this.programInterval = window.setInterval(function () { return _this.flightProgram(); }, _this.programIntervalDuration);
            _this.once(exports.TRACK, function (character) {
                _this.trackers.push(character);
            });
            _this.on(character_2.DEREGISTER, function () {
                window.clearInterval(_this.programInterval);
            });
            return _this;
        }
        Alien.prototype.flightProgram = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.friction = 0.99;
                            this.velocity = 5;
                            this.theta = math2_1.default.randomTheta();
                            this.x = math2_1.default.randomX();
                            this.y = math2_1.default.randomY();
                            this.shootProgram();
                            return [4, time_1.sleep(this.shootDuration)];
                        case 1:
                            _a.sent();
                            this.shootProgram();
                            return [2];
                    }
                });
            });
        };
        Alien.prototype.shootProgram = function () {
            var e_1, _a;
            try {
                for (var _b = __values(this.trackers), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var character = _c.value;
                    this.emit(exports.SHOOT, character);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
        };
        Alien.prototype.draw = function (ctx) {
            var _a = this, x = _a.x, y = _a.y, alpha = _a.alpha, color = _a.color;
            ctx.save();
            ctx.translate(x, y);
            ctx.beginPath();
            ctx.moveTo(-15, -3);
            ctx.bezierCurveTo(-20, -15, 20, -15, 15, -3);
            ctx.strokeStyle = color;
            ctx.globalAlpha = alpha;
            ctx.stroke();
            ctx.closePath();
            ctx.beginPath();
            ctx.rect(-20, -3, 40, 3);
            ctx.strokeStyle = color;
            ctx.globalAlpha = alpha;
            ctx.stroke();
            ctx.closePath();
            ctx.beginPath();
            ctx.moveTo(20, 0);
            ctx.lineTo(30, 5);
            ctx.lineTo(-30, 5);
            ctx.lineTo(-20, 0);
            ctx.moveTo(15, 5);
            ctx.lineTo(18, 10);
            ctx.moveTo(-15, 5);
            ctx.lineTo(-18, 10);
            ctx.strokeStyle = color;
            ctx.globalAlpha = alpha;
            ctx.stroke();
            ctx.closePath();
            ctx.restore();
            ctx.save();
            ctx.translate(x, y);
            ctx.beginPath();
            var theta = this.trackers.length
                ? math2_1.default.angleBetween(this, this.trackers[0])
                : 0;
            ctx.arc(5 * Math.cos(theta), 5 * Math.sin(theta), 2, 0, Math.PI * 2, false);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.closePath();
            ctx.restore();
        };
        return Alien;
    }(character_2.SphereCharacter));
    exports.Alien = Alien;
    function withGun(TBase) {
        return (function (_super) {
            __extends(class_3, _super);
            function class_3() {
                var props = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    props[_i] = arguments[_i];
                }
                var _this = _super.apply(this, __spread(props)) || this;
                _this.gun = new Gun();
                _this.once(exports.SHOOT, function (character) {
                    _this.gun.shoot(_this, character);
                });
                return _this;
            }
            return class_3;
        }(TBase));
    }
    exports.withGun = withGun;
    var Gun = (function () {
        function Gun() {
            this.bullets = new Map();
            this.maxAmmo = 5;
        }
        Gun.prototype.shoot = function (character, target) {
            var _this = this;
            if (this.bullets.size >= this.maxAmmo) {
                return;
            }
            var x = character.x, y = character.y, obs = character.obs;
            var radius = 2;
            var bounded = boundary_1.withOutOfBound(new boundary_1.Boundary());
            var bullet = new (bounded(bullet_1.AlienBullet))(obs, x, y, radius);
            bullet.theta = math2_1.default.angleBetween(character, target);
            bullet.once(character_2.DEREGISTER, function (character) {
                character.off(character_2.DEREGISTER);
                _this.bullets.delete(character.id);
            });
            this.bullets.set(bullet.id, bullet);
        };
        return Gun;
    }());
});
define("models/asteroid", ["require", "exports", "models/character", "utils/math2"], function (require, exports, character_3, math2_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    math2_2 = __importDefault(math2_2);
    var Asteroid = (function (_super) {
        __extends(Asteroid, _super);
        function Asteroid() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.friction = 0;
            _this.velocity = math2_2.default.random(0.5, 2);
            _this.theta = math2_2.default.randomTheta();
            return _this;
        }
        return Asteroid;
    }(character_3.SphereCharacter));
    exports.Asteroid = Asteroid;
});
define("models/weaponize", ["require", "exports", "models/character", "models/bullet", "models/boundary"], function (require, exports, character_4, bullet_2, boundary_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SHOOT = Symbol('shoot');
    exports.SWAP_WEAPON = Symbol('swap_weapon');
    var Gun = (function () {
        function Gun(ammo) {
            this.ammo = ammo;
            this.bullets = new Map();
        }
        Gun.prototype.shoot = function (character) {
            var _this = this;
            if (this.bullets.size >= this.ammo) {
                return;
            }
            var x = character.x, y = character.y, theta = character.theta, obs = character.obs;
            var radius = 2;
            var bounded = boundary_2.withOutOfBound(new boundary_2.Boundary());
            var bullet = (new (bounded(bullet_2.ShipBullet))(obs, x, y, radius, true, this));
            bullet.theta = theta;
            bullet.once(character_4.DEREGISTER, function (character) {
                character.off(character_4.DEREGISTER);
                _this.bullets.delete(character.id);
            });
            this.bullets.set(bullet.id, bullet);
        };
        Gun.prototype.draw = function (ctx) {
            var e_2, _a;
            try {
                for (var _b = __values(this.bullets), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var _d = __read(_c.value, 2), bullet = _d[1];
                    bullet.draw(ctx);
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_2) throw e_2.error; }
            }
        };
        Gun.prototype.update = function () { };
        return Gun;
    }());
    exports.Gun = Gun;
    var Laser = (function () {
        function Laser(seconds) {
            this.seconds = seconds;
            this.beam = null;
            this.character = null;
        }
        Laser.prototype.shoot = function (character) {
            var _this = this;
            if (this.beam) {
                return;
            }
            this.character = character;
            var x = character.x, y = character.y, radius = character.radius, theta = character.theta, obs = character.obs;
            var beam = new Beam(obs, x, y, -1, -1);
            beam.radius = radius;
            beam.theta = theta;
            this.beam = beam;
            setTimeout(function () {
                character.obs.emit(character_4.DEREGISTER, _this.beam);
                _this.beam = null;
            }, this.seconds);
        };
        Laser.prototype.draw = function (ctx) {
            this.beam && this.beam.draw(ctx);
        };
        Laser.prototype.update = function () {
            if (!this.beam) {
                return;
            }
            if (!this.character) {
                return;
            }
            this.beam.x = this.character.x;
            this.beam.y = this.character.y;
            this.beam.theta = this.character.theta;
            this.beam && this.beam.update();
        };
        return Laser;
    }());
    exports.Laser = Laser;
    var Beam = (function (_super) {
        __extends(Beam, _super);
        function Beam() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.radius = 1;
            _this.theta = 0;
            _this.friction = 0;
            return _this;
        }
        Beam.prototype.draw = function (ctx) {
            var _a = this, x = _a.x, y = _a.y, theta = _a.theta, radius = _a.radius;
            var thetaX = Math.cos(theta);
            var thetaY = Math.sin(theta);
            ctx.save();
            ctx.translate(x, y);
            ctx.beginPath();
            ctx.moveTo(thetaX * radius, thetaY * radius);
            ctx.lineTo(thetaX * window.innerWidth, thetaY * window.innerWidth);
            ctx.lineWidth = 3;
            ctx.strokeStyle = _rainbowGradient(ctx);
            ctx.stroke();
            ctx.closePath();
            ctx.restore();
        };
        return Beam;
    }(character_4.RectangleCharacter));
    exports.Beam = Beam;
    function _rainbowGradient(ctx) {
        var gradient = ctx.createLinearGradient(10, 0, 500, 0);
        gradient.addColorStop(0, 'red');
        gradient.addColorStop(1 / 6, 'orange');
        gradient.addColorStop(2 / 6, 'yellow');
        gradient.addColorStop(3 / 6, 'green');
        gradient.addColorStop(4 / 6, 'blue');
        gradient.addColorStop(5 / 6, 'indigo');
        gradient.addColorStop(1, 'violet');
        return gradient;
    }
    function withBullets(TBase) {
        return (function (_super) {
            __extends(class_4, _super);
            function class_4() {
                var props = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    props[_i] = arguments[_i];
                }
                var _this = _super.apply(this, __spread(props)) || this;
                _this.weapons = [new Gun(10), new Laser(1000)];
                _this.selection = 0;
                _this.on(exports.SHOOT, function () { return _this.shoot(); });
                _this.on(exports.SWAP_WEAPON, function () { return _this.swapWeapon(); });
                return _this;
            }
            class_4.prototype.swapWeapon = function () {
                this.selection = (this.selection + 1) % this.weapons.length;
            };
            class_4.prototype.shoot = function () {
                var weapon = this.weapons[this.selection];
                weapon.shoot(this);
            };
            class_4.prototype.draw = function (ctx) {
                _super.prototype.draw.call(this, ctx);
                var weapon = this.weapons[this.selection];
                weapon.draw(ctx);
            };
            class_4.prototype.update = function () {
                _super.prototype.update.call(this);
                var weapon = this.weapons[this.selection];
                weapon.update();
            };
            return class_4;
        }(TBase));
    }
    exports.withBullets = withBullets;
});
define("models/damageable", ["require", "exports", "models/character"], function (require, exports, character_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DAMAGE = 'damage';
    exports.HEALTH_ZERO = 'health_zero';
    function withHealthBar(invicibility) {
        return function (TBase) {
            return (function (_super) {
                __extends(class_5, _super);
                function class_5() {
                    var props = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        props[_i] = arguments[_i];
                    }
                    var _this = _super.apply(this, __spread(props)) || this;
                    _this.hp = 100;
                    _this.maxHp = 100;
                    _this.width = 50;
                    _this.height = 5;
                    _this.spacing = 1;
                    _this.padding = 2;
                    _this.visible = false;
                    _this.visibleTimeout = 0;
                    _this.visibleDuration = 1000;
                    _this.invisibilityMode = false;
                    _this.invisibilityDuration = 1000;
                    _this.invisibilityTimeout = 0;
                    _this.flickerTimeout = 0;
                    _this.isFlickering = false;
                    _this.alphaState = false;
                    _this.once(exports.DAMAGE, _this.damage.bind(_this));
                    return _this;
                }
                class_5.prototype.damage = function (n) {
                    var _this = this;
                    if (this.invisibilityMode) {
                        return;
                    }
                    this.hp = Math.max(0, this.hp - n);
                    if (invicibility) {
                        this.enterInvisiblityMode(this.invisibilityDuration);
                        this.flicker(this.invisibilityDuration);
                    }
                    this.visible = true;
                    this.visibleTimeout && window.clearTimeout(this.visibleTimeout);
                    this.visibleTimeout = window.setTimeout(function () {
                        _this.visible = false;
                    }, this.visibleDuration);
                    if (this.hp === 0) {
                        this.emit(exports.HEALTH_ZERO);
                        this.emit(character_5.DEREGISTER, this);
                        this.obs.emit(character_5.DEREGISTER, this);
                    }
                };
                class_5.prototype.draw = function (ctx) {
                    _super.prototype.draw.call(this, ctx);
                    if (!this.visible) {
                        return;
                    }
                    var _a = this, width = _a.width, height = _a.height, spacing = _a.spacing, padding = _a.padding, hp = _a.hp, maxHp = _a.maxHp, x = _a.x, y = _a.y;
                    var hpRatio = hp / maxHp;
                    ctx.save();
                    ctx.translate(x - width / 2, y - width / 2);
                    ctx.beginPath();
                    ctx.rect(0, 0, width, height);
                    ctx.strokeStyle = 'white';
                    ctx.stroke();
                    ctx.closePath();
                    ctx.beginPath();
                    ctx.rect(spacing, spacing, Math.max(0, hpRatio * (width - padding)), height - padding);
                    ctx.fillStyle = this.healthColor(hpRatio);
                    ctx.fill();
                    ctx.closePath();
                    ctx.restore();
                };
                class_5.prototype.update = function () {
                    _super.prototype.update.call(this);
                    this.updateFlicker();
                };
                class_5.prototype.healthColor = function (ratio) {
                    if (ratio < 0.25) {
                        return 'red';
                    }
                    if (ratio < 0.5) {
                        return 'orange';
                    }
                    return 'white';
                };
                class_5.prototype.enterInvisiblityMode = function (duration) {
                    var _this = this;
                    this.invisibilityMode = true;
                    this.invisibilityTimeout &&
                        window.clearTimeout(this.invisibilityTimeout);
                    this.invisibilityTimeout = window.setTimeout(function () {
                        _this.invisibilityMode = false;
                    }, duration);
                };
                class_5.prototype.flicker = function (duration) {
                    var _this = this;
                    this.isFlickering = true;
                    this.flickerTimeout && window.clearTimeout(this.flickerTimeout);
                    this.flickerTimeout = window.setTimeout(function () {
                        _this.isFlickering = false;
                        _this.alpha = 1;
                    }, duration);
                };
                class_5.prototype.updateFlicker = function () {
                    if (this.isFlickering) {
                        if (this.alpha > 0.1) {
                            if (!this.alphaState) {
                                this.alpha -= 0.1;
                            }
                        }
                        else {
                            this.alphaState = true;
                        }
                        if (this.alphaState) {
                            this.alpha += 0.1;
                            if (this.alpha > 0.9) {
                                this.alphaState = false;
                            }
                        }
                    }
                    else {
                        this.alpha = 1;
                    }
                };
                return class_5;
            }(TBase));
        };
    }
    exports.withHealthBar = withHealthBar;
});
define("models/particle", ["require", "exports", "models/character"], function (require, exports, character_6) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Particle = (function (_super) {
        __extends(Particle, _super);
        function Particle(obs, x, y, radius, theta) {
            var _this = _super.call(this, obs, x, y, radius) || this;
            _this.velocity = -0.5;
            _this.friction = 0.95;
            _this.theta = theta;
            return _this;
        }
        Particle.prototype.update = function () {
            this.radius -= 0.1;
            if (this.radius <= 0) {
                this.radius = 0;
                this.obs.emit(character_6.DEREGISTER, this);
                return;
            }
            _super.prototype.update.call(this);
        };
        return Particle;
    }(character_6.SphereCharacter));
    exports.Particle = Particle;
});
define("models/keycode", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var KeyCode;
    (function (KeyCode) {
        KeyCode[KeyCode["Down"] = 40] = "Down";
        KeyCode[KeyCode["Enter"] = 13] = "Enter";
        KeyCode[KeyCode["Left"] = 37] = "Left";
        KeyCode[KeyCode["Pause"] = 80] = "Pause";
        KeyCode[KeyCode["Right"] = 39] = "Right";
        KeyCode[KeyCode["Shift"] = 16] = "Shift";
        KeyCode[KeyCode["Space"] = 32] = "Space";
        KeyCode[KeyCode["Up"] = 38] = "Up";
    })(KeyCode || (KeyCode = {}));
    exports.default = KeyCode;
});
define("models/controller", ["require", "exports", "models/observable", "models/keycode"], function (require, exports, observable_2, keycode_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    keycode_1 = __importDefault(keycode_1);
    exports.UP = Symbol('up');
    exports.DOWN = Symbol('down');
    exports.LEFT = Symbol('left');
    exports.RIGHT = Symbol('right');
    exports.SPACE = Symbol('space');
    exports.SHIFT = Symbol('shift');
    exports.ENTER = Symbol('enter');
    var Controller = (function (_super) {
        __extends(Controller, _super);
        function Controller() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return Controller;
    }(observable_2.Observable));
    exports.Controller = Controller;
    var KeyboardController = (function (_super) {
        __extends(KeyboardController, _super);
        function KeyboardController() {
            var _this = _super.call(this) || this;
            _this.handler = _this.bindEvents.bind(_this);
            document.addEventListener('keydown', _this.handler, false);
            return _this;
        }
        KeyboardController.prototype.bindEvents = function (evt) {
            evt.keyCode === keycode_1.default.Up && this.emit(exports.UP);
            evt.keyCode === keycode_1.default.Left && this.emit(exports.LEFT);
            evt.keyCode === keycode_1.default.Right && this.emit(exports.RIGHT);
            evt.keyCode === keycode_1.default.Shift && this.emit(exports.SHIFT);
            evt.keyCode === keycode_1.default.Space && this.emit(exports.SPACE);
            evt.keyCode === keycode_1.default.Enter && this.emit(exports.ENTER);
        };
        return KeyboardController;
    }(Controller));
    exports.KeyboardController = KeyboardController;
});
define("models/teleportable", ["require", "exports", "models/character", "models/particle", "utils/math2"], function (require, exports, character_7, particle_1, math2_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    math2_3 = __importDefault(math2_3);
    exports.TELEPORT = Symbol('teleport');
    function makeParticles(obs, count, posX, posY) {
        var radian = (2 * Math.PI) / count;
        return Array(count)
            .fill(null)
            .map(function (_, i) {
            var theta = i * radian;
            var spread = 20;
            var radius = 2;
            var x = posX + spread * Math.cos(theta);
            var y = posY + spread * Math.sin(theta);
            return new particle_1.Particle(obs, x, y, radius, theta);
        });
    }
    exports.makeParticles = makeParticles;
    function withTeleport(TBase) {
        return (function (_super) {
            __extends(class_6, _super);
            function class_6() {
                var props = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    props[_i] = arguments[_i];
                }
                var _this = _super.apply(this, __spread(props)) || this;
                _this.particles = [];
                _this.on(exports.TELEPORT, function () { return _this.teleport(); });
                return _this;
            }
            class_6.prototype.teleport = function () {
                var _a = this, x = _a.x, y = _a.y;
                this.x = math2_3.default.random(0, window.innerWidth);
                this.y = math2_3.default.random(0, window.innerHeight);
                this.particles = makeParticles(this.obs, 12, x, y);
            };
            class_6.prototype.draw = function (ctx) {
                _super.prototype.draw.call(this, ctx);
                this.particles.forEach(function (particle) { return particle.draw(ctx); });
            };
            class_6.prototype.update = function () {
                var e_3, _a;
                _super.prototype.update.call(this);
                if (!this.particles.length) {
                    return;
                }
                var radius = this.particles[0].radius;
                if (!radius) {
                    var particles = this.particles;
                    try {
                        for (var particles_1 = __values(particles), particles_1_1 = particles_1.next(); !particles_1_1.done; particles_1_1 = particles_1.next()) {
                            var particle = particles_1_1.value;
                            this.obs.emit(character_7.DEREGISTER, particle);
                        }
                    }
                    catch (e_3_1) { e_3 = { error: e_3_1 }; }
                    finally {
                        try {
                            if (particles_1_1 && !particles_1_1.done && (_a = particles_1.return)) _a.call(particles_1);
                        }
                        finally { if (e_3) throw e_3.error; }
                    }
                    this.particles = [];
                    return;
                }
                this.particles.forEach(function (particle) { return particle.update(); });
            };
            return class_6;
        }(TBase));
    }
    exports.withTeleport = withTeleport;
});
define("models/ship", ["require", "exports", "models/character", "models/controller", "models/weaponize", "models/teleportable", "utils/math2"], function (require, exports, character_8, controller_1, weaponize_1, teleportable_1, math2_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    math2_4 = __importDefault(math2_4);
    var Ship = (function (_super) {
        __extends(Ship, _super);
        function Ship() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.theta = 0;
            _this.velocity = 1;
            _this.color = 'white';
            _this.friction = 0.95;
            _this.speed = 8;
            _this.rotation = math2_4.default.degreeToTheta(10);
            return _this;
        }
        Ship.prototype.draw = function (ctx) {
            var _a = this, x = _a.x, y = _a.y, color = _a.color, radius = _a.radius, theta = _a.theta, alpha = _a.alpha;
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(theta);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-radius, -radius);
            ctx.lineTo(radius, 0);
            ctx.lineTo(-radius, radius);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = color;
            ctx.fill();
            ctx.closePath();
            ctx.restore();
        };
        Ship.prototype.registerController = function (c) {
            var _this = this;
            c.on(controller_1.UP, function () { return _this.up(); });
            c.on(controller_1.LEFT, function () { return _this.left(); });
            c.on(controller_1.RIGHT, function () { return _this.right(); });
            c.on(controller_1.SHIFT, function () { return _this.emit(teleportable_1.TELEPORT); });
            c.on(controller_1.SPACE, function () { return _this.emit(weaponize_1.SHOOT); });
            c.on(controller_1.ENTER, function () { return _this.emit(weaponize_1.SWAP_WEAPON); });
        };
        Ship.prototype.up = function () {
            this.velocity = this.speed;
        };
        Ship.prototype.right = function () {
            this.theta += this.rotation;
        };
        Ship.prototype.left = function () {
            this.theta -= this.rotation;
        };
        return Ship;
    }(character_8.SphereCharacter));
    exports.Ship = Ship;
});
define("models/engine", ["require", "exports", "models/character", "utils/math2", "models/alien", "models/asteroid", "models/weaponize", "models/bullet", "models/damageable", "models/observable", "models/particle", "models/ship"], function (require, exports, character_9, math2_5, alien_1, asteroid_1, weaponize_2, bullet_3, damageable_1, observable_3, particle_2, ship_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    math2_5 = __importDefault(math2_5);
    var GameEngine = (function () {
        function GameEngine(canvas) {
            var _this = this;
            this.characters = new Map();
            this.bus = new observable_3.Observable();
            this.requestId = -1;
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.bus.once(character_9.REGISTER, function (c) {
                _this.characters.set(c.id, c);
            });
            this.bus.once(character_9.DEREGISTER, function (c) {
                _this.characters.delete(c.id);
            });
        }
        GameEngine.prototype.eventloop = function () {
            var e_4, _a;
            this.ctx.save();
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            try {
                for (var _b = __values(this.characters), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var _d = __read(_c.value, 2), character = _d[1];
                    character.draw(this.ctx);
                    character.update();
                    this.checkCollision(character);
                }
            }
            catch (e_4_1) { e_4 = { error: e_4_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_4) throw e_4.error; }
            }
            this.requestId = window.requestAnimationFrame(this.eventloop.bind(this));
        };
        GameEngine.prototype.checkCollision = function (char1) {
            var _this = this;
            var e_5, _a;
            var _loop_1 = function (char2) {
                if (char1 === char2)
                    return "continue";
                if (char1 instanceof bullet_3.ShipBullet &&
                    (char2 instanceof asteroid_1.Asteroid || char2 instanceof alien_1.Alien)) {
                    var _a = __read([char1, char2], 2), bullet = _a[0], enemy_1 = _a[1];
                    if (checkCollision(bullet, enemy_1)) {
                        makeSparks(char1.obs, bullet, 6, checkAngle(enemy_1, bullet));
                        bullet.destroy();
                        this_1.characters.delete(bullet.id);
                        enemy_1.emit(damageable_1.DAMAGE, 10);
                        enemy_1.once(damageable_1.HEALTH_ZERO, function () {
                            _this.characters.delete(enemy_1.id);
                        });
                    }
                }
                if (char1 instanceof weaponize_2.Beam &&
                    (char2 instanceof asteroid_1.Asteroid || char2 instanceof alien_1.Alien)) {
                    var _b = __read([char1, char2], 2), laser = _b[0], enemy_2 = _b[1];
                    if (checkLaserCollision(laser, enemy_2)) {
                        enemy_2.emit(damageable_1.DAMAGE, 1);
                        enemy_2.once(damageable_1.HEALTH_ZERO, function () {
                            _this.characters.delete(enemy_2.id);
                        });
                    }
                }
                if (char1 instanceof bullet_3.AlienBullet && char2 instanceof ship_1.Ship) {
                    var _c = __read([char1, char2], 2), bullet = _c[0], ship = _c[1];
                    if (checkCollision(bullet, ship)) {
                        bullet.destroy();
                        ship.emit(damageable_1.DAMAGE, 10);
                        ship.once(damageable_1.HEALTH_ZERO, function () {
                        });
                    }
                }
                if (char1 instanceof ship_1.Ship && char2 instanceof asteroid_1.Asteroid) {
                    var _d = __read([char1, char2], 2), ship = _d[0], enemy = _d[1];
                    if (checkCollision(ship, enemy)) {
                        ship.emit(damageable_1.DAMAGE, Math.round(enemy.radius / 10));
                        ship.once(damageable_1.HEALTH_ZERO, function () { });
                    }
                }
            };
            var this_1 = this;
            try {
                for (var _b = __values(this.characters), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var _d = __read(_c.value, 2), char2 = _d[1];
                    _loop_1(char2);
                }
            }
            catch (e_5_1) { e_5 = { error: e_5_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_5) throw e_5.error; }
            }
        };
        GameEngine.prototype.pause = function () {
            this.requestId < 0 ? this.start() : this.stop();
        };
        GameEngine.prototype.start = function () {
            this.eventloop();
        };
        GameEngine.prototype.stop = function () {
            window.cancelAnimationFrame(this.requestId);
            this.requestId = -1;
        };
        GameEngine.prototype.register = function (cb) {
            cb(this.bus);
        };
        return GameEngine;
    }());
    exports.GameEngine = GameEngine;
    function checkCollision(c1, c2) {
        var deltaX = Math.pow(c1.x - c2.x, 2);
        var deltaY = Math.pow(c1.y - c2.y, 2);
        var radius = c1.radius + c2.radius;
        return Math.sqrt(deltaX + deltaY) < radius;
    }
    exports.checkCollision = checkCollision;
    function checkLaserCollision(c1, c2) {
        var deltaY = Math.tan(c1.theta) * (c2.x - c1.x);
        var y2 = c1.y + deltaY;
        var laserAngle = Math.cos(c1.theta);
        var isNegative = laserAngle < 0;
        var isInPath = isNegative ? c2.x < c1.x : c2.x > c1.x;
        return Math.abs(c2.y - y2) < c2.radius && isInPath;
    }
    exports.checkLaserCollision = checkLaserCollision;
    function makeSparks(obs, character, count, theta0) {
        var degree = Math.PI / count;
        var spread = math2_5.default.random(5, 10);
        var x0 = character.x, y0 = character.y;
        return Array(count)
            .fill(null)
            .map(function (_, i) {
            var theta = theta0 + (i * degree - Math.PI / 2);
            var x = x0 + spread * Math.cos(theta);
            var y = y0 + spread * Math.sin(theta);
            var spark = new particle_2.Particle(obs, x, y, 2, theta);
            spark.velocity = 0.5;
            return spark;
        });
    }
    exports.makeSparks = makeSparks;
    function checkAngle(c1, c2) {
        return Math.atan2(c2.y - c1.y, c2.x - c1.x);
    }
    exports.checkAngle = checkAngle;
});
define("models/invisibility", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("models/index", ["require", "exports", "models/engine", "models/observable", "models/ship", "models/damageable", "models/teleportable", "models/controller", "models/boundary", "models/weaponize", "models/asteroid", "models/alien"], function (require, exports, engine_1, observable_4, ship_2, damageable_2, teleportable_2, controller_2, boundary_3, weaponize_3, asteroid_2, alien_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GameEngine = engine_1.GameEngine;
    exports.Observable = observable_4.Observable;
    exports.Ship = ship_2.Ship;
    exports.withHealthBar = damageable_2.withHealthBar;
    exports.withTeleport = teleportable_2.withTeleport;
    exports.Controller = controller_2.Controller;
    exports.KeyboardController = controller_2.KeyboardController;
    exports.Boundary = boundary_3.Boundary;
    exports.withOutOfBound = boundary_3.withOutOfBound;
    exports.withRepeatBoundary = boundary_3.withRepeatBoundary;
    exports.withBullets = weaponize_3.withBullets;
    exports.Asteroid = asteroid_2.Asteroid;
    exports.Alien = alien_2.Alien;
    exports.withGun = alien_2.withGun;
    exports.TRACK = alien_2.TRACK;
});
define("index", ["require", "exports", "models/index", "utils/math2"], function (require, exports, index_1, math2_6) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    math2_6 = __importDefault(math2_6);
    'use strict';
    (function () {
        var width = window.innerWidth;
        var height = window.innerHeight;
        var canvas = document.getElementById('canvas');
        canvas.width = width;
        canvas.height = height;
        var keyboard = new index_1.KeyboardController();
        var boundary = new index_1.Boundary();
        var game = new index_1.GameEngine(canvas);
        game.register(function (obs) {
            var ship = makeShip(obs, boundary);
            ship.registerController(keyboard);
            var aliens = makeAlien(obs, boundary, 2);
            aliens.forEach(function (alien) {
                alien.emit(index_1.TRACK, ship);
            });
            makeAsteroids(obs, boundary, 10);
        });
        game.start();
    })();
    function makeAlien(obs, boundary, n) {
        return Array(n)
            .fill(function () {
            var x = math2_6.default.randomX();
            var y = math2_6.default.randomY();
            var radius = 15;
            var bounded = index_1.withRepeatBoundary(boundary);
            return new (index_1.withHealthBar(true)(index_1.withGun(index_1.withBullets(bounded(index_1.Alien)))))(obs, x, y, radius);
        })
            .map(function (fn) { return fn(); });
    }
    function makeShip(obs, boundary) {
        var bounded = index_1.withRepeatBoundary(boundary);
        var BattleShip = index_1.withBullets(index_1.withTeleport(index_1.withHealthBar(true)(bounded(index_1.Ship))));
        var x = boundary.midX;
        var y = boundary.midY;
        var radius = 15;
        return new BattleShip(obs, x, y, radius);
    }
    function makeAsteroids(obs, boundary, n) {
        var bounded = index_1.withRepeatBoundary(boundary);
        var BoundedAsteroid = index_1.withHealthBar(false)(bounded(index_1.Asteroid));
        var _a = __read([30, 50], 2), minRadius = _a[0], maxRadius = _a[1];
        var asteroids = Array(n)
            .fill(function () {
            return new BoundedAsteroid(obs, math2_6.default.randomX(), math2_6.default.randomY(), math2_6.default.random(minRadius, maxRadius), false);
        })
            .map(function (fn) { return fn(); });
        return asteroids;
    }
});
define("utils/touch", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function onTouch(element, fn) {
        element.addEventListener('touchstart', function (evt) {
            evt.preventDefault();
            fn && fn();
        }, { passive: false });
    }
    exports.onTouch = onTouch;
    function isTouchDevice() {
        var prefixes = ' -webkit- -moz- -o- -ms- '.split(' ');
        var mq = function (query) {
            return window.matchMedia(query).matches;
        };
        if ('ontouchstart' in window ||
            (window.DocumentTouch &&
                document instanceof window.DocumentTouch)) {
            return true;
        }
        var query = ['(', prefixes.join('touch-enabled),('), 'heartz', ')'].join('');
        return mq(query);
    }
    exports.isTouchDevice = isTouchDevice;
});
