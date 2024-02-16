// source: https://gist.github.com/1Marc/09e739caa6a82cc176ab4c2abd691814

export type Getter<T> = () => T;
export type Setter<T> = (v: T) => void;

export type Signal<T> = [Getter<T>, Setter<T>]

const context: { (): void }[] = [];

export function createSignal<T>(value: T): Signal<T> {
    const subscriptions: Set<() => void> = new Set();

    const read = () => {
        const observer = context[context.length - 1];
        if (observer) {
            subscriptions.add(observer);
        }
        return value;
    }
    const write = (newValue: T) => {
        value = newValue
        subscriptions.forEach(observer => {
            observer();
        })
    }

    return [read, write];
}

export function createEffect(fn: () => void) {
    context.push(fn);
    fn();
    context.pop();
}

export function createMemo<T>(fn: () => T): Getter<T> {
    const [signal, setSignal] = createSignal(fn());
    createEffect(() => setSignal(fn()));
    return signal;
}
