var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { TRACKS, global_time, svolume, mvolume, showJudgement, updateHit } from "./game.js";
import { AudioNote } from "./effect.js";
import { Judgement, Note, Tap, ExTap } from "./notes.js";
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
