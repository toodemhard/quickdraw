import { appContext } from "..";
import { Key, Keybind, defaultKeybindings } from "../keybindings";
import { For, onCleanup, useContext } from "solid-js";

const modifier_names = new Map();
modifier_names.set("Control", "CTRL");
modifier_names.set("Shift", "SHIFT");
modifier_names.set("Alt", "ALT");

function keyToString(k: Key): string {
    let res = "";
    for (let i = 0; i < (k.modifier ? k.modifier.length : 0); i++) {
        res += `${k.modifier![i]} + `;
    }
    res += k.key.toUpperCase();
    return res;
}

function KeyButton(props: { k: Key; onDelete: () => void }) {
    return (
        <button class="group mx-1 rounded-lg border-2 border-primary-0 bg-primary-0 px-2 py-1 hover:border-blue-600">
            {keyToString(props.k)}
            <span
                onClick={props.onDelete}
                class="h-full pl-2 text-neutral-400 hover:text-white"
            >
                x
            </span>
        </button>
    );
}

export default function Config() {
    const app = useContext(appContext)!;
    let keybinds = app.keybinds;

    let controller = new AbortController();
    let signal = controller.signal;

    const listenForKey = (e: KeyboardEvent, onCancel: (k?: Key) => void) => {
        console.log("still listening");
        if (e.key === "Escape") {
            onCancel();
            return;
        }

        if (e.key.length !== 1) {
            return;
        }

        const mods = ["Control", "Shift", "Alt"]
        let activeMods:string[] = [];

        mods.forEach((mod) => {
            if(e.getModifierState(mod)) {
                activeMods.push(mod);
            }
        })

        onCancel({key:e.key, modifier:activeMods});
    }

    const reset_keybindings = () => {
        app.keybinds = defaultKeybindings();
        keybinds = app.keybinds;
    };

    const addKey = (kb: Keybind) => {
        const onCancel = (k? : Key) => {
            document.removeEventListener("keydown", onKeyDown)

            if (k) {
                console.log(k);
                kb.keys.push(k);

            }

        }

        const onKeyDown = (e:KeyboardEvent) => {
            listenForKey(e, onCancel)
        }

        document.addEventListener("keydown", onKeyDown, {signal:signal});
    }

    const removeKey = (kb: Keybind, index: number) => {
        kb.keys.splice(index, 1);
    }

    onCleanup(() => {
        controller.abort
    })

    return (
        <>
            <div class="relative mx-auto max-w-screen-lg">
                <div class="my-4 flex justify-between">
                    <h1 class="text-4xl font-bold">Keybindings</h1>
                    <button
                        onClick={reset_keybindings}
                        class="rounded-full bg-white px-4 py-1 text-xl font-bold text-primary-0"
                    >
                        Reset All
                    </button>
                </div>
                <ul class="text-xl">
                    <For each={keybinds}>
                        {(kb) => (
                            <li class="my-2 flex justify-between px-2 py-1">
                                <span class="my-auto">{kb.name}</span>
                                <div>
                                    <For each={kb.keys}>
                                        {(k, index) => (
                                            <KeyButton
                                                k={k}
                                                onDelete={() => {removeKey(kb, index())}}
                                            />
                                        )}
                                    </For>
                                    <button
                                        onClick={() => {addKey(kb)}}
                                        class="rounded-lg border-2 border-primary-0 bg-primary-0 px-2 py-1 hover:border-blue-600 hover:bg-blue-600"
                                    >
                                        +
                                    </button>
                                </div>
                            </li>
                        )}
                    </For>
                </ul>
            </div>
        </>
    );
}
