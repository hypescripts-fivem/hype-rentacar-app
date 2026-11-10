import { codemComponents, devMode, isCodem, isLb, phoneFetch, showContextMenu, showPopUp, unwrapMessage } from './phone';

export { devMode, isCodem, isCylex, isLb } from './phone';

export interface NuiResponse<T = unknown> {
    success: boolean;
    error?: string;
    data?: T;
}

/** NUI callback: lb-phone's fetchNui, a plain fetch in cylex_phone, mphone:callback in codem-phone; returns mock data in the browser */
export async function fetchNui<T = unknown>(event: string, data?: unknown, mock?: T): Promise<NuiResponse<T>> {
    if (devMode) {
        await new Promise((resolve) => setTimeout(resolve, 250));
        return { success: true, data: mock };
    }

    try {
        const response = isLb ? await (window as any).fetchNui(event, data) : await phoneFetch(event, data);
        if (!response || typeof response !== 'object') return { success: false, error: 'invalid' };
        return response as NuiResponse<T>;
    } catch {
        return { success: false, error: 'invalid' };
    }
}

/** Listens for messages sent via the phone bridge's SendAppMessage(identifier, { action, data }) */
export function onNuiEvent<T = unknown>(action: string, cb: (data: T) => void) {
    if (isLb && typeof (window as any).useNuiEvent === 'function') {
        (window as any).useNuiEvent(action, cb);
        return;
    }

    window.addEventListener('message', ({ data }) => {
        const message = unwrapMessage(data);
        if (message?.action === action) cb(message.data);
    });
}

interface PopUpButton {
    title: string;
    color?: 'red' | 'blue';
    bold?: boolean;
    cb?: () => void;
}

interface PopUp {
    title: string;
    description?: string;
    attachment?: { src: string };
    buttons: PopUpButton[];
}

interface ContextMenu {
    title?: string;
    buttons: { title: string; color?: 'red' | 'blue'; disabled?: boolean; cb?: () => void }[];
}

/** lb-phone components; in cylex_phone, codem-phone (menus) and the browser PhoneDialogs.vue draws them */
const components = (): any => (window as any).components;

export function setPopUp(data: PopUp) {
    if (isLb && components()?.setPopUp) return components().setPopUp(data);
    if (isCodem && codemComponents()?.setPopUp && data.buttons.length <= 2 && !data.attachment) {
        codemComponents().setPopUp({ title: data.title, description: data.description, buttons: data.buttons });
        return;
    }
    showPopUp(data);
}

export function setContextMenu(data: ContextMenu) {
    if (isLb && components()?.setContextMenu) return components().setContextMenu(data);
    showContextMenu(data);
}

export const formatDuration = (seconds: number): string => {
    const value = Math.max(0, Math.floor(seconds));
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(Math.floor(value / 3600))}:${pad(Math.floor((value % 3600) / 60))}:${pad(value % 60)}`;
};

/** Readable text color (black/white) for a background color, based on WCAG relative luminance */
export const contrastColor = (hex: string): string => {
    let value = hex.trim().replace('#', '');
    if (value.length === 3) value = value.split('').map((c) => c + c).join('');
    if (!/^[0-9a-f]{6}$/i.test(value)) return '#111113';

    const [r, g, b] = [0, 2, 4]
        .map((i) => parseInt(value.slice(i, i + 2), 16) / 255)
        .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));

    return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.179 ? '#111113' : '#ffffff';
};
