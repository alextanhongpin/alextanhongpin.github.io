var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
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
define("utils/keycode", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var KeyCode;
    (function (KeyCode) {
        KeyCode[KeyCode["Enter"] = 13] = "Enter";
        KeyCode[KeyCode["Left"] = 37] = "Left";
        KeyCode[KeyCode["Up"] = 38] = "Up";
        KeyCode[KeyCode["Right"] = 39] = "Right";
        KeyCode[KeyCode["Down"] = 40] = "Down";
        KeyCode[KeyCode["Space"] = 32] = "Space";
        KeyCode[KeyCode["Shift"] = 16] = "Shift";
        KeyCode[KeyCode["Pause"] = 80] = "Pause";
    })(KeyCode || (KeyCode = {}));
    exports.default = KeyCode;
});
define("core/body", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Body = (function () {
        function Body() {
            this.x = 0;
            this.y = 0;
            this.theta = 0;
            this.velocity = 0;
            this.friction = 0;
            this.radius = 0;
            this.observerTheta = 0;
        }
        Body.prototype.update = function () {
            this.x += Math.cos(this.theta) * this.velocity;
            this.y += Math.sin(this.theta) * this.velocity;
            if (this.friction) {
                this.velocity *= this.friction;
            }
        };
        Body.prototype.rotate = function (theta) {
            this.theta += theta;
        };
        Body.prototype.collision = function (body) {
            var radius = this.radius + body.radius;
            var x = Math.pow(this.x - body.x, 2);
            var y = Math.pow(this.y - body.y, 2);
            return Math.sqrt(x + y) < radius;
        };
        return Body;
    }());
    exports.default = Body;
});
define("mixin/damageable", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Damageable = (function () {
        function Damageable(state) {
            this._healthState = state;
        }
        Damageable.prototype._drawHealth = function (ctx) {
            var _a = this._healthState, hp = _a.hp, maxHp = _a.maxHp, x = _a.x, y = _a.y, isVisible = _a.isVisible;
            if (!isVisible) {
                return;
            }
            var width = 50;
            var height = 5;
            var spacing = 1;
            var padding = spacing * 2;
            var hpRatio = hp / maxHp;
            ctx.save();
            ctx.translate(x, y);
            ctx.beginPath();
            ctx.rect(0, 0, width, height);
            ctx.strokeStyle = 'white';
            ctx.stroke();
            ctx.closePath();
            ctx.beginPath();
            ctx.rect(spacing, spacing, Math.max(0, hpRatio * (width - padding)), height - padding);
            ctx.fillStyle = this._healthColor(hpRatio);
            ctx.fill();
            ctx.closePath();
            ctx.restore();
        };
        Damageable.prototype._healthColor = function (hpRatio) {
            if (hpRatio < 0.25) {
                return 'red';
            }
            if (hpRatio < 0.5) {
                return 'orange';
            }
            return 'white';
        };
        return Damageable;
    }());
    exports.default = Damageable;
});
define("utils/mixin", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function applyMixins(derivedCtor, baseCtors) {
        baseCtors.forEach(function (baseCtor) {
            Object.getOwnPropertyNames(baseCtor.prototype).forEach(function (name) {
                derivedCtor.prototype[name] = baseCtor.prototype[name];
            });
        });
    }
    exports.applyMixins = applyMixins;
});
define("drawable/drawable", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("drawable/asteroid", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Asteroid = (function () {
        function Asteroid() {
            this.x = 0;
            this.y = 0;
            this.theta = 0;
            this.radius = 0;
        }
        Asteroid.prototype._drawAsteroid = function (ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.theta);
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2, false);
            ctx.strokeStyle = 'white';
            ctx.stroke();
            ctx.closePath();
            ctx.restore();
        };
        Asteroid.prototype._updateAsteroid = function () {
            if (this.x > window.innerWidth) {
                this.x = 0;
            }
            if (this.x < 0) {
                this.x = window.innerWidth;
            }
            if (this.y > window.innerHeight) {
                this.y = 0;
            }
            if (this.y < 0) {
                this.y = window.innerHeight;
            }
        };
        return Asteroid;
    }());
    exports.default = Asteroid;
});
define("core/particle", ["require", "exports", "core/body"], function (require, exports, Body_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Body_1 = __importDefault(Body_1);
    var Particle = (function (_super) {
        __extends(Particle, _super);
        function Particle() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Particle.prototype.draw = function (ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.theta);
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2, false);
            ctx.fillStyle = 'white';
            ctx.fill();
            ctx.closePath();
            ctx.restore();
        };
        return Particle;
    }(Body_1.default));
    exports.default = Particle;
});
define("utils/math2", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Math2 = (function () {
        function Math2() {
        }
        Math2.thetaToDegree = function (theta) {
            return theta * Math.PI / 2;
        };
        Math2.degreeToTheta = function (degree) {
            return degree * Math.PI / 180;
        };
        Math2.random = function (min, max) {
            return Math.floor(Math.random() * max) + min;
        };
        return Math2;
    }());
    exports.default = Math2;
});
define("core/Spark", ["require", "exports", "core/particle", "utils/math2"], function (require, exports, particle_1, math2_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    particle_1 = __importDefault(particle_1);
    math2_1 = __importDefault(math2_1);
    var Spark = (function () {
        function Spark(count) {
            this.count = count;
            this.particles = [];
        }
        Spark.prototype.setup = function (body) {
            var degree = 180 / this.count;
            this.particles = Array(this.count).fill(0).map(function (_, i) {
                var theta = math2_1.default.degreeToTheta(degree * i) + (body.observerTheta ? body.observerTheta - Math.PI / 2 : 0);
                var thetaX = Math.cos(theta);
                var thetaY = Math.sin(theta);
                var spread = 10;
                var particle = new particle_1.default();
                particle.x = body.x + thetaX * spread;
                particle.y = body.y + thetaY * spread;
                particle.velocity = 0.5;
                particle.radius = 2;
                particle.friction = 0.95;
                return particle;
            });
        };
        Spark.prototype.draw = function (ctx) {
            this.particles.forEach(function (p) { return p.draw(ctx); });
        };
        Spark.prototype.update = function () {
            var _this = this;
            this.particles.forEach(function (p) {
                p.radius -= 0.05;
                p.update();
                if (p.radius < 0) {
                    _this.particles = [];
                }
            });
        };
        return Spark;
    }());
    exports.default = Spark;
});
define("utils/Observer", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Observer = (function () {
        function Observer() {
            this.events = {};
        }
        Observer.prototype.on = function (event, fn) {
            if (!this.events[event]) {
                this.events[event] = fn;
            }
        };
        Observer.prototype.emit = function (event) {
            var _a;
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            if (this.events[event]) {
                (_a = this.events)[event].apply(_a, __spread(args));
            }
        };
        return Observer;
    }());
    exports.default = Observer;
});
define("core/weapon", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var WeaponType;
    (function (WeaponType) {
        WeaponType[WeaponType["Bullet"] = 0] = "Bullet";
        WeaponType[WeaponType["Laser"] = 1] = "Laser";
    })(WeaponType = exports.WeaponType || (exports.WeaponType = {}));
});
define("composite/asteroid", ["require", "exports", "mixin/damageable", "utils/mixin", "drawable/asteroid", "core/body", "core/Spark", "utils/Observer", "core/weapon"], function (require, exports, damageable_1, mixin_1, asteroid_1, body_1, Spark_1, Observer_1, weapon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    damageable_1 = __importDefault(damageable_1);
    asteroid_1 = __importDefault(asteroid_1);
    body_1 = __importDefault(body_1);
    Spark_1 = __importDefault(Spark_1);
    Observer_1 = __importDefault(Observer_1);
    var CompositeAsteroid = (function (_super) {
        __extends(CompositeAsteroid, _super);
        function CompositeAsteroid(x, y, theta, velocity, radius, friction, hp) {
            var _this = _super.call(this) || this;
            _this.x = x;
            _this.y = y;
            _this.theta = theta;
            _this.velocity = velocity;
            _this.radius = radius;
            _this.friction = friction;
            _this._healthState = {
                x: x,
                y: y,
                hp: hp,
                maxHp: hp,
                isVisible: false
            };
            _this._effect = new Spark_1.default(6);
            _this._observer = new Observer_1.default();
            _this._observer.on('collide', function (body, type) {
                if (type === weapon_1.WeaponType.Bullet) {
                    _this._effect.setup(body);
                }
                _this._healthState.isVisible = true;
                if (_this._healthTimeout) {
                    window.clearTimeout(_this._healthTimeout);
                }
                _this._healthTimeout = window.setTimeout(function () {
                    _this._healthState.isVisible = false;
                }, 3000);
            });
            _this._observer.on('damage', function (damage) {
                _this._healthState.hp -= damage;
                window.clearTimeout(_this._healthTimeout);
            });
            return _this;
        }
        CompositeAsteroid.prototype.update = function () {
            _super.prototype.update.call(this);
            this._updateAsteroid();
            this._updateHealth();
            this._updateEffect();
        };
        CompositeAsteroid.prototype.draw = function (ctx) {
            this._drawAsteroid(ctx);
            this._drawHealth(ctx);
            this._drawEffect(ctx);
        };
        CompositeAsteroid.prototype._updateHealth = function () {
            this._healthState.x = this.x - 20;
            this._healthState.y = this.y - 20;
        };
        Object.defineProperty(CompositeAsteroid.prototype, "hp", {
            get: function () {
                return this._healthState.hp;
            },
            enumerable: true,
            configurable: true
        });
        CompositeAsteroid.prototype._drawEffect = function (ctx) {
            this._effect.draw(ctx);
        };
        CompositeAsteroid.prototype._updateEffect = function () {
            this._effect.update();
        };
        CompositeAsteroid.prototype.emit = function (event) {
            var _a;
            var params = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                params[_i - 1] = arguments[_i];
            }
            (_a = this._observer).emit.apply(_a, __spread([event], params));
        };
        Object.defineProperty(CompositeAsteroid.prototype, "damage", {
            get: function () {
                return Math.floor(this.radius / 2);
            },
            enumerable: true,
            configurable: true
        });
        return CompositeAsteroid;
    }(body_1.default));
    mixin_1.applyMixins(CompositeAsteroid, [damageable_1.default, asteroid_1.default]);
    exports.default = CompositeAsteroid;
});
define("mixin/weaponizable", ["require", "exports", "core/weapon"], function (require, exports, weapon_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Weaponizable = (function () {
        function Weaponizable() {
            this._weaponState = {
                x: 0,
                y: 0,
                theta: 0,
                observerTheta: 0,
                choice: -1,
                weapons: []
            };
        }
        Weaponizable.prototype._setWeapons = function () {
            var weapons = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                weapons[_i] = arguments[_i];
            }
            this._weaponState.weapons = weapons;
            if (this._weaponState.weapons.length) {
                this._weaponState.choice = this._weaponState.weapons[0].type;
            }
        };
        Weaponizable.prototype._getWeapon = function () {
            var _a = this._weaponState, weapons = _a.weapons, choice = _a.choice;
            return weapons[choice];
        };
        Weaponizable.prototype._swapWeapon = function () {
            this._weaponState.choice++;
            if (this._weaponState.choice > this._weaponState.weapons.length - 1) {
                this._weaponState.choice = 0;
            }
        };
        Weaponizable.prototype._drawWeapon = function (ctx) {
            var weapons = this._weaponState.weapons;
            weapons.forEach(function (weapon) { return weapon.draw(ctx); });
        };
        Weaponizable.prototype._updateWeapon = function () {
            var _a = this._weaponState, weapons = _a.weapons, x = _a.x, y = _a.y, theta = _a.theta;
            weapons.forEach(function (weapon) {
                if (weapon.type === weapon_2.WeaponType.Laser) {
                    Object.values(weapon.ammos).forEach(function (ammo) {
                        ammo.x = x;
                        ammo.y = y;
                        ammo.theta = theta;
                    });
                }
                weapon.update();
            });
        };
        return Weaponizable;
    }());
    exports.default = Weaponizable;
});
define("mixin/teleportable", ["require", "exports", "utils/math2", "core/particle"], function (require, exports, math2_2, particle_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    math2_2 = __importDefault(math2_2);
    particle_2 = __importDefault(particle_2);
    var Teleportable = (function () {
        function Teleportable(state) {
            this._teleportState = state;
        }
        Teleportable.prototype._makeParticle = function (theta, x, y) {
            var thetaX = Math.cos(theta);
            var thetaY = Math.sin(theta);
            var spread = 25;
            var particle = new particle_2.default();
            particle.x = x + thetaX * spread;
            particle.y = y + thetaY * spread;
            particle.theta = theta;
            particle.velocity = -0.5;
            particle.radius = 2;
            particle.friction = 0.95;
            return particle;
        };
        Teleportable.prototype._makeParticles = function (count, x, y) {
            var _this = this;
            var degree = 360 / count;
            return Array(count).fill(0).map(function (_, i) {
                var theta = math2_2.default.degreeToTheta(degree * i);
                return _this._makeParticle(theta, x, y);
            });
        };
        Teleportable.prototype._teleport = function (body) {
            var count = this._teleportState.count;
            this._teleportState.particles = this._makeParticles(count, body.x, body.y);
            body.x = math2_2.default.random(0, window.innerWidth);
            body.y = math2_2.default.random(0, window.innerHeight);
        };
        Teleportable.prototype._drawTeleportable = function (ctx) {
            var particles = this._teleportState.particles;
            particles.forEach(function (p) { return p.draw(ctx); });
        };
        Teleportable.prototype._updateTeleportable = function () {
            var _this = this;
            var particles = this._teleportState.particles;
            particles.forEach(function (p) {
                p.radius -= 0.05;
                p.update();
                if (p.radius < 0) {
                    _this._teleportState.particles = [];
                }
            });
        };
        return Teleportable;
    }());
    exports.default = Teleportable;
});
define("drawable/ship", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Ship = (function () {
        function Ship() {
            this.x = 0;
            this.y = 0;
            this.radius = 0;
            this.theta = 0;
            this.isFlickering = false;
            this.alphaState = false;
            this.alpha = 1;
        }
        Ship.prototype._updateShip = function () {
            if (this.x > window.innerWidth) {
                this.x = 0;
            }
            if (this.x < 0) {
                this.x = window.innerWidth;
            }
            if (this.y > window.innerHeight) {
                this.y = 0;
            }
            if (this.y < 0) {
                this.y = window.innerHeight;
            }
        };
        Ship.prototype._drawShip = function (ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.theta);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-this.radius, -this.radius);
            ctx.lineTo(this.radius, 0);
            ctx.lineTo(-this.radius, this.radius);
            this.computeGlobalAlpha(this.isFlickering);
            ctx.globalAlpha = this.alpha;
            ctx.fillStyle = 'white';
            ctx.fill();
            ctx.closePath();
            ctx.restore();
        };
        Ship.prototype.computeGlobalAlpha = function (isFlickering) {
            if (isFlickering) {
                if (this.alpha > 0.05) {
                    if (!this.alphaState) {
                        this.alpha -= 0.05;
                    }
                }
                else {
                    this.alphaState = true;
                }
                if (this.alphaState) {
                    this.alpha += 0.05;
                    if (this.alpha > 0.95) {
                        this.alphaState = false;
                    }
                }
            }
            else {
                this.alpha = 1;
            }
        };
        return Ship;
    }());
    exports.default = Ship;
});
define("composite/ship", ["require", "exports", "mixin/damageable", "mixin/weaponizable", "mixin/teleportable", "utils/mixin", "drawable/ship", "core/body", "utils/keycode", "utils/math2", "utils/Observer"], function (require, exports, damageable_2, weaponizable_1, teleportable_1, mixin_2, ship_1, body_2, keycode_1, math2_3, observer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    damageable_2 = __importDefault(damageable_2);
    weaponizable_1 = __importDefault(weaponizable_1);
    teleportable_1 = __importDefault(teleportable_1);
    ship_1 = __importDefault(ship_1);
    body_2 = __importDefault(body_2);
    keycode_1 = __importDefault(keycode_1);
    math2_3 = __importDefault(math2_3);
    observer_1 = __importDefault(observer_1);
    var CompositeShip = (function (_super) {
        __extends(CompositeShip, _super);
        function CompositeShip(x, y, theta, velocity, radius, friction, hp) {
            var _this = _super.call(this) || this;
            _this.isFlickering = false;
            _this.x = x;
            _this.y = y;
            _this.theta = theta;
            _this.velocity = velocity;
            _this.radius = radius;
            _this.friction = friction;
            _this.alphaState = false;
            _this.alpha = 1;
            _this._healthState = { x: x, y: y, hp: hp, maxHp: hp, isVisible: true };
            _this._weaponState = { choice: -1, weapons: [], x: x, y: y, theta: theta, observerTheta: 0 };
            _this._teleportState = { count: 12, particles: [] };
            _this._observer = new observer_1.default();
            _this._observer.on('collide', function (_body) {
                if (_this.isFlickering) {
                    return;
                }
                _this._healthState.isVisible = true;
                if (_this._healthTimeout) {
                    window.clearTimeout(_this._healthTimeout);
                }
                _this._healthTimeout = window.setTimeout(function () {
                    _this._healthState.isVisible = false;
                }, 3000);
                _this.isFlickering = true;
                if (_this._flickeringTimeout) {
                    window.clearTimeout(_this._flickeringTimeout);
                }
                _this._flickeringTimeout = window.setTimeout(function () {
                    _this.isFlickering = false;
                }, 3000);
            });
            _this._observer.on('damage', function (damage) {
                if (_this.isFlickering) {
                    return;
                }
                _this._healthState.hp -= damage;
                window.clearTimeout(_this._healthTimeout);
            });
            _this._bindEvents();
            return _this;
        }
        CompositeShip.prototype.update = function () {
            _super.prototype.update.call(this);
            this._updateHealth();
            this._updateTeleportable();
            this._updateShip();
            this._weaponState.theta = this.theta;
            this._weaponState.x = this.x;
            this._weaponState.y = this.y;
            this._updateWeapon();
        };
        CompositeShip.prototype._bindEvents = function () {
            var _this = this;
            document.addEventListener('keydown', function (evt) {
                if (evt.keyCode === keycode_1.default.Up) {
                    _this.velocity = 5;
                }
                if (evt.keyCode === keycode_1.default.Left) {
                    _this.rotate(-math2_3.default.degreeToTheta(10));
                }
                if (evt.keyCode === keycode_1.default.Right) {
                    _this.rotate(math2_3.default.degreeToTheta(10));
                }
                if (evt.keyCode === keycode_1.default.Shift) {
                    _this._teleport(_this);
                }
                if (evt.keyCode === keycode_1.default.Space) {
                    _this._getWeapon().reload(_this);
                }
                if (evt.keyCode === keycode_1.default.Enter) {
                    _this._swapWeapon();
                }
            });
        };
        CompositeShip.prototype.draw = function (ctx) {
            this._drawShip(ctx);
            this._drawWeapon(ctx);
            this._drawHealth(ctx);
            this._drawTeleportable(ctx);
        };
        CompositeShip.prototype._updateHealth = function () {
            this._healthState.x = this.x - 20;
            this._healthState.y = this.y - 20;
        };
        Object.defineProperty(CompositeShip.prototype, "hp", {
            get: function () {
                return this._healthState.hp;
            },
            enumerable: true,
            configurable: true
        });
        CompositeShip.prototype.getWeapon = function () {
            return this._getWeapon();
        };
        CompositeShip.prototype.setWeapons = function () {
            var weapons = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                weapons[_i] = arguments[_i];
            }
            this._setWeapons.apply(this, __spread(weapons));
        };
        CompositeShip.prototype.emit = function (event) {
            var _a;
            var params = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                params[_i - 1] = arguments[_i];
            }
            (_a = this._observer).emit.apply(_a, __spread([event], params));
        };
        return CompositeShip;
    }(body_2.default));
    mixin_2.applyMixins(CompositeShip, [ship_1.default, weaponizable_1.default, damageable_2.default, teleportable_1.default]);
    exports.default = CompositeShip;
});
define("drawable/alien", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Alien = (function () {
        function Alien() {
            this.x = 0;
            this.y = 0;
            this.theta = 0;
            this.radius = 0;
            this.eyeX = 5;
            this.eyeY = 5;
            this.eyeTheta = 0;
        }
        Alien.prototype._drawAlien = function (ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.beginPath();
            ctx.moveTo(-15, -3);
            ctx.bezierCurveTo(-20, -15, 20, -15, 15, -3);
            ctx.strokeStyle = 'white';
            ctx.stroke();
            ctx.closePath();
            ctx.beginPath();
            ctx.arc(this.eyeX * Math.cos(this.eyeTheta), -5 + this.eyeY * Math.sin(this.eyeTheta), 2, 0, Math.PI * 2, false);
            ctx.fillStyle = 'white';
            ctx.fill();
            ctx.closePath();
            ctx.beginPath();
            ctx.rect(-20, -3, 40, 3);
            ctx.strokeStyle = 'white';
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
            ctx.strokeStyle = 'white';
            ctx.stroke();
            ctx.closePath();
            ctx.restore();
        };
        Alien.prototype._updateAlien = function () {
            if (this.x > window.innerWidth) {
                this.x = 0;
            }
            if (this.x < 0) {
                this.x = window.innerWidth;
            }
            if (this.y > window.innerHeight) {
                this.y = 0;
            }
            if (this.y < 0) {
                this.y = window.innerHeight;
            }
        };
        return Alien;
    }());
    exports.default = Alien;
});
define("composite/alien", ["require", "exports", "core/body", "drawable/alien", "mixin/teleportable", "mixin/damageable", "mixin/weaponizable", "utils/mixin", "utils/math2", "utils/Observer"], function (require, exports, Body_2, alien_1, teleportable_2, damageable_3, weaponizable_2, mixin_3, Math2_1, Observer_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Body_2 = __importDefault(Body_2);
    alien_1 = __importDefault(alien_1);
    teleportable_2 = __importDefault(teleportable_2);
    damageable_3 = __importDefault(damageable_3);
    weaponizable_2 = __importDefault(weaponizable_2);
    Math2_1 = __importDefault(Math2_1);
    Observer_2 = __importDefault(Observer_2);
    var CompositeAlien = (function (_super) {
        __extends(CompositeAlien, _super);
        function CompositeAlien(x, y, theta, velocity, radius, friction) {
            var _this = _super.call(this) || this;
            _this.eyeX = 5;
            _this.eyeY = 5;
            _this.eyeTheta = 0;
            _this.x = x;
            _this.y = y;
            _this.theta = theta;
            _this.velocity = velocity;
            _this.radius = radius;
            _this.friction = friction;
            _this._healthState = {
                x: x,
                y: y,
                hp: 100,
                maxHp: 100,
                isVisible: false
            };
            _this._weaponState = {
                choice: -1,
                weapons: [],
                x: x,
                y: y,
                theta: theta,
                observerTheta: 0
            };
            _this._teleportState = {
                count: 12,
                particles: []
            };
            _this._brain();
            _this._observer = new Observer_2.default();
            _this._observer.on('collide', function (body) {
                _this._healthState.isVisible = true;
                if (_this._healthTimeout) {
                    window.clearTimeout(_this._healthTimeout);
                }
                _this._healthTimeout = window.setTimeout(function () {
                    _this._healthState.isVisible = false;
                }, 3000);
            });
            _this._observer.on('damage', function (damage) {
                _this._healthState.hp -= damage;
                window.clearTimeout(_this._healthTimeout);
            });
            return _this;
        }
        CompositeAlien.prototype.draw = function (ctx) {
            this._drawAlien(ctx);
            this._drawTeleportable(ctx);
            this._drawWeapon(ctx);
            this._drawHealth(ctx);
        };
        CompositeAlien.prototype.update = function () {
            _super.prototype.update.call(this);
            this._updateAlien();
            this._updateTeleportable();
            this._updateWeapon();
            this._updateHealth();
        };
        CompositeAlien.prototype._brain = function () {
            var _this = this;
            window.setInterval(function () {
                _this._teleport(_this);
                _this.x = Math2_1.default.random(0, window.innerWidth);
                _this.y = Math2_1.default.random(0, window.innerWidth);
                _this.theta = Math2_1.default.random(0, Math.PI * 2);
                _this.velocity = 0;
                var _loop_1 = function (i) {
                    window.setTimeout(function () {
                        if (i === 0) {
                            _this.velocity = Math2_1.default.random(1, 3);
                        }
                        _this.observerTheta = _this.eyeTheta;
                        _this._getWeapon().reload(_this);
                    }, 500 * i);
                };
                for (var i = 0; i < 2; i += 1) {
                    _loop_1(i);
                }
            }, 3000);
        };
        CompositeAlien.prototype._updateHealth = function () {
            this._healthState.x = this.x - 20;
            this._healthState.y = this.y - 20;
        };
        Object.defineProperty(CompositeAlien.prototype, "hp", {
            get: function () {
                return this._healthState.hp;
            },
            enumerable: true,
            configurable: true
        });
        CompositeAlien.prototype.setWeapons = function () {
            var weapons = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                weapons[_i] = arguments[_i];
            }
            this._setWeapons.apply(this, __spread(weapons));
        };
        CompositeAlien.prototype.getWeapon = function () {
            return this._getWeapon();
        };
        CompositeAlien.prototype.emit = function (event) {
            var _a;
            var params = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                params[_i - 1] = arguments[_i];
            }
            (_a = this._observer).emit.apply(_a, __spread([event], params));
        };
        return CompositeAlien;
    }(Body_2.default));
    mixin_3.applyMixins(CompositeAlien, [alien_1.default, damageable_3.default, weaponizable_2.default, teleportable_2.default]);
    exports.default = CompositeAlien;
});
define("core/Game", ["require", "exports", "utils/keycode", "composite/asteroid", "composite/ship", "composite/alien", "core/weapon", "utils/Observer", "utils/math2"], function (require, exports, keycode_2, asteroid_2, ship_2, alien_2, weapon_3, Observer_3, math2_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    keycode_2 = __importDefault(keycode_2);
    asteroid_2 = __importDefault(asteroid_2);
    ship_2 = __importDefault(ship_2);
    alien_2 = __importDefault(alien_2);
    Observer_3 = __importDefault(Observer_3);
    math2_4 = __importDefault(math2_4);
    var alientAttackMessages = [
        'oopps, that must hurt real bad',
        'alien attack!!!',
        'you have been hit by a stray alien bullet, bzzz'
    ];
    var asteroidMessages = [
        'a memorable day - you got hit by an asteroid',
        'armageddon!',
        'watch out!'
    ];
    var shootAsteroidMessages = [
        'piu piu piu',
        'take that, stones!',
        'you rock'
    ];
    var Game = (function () {
        function Game(canvas) {
            this.observer = new Observer_3.default();
            this.requestId = -1;
            this.isSetup = false;
            this.bodies = {};
            this.canvas = canvas;
            this.ctx = this.canvas.getContext('2d');
        }
        Game.prototype.setup = function () {
            var _this = this;
            if (this.isSetup) {
                return this;
            }
            document.addEventListener('keydown', function (evt) {
                if (evt.keyCode === keycode_2.default.Pause) {
                    _this.pause();
                }
            });
            this.isSetup = true;
            return this;
        };
        Game.prototype.pause = function () {
            this.requestId < 0 ? this.start() : this.stop();
            return this;
        };
        Game.prototype.start = function () {
            this.draw();
            return this;
        };
        Game.prototype.stop = function () {
            window.cancelAnimationFrame(this.requestId);
            this.requestId = -1;
            return this;
        };
        Game.prototype._shipWeaponAndAsteroidCollision = function (weapon, asteroid, asteroidId) {
            var _this = this;
            Object.entries(weapon.ammos).forEach(function (_a) {
                var _b = __read(_a, 2), ammoId = _b[0], ammo = _b[1];
                if (weapon.type === weapon_3.WeaponType.Bullet) {
                    if (ammo.collision(asteroid)) {
                        asteroid.emit('damage', weapon.damage);
                        delete weapon.ammos[Number(ammoId)];
                        ammo.observerTheta = Math.atan2(ammo.y - asteroid.y, ammo.x - asteroid.x);
                        asteroid.emit('collide', ammo, weapon.type);
                        _this.observer.emit('message', shootAsteroidMessages[math2_4.default.random(0, shootAsteroidMessages.length - 1)]);
                        if (asteroid.hp < 0) {
                            delete _this.bodies[Number(asteroidId)];
                        }
                    }
                }
                else if (weapon.type === weapon_3.WeaponType.Laser) {
                    var laserY = (asteroid.x - ammo.x) * Math.tan(ammo.theta);
                    if (Math.abs(ammo.y + laserY - asteroid.y) < asteroid.radius) {
                        asteroid.emit('damage', weapon.damage);
                        asteroid.emit('collide', ammo);
                        if (asteroid.hp < 0) {
                            delete _this.bodies[Number(asteroidId)];
                        }
                    }
                }
            });
        };
        Game.prototype._shipAndAsteroidCollision = function (asteroid, ship, shipId) {
            if (asteroid.collision(ship)) {
                ship.emit('damage', asteroid.damage);
                ship.emit('collide', asteroid);
                this.observer.emit('message', asteroidMessages[math2_4.default.random(0, asteroidMessages.length - 1)]);
                if (ship.hp < 0) {
                    delete this.bodies[Number(shipId)];
                    this.observer.emit('message', 'game over');
                }
            }
        };
        Game.prototype._shipWeaponAndAlienCollision = function (weapon, alien, alienId) {
            var _this = this;
            Object.entries(weapon.ammos).forEach(function (_a) {
                var _b = __read(_a, 2), ammoId = _b[0], ammo = _b[1];
                if (weapon.type === weapon_3.WeaponType.Bullet) {
                    if (ammo.collision(alien)) {
                        alien.emit('damage', weapon.damage);
                        delete weapon.ammos[Number(ammoId)];
                        alien.emit('collide', ammo);
                        if (alien.hp < 0) {
                            delete _this.bodies[Number(alienId)];
                            _this.observer.emit('message', 'you kill an alien, you are awesome!');
                        }
                    }
                }
                else if (weapon.type === weapon_3.WeaponType.Laser) {
                    var laserY = (alien.x - ammo.x) * Math.tan(ammo.theta);
                    if (Math.abs(ammo.y + laserY - alien.y) < alien.radius) {
                        alien.emit('damage', weapon.damage);
                        alien.emit('collide', ammo);
                        if (alien.hp < 0) {
                            delete _this.bodies[Number(alienId)];
                            _this.observer.emit('message', 'down you go, alien!');
                        }
                    }
                }
            });
        };
        Game.prototype._alienWeaponAndShipCollision = function (weapon, ship, shipId) {
            var _this = this;
            Object.entries(weapon.ammos).forEach(function (_a) {
                var _b = __read(_a, 2), ammoId = _b[0], ammo = _b[1];
                if (ammo.collision(ship)) {
                    ship.emit('damage', weapon.damage);
                    delete weapon.ammos[Number(ammoId)];
                    ship.emit('collide', ammo);
                    _this.observer.emit('message', alientAttackMessages[math2_4.default.random(0, alientAttackMessages.length - 1)]);
                    if (ship.hp < 0) {
                        delete _this.bodies[Number(shipId)];
                        _this.observer.emit('message', 'game over');
                    }
                }
            });
        };
        Game.prototype._checkCollision = function (ship, shipId) {
            var _this = this;
            var weapon = ship.getWeapon();
            Object.entries(this.bodies).forEach(function (_a) {
                var _b = __read(_a, 2), id = _b[0], body = _b[1];
                if (body instanceof asteroid_2.default) {
                    var asteroidId = id;
                    var asteroid = body;
                    _this._shipWeaponAndAsteroidCollision(weapon, asteroid, asteroidId);
                    _this._shipAndAsteroidCollision(asteroid, ship, shipId);
                }
                if (body instanceof alien_2.default) {
                    var alienId = id;
                    var alien = body;
                    alien.eyeTheta = Math.atan2(ship.y - alien.y, ship.x - alien.x);
                    _this._shipWeaponAndAlienCollision(weapon, alien, alienId);
                    _this._alienWeaponAndShipCollision(alien.getWeapon(), ship, shipId);
                }
            });
        };
        Game.prototype.draw = function () {
            var _this = this;
            this.ctx.save();
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            if (Object.values(this.bodies).length === 1 && this.bodies[0] instanceof ship_2.default) {
                this.observer.emit('message', 'you saved the universe again! well done!');
            }
            var bodies = Object.entries(this.bodies);
            bodies.forEach(function (_a) {
                var _b = __read(_a, 2), id = _b[0], body = _b[1];
                body.draw(_this.ctx);
                body.update();
                if (body instanceof ship_2.default) {
                    _this._checkCollision(body, id);
                }
            });
            this.requestId = window.requestAnimationFrame(this.draw.bind(this));
        };
        Game.prototype.restart = function () {
            throw new Error('not implemented');
        };
        Game.prototype.setBodies = function () {
            var bodies = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                bodies[_i] = arguments[_i];
            }
            this.bodies = bodies.reduce(function (acc, body, i) {
                acc[i] = body;
                return acc;
            }, {});
            return this;
        };
        Game.prototype.setObserver = function (observer) {
            this.observer = observer;
            return this;
        };
        return Game;
    }());
    exports.default = Game;
});
define("core/bullet", ["require", "exports", "core/body"], function (require, exports, body_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    body_3 = __importDefault(body_3);
    var Bullet = (function (_super) {
        __extends(Bullet, _super);
        function Bullet() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Bullet.prototype.draw = function (ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.theta);
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2, false);
            ctx.closePath();
            ctx.fillStyle = 'white';
            ctx.fill();
            ctx.restore();
        };
        return Bullet;
    }(body_3.default));
    var BulletWeapon = (function () {
        function BulletWeapon(type, count, radius, velocity, duration) {
            this.damage = 5;
            this.type = type;
            this.count = count;
            this.radius = radius;
            this.velocity = velocity;
            this.duration = duration;
            this.ammos = {};
            this.id = 0;
        }
        BulletWeapon.prototype.reload = function (body) {
            var _this = this;
            if (Object.keys(this.ammos).length < this.count) {
                var b = new Bullet();
                b.x = body.x;
                b.y = body.y;
                b.theta = body.observerTheta ? body.observerTheta : body.theta;
                b.velocity = this.velocity;
                b.radius = this.radius;
                this.ammos[++this.id] = b;
                window.setTimeout(function (id) {
                    delete _this.ammos[id];
                }, this.duration, this.id);
            }
        };
        BulletWeapon.prototype.empty = function () {
            this.ammos = [];
        };
        BulletWeapon.prototype.draw = function (ctx) {
            Object.values(this.ammos).forEach(function (bullet) { return bullet.draw(ctx); });
        };
        BulletWeapon.prototype.update = function () {
            var _this = this;
            Object.entries(this.ammos).forEach(function (_a) {
                var _b = __read(_a, 2), id = _b[0], bullet = _b[1];
                bullet.update();
                if (bullet.x > window.innerWidth ||
                    bullet.x < 0 ||
                    bullet.y > window.innerWidth ||
                    bullet.y < 0) {
                    delete _this.ammos[Number(id)];
                }
            });
        };
        return BulletWeapon;
    }());
    exports.default = BulletWeapon;
});
define("core/laser", ["require", "exports", "core/body"], function (require, exports, Body_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Body_3 = __importDefault(Body_3);
    var Laser = (function (_super) {
        __extends(Laser, _super);
        function Laser() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Laser.prototype.draw = function (ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.beginPath();
            var thetaX = Math.cos(this.theta);
            var thetaY = Math.sin(this.theta);
            ctx.moveTo(thetaX * this.radius, thetaY * this.radius);
            ctx.lineTo(thetaX * window.innerWidth, thetaY * window.innerWidth);
            ctx.lineWidth = 3;
            var gradient = ctx.createLinearGradient(10, 0, 500, 0);
            gradient.addColorStop(0, 'red');
            gradient.addColorStop(1 / 6, 'orange');
            gradient.addColorStop(2 / 6, 'yellow');
            gradient.addColorStop(3 / 6, 'green');
            gradient.addColorStop(4 / 6, 'blue');
            gradient.addColorStop(5 / 6, 'indigo');
            gradient.addColorStop(1, 'violet');
            ctx.strokeStyle = gradient;
            ctx.stroke();
            ctx.closePath();
            ctx.restore();
        };
        return Laser;
    }(Body_3.default));
    var LaserWeapon = (function () {
        function LaserWeapon(type, count, radius, velocity, duration) {
            this.damage = 0.5;
            this.type = type;
            this.count = count;
            this.radius = radius;
            this.velocity = velocity;
            this.duration = duration;
            this.ammos = {};
            this.id = 0;
        }
        LaserWeapon.prototype.reload = function (body) {
            var _this = this;
            if (Object.keys(this.ammos).length < this.count) {
                var newBullet = new Laser();
                newBullet.x = body.x;
                newBullet.y = body.y;
                newBullet.theta = body.theta;
                newBullet.velocity = this.velocity;
                newBullet.radius = this.radius;
                newBullet.friction = 0;
                this.ammos[++this.id] = newBullet;
                var id_1 = this.id;
                window.setTimeout(function () {
                    delete _this.ammos[id_1];
                }, this.duration);
            }
        };
        LaserWeapon.prototype.empty = function () {
            this.ammos = [];
        };
        LaserWeapon.prototype.draw = function (ctx) {
            Object.values(this.ammos)
                .forEach(function (laser) { return laser.draw(ctx); });
        };
        LaserWeapon.prototype.update = function () {
            Object.values(this.ammos)
                .forEach(function (laser) { return laser.update(); });
        };
        return LaserWeapon;
    }());
    exports.default = LaserWeapon;
});
define("factory/ship", ["require", "exports", "composite/ship", "core/bullet", "core/weapon", "core/laser"], function (require, exports, ship_3, bullet_1, weapon_4, laser_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    ship_3 = __importDefault(ship_3);
    bullet_1 = __importDefault(bullet_1);
    laser_1 = __importDefault(laser_1);
    var ShipFactory = (function () {
        function ShipFactory() {
        }
        ShipFactory.prototype.makeShip = function (boundX, boundY) {
            var x = boundX / 2;
            var y = boundY / 2;
            var theta = 0;
            var velocity = 0;
            var radius = 15;
            var friction = 0.95;
            var hp = 100;
            return new ship_3.default(x, y, theta, velocity, radius, friction, hp);
        };
        ShipFactory.prototype.makeBullet = function () {
            var count = 10;
            var radius = 2;
            var velocity = 5;
            var duration = 7500;
            return new bullet_1.default(weapon_4.WeaponType.Bullet, count, radius, velocity, duration);
        };
        ShipFactory.prototype.makeLaser = function () {
            var count = 1;
            var radius = 15;
            var velocity = 0;
            var duration = 500;
            return new laser_1.default(weapon_4.WeaponType.Laser, count, radius, velocity, duration);
        };
        ShipFactory.prototype.build = function (boundX, boundY) {
            var bullet = this.makeBullet();
            var laser = this.makeLaser();
            var ship = this.makeShip(boundX, boundY);
            ship.setWeapons(bullet, laser);
            return ship;
        };
        return ShipFactory;
    }());
    exports.default = ShipFactory;
});
define("factory/alien", ["require", "exports", "composite/alien", "core/bullet", "core/weapon", "utils/math2"], function (require, exports, alien_3, bullet_2, weapon_5, Math2_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    alien_3 = __importDefault(alien_3);
    bullet_2 = __importDefault(bullet_2);
    Math2_2 = __importDefault(Math2_2);
    var AlienFactory = (function () {
        function AlienFactory() {
        }
        AlienFactory.prototype.makeAlien = function (boundX, boundY) {
            var x = Math2_2.default.random(0, boundX);
            var y = Math2_2.default.random(0, boundY);
            var theta = Math2_2.default.random(0, Math.PI * 2);
            var velocity = 3;
            var radius = 15;
            var friction = 0;
            return new alien_3.default(x, y, theta, velocity, radius, friction);
        };
        AlienFactory.prototype.makeBullet = function () {
            var count = 10;
            var radius = 2;
            var velocity = 5;
            var duration = 7500;
            return new bullet_2.default(weapon_5.WeaponType.Bullet, count, radius, velocity, duration);
        };
        AlienFactory.prototype.makeAlienWithWeapons = function (boundX, boundY) {
            var bullet = this.makeBullet();
            var alien = this.makeAlien(boundX, boundY);
            alien.setWeapons(bullet);
            return alien;
        };
        AlienFactory.prototype.build = function (boundX, boundY, count) {
            var _this = this;
            return Array(count).fill(null).map(function (_) { return _this.makeAlienWithWeapons(boundX, boundY); });
        };
        return AlienFactory;
    }());
    exports.default = AlienFactory;
});
define("factory/asteroid", ["require", "exports", "composite/asteroid", "utils/math2"], function (require, exports, asteroid_3, Math2_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    asteroid_3 = __importDefault(asteroid_3);
    Math2_3 = __importDefault(Math2_3);
    var AsteroidFactory = (function () {
        function AsteroidFactory() {
        }
        AsteroidFactory.prototype.makeAsteroid = function (boundX, boundY) {
            var x = Math2_3.default.random(0, boundX);
            var y = Math2_3.default.random(0, boundY);
            var theta = Math2_3.default.random(0, Math.PI * 2);
            var velocity = Math2_3.default.random(5, 10) / 10;
            var radius = Math2_3.default.random(20, 30);
            var friction = 1;
            var hp = Math2_3.default.random(30, 50);
            return new asteroid_3.default(x, y, theta, velocity, radius, friction, hp);
        };
        AsteroidFactory.prototype.build = function (boundX, boundY, count) {
            var _this = this;
            return Array(count).fill(null).map(function (_) { return _this.makeAsteroid(boundX, boundY); });
        };
        return AsteroidFactory;
    }());
    exports.default = AsteroidFactory;
});
define("index", ["require", "exports", "core/Game", "factory/ship", "factory/alien", "factory/asteroid", "utils/Observer"], function (require, exports, Game_1, ship_4, alien_4, asteroid_4, observer_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Game_1 = __importDefault(Game_1);
    ship_4 = __importDefault(ship_4);
    alien_4 = __importDefault(alien_4);
    asteroid_4 = __importDefault(asteroid_4);
    observer_2 = __importDefault(observer_2);
    'use strict';
    (function () {
        var _a;
        var width = window.innerWidth;
        var height = window.innerHeight;
        var InfoView = document.getElementById('info');
        var messageTimeout;
        var observer = new observer_2.default();
        observer.on('message', function (msg) {
            if (InfoView.innerHTML !== '') {
                return;
            }
            InfoView.innerHTML = msg;
            if (messageTimeout) {
                window.clearTimeout(messageTimeout);
            }
            messageTimeout = window.setTimeout(function () {
                InfoView.innerHTML = '';
            }, 3000);
        });
        var canvas = document.getElementById('canvas');
        canvas.width = width;
        canvas.height = height;
        var ship = new ship_4.default().build(width, height);
        var aliens = new alien_4.default().build(width, height, 2);
        var asteroids = new asteroid_4.default().build(width, height, 10);
        var game = new Game_1.default(canvas);
        (_a = game
            .setup()
            .setObserver(observer)).setBodies.apply(_a, __spread([ship], aliens, asteroids)).start();
    })();
});
define("core/effect", ["require", "exports", "utils/math2", "core/particle"], function (require, exports, math2_5, particle_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    math2_5 = __importDefault(math2_5);
    particle_3 = __importDefault(particle_3);
    var Effect = (function () {
        function Effect(count) {
            this.count = count;
            this.particles = [];
        }
        Effect.prototype.setup = function (body) {
            var degree = 360 / this.count;
            this.particles = Array(this.count).fill(0).map(function (_, i) {
                var theta = math2_5.default.degreeToTheta(degree * i);
                var thetaX = Math.cos(theta);
                var thetaY = Math.sin(theta);
                var spread = 25;
                var particle = new particle_3.default();
                particle.x = body.x + thetaX * spread;
                particle.y = body.y + thetaY * spread;
                particle.velocity = -0.5;
                particle.radius = 2;
                particle.friction = 0.95;
                return particle;
            });
        };
        Effect.prototype.draw = function (ctx) {
            this.particles.forEach(function (p) { return p.draw(ctx); });
        };
        Effect.prototype.update = function () {
            var _this = this;
            this.particles.forEach(function (p) {
                p.radius -= 0.05;
                p.update();
                if (p.radius < 0) {
                    _this.particles = [];
                }
            });
        };
        return Effect;
    }());
    exports.default = Effect;
});
