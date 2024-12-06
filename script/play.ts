import {
    TRACKS,
    global_time, svolume, mvolume,
    duration, render_duration,
    auto, showJudgement, updateHit
} from "./index.js";
import { AudioNote, AudioQueue } from "./effect.js";


/** Chart class:
 * 
 *  Holding chart infomations.
 */
export class Chart {
    name: string;
    music_path: string;
    special: boolean;
    composer: string;
    illustration: string;
    tracks: Track[];
    track: number;
    offset: number;

    constructor(object: Object, sounds: AudioQueue) {
        this.name = object["name"];
        this.music_path = object["music"];
        this.special = object["special"];
        this.composer = object["composer"];
        this.illustration = object["illustration"];
        this.track = object["track"];
        this.tracks = [];
        this.offset = object["offset"];

        for (var _ = 0; _ < this.track; _ ++) {
            this.tracks.push(new Track());
        }

        document.title = `${this.composer} - ${this.name}`;

        this.loadChart(object, sounds);
    }


    loadMusic(): HTMLAudioElement {
        var audio = document.createElement("audio");
        audio.src = this.music_path;

        return audio;
    }


    loadChart(object: Object, sounds: AudioQueue) {
        var notes: Object[] = object["notes"];
        notes.sort((a, b) => a["time"] - b["time"]);

        for (var index = 0; index < notes.length; index ++) {
            var obj = notes[index];
            var note: Note;

            if (this.special && obj["track"] == undefined) {
                var audio = new AudioNote(obj);
                sounds.push(audio);
                continue;
            }

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
export class Track {
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
    pop(context: AudioContext, isSpecial: boolean): number {
        if (this.length == 0) {
            return 0;
        }
        
        if (this.notes[0].isWaiting()) {
            return 0;
        }

        var note = this.deleteHead();
        var res = note.judge(global_time);
        if (res[0] != Judgement.Miss) {
            this.hitSound(context, note, isSpecial);
        }

        showJudgement(res[0]);
        updateHit(res[0]);
        return res[1];
    }


    private deleteHead(): Note {
        var note = this.notes.shift();
        var node = document.getElementById("Note" + note.id);

        if (node) {
            TRACKS[note.track].removeChild(node);
            node.remove();
        }

        this.length -= 1;
        return note;
    }


    async hitSound(context: AudioContext, note: Note, isSpecial: boolean) {
        var path: string = note.getSound();
        console.log("Id: " + note.id + ", Time: ", note.time);
        console.log("Hit sound:" + path);

        var audio = await fetch(path);
        var buffer = await context.decodeAudioData(await audio.arrayBuffer());

        const source = context.createBufferSource();
        source.buffer = buffer;

        const gain = context.createGain();
        source.connect(gain);
        gain.connect(context.destination);

        if (!isSpecial) {
            gain.gain.setValueAtTime(0.5 * svolume, context.currentTime);
        } else {
            gain.gain.setValueAtTime(0.75 * mvolume, context.currentTime);
        }
        source.start(0);
    }
}


/** Judgement enum:
 * 
 *  Representing player's performance.
 */
export enum Judgement { Waiting, Perfect, Good, Bad, Miss }


export interface Base {
    /** Returns the judgement of note. */
    judge(current: number): [Judgement, number, number];
}


/** Note class:
 * 
 *  Note base class, any other type of note can extend this class.
 */
export class Note implements Base {
    time: number;
    track: number;
    type: number;
    sound: string;
    id: number;

    constructor (object: Object, id: number) {
        this.time = object["time"];
        this.track = object["track"];
        this.type = object["type"];
        this.sound = object["sound"];
        this.id = id;
    }


    judge(current: number): [Judgement, number, number] {
        return [Judgement.Miss, 0, 0];
    }


    /**
     * Draws this note on the screen,
     * and returns whether this note is missed.
     */
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


    getSound(): string {
        if (this.sound != undefined && this.sound.length != 0) {
            return this.sound;
        }

        var path = "../resource/sound/";
        switch (this.type) {
            case 1:
                return path + "extap.mp3";
    
            default:
                return path + "tap.mp3";
        }
    }
}


export class Tap extends Note {
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


export class ExTap extends Tap {
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
