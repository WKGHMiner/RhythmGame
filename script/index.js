var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
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
var TRACKS = document.querySelectorAll(".Track");
var HITBOX = document.querySelectorAll(".HitBox");
var SCORE = document.querySelector(".Score");
var HEIGHT = TRACKS[0].clientHeight;
var setting;
var key_bind;
var global_time = -500;
var render_duration = 500;
var duration = 40;
var score = 0;
var perfect_count = 0;
var good_count = 0;
var bad_count = 0;
var miss_count = 0;
function readSetting() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch("./setting.json")];
                case 1: return [4 /*yield*/, (_a.sent()).json()];
                case 2:
                    setting = _a.sent();
                    key_bind = setting["key-bind"];
                    render_duration = setting["render-duration"];
                    duration = setting["duration"];
                    return [2 /*return*/];
            }
        });
    });
}
var Game = /** @class */ (function () {
    function Game(obj, speed) {
        this.chart = new Chart(obj);
        this.speed = speed;
    }
    Game.prototype.start = function () {
        var _this = this;
        this.start_time = performance.now();
        requestAnimationFrame(function (tick) { return _this.drawAll(tick); });
    };
    Game.prototype.drawAll = function (tick) {
        var _this = this;
        global_time = tick - this.start_time;
        for (var index = 0; index < this.chart.track; index++) {
            this.drawSingleTrack(index);
        }
        if (global_time <= this.chart.length) {
            requestAnimationFrame(function (tick) { return _this.drawAll(tick); });
        }
        else {
            console.log("Game ended!");
            console.log("Score: " + score);
            console.log("Perfect: " + perfect_count);
            console.log("Good: " + good_count);
            console.log("Bad: " + bad_count);
            console.log("Miss: " + miss_count);
        }
    };
    Game.prototype.drawSingleTrack = function (index) {
        var track = this.chart.tracks[index];
        for (var i = 0; i < track.length; i++) {
            var note = track.notes[i];
            var should_remove = note.draw(this.speed);
            if (should_remove) {
                if (note.isWaiting(global_time)) {
                    break;
                }
                else {
                    track.pop();
                }
            }
        }
    };
    return Game;
}());
var Chart = /** @class */ (function () {
    function Chart(object) {
        this.name = object["name"];
        this.music = object["music"];
        this.composer = object["composer"];
        this.illustration = object["illustration"];
        this.track = object["track"];
        this.tracks = [];
        this.length = object["length"];
        for (var _ = 0; _ < this.track; _++) {
            this.tracks.push(new Track());
        }
        this.loadChart(object);
    }
    Object.defineProperty(Chart.prototype, "level", {
        get: function () {
            return this._level;
        },
        set: function (value) {
            this._level = value;
        },
        enumerable: false,
        configurable: true
    });
    Chart.prototype.loadChart = function (object) {
        var notes = object["notes"];
        notes.sort(function (a, b) { return a["time"] - b["time"]; });
        for (var index = 0; index < notes.length; index++) {
            var note = new Tap(notes[index], index);
            this.tracks[note.track].push(note);
        }
    };
    return Chart;
}());
var Track = /** @class */ (function () {
    function Track() {
        this.notes = [];
        this.length = 0;
    }
    Track.prototype.push = function (note) {
        this.notes.push(note);
        this.length += 1;
    };
    /**
     * Trys to pop out notes based on `global_time`,
     * and return the score based on judgement.
     */
    Track.prototype.pop = function () {
        if (this.length == 0) {
            return 0;
        }
        var res = this.notes[0].judge(global_time);
        switch (res[0]) {
            case Judgement.Waiting:
                return 0;
            case Judgement.Miss:
                this.deleteHead();
                miss_count += 1;
                return 0;
            case Judgement.Perfect:
                this.deleteHead();
                perfect_count += 1;
                return res[1];
            case Judgement.Good:
                this.deleteHead();
                good_count += 1;
                return res[1];
            case Judgement.Bad:
                this.deleteHead();
                bad_count += 1;
                return res[1];
        }
    };
    Track.prototype.deleteHead = function () {
        var note = this.notes.shift();
        var node = document.getElementById("Note" + note.id);
        if (node) {
            TRACKS[note.track].removeChild(node);
        }
        this.length -= 1;
    };
    return Track;
}());
var Judgement;
(function (Judgement) {
    Judgement[Judgement["Waiting"] = 0] = "Waiting";
    Judgement[Judgement["Perfect"] = 1] = "Perfect";
    Judgement[Judgement["Good"] = 2] = "Good";
    Judgement[Judgement["Bad"] = 3] = "Bad";
    Judgement[Judgement["Miss"] = 4] = "Miss";
})(Judgement || (Judgement = {}));
var Note = /** @class */ (function () {
    function Note(object, id) {
        this.time = object["time"];
        this.track = object["track"];
        this.id = id;
    }
    Note.prototype.judge = function (current) {
        return [Judgement.Miss, 0];
    };
    Note.prototype.draw = function (speed) {
        return true;
    };
    Note.prototype.isMiss = function (global_time) {
        return true;
    };
    Note.prototype.isWaiting = function (global_time) {
        return false;
    };
    return Note;
}());
var Tap = /** @class */ (function (_super) {
    __extends(Tap, _super);
    function Tap(object, id) {
        return _super.call(this, object, id) || this;
    }
    Tap.prototype.isMiss = function () {
        return this.judge(global_time)[0] == Judgement.Miss;
    };
    Tap.prototype.isWaiting = function () {
        return this.judge(global_time)[0] == Judgement.Waiting;
    };
    Tap.prototype.judge = function (current) {
        var gap = current - this.time;
        if (gap >= (duration * 3)) {
            return [Judgement.Miss, 0];
        }
        else if (gap <= -(duration * 3)) {
            return [Judgement.Waiting, 0];
        }
        gap = Math.abs(gap);
        if (gap <= duration) {
            return [Judgement.Perfect, 1500];
        }
        else if (gap <= duration * 2) {
            return [Judgement.Good, 1000];
        }
        else {
            return [Judgement.Bad, 500];
        }
    };
    Tap.prototype.draw = function (speed) {
        var rd = render_duration / speed;
        var gap = this.time - global_time;
        var elem = document.getElementById("Note" + this.id);
        if (gap > render_duration || gap < 0) {
            if (this.isMiss() && elem) {
                TRACKS[this.track].removeChild(elem);
                elem.remove();
            }
            return true;
        }
        else {
            if (!elem) {
                elem = document.createElement("div");
                elem.className = "Tap";
                elem.id = "Note".concat(this.id);
                TRACKS[this.track].appendChild(elem);
                elem.style.top = "0%";
            }
            elem.style.transform = "translateY(".concat((1 - gap / rd) * HEIGHT, "px)");
            return false;
        }
    };
    return Tap;
}(Note));
function readChart(name) {
    return __awaiter(this, void 0, void 0, function () {
        var obj;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch("./chart/" + name + ".json")];
                case 1: return [4 /*yield*/, (_a.sent()).json()];
                case 2:
                    obj = _a.sent();
                    return [2 /*return*/, obj];
            }
        });
    });
}
function Main() {
    return __awaiter(this, void 0, void 0, function () {
        var obj, game;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, readSetting()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, readChart("Override")];
                case 2:
                    obj = _a.sent();
                    game = new Game(obj, 10);
                    document.addEventListener("keypress", function (event) {
                        var key = event.key.toUpperCase();
                        var ki = key_bind.indexOf(key);
                        if (ki != -1) {
                            HITBOX[ki].style.setProperty("background", "radial-gradient(rgba(200, 200, 200, 0.8), rgba(170, 170, 170, 0.8))");
                            TRACKS[ki].style.setProperty("background", "linear-gradient(to top, rgba(155, 155, 155, 0.3), rgba(110, 110, 110, 0.1))");
                            score += game.chart.tracks[ki].pop();
                        }
                    });
                    document.addEventListener("keyup", function (event) {
                        var key = event.key.toUpperCase();
                        var ki = key_bind.indexOf(key);
                        if (ki != -1) {
                            HITBOX[ki].style.setProperty("background", "radial-gradient(rgba(170, 170, 170, 0.8), rgba(126, 126, 126, 0.8))");
                            TRACKS[ki].style.setProperty("background", "none");
                        }
                    });
                    game.start();
                    return [2 /*return*/];
            }
        });
    });
}
Main();
