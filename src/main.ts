import { index_view } from ".";
import * as App from "./app";
import * as router from "./router"

function main() {
    const r = router.newRouter();

    r.add("/", index_view);

    r.start(document.getElementById("app")!);
}

main();
