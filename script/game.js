var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Chart, Judgement } from "./play.js";
import { Effect, AudioQueue } from "./effect.js";
/** HTML element set of Tracks. */
export const TRACKS = document.querySelectorAll(".Track");
/** HTML element set of Hitboxes. */
const HITBOX = document.querySelectorAll(".HitBox");
/** HTML element of Judgement display. */
const JUDGEMENT = document.querySelector(".Judgement");
/** HTML element of Score. */
const SCORE = document.querySelector(".Score");
const PAUSED = document.querySelector(".Paused");
// Counter elements.
const PERFECT_COUNT = document.querySelector(".PerfectCount");
const GOOD_COUNT = document.querySelector(".GoodCount");
const BAD_COUNT = document.querySelector(".BadCount");
const MISS_COUNT = document.querySelector(".MissCount");
const HIT_COUNT = document.querySelector(".HitCount");
// Color literals.
const PERFECT_COLOR = "rgba(245, 241, 0, 0.6)";
const GOOD_COLOR = "rgba(0, 255, 30, 0.6)";
const BAD_COLOR = "rgba(255, 47, 0, 0.6)";
const MISS_COLOR = "rgba(255, 255, 255, 0.6)";
// Key event style literals.
const TRACKDOWN = "linear-gradient(to top, rgba(155, 155, 155, 0.3), rgba(110, 110, 110, 0.1))";
const TRACKUP = "none";
const HITDOWN = "radial-gradient(rgba(200, 200, 200, 0.8), rgba(170, 170, 170, 0.8))";
const HITUP = "radial-gradient(rgba(170, 170, 170, 0.8), rgba(126, 126, 126, 0.8))";
// Setting parameters.
var setting;
var key_bind;
export var render_duration = 500;
export var duration = 40;
export var offset = 0;
export var mvolume = 0.4;
export var svolume = 0.5;
export var isAuto = false;
// Global time counter.
export var global_time = 0;
// Statistic variables.
var score = 0;
var perfect_count = 0;
var good_count = 0;
var bad_count = 0;
var miss_count = 0;
var max_hit = 0;
var current_hit = 0;
// Status signal.
var isReady = false;
var isVisualizeAllowed = true;
// Control signal.
var isPaused = false;
var isEnded = false;
/** Read `setting.json` to update settings. */
function readSetting() {
    return __awaiter(this, void 0, void 0, function* () {
        setting = yield (yield fetch("./setting.json")).json();
        key_bind = setting["key-bind"];
        render_duration = setting["render-duration"];
        duration = setting["duration"];
        isAuto = setting["auto"];
        mvolume = setting["music-volume"];
        svolume = setting["sound-volume"];
    });
}
function readChart(path) {
    return __awaiter(this, void 0, void 0, function* () {
        var obj = yield (yield fetch(path)).json();
        return obj;
    });
}
function getReady(game) {
    document.addEventListener("keydown", event => {
        if (!isReady) {
            isReady = true;
            var prompt = document.querySelector(".Prompt");
            var mc = document.querySelector(".MainContainer");
            mc.removeChild(prompt);
            prompt.remove();
            game.start();
            document.addEventListener("keydown", event => {
                if (event.key == "Escape") {
                    game.pause();
                }
            });
        }
    });
}
/** Change the style and text of `JUDGEMENT` element based on `Judgement`. */
export function showJudgement(judgement) {
    switch (judgement) {
        case Judgement.Waiting:
            JUDGEMENT.innerText = "";
            return;
        case Judgement.Perfect:
            perfect_count += 1;
            JUDGEMENT.innerText = "Perfect";
            JUDGEMENT.style.color = PERFECT_COLOR;
            PERFECT_COUNT.innerText = `${perfect_count}`;
            break;
        case Judgement.Good:
            good_count += 1;
            JUDGEMENT.innerText = "Good";
            JUDGEMENT.style.color = GOOD_COLOR;
            GOOD_COUNT.innerText = `${good_count}`;
            break;
        case Judgement.Bad:
            bad_count += 1;
            JUDGEMENT.innerText = "Bad";
            JUDGEMENT.style.color = BAD_COLOR;
            BAD_COUNT.innerText = `${bad_count}`;
            break;
        case Judgement.Miss:
            miss_count += 1;
            JUDGEMENT.innerText = "Miss";
            JUDGEMENT.style.color = MISS_COLOR;
            MISS_COUNT.innerText = `${miss_count}`;
            break;
    }
    void JUDGEMENT.offsetWidth;
    JUDGEMENT.classList.add("zoomed");
    setTimeout(() => { JUDGEMENT.classList.remove("zoomed"); }, 125);
}
export function updateHit(judgement) {
    switch (judgement) {
        case Judgement.Waiting:
            return;
        case Judgement.Miss:
            current_hit = 0;
            break;
        default:
            current_hit += 1;
            if (current_hit > max_hit) {
                max_hit = current_hit;
            }
            break;
    }
    if (current_hit >= 3) {
        HIT_COUNT.innerText = `${current_hit}`;
    }
    else {
        HIT_COUNT.innerText = "";
    }
}
function pressOn(index) {
    HITBOX[index].style.background = HITDOWN;
    TRACKS[index].style.background = TRACKDOWN;
    SCORE.innerText = `SCORE: ${score}`;
}
function pressOut(index) {
    HITBOX[index].style.background = HITUP;
    TRACKS[index].style.background = TRACKUP;
}
class Game {
    constructor(obj, speed) {
        this.sounds = new AudioQueue();
        this.chart = new Chart(obj, this.sounds);
        this.speed = speed;
        this.offset = this.chart.offset + offset;
    }
    get isSpecial() {
        return this.chart.special;
    }
    loadContext() {
        return __awaiter(this, void 0, void 0, function* () {
            this.music = this.chart.loadMusic();
            if (this.isSpecial) {
                this.context = new window.AudioContext();
                this.music.volume = 0;
            }
            else {
                this.context = new AudioContext();
                this.music.volume = mvolume;
            }
            yield this.loadEffect();
            this.music.addEventListener("ended", event => { isEnded = true; });
        });
    }
    loadEffect() {
        return __awaiter(this, void 0, void 0, function* () {
            this.effect = new Effect(this.music, this.context, this.isSpecial);
        });
    }
    loadBg() {
        var illustration = document.querySelector(".Illustration");
        illustration.src = this.chart.illustration;
        var bg = document.querySelector(".Background");
        bg.style.backgroundImage = `url(${this.chart.illustration})`;
    }
    pause() {
        if (!isEnded && isPaused) {
            PAUSED.style.visibility = "hidden";
            this.context.resume();
            this.music.play();
            requestAnimationFrame(_ => this.drawAll());
        }
        else if (isEnded) {
            // TODO: Unimplemented.
            return;
        }
        else {
            PAUSED.style.visibility = "visible";
            this.music.pause();
            this.context.suspend();
        }
        isPaused = !isPaused;
    }
    start() {
        this.start_time = this.context.currentTime;
        this.music.play().then(() => {
            // This yields time tick., which is previously used as global time.
            requestAnimationFrame(_ => this.drawAll());
        });
    }
    drawAll() {
        global_time = Math.fround((this.context.currentTime - this.start_time) * 1000) + this.offset;
        for (let index = 0; index < this.chart.track; index++) {
            this.drawSingleTrack(index);
        }
        if (isVisualizeAllowed) {
            requestAnimationFrame(_ => this.effect.draw());
        }
        if (isEnded) {
            JUDGEMENT.innerText = "";
            HIT_COUNT.innerText = `MAX HIT: ${max_hit}`;
            this.effect.clear();
        }
        else {
            if (!isPaused) {
                requestAnimationFrame(_ => this.drawAll());
            }
        }
    }
    drawSingleTrack(index) {
        if (this.isSpecial) {
            this.sounds.pop(this.context, this.effect.analyser);
        }
        var track = this.chart.tracks[index];
        for (var i = 0; i < track.length; i++) {
            var note = track.notes[i];
            var should_remove = note.draw(this.speed);
            if (should_remove) {
                if (note.isWaiting()) {
                    break;
                }
                else {
                    this.hit(index);
                    i -= 1;
                }
            }
            if (isAuto && note.isPerfect()) {
                score += this.hit(index);
                pressOn(index);
                i -= 1;
                setTimeout(_ => pressOut(index), duration);
            }
        }
    }
    hit(index) {
        return this.chart.tracks[index].pop(this.context, this.isSpecial, this.effect.analyser);
    }
}
/** Main function
 *
 *  Integrates and choronously calls async functions, ensuring workflow.
 */
export function Main(path) {
    return __awaiter(this, void 0, void 0, function* () {
        yield readSetting();
        var obj = yield readChart(path);
        var game = new Game(obj, 10);
        game.loadBg();
        yield game.loadContext();
        if (!isAuto) {
            document.addEventListener("keydown", (event) => {
                if (!isPaused) {
                    var key = event.key.toUpperCase();
                    var ki = key_bind.indexOf(key);
                    if (ki != -1) {
                        score += game.hit(ki);
                        pressOn(ki);
                    }
                }
            });
            document.addEventListener("keyup", (event) => {
                if (!isPaused) {
                    var key = event.key.toUpperCase();
                    var ki = key_bind.indexOf(key);
                    if (ki != -1) {
                        pressOut(ki);
                    }
                }
            });
        }
        getReady(game);
    });
}
Main("./chart/Never_Escape/void Gt. HAKKYOU-KUN_Never Escape.json");
