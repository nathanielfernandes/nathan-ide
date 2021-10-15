import { writable, readable } from 'svelte/store';


const firstVisit = ((localStorage.getItem("visit") || "0") == "0");
localStorage.setItem("visit", "1");

const storedTheme = localStorage.getItem("theme") || "dracula";
const storedAccent = localStorage.getItem("accent") || 4;
const storedFontSize = localStorage.getItem("fontsize") || 15;
let storedFiles = localStorage.getItem("editor_tabs") 

if (storedFiles === null) {
    storedFiles = [{filename: "newfile1", content:""}, ];
} else {
    storedFiles = JSON.parse(storedFiles);
}

let color_values = [
    "#C47ADA",
    "#90BAEE",
    "#75BAFA",
    "#72D5BF",
    "#73DE8C",
    "#FBE66E",
    "#F5B969",
  ];

export const accentColors = readable(color_values);

export const visit = readable(firstVisit);
export const theme = writable(storedTheme);
export const fontsize = writable(storedFontSize);
export const tabs =  writable([]);
export const files = writable(storedFiles);
export const accent = writable(storedAccent);

theme.subscribe((value) => {
    localStorage.setItem("theme", value);
});

accent.subscribe((value) => {
    localStorage.setItem("accent", value);
})

fontsize.subscribe((value) => {
    localStorage.setItem("fontsize", Number(value));
});


files.subscribe((value) => {
    localStorage.setItem("editor_tabs", JSON.stringify(value));
})