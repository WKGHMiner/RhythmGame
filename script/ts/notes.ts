import { TRACKS, global_time, duration, render_duration, isAuto } from "./game.js";


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
            if ((isAuto && Math.abs(gap) < duration) || !isAuto) {
                return [Judgement.Perfect, 1500, 1];
            } else {
                return [Judgement.Waiting, 0, 1];
            }
        }
    }


    draw(speed: number): boolean {
        var res = super.draw(speed);
        var elem = document.getElementById("Note" + this.id) as HTMLDivElement | null;

        if (elem && elem.className != "ExTap") {
            elem.className = "ExTap";
        }

        return res;
    }
}
