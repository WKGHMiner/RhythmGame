use std::io::{Read, Write};
use std::fs;
use regex::*;
use once_cell::sync::Lazy;
use std::fmt::Display;
use wasm_bindgen::prelude::*;


static NOTE_PATTERN: Lazy<Regex> = Lazy::new(|| {
    Regex::new(
        r#"\{"beat":\[(\d+),(\d+),(\d+)\],("endbeat":\[(\d+),(\d+),(\d+)\],)?"column":(\d+)\}"#
    )
    .unwrap()
});


static BPM_PATTERN: Lazy<Regex> = Lazy::new(|| {
    Regex::new(
        r#""bpm":(\d+)(.\d+)?"#
    )
    .unwrap()
});


static COMPOSER_PATTERN: Lazy<Regex> = Lazy::new(|| {
    Regex::new(
        r#""artist":"([^"]+)""#
    )
    .unwrap()
});


static NAME_PATTERN: Lazy<Regex> = Lazy::new(|| {
    Regex::new(
        r#""title":"([^"]+)""#
    )
    .unwrap()
});


static TRACK_PATTERN: Lazy<Regex> = Lazy::new(|| {
    Regex::new(
        r#""column":(\d+)"#
    )
    .unwrap()
});


static MUSIC_PATTERN: Lazy<Regex> = Lazy::new(|| {
    Regex::new(
        r#""sound":"([^"]+)""#
    )
    .unwrap()
});


static ILLUSTRATION_PATTERN: Lazy<Regex> = Lazy::new(|| {
    Regex::new(
        r#""background":"([^"]+)""#
    )
    .unwrap()
});


struct Tap {
    beat: [i32; 3],
    track: i32,
}


impl Tap {
    pub fn new(beat: [i32; 3], track: i32) -> Self {
        Self { beat, track }
    }
}


impl Display for Tap {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "Beat: {:?}\nTrack: {}", self.beat, self.track)
    }
}


struct Chart {
    dir: String,
    name: String,
    composer: String,
    music: String,
    illustration: String,
    track: i32,
    bpm: f32,
    notes: Vec<Tap>,
}


impl Chart {
    pub fn new(chart_dir: &str) -> Self {
        let path = match search_chart_from(chart_dir) {
            Some(path) => path,
            None => panic!("No Malody chart found.")
        };
        
        Self::from_path(&path)
    }


    pub fn from_path(path: &str) -> Self {
        let dir = extract_chart_dir(path);

        let txt = open_from_path(path);

        let name = get_name(&txt);
        let composer = get_composer(&txt);
        let mut music = get_music(&txt);
        let mut illustration = get_illustration(&txt);
        let track = get_track(&txt);
        let notes = get_notes(&txt);
        let bpm = get_bpm(&txt);

        music = format!("{}\\\\{}", dir, music);
        illustration = format!("{}\\\\{}", dir, illustration);

        Self { dir, name, composer, music, illustration, track, bpm, notes }
    }


    fn time_notation(&self, index: usize) -> i32 {
        let beat = &self.notes[index].beat;
        (60000f32 * (beat[0] as f32 + beat[1] as f32 / beat[2] as f32) / self.bpm) as i32
    }


    pub fn write_json(&self) {
        let format_path = format!("{}/{}_{}.json", self.dir, self.composer, self.name);

        let mut handle = match fs::File::create(format_path) {
            Ok(handle) => handle,
            Err(e) => unreachable!("Some Error occured while creating file: {e}"),
        };

        let _ = handle.write(b"{\n");

        self.write_name(&mut handle);
        self.write_composer(&mut handle);
        self.write_music(&mut handle);
        self.write_illustration(&mut handle);
        self.write_track(&mut handle);
        self.write_notes(&mut handle);

        let _ = handle.write(b"\n}");
    }


    fn write_composer(&self, handle: &mut fs::File) {
        let formatted = format!("\"composer\":\"{}\",\n", self.composer);
        let _ = handle.write(formatted.as_bytes());
    }
    
    
    fn write_name(&self, handle: &mut fs::File) {
        let formatted = format!("\"name\":\"{}\",\n", self.name);
        let _ = handle.write(formatted.as_bytes());
    }


    fn write_music(&self, handle: &mut fs::File) {
        let formatted = format!("\"music\":\"{}\",\n", self.music);
        let _ = handle.write(formatted.as_bytes());
    }


