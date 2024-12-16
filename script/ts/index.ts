import { ListRange, NumberRange, FloatRange, CheckBox, FileSelector, ControlButton } from "./widget.js";


var setting = await (await fetch("./setting.json")).json();

const speed = setting["speed"];
const mvolume = setting["music-volume"];
const svolume = setting["sound-volume"];


const SpeedRange = new NumberRange("speed", 0, 20, speed, 1);

const DifficultyRange = new ListRange(
    "difficulty", ["A", "B", "C", "D", "E"], 2,
    item => {
        var gap = item.charCodeAt(0) - 'A'.charCodeAt(0);
    
        return 20 + (gap * 15);
    }
);

const OffsetRange = new NumberRange("offset", -200, 400, 0, 10);
const MusicVolumeRange = new FloatRange("music-volume", 0, 1, mvolume, 0.1);
const SoundVolumeRange = new FloatRange("sound-volume", 0, 1, svolume, 0.1);
const AllowVisioBox = new CheckBox("allow-visualisation", true);
const AutoBox = new CheckBox("auto", false);
const ChartSelector = new FileSelector();


const Control = new ControlButton(
    SpeedRange, DifficultyRange, OffsetRange,
    MusicVolumeRange, SoundVolumeRange,
    AllowVisioBox, AutoBox,
    ChartSelector
);
