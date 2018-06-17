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
define("utils/id", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var id = 0;
    function gen() {
        id++;
        return id;
    }
    exports.default = gen;
});
define("utils/observer", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Observer = (function () {
        function Observer() {
            this.events = {};
        }
        Observer.prototype.on = function (event, fn) {
            if (!this.events[event]) {
                this.events[event] = [];
            }
            this.events[event].push(fn);
        };
        Observer.prototype.emit = function (event) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            if (this.events[event] && this.events[event].length > 0) {
                this.events[event].forEach(function (fn) { return fn.apply(void 0, __spread(args)); });
            }
        };
        Observer.prototype.off = function (event) {
            if (this.events[event]) {
                delete this.events[event];
            }
        };
        return Observer;
    }());
    exports.Observer = Observer;
    function makeObserver() {
        return new Observer();
    }
    exports.makeObserver = makeObserver;
});
define("core/drawable", ["require", "exports", "utils/id"], function (require, exports, id_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    id_1 = __importDefault(id_1);
    var Presentable;
    (function (Presentable) {
        Presentable[Presentable["Alien"] = 0] = "Alien";
        Presentable[Presentable["Asteroid"] = 1] = "Asteroid";
        Presentable[Presentable["Circle"] = 2] = "Circle";
        Presentable[Presentable["Eye"] = 3] = "Eye";
        Presentable[Presentable["HealthBar"] = 4] = "HealthBar";
        Presentable[Presentable["Laser"] = 5] = "Laser";
        Presentable[Presentable["Ship"] = 6] = "Ship";
    })(Presentable = exports.Presentable || (exports.Presentable = {}));
    var Boundary;
    (function (Boundary) {
        Boundary[Boundary["Bounded"] = 0] = "Bounded";
        Boundary[Boundary["None"] = 1] = "None";
        Boundary[Boundary["Repeat"] = 2] = "Repeat";
    })(Boundary = exports.Boundary || (exports.Boundary = {}));
    function flatten(drawables) {
        return drawables.reduce(function (acc, d) {
            return acc.concat(d);
        }, []);
    }
    exports.flatten = flatten;
    function reduce(drawables) {
        return drawables.reduce(function (acc, m) {
            acc[m.id] = m;
            return acc;
        }, {});
    }
    exports.reduce = reduce;
    var Drawable = (function () {
        function Drawable() {
            this.id = id_1.default();
            this.x = 0;
            this.y = 0;
            this.theta = 0;
            this.velocity = 0;
            this.friction = 1;
            this.type = Presentable.Circle;
            this.boundary = Boundary.Repeat;
            this.isVisible = true;
            this.hp = 100;
            this.maxHp = 100;
            this.damage = 0;
        }
        return Drawable;
    }());
    exports.Drawable = Drawable;
    function checkOutOfBounds(m, boundX, boundY) {
        return m.x > boundX || m.x < 0 || m.y > boundY || m.y < 0;
    }
    exports.checkOutOfBounds = checkOutOfBounds;
    function checkAngle(m1, m2) {
        return Math.atan2(m2.y - m1.y, m2.x - m1.x);
    }
    exports.checkAngle = checkAngle;
    function checkCollision(m1, m2) {
        var deltaX = Math.pow(m1.x - m2.x, 2);
        var deltaY = Math.pow(m1.y - m2.y, 2);
        var radius = m1.radius + m2.radius;
        return Math.sqrt(deltaX + deltaY) < radius;
    }
    exports.checkCollision = checkCollision;
    function checkLaserCollision(m1, m2) {
        var deltaY = Math.tan(m1.theta) * (m2.x - m1.x);
        var y2 = m1.y + deltaY;
        return Math.abs(m2.y - y2) < m2.radius;
    }
    exports.checkLaserCollision = checkLaserCollision;
    var Engine = (function () {
        function Engine() {
        }
        Engine.prototype.update = function (m, boundX, boundY, o) {
            if (!m.velocity)
                return;
            m.x += Math.cos(m.theta) * m.velocity;
            m.y += Math.sin(m.theta) * m.velocity;
            if (m.friction > 0) {
                m.velocity *= m.friction;
            }
            switch (m.boundary) {
                case Boundary.Repeat:
                    m.x = (m.x + boundX) % boundX;
                    m.y = (m.y + boundY) % boundY;
                    break;
                case Boundary.Bounded:
                    if (checkOutOfBounds(m, boundX, boundY)) {
                        o.emit('body:remove', m);
                        o.emit("body:remove:" + m.id, m);
                    }
                    break;
            }
            o.emit("update:" + m.id, m);
        };
        Engine.prototype.draw = function (ctx, m) {
            switch (m.type) {
                case Presentable.Alien:
                    drawAlien(ctx, m.x, m.y, m.alpha);
                    break;
                case Presentable.Eye:
                    drawEye(ctx, m.x, m.y, m.theta);
                    break;
                case Presentable.Ship:
                    drawShip(ctx, m.x, m.y, m.theta, m.radius, m.alpha);
                    break;
                case Presentable.HealthBar:
                    var radius = 25;
                    drawHealthBar(ctx, m.x - radius, m.y - radius, m.isVisible, m.hp, m.maxHp);
                    break;
                case Presentable.Circle:
                    drawCircle(ctx, m.x, m.y, m.theta, m.radius, true);
                    break;
                case Presentable.Asteroid:
                    drawCircle(ctx, m.x, m.y, m.theta, m.radius, false);
                    break;
                case Presentable.Laser:
                    drawLaser(ctx, m.x, m.y, m.theta, m.radius);
                    break;
                default:
                    throw new Error("drawError: " + m.type + " is not defined");
            }
        };
        return Engine;
    }());
    exports.Engine = Engine;
    function drawShip(ctx, x, y, theta, radius, alpha) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(theta);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-radius, -radius);
        ctx.lineTo(radius, 0);
        ctx.lineTo(-radius, radius);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.closePath();
        ctx.restore();
    }
    function drawCircle(ctx, x, y, theta, radius, fill) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(theta);
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2, false);
        if (fill) {
            ctx.fillStyle = 'white';
            ctx.fill();
        }
        else {
            ctx.strokeStyle = 'white';
            ctx.stroke();
        }
        ctx.closePath();
        ctx.restore();
    }
    function drawEye(ctx, x, y, theta) {
        ctx.save();
        ctx.translate(x, y);
        ctx.beginPath();
        ctx.arc(5 * Math.cos(theta), 5 * Math.sin(theta), 2, 0, Math.PI * 2, false);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.closePath();
        ctx.restore();
    }
    function drawAlien(ctx, x, y, alpha) {
        ctx.save();
        ctx.translate(x, y);
        ctx.beginPath();
        ctx.moveTo(-15, -3);
        ctx.bezierCurveTo(-20, -15, 20, -15, 15, -3);
        ctx.strokeStyle = 'white';
        ctx.globalAlpha = alpha;
        ctx.stroke();
        ctx.closePath();
        ctx.beginPath();
        ctx.rect(-20, -3, 40, 3);
        ctx.strokeStyle = 'white';
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
        ctx.strokeStyle = 'white';
        ctx.globalAlpha = alpha;
        ctx.stroke();
        ctx.closePath();
        ctx.restore();
    }
    function drawHealthBar(ctx, x, y, isVisible, hp, maxHp) {
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
        ctx.fillStyle = _healthColor(hpRatio);
        ctx.fill();
        ctx.closePath();
        ctx.restore();
    }
    function _healthColor(hpRatio) {
        if (hpRatio < 0.25) {
            return 'red';
        }
        if (hpRatio < 0.5) {
            return 'orange';
        }
        return 'white';
    }
    function drawLaser(ctx, x, y, theta, radius) {
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
    }
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
        Math2.angle = function (x1, y1, x2, y2) {
            return Math.atan2(y2 - y1, x2 - x1);
        };
        return Math2;
    }());
    exports.default = Math2;
});
define("movable/bullet", ["require", "exports", "core/drawable"], function (require, exports, drawable_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Bullet = (function (_super) {
        __extends(Bullet, _super);
        function Bullet(x, y, theta, velocity) {
            var _this = _super.call(this) || this;
            _this.type = drawable_1.Presentable.Circle;
            _this.boundary = drawable_1.Boundary.Bounded;
            _this.x = x;
            _this.y = y;
            _this.theta = theta;
            _this.velocity = velocity;
            _this.radius = 2;
            _this.damage = 5;
            return _this;
        }
        return Bullet;
    }(drawable_1.Drawable));
    exports.Bullet = Bullet;
    var AlienBullet = (function (_super) {
        __extends(AlienBullet, _super);
        function AlienBullet() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return AlienBullet;
    }(Bullet));
    exports.AlienBullet = AlienBullet;
    function makeAlienBullet(x, y, theta, radius) {
        if (radius === void 0) { radius = 5; }
        return new AlienBullet(x, y, theta, radius);
    }
    exports.makeAlienBullet = makeAlienBullet;
    var ShipBullet = (function (_super) {
        __extends(ShipBullet, _super);
        function ShipBullet() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return ShipBullet;
    }(Bullet));
    exports.ShipBullet = ShipBullet;
    function makeShipBullet(x, y, theta, radius) {
        if (radius === void 0) { radius = 5; }
        return new ShipBullet(x, y, theta, radius);
    }
    exports.makeShipBullet = makeShipBullet;
});
define("movable/eye", ["require", "exports", "core/drawable"], function (require, exports, drawable_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Eye = (function (_super) {
        __extends(Eye, _super);
        function Eye(o, parentId) {
            var _this = _super.call(this) || this;
            _this.parentId = parentId;
            _this.type = drawable_2.Presentable.Eye;
            _this.observer = o;
            _this.parentId = parentId;
            _this.events = {
                UPDATE: "update:" + _this.parentId,
                EYE: "eye:" + _this.parentId,
                HEALTH: "health:" + _this.parentId,
                REMOVE: 'body:remove'
            };
            _this.setup();
            return _this;
        }
        Eye.prototype.setup = function () {
            var _this = this;
            var _a = this.events, UPDATE = _a.UPDATE, EYE = _a.EYE, HEALTH = _a.HEALTH, REMOVE = _a.REMOVE;
            var o = this.observer;
            o.on(UPDATE, function (m) {
                _this.x = m.x;
                _this.y = m.y;
                _this.velocity = m.velocity;
            });
            o.on(EYE, function (m) {
                _this.theta = drawable_2.checkAngle(_this, m);
            });
            o.on(HEALTH, function (hp) {
                if (!hp) {
                    o.emit(REMOVE, _this);
                }
            });
        };
        return Eye;
    }(drawable_2.Drawable));
    exports.Eye = Eye;
    function makeEye(o, parentId) {
        return new Eye(o, parentId);
    }
    exports.makeEye = makeEye;
});
define("movable/healthbar", ["require", "exports", "core/drawable"], function (require, exports, drawable_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var HealthBar = (function (_super) {
        __extends(HealthBar, _super);
        function HealthBar(o, parentId, hp) {
            var _this = _super.call(this) || this;
            _this.parentId = parentId;
            _this.type = drawable_3.Presentable.HealthBar;
            _this.observer = o;
            _this.hp = hp;
            _this.maxHp = hp;
            _this.isVisible = false;
            _this.timeout = 0;
            _this.events = {
                UPDATE: "update:" + _this.parentId,
                HEALTH: "health:" + _this.parentId,
                REMOVE: 'body:remove'
            };
            _this.setup();
            return _this;
        }
        HealthBar.prototype.setup = function () {
            var _this = this;
            var _a = this.events, UPDATE = _a.UPDATE, HEALTH = _a.HEALTH, REMOVE = _a.REMOVE;
            var o = this.observer;
            o.on(UPDATE, function (m) {
                _this.x = m.x;
                _this.y = m.y;
                _this.velocity = m.velocity;
                _this.radius = m.radius;
            });
            o.on(HEALTH, function (hp) {
                _this.isVisible = true;
                _this.timeout && window.clearTimeout(_this.timeout);
                _this.timeout = window.setTimeout(function () {
                    _this.isVisible = false;
                }, 3000);
                _this.hp = hp;
                if (!_this.hp) {
                    o.emit(REMOVE, _this);
                }
            });
        };
        return HealthBar;
    }(drawable_3.Drawable));
    exports.HealthBar = HealthBar;
    function makeHealthBar(o, parentId, hp) {
        return new HealthBar(o, parentId, hp);
    }
    exports.makeHealthBar = makeHealthBar;
});
define("movable/effect", ["require", "exports", "core/drawable", "utils/math2"], function (require, exports, drawable_4, math2_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    math2_1 = __importDefault(math2_1);
    var Particle = (function (_super) {
        __extends(Particle, _super);
        function Particle(x, y, theta, velocity) {
            var _this = _super.call(this) || this;
            _this.type = drawable_4.Presentable.Circle;
            _this.boundary = drawable_4.Boundary.Bounded;
            _this.x = x;
            _this.y = y;
            _this.theta = theta;
            _this.velocity = velocity;
            _this.radius = 2;
            _this.friction = 0.95;
            return _this;
        }
        return Particle;
    }(drawable_4.Drawable));
    exports.Particle = Particle;
    function makeParticles(count, posX, posY) {
        var radian = 2 * Math.PI / count;
        return Array(count).fill(null).map(function (_, i) {
            var theta = i * radian;
            var spread = 20;
            var x = posX + spread * Math.cos(theta);
            var y = posY + spread * Math.sin(theta);
            var velocity = -0.5;
            return new Particle(x, y, theta, velocity);
        });
    }
    exports.makeParticles = makeParticles;
    var Spark = (function (_super) {
        __extends(Spark, _super);
        function Spark(x, y, theta, velocity) {
            var _this = _super.call(this) || this;
            _this.type = drawable_4.Presentable.Circle;
            _this.boundary = drawable_4.Boundary.Bounded;
            _this.x = x;
            _this.y = y;
            _this.theta = theta;
            _this.velocity = velocity;
            _this.radius = 2;
            _this.friction = 0.95;
            return _this;
        }
        return Spark;
    }(drawable_4.Drawable));
    exports.Spark = Spark;
    function makeSparks(count, posX, posY, startTheta) {
        var degree = Math.PI / count;
        var spread = math2_1.default.random(5, 10);
        return Array(count).fill(null).map(function (_, i) {
            var theta = startTheta + (i * degree - Math.PI / 2);
            var x = posX + spread * Math.cos(theta);
            var y = posY + spread * Math.sin(theta);
            var velocity = 0.5;
            return new Particle(x, y, theta, velocity);
        });
    }
    exports.makeSparks = makeSparks;
});
define("movable/alien", ["require", "exports", "core/drawable", "utils/math2", "movable/bullet", "movable/eye", "movable/healthbar", "movable/effect"], function (require, exports, drawable_5, math2_2, bullet_1, eye_1, healthbar_1, effect_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    math2_2 = __importDefault(math2_2);
    var Alien = (function (_super) {
        __extends(Alien, _super);
        function Alien(o, x, y, theta, boundX, boundY) {
            var _this = _super.call(this) || this;
            _this.type = drawable_5.Presentable.Alien;
            _this.observer = o;
            _this.x = x;
            _this.y = y;
            _this.theta = theta;
            _this.velocity = 3;
            _this.alpha = 1;
            _this.alphaState = false;
            _this.boundX = boundX;
            _this.boundY = boundY;
            _this.eyeTheta = 0;
            _this.particles = [];
            _this.radius = 15;
            _this.timeouts = {};
            _this.events = {
                TRACK_EYE: "eye:" + _this.id,
                UPDATE: "update:" + _this.id,
                DAMAGE: "damage:" + _this.id,
                REMOVE: 'body:remove',
                HEALTH: "health:" + _this.id,
                ADD: 'body:add'
            };
            _this.setup();
            return _this;
        }
        Alien.prototype.setup = function () {
            var _this = this;
            var _a = this.events, DAMAGE = _a.DAMAGE, TRACK_EYE = _a.TRACK_EYE, UPDATE = _a.UPDATE;
            var o = this.observer;
            this.timeouts['teleport'] && window.clearTimeout(this.timeouts['teleport']);
            this.timeouts['teleport'] = window.setInterval(function () {
                _this.teleport();
                _this.shootProgram(500);
                _this.shootProgram(1500);
            }, 3000);
            o.on(UPDATE, function () {
                _this.updateTeleport();
                _this.updateFlicker();
            });
            o.on(TRACK_EYE, function (m) {
                _this.eyeTheta = drawable_5.checkAngle(_this, m);
            });
            o.on(DAMAGE, function (m) {
                if (m instanceof bullet_1.Bullet) {
                    o.emit('body:remove', m);
                }
                _this.flicker(1000);
                _this.updateHp(m);
            });
        };
        Alien.prototype.shootProgram = function (duration) {
            var _this = this;
            this.timeouts['shoot'] && window.clearTimeout(this.timeouts['shoot']);
            this.timeouts['shoot'] = window.setTimeout(function () {
                _this.shoot();
            }, duration);
        };
        Alien.prototype.destroy = function () {
            var _this = this;
            var _a = this.events, DAMAGE = _a.DAMAGE, REMOVE = _a.REMOVE;
            var o = this.observer;
            o.emit.apply(o, __spread([REMOVE, this], this.particles));
            o.off(DAMAGE);
            Object.keys(this.timeouts)
                .forEach(function (k) { return window.clearTimeout(_this.timeouts[k]); });
            this.particles = [];
        };
        Alien.prototype.updateTeleport = function () {
            var _this = this;
            if (!this.particles.length) {
                return;
            }
            var REMOVE = this.events.REMOVE;
            var o = this.observer;
            this.particles.forEach(function (p) {
                if (p.radius <= 0) {
                    o.emit.apply(o, __spread([REMOVE], _this.particles));
                    _this.particles = [];
                }
                else {
                    p.radius -= 0.1;
                    p.radius = Math.max(0, p.radius);
                }
            });
        };
        Alien.prototype.updateHp = function (m) {
            var HEALTH = this.events.HEALTH;
            this.hp -= m.damage;
            this.hp = Math.max(0, this.hp);
            this.observer.emit(HEALTH, this.hp);
            if (!this.hp) {
                this.destroy();
            }
        };
        Alien.prototype.shoot = function () {
            var ADD = this.events.ADD;
            this.observer.emit(ADD, bullet_1.makeAlienBullet(this.x, this.y, this.eyeTheta));
        };
        Alien.prototype.teleport = function () {
            var _a;
            var ADD = this.events.ADD;
            if (!this.particles.length) {
                this.particles = effect_1.makeParticles(12, this.x, this.y);
                (_a = this.observer).emit.apply(_a, __spread([ADD], this.particles));
                this.x = math2_2.default.random(0, this.boundX);
                this.y = math2_2.default.random(0, this.boundY);
            }
        };
        Alien.prototype.flicker = function (duration) {
            var _this = this;
            this.isFlickering = true;
            this.timeouts['flicker'] && window.clearTimeout(this.timeouts['flicker']);
            this.timeouts['flicker'] = window.setTimeout(function () {
                _this.isFlickering = false;
            }, duration);
        };
        Alien.prototype.updateFlicker = function () {
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
        return Alien;
    }(drawable_5.Drawable));
    exports.Alien = Alien;
    var AlienFactory = (function () {
        function AlienFactory() {
        }
        AlienFactory.prototype.makeAlien = function (o, boundX, boundY) {
            var x = math2_2.default.random(0, boundX);
            var y = math2_2.default.random(0, boundY);
            var theta = math2_2.default.random(0, Math.PI * 2);
            return new Alien(o, x, y, theta, boundX, boundY);
        };
        AlienFactory.prototype.build = function (o, boundX, boundY) {
            var alien = this.makeAlien(o, boundX, boundY);
            var eye = eye_1.makeEye(o, alien.id);
            var healthBar = healthbar_1.makeHealthBar(o, alien.id, 100);
            return [alien, eye, healthBar];
        };
        return AlienFactory;
    }());
    exports.AlienFactory = AlienFactory;
});
define("movable/asteroid", ["require", "exports", "core/drawable", "utils/math2", "movable/effect", "movable/bullet", "movable/healthbar"], function (require, exports, drawable_6, math2_3, effect_2, bullet_2, healthbar_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    math2_3 = __importDefault(math2_3);
    var Asteroid = (function (_super) {
        __extends(Asteroid, _super);
        function Asteroid(o, x, y, theta, velocity, radius, hp) {
            var _this = _super.call(this) || this;
            _this.type = drawable_6.Presentable.Asteroid;
            _this.particles = [];
            _this.observer = o;
            _this.x = x;
            _this.y = y;
            _this.theta = theta;
            _this.velocity = velocity;
            _this.radius = radius;
            _this.hp = hp;
            _this.damage = Math.floor(radius / 2);
            _this.events = {
                UPDATE: "update:" + _this.id,
                DAMAGE: "damage:" + _this.id,
                REMOVE: 'body:remove',
                ADD: 'body:add',
                HEALTH: "health:" + _this.id
            };
            _this.setup();
            return _this;
        }
        Asteroid.prototype.setup = function () {
            var _this = this;
            var _a = this.events, UPDATE = _a.UPDATE, DAMAGE = _a.DAMAGE, REMOVE = _a.REMOVE;
            var o = this.observer;
            o.on(UPDATE, function () {
                _this.updateParticles();
            });
            o.on(DAMAGE, function (m) {
                if (m instanceof bullet_2.Bullet) {
                    o.emit(REMOVE, m);
                    _this.collisionSpark(m);
                }
                _this.updateHp(m);
            });
        };
        Asteroid.prototype.updateParticles = function () {
            var _this = this;
            var REMOVE = this.events.REMOVE;
            if (!this.particles.length) {
                return;
            }
            this.particles.forEach(function (p) {
                var _a;
                if (p.radius <= 0) {
                    (_a = _this.observer).emit.apply(_a, __spread([REMOVE], _this.particles));
                    _this.particles = [];
                }
                else {
                    p.radius -= 0.1;
                    p.radius = Math.max(0, p.radius);
                }
            });
        };
        Asteroid.prototype.updateHp = function (m) {
            var _a = this.events, HEALTH = _a.HEALTH, DAMAGE = _a.DAMAGE, REMOVE = _a.REMOVE;
            var o = this.observer;
            this.hp -= m.damage;
            this.hp = Math.max(0, this.hp);
            o.emit(HEALTH, this.hp);
            if (!this.hp) {
                o.emit.apply(o, __spread([REMOVE, this], this.particles));
                o.off(DAMAGE);
            }
        };
        Asteroid.prototype.collisionSpark = function (m) {
            var _a;
            var ADD = this.events.ADD;
            if (!this.particles.length) {
                this.particles = effect_2.makeSparks(6, m.x, m.y, drawable_6.checkAngle(this, m));
                (_a = this.observer).emit.apply(_a, __spread([ADD], this.particles));
            }
        };
        return Asteroid;
    }(drawable_6.Drawable));
    exports.Asteroid = Asteroid;
    var AsteroidFactory = (function () {
        function AsteroidFactory() {
        }
        AsteroidFactory.prototype.makeAsteroid = function (o, boundX, boundY) {
            var x = math2_3.default.random(0, boundX);
            var y = math2_3.default.random(0, boundY);
            var theta = math2_3.default.random(0, Math.PI * 2);
            var velocity = math2_3.default.random(3, 10) / 10;
            var radius = math2_3.default.random(20, 30);
            var hp = math2_3.default.random(60, 80);
            return new Asteroid(o, x, y, theta, velocity, radius, hp);
        };
        AsteroidFactory.prototype.build = function (o, boundX, boundY) {
            var asteroid = this.makeAsteroid(o, boundX, boundY);
            var healthBar = healthbar_2.makeHealthBar(o, asteroid.id, asteroid.hp);
            return [asteroid, healthBar];
        };
        return AsteroidFactory;
    }());
    exports.AsteroidFactory = AsteroidFactory;
});
define("movable/laser", ["require", "exports", "core/drawable"], function (require, exports, drawable_7) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Laser = (function (_super) {
        __extends(Laser, _super);
        function Laser(o, parentId, x, y, theta, radius) {
            var _this = _super.call(this) || this;
            _this.type = drawable_7.Presentable.Laser;
            _this.boundary = drawable_7.Boundary.None;
            _this.x = x;
            _this.y = y;
            _this.theta = theta;
            _this.radius = radius;
            _this.damage = 1;
            var UPDATE = "update:" + parentId;
            o.on(UPDATE, function (m) {
                _this.x = m.x;
                _this.y = m.y;
                _this.theta = m.theta;
            });
            return _this;
        }
        return Laser;
    }(drawable_7.Drawable));
    exports.Laser = Laser;
    function makeLaser(o, parentId, x, y, theta, radius) {
        if (radius === void 0) { radius = 5; }
        return new Laser(o, parentId, x, y, theta, radius);
    }
    exports.makeLaser = makeLaser;
});
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
define("movable/ship", ["require", "exports", "utils/math2", "utils/keycode", "core/drawable", "movable/effect", "movable/bullet", "movable/laser", "movable/healthbar"], function (require, exports, math2_4, keycode_1, drawable_8, effect_3, bullet_3, laser_1, healthbar_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    math2_4 = __importDefault(math2_4);
    keycode_1 = __importDefault(keycode_1);
    var WeaponType;
    (function (WeaponType) {
        WeaponType[WeaponType["Bullet"] = 0] = "Bullet";
        WeaponType[WeaponType["Laser"] = 1] = "Laser";
    })(WeaponType || (WeaponType = {}));
    var Ship = (function (_super) {
        __extends(Ship, _super);
        function Ship(o, x, y, boundX, boundY) {
            var _this = _super.call(this) || this;
            _this.boundX = boundX;
            _this.boundY = boundY;
            _this.type = drawable_8.Presentable.Ship;
            _this.observer = o;
            _this.x = x;
            _this.y = y;
            _this.friction = 0.95;
            _this.minVelocity = 1;
            _this.maxVelocity = 8;
            _this.velocity = _this.minVelocity;
            _this.theta = 0;
            _this.radius = 15;
            _this.alpha = 1;
            _this.alphaState = false;
            _this.bullets = 0;
            _this.invisibilityMode = false;
            _this.rotation = math2_4.default.degreeToTheta(10);
            _this.weapons = WeaponType.Bullet;
            _this.lasers = 0;
            _this.particles = [];
            _this.timeouts = {};
            _this.events = {
                UPDATE: "update:" + _this.id,
                DAMAGE: "damage:" + _this.id,
                HEALTH: "health:" + _this.id,
                REMOVE: 'body:remove',
                ADD: 'body:add',
                MESSAGE: 'message',
            };
            _this.setup();
            return _this;
        }
        Ship.prototype.bindEvents = function (evt) {
            evt.keyCode === keycode_1.default.Up && this.accelerate();
            evt.keyCode === keycode_1.default.Left && this.rotateLeft();
            evt.keyCode === keycode_1.default.Right && this.rotateRight();
            evt.keyCode === keycode_1.default.Shift && this.teleport();
            evt.keyCode === keycode_1.default.Space && this.shoot();
            evt.keyCode === keycode_1.default.Enter && this.switchWeapons();
        };
        Ship.prototype.setup = function () {
            var _this = this;
            var _a = this.events, UPDATE = _a.UPDATE, DAMAGE = _a.DAMAGE, REMOVE = _a.REMOVE;
            var o = this.observer;
            this.clickedHandler = this.bindEvents.bind(this);
            document.addEventListener('keydown', this.clickedHandler, false);
            o.on(UPDATE, function () {
                _this.updateTeleport();
                _this.updateFlicker();
                if (_this.velocity < _this.minVelocity) {
                    _this.velocity = Math.max(_this.minVelocity, _this.velocity);
                }
            });
            o.on(DAMAGE, function (m) {
                if (m instanceof bullet_3.Bullet) {
                    o.emit(REMOVE, m);
                }
                if (_this.invisibilityMode)
                    return;
                _this.enterInvisiblityMode(1000);
                _this.flicker(1000);
                _this.updateHp(m);
            });
            o.on('TOUCH_UP', function () {
                _this.accelerate();
            });
            o.on('TOUCH_LEFT', function () {
                _this.rotateLeft();
            });
            o.on('TOUCH_RIGHT', function () {
                _this.rotateRight();
            });
            o.on('TOUCH_TELEPORT', function () {
                _this.teleport();
            });
            o.on('TOUCH_SHOOT', function () {
                _this.shoot();
            });
            o.on('TOUCH_SWAP_WEAPON', function () {
                _this.switchWeapons();
            });
        };
        Ship.prototype.enterInvisiblityMode = function (duration) {
            var _this = this;
            this.invisibilityMode = true;
            this.timeouts['invisibility'] && window.clearTimeout(this.timeouts['invisibility']);
            this.timeouts['invisibility'] = window.setTimeout(function () {
                _this.invisibilityMode = false;
            }, duration);
        };
        Ship.prototype.flicker = function (duration) {
            var _this = this;
            this.isFlickering = true;
            this.timeouts['flicker'] && window.clearTimeout(this.timeouts['flicker']);
            this.timeouts['flicker'] = window.setTimeout(function () {
                _this.isFlickering = false;
            }, duration);
        };
        Ship.prototype.updateFlicker = function () {
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
        Ship.prototype.updateHp = function (m) {
            var _a = this.events, HEALTH = _a.HEALTH, MESSAGE = _a.MESSAGE;
            var o = this.observer;
            this.hp -= m.damage;
            this.hp = Math.max(0, this.hp);
            o.emit(HEALTH, this.hp);
            if (!this.hp) {
                this.unmount();
                o.emit(MESSAGE, 'game over, you failed the universe');
            }
        };
        Ship.prototype.unmount = function () {
            var _a = this.events, REMOVE = _a.REMOVE, DAMAGE = _a.DAMAGE;
            var o = this.observer;
            o.emit.apply(o, __spread([REMOVE, this], this.particles));
            o.off(DAMAGE);
            this.particles = [];
            document.removeEventListener('keydown', this.clickedHandler, false);
        };
        Ship.prototype.switchWeapons = function () {
            this.weapons++;
            this.weapons = this.weapons % 2;
        };
        Ship.prototype.accelerate = function () {
            this.velocity = this.maxVelocity;
        };
        Ship.prototype.rotateLeft = function () {
            this.theta -= this.rotation;
        };
        Ship.prototype.rotateRight = function () {
            this.theta += this.rotation;
        };
        Ship.prototype.updateTeleport = function () {
            var _this = this;
            var REMOVE = this.events.REMOVE;
            if (!this.particles.length) {
                return;
            }
            this.particles.forEach(function (p) {
                var _a;
                if (p.radius <= 0) {
                    (_a = _this.observer).emit.apply(_a, __spread([REMOVE], _this.particles));
                    _this.particles = [];
                }
                else {
                    p.radius -= 0.1;
                    p.radius = Math.max(0, p.radius);
                }
            });
        };
        Ship.prototype.teleport = function () {
            var _a;
            var ADD = this.events.ADD;
            if (!this.particles.length) {
                this.particles = effect_3.makeParticles(12, this.x, this.y);
                (_a = this.observer).emit.apply(_a, __spread([ADD], this.particles));
                this.x = math2_4.default.random(0, this.boundX);
                this.y = math2_4.default.random(0, this.boundY);
            }
        };
        Ship.prototype.shoot = function () {
            switch (this.weapons) {
                case WeaponType.Bullet:
                    this._shootBullet();
                    break;
                case WeaponType.Laser:
                    this._shootLaser(1000);
                    break;
            }
        };
        Ship.prototype._shootBullet = function () {
            var _this = this;
            var ADD = this.events.ADD;
            var o = this.observer;
            if (this.bullets < 10) {
                var bullet = bullet_3.makeShipBullet(this.x, this.y, this.theta);
                var REMOVE_BULLET_1 = "body:remove:" + bullet.id;
                o.emit(ADD, bullet);
                this.bullets++;
                o.on(REMOVE_BULLET_1, function (_m) {
                    _this.bullets--;
                    o.off(REMOVE_BULLET_1);
                });
            }
        };
        Ship.prototype._shootLaser = function (duration) {
            var _this = this;
            var _a = this.events, ADD = _a.ADD, REMOVE = _a.REMOVE;
            var o = this.observer;
            if (this.lasers < 1) {
                var laser_2 = laser_1.makeLaser(o, this.id, this.x, this.y, this.theta, this.radius);
                var REMOVE_LASER_1 = "body:remove:" + laser_2.id;
                o.emit(ADD, laser_2);
                this.lasers++;
                o.on(REMOVE_LASER_1, function (_m) {
                    _this.lasers--;
                    o.off(REMOVE_LASER_1);
                });
                window.setTimeout(function () {
                    o.emit(REMOVE, laser_2);
                }, duration);
            }
        };
        return Ship;
    }(drawable_8.Drawable));
    exports.Ship = Ship;
    var ShipFactory = (function () {
        function ShipFactory() {
        }
        ShipFactory.prototype.makeShip = function (o, boundX, boundY) {
            return new Ship(o, boundX / 2, boundY / 2, boundX, boundY);
        };
        ShipFactory.prototype.build = function (o, boundX, boundY) {
            var ship = this.makeShip(o, boundX / 2, boundY / 2);
            var healthBar = healthbar_3.makeHealthBar(o, ship.id, 100);
            return [ship, healthBar];
        };
        return ShipFactory;
    }());
    exports.ShipFactory = ShipFactory;
});
define("core/game", ["require", "exports", "core/drawable", "movable/alien", "movable/bullet", "movable/asteroid", "movable/laser", "movable/ship", "utils/keycode", "utils/math2", "utils/observer"], function (require, exports, drawable_9, alien_1, bullet_4, asteroid_1, laser_3, ship_1, keycode_2, math2_5, Observer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    keycode_2 = __importDefault(keycode_2);
    math2_5 = __importDefault(math2_5);
    var messages = {
        alienAttack: [
            'oopps, that must hurt real bad',
            'alien attack!!!',
            'you have been hit by a stray alien bullet, bzzz'
        ],
        asteroidCollide: [
            'a memorable day - you got hit by an asteroid',
            'armageddon!',
            'watch out!'
        ],
        attackAsteroid: [
            '...piu piu piu',
            'take that, stones!',
            'you rock!'
        ],
        attackAlien: [
            'oops, they seem angry',
            'go down, alien!',
            'for earth!'
        ]
    };
    var Game = (function () {
        function Game(canvas) {
            this.observer = new Observer_1.Observer();
            this.requestId = -1;
            this.isSetup = false;
            this.drawables = {};
            this.canvas = canvas;
            this.ctx = this.canvas.getContext('2d');
            this.engine = new drawable_9.Engine();
            this.events = {
                ADD: 'body:add',
                REMOVE: 'body:remove',
                MESSAGE: 'message'
            };
            this.bindEvents();
        }
        Game.prototype.bindEvents = function () {
            var _this = this;
            document.addEventListener('keydown', function (evt) {
                if (evt.keyCode === keycode_2.default.Pause) {
                    _this.pause();
                }
            });
        };
        Game.prototype._setup = function () {
            var _this = this;
            var _a = this.events, ADD = _a.ADD, REMOVE = _a.REMOVE;
            var o = this.observer;
            o.on(ADD, function () {
                var drawables = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    drawables[_i] = arguments[_i];
                }
                drawables.forEach(function (d) {
                    _this.drawables[d.id] = d;
                });
            });
            o.on(REMOVE, function () {
                var drawables = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    drawables[_i] = arguments[_i];
                }
                drawables.forEach(function (d) {
                    var REMOVE_ID = "body:remove:" + d.id;
                    if (_this.drawables[d.id]) {
                        delete _this.drawables[d.id];
                        o.emit(REMOVE_ID, true);
                    }
                    else {
                        o.emit(REMOVE_ID, false);
                    }
                });
            });
        };
        Game.prototype.setup = function () {
            if (!this.isSetup) {
                this._setup();
                this.isSetup = true;
            }
            return this;
        };
        Game.prototype.setDrawables = function () {
            var drawables = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                drawables[_i] = arguments[_i];
            }
            this.drawables = drawable_9.reduce(drawables);
            return this;
        };
        Game.prototype.setObserver = function (observer) {
            this.observer = observer;
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
            this.ctx.save();
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this._draw();
            this.requestId = window.requestAnimationFrame(this.draw.bind(this));
        };
        Game.prototype._draw = function () {
            var _this = this;
            var MESSAGE = this.events.MESSAGE;
            var _a = this, o = _a.observer, e = _a.engine, ctx = _a.ctx;
            var _b = this.canvas, width = _b.width, height = _b.height;
            var drawables = Object.entries(this.drawables);
            if (drawables.length === 1 && drawables[0] instanceof ship_1.Ship) {
                o.emit(MESSAGE, 'you saved the earth, again');
            }
            drawables.forEach(function (_a) {
                var _b = __read(_a, 2), id1 = _b[0], m1 = _b[1];
                e.draw(ctx, m1);
                e.update(m1, width, height, o);
                drawables.forEach(function (_a) {
                    var _b = __read(_a, 2), id2 = _b[0], m2 = _b[1];
                    if (id1 === id2) {
                        return;
                    }
                    _this._checkCollision(o, m1, m2);
                });
            });
        };
        Game.prototype._checkCollision = function (o, m1, m2) {
            var MESSAGE = this.events.MESSAGE;
            var DAMAGE = "damage:" + m2.id;
            var TRACK_EYE = "eye:" + m2.id;
            if (m1 instanceof ship_1.Ship && m2 instanceof alien_1.Alien) {
                o.emit(TRACK_EYE, m1);
            }
            if (m1 instanceof bullet_4.ShipBullet && m2 instanceof asteroid_1.Asteroid) {
                if (drawable_9.checkCollision(m1, m2)) {
                    o.emit(DAMAGE, m1);
                    o.emit(MESSAGE, messages.attackAsteroid[math2_5.default.random(0, messages.attackAsteroid.length)]);
                }
            }
            if (m1 instanceof bullet_4.ShipBullet && m2 instanceof alien_1.Alien) {
                if (drawable_9.checkCollision(m1, m2)) {
                    o.emit(DAMAGE, m1);
                    o.emit(MESSAGE, messages.attackAlien[math2_5.default.random(0, messages.attackAlien.length)]);
                }
            }
            if (m1 instanceof bullet_4.AlienBullet && m2 instanceof ship_1.Ship) {
                if (drawable_9.checkCollision(m1, m2)) {
                    o.emit(DAMAGE, m1);
                    o.emit(MESSAGE, messages.alienAttack[math2_5.default.random(0, messages.alienAttack.length)]);
                }
            }
            if (m1 instanceof asteroid_1.Asteroid && m2 instanceof ship_1.Ship) {
                if (drawable_9.checkCollision(m1, m2)) {
                    o.emit(DAMAGE, m1);
                    o.emit(MESSAGE, messages.asteroidCollide[math2_5.default.random(0, messages.asteroidCollide.length)]);
                }
            }
            if (m1 instanceof laser_3.Laser && (m2 instanceof asteroid_1.Asteroid || m2 instanceof alien_1.Alien)) {
                if (drawable_9.checkLaserCollision(m1, m2)) {
                    o.emit(DAMAGE, m1);
                }
            }
        };
        return Game;
    }());
    exports.default = Game;
});
define("index", ["require", "exports", "core/game", "core/drawable", "utils/observer", "movable/alien", "movable/ship", "movable/asteroid"], function (require, exports, game_1, drawable_10, observer_1, alien_2, ship_2, asteroid_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    game_1 = __importDefault(game_1);
    'use strict';
    (function () {
        var _a;
        var width = window.innerWidth;
        var height = window.innerHeight;
        var canvas = document.getElementById('canvas');
        canvas.width = width;
        canvas.height = height;
        var alienFactory = new alien_2.AlienFactory();
        var shipFactory = new ship_2.ShipFactory();
        var asteroidFactory = new asteroid_2.AsteroidFactory();
        var o = new observer_1.Observer();
        handleMessage(o);
        isTouchDevice() && handleTouch(o);
        var ship = shipFactory.build(o, width, height);
        var asteroids = Array(10).fill(null).map(function () {
            return asteroidFactory.build(o, width, height);
        });
        var aliens = Array(2).fill(null).map(function () {
            return alienFactory.build(o, width, height);
        });
        var game = new game_1.default(canvas);
        (_a = game
            .setObserver(o)).setDrawables.apply(_a, __spread(ship, drawable_10.flatten(asteroids), drawable_10.flatten(aliens))).setup()
            .start();
    })();
    function handleMessage(o) {
        var messageView = document.getElementById('message');
        var messageTimeout;
        var MESSAGE = 'message';
        o.on(MESSAGE, function (msg) {
            if (messageView.innerHTML !== '') {
                return;
            }
            messageView.innerHTML = msg;
            messageTimeout && window.clearTimeout(messageTimeout);
            messageTimeout = window.setTimeout(function () {
                messageView.innerHTML = '';
            }, 3000);
        });
    }
    function handleTouch(o) {
        var View = {
            up: document.getElementById('up'),
            left: document.getElementById('left'),
            right: document.getElementById('right'),
            shoot: document.getElementById('shoot'),
            teleport: document.getElementById('teleport'),
            weapon: document.getElementById('weapon'),
            help: document.getElementById('help')
        };
        Object.values(View).forEach(function (el) {
            el.style.display = 'block';
        });
        View.help.style.display = 'none';
        onTouch(View.up, function () {
            o.emit('TOUCH_UP');
        });
        onTouch(View.left, function () {
            o.emit('TOUCH_LEFT');
        });
        onTouch(View.right, function () {
            o.emit('TOUCH_RIGHT');
        });
        onTouch(View.shoot, function () {
            o.emit('TOUCH_SHOOT');
        });
        onTouch(View.teleport, function () {
            o.emit('TOUCH_TELEPORT');
        });
        onTouch(View.weapon, function () {
            o.emit('TOUCH_SWAP_WEAPON');
        });
    }
    function onTouch(element, fn) {
        element.addEventListener('touchstart', function (evt) {
            evt.preventDefault();
            fn && fn();
        }, { passive: true });
    }
    function isTouchDevice() {
        var prefixes = ' -webkit- -moz- -o- -ms- '.split(' ');
        var mq = function (query) {
            return window.matchMedia(query).matches;
        };
        if (('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch) {
            return true;
        }
        var query = ['(', prefixes.join('touch-enabled),('), 'heartz', ')'].join('');
        return mq(query);
    }
});
