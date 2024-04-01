import { html, render } from "lit-html";
import { Action, App, Key, Keybind, defaultKeybindings} from "./main";
import { Context } from "./router";
import { repeat } from "lit-html/directives/repeat.js";
import { map } from "lit-html/directives/map.js";
import { styleMap } from "lit-html/directives/style-map.js";


const modifier_names = new Map()
modifier_names.set("Control", "CTRL");
modifier_names.set("Shift", "SHIFT");
modifier_names.set("Alt", "ALT");

function key_button(k: Key, del: () => void) {
    return html`<button class="group mx-1 px-2 py-1 rounded-lg bg-primary-0 border-primary-0 hover:border-blue-600 border-2">
    ${map(k.modifier, (mod) => html`${modifier_names.get(mod)}+`)}${k.key.toUpperCase()}
    <!-- <svg @click=${del} class="inline fill-neutral-400 hover:fill-white h-6" viewBox="0 -0.5 25 25" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M6.96967 16.4697C6.67678 16.7626 6.67678 17.2374 6.96967 17.5303C7.26256 17.8232 7.73744 17.8232 8.03033 17.5303L6.96967 16.4697ZM13.0303 12.5303C13.3232 12.2374 13.3232 11.7626 13.0303 11.4697C12.7374 11.1768 12.2626 11.1768 11.9697 11.4697L13.0303 12.5303ZM11.9697 11.4697C11.6768 11.7626 11.6768 12.2374 11.9697 12.5303C12.2626 12.8232 12.7374 12.8232 13.0303 12.5303L11.9697 11.4697ZM18.0303 7.53033C18.3232 7.23744 18.3232 6.76256 18.0303 6.46967C17.7374 6.17678 17.2626 6.17678 16.9697 6.46967L18.0303 7.53033ZM13.0303 11.4697C12.7374 11.1768 12.2626 11.1768 11.9697 11.4697C11.6768 11.7626 11.6768 12.2374 11.9697 12.5303L13.0303 11.4697ZM16.9697 17.5303C17.2626 17.8232 17.7374 17.8232 18.0303 17.5303C18.3232 17.2374 18.3232 16.7626 18.0303 16.4697L16.9697 17.5303ZM11.9697 12.5303C12.2626 12.8232 12.7374 12.8232 13.0303 12.5303C13.3232 12.2374 13.3232 11.7626 13.0303 11.4697L11.9697 12.5303ZM8.03033 6.46967C7.73744 6.17678 7.26256 6.17678 6.96967 6.46967C6.67678 6.76256 6.67678 7.23744 6.96967 7.53033L8.03033 6.46967ZM8.03033 17.5303L13.0303 12.5303L11.9697 11.4697L6.96967 16.4697L8.03033 17.5303ZM13.0303 12.5303L18.0303 7.53033L16.9697 6.46967L11.9697 11.4697L13.0303 12.5303ZM11.9697 12.5303L16.9697 17.5303L18.0303 16.4697L13.0303 11.4697L11.9697 12.5303ZM13.0303 11.4697L8.03033 6.46967L6.96967 7.53033L11.9697 12.5303L13.0303 11.4697Z"></path> </g></svg> -->
    <span @click=${del} class="text-neutral-400 h-full pl-2 hover:text-white">x</span>
    </button>`
}

export function config_view(app: App) {
    let keybinds = app.keybinds;
    const root = document.getElementById("app")!;

    root.addEventListener("keydown", (e:KeyboardEvent) => {
        if (e.key === "Escape") {
            kb_add = false;
            update();
            return;
        }

        if (e.key.length !== 1) {
            return;
        }

        if (!kb_add) {
            return;
        }
        kb_add = false;


        const mods = ["Control", "Shift", "Alt"]
        let activeMods:string[] = [];

        mods.forEach((mod) => {
            if(e.getModifierState(mod)) {
                activeMods.push(mod);
            }
        })

        kb_active.keys.push({key:e.key, modifier:activeMods});
        console.log(activeMods)
        update();
    })

    let kb_add = false;
    let kb_active: Keybind;
    const add_onclick = (kb: Keybind) => {
        kb_add = true;
        kb_active = kb;
        update();
    }

    const delete_key = (kb: Keybind, k_index: number) => {
        return () => {
            kb.keys.splice(k_index, 1)
            update();
        }
    }

    const reset_keybindings = () => {
        app.keybinds = defaultKeybindings();
        keybinds = app.keybinds;
        update();
    }

    const update = () => {
        console.log(kb_add);
        const style = {visibility: kb_add ? "visible" : "hidden"};
        console.log(style);
        const templ = () => html`
        <div class="max-w-screen-lg mx-auto relative">
            <div class="flex justify-between my-4">
                <h1 class="text-4xl font-bold">Keybindings</h1>
                <button @click=${reset_keybindings} class="text-xl bg-white font-bold px-4 py-1 rounded-full text-primary-0">Reset All</button>
            </div>
            <ul class="text-xl">
            ${map(keybinds, (kb) => html`
                <li class="flex justify-between py-1 px-2 my-2">
                    <span class="my-auto">
                    ${kb.name}
                    </span>
                    <div>
                    ${map(kb.keys, (k, i) => html`${key_button(k, delete_key(kb, i))}`)}
                    <button @click="${() => {add_onclick(kb)}}" class="px-2 py-1 rounded-lg bg-primary-0 border-primary-0 border-2 hover:bg-blue-600 hover:border-blue-600">+</button>
                    </div>
                </li>
            `)}
            </ul>
        </div>
        <div style=${styleMap(style)} class="absolute m-auto top-0 bottom-0 left-0 right-0 w-fit h-fit">press any key</div>
        `
        render(templ(), root);
    }

    update();
}
