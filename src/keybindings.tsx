export type Key = {
    modifier?: string[],
    key: string,
}

export enum Action {
    undo,
    redo,
    zoomIn,
    zoomOut,
    decreaseBrushSize,
    increaseBrushSize,
    squareBrush,
    pan,
}

export type Keybind = {
    name: string,
    action: Action,
    keys: Key[],
}

export function defaultKeybindings() : Keybind[] {
    return [
        {
            name: "Undo",
            action: Action.undo,
            keys: [ {key:"u"}, {modifier: ["Control"], key: "z"} ],
        },
        {
            name: "Redo",
            action: Action.redo,
            keys: [{key: "i"}, {modifier: ["Control", "Shift"], key:"z"}, {modifier: ["Control"], key:"y"}],
        },
        {
            name: "Decrease Brush Size",
            action: Action.decreaseBrushSize,
            keys: [{key: "["}],
        },
        {
            name: "Increase Brush Size",
            action: Action.increaseBrushSize,
            keys: [{key: "]"}],
        },
        {
            name: "Square Brush",
            action: Action.squareBrush,
            keys: [{key: "k"}, {key: "j"}],
        },
        {
            name: "Pan",
            action: Action.pan,
            keys: [{key: "c"}, {key: "n"}]
        },
    ]
}

function checkMods (e: KeyboardEvent, mods: string[]): boolean {
    for (let i = 0; i < mods.length; i++) {
        const mod = mods[i];
        if (!e.getModifierState(mod)) {
            return false;
        }
    }

    return true;
}

function getKeyAction(e: KeyboardEvent, keybinds: Keybind[]): Action | null {
    const potentialMatches: {action: Action, mod?: string[]}[] = [];
    for (let i = 0; i < keybinds.length; i++) {
        const kb = keybinds[i];
        for (let j = 0; j < kb.keys.length; j ++) {
            const k = kb.keys[j];

            if (k.modifier && !checkMods(e, k.modifier)) {
                continue;
            }

            if (k.key === e.key.toLowerCase()) {
                potentialMatches.push({action: kb.action, mod: k.modifier});
            }
        }
    }

    if (potentialMatches.length === 0) {
        return null;
    }
    
    let mostSpecific = 0;

    for (let i = 1; i < potentialMatches.length; i++) {
        const current = potentialMatches[i];
        const max = potentialMatches[mostSpecific];
        const currentModLength = (current.mod !== undefined) ? current.mod.length : 0;
        const maxModLength = (max.mod !== undefined) ? max.mod.length : 0;

        if (currentModLength > maxModLength) {
            mostSpecific = i;
        }
    }

    return potentialMatches[mostSpecific].action;
}
