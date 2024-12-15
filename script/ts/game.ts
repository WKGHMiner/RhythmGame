import { Chart, Track } from "./play.js";
import { Judgement } from "./notes.js";
import { Effect, AudioQueue } from "./effect.js";


/** HTML element set of Tracks. */
export const TRACKS = document.querySelectorAll(".Track") as NodeListOf<HTMLDivElement>;
/** HTML element set of Hitboxes. */
const HITBOX = document.querySelectorAll(".HitBox") as NodeListOf<HTMLDivElement>;

/** HTML element of Judgement display. */
const JUDGEMENT = document.querySelector(".Judgement") as HTMLDivElement;
/** HTML element of Score. */
const SCORE = document.querySelector(".Score") as HTMLDivElement;

const PAUSED = document.querySelector(".Paused") as HTMLDivElement;

// Counter elements.
const PERFECT_COUNT = document.querySelector(".PerfectCount") as HTMLDivElement;
const GOOD_COUNT = document.querySelector(".GoodCount") as HTMLDivElement;
const BAD_COUNT = document.querySelector(".BadCount") as HTMLDivElement;
const MISS_COUNT = document.querySelector(".MissCount") as HTMLDivElement;
const HIT_COUNT = document.querySelector(".HitCount") as HTMLDivElement;

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
var setting: Object;
var key_bind: string[];
export var render_duration: number = 500;
export var speed: number = 10;
export var duration: number = 40;
export var offset: number = 0;
export var mvolume: number = 0.4;
export var svolume: number = 0.5;
export var isAuto: boolean = false;

// Global time counter.
export var global_time: number = 0;

// Statistic variables.
var score: number = 0;
var perfect_count: number = 0;
var good_count: number = 0;
var bad_count: number = 0;
var miss_count: number = 0;
var max_hit: number = 0;
var current_hit: number = 0;

// Status signal.
var isReady: boolean = false;
var isVisualizeAllowed: boolean = true;

// Control signal.
var isPaused: boolean = false;
var isEnded: boolean = false;


/** Read `setting.json` to update settings. */
export async function readSetting() {
    setting = await (await fetch("./setting.json")).json();

    key_bind = setting["key-bind"];
    render_duration = setting["render-duration"];
    speed = setting["speed"];
    duration = setting["duration"];
    isAuto = setting["auto"];
    isVisualizeAllowed = setting["allow-visualisation"];
    mvolume = setting["music-volume"];
    svolume = setting["sound-volume"];
}


/** Read `SessionStorage` to update settings. */
function readStorage() {
    if (sessionStorage.length != 0) {
        key_bind = sessionStorage["key-bind"];
        render_duration = sessionStorage["render-duration"];
        speed = sessionStorage["speed"];
        duration = sessionStorage["duration"];
        isAuto = sessionStorage["auto"];
        isVisualizeAllowed = sessionStorage["allow-visualisation"];
        mvolume = sessionStorage["music-volume"];
        svolume = sessionStorage["sound-volume"];
    } else {
        window.alert("Invalid session data!");
    }
}


function getReady(game: Game) {
    document.addEventListener("keydown", _ => {
        if (!isReady) {
            isReady = true;

            var prompt = document.querySelector(".Prompt") as HTMLDivElement;
            var mc = document.querySelector(".MainContainer") as HTMLDivElement;
            mc.removeChild(prompt);
            prompt.remove();

            var btns = document.querySelectorAll(".PauseBtn") as NodeListOf<HTMLButtonElement>;
            btns.forEach(btn => btn.onclick = function() { game.pause() });

            var restartButton = document.querySelector(".RestartBtn") as HTMLDivElement;
            restartButton.addEventListener("click", _ => { game.restart() });
            
            game.start();

            document.addEventListener("keydown", event => {
                if (event.key == "Escape") {
                    game.pause();
                }
            })
        }
    }, { once: true })
}


/** Change the style and text of `JUDGEMENT` element based on `Judgement`. */
export function showJudgement(judgement: Judgement) {
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
    setTimeout(() => { JUDGEMENT.classList.remove("zoomed") }, 125);
}


export function updateHit(judgement: Judgement) {
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
    } else {
        HIT_COUNT.innerText = "";
    }
}


function pressOn(index: number) {
    HITBOX[index].style.background = HITDOWN;
    TRACKS[index].style.background = TRACKDOWN;
    SCORE.innerText = `SCORE: ${score}`;
}


function pressOut(index: number) {
    HITBOX[index].style.background = HITUP;
    TRACKS[index].style.background = TRACKUP;
}


