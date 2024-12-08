var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { TRACKS, global_time, svolume, mvolume, duration, render_duration, isAuto, showJudgement, updateHit } from "./game.js";
import { AudioNote } from "./effect.js";
/** Chart class:
 *
 *  Holding chart infomations.
 */
export class Chart {
    constructor(object, sounds) {
        this.name = object["name"];
        this.music_path = object["music"];
        this.special = object["special"];
        this.composer = object["composer"];
        this.illustration = object["illustration"];
        this.track = object["track"];
        this.tracks = [];
        this.offset = object["offset"];
        for (var _ = 0; _ < this.track; _++) {
            this.tracks.push(new Track());
        }
        document.title = `${this.composer} - ${this.name}`;
        this.loadChart(object, sounds);
    }
    loadMusic() {
        var audio = document.createElement("audio");
        audio.src = this.music_path;
        return audio;
    }
    loadChart(object, sounds) {
        var notes = object["notes"];
        notes.sort((a, b) => a["time"] - b["time"]);
        for (var index = 0; index < notes.length; index++) {
            var obj = notes[index];
            var note;
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
    constructor() {
        this.notes = [];
        this.length = 0;
    }
    push(note) {
        this.notes.push(note);
        this.length += 1;
    }
    /**
     * Trys to pop out notes based on `global_time`,
     * and return the score based on judgement.
     */
    pop(context, isSpecial, analyser) {
        if (this.length == 0 || this.notes[0].isWaiting()) {
            return 0;
        }
        var note = this.deleteHead();
        var res = note.judge(global_time);
        if (res[0] != Judgement.Miss) {
            this.hitSound(context, note, isSpecial, analyser);
        }
        showJudgement(res[0]);
        updateHit(res[0]);
        return res[1];
    }
    deleteHead() {
        var note = this.notes.shift();
        var node = document.getElementById("Note" + note.id);
        if (node) {
            TRACKS[note.track].removeChild(node);
            node.remove();
        }
        this.length -= 1;
        return note;
    }
    hitSound(context, note, isSpecial, analyser) {
        return __awaiter(this, void 0, void 0, function* () {
            var path = note.getSound();
            console.log("Id: " + note.id + ", Time: ", note.time);
            console.log("Hit sound:" + path);
            var audio = yield fetch(path);
            var buffer = yield context.decodeAudioData(yield audio.arrayBuffer());
            const source = context.createBufferSource();
            source.buffer = buffer;
            const gain = context.createGain();
            source.connect(gain);
            if (isSpecial) {
                gain.connect(analyser);
                analyser.connect(context.destination);
                gain.gain.setValueAtTime(mvolume, context.currentTime);
            }
            else {
                gain.connect(context.destination);
                gain.gain.setValueAtTime(0.5 * svolume, context.currentTime);
            }
            source.start(0);
        });
    }
}
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
        if (elem) {
            elem.className = "ExTap";
        }
        return res;
    }
}
