var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { duration, global_time, mvolume } from "./game.js";
import { Judgement } from "./notes.js";
export class Effect {
    constructor(audio, ctx, isSpecial) {
        this.analyser = ctx.createAnalyser();
        this.analyser.fftSize = 256;
        if (!isSpecial) {
            this.source = ctx.createMediaElementSource(audio);
            this.source.connect(this.analyser);
            this.analyser.connect(ctx.destination);
        }
        this.array = new Uint8Array(this.analyser.frequencyBinCount);
        this.canvas = document.querySelector(".Effect");
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
    set fftSize(size) {
        this.analyser.fftSize = size;
    }
    get frequencyBinCount() {
        return this.analyser.frequencyBinCount / 4 * 3;
    }
    clear() {
        this.cvsCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    changeStyle() {
        if (this.styleBack) {
            this.style -= 0.005;
        }
        else {
            this.style += 0.005;
        }
        if (this.style >= 0.75) {
            this.style = 0.75;
            this.styleBack = true;
        }
        else if (this.style <= 0.25) {
            this.style = 0.25;
            this.styleBack = false;
        }
    }
    getColor(base) {
        var color = [base * this.style, base / this.style, base];
        if (this.salt <= 0.33) {
        }
        else if (this.salt <= 0.67) {
            color.push(color.shift());
        }
        else {
            color.unshift(color.pop());
        }
        return color;
    }
    getTheta() {
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
        for (var index = this.array.length / 4; index < this.array.length; index++) {
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
export class AudioNote {
    constructor(object) {
        this.time = object["time"];
        this.sound = object["sound"];
    }
    judge(current) {
        var gap = current - this.time;
        if (gap > duration) {
            return [Judgement.Miss, 0, 0];
        }
        else if (Math.abs(gap) < duration) {
            return [Judgement.Perfect, 0, 0];
        }
        else {
            return [Judgement.Waiting, 0, 0];
        }
    }
}
export class AudioQueue {
    constructor() {
        this.length = 0;
        this.notes = new Array();
    }
    push(note) {
        this.notes.push(note);
        this.length += 1;
    }
    pop(context, analyser) {
        var note;
        for (var index = 0; index < this.length; index++) {
            note = this.notes[index];
            switch (note.judge(global_time)[0]) {
                case Judgement.Waiting:
                    return;
                case Judgement.Miss:
                    break;
                default:
                    this.play(context, analyser, note);
            }
            this.notes.shift();
            this.length -= 1;
            index -= 1;
        }
    }
    play(context, analyser, note) {
        return __awaiter(this, void 0, void 0, function* () {
            var path = note.sound;
            console.log("Time: " + note.time + ", Remain: " + this.length);
            console.log("AudioNote: " + path);
            var audio = yield fetch(path);
            var buffer = yield context.decodeAudioData(yield audio.arrayBuffer());
            const source = context.createBufferSource();
            source.buffer = buffer;
            const gain = context.createGain();
            source.connect(gain);
            gain.connect(analyser);
            analyser.connect(context.destination);
            gain.gain.setValueAtTime(mvolume, context.currentTime);
            source.start(0);
        });
    }
}
