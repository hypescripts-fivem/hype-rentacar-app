import { reactive } from 'vue';

const params = new URLSearchParams(window.location.search);

export const isCylex = params.get('phone') === 'cylex';
export const isCodem = params.get('phone') === 'codem';
export const devMode = !isCylex && !isCodem && !(window as any).invokeNative;
export const isLb = !devMode && !isCylex && !isCodem;

const resourceName = params.get('resource') ?? window.location.hostname.replace(/^cfx-nui-/, '');

const codemPending = new Map<string, (result: unknown) => void>();
const codemThemeListeners: ((theme: string) => void)[] = [];
let codemTheme: string | undefined;
let codemSequence = 0;

if (isCodem) {
    window.addEventListener('message', ({ data }) => {
        if (data?.type === 'mphone:callback:response') {
            codemPending.get(data.callbackId)?.(data.result);
        } else if (data?.type === 'mphone:init' && typeof data.theme === 'string') {
            codemTheme = data.theme;
            codemThemeListeners.forEach((listener) => listener(data.theme));
        }
    });
}

function codemCallback<T>(event: string, data?: unknown): Promise<T> {
    return new Promise((resolve) => {
        const callbackId = `${Date.now()}_${++codemSequence}`;
        const finish = (result: unknown) => {
            clearTimeout(timer);
            codemPending.delete(callbackId);
            resolve(result as T);
        };
        const timer = setTimeout(() => finish({ success: false, error: 'connection' }), 10000);
        codemPending.set(callbackId, finish);

        const payload = JSON.parse(JSON.stringify(data ?? {}));
        window.parent.postMessage({ type: 'mphone:callback', action: event, payload, callbackId, server: false }, '*');
    });
}

export async function phoneFetch<T = unknown>(event: string, data?: unknown): Promise<T> {
    if (isCodem) return codemCallback<T>(event, data);

    const response = await fetch(`https://${resourceName}/${event}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify(data ?? {}),
    });
    return (await response.json()) as T;
}

export const codemComponents = (): any => (isCodem ? (window as any).components : undefined);

export function watchPhoneTheme(set: (theme?: string) => void) {
    if (isCylex) return set(params.get('theme') === 'light' ? 'light' : 'dark');

    if (isCodem) {
        set(codemTheme ?? 'dark');
        codemThemeListeners.push(set);
        return;
    }

    const w = window as any;
    set(w.settings?.display?.theme);
    w.getSettings?.().then((settings: any) => set(settings?.display?.theme)).catch(() => {});
    w.onSettingsChange?.((settings: any) => set(settings?.display?.theme));
}

export function unwrapMessage(message: any): any {
    if (message?.type === 'broadcast') return message.message;
    if (typeof message?.action !== 'string' && typeof message?.data?.action === 'string') return message.data;
    return message;
}

export interface DialogButton {
    title: string;
    color?: 'red' | 'blue';
    bold?: boolean;
    disabled?: boolean;
    cb?: () => void;
}

interface DialogState {
    kind: 'popup' | 'menu' | 'input' | null;
    title?: string;
    description?: string;
    image?: string;
    buttons: DialogButton[];
    input: { value: string; placeholder?: string; confirm?: string; cancel?: string; resolve?: (value: string | null) => void };
}

export const dialog = reactive<DialogState>({ kind: null, buttons: [], input: { value: '' } });

function openDialog(state: Partial<DialogState>) {
    dialog.input.resolve?.(null);
    Object.assign(dialog, { title: undefined, description: undefined, image: undefined, buttons: [], input: { value: '' } }, state);
}

export function showPopUp(data: { title: string; description?: string; attachment?: { src: string }; buttons: DialogButton[] }) {
    openDialog({ kind: 'popup', title: data.title, description: data.description, image: data.attachment?.src, buttons: data.buttons });
}

export function showContextMenu(data: { title?: string; buttons: DialogButton[] }) {
    openDialog({ kind: 'menu', title: data.title, buttons: data.buttons });
}

export function promptText(data: { title: string; description?: string; placeholder?: string; value?: string; confirm?: string; cancel?: string }): Promise<string | null> {
    return new Promise((resolve) => {
        const { value, title, description, ...labels } = data;
        openDialog({ kind: 'input', title, description, input: { ...labels, value: value ?? '', resolve } });
    });
}

export function closeDialog(button?: DialogButton) {
    if (button?.disabled) return;

    const { kind, input } = dialog;
    dialog.kind = null;
    dialog.input = { value: '' };

    if (kind === 'input') input.resolve?.(button ? input.value.trim() : null);
    else button?.cb?.();
}

const isTextField = (target: EventTarget | null) =>
    target instanceof HTMLElement && (target.matches('input:not([type=button]):not([type=checkbox]):not([type=radio]), textarea') || target.isContentEditable);

export function installTypingFocus() {
    if (!isCylex && !isCodem) return;

    let typing = false;
    const set = (value: boolean) => {
        if (typing === value) return;
        typing = value;
        phoneFetch('phone:typing', { typing: value }).catch(() => {});
    };

    document.addEventListener('focusin', (event) => set(isTextField(event.target)));
    document.addEventListener('focusout', (event) => {
        if (!isTextField(event.relatedTarget)) set(false);
    });
}
