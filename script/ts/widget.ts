import { speed, offset, mvolume, svolume, readSetting } from "./game.js";


interface Widget {
    addEventListener(): void;
}


interface Default<T> {
    setDefault(): void;
}


class BaseRange {
    minusBtn: HTMLButtonElement;
    hint: HTMLDivElement;
    plusBtn: HTMLButtonElement;

    constructor(parent?: HTMLDivElement) {
        if (parent) {
            this.minusBtn = parent.children[0] as HTMLButtonElement;
            this.hint = parent.children[1] as HTMLDivElement;
            this.plusBtn = parent.children[2] as HTMLButtonElement;
        }
    }
}


class NumberRange extends BaseRange implements Default<number>, Widget {
    min: number;
    max: number;
    value: number;
    defaultValue: number;
    step: number;
    
    constructor(parent: HTMLDivElement, min: number, max: number, value: number, step: number) {
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
        } else {
            this.value += this.step;
        }

        this.updateHint();
    }


    minus() {
        if (this.value <= this.min + this.step) {
            this.value = this.min;
        } else {
            this.value -= this.step;
        }

        this.updateHint();
    }


    updateHint() {
        this.hint.innerText = `${this.value}`;
    }


    setDefault(): void {
        this.value = this.defaultValue;
    }
}


class ListRange<T> extends BaseRange implements Default<T>, Widget {
    data: Array<T>;
    index: number;
    defaultIndex: number;

    constructor(parent: HTMLDivElement, data: Array<T>, index: number) {
        super(parent);

        this.data = data;
        this.index = index;
        this.defaultIndex = index;

        this.updateHint();
        this.addEventListener();

        this.minusBtn.innerText = "<";
        this.plusBtn.innerText = ">";
    }


    addEventListener(): void {
        this.minusBtn.addEventListener("click", _ => { this.minus() });
        this.plusBtn.addEventListener("click", _ => { this.plus() });
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


    setDefault(): void {
        this.index = this.defaultIndex;
    }
}


const Speed = document.querySelector(".Range#Speed") as HTMLDivElement;
const Difficulty = document.querySelector(".Range#Difficulty") as HTMLDivElement;

const SpeedRange = new NumberRange(Speed, 0, 20, speed, 1);
const DifficultyRange = new ListRange(Difficulty, ["A", "B", "C", "D", "E"], 2);