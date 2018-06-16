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
define("utils/Observer", ["require", "exports"], function (require, exports) {
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
define("core/drawable", ["require", "exports", "utils/id"], function (require, exports, id_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    id_1 = __importDefault(id_1);
    var Presentable;
    (function (Presentable) {
        Presentable[Presentable["Alien"] = 0] = "Alien";
        Presentable[Presentable["Asteroid"] = 1] = "Asteroid";
        Presentable[Presentable["Eye"] = 2] = "Eye";
        Presentable[Presentable["Ship"] = 3] = "Ship";
        Presentable[Presentable["HealthBar"] = 4] = "HealthBar";
        Presentable[Presentable["Circle"] = 5] = "Circle";
        Presentable[Presentable["Laser"] = 6] = "Laser";
    })(Presentable = exports.Presentable || (exports.Presentable = {}));
    var Boundary;
    (function (Boundary) {
        Boundary[Boundary["Repeat"] = 0] = "Repeat";
        Boundary[Boundary["Bounded"] = 1] = "Bounded";
        Boundary[Boundary["None"] = 2] = "None";
    })(Boundary = exports.Boundary || (exports.Boundary = {}));
    function flatten(drawables) {
        return drawables.reduce(function (acc, d) {
            return acc.concat(d);
        }, []);
    }
    exports.flatten = flatten;
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
                        o.emit('bullet:delete', m);
                        o.emit("bullet:delete:" + m.id, m);
                    }
                    break;
            }
            m.observer && m.observer.emit("update:" + m.id, m);
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
        ctx.save();
        ctx.translate(x, y);
        ctx.beginPath();
        var thetaX = Math.cos(theta);
        var thetaY = Math.sin(theta);
        ctx.moveTo(thetaX * radius, thetaY * radius);
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
    }
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
define("movable/eye", ["require", "exports", "core/drawable", "utils/math2"], function (require, exports, drawable_2, math2_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    math2_1 = __importDefault(math2_1);
    var Eye = (function (_super) {
        __extends(Eye, _super);
        function Eye(o, parentId) {
            var _this = _super.call(this) || this;
            _this.parentId = parentId;
            _this.type = drawable_2.Presentable.Eye;
            _this.observer = o;
            _this.parentId = parentId;
            _this.setup();
            return _this;
        }
        Eye.prototype.setup = function () {
            var _this = this;
            var o = this.observer;
            o.on("update:" + this.parentId, function (m) {
                _this.x = m.x;
                _this.y = m.y;
                _this.velocity = m.velocity;
            });
            o.on("eye:" + this.parentId, function (m) {
                _this.theta = math2_1.default.angle(_this.x, _this.y, m.x, m.y);
            });
            o.on("health:" + this.parentId, function (hp) {
                if (!hp) {
                    o.emit('body:remove', _this.id);
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
            _this.visibleTimeout = 0;
            _this.observer = o;
            _this.hp = hp;
            _this.maxHp = hp;
            _this.isVisible = false;
            _this.setup();
            return _this;
        }
        HealthBar.prototype.setup = function () {
            var _this = this;
            var o = this.observer;
            o.on("update:" + this.parentId, function (m) {
                _this.x = m.x;
                _this.y = m.y;
                _this.velocity = m.velocity;
                _this.radius = m.radius;
            });
            o.on("health:" + this.parentId, function (hp) {
                _this.isVisible = true;
                if (_this.visibleTimeout) {
                    window.clearTimeout(_this.visibleTimeout);
                }
                _this.visibleTimeout = window.setTimeout(function () {
                    _this.isVisible = false;
                }, 3000);
                _this.hp = hp;
                if (!_this.hp) {
                    o.emit('body:remove', _this.id);
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
define("movable/effect", ["require", "exports", "core/drawable", "utils/math2"], function (require, exports, drawable_4, math2_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    math2_2 = __importDefault(math2_2);
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
        var degree = 360 / count;
        return Array(count).fill(null).map(function (_, i) {
            var theta = math2_2.default.degreeToTheta(i * degree);
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
        var degree = 180 / count;
        var spread = math2_2.default.random(5, 10);
        return Array(count).fill(null).map(function (_, i) {
            var theta = math2_2.default.degreeToTheta(i * degree - 90) + startTheta;
            var x = posX + Math.cos(theta) * spread;
            var y = posY + Math.sin(theta) * spread;
            var velocity = 0.5;
            return new Particle(x, y, theta, velocity);
        });
    }
    exports.makeSparks = makeSparks;
});
define("movable/alien", ["require", "exports", "core/drawable", "utils/math2", "movable/bullet", "movable/eye", "movable/healthbar", "movable/effect"], function (require, exports, drawable_5, math2_3, bullet_1, eye_1, healthbar_1, effect_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    math2_3 = __importDefault(math2_3);
    var Alien = (function (_super) {
        __extends(Alien, _super);
        function Alien(o, x, y, theta) {
            var _this = _super.call(this) || this;
            _this.type = drawable_5.Presentable.Alien;
            _this.eyeTheta = 0;
            _this.x = x;
            _this.y = y;
            _this.theta = theta;
            _this.observer = o;
            _this.particles = [];
            _this.radius = 15;
            _this.velocity = 3;
            _this.teleportTimeout = 0;
            _this.shootTimeout = 0;
            _this.flickerTimeout = 0;
            _this.alpha = 1;
            _this.alphaState = false;
            _this.setup();
            return _this;
        }
        Alien.prototype.setup = function () {
            var _this = this;
            var o = this.observer;
            this.teleportTimeout = window.setInterval(function () {
                _this.teleport();
                _this.shootTimeout = window.setTimeout(function () {
                    _this.shoot();
                }, 500);
                if (_this.shootTimeout) {
                    window.clearTimeout(_this.shootTimeout);
                }
                _this.shootTimeout = window.setTimeout(function () {
                    _this.shoot();
                }, 1500);
            }, 3000);
            o.on("update:" + this.id, function () {
                _this.updateTeleport();
                _this.updateFlicker();
            });
            o.on("eye:" + this.id, function (m) {
                _this.eyeTheta = math2_3.default.angle(_this.x, _this.y, m.x, m.y);
            });
            o.on("damage:" + this.id, function (m) {
                if (m instanceof bullet_1.Bullet) {
                    o.emit('bullet:delete', m);
                }
                _this.flicker();
                _this.updateHp(m);
            });
        };
        Alien.prototype.unmount = function () {
            var o = this.observer;
            o.emit('body:remove', this.id);
            o.emit("particles:delete", this.particles);
            o.off("damage:" + this.id);
            window.clearTimeout(this.teleportTimeout);
            window.clearTimeout(this.shootTimeout);
            this.particles = [];
        };
        Alien.prototype.updateTeleport = function () {
            var _this = this;
            var o = this.observer;
            if (!this.particles.length) {
                return;
            }
            this.particles.forEach(function (p) {
                if (p.radius <= 0) {
                    o.emit("particles:delete", _this.particles);
                    _this.particles = [];
                }
                else {
                    p.radius -= 0.1;
                    p.radius = Math.max(0, p.radius);
                }
            });
        };
        Alien.prototype.updateHp = function (m) {
            var o = this.observer;
            this.hp -= m.damage;
            this.hp = Math.max(0, this.hp);
            o.emit("health:" + this.id, this.hp);
            if (!this.hp) {
                this.unmount();
            }
        };
        Alien.prototype.shoot = function () {
            this.observer.emit('bullet:add', bullet_1.makeAlienBullet(this.x, this.y, this.eyeTheta));
        };
        Alien.prototype.teleport = function () {
            if (!this.particles.length) {
                this.particles = effect_1.makeParticles(12, this.x, this.y);
                this.observer.emit('particles:add', this.particles);
                this.x = math2_3.default.random(0, window.innerWidth);
                this.y = math2_3.default.random(0, window.innerHeight);
            }
        };
        Alien.prototype.flicker = function () {
            var _this = this;
            this.isFlickering = true;
            if (this.flickerTimeout) {
                window.clearTimeout(this.flickerTimeout);
            }
            this.flickerTimeout = window.setTimeout(function () {
                _this.isFlickering = false;
            }, 1000);
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
            var x = math2_3.default.random(0, boundX);
            var y = math2_3.default.random(0, boundY);
            var theta = math2_3.default.random(0, Math.PI * 2);
            return new Alien(o, x, y, theta);
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
define("movable/laser", ["require", "exports", "core/drawable"], function (require, exports, drawable_6) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Laser = (function (_super) {
        __extends(Laser, _super);
        function Laser(o, parentId, x, y, theta, radius) {
            var _this = _super.call(this) || this;
            _this.type = drawable_6.Presentable.Laser;
            _this.boundary = drawable_6.Boundary.None;
            _this.x = x;
            _this.y = y;
            _this.theta = theta;
            _this.radius = radius;
            _this.observer = o;
            _this.observer.on("update:" + parentId, function (m) {
                _this.x = m.x;
                _this.y = m.y;
                _this.theta = m.theta;
            });
            _this.damage = 1;
            return _this;
        }
        return Laser;
    }(drawable_6.Drawable));
    exports.Laser = Laser;
    function makeLaser(o, parentId, x, y, theta, radius) {
        if (radius === void 0) { radius = 5; }
        return new Laser(o, parentId, x, y, theta, radius);
    }
    exports.makeLaser = makeLaser;
});
define("movable/ship", ["require", "exports", "utils/math2", "utils/keycode", "core/drawable", "movable/effect", "movable/bullet", "movable/laser", "movable/healthbar"], function (require, exports, math2_4, keycode_1, drawable_7, effect_2, bullet_2, laser_1, healthbar_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    math2_4 = __importDefault(math2_4);
    keycode_1 = __importDefault(keycode_1);
    var Ship = (function (_super) {
        __extends(Ship, _super);
        function Ship(o, x, y) {
            var _this = _super.call(this) || this;
            _this.type = drawable_7.Presentable.Ship;
            _this.observer = o;
            _this.x = x;
            _this.y = y;
            _this.friction = 0.95;
            _this.velocity = 5;
            _this.theta = 0;
            _this.radius = 15;
            _this.bullets = 0;
            _this.weapons = 0;
            _this.lasers = 0;
            _this.particles = [];
            _this.alpha = 1;
            _this.alphaState = false;
            _this.flickerTimeout = 0;
            _this.invisibilityMode = false;
            _this.invisibilityTimeout = 0;
            _this.setup();
            return _this;
        }
        Ship.prototype.bindEvents = function (evt) {
            evt.keyCode === keycode_1.default.Up && this.moveForward();
            evt.keyCode === keycode_1.default.Left && this.rotateLeft();
            evt.keyCode === keycode_1.default.Right && this.rotateRight();
            evt.keyCode === keycode_1.default.Shift && this.teleport();
            evt.keyCode === keycode_1.default.Space && this.shoot();
            evt.keyCode === keycode_1.default.Enter && this.switchWeapons();
        };
        Ship.prototype.setup = function () {
            var _this = this;
            this.clickedHandler = this.bindEvents.bind(this);
            document.addEventListener('keydown', this.clickedHandler, false);
            var o = this.observer;
            o.on("update:" + this.id, function () {
                _this.updateTeleport();
                _this.updateFlicker();
            });
            o.on("damage:" + this.id, function (m) {
                if (m instanceof bullet_2.Bullet) {
                    o.emit('bullet:delete', m);
                }
                if (_this.invisibilityMode)
                    return;
                _this.enterInvisiblityMode();
                _this.flicker();
                _this.updateHp(m);
            });
        };
        Ship.prototype.enterInvisiblityMode = function () {
            var _this = this;
            this.invisibilityMode = true;
            if (this.invisibilityTimeout) {
                window.clearTimeout(this.invisibilityTimeout);
            }
            this.invisibilityTimeout = window.setTimeout(function () {
                _this.invisibilityMode = false;
            }, 1000);
        };
        Ship.prototype.flicker = function () {
            var _this = this;
            this.isFlickering = true;
            if (this.flickerTimeout) {
                window.clearTimeout(this.flickerTimeout);
            }
            this.flickerTimeout = window.setTimeout(function () {
                _this.isFlickering = false;
            }, 1000);
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
            var o = this.observer;
            this.hp -= m.damage;
            this.hp = Math.max(0, this.hp);
            o.emit("health:" + this.id, this.hp);
            if (!this.hp) {
                this.unmount();
                o.emit('message', 'game over, you failed the universe');
            }
        };
        Ship.prototype.unmount = function () {
            var o = this.observer;
            o.emit('body:remove', this.id);
            o.emit("particles:delete", this.particles);
            o.off("damage:" + this.id);
            this.particles = [];
            document.removeEventListener('keydown', this.clickedHandler, false);
        };
        Ship.prototype.switchWeapons = function () {
            this.weapons++;
            this.weapons = this.weapons % 2;
        };
        Ship.prototype.moveForward = function () {
            this.velocity = 5;
        };
        Ship.prototype.rotateLeft = function () {
            this.theta -= math2_4.default.degreeToTheta(10);
        };
        Ship.prototype.rotateRight = function () {
            this.theta += math2_4.default.degreeToTheta(10);
        };
        Ship.prototype.updateTeleport = function () {
            var _this = this;
            if (!this.particles.length) {
                return;
            }
            this.particles.forEach(function (p) {
                if (p.radius <= 0) {
                    _this.observer.emit("particles:delete", _this.particles);
                    _this.particles = [];
                }
                else {
                    p.radius -= 0.1;
                    p.radius = Math.max(0, p.radius);
                }
            });
        };
        Ship.prototype.teleport = function () {
            if (!this.particles.length) {
                this.particles = effect_2.makeParticles(12, this.x, this.y);
                this.observer.emit('particles:add', this.particles);
                this.x = math2_4.default.random(0, window.innerWidth);
                this.y = math2_4.default.random(0, window.innerHeight);
            }
        };
        Ship.prototype.shoot = function () {
            var _this = this;
            if (this.weapons === 0) {
                if (this.bullets < 10) {
                    var bullet_3 = bullet_2.makeShipBullet(this.x, this.y, this.theta);
                    this.observer.emit('bullet:add', bullet_3);
                    this.bullets++;
                    this.observer.on("bullet:delete:" + bullet_3.id, function (_m) {
                        _this.bullets--;
                        _this.observer.off("bullet:delete:" + bullet_3.id);
                    });
                }
            }
            else if (this.weapons === 1) {
                if (this.lasers < 1) {
                    var laser_2 = laser_1.makeLaser(this.observer, this.id, this.x, this.y, this.theta, this.radius);
                    this.observer.emit('bullet:add', laser_2);
                    this.lasers++;
                    this.observer.on("bullet:delete:" + laser_2.id, function (_m) {
                        _this.observer.off("bullet:delete:" + laser_2.id);
                    });
                    window.setTimeout(function () {
                        _this.observer.emit("bullet:delete", laser_2);
                        _this.lasers--;
                    }, 1000);
                }
            }
        };
        return Ship;
    }(drawable_7.Drawable));
    exports.Ship = Ship;
    var ShipFactory = (function () {
        function ShipFactory() {
        }
        ShipFactory.prototype.makeShip = function (o, x, y) {
            return new Ship(o, x, y);
        };
        ShipFactory.prototype.build = function (o, boundX, boundY) {
            var ship = this.makeShip(o, boundX / 2, boundY / 2);
            var healthBar = healthbar_2.makeHealthBar(o, ship.id, 100);
            return [ship, healthBar];
        };
        return ShipFactory;
    }());
    exports.ShipFactory = ShipFactory;
});
define("movable/asteroid", ["require", "exports", "core/drawable", "utils/math2", "movable/effect", "movable/bullet", "movable/healthbar"], function (require, exports, drawable_8, math2_5, effect_3, bullet_4, healthbar_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    math2_5 = __importDefault(math2_5);
    var Asteroid = (function (_super) {
        __extends(Asteroid, _super);
        function Asteroid(o, x, y, theta, velocity, radius, hp) {
            var _this = _super.call(this) || this;
            _this.type = drawable_8.Presentable.Asteroid;
            _this.particles = [];
            _this.observer = o;
            _this.x = x;
            _this.y = y;
            _this.theta = theta;
            _this.velocity = velocity;
            _this.radius = radius;
            _this.hp = hp;
            _this.damage = radius / 2;
            _this.setup();
            return _this;
        }
        Asteroid.prototype.setup = function () {
            var _this = this;
            this.observer.on("update:" + this.id, function () {
                if (!_this.particles.length) {
                    return;
                }
                _this.particles.forEach(function (p) {
                    if (p.radius <= 0) {
                        _this.observer.emit("particles:delete", _this.particles);
                        _this.particles = [];
                    }
                    else {
                        p.radius -= 0.1;
                        p.radius = Math.max(0, p.radius);
                    }
                });
            });
            this.observer.on("damage:" + this.id, function (m) {
                if (m instanceof bullet_4.Bullet) {
                    _this.observer.emit('bullet:delete', m);
                    _this.collisionSpark(_this.x, _this.y, m.x, m.y);
                }
                _this.updateHp(m);
            });
        };
        Asteroid.prototype.updateHp = function (m) {
            var o = this.observer;
            this.hp -= m.damage;
            this.hp = Math.max(0, this.hp);
            o.emit("health:" + this.id, this.hp);
            if (!this.hp) {
                o.emit('body:remove', this.id);
                o.emit("particles:delete", this.particles);
                o.off("damage:" + this.id);
            }
        };
        Asteroid.prototype.collisionSpark = function (x1, y1, x2, y2) {
            if (!this.particles.length) {
                this.particles = effect_3.makeSparks(6, x2, y2, math2_5.default.angle(x1, y1, x2, y2));
                this.observer.emit('particles:add', this.particles);
            }
        };
        return Asteroid;
    }(drawable_8.Drawable));
    exports.Asteroid = Asteroid;
    var AsteroidFactory = (function () {
        function AsteroidFactory() {
        }
        AsteroidFactory.prototype.makeAsteroid = function (o, boundX, boundY) {
            var x = math2_5.default.random(0, boundX);
            var y = math2_5.default.random(0, boundY);
            var theta = math2_5.default.random(0, Math.PI * 2);
            var velocity = math2_5.default.random(3, 10) / 10;
            var radius = math2_5.default.random(20, 30);
            var hp = math2_5.default.random(60, 80);
            return new Asteroid(o, x, y, theta, velocity, radius, hp);
        };
        AsteroidFactory.prototype.build = function (o, boundX, boundY) {
            var asteroid = this.makeAsteroid(o, boundX, boundY);
            var healthBar = healthbar_3.makeHealthBar(o, asteroid.id, asteroid.hp);
            return [asteroid, healthBar];
        };
        return AsteroidFactory;
    }());
    exports.AsteroidFactory = AsteroidFactory;
});
define("core/game", ["require", "exports", "utils/keycode", "utils/math2", "utils/Observer", "core/drawable", "movable/alien", "movable/ship", "movable/asteroid", "movable/bullet", "movable/laser"], function (require, exports, keycode_2, math2_6, Observer_1, drawable_9, alien_1, ship_1, asteroid_1, bullet_5, laser_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    keycode_2 = __importDefault(keycode_2);
    math2_6 = __importDefault(math2_6);
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
            var o = this.observer;
            o.on('bullet:add', function (m) {
                _this.drawables[m.id] = m;
            });
            o.on('bullet:delete', function (m) {
                if (_this.drawables[m.id]) {
                    delete _this.drawables[m.id];
                    o.emit("bullet:delete:" + m.id, true);
                }
                else {
                    o.emit("bullet:delete:" + m.id, false);
                }
            });
            o.on('particles:add', function (metas) {
                metas.forEach(function (m) {
                    _this.drawables[m.id] = m;
                });
            });
            o.on('particles:delete', function (metas) {
                metas.forEach(function (m) {
                    delete _this.drawables[m.id];
                });
            });
            o.on('body:remove', function (id) {
                delete _this.drawables[id];
            });
            this.isSetup = true;
            return this;
        };
        Game.prototype.setDrawables = function () {
            var drawables = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                drawables[_i] = arguments[_i];
            }
            this.drawables = drawables.reduce(function (acc, m) {
                acc[m.id] = m;
                return acc;
            }, {});
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
            var _this = this;
            var o = this.observer;
            this.ctx.save();
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            var drawables = Object.entries(this.drawables);
            drawables.forEach(function (_a) {
                var _b = __read(_a, 2), _id = _b[0], m1 = _b[1];
                _this.engine.draw(_this.ctx, m1);
                _this.engine.update(m1, window.innerWidth, window.innerHeight, _this.observer);
                drawables.forEach(function (_a) {
                    var _b = __read(_a, 2), __id = _b[0], m2 = _b[1];
                    if (m1 instanceof ship_1.Ship && m2 instanceof alien_1.Alien) {
                        m1.observer.emit("eye:" + m2.id, m1);
                    }
                    if (m1 instanceof bullet_5.ShipBullet && m2 instanceof asteroid_1.Asteroid) {
                        if (drawable_9.checkCollision(m1, m2)) {
                            m2.observer.emit("damage:" + m2.id, m1);
                            o.emit('message', messages.attackAsteroid[math2_6.default.random(0, messages.attackAsteroid.length)]);
                        }
                    }
                    if (m1 instanceof bullet_5.ShipBullet && m2 instanceof alien_1.Alien) {
                        if (drawable_9.checkCollision(m1, m2)) {
                            m2.observer.emit("damage:" + m2.id, m1);
                            o.emit('message', messages.attackAlien[math2_6.default.random(0, messages.attackAlien.length)]);
                        }
                    }
                    if (m1 instanceof bullet_5.AlienBullet && m2 instanceof ship_1.Ship) {
                        if (drawable_9.checkCollision(m1, m2)) {
                            m2.observer.emit("damage:" + m2.id, m1);
                            o.emit('message', messages.alienAttack[math2_6.default.random(0, messages.alienAttack.length)]);
                        }
                    }
                    if (m1 instanceof asteroid_1.Asteroid && m2 instanceof ship_1.Ship) {
                        if (drawable_9.checkCollision(m1, m2)) {
                            m2.observer.emit("damage:" + m2.id, m1);
                            o.emit('message', messages.asteroidCollide[math2_6.default.random(0, messages.asteroidCollide.length)]);
                        }
                    }
                    if (m1 instanceof laser_3.Laser && (m2 instanceof asteroid_1.Asteroid || m2 instanceof alien_1.Alien)) {
                        if (drawable_9.checkLaserCollision(m1, m2)) {
                            m2.observer.emit("damage:" + m2.id, m1);
                        }
                    }
                });
            });
            this.requestId = window.requestAnimationFrame(this.draw.bind(this));
        };
        return Game;
    }());
    exports.default = Game;
});
define("index", ["require", "exports", "core/game", "core/drawable", "utils/Observer", "movable/alien", "movable/ship", "movable/asteroid"], function (require, exports, game_1, drawable_10, observer_1, alien_2, ship_2, asteroid_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    game_1 = __importDefault(game_1);
    'use strict';
    (function () {
        var _a;
        var width = window.innerWidth;
        var height = window.innerHeight;
        var InfoView = document.getElementById('info');
        var messageTimeout;
        var o = new observer_1.Observer();
        o.on('message', function (msg) {
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
        var alienFactory = new alien_2.AlienFactory();
        var shipFactory = new ship_2.ShipFactory();
        var asteroidFactory = new asteroid_2.AsteroidFactory();
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
