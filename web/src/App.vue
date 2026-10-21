<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue';
import { useStore, type Tab } from './store/index';
import { devMode, onNuiEvent } from './utils';
import AppIcon from './components/AppIcon.vue';
import AppProvider from './components/AppProvider.vue';
import VehiclesView from './components/VehiclesView.vue';
import VehicleDetail from './components/VehicleDetail.vue';
import RentalsView from './components/RentalsView.vue';

const store = useStore();

const tabs: { id: Tab; icon: string }[] = [
    { id: 'vehicles', icon: 'car' },
    { id: 'rentals', icon: 'key' },
];

const setTheme = (theme?: string) => {
    if (theme) document.documentElement.dataset.theme = theme;
};

let poll: ReturnType<typeof setInterval> | undefined;

onMounted(() => {
    const w = window as any;

    if (devMode) {
        setTheme(document.documentElement.dataset.theme ?? 'dark');
    } else {
        setTheme(w.settings?.display?.theme);
        w.getSettings?.().then((settings: any) => setTheme(settings?.display?.theme)).catch(() => {});
        w.onSettingsChange?.((settings: any) => setTheme(settings?.display?.theme));
    }

    store.load();
    onNuiEvent('refresh', () => store.load());

    // Periodic refresh for vehicle status (out / missing) and location
    poll = setInterval(() => {
        if (!store.busy && store.tab === 'rentals') store.load();
    }, 15000);
});

onBeforeUnmount(() => clearInterval(poll));
</script>

<template>
    <AppProvider>
        <div
            class="relative flex w-full flex-col overflow-hidden bg-bg text-text"
            :class="devMode ? 'h-full' : 'h-screen'"
        >
            <header class="shrink-0 border-b border-divider bg-bg px-6 pt-[60px] pb-4">
                <div class="truncate text-xs font-medium text-faint">{{ store.catalog?.company ?? 'Rent a Car' }}</div>
                <h1 class="mt-0.5 text-[30px] leading-tight font-bold tracking-tight">
                    {{ store.selected ? store.locale('ui.title') : store.locale(`ui.tabs.${store.tab}`) }}
                </h1>
                <div v-if="store.catalog?.requireLicense && !store.license" class="mt-1.5 flex items-center gap-1.5 text-sm text-danger">
                    <AppIcon name="alert" class="size-4 shrink-0" />
                    {{ store.locale('ui.license_missing') }}
                </div>
            </header>

            <main class="relative min-h-0 flex-1 pt-4">
                <div v-if="!store.loaded" class="grid h-full place-items-center text-base text-faint">{{ store.locale('ui.loading') }}</div>

                <div v-else-if="store.unavailable" class="flex h-full flex-col items-center justify-center gap-4 px-10 text-center">
                    <AppIcon name="alert" class="size-10 text-danger" />
                    <p class="text-base text-muted">{{ store.locale('ui.errors.unavailable') }}</p>
                    <button class="press card grid size-12 cursor-pointer place-items-center rounded-md" @click="store.load()">
                        <AppIcon name="refresh" class="size-5" />
                    </button>
                </div>

                <Transition v-else name="view" mode="out-in">
                    <VehicleDetail v-if="store.tab === 'vehicles' && store.vehicle" :key="store.vehicle.model" />
                    <VehiclesView v-else-if="store.tab === 'vehicles'" />
                    <RentalsView v-else />
                </Transition>
            </main>

            <nav v-if="!store.selected" class="flex shrink-0 border-t border-divider bg-bg px-10 pt-2.5 pb-[26px]">
                <button
                    v-for="tab in tabs"
                    :key="tab.id"
                    class="press flex flex-1 cursor-pointer flex-col items-center gap-1 text-xs font-medium"
                    :class="store.tab === tab.id ? 'text-text' : 'text-faint'"
                    @click="store.setTab(tab.id)"
                >
                    <span class="relative">
                        <AppIcon :name="tab.icon" class="size-7" />
                        <span
                            v-if="tab.id === 'rentals' && store.rentals.length"
                            class="absolute -top-1 -right-2.5 grid size-[18px] place-items-center rounded-full bg-danger text-[11px] font-bold text-white"
                        >
                            {{ store.rentals.length }}
                        </span>
                    </span>
                    {{ store.locale(`ui.tabs.${tab.id}`) }}
                </button>
            </nav>
        </div>
    </AppProvider>
</template>