    fn write_illustration(&self, handle: &mut fs::File) {
        let formatted = format!("\"illustration\":\"{}\",\n", self.illustration);
        let _ = handle.write(formatted.as_bytes());
    }


    fn write_track(&self, handle: &mut fs::File) {
        let formatted = format!("\"track\":{},\n", self.track);
        let _ = handle.write(formatted.as_bytes());
    }


    fn write_notes(&self, handle: &mut fs::File) {
        let _ = handle.write(b"\"notes\":[\n");
        
        for (index, note) in self.notes.iter().enumerate() {
            let formatted = format!(
                "{{\"time\": {}, \"track\": {}, \"type\": 0}}{}",
                self.time_notation(index), note.track,
                if index == self.notes.len() - 1 { "" } else { ",\n" }
            );
            let _ = handle.write(formatted.as_bytes());
        }

        let _ = handle.write(b"]");
    }
}


fn open_from_path(path: &str) -> String {
    let mut file = match fs::File::open(path) {
        Ok(f) => f,
        Err(e) => panic!("Something occured while opening file: {:?}", e),
    };

    let mut reader = Vec::new();
    match file.read_to_end(&mut reader) {
        Ok(_) => (),
        Err(e) => panic!("Something occured while reading file: {:?}", e),
    };

    reader.into_iter()
        .map(|c| { c as char })
        .collect()
}


fn get_notes(text: &str) -> Vec<Tap> {
    let mut res: Vec<Tap> = Vec::new();
    for caps in NOTE_PATTERN.captures_iter(text) {
        res.push(Tap::new(
            [caps[1].parse().unwrap(), caps[2].parse().unwrap(), caps[3].parse().unwrap()],
            caps[8].parse().unwrap()
        ));
    }

    res
}


fn get_bpm(text: &str) -> f32 {
    let Some(cap) = BPM_PATTERN.captures(text) else { panic!("Failed to capture") };

    if cap.len() == 2 {
        cap[1].parse().unwrap()
    } else {
        let integer: f32 = cap[1].parse().unwrap();
        let decimal: f32 = cap[2].parse().unwrap();

        integer + decimal
    }
}


fn get_composer(text: &str) -> String {
    let Some(cap) = COMPOSER_PATTERN.captures(text) else { panic!("Failed to capture") };

    if cap.len() == 2 {
        cap[1].to_string()
    } else {
        println!("{}", cap.len());
        String::new()
    }
}


fn get_name(text: &str) -> String {
    let Some(cap) = NAME_PATTERN.captures(text) else { panic!("Failed to capture") };

    if cap.len() == 2 {
        cap[1].to_string()
    } else {
        String::new()
    }
}


fn get_track(text: &str) -> i32 {
    let Some(cap) = TRACK_PATTERN.captures(text) else { panic!("Failed to capture") };

    if cap.len() == 2 {
        cap[1].parse().unwrap()
    } else {
        4
    }
}


fn get_music(text: &str) -> String {
    let Some(cap) = MUSIC_PATTERN.captures(text) else { panic!("Failed to capture") };

    if cap.len() == 2 {
        cap[1].to_string()
    } else {
        String::from("test.mp3")
    }
}


fn get_illustration(text: &str) -> String {
    let Some(cap) = ILLUSTRATION_PATTERN.captures(text) else { panic!("Fail to capture") };

    if cap.len() == 2 {
        cap[1].to_string()
    } else {
        String::from("test.jpg")
    }
}


fn search_chart_from(dir: &str) -> Option<String> {
    let Ok(mut directory) = fs::read_dir(dir) else { return None };
    
    while let Some(Ok(entry)) = directory.next() {
        let path = entry.path();
        let literal = path.to_str().unwrap();

        if path.is_dir() {
            let res = search_chart_from(literal);
            if res.is_some() {
                return res;
            }
        } else if literal.contains(".mc") {
            return Some(literal.to_string());
        }
    }
    
    None
}


fn extract_chart_dir(path: &str) -> String {
    let mut comps: Vec<&str> = path.split("\\").collect();
    
    if comps.len() > 1 {
        comps.pop();
    }

    comps.join("\\")
}


pub fn auto_convert() {
    let chart = Chart::new("../chart");
    chart.write_json();
}


#[no_mangle]
#[wasm_bindgen]
pub fn convert(path: &str) {
    let chart = Chart::from_path(path);
    chart.write_json();
}
