import { detect_lang, type TabGroup } from "./stores";

export enum Result {
    Success = "success",
    Failure = "failure",
    Error = "error",
}

export type Response = {
    group_name: string;
    tab_name: string;
    output: string;

    language: string;

    result: Result;
}

export async function run(tg: TabGroup, stdin: string) : Promise<Response> {
    const first = tg.tabs[tg.focused_tab];

    const files = [{
        name: first.filename,
        content: first.content,
    }];
    
    for (let i = 0; i < tg.tabs.length; i++) {
        if (i !== tg.focused_tab) {
            files.push({
                name: tg.tabs[i].filename,
                content: tg.tabs[i].content,
            });
        }
    }

    const language = detect_lang(first.filename);

    const payload =  {
        files,
        stdin,
        language,
        version: "*",
    };

    const resp = await fetch("https://emkc.org/api/v2/piston/execute", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
            "Content-Type": "application/json",
        },
    });

    const data = await resp.json();


    const output = data.run.output;

    const result = data.run.code === 0 ? Result.Success : Result.Failure;

    return {
        group_name: tg.name,
        tab_name: first.filename,
        output,
        language,
        result,
    };
}
