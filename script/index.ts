/** HTML element set of Tracks. */
const TRACKS = document.querySelectorAll(".Track") as NodeListOf<HTMLDivElement>;
/** HTML element set of Hitboxes. */
const HITBOX = document.querySelectorAll(".HitBox") as NodeListOf<HTMLDivElement>;

/** HTML element of Judgement display. */
const JUDGEMENT = document.querySelector(".Judgement") as HTMLDivElement;
/** HTML element of Score. */
const SCORE = document.querySelector(".Score") as HTMLDivElement;

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
const TRACKPRESS = "linear-gradient(to top, rgba(155, 155, 155, 0.3), rgba(110, 110, 110, 0.1))";
const TRACKUP = "none";
const HITPRESS = "radial-gradient(rgba(200, 200, 200, 0.8), rgba(170, 170, 170, 0.8))";
const HITUP = "radial-gradient(rgba(170, 170, 170, 0.8), rgba(126, 126, 126, 0.8))";

// Setting parameters.
var setting: Object;
var key_bind: string[];
var render_duration: number = 500;
var duration: number = 40;
var auto: boolean = false;

// Global time counter.
var global_time: number = 0;

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

// Control signal.
var ended: boolean = false;


/** Read `setting.json` to update settings. */
async function readSetting() {
    setting = await (await fetch("./setting.json")).json();
    key_bind = setting["key-bind"];
    render_duration = setting["render-duration"];
    duration = setting["duration"];
    auto = setting["auto"];
}


async function readChart(name: string): Promise<Object> {
    var obj: Object = await (await fetch("./chart/" + name + ".json")).json();
    return obj;
}


async function getReady(game: Game) {
    document.addEventListener("keypress", event => {
        if (!isReady) {
            var prompt = document.querySelector(".Prompt") as HTMLDivElement;
            var mc = document.querySelector(".MainContainer") as HTMLDivElement;
            mc.removeChild(prompt);
            isReady = true;
            game.loadContext();
            game.start();
        }
    })
}


