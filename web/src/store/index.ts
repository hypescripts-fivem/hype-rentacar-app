import { defineStore } from 'pinia';
import { devMode, fetchNui, setPopUp } from '../utils';
import trLocales from '../../../locales/tr.json';

/** Flattens nested keys like lib.getLocales() into "ui.tabs.vehicles" form (for browser preview) */
const flatten = (source: Record<string, any>, prefix = '', target: Record<string, string> = {}) => {
    for (const [key, value] of Object.entries(source)) {
        if (value && typeof value === 'object') flatten(value, `${prefix}${key}.`, target);
        else target[`${prefix}${key}`] = String(value);
    }
    return target;
};

export type Tab = 'vehicles' | 'rentals';
export type SortMode = 'default' | 'price_asc' | 'price_desc' | 'name';

export const sortModes: SortMode[] = ['default', 'price_asc', 'price_desc', 'name'];

export interface Vehicle {
    model: string;
    label: string;
    category: string;
    price: number;
    deposit: number;
    image: string;
}

export interface Duration {
    hours: number;
    discount: number;
}

export interface Location {
    id: string;
    label: string;
    coords: { x: number; y: number };
}

export interface Catalog {
    company: string;
    ui: { accent: string; numberLocale: string; currency: string };
    vehicles: Vehicle[];
    durations: Duration[];
    locations: Location[];
    accounts: string[];
    requireLicense: boolean;
    maxRentals: number;
    remote: { enabled: boolean; fee: number };
    respawn: { enabled: boolean; fee: number };
}

export interface PlayerInfo {
    id: number;
    firstname: string;
    lastname: string;
    cash: number;
    bank: number;
}

interface RawRental {
    id: number;
    model: string;
    label: string;
    plate: string;
    hours: number;
    deposit: number;
    payment: string;
    location: string;
    locationLabel?: string | null;
    image: string;
    remaining: number;
    pickedUp: boolean;
    vehicleExists: boolean;
    coords?: { x: number; y: number } | null;
}

export interface Rental extends RawRental {
    endsAt: number;
}

interface PlayerData {
    player: PlayerInfo;
    license: boolean;
    rentals: RawRental[];
}

interface DataResponse {
    locales?: Record<string, string>;
    catalog: Catalog;
    data: PlayerData;
}

interface ActionResult {
    id: number;
    plate: string;
    label: string;
}

const image = (model: string) => `https://docs.fivem.net/vehicles/${model}.webp`;

const mockVehicles: Vehicle[] = [
    { model: 'panto', label: 'Benefactor Panto', category: 'compact', price: 40, deposit: 300, image: image('panto') },
    { model: 'asbo', label: 'Maxwell Asbo', category: 'compact', price: 50, deposit: 400, image: image('asbo') },
    { model: 'blista', label: 'Dinka Blista', category: 'compact', price: 60, deposit: 400, image: image('blista') },
    { model: 'asea', label: 'Declasse Asea', category: 'sedan', price: 70, deposit: 500, image: image('asea') },
    { model: 'tailgater', label: 'Obey Tailgater', category: 'sedan', price: 120, deposit: 800, image: image('tailgater') },
    { model: 'baller', label: 'Gallivanter Baller', category: 'suv', price: 150, deposit: 1000, image: image('baller') },
    { model: 'sultan', label: 'Karin Sultan', category: 'sport', price: 220, deposit: 2000, image: image('sultan') },
    { model: 'bati', label: 'Pegassi Bati 801', category: 'motorcycle', price: 160, deposit: 1500, image: image('bati') },
];

const mock: DataResponse = {
    catalog: {
        company: 'Los Santos Rent a Car',
        ui: { accent: '#e9b44c', numberLocale: 'en-US', currency: '$' },
        vehicles: mockVehicles,
        durations: [
            { hours: 1, discount: 0 },
            { hours: 2, discount: 0 },
            { hours: 4, discount: 5 },
            { hours: 8, discount: 10 },
            { hours: 24, discount: 20 },
        ],
        locations: [
            { id: 'legion', label: 'Legion Square', coords: { x: 109.9, y: -1088.6 } },
            { id: 'airport', label: 'LSIA Airport', coords: { x: -1035.0, y: -2731.0 } },
        ],
        accounts: ['cash', 'bank'],
        requireLicense: true,
        maxRentals: 2,
        remote: { enabled: true, fee: 100 },
        respawn: { enabled: true, fee: 250 },
    },
    data: {
        player: { id: 12, firstname: 'John', lastname: 'Doe', cash: 15420, bank: 1250300 },
        license: true,
        rentals: [
            {
                id: 7, model: 'blista', label: 'Dinka Blista', plate: 'RENT0421', hours: 2, deposit: 400, payment: 'bank',
                location: 'legion', locationLabel: 'Legion Square', image: image('blista'), remaining: 4210, pickedUp: true, vehicleExists: false, coords: null,
            },
        ],
    },
};

