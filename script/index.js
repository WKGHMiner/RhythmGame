var song_list = new Array();
class Song {
    constructor(dir) {
    }
}
const input = document.querySelector("input[type='file']");
input.addEventListener("change", event => {
    for (const file of event.target.files) {
        console.log(file);
    }
});
export {};
