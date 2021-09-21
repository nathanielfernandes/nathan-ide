import { writable, readable } from 'svelte/store';

// localStorage.clear();

const firstVisit = ((localStorage.getItem("visit") || "0") == "0");
localStorage.setItem("visit", "1");

const storedTheme = localStorage.getItem("theme") || "dracula";
const storedFontSize = localStorage.getItem("fontsize") || 15;
let storedFiles = localStorage.getItem("editor_tabs") 

if (storedFiles === null) {
    storedFiles = [{filename: "file1.lisp", content:";; edit this: file1.lisp"}, ];
} else {
    storedFiles = JSON.parse(storedFiles);
}


export const visit = readable(firstVisit);
export const theme = writable(storedTheme);
export const fontsize = writable(storedFontSize);
export const tabs =  writable([]);
export const files = writable(storedFiles);

theme.subscribe((value) => {
    localStorage.setItem("theme", value);
});


fontsize.subscribe((value) => {
    localStorage.setItem("fontsize", Number(value));
});


files.subscribe((value) => {
    localStorage.setItem("editor_tabs", JSON.stringify(value));
})