let loading: Promise<void> | null = null;
let reloadQueued = false;

const withEndsAt = (rentals: RawRental[] = []): Rental[] =>
    rentals.map((rental) => ({ ...rental, endsAt: Date.now() + rental.remaining * 1000 }));

export const useStore = defineStore('rentacar', {
    state: () => ({
        loaded: false,
        unavailable: false,
        busy: false,
        tab: 'vehicles' as Tab,
        locales: (devMode ? flatten(trLocales) : {}) as Record<string, string>,
        catalog: null as Catalog | null,
        player: null as PlayerInfo | null,
        license: true,
        rentals: [] as Rental[],

        search: '',
        category: 'all',
        sort: 'default' as SortMode,

        selected: null as string | null,
        hours: 1,
        payment: 'cash',
    }),
    getters: {
        locale: (state) => (key: string, ...args: (string | number)[]): string => {
            const text = state.locales[key] ?? key;
            if (!args.length) return text;

            let index = 0;
            return text.replace(/%[sd]/g, () => String(args[index++] ?? ''));
        },
        money: (state) => (value: number): string => {
            const ui = state.catalog?.ui ?? mock.catalog.ui;
            return ui.currency + new Intl.NumberFormat(ui.numberLocale).format(value ?? 0);
        },
        accent: (state) => state.catalog?.ui.accent ?? mock.catalog.ui.accent,
        categories(state): string[] {
            const list = ['all'];
            for (const vehicle of state.catalog?.vehicles ?? []) {
                if (!list.includes(vehicle.category)) list.push(vehicle.category);
            }
            return list;
        },
        filtered(state): Vehicle[] {
            const numberLocale = state.catalog?.ui.numberLocale;
            const query = state.search.trim().toLocaleLowerCase(numberLocale);
            const list = (state.catalog?.vehicles ?? []).filter((vehicle) => {
                if (state.category !== 'all' && vehicle.category !== state.category) return false;
                if (!query) return true;
                return `${vehicle.label} ${vehicle.model}`.toLocaleLowerCase(numberLocale).includes(query);
            });

            if (state.sort === 'price_asc') list.sort((a, b) => a.price - b.price);
            else if (state.sort === 'price_desc') list.sort((a, b) => b.price - a.price);
            else if (state.sort === 'name') list.sort((a, b) => a.label.localeCompare(b.label, numberLocale));
            return list;
        },
        vehicle(state): Vehicle | null {
            return state.catalog?.vehicles.find((vehicle) => vehicle.model === state.selected) ?? null;
        },
        duration(state): Duration {
            const durations = state.catalog?.durations ?? [];
            return durations.find((duration) => duration.hours === state.hours) ?? durations[0] ?? { hours: 1, discount: 0 };
        },
        quote(): { base: number; discount: number; rent: number; fee: number; deposit: number; total: number } {
            const vehicle = this.vehicle;
            if (!vehicle) return { base: 0, discount: 0, rent: 0, fee: 0, deposit: 0, total: 0 };

            const base = vehicle.price * this.duration.hours;
            const rent = Math.floor((base * (100 - this.duration.discount)) / 100 + 0.5);
            const fee = this.catalog?.remote.fee ?? 0;
            return { base, discount: base - rent, rent, fee, deposit: vehicle.deposit, total: rent + fee + vehicle.deposit };
        },
        balance(state): (account: string) => number {
            return (account: string) => (account === 'bank' ? state.player?.bank : account === 'cash' ? state.player?.cash : 0) ?? 0;
        },
        blockedReason(state): string | null {
            if (!state.catalog?.remote.enabled) return 'remote_disabled';
            if (state.catalog.requireLicense && !state.license) return 'no_license';
            if (state.rentals.length >= state.catalog.maxRentals) return 'max_rentals';
            if (this.balance(state.payment) < this.quote.total) return 'no_money';
            return null;
        },
    },
    actions: {
        applyData(data: PlayerData) {
            this.player = data.player;
            this.license = data.license;
            this.rentals = withEndsAt(data.rentals);
        },
        /** If refresh requests overlap (open + money change, etc.), one runs and one more is queued */
        async load() {
            if (loading) {
                reloadQueued = true;
                return loading;
            }

            loading = this.fetchData();
            await loading;
            loading = null;

            if (reloadQueued) {
                reloadQueued = false;
                await this.load();
            }
        },
        async fetchData() {
            const response = await fetchNui<DataResponse>('getData', {}, mock);

            if (!response.success || !response.data) {
                // If data was loaded before, it stays on screen on a transient error
                if (!this.loaded) this.unavailable = true;
                this.loaded = true;
                return;
            }

            const { locales, catalog, data } = response.data;
            if (locales) this.locales = locales;
            this.catalog = catalog;
            this.applyData(data);
            this.unavailable = false;

            if (!this.loaded) {
                this.payment = catalog.accounts[0] ?? 'cash';
                this.hours = catalog.durations[0]?.hours ?? 1;
                if (this.rentals.length) this.tab = 'rentals';
            }
            this.loaded = true;
        },
        setTab(tab: Tab) {
            this.tab = tab;
            this.selected = null;
        },
        select(model: string | null) {
            this.selected = model;
        },
        showError(error?: string) {
            setPopUp({
                title: this.locale('ui.errors.title'),
                description: this.locale(`ui.errors.${error ?? 'invalid'}`),
                buttons: [{ title: this.locale('ui.ok'), bold: true }],
            });
        },
        confirmRent() {
            const vehicle = this.vehicle;
            if (!vehicle || this.busy || this.blockedReason) return;

            setPopUp({
                title: this.locale('ui.details.confirm_title'),
                description: this.locale(
                    'ui.details.confirm_text',
                    vehicle.label,
                    this.hours,
                    this.money(this.quote.total),
                    this.locale(`ui.${this.payment}`),
                ),
                buttons: [
                    { title: this.locale('ui.cancel') },
                    { title: this.locale('ui.details.rent'), color: 'blue', bold: true, cb: () => this.rent() },
                ],
            });
        },
        async rent() {
            const vehicle = this.vehicle;
            if (!vehicle || this.busy) return;
            this.busy = true;

            const response = await fetchNui<ActionResult>(
                'rent',
                { model: vehicle.model, hours: this.hours, payment: this.payment },
                { id: 99, plate: 'RENT1234', label: vehicle.label },
            );
            this.busy = false;

            if (!response.success || !response.data) return this.showError(response.error);

            // The vehicle does not spawn right away: the player picks it up at any office
            const result = response.data;
            setPopUp({
                title: this.locale('ui.details.success_title'),
                description: this.locale('ui.details.success_text', result.label, result.plate),
                buttons: [
                    { title: this.locale('ui.ok') },
                    { title: this.locale('ui.rentals.nearest_office'), color: 'blue', bold: true, cb: () => this.goToOffice() },
                ],
            });

            this.selected = null;
            this.tab = 'rentals';
            await this.load();
        },
        /** Summons a picked-up but lost vehicle to the player */
        async respawn(rental: Rental) {
            if (this.busy || !rental.pickedUp) return;
            this.busy = true;

            const response = await fetchNui<ActionResult>(
                'respawn',
                { id: rental.id },
                { id: rental.id, plate: rental.plate, label: rental.label },
            );
            this.busy = false;

            if (!response.success || !response.data) return this.showError(response.error);

            setPopUp({
                title: this.locale('ui.rentals.respawned_title'),
                description: this.locale('ui.rentals.respawned_text', response.data.label),
                buttons: [{ title: this.locale('ui.ok'), bold: true }],
            });
            await this.load();
        },
        /** GPS to the nearest office for a rental not yet picked up */
        async goToOffice() {
            const locations = this.catalog?.locations ?? [];
            const response = await fetchNui<{ label: string; distance: number }>(
                'nearestOffice',
                { locations },
                { label: locations[0]?.label ?? '', distance: 850 },
            );

            if (!response.success || !response.data) return this.showError(response.error);

            setPopUp({
                title: response.data.label,
                description: this.locale('ui.rentals.office_marked', response.data.label, response.data.distance),
                buttons: [{ title: this.locale('ui.ok'), bold: true }],
            });
        },
        locate(rental: Rental) {
            if (!rental.coords) return;
            fetchNui('waypoint', rental.coords);
            setPopUp({
                title: rental.label,
                description: this.locale('ui.rentals.located'),
                buttons: [{ title: this.locale('ui.ok'), bold: true }],
            });
        },
    },
});
