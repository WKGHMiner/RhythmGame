import { TRACKS, global_time, duration, render_duration, isAuto } from "./game.js";
/** Judgement enum:
 *
 *  Representing player's performance.
 */
export var Judgement;
(function (Judgement) {
    Judgement[Judgement["Waiting"] = 0] = "Waiting";
    Judgement[Judgement["Perfect"] = 1] = "Perfect";
    Judgement[Judgement["Good"] = 2] = "Good";
    Judgement[Judgement["Bad"] = 3] = "Bad";
    Judgement[Judgement["Miss"] = 4] = "Miss";
})(Judgement || (Judgement = {}));
/** Note class:
 *
 *  Note base class, any other type of note can extend this class.
 */
export class Note {
    constructor(object, id) {
        this.time = object["time"];
        this.track = object["track"];
        this.type = object["type"];
        this.sound = object["sound"];
        this.id = id;
    }
    judge(current) {
        return [Judgement.Miss, 0, 0];
    }
    /**
     * Draws this note on the screen,
     * and returns whether this note is missed.
     */
    draw(speed) {
        return true;
    }
    isPerfect() {
        return this.judge(global_time)[0] == Judgement.Perfect;
    }
    isMiss() {
        return this.judge(global_time)[0] == Judgement.Miss;
    }
    isWaiting() {
        return this.judge(global_time)[0] == Judgement.Waiting;
    }
    getSound() {
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
    constructor(object, id) {
        super(object, id);
    }
    judge(current) {
        var gap = current - this.time;
        if (gap >= (duration * 3)) {
            return [Judgement.Miss, 0, 0];
        }
        else if (gap <= -(duration * 2)) {
            return [Judgement.Waiting, 0, 0];
        }
        gap = Math.abs(gap);
        if (gap <= duration) {
            return [Judgement.Perfect, 1500, 0];
        }
        else if (gap <= duration * 2) {
            return [Judgement.Good, 1000, 0];
        }
        else {
            return [Judgement.Bad, 500, 0];
        }
    }
    draw(speed) {
        var rd = render_duration / speed;
        var gap = this.time - global_time;
        var elem = document.getElementById("Note" + this.id);
        if (gap > render_duration || this.isMiss()) {
            if (elem) {
                TRACKS[this.track].removeChild(elem);
                elem.remove();
            }
            return true;
        }
        else {
            if (!elem) {
                elem = document.createElement("div");
                elem.className = "Tap";
                elem.id = `Note${this.id}`;
                TRACKS[this.track].appendChild(elem);
                elem.style.top = "0%";
            }
            elem.style.top = `${Math.min((1 - gap / rd) * 100, 100)}%`;
            return false;
        }
    }
}
export class ExTap extends Tap {
    judge(current) {
        var gap = current - this.time;
        if (gap >= (duration * 3)) {
            return [Judgement.Miss, 0, 1];
        }
        else if (gap <= -(duration * 2)) {
            return [Judgement.Waiting, 0, 1];
        }
        else {
            if ((isAuto && Math.abs(gap) < duration) || !isAuto) {
                return [Judgement.Perfect, 1500, 1];
            }
            else {
                return [Judgement.Waiting, 0, 1];
            }
        }
    }
    draw(speed) {
        var res = super.draw(speed);
        var elem = document.getElementById("Note" + this.id);
        if (elem && elem.className != "ExTap") {
            elem.className = "ExTap";
        }
        return res;
    }
}
