type Listener = () => void;

const listeners = new Set<Listener>();

export function onOpenComposer(fn: Listener) {
    listeners.add(fn);
    return () => {
        listeners.delete(fn);
    };
}

export function emitOpenComposer() {
    for (const fn of Array.from(listeners)) {
        try {
            fn();
        } catch (e) {
            // ignore
        }
    }
}
