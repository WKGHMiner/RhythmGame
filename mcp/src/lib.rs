use std::io::{Read, Write};
use std::fs;
use regex::*;
use once_cell::sync::Lazy;
use std::fmt::Display;
use wasm_bindgen::prelude::*;


static NOTE_PATTERN: Lazy<Regex> = Lazy::new(|| {
    Regex::new(
        r#"\{"beat":\[(\d+),(\d+),(\d+)\],("endbeat":\[(\d+),(\d+),(\d+)\],)?("sound":"([^"]+)",)?("vol":([-]?\d+),)?("column":(\d+))?\}"#
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
        r#"\{"beat":\[0,0,1\],("sound":"([^"]+)",)?("vol":([-]?\d+),)?("offset":([-]?\d+),)?"type":1\}"#
    )
    .unwrap()
});


static ILLUSTRATION_PATTERN: Lazy<Regex> = Lazy::new(|| {
    Regex::new(
        r#""background":"([^"]+)""#
    )
    .unwrap()
});


static OFFSET_PATTERN: Lazy<Regex> = Lazy::new(|| {
    Regex::new(
        r#""offset":([-]?\d+)"#
    )
    .unwrap()
});


struct Tap {
    beat: [i32; 3],
    sound: Option<String>,
    track: Option<i32>,
}


impl Tap {
    pub fn new(beat: [i32; 3], sound: Option<String>, track: Option<i32>) -> Self {
        Self { beat, sound, track }
    }
}


impl Display for Tap {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "Beat: {:?}\nTrack: {:?}", self.beat, self.track)
    }
}


pub struct Chart {
    dir: String,
    name: String,
    composer: String,
    music: Option<String>,
    illustration: String,
    offset: i32,
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
        let offset = get_offset(&txt);
        let track = get_track(&txt);
        let notes = get_notes(&txt);
        let bpm = get_bpm(&txt);

        music = music.map(|s| { format!("{}/{}", dir, s) });
        illustration = format!("{}/{}", dir, illustration);

        Self { dir, name, composer, music, illustration, offset, track, bpm, notes }
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
        self.write_offset(&mut handle);
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
        let formatted = if self.music.is_some() {
            format!("\"music\":\"{}\",\n\"special\":false,\n", self.music.as_ref().unwrap())
        } else {
            "\"music\":null,\n\"special\":true,\n".to_string()
        };
        let _ = handle.write(formatted.as_bytes());
    }


    fn write_illustration(&self, handle: &mut fs::File) {
        let formatted = format!("\"illustration\":\"{}\",\n", self.illustration);
        let _ = handle.write(formatted.as_bytes());
    }


    fn write_offset(&self, handle: &mut fs::File) {
        let formatted = format!("\"offset\":{},\n", self.offset);
        let _ = handle.write(formatted.as_bytes());
    }


    fn write_track(&self, handle: &mut fs::File) {
        let formatted = format!("\"track\":{},\n", self.track);
        let _ = handle.write(formatted.as_bytes());
    }


    fn write_notes(&self, handle: &mut fs::File) {
        let _ = handle.write(b"\"notes\":[\n");
        
        for (index, note) in self.notes.iter().enumerate() {
            let sound_format = if note.sound.is_some() {
                format!("\"sound\": \"{}/{}\", ", self.dir, note.sound.as_ref().unwrap())
            } else { String::new() };

            let track_format = if note.track.is_some() {
                format!("\"track\": {}, ", note.track.unwrap())
            } else { String::new() };

            let formatted = format!(
                "{{\"time\": {}, {}{}\"type\": 0}}{}",
                self.time_notation(index), track_format,
                sound_format,
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
    for (index, cap) in NOTE_PATTERN.captures_iter(text).enumerate() {
        println!("Note id: {}", index);
        for field in cap.iter() {
            println!("{:?}", field);
        }
        println!();

        let sound = if cap.get(9).is_some() {
            Some(cap[9].to_string())
        } else { None };

        res.push(Tap::new(
            [cap[1].parse().unwrap(), cap[2].parse().unwrap(), cap[3].parse().unwrap()],
            sound,
            cap.get(13).map(|s| {s.as_str().parse().unwrap()})
        ));
    }

    res.remove(0);
    res
}


fn get_bpm(text: &str) -> f32 {
    if let Some(cap) = BPM_PATTERN.captures(text) {
        if cap.len() == 2 {
            cap[1].parse().unwrap()
        } else {
            let integer: f32 = cap[1].parse().unwrap();
            let decimal: f32 = cap[2].parse().unwrap();
    
            integer + decimal
        }
    } else {
        120f32
    }
}


fn get_composer(text: &str) -> String {
    if let Some(cap) = COMPOSER_PATTERN.captures(text) {
        if cap.len() == 2 {
            return cap[1].to_string();
        }
    }

    String::new()
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
    if let Some(cap) = TRACK_PATTERN.captures(text) {
        if cap.len() == 2 {
            return cap[1].parse().unwrap();
        }
    }

    4
}


fn get_music(text: &str) -> Option<String> {
    if let Some(cap) = MUSIC_PATTERN.captures(text) {
        cap.get(2).map(|s| { s.as_str().to_string() })
    } else {
        None
    }
}


fn get_illustration(text: &str) -> String {
    if let Some(cap) = ILLUSTRATION_PATTERN.captures(text) {
        if cap.len() == 2 {
            return cap[1].to_string();
        }
    }

    String::from("test.jpg")
}


fn get_offset(text: &str) -> i32 {
    if let Some(cap) = OFFSET_PATTERN.captures(text) {
        if cap.len() == 2 {
            return cap[1].parse().unwrap();
        }
    }

    0
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
    let mut comps: Vec<&str> = path.split("\\")
        .flat_map(|slice| { slice.split("/") })
        .collect();
    
    if comps.len() > 1 {
        comps.pop();
    }

    comps.join("/")
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


#[cfg(test)]
mod test {
    use crate::{extract_chart_dir, get_music, get_offset, open_from_path};

    #[test]
    fn test_extract() {
        extract_chart_dir("../chart/Never_Escape/key_4k_hard.mc");
    }

    
    #[test]
    fn test_get_music() {
        let text = open_from_path("../chart/Override/Override.mc");
        println!("{}", get_offset(&text));
        println!("{:?}", get_music(&text))
    }
}