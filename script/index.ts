/** HTML element set of Tracks. */
const TRACKS = document.querySelectorAll(".Track") as NodeListOf<HTMLDivElement>;
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
var render_duration: number = 500;
var duration: number = 40;
var auto: boolean = false;
var offset: number = 0;
var mvolume: number = 0.4;
var svolume: number = 0.5;

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


async function readChart(name: string): Promise<Object> {
    var obj: Object = await (await fetch("./chart/" + name + ".json")).json();
    return obj;
}


function getReady(game: Game) {
    document.addEventListener("keydown", event => {
        if (!isReady) {
            isReady = true;

            var prompt = document.querySelector(".Prompt") as HTMLDivElement;
            var mc = document.querySelector(".MainContainer") as HTMLDivElement;
            mc.removeChild(prompt);
            prompt.remove();
            
            game.loadContext();
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
    effect: Effect;
    start_time: number;
    offset: number;
    music: HTMLAudioElement;
    context: AudioContext;

    constructor(obj: Object, speed: number) {
        this.chart = new Chart(obj);
        this.speed = speed;
        this.offset = this.chart.offset + offset;
    }
    
    
    loadContext() {
        this.music = this.chart.loadMusic();
        this.music.volume = mvolume;
        this.context = new AudioContext();

        this.loadEffect();

        this.music.addEventListener("ended", event => { isEnded = true })
    }


    loadEffect() {
        this.effect = new Effect(this.music, this.context);
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

        requestAnimationFrame(_ => this.effect.draw());
    
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
        var track: Track = this.chart.tracks[index];
        for (var i = 0; i < track.length; i ++) {
            var note = track.notes[i];
            var should_remove = note.draw(this.speed);

            if (should_remove) {
                if (note.isWaiting()) {
                    break;
                } else {
                    track.pop(this.context);
                    i -= 1;
                }
            }

            if (auto && note.isPerfect()) {
                score += track.pop(this.context);
                pressOn(index);
                i -= 1;

                setTimeout(_ => pressOut(index), duration);
            }
        }
    }


    hit(index: number): number {
        return this.chart.tracks[index].pop(this.context);
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
    offset: number;

    constructor(object: Object) {
        this.name = object["name"];
        this.music_path = object["music"];
        this.composer = object["composer"];
        this.illustration = object["illustration"];
        this.track = object["track"];
        this.tracks = [];
        this.offset = object["offset"];

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
            var obj = notes[index];
            var note: Note;

            switch (obj["type"]) {
                case 0:
                    note = new Tap(obj, index);
                    break;

                case 1:
                    note = new ExTap(obj, index);
                    break;

                default:
                    note = new Note(obj, index);
                    break;
            }

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
    pop(context: AudioContext): number {
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

        if (res[0] != Judgement.Miss) {
            this.hitSound(context, res[2]);
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


    async hitSound(context: AudioContext, type: number) {
        var path: string = Note.matchType(type);
        var audio = await (await fetch(path)).arrayBuffer();
        var buffer = await context.decodeAudioData(audio);

        const source = context.createBufferSource();
        source.buffer = buffer;

        const gain = context.createGain();
        source.connect(gain);
        gain.connect(context.destination);

        gain.gain.setValueAtTime(0.5 * svolume, context.currentTime);
        source.start(0);

        source.onended = () => {
            source.disconnect(context.destination);
            gain.disconnect(context.destination);
        }
    }
}


/** Judgement enum:
 * 
 *  Representing player's performance.
 */
enum Judgement { Waiting, Perfect, Good, Bad, Miss }


interface Base {
    /** Returns the judgement of note. */
    judge(current: number): [Judgement, number, number];

    /**
     * Draws this note on the screen,
     * and returns whether this note is missed.
     */
    draw(speed: number): boolean;

    isPerfect(): boolean;

    isMiss(): boolean;

    isWaiting(): boolean;
}


/** Note class:
 * 
 *  Note base class, any other type of note can extend this class.
 */
class Note implements Base {
    time: number;
    track: number;
    type: number;
    id: number;

    constructor (object: Object, id: number) {
        this.time = object["time"];
        this.track = object["track"];
        this.type = object["type"];
        this.id = id;
    }


    judge(current: number): [Judgement, number, number] {
        return [Judgement.Miss, 0, 0];
    }


    draw(speed: number): boolean {
        return true;
    }


    isPerfect(): boolean {
        return this.judge(global_time)[0] == Judgement.Perfect;
    }


    isMiss(): boolean {
        return this.judge(global_time)[0] == Judgement.Miss;
    }


    isWaiting(): boolean {
        return this.judge(global_time)[0] == Judgement.Waiting;
    }


    static matchType(type: number): string {
        var path = "../resource/sound/";
        switch (type) {
            case 1:
                return path + "extap.mp3";

            default:
                return path + "tap.mp3";
        }
    }
}


class Tap extends Note {
    constructor(object: Object, id: number) {
        super(object, id);
    }


    judge(current: number): [Judgement, number, number] {
        var gap = current - this.time;

        if (gap >= (duration * 3)) {
            return [Judgement.Miss, 0, 0];
        } else if (gap <= -(duration * 2)) {
            return [Judgement.Waiting, 0, 0];
        }

        gap = Math.abs(gap);

        if (gap <= duration) {
            return [Judgement.Perfect, 1500, 0];
        } else if (gap <= duration * 2) {
            return [Judgement.Good, 1000, 0];
        } else {
            return [Judgement.Bad, 500, 0];
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


class ExTap extends Tap {
    judge(current: number): [Judgement, number, number] {
        var gap = current - this.time;

        if (gap >= (duration * 3)) {
            return [Judgement.Miss, 0, 1];
        } else if (gap <= -(duration * 2)) {
            return [Judgement.Waiting, 0, 1];
        } else {
            if ((auto && Math.abs(gap) < duration) || !auto) {
                return [Judgement.Perfect, 1500, 1];
            } else {
                return [Judgement.Waiting, 0, 1];
            }
        }
    }


    draw(speed: number): boolean {
        var res = super.draw(speed);
        var elem = document.getElementById("Note" + this.id) as HTMLDivElement | null;

        if (elem) {
            elem.className = "ExTap";
        }

        return res;
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
    radial: number;
    theta: number;

    constructor(audio: HTMLAudioElement, ctx: AudioContext) {
        this.source = ctx.createMediaElementSource(audio);
        this.analyser = ctx.createAnalyser();
        this.analyser.fftSize = 256;
        
        this.source.connect(this.analyser);
        this.analyser.connect(ctx.destination);

        this.array = new Uint8Array(this.analyser.frequencyBinCount);
        
        this.canvas = document.querySelector(".Effect") as HTMLCanvasElement;
        this.canvas.height = this.canvas.clientHeight * window.devicePixelRatio;
        this.canvas.width = this.canvas.clientWidth * window.devicePixelRatio;
        this.cvsCtx = this.canvas.getContext("2d");

        this.style = 0.4;
        this.styleBack = false;
        this.salt = Math.random();
        
        var illustration = document.querySelector(".Illustration");
        this.radial = illustration.clientHeight * 0.75;
        this.theta = 0;
    }


    set fftSize(size: number) {
        this.analyser.fftSize = size;
    }


    get frequencyBinCount(): number {
        return this.analyser.frequencyBinCount / 4 * 3;
    }


    clear() {
        this.cvsCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }


    changeStyle() {
        if (this.styleBack) {
            this.style -= 0.005;
        } else {
            this.style += 0.005;
        }
    
        if (this.style >= 0.75) {
            this.style = 0.75;
            this.styleBack = true;
        } else if (this.style <= 0.25) {
            this.style = 0.25;
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


    getTheta(): number {
        var current = this.theta;
        this.theta += 0.05;
        this.theta %= this.frequencyBinCount;
        return current;
    }


    draw() {
        this.changeStyle();
        var bar_width = this.canvas.width / (this.frequencyBinCount * 2.5);
        var width = this.canvas.width / 2;
        var height = this.canvas.height;
        
        this.clear();
        
        var angle = Math.PI * 2 / this.frequencyBinCount;
        this.cvsCtx.save();
        this.cvsCtx.translate(width, height / 2);
        this.cvsCtx.rotate(angle * this.getTheta());

        this.analyser.getByteFrequencyData(this.array);
        for (var index = this.array.length / 4; index < this.array.length; index ++) {
            var frequency = this.array[index];
            var rgb = this.getColor(frequency);

            this.cvsCtx.rotate(angle);

            this.cvsCtx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.8)`;
            this.cvsCtx.fillRect(0, this.radial, bar_width, frequency);
        }

        this.cvsCtx.translate(-width, -height / 2);
        this.cvsCtx.restore();
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


Main()