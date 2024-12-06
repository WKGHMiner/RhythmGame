import { Chart, Track, Judgement } from "./play.js";
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
export var setting: Object;
export var key_bind: string[];
export var render_duration: number = 500;
export var duration: number = 40;
export var offset: number = 0;
export var mvolume: number = 0.4;
export var svolume: number = 0.5;
export var auto: boolean = false;

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
async function readSetting() {
    setting = await (await fetch("./setting.json")).json();
    key_bind = setting["key-bind"];
    render_duration = setting["render-duration"];
    duration = setting["duration"];
    auto = setting["auto"];
    mvolume = setting["music-volume"];
    svolume = setting["sound-volume"];
}


async function readChart(path: string): Promise<Object> {
    var obj: Object = await (await fetch(path)).json();
    return obj;
}


function getReady(game: Game) {
    document.addEventListener("keydown", async event => {
        if (!isReady) {
            isReady = true;

            var prompt = document.querySelector(".Prompt") as HTMLDivElement;
            var mc = document.querySelector(".MainContainer") as HTMLDivElement;
            mc.removeChild(prompt);
            prompt.remove();
            
            game.start();

            document.addEventListener("keydown", event => {
                if (event.key == "Escape") {
                    game.pause();
                }
            })
        }
    })
}


/** Change the style and text of `JUDGEMENT` element based on `Judgement`. */
export function showJudgement(judgement: Judgement) {
    switch (judgement) {
        case Judgement.Waiting:
            JUDGEMENT.innerText = "";
            return;

        case Judgement.Perfect:
            JUDGEMENT.innerText = "Perfect";
            JUDGEMENT.style.color = PERFECT_COLOR;
            PERFECT_COUNT.innerText = `${perfect_count}`;
            break;
            
        case Judgement.Good:
            JUDGEMENT.innerText = "Good";
            JUDGEMENT.style.color = GOOD_COLOR;
            GOOD_COUNT.innerText = `${good_count}`;
            break;

        case Judgement.Bad:
            JUDGEMENT.innerText = "Bad";
            JUDGEMENT.style.color = BAD_COLOR;
            BAD_COUNT.innerText = `${bad_count}`;
            break;

        case Judgement.Miss:
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


class Game {
    speed: number;
    chart: Chart;
    sounds: AudioQueue;
    effect: Effect;
    start_time: number;
    offset: number;
    music: HTMLAudioElement;
    context: AudioContext;

    constructor(obj: Object, speed: number) {
        this.sounds = new AudioQueue();
        this.chart = new Chart(obj, this.sounds);
        this.speed = speed;
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

        this.music.addEventListener("ended", event => { isEnded = true })
    }


    async loadEffect() {
        if (this.isSpecial) {
            try {
                const stream = await navigator.mediaDevices.getDisplayMedia({
                    audio: true,
                    video: true,
                    selfBrowserSurface: "include"
                });
                this.effect = new Effect(stream, this.context, this.isSpecial);
            } catch (err) {
                isVisualizeAllowed = false;
            }
        } else {
            this.effect = new Effect(this.music, this.context, this.isSpecial);
        }
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
            // TODO: Unimplemented.
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
            requestAnimationFrame(_ => this.effect.draw());
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
            this.sounds.pop(this.context);
        }

        var track: Track = this.chart.tracks[index];
        for (var i = 0; i < track.length; i ++) {
            var note = track.notes[i];
            var should_remove = note.draw(this.speed);

            if (should_remove) {
                if (note.isWaiting()) {
                    break;
                } else {
                    track.pop(this.context, this.isSpecial);
                    i -= 1;
                }
            }

            if (auto && note.isPerfect()) {
                score += track.pop(this.context, this.isSpecial);
                pressOn(index);
                i -= 1;

                setTimeout(_ => pressOut(index), duration);
            }
        }
    }


    hit(index: number): number {
        return this.chart.tracks[index].pop(this.context, this.isSpecial);
    }
}


/** Main function
 * 
 *  Integrates and choronously calls async functions, ensuring workflow.
 */
async function Main(path: string) {
    await readSetting();
    var obj = await readChart(path);
    var game = new Game(obj, 10);

    game.loadBg();
    await game.loadContext();

    if (!auto) {
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


Main("./chart/Override/Nhato_Override_Modified.json")