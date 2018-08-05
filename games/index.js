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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
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
define("utils/KeyCode", ["require", "exports"], function (require, exports) {
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
define("core/Body", ["require", "exports", "utils/Observer"], function (require, exports, Observer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Observer_1 = __importDefault(Observer_1);
    var Body = (function () {
        function Body(x, y, theta, velocity, radius, friction, hp) {
            this.x = x;
            this.y = y;
            this.theta = theta;
            this.velocity = velocity;
            this.radius = radius;
            this.friction = friction;
            this.hp = hp;
            this.maxHp = hp;
            this.observer = new Observer_1.default();
            this.setup();
        }
        Body.prototype.setup = function () { };
        Body.prototype.draw = function (_ctx) {
            throw new Error('draw is not implemented');
        };
        Body.prototype.update = function () {
            this.x += Math.cos(this.theta) * this.velocity;
            this.y += Math.sin(this.theta) * this.velocity;
            if (this.friction) {
                this.velocity *= this.friction;
            }
        };
        Body.prototype.collision = function (body) {
            var x = Math.pow(this.x - body.x, 2);
            var y = Math.pow(this.y - body.y, 2);
            var radius = this.radius + body.radius;
            return Math.sqrt(x + y) < radius;
        };
        Body.prototype.setObserver = function (o) {
            this.observer = o;
        };
        Body.prototype.on = function (event, fn) {
            this.observer.on(event, fn);
        };
        Body.prototype.emit = function (event) {
            var _a;
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            (_a = this.observer).emit.apply(_a, __spread([event], args));
        };
        return Body;
    }());
    exports.default = Body;
});
define("core/HealthBar", ["require", "exports", "core/Body"], function (require, exports, Body_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Body_1 = __importDefault(Body_1);
    var HealthBar = (function (_super) {
        __extends(HealthBar, _super);
        function HealthBar() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        HealthBar.prototype.draw = function (ctx) {
            if (!this.isVisible) {
                return;
            }
            var width = 50;
            var height = 5;
            var spacing = 1;
            var padding = spacing * 2;
            var hpRatio = this.hp / this.maxHp;
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.theta);
            ctx.beginPath();
            ctx.rect(0, 0, width, height);
            ctx.strokeStyle = 'white';
            ctx.stroke();
            ctx.closePath();
            ctx.beginPath();
            ctx.rect(spacing, spacing, Math.max(0, hpRatio * (width - padding)), height - padding);
            if (hpRatio < 0.25) {
                ctx.fillStyle = 'red';
            }
            else if (hpRatio < 0.5) {
                ctx.fillStyle = 'orange';
            }
            else {
                ctx.fillStyle = 'white';
            }
            ctx.fill();
            ctx.closePath();
            ctx.restore();
        };
        return HealthBar;
    }(Body_1.default));
    exports.default = HealthBar;
});
define("utils/Math2", ["require", "exports"], function (require, exports) {
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
define("core/Particle", ["require", "exports", "core/Body"], function (require, exports, Body_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Body_2 = __importDefault(Body_2);
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
    }(Body_2.default));
    exports.default = Particle;
});
define("core/Spark", ["require", "exports", "utils/Math2", "core/Particle"], function (require, exports, Math2_1, Particle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Math2_1 = __importDefault(Math2_1);
    Particle_1 = __importDefault(Particle_1);
    var Spark = (function () {
        function Spark(count) {
            this.count = count;
            this.particles = [];
        }
        Spark.prototype.setup = function (body) {
            var degree = 180 / this.count;
            this.particles = Array(this.count).fill(0).map(function (_, i) {
                var theta = Math2_1.default.degreeToTheta(degree * i) + (body.observerTheta ? body.observerTheta - Math.PI / 2 : 0);
                var thetaX = Math.cos(theta);
                var thetaY = Math.sin(theta);
                var spread = 10;
                var x = body.x + thetaX * spread;
                var y = body.y + thetaY * spread;
                var velocity = 0.5;
                var radius = 2;
                var friction = 0.95;
                return new Particle_1.default(x, y, theta, velocity, radius, friction, 0);
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
define("core/Asteroid", ["require", "exports", "core/Body"], function (require, exports, Body_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Body_3 = __importDefault(Body_3);
    var Asteroid = (function (_super) {
        __extends(Asteroid, _super);
        function Asteroid() {
            return _super !== null && _super.apply(this, arguments) || this;
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
        Asteroid.prototype._drawHealthBar = function (ctx) {
            if (this.healthBar) {
                this.healthBar.draw(ctx);
            }
        };
        Asteroid.prototype._drawEffect = function (ctx) {
            this.effect.draw(ctx);
        };
        Asteroid.prototype.draw = function (ctx) {
            this._drawAsteroid(ctx);
            this._drawHealthBar(ctx);
            this._drawEffect(ctx);
        };
        Asteroid.prototype.update = function () {
            _super.prototype.update.call(this);
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
            if (this.healthBar) {
                this.healthBar.x = this.x;
                this.healthBar.y = this.y - 20;
                this.healthBar.hp = this.hp;
                this.healthBar.update();
            }
            this.effect.update();
        };
        Asteroid.prototype.setHealthBar = function (healthBar) {
            this.healthBar = healthBar;
            this.healthBar.hp = this.hp;
            return this;
        };
        Asteroid.prototype.setEffect = function (effect) {
            this.effect = effect;
            return this;
        };
        return Asteroid;
    }(Body_3.default));
    exports.default = Asteroid;
});
define("core/Weapon", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var WeaponType;
    (function (WeaponType) {
        WeaponType[WeaponType["Bullet"] = 0] = "Bullet";
        WeaponType[WeaponType["Laser"] = 1] = "Laser";
    })(WeaponType = exports.WeaponType || (exports.WeaponType = {}));
});
define("core/Effect", ["require", "exports", "utils/Math2", "core/Particle"], function (require, exports, Math2_2, Particle_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Math2_2 = __importDefault(Math2_2);
    Particle_2 = __importDefault(Particle_2);
    var Effect = (function () {
        function Effect(count) {
            this.count = count;
            this.particles = [];
        }
        Effect.prototype.setup = function (body) {
            var degree = 360 / this.count;
            this.particles = Array(this.count).fill(0).map(function (_, i) {
                var theta = Math2_2.default.degreeToTheta(degree * i);
                var thetaX = Math.cos(theta);
                var thetaY = Math.sin(theta);
                var spread = 25;
                var x = body.x + thetaX * spread;
                var y = body.y + thetaY * spread;
                var velocity = -0.5;
                var radius = 2;
                var friction = 0.95;
                return new Particle_2.default(x, y, theta, velocity, radius, friction, 0);
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
define("core/Ship", ["require", "exports", "core/Body", "utils/KeyCode", "utils/Math2", "core/Weapon"], function (require, exports, Body_4, KeyCode_1, Math2_3, Weapon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Body_4 = __importDefault(Body_4);
    KeyCode_1 = __importDefault(KeyCode_1);
    Math2_3 = __importDefault(Math2_3);
    var Ship = (function (_super) {
        __extends(Ship, _super);
        function Ship(x, y, theta, velocity, radius, friction, hp) {
            var _this = _super.call(this, x, y, theta, velocity, radius, friction, hp) || this;
            _this.weapons = [];
            _this.weaponChoice = -1;
            _this.alphaState = false;
            _this.alpha = 1;
            return _this;
        }
        Ship.prototype.setWeapons = function () {
            var weapons = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                weapons[_i] = arguments[_i];
            }
            this.weapons = weapons;
            if (this.weapons.length) {
                this.weaponChoice = this.weapons[0].type;
            }
            return this;
        };
        Ship.prototype.setEffect = function (effect) {
            this.effect = effect;
            return this;
        };
        Ship.prototype.setHealthBar = function (healthBar) {
            this.healthBar = healthBar;
            this.healthBar.hp = this.hp;
            return this;
        };
        Ship.prototype.setup = function () {
            var _this = this;
            document.addEventListener('keydown', function (evt) {
                switch (evt.keyCode) {
                    case KeyCode_1.default.Left:
                        _this.theta -= Math2_3.default.degreeToTheta(10);
                        break;
                    case KeyCode_1.default.Right:
                        _this.theta += Math2_3.default.degreeToTheta(10);
                        break;
                    case KeyCode_1.default.Up:
                        _this.velocity = 5;
                        break;
                    case KeyCode_1.default.Shift:
                        _this.effect.setup(_this);
                        _this.x = Math2_3.default.random(0, window.innerWidth);
                        _this.y = Math2_3.default.random(0, window.innerHeight);
                        break;
                    case KeyCode_1.default.Space:
                        _this.getWeapon().reload(_this);
                        break;
                    case KeyCode_1.default.Enter:
                        _this.swapWeapon();
                        break;
                }
            });
        };
        Ship.prototype.getWeapon = function () {
            return this.weapons[this.weaponChoice];
        };
        Ship.prototype.swapWeapon = function () {
            this.weaponChoice++;
            if (this.weaponChoice > this.weapons.length - 1) {
                this.weaponChoice = 0;
            }
            switch (this.weaponChoice) {
                case Weapon_1.WeaponType.Laser:
                    this.emit('message', 'the laser is beautiful (but useless)');
                    break;
                case Weapon_1.WeaponType.Bullet:
                    this.emit('message', 'old school weapon works wonders');
                    break;
            }
        };
        Ship.prototype.update = function () {
            var _this = this;
            _super.prototype.update.call(this);
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
            this.weapons.forEach(function (weapon) {
                if (weapon.type === Weapon_1.WeaponType.Laser) {
                    Object.values(weapon.ammos).forEach(function (ammo) {
                        ammo.x = _this.x;
                        ammo.y = _this.y;
                        ammo.theta = _this.theta;
                    });
                }
                weapon.update();
            });
            this.effect.update();
            if (this.healthBar) {
                this.healthBar.hp = this.hp;
                this.healthBar.x = this.x;
                this.healthBar.y = this.y - 20;
                this.healthBar.update();
            }
        };
        Ship.prototype.draw = function (ctx) {
            this._drawShip(ctx);
            this._drawOthers(ctx);
        };
        Ship.prototype._drawShip = function (ctx) {
            var dimension = this.radius;
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.theta);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-dimension, -dimension);
            ctx.lineTo(dimension, 0);
            ctx.lineTo(-dimension, dimension);
            if (this.isFlickering) {
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
            ctx.globalAlpha = this.alpha;
            ctx.fillStyle = 'white';
            ctx.fill();
            ctx.closePath();
            ctx.restore();
        };
        Ship.prototype._drawOthers = function (ctx) {
            this.weapons.forEach(function (w) { return w.draw(ctx); });
            this.effect.draw(ctx);
            this.healthBar.draw(ctx);
        };
        return Ship;
    }(Body_4.default));
    exports.default = Ship;
});
define("core/Alien", ["require", "exports", "core/Body", "utils/Math2"], function (require, exports, Body_5, Math2_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Body_5 = __importDefault(Body_5);
    Math2_4 = __importDefault(Math2_4);
    var Alien = (function (_super) {
        __extends(Alien, _super);
        function Alien(x, y, theta, velocity, radius, friction, hp) {
            var _this = _super.call(this, x, y, theta, velocity, radius, friction, hp) || this;
            _this.eyeX = 5;
            _this.eyeY = 5;
            _this.eyeTheta = 0;
            _this.weapons = [];
            _this.weaponChoice = -1;
            return _this;
        }
        Alien.prototype.draw = function (ctx) {
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
            this.healthBar.draw(ctx);
            this.effect.draw(ctx);
            this.weapons.forEach(function (w) { return w.draw(ctx); });
        };
        Alien.prototype.setup = function () {
            var _this = this;
            window.setInterval(function () {
                _this.effect.setup(_this);
                _this.x = Math2_4.default.random(0, window.innerWidth);
                _this.y = Math2_4.default.random(0, window.innerWidth);
                _this.theta = Math2_4.default.random(0, Math.PI * 2);
                _this.velocity = 0;
                var _loop_1 = function (i) {
                    window.setTimeout(function () {
                        if (i === 0) {
                            _this.velocity = Math2_4.default.random(1, 3);
                        }
                        _this.observerTheta = _this.eyeTheta;
                        _this.getWeapon().reload(_this);
                    }, 500 * i);
                };
                for (var i = 0; i < 2; i += 1) {
                    _loop_1(i);
                }
            }, 3000);
        };
        Alien.prototype.setWeapons = function () {
            var weapons = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                weapons[_i] = arguments[_i];
            }
            this.weapons = weapons;
            if (this.weapons.length) {
                this.weaponChoice = this.weapons[0].type;
            }
            return this;
        };
        Alien.prototype.getWeapon = function () {
            return this.weapons[this.weaponChoice];
        };
        Alien.prototype.setEffect = function (effect) {
            this.effect = effect;
            return this;
        };
        Alien.prototype.setHealthBar = function (healthBar) {
            this.healthBar = healthBar;
            this.healthBar.hp = this.hp;
            return this;
        };
        Alien.prototype.update = function () {
            _super.prototype.update.call(this);
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
            if (this.healthBar) {
                this.healthBar.hp = this.hp;
                this.healthBar.x = this.x;
                this.healthBar.y = this.y - 20;
                this.healthBar.update();
            }
            this.effect.update();
            this.weapons.forEach(function (weapon) { return weapon.update(); });
        };
        return Alien;
    }(Body_5.default));
    exports.default = Alien;
});
define("core/Game", ["require", "exports", "utils/KeyCode", "core/Asteroid", "core/Ship", "core/Weapon", "core/Alien", "utils/Math2"], function (require, exports, KeyCode_2, Asteroid_1, Ship_1, Weapon_2, Alien_1, Math2_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    KeyCode_2 = __importDefault(KeyCode_2);
    Asteroid_1 = __importDefault(Asteroid_1);
    Ship_1 = __importDefault(Ship_1);
    Alien_1 = __importDefault(Alien_1);
    Math2_5 = __importDefault(Math2_5);
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
    var Game = (function () {
        function Game(canvas) {
            this.canvas = canvas;
            this.ctx = this.canvas.getContext('2d');
            this.requestId = -1;
            this.isSetup = false;
            this.bodies = {};
            this.cache = {};
            this.showHealthBarDuration = 3000;
        }
        Game.prototype.setup = function () {
            var _this = this;
            if (this.isSetup) {
                return this;
            }
            document.addEventListener('keydown', function (evt) {
                if (evt.keyCode === KeyCode_2.default.Pause) {
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
        Game.prototype.draw = function () {
            var _this = this;
            this.ctx.save();
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            if (Object.values(this.bodies).length === 1 && this.bodies[0] instanceof Ship_1.default) {
                this.observer.emit('message', 'you saved the universe again! well done!');
            }
            Object.entries(this.bodies).forEach(function (_a) {
                var _b = __read(_a, 2), id = _b[0], body = _b[1];
                body.draw(_this.ctx);
                body.update();
                if (body instanceof Asteroid_1.default) {
                    var asteroid_1 = body;
                    Object.entries(_this.bodies).forEach(function (_a) {
                        var _b = __read(_a, 2), _ = _b[0], body2 = _b[1];
                        if (body2 instanceof Ship_1.default) {
                            var ship_1 = body2;
                            var weapon_1 = ship_1.getWeapon();
                            if (weapon_1.type === Weapon_2.WeaponType.Bullet) {
                                Object.entries(ship_1.getWeapon().ammos).forEach(function (_a) {
                                    var _b = __read(_a, 2), ammoId = _b[0], ammo = _b[1];
                                    if (ammo.collision(asteroid_1)) {
                                        asteroid_1.hp -= weapon_1.damage;
                                        delete ship_1.getWeapon().ammos[Number(ammoId)];
                                        ammo.observerTheta = Math.atan2(ammo.y - asteroid_1.y, ammo.x - asteroid_1.x);
                                        asteroid_1.effect.setup(ammo);
                                        asteroid_1.healthBar.isVisible = true;
                                        var cacheId = "bullet:" + ammoId;
                                        if (_this.cache[cacheId]) {
                                            window.clearTimeout(_this.cache[cacheId]);
                                        }
                                        _this.cache[cacheId] = window.setTimeout(function () {
                                            asteroid_1.healthBar.isVisible = false;
                                        }, _this.showHealthBarDuration);
                                        if (asteroid_1.hp < 0) {
                                            delete _this.bodies[Number(id)];
                                            window.clearTimeout(_this.cache[cacheId]);
                                            delete _this.cache[cacheId];
                                        }
                                    }
                                });
                            }
                        }
                    });
                }
                if (body instanceof Alien_1.default) {
                    var alien_1 = body;
                    Object.entries(_this.bodies).forEach(function (_a) {
                        var _b = __read(_a, 2), _ = _b[0], body2 = _b[1];
                        if (body2 instanceof Ship_1.default) {
                            var ship_2 = body2;
                            var weapon_2 = ship_2.getWeapon();
                            if (weapon_2.type === Weapon_2.WeaponType.Bullet) {
                                Object.entries(ship_2.getWeapon().ammos).forEach(function (_a) {
                                    var _b = __read(_a, 2), ammoId = _b[0], ammo = _b[1];
                                    if (ammo.collision(alien_1)) {
                                        alien_1.hp -= weapon_2.damage;
                                        delete ship_2.getWeapon().ammos[Number(ammoId)];
                                        alien_1.healthBar.isVisible = true;
                                        var cacheId = "ship:bullet:" + ammoId;
                                        if (_this.cache[cacheId]) {
                                            window.clearTimeout(_this.cache[cacheId]);
                                        }
                                        _this.cache[cacheId] = window.setTimeout(function () {
                                            alien_1.healthBar.isVisible = false;
                                        }, _this.showHealthBarDuration);
                                        if (alien_1.hp < 0) {
                                            delete _this.bodies[Number(id)];
                                            window.clearTimeout(_this.cache[cacheId]);
                                            delete _this.cache[cacheId];
                                        }
                                    }
                                });
                            }
                        }
                    });
                }
                if (body instanceof Ship_1.default) {
                    var ship_3 = body;
                    if (!_this.cache['invisibility']) {
                        Object.entries(_this.bodies).forEach(function (_a) {
                            var _b = __read(_a, 2), _ = _b[0], body2 = _b[1];
                            if (body2 instanceof Asteroid_1.default) {
                                var asteroid = body2;
                                if (body.collision(asteroid)) {
                                    ship_3.hp--;
                                    _this.observer.emit('message', asteroidMessages[Math2_5.default.random(0, asteroidMessages.length - 1)]);
                                    ship_3.isFlickering = true;
                                    _this.cache['invisibility'] = window.setTimeout(function () {
                                        ship_3.isFlickering = false;
                                        window.clearTimeout(_this.cache['invisibility']);
                                        delete _this.cache['invisibility'];
                                    }, 3000);
                                    ship_3.healthBar.isVisible = true;
                                    var cacheId = 'ship';
                                    if (_this.cache[cacheId]) {
                                        window.clearTimeout(_this.cache[cacheId]);
                                    }
                                    _this.cache[cacheId] = window.setTimeout(function () {
                                        ship_3.healthBar.isVisible = false;
                                    }, _this.showHealthBarDuration);
                                    if (ship_3.hp < 0) {
                                        _this.observer.emit('message', 'game over');
                                        delete _this.bodies[Number(id)];
                                        window.clearTimeout(_this.cache[cacheId]);
                                        delete _this.cache[cacheId];
                                    }
                                }
                            }
                            if (body2 instanceof Alien_1.default) {
                                var alien_2 = body2;
                                alien_2.eyeTheta = Math.atan2(body.y - alien_2.y, body.x - alien_2.x);
                                var weapon_3 = alien_2.getWeapon();
                                Object.entries(alien_2.getWeapon().ammos).forEach(function (_a) {
                                    var _b = __read(_a, 2), ammoId = _b[0], ammo = _b[1];
                                    if (ammo.collision(ship_3)) {
                                        ship_3.hp -= weapon_3.damage;
                                        ship_3.isFlickering = true;
                                        _this.observer.emit('message', alientAttackMessages[Math2_5.default.random(0, alientAttackMessages.length - 1)]);
                                        _this.cache['invisibility'] = window.setTimeout(function () {
                                            ship_3.isFlickering = false;
                                            window.clearTimeout(_this.cache['invisibility']);
                                            delete _this.cache['invisibility'];
                                        }, 3000);
                                        delete alien_2.getWeapon().ammos[Number(ammoId)];
                                        ship_3.healthBar.isVisible = true;
                                        var cacheId = "alien:bullet:" + ammoId;
                                        if (_this.cache[cacheId]) {
                                            window.clearTimeout(_this.cache[cacheId]);
                                        }
                                        _this.cache[cacheId] = window.setTimeout(function () {
                                            ship_3.healthBar.isVisible = false;
                                        }, _this.showHealthBarDuration);
                                        if (ship_3.hp < 0) {
                                            _this.observer.emit('message', 'game over');
                                            delete _this.bodies[Number(id)];
                                            window.clearTimeout(_this.cache[cacheId]);
                                            delete _this.cache[cacheId];
                                        }
                                    }
                                });
                            }
                        });
                    }
                }
            });
            this.requestId = window.requestAnimationFrame(this.draw.bind(this));
        };
        Game.prototype.restart = function () {
            throw new Error('not implemented');
        };
        Game.prototype.setBodies = function () {
            var _this = this;
            var bodies = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                bodies[_i] = arguments[_i];
            }
            this.bodies = bodies.reduce(function (acc, body, i) {
                body.setObserver(_this.observer);
                acc[i] = body;
                return acc;
            }, {});
            return this;
        };
        Game.prototype.setObserver = function (o) {
            this.observer = o;
            return this;
        };
        return Game;
    }());
    exports.default = Game;
});
define("core/Bullet", ["require", "exports", "core/Body"], function (require, exports, Body_6) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Body_6 = __importDefault(Body_6);
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
    }(Body_6.default));
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
                var newBullet = new Bullet(body.x, body.y, body.observerTheta ? body.observerTheta : body.theta, this.velocity, this.radius, 0, 0);
                this.ammos[++this.id] = newBullet;
                var id_1 = this.id;
                window.setTimeout(function () {
                    delete _this.ammos[id_1];
                }, this.duration);
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
define("core/Laser", ["require", "exports", "core/Body"], function (require, exports, Body_7) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Body_7 = __importDefault(Body_7);
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
    }(Body_7.default));
    var LaserWeapon = (function () {
        function LaserWeapon(type, count, radius, velocity, duration) {
            this.damage = 20;
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
                var newBullet = new Laser(body.x, body.y, body.theta, this.velocity, this.radius, 0, 9999);
                this.ammos[++this.id] = newBullet;
                var id_2 = this.id;
                window.setTimeout(function () {
                    delete _this.ammos[id_2];
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
define("index", ["require", "exports", "core/Game", "core/Ship", "core/Bullet", "core/Laser", "core/Weapon", "core/Asteroid", "core/Effect", "core/HealthBar", "core/Alien", "core/Spark", "utils/Math2", "utils/Observer"], function (require, exports, Game_1, Ship_2, Bullet_1, Laser_1, Weapon_3, Asteroid_2, Effect_1, HealthBar_1, Alien_2, Spark_1, Math2_6, Observer_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Game_1 = __importDefault(Game_1);
    Ship_2 = __importDefault(Ship_2);
    Bullet_1 = __importDefault(Bullet_1);
    Laser_1 = __importDefault(Laser_1);
    Asteroid_2 = __importDefault(Asteroid_2);
    Effect_1 = __importDefault(Effect_1);
    HealthBar_1 = __importDefault(HealthBar_1);
    Alien_2 = __importDefault(Alien_2);
    Spark_1 = __importDefault(Spark_1);
    Math2_6 = __importDefault(Math2_6);
    Observer_2 = __importDefault(Observer_2);
    'use strict';
    (function () {
        var _a;
        var width = window.innerWidth;
        var height = window.innerHeight;
        var InfoView = document.getElementById('info');
        var messageTimeout;
        var observer = new Observer_2.default();
        observer.on('message', function (msg) {
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
        var bullet = new Bullet_1.default(Weapon_3.WeaponType.Bullet, 10, 2, 3, 7500);
        var laser = new Laser_1.default(Weapon_3.WeaponType.Laser, 1, 15, 0, 500);
        var effect = new Effect_1.default(12);
        var healthBar = new HealthBar_1.default(10, 10, 0, 0, 0, 0, 100);
        var ship = new Ship_2.default(width / 2, height / 2, 0, 2, 15, 0.95, 100);
        ship
            .setWeapons(bullet, laser)
            .setEffect(effect)
            .setHealthBar(healthBar);
        var asteroids = Array(10).fill(null).map(function (_) {
            var x = Math2_6.default.random(0, window.innerWidth);
            var y = Math2_6.default.random(0, window.innerHeight);
            var theta = Math2_6.default.random(0, Math.PI * 2);
            var velocity = Math2_6.default.random(5, 10) / 10;
            var radius = Math2_6.default.random(20, 30);
            var friction = 1;
            var hp = Math2_6.default.random(30, 50);
            var asteroid = new Asteroid_2.default(x, y, theta, velocity, radius, friction, hp);
            var healthBar = new HealthBar_1.default(x, y, 0, 0, 0, 0, hp);
            var spark = new Spark_1.default(6);
            asteroid.setHealthBar(healthBar);
            asteroid.setEffect(spark);
            return asteroid;
        });
        var aliens = Array(2).fill(null).map(function (_) {
            var x = Math2_6.default.random(0, window.innerWidth);
            var y = Math2_6.default.random(0, window.innerHeight);
            var theta = Math2_6.default.random(0, Math.PI * 2);
            var velocity = Math2_6.default.random(5, 10) / 10;
            var radius = 15;
            var friction = 0;
            var hp = 100;
            var healthBar = new HealthBar_1.default(x, y, 0, velocity, radius, friction, hp);
            var effect = new Effect_1.default(12);
            var bullet = new Bullet_1.default(Weapon_3.WeaponType.Bullet, 10, 2, 3, 7500);
            var alien = new Alien_2.default(x, y, theta, velocity, radius, friction, hp);
            alien
                .setHealthBar(healthBar)
                .setEffect(effect)
                .setWeapons(bullet);
            return alien;
        });
        var game = new Game_1.default(canvas);
        (_a = game
            .setup()
            .setObserver(observer)).setBodies.apply(_a, __spread([ship], asteroids, aliens)).start();
    })();
});
