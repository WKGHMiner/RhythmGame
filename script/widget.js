import { speed } from "./game.js";
class BaseRange {
    constructor(parent) {
        if (parent) {
            this.minusBtn = parent.children[0];
            this.hint = parent.children[1];
            this.plusBtn = parent.children[2];
        }
    }
}
class NumberRange extends BaseRange {
    constructor(parent, min, max, value, step) {
        super(parent);
        this.min = min;
        this.max = max;
        this.value = value;
        this.defaultValue = value;
        this.step = step;
        this.updateHint();
        this.addEventListener();
        this.minusBtn.innerText = "-";
        this.plusBtn.innerText = "+";
    }
    addEventListener() {
        this.minusBtn.addEventListener("click", _ => { this.minus(); });
        this.plusBtn.addEventListener("click", _ => { this.plus(); });
    }
    plus() {
        if (this.value >= this.max - this.step) {
            this.value = this.max;
        }
        else {
            this.value += this.step;
        }
        this.updateHint();
    }
    minus() {
        if (this.value <= this.min + this.step) {
            this.value = this.min;
        }
        else {
            this.value -= this.step;
        }
        this.updateHint();
    }
    updateHint() {
        this.hint.innerText = `${this.value}`;
    }
    setDefault() {
        this.value = this.defaultValue;
    }
}
class ListRange extends BaseRange {
    constructor(parent, data, index) {
        super(parent);
        this.data = data;
        this.index = index;
        this.defaultIndex = index;
        this.updateHint();
        this.addEventListener();
        this.minusBtn.innerText = "<";
        this.plusBtn.innerText = ">";
    }
    addEventListener() {
        this.minusBtn.addEventListener("click", _ => { this.minus(); });
        this.plusBtn.addEventListener("click", _ => { this.plus(); });
    }
    plus() {
        if (this.index < this.data.length - 1) {
            this.index += 1;
        }
        this.updateHint();
    }
    minus() {
        if (this.index > 0) {
            this.index -= 1;
        }
        this.updateHint();
    }
    updateHint() {
        this.hint.innerText = `${this.data[this.index]}`;
    }
    setDefault() {
        this.index = this.defaultIndex;
    }
}
const Speed = document.querySelector(".Range#Speed");
const Difficulty = document.querySelector(".Range#Difficulty");
const SpeedRange = new NumberRange(Speed, 0, 20, speed, 1);
const DifficultyRange = new ListRange(Difficulty, ["A", "B", "C", "D", "E"], 2);
