const TRACKS = document.querySelectorAll(".Track") as NodeListOf<HTMLDivElement>;
const HITBOX = document.querySelectorAll(".HitBox") as NodeListOf<HTMLDivElement>;
const SCORE = document.querySelector(".Score") as HTMLDivElement;
const HEIGHT = TRACKS[0].clientHeight;

var setting: Object;
var key_bind: string[];
var global_time: number = -500;
var render_duration: number = 500;
var duration: number = 40;

var score: number = 0;
var perfect_count: number = 0;
var good_count: number = 0;
var bad_count: number = 0;
var miss_count: number = 0;


async function readSetting() {
    setting = await (await fetch("./setting.json")).json();
    key_bind = setting["key-bind"];
    render_duration = setting["render-duration"];
    duration = setting["duration"];
}


class Game {
    speed: number;
    chart: Chart;
    start_time: number;


    constructor(obj: Object, speed: number) {
        this.chart = new Chart(obj);
        this.speed = speed;
    }


    start() {
        this.start_time = performance.now();
        requestAnimationFrame(tick => this.drawAll(tick));
    }

    
    drawAll(tick: number) {
        global_time = tick - this.start_time;
    
        for (let index = 0; index < this.chart.track; index++) {
            this.drawSingleTrack(index);
        }
    
        if (global_time <= this.chart.length) {
            requestAnimationFrame(tick => this.drawAll(tick));
        } else {
            console.log("Game ended!");
            console.log("Score: " + score);
            console.log("Perfect: " + perfect_count);
            console.log("Good: " + good_count);
            console.log("Bad: " + bad_count);
            console.log("Miss: " + miss_count);
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
                }
            }
        }
    }
}


class Chart {
    name: string;
    music: string;
    composer: string;
    illustration: string;
    tracks: Track[];
    track: number;
    length: number;
    private _level: number;

    constructor(object: Object) {
        this.name = object["name"];
        this.music = object["music"];
        this.composer = object["composer"];
        this.illustration = object["illustration"];
        this.track = object["track"];
        this.tracks = [];
        this.length = object["length"];

        for (var _ = 0; _ < this.track; _ ++) {
            this.tracks.push(new Track());
        }

        this.loadChart(object);
    }


    set level(value: number) {
        this._level = value;
    }

    get level(): number {
        return this._level;
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


class Track {
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
    }


    private deleteHead() {
        var note = this.notes.shift();
        var node = document.getElementById("Note" + note.id);

        if (node) {
            TRACKS[note.track].removeChild(node);
        }

        this.length -= 1;
    }
}


enum Judgement {
    Waiting,
    Perfect,
    Good,
    Bad,
    Miss,
}


interface Base {
    /** Returns the judgement of note. */
    judge(current: number): [Judgement, number];

    /**
     * Draws this note on the screen,
     * and returns whether this note is missed.
     */
    draw(speed: number): boolean;

    isMiss(global_time: number): boolean;

    isWaiting(global_time: number): boolean;
}


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
        } else if (gap <= -(duration * 3)) {
            return [Judgement.Waiting, 0];
        }

        gap = Math.abs(gap);

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
        if (gap > render_duration || gap < 0) {
            if (this.isMiss() && elem) {
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
            elem.style.transform = `translateY(${(1 - gap / rd) * HEIGHT}px)`
            
            return false;
        }
    }
}


async function readChart(name: string): Promise<Object> {
    var obj: Object = await (await fetch("./chart/" + name + ".json")).json();
    return obj;
}


async function Main() {
    await readSetting();
    var obj = await readChart("Override");

    var game = new Game(obj, 10);
    

    document.addEventListener("keypress", (event) => {
        var key = event.key.toUpperCase();
        var ki = key_bind.indexOf(key);

        if (ki != -1) {
            HITBOX[ki].style.setProperty(
                "background",
                "radial-gradient(rgba(200, 200, 200, 0.8), rgba(170, 170, 170, 0.8))"
            );
            TRACKS[ki].style.setProperty(
                "background",
                "linear-gradient(to top, rgba(155, 155, 155, 0.3), rgba(110, 110, 110, 0.1))"
            );
            score += game.chart.tracks[ki].pop();
        }
    });

    document.addEventListener("keyup", (event) => {
        var key = event.key.toUpperCase();
        var ki = key_bind.indexOf(key);

        if (ki != -1) {
            HITBOX[ki].style.setProperty(
                "background",
                "radial-gradient(rgba(170, 170, 170, 0.8), rgba(126, 126, 126, 0.8))"
            );
            TRACKS[ki].style.setProperty(
                "background",
                "none"
            );
        }
    });

    game.start();
}


Main()