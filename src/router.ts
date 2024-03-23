type Route = {
    path: string;
    view: (context: Context) => HTMLCollection;
    regex: RegExp;
};

type paramMap = Map<string, string>;
type navigator = (path: string) => void;

export class Context {
    paramMap: paramMap;
    navigate: navigator;

    constructor(paramMap: paramMap, navigate: navigator) {
        this.paramMap = paramMap;
        this.navigate = navigate;
    }

    param(param: string): string | undefined {
        return this.paramMap.get(param);
    }
}

export function newRouter() {
    return new Router();
}

export class Router {
    routes: Route[] = [];
    root: HTMLElement | undefined;

    notFoundView: () => void = () => {
        console.error("404");
    };

    add(path: string, view: (context: Context) => HTMLCollection) {
        const regex = new RegExp(
            "^" + path.replace(/\//g, "/").replace(/:\w+/g, "(.+)") + "$",
        );
        this.routes.push({ path, view, regex });
    }

    async updateView() {
        const path = location.pathname;
        for (let i = 0; i < this.routes.length; i++) {
            const route = this.routes[i];
            if (route.regex.test(path)) {
                const values = path.match(route.regex)!.splice(1);
                const keys = Array.from(route.path.matchAll(/:(\w+)/g)).map(
                    (result) => result[1],
                );

                const params = new Map(
                    keys.map((k, i) => {
                        return [k, values[i]];
                    }),
                );

                const elements = this.routes[i].view(
                    new Context(params, this.navigate.bind(this)),
                );

                for (let i = 0; i < elements.length; i++) {
                    this.root!.append(elements[i]);
                }
		

                const links = document.getElementsByTagName("csr-link");
                for (let i = 0; i < links.length; i++) {
                    const link = links[i];
                    const href = link.getAttribute("href")!;
                    link.addEventListener("click", () => {
                        this.navigate(href)
                    });
                }

                return;
            }
        }
        this.notFoundView();
    }

    navigate(path: string) {
        if (path === location.pathname) {
            return;
        }
        history.pushState(null, "", path);
        this.updateView();
    }

    start(root: HTMLElement) {
        this.root = root!;
        window.addEventListener("popstate", this.updateView.bind(this));
        this.updateView();
    }
}
