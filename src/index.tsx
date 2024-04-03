import { Route, RouteProps, RouteSectionProps, Router } from "@solidjs/router";
import { render } from "solid-js/web";
import Canvas from "./pages/Drawing";
import Config from "./pages/Config";
import { createMutable } from "solid-js/store";
import { defaultKeybindings } from "./keybindings";
import { createContext } from "solid-js";


export type State = {
    x: number
}
export const context = createContext<State>();

function App(props: RouteSectionProps) {
    // const keybinds = createMutable(defaultKeybindings());


    return (
    <context.Provider value={{x:312}}> {props.children} </context.Provider>
    );

}

function main() {
    render(
        () => (
        <Router root={App}>
            <Route path="/" component={Canvas}/>
            <Route path="/config" component={Config}/>
        </Router>
        ),
        document.getElementById("root")!
    )
}

main();