function exit() {
    sessionStorage.clear();
    document.location.href = "../index.html";
}


class Game {
    speed: number = speed;
    chart: Chart;
    sounds: AudioQueue = new AudioQueue();
    effect: Effect;
    start_time: number;
    offset: number;
    music: HTMLAudioElement;
    context: AudioContext;

    constructor(obj?: Object, literal?: string) {
        if (obj) {
            this.chart = new Chart(obj, this.sounds);
        } else if (literal) {
            let obj: Object = JSON.parse(literal);
            this.chart = new Chart(obj, this.sounds);
        } else {
            throw Error("Game class can be only initalized with one parameter.");
        }

        this.offset = this.chart.offset + offset;
    }


    get isSpecial(): boolean {
        return this.chart.special;
    }
    
    
    async loadContext() {
        this.music = this.chart.loadMusic();

        if (this.isSpecial) {
            this.context = new window.AudioContext();
            this.music.volume = 0;
        } else {
            this.context = new AudioContext();
            this.music.volume = mvolume;
        }

        await this.loadEffect();

        this.music.addEventListener("ended", _ => {
            isEnded = true;
        }, {once: true});
    }


    async loadEffect() {
        this.effect = new Effect(this.music, this.context, this.isSpecial);
    }


    loadBg() {
        var illustration = document.querySelector(".Illustration") as HTMLImageElement;
        illustration.src = this.chart.illustration;

        var bg = document.querySelector(".Background") as HTMLBodyElement;
        bg.style.backgroundImage = `url(${this.chart.illustration})`;
    }


    pause() {
        if (!isEnded && isPaused) {
            PAUSED.style.visibility = "hidden";
            this.context.resume();
            this.music.play();
            requestAnimationFrame(_ => this.drawAll());
        } else if (isEnded) {
            exit();
            return;
        } else {
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
    
        for (let index = 0; index < this.chart.track; index ++) {
            this.drawSingleTrack(index);
        }

        if (isVisualizeAllowed) {
            this.effect.draw()
        }
    
        if (isEnded) {
            JUDGEMENT.innerText = "";
            HIT_COUNT.innerText = `MAX HIT: ${max_hit}`;
            this.effect.clear();
        } else {
            if (!isPaused) {
                requestAnimationFrame(_ => this.drawAll());
            }
        }
    }


    drawSingleTrack(index: number) {
        if (this.isSpecial) {
            this.sounds.pop(this.context, this.effect.analyser);
        }

        var track: Track = this.chart.tracks[index];
        for (var i = 0; i < track.length; i ++) {
            var note = track.notes[i];
            var should_remove = note.draw(this.speed);

            if (should_remove) {
                if (note.isWaiting()) {
                    break;
                } else {
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


    hit(index: number): number {
        return this.chart.tracks[index].pop(this.context, this.isSpecial, this.effect.analyser);
    }


    restart() {
        this.music.currentTime = 0;
        this.start_time = this.context.currentTime;
        this.chart.loadChart(this.sounds);
        
        score = 0;
        perfect_count = 0;
        good_count = 0;
        bad_count = 0;
        miss_count = 0;
        max_hit = 0;
        current_hit = 0;

        showJudgement(Judgement.Waiting);
        HIT_COUNT.innerText = "";
        SCORE.innerText = "SCORE: 0";

        this.pause();
        this.music.play();
        this.context.resume();
    }
}


/** Main function
 * 
 *  Integrates and choronously calls async functions, ensuring workflow.
 * 
 *  @param path The path of chart json file.
 */
export async function MainbyRead(path: string) {
    await readSetting();
    var obj: Object = await (await fetch(path)).json();
    var game = new Game(obj);

    await MainBody(game)
}


/** Main function
 * 
 *  Integrates and choronously calls async functions, ensuring workflow.
 * 
 *  @param literal The text content of chart json file.
 */
export async function MainByConvert(literal: string) {
    readStorage();
    var game = new Game(literal);

    await MainBody(game);
}


async function MainBody(game: Game) {
    game.loadBg();
    await game.loadContext();

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
}


function Main() {
    var path = sessionStorage.getItem("path");
    if (path != null) {
        MainbyRead(path);
        return;
    }

    var literal = sessionStorage.getItem("literal");
    if (literal != null) {
        MainByConvert(literal);
        return;
    }

    window.alert("Invalid Chart Infomation.");
    exit();
}


// MainbyRead("./chart/Never_Escape/void Gt. HAKKYOU-KUN_Never Escape.json");
MainbyRead("./chart/Override/Nhato_Override_Modified.json");