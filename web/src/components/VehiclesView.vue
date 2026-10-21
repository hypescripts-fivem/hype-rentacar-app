<script setup lang="ts">
import { sortModes, useStore } from '../store/index';
import { setContextMenu } from '../utils';
import AppIcon from './AppIcon.vue';
import CarImage from './CarImage.vue';

const store = useStore();

const openSort = () => {
    setContextMenu({
        title: store.locale('ui.sort.label'),
        buttons: sortModes.map((mode) => ({
            title: (store.sort === mode ? '✓ ' : '') + store.locale(`ui.sort.${mode}`),
            color: store.sort === mode ? 'blue' : undefined,
            cb: () => (store.sort = mode),
        })),
    });
};
</script>

<template>
    <div class="flex h-full flex-col">
        <div class="flex shrink-0 gap-2.5 px-6">
            <label class="flex h-12 min-w-0 flex-1 cursor-text items-center gap-2.5 rounded-md border border-line bg-surface px-4 transition-colors focus-within:border-line-focus">
                <AppIcon name="search" class="size-5 shrink-0 text-faint" />
                <input
                    v-model="store.search"
                    type="text"
                    maxlength="40"
                    spellcheck="false"
                    :placeholder="store.locale('ui.search')"
                    class="h-full min-w-0 flex-1 bg-transparent text-base text-text outline-none placeholder:text-faint"
                />
                <button
                    v-if="store.search"
                    class="grid size-5 shrink-0 cursor-pointer place-items-center rounded-full bg-faint text-bg"
                    @click.prevent="store.search = ''"
                >
                    <AppIcon name="close" class="size-3" />
                </button>
            </label>
            <button
                class="press card grid size-12 shrink-0 cursor-pointer place-items-center rounded-md"
                :class="store.sort !== 'default' ? 'text-text' : 'text-muted'"
                @click="openSort"
            >
                <AppIcon name="sort" class="size-5" />
            </button>
        </div>

        <nav class="flex shrink-0 gap-2 overflow-x-auto px-6 pt-3.5 pb-3">
            <button
                v-for="category in store.categories"
                :key="category"
                class="press shrink-0 cursor-pointer rounded-full border px-4 py-1.5 text-sm font-medium"
                :class="store.category === category ? 'border-accent bg-accent text-on-accent' : 'border-line-strong bg-surface text-muted'"
                @click="store.category = category"
            >
                {{ store.locale(`ui.categories.${category}`) }}
            </button>
        </nav>

        <div
            v-if="store.catalog && !store.catalog.remote.enabled"
            class="mx-6 mt-3.5 flex shrink-0 items-start gap-2.5 card rounded-lg px-4 py-3 text-sm leading-snug text-muted"
        >
            <AppIcon name="info" class="mt-0.5 size-4 shrink-0 text-accent" />
            {{ store.locale('ui.remote_off') }}
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto px-6 pt-3.5 pb-6">
            <ul v-if="store.filtered.length" class="grid grid-cols-2 gap-3">
                <li
                    v-for="(vehicle, index) in store.filtered"
                    :key="`${store.category}-${store.sort}-${vehicle.model}`"
                    class="rise"
                    :style="{ animationDelay: `${index * 25}ms` }"
                >
                    <button class="press w-full cursor-pointer overflow-hidden card rounded-lg text-left" @click="store.select(vehicle.model)">
                        <CarImage :src="vehicle.image" :alt="vehicle.label" class="h-[116px] w-full px-3 pt-3 pb-2" />
                        <div class="px-3.5 pt-1.5 pb-3.5">
                            <div class="truncate text-[11px] font-medium tracking-wider text-faint uppercase">
                                {{ store.locale(`ui.categories.${vehicle.category}`) }}
                            </div>
                            <div class="mt-0.5 truncate text-base leading-tight font-semibold">{{ vehicle.label }}</div>
                            <div class="mt-1.5 flex items-baseline gap-1">
                                <span class="text-lg font-bold text-text tabular-nums">{{ store.money(vehicle.price) }}</span>
                                <span class="text-xs text-faint">{{ store.locale('ui.per_hour') }}</span>
                            </div>
                        </div>
                    </button>
                </li>
            </ul>

            <p v-else class="py-16 text-center text-base text-faint">
                {{ store.locale(store.search ? 'ui.no_results' : 'ui.empty') }}
            </p>
        </div>
    </div>
</template>
