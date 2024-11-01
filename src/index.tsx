import { Route, RouteProps, RouteSectionProps, Router } from "@solidjs/router";
import { render } from "solid-js/web";
import Canvas from "./pages/Drawing";
import Config from "./pages/Config";
import { createMutable } from "solid-js/store";
import { defaultKeybindings } from "./keybindings";
import { createContext } from "solid-js";
import { App, Drawing, Editor } from "./draw";


export const appContext = createContext<App>();

const rootUrl = "/quickdraw"

function Root(props: RouteSectionProps) {
    const value = createMutable<App>({
        editor: createMutable(new Editor),
        drawing: createMutable(new Drawing(800, 600)),
        keybinds: defaultKeybindings()
        });

    return (
    <>
        <appContext.Provider value={value}> {props.children} </appContext.Provider>
    </>
    );

}

function main() {
    render(
        () => (
        <Router root={Root}>
            <Route path={rootUrl+"/"} component={Canvas}/>
            <Route path={rootUrl+"/config"} component={Config}/>
        </Router>
        ),
        document.getElementById("root")!
    )
}

main();
