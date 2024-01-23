import { get, writable } from 'svelte/store';

export function localstate<T>(initial: T, id: string, delay = 500, replacer?: (key: string, value: any) => any) {
	if (id === undefined) {
		id = hash(initial);
	}

	const saved = writable(true);
	const saveToLocalStorage = (key: string, value: any) => {
		setToLocalStorage(key, value, replacer);
		saved.set(true);
	}

	let local = getFromLocalStorage(id);
    if (local === null) {
        saveToLocalStorage(id, initial);
    }

	const w = writable(local || initial);
	const debouncedSet = debounce(saveToLocalStorage, delay);

	return {
		subscribe: w.subscribe,
		set: (value: T) => {
			saved.set(false);
			debouncedSet(id, value);
			w.set(value);
		},
		update: (fn: (value: T) => T) => {
			saved.set(false);
			w.update((current) => {
				const value = fn(current);
                debouncedSet(id, value);
				return value;
			});
		},
		reset: () => w.set(initial),
		save: () => {
			saved.set(false);
			debouncedSet(id, get(w))
		},
		forceSave: () => saveToLocalStorage(id, get(w)),
		saved: saved,
	};
}

function getFromLocalStorage(key: string): any {
	const item = localStorage.getItem(key);
	return item ? JSON.parse(item) : null;
}

function setToLocalStorage(key: string, value: any, replacer?: (key: string, value: any) => any) {
	const item = JSON.stringify(value, replacer);
	localStorage.setItem(key, item);
	// console.log(`saved ${key} to localStorage`);
}

function hash(obj: any): string {
	return JSON.stringify(obj)
		.split('')
		.reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0)
		.toString(16);
}


//@ts-ignore
export function debounce(fn, delay) {
    //@ts-ignore
	let timeoutID = null;
    //@ts-ignore
    return function (...args) {
        //@ts-ignore
        clearTimeout(timeoutID);
		timeoutID = setTimeout(() => fn(...args), delay);
	};
}