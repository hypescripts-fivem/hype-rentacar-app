export const devMode = !(window as any).invokeNative;

export interface NuiResponse<T = unknown> {
    success: boolean;
    error?: string;
    data?: T;
}

/** fetchNui provided by lb-phone to the iframe; returns mock data in the browser */
export async function fetchNui<T = unknown>(event: string, data?: unknown, mock?: T): Promise<NuiResponse<T>> {
    if (devMode) {
        await new Promise((resolve) => setTimeout(resolve, 250));
        return { success: true, data: mock };
    }

    try {
        return (await (window as any).fetchNui(event, data)) as NuiResponse<T>;
    } catch {
        return { success: false, error: 'invalid' };
    }
}

/** Listens for messages sent via SendCustomAppMessage(identifier, { action, data }) */
export function onNuiEvent<T = unknown>(action: string, cb: (data: T) => void) {
    if (!devMode && typeof (window as any).useNuiEvent === 'function') {
        (window as any).useNuiEvent(action, cb);
        return;
    }

    window.addEventListener('message', ({ data }) => {
        if (data?.action === action) cb(data.data);
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

/** lb-phone components are unavailable in the browser, so simple fallbacks are used */
const components = (): any => (window as any).components;

export function setPopUp(data: PopUp) {
    if (!devMode && components()?.setPopUp) return components().setPopUp(data);

    const ok = data.buttons.length < 2 || window.confirm(`${data.title}\n\n${data.description ?? ''}`);
    const button = ok ? data.buttons[data.buttons.length - 1] : data.buttons[0];
    button?.cb?.();
}

export function setContextMenu(data: ContextMenu) {
    if (!devMode && components()?.setContextMenu) return components().setContextMenu(data);

    const options = data.buttons.map((button, index) => `${index + 1}. ${button.title}`).join('\n');
    const choice = Number(window.prompt(`${data.title ?? ''}\n${options}`, '1'));
    data.buttons[choice - 1]?.cb?.();
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