/** Change the style and text of `JUDGEMENT` element based on `Judgement`. */
function showJudgement(judgement: Judgement) {
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


function updateHit(judgement: Judgement) {
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


class Game {
    speed: number;
    chart: Chart;
    music: HTMLAudioElement;
    context: AudioContext;
    start_time: number;
    effect: Effect;

    constructor(obj: Object, speed: number) {
        this.chart = new Chart(obj);
        this.speed = speed;
    }
    
    
    loadContext() {
        this.music = this.chart.loadMusic();
        this.context = new AudioContext();

        this.loadEffect();

        this.music.addEventListener("ended", event => { ended = true })
    }


    loadEffect() {
        this.effect = new Effect(this.music, this.context);
    }


    loadBg() {
        var bg = document.querySelector(".Background") as HTMLImageElement;
        bg.src = this.chart.illustration;
    }


    start() {
        this.start_time = this.context.currentTime;
        this.music.play().then(() => {
            // This yields time tick., which is previously used as global time.
            requestAnimationFrame(tick => this.drawAll(tick));
        });
    }

    
    drawAll(tick: number) {
        global_time = Math.fround((this.context.currentTime - this.start_time) * 1000);
    
        for (let index = 0; index < this.chart.track; index ++) {
            this.drawSingleTrack(index);
        }

        requestAnimationFrame(this.effect.draw.bind(this.effect));
    
        if (ended) {
            JUDGEMENT.innerText = "";
            HIT_COUNT.innerText = `MAX HIT: ${max_hit}`;
            this.effect.clear();
        } else {
            requestAnimationFrame(tick => this.drawAll(tick));
        }
    }


    drawSingleTrack(index: number) {
        var track: Track = this.chart.tracks[index];
        for (var i = 0; i < track.length; i ++) {
            var note = track.notes[i];
            var should_remove = note.draw(this.speed);

            if (should_remove) {
                if (note.isWaiting(global_time)) {
                    break;
                } else {
                    track.pop();
                    i -= 1;
                }
            }

            if (auto && note.isPerfect(global_time)) {
                HITBOX[index].style.background = HITPRESS;
                TRACKS[index].style.background = TRACKPRESS;

                score += track.pop();
                SCORE.innerText = `SCORE: ${score}`;
                i -= 1;

                setTimeout(function() {
                    HITBOX[index].style.background = HITUP;
                    TRACKS[index].style.background = TRACKUP;
                }, 50);
            }
        }
    }
}


/** Chart class:
 * 
 *  Holding chart infomations.
 */
class Chart {
    name: string;
    music_path: string;
    composer: string;
    illustration: string;
    tracks: Track[];
    track: number;

    constructor(object: Object) {
        this.name = object["name"];
        this.music_path = object["music"];
        this.composer = object["composer"];
        this.illustration = object["illustration"];
        this.track = object["track"];
        this.tracks = [];

        for (var _ = 0; _ < this.track; _ ++) {
            this.tracks.push(new Track());
        }

        document.title = `${this.composer} - ${this.name}`;

        this.loadChart(object);
    }


    loadMusic(): HTMLAudioElement {
        var audio = document.createElement("audio");
        audio.src = this.music_path;

        return audio;
    }


    loadChart(object: Object) {
        var notes: Object[] = object["notes"];
        notes.sort((a, b) => a["time"] - b["time"]);

        for (var index = 0; index < notes.length; index ++) {
            var note = new Tap(notes[index], index);
            this.tracks[note.track].push(note);
        }
    }
}


/** Track class:
 * 
 *  Holds notes and yields score.
 */
class Track {
    /** This array is actually a queue. */
    notes: Note[];
    length: number;

    constructor() {
        this.notes = [];
        this.length = 0;
    }


    push(note: Note) {
        this.notes.push(note);
        this.length += 1;
    }


    /**
     * Trys to pop out notes based on `global_time`,
     * and return the score based on judgement.
     */
    pop(): number {
        if (this.length == 0) {
            return 0;
        }
        
        var res = this.notes[0].judge(global_time);
        switch (res[0]) {
            case Judgement.Waiting:
                return 0;

            case Judgement.Miss:
                miss_count += 1;
                break;
            
            case Judgement.Perfect:
                perfect_count += 1;
                break;

            case Judgement.Good:
                good_count += 1;
                break;

            case Judgement.Bad:
                bad_count += 1;
                break;
        }

        showJudgement(res[0]);
        updateHit(res[0]);
        this.deleteHead();
        return res[1];
    }


    private deleteHead() {
        var note = this.notes.shift();
        var node = document.getElementById("Note" + note.id);

        if (node) {
            TRACKS[note.track].removeChild(node);
            node.remove();
        }

        this.length -= 1;
    }
}


/** Judgement enum:
 * 
 *  Representing player's performance.
 */
enum Judgement { Waiting, Perfect, Good, Bad, Miss }


interface Base {
    /** Returns the judgement of note. */
    judge(current: number): [Judgement, number];

    /**
     * Draws this note on the screen,
     * and returns whether this note is missed.
     */
    draw(speed: number): boolean;

    isPerfect(global_time: number): boolean;

    isMiss(global_time: number): boolean;

    isWaiting(global_time: number): boolean;
}


/** Note class:
 * 
 *  Note base class, any other type of note can extend this class.
 */
class Note implements Base {
    time: number;
    track: number;
    id: number;

    constructor (object: Object, id: number) {
        this.time = object["time"];
        this.track = object["track"];
        this.id = id;
    }


    judge(current: number): [Judgement, number] {
        return [Judgement.Miss, 0];
    }


    draw(speed: number): boolean {
        return true;
    }


    isPerfect(global_time: number): boolean {
        return false;
    }


    isMiss(global_time: number): boolean {
        return true;
    }


    isWaiting(global_time: number): boolean {
        return false;
    }
}


class Tap extends Note {
    constructor(object: Object, id: number) {
        super(object, id);
    }


    isPerfect(global_time: number): boolean {
        return this.judge(global_time)[0] == Judgement.Perfect;
    }


    isMiss(): boolean {
        return this.judge(global_time)[0] == Judgement.Miss;
    }


    isWaiting(): boolean {
        return this.judge(global_time)[0] == Judgement.Waiting;
    }


    judge(current: number): [Judgement, number] {
        var gap = current - this.time;

        if (gap >= (duration * 3)) {
            return [Judgement.Miss, 0];
        } else if (gap <= -(duration * 2)) {
            return [Judgement.Waiting, 0];
        }

        if (gap < 0) {
            gap = -gap * 1.5;
        }

        if (gap <= duration) {
            return [Judgement.Perfect, 1500];
        } else if (gap <= duration * 2) {
            return [Judgement.Good, 1000];
        } else {
            return [Judgement.Bad, 500];
        }
    }


    draw(speed: number): boolean {
        var rd = render_duration / speed;
        var gap: number = this.time - global_time;

        var elem = document.getElementById("Note" + this.id) as HTMLDivElement | null;
        if (gap > render_duration || this.isMiss()) {
            if (elem) {
                TRACKS[this.track].removeChild(elem);
                elem.remove();
            }
            
            return true;
        } else {
            if (!elem) {
                elem = document.createElement("div");
                elem.className = "Tap";
                elem.id = `Note${this.id}`;
                TRACKS[this.track].appendChild(elem);
                elem.style.top = "0%";
            }
            elem.style.top = `${Math.min((1 - gap / rd) * 100, 100)}%`
            
            return false;
        }
    }
}


class Effect {
    analyser: AnalyserNode;
    source: MediaElementAudioSourceNode
    array: Uint8Array;
    canvas: HTMLCanvasElement;
    cvsCtx: CanvasRenderingContext2D;
    style: number;
    styleBack: boolean;
    salt: number;

    constructor(audio: HTMLAudioElement, ctx: AudioContext) {
        this.source = ctx.createMediaElementSource(audio);
        this.analyser = ctx.createAnalyser();
        this.analyser.fftSize = 128;
        
        this.source.connect(this.analyser);
        this.analyser.connect(ctx.destination);

        this.array = new Uint8Array(this.analyser.frequencyBinCount);
        
        this.canvas = document.querySelector(".Effect") as HTMLCanvasElement;
        this.cvsCtx = this.canvas.getContext("2d");

        this.style = 0.4;
        this.styleBack = false;
        this.salt = Math.random();
    }


    get frequencyBinCount(): number {
        return this.analyser.frequencyBinCount;
    }


    clear() {
        this.cvsCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }


    changeStyle() {
        if (this.styleBack) {
            this.style -= 0.01
        } else {
            this.style += 0.01;
        }
    
        if (this.style >= 0.6) {
            this.style = 0.6;
            this.styleBack = true;
        } else if (this.style <= 0.4) {
            this.style = 0.4;
            this.styleBack = false;
        }
    }


    getColor(base: number): Array<number> {
        var color = [base * this.style, base / this.style, base];
        
        if (this.salt <= 0.33) {
            
        } else if (this.salt <= 0.67) {
            color.push(color.shift());
        } else {
            color.unshift(color.pop());
        }

        return color;
    }


    draw() {
        this.changeStyle();
        var width = this.canvas.width / (this.frequencyBinCount * 2.5);
        var height = this.canvas.height;
        var x: number = 0;
        
        this.clear();
        
        var frequency: number;
        this.analyser.getByteFrequencyData(this.array);
        for (var index = 0; index < this.array.length; index ++) {
            frequency = this.array[index];
            var rgb = this.getColor(frequency);

            this.cvsCtx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.8)`;
            this.cvsCtx.fillRect(x, height, width, -(frequency / 2.5));

            x += width * 2.5;
        }
    }
}


/** Main function
 * 
 *  Integrates and choronously calls async functions, ensuring workflow.
 */
async function Main() {
    await readSetting();
    var obj = await readChart("Nhato_Override");
    var game = new Game(obj, 10);

    game.loadBg();

    if (!auto) {
        document.addEventListener("keypress", (event) => {
            var key = event.key.toUpperCase();
            var ki = key_bind.indexOf(key);
    
            if (ki != -1) {
                HITBOX[ki].style.background = HITPRESS;
                TRACKS[ki].style.background = TRACKPRESS;
                score += game.chart.tracks[ki].pop();
                SCORE.innerText = `SCORE: ${score}`;
            }
        });
    
        document.addEventListener("keyup", (event) => {
            var key = event.key.toUpperCase();
            var ki = key_bind.indexOf(key);
    
            if (ki != -1) {
                HITBOX[ki].style.background = HITUP;
                TRACKS[ki].style.background = TRACKUP;
            }
        });
    }
    
    getReady(game);
}


Main()