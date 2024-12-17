export { RawListRange, ListRange, NumberRange, FloatRange, CheckBox, FileSelector, ControlButton };


const Container = document.querySelector(".Container") as HTMLDivElement;


interface Widget<T> {
    name?: string;

    addEventListener?(): void;

    getValue(): Promise<T> | T;

    setDefault(): void;
}


class BaseRange {
    name: string;
    minusBtn: HTMLButtonElement;
    hint: HTMLDivElement;
    plusBtn: HTMLButtonElement;

    constructor(name: string) {
        this.name = name;

        var parent = document.createElement("div");
        parent.className = "Range";
        parent.id = name;
        Container.appendChild(parent);

        this.minusBtn = document.createElement("button");
        this.minusBtn.className = "Minus";
        parent.appendChild(this.minusBtn);

        this.hint = document.createElement("div");
        this.hint.className = "Hint";
        parent.appendChild(this.hint);

        this.plusBtn = document.createElement("button");
        this.plusBtn.className = "Plus";
        parent.appendChild(this.plusBtn);

        var label = document.createElement("div");
        label.className = "Name";
        label.innerText = name;
        parent.appendChild(label);
    }


    getName(): string {
        return this.name;
    }
}


class NumberRange extends BaseRange implements Widget<number> {
    min: number;
    max: number;
    value: number;
    defaultValue: number;
    step: number;
    
    constructor(name: string, min: number, max: number, value: number, step: number) {
        super(name);

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

        this.updateHint();
    }


    getValue(): number {
        return this.value;
    }
}


class FloatRange extends NumberRange {
    plus() {
        super.plus();
        
        var s = this.value.toPrecision(12);
        this.value = parseFloat(s);
        
        this.updateHint();
    }


    minus() {
        super.minus();
        
        var s = this.value.toPrecision(12);
        this.value = parseFloat(s);

        this.updateHint();
    }
}


class RawListRange<T> extends BaseRange implements Widget<T> {
    data: Array<T>;
    index: number;
    defaultIndex: number;

    constructor(name: string, data: Array<T>, index: number) {
        super(name);

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
        this.updateHint();
    }


    getValue(): T {
        return this.data[this.index];
    }
}


/**
 * @type T: The data type hold by `this.data`, which should be able to produce `T`.
 * @type U: The actual data type of `getValue`'s returning value.
 */
class ListRange<T, U> extends RawListRange<T> implements Widget<U> {
    data: Array<T>;
    index: number;
    defaultIndex: number;
    converter: (item: T) => U;

    constructor(
        name: string, data: Array<T>, index: number,
        converter: (item: T) => U
    ) {
        super(name, data, index);

        this.converter = converter;
    }


    // @ts-ignore: 2416
    getValue(): U {
        var item = super.getValue();

        return this.converter(item);
    }
}


class CheckBox implements Widget<boolean> {
    name: string;
    box: HTMLDivElement;
    value: boolean;
    defaultValue: boolean;

    constructor(name: string, value: boolean) {
        this.name = name;
        this.value = value;
        this.defaultValue = value;

        var parent = document.createElement("div");
        parent.className = "CheckBox";
        Container.appendChild(parent);

        this.box = document.createElement("div");
        this.box.className = "Box";
        this.box.onclick = _ => { this.click() };
        this.updateBox();
        parent.appendChild(this.box);

        var label = document.createElement("div");
        label.className = "Name";
        label.innerText = name;
        parent.appendChild(label);
    }


    updateBox() {
        var color: string;

        if (this.value) {
            color = "rgba(249, 249, 249, 0.8)";
        } else {
            color = "rgba(0, 0, 0, 0)";
        }

        this.box.style.backgroundColor = color;
    }


    click() {
        this.value = !this.value;
        this.updateBox();
    }


    getValue(): boolean {
        return this.value;
    }


    setDefault(): void {
        this.value = this.defaultValue;
    }
}


// These lines are totally a piece of shit.😅
class FileSelector implements Widget<string> {
    jsonBtn: HTMLButtonElement;
    jsonInput: HTMLInputElement;
    jsonDisplay: HTMLDivElement;
    jsonFile: File | null;


    constructor() {
        var parent = document.createElement("div");
        parent.className = "FilePanel";
        Container.appendChild(parent);
        
        this.createInput();
        
        this.jsonDisplay = document.createElement("div");
        this.jsonDisplay.className = "FileDisplay";
        this.jsonDisplay.innerText = "";
        parent.appendChild(this.jsonDisplay);

        this.jsonBtn = document.createElement("button");
        this.jsonBtn.className = "FileButton";
        this.jsonBtn.innerText = "Select Chart Json";
        this.jsonBtn.onclick = _ => { this.jsonInput.click() };
        parent.appendChild(this.jsonBtn);
    }


    addEventListener(): void {
        this.jsonInput.addEventListener("change", _ => {
            if (this.jsonInput.files.length != 0) {
                this.jsonFile = this.jsonInput.files[0];
            }
            
            this.updateDisplay();
        });
    }


    createInput() {
        this.jsonInput = document.createElement("input");
        this.jsonInput.type = "file";
        this.jsonInput.accept = ".json";

        this.addEventListener();
    }


    updateDisplay() {
        var s: string;
        if (this.jsonFile != null) {
            s = this.jsonFile.name;
        } else {
            s = "";
        }

        this.jsonDisplay.innerText = s;
    }


    setDefault(): void {
        this.jsonFile = null;
        
        this.jsonInput.remove();
        this.createInput();

        this.updateDisplay();
    }


    get name(): string {
        if (this.jsonFile != null) {
            return "literal";
        }
    }


    // Yes, we are unable to use mcp, because browser does not allow directory access!😅
    async getValue(): Promise<string> {
        var s: string;
        if (this.jsonFile != null) {
            s = await this.jsonFile.text();

            return s;
        }
    }
}


class ControlButton implements Widget<void> {
    submitBtn: HTMLButtonElement;
    resetBtn: HTMLButtonElement;
    widgets: Widget<any>[];

    constructor(...widgets: Widget<any>[]) {
        this.widgets = widgets;

        var parent = document.createElement("div");
        parent.className = "Control";
        
        this.submitBtn = document.createElement("button");
        this.submitBtn.className = "Submit";
        this.submitBtn.innerText = "submit";
        
        this.resetBtn = document.createElement("button");
        this.resetBtn.className = "Reset";
        this.resetBtn.innerText = "reset";
        
        parent.appendChild(this.submitBtn);
        parent.appendChild(this.resetBtn);
        Container.appendChild(parent);

        this.addEventListener();
    }


    removeWidget(widget: Widget<any>) {
        var w: Widget<any>;
        for (var index = 0; index < this.widgets.length; index ++) {
            w = this.widgets[index];

            if (w.name == widget.name) {
                this.widgets.splice(index, 1);
                break;
            }
        }
    }


    addWidget(widget: Widget<any>) {
        this.widgets.push(widget);
    }


    setDefault(): void {
        for (var widget of this.widgets) {
            widget.setDefault();
        }
    }


    async getValue(): Promise<void> {
        for (var widget of this.widgets) {
            var name = widget.name;
            var value = await widget.getValue();
            sessionStorage.setItem(name, value);
        }
    }


    addEventListener(): void {
        this.submitBtn.addEventListener("click", async event => {
            event.preventDefault();

            await this.getValue();

            document.location.href = "./game.html";
        });

        this.resetBtn.addEventListener("click", event => {
            event.preventDefault();

            this.setDefault();
        });
    }
}
