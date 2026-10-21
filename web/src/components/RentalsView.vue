<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useStore, type Rental } from '../store/index';
import { formatDuration, setPopUp } from '../utils';
import AppIcon from './AppIcon.vue';
import CarImage from './CarImage.vue';

const store = useStore();

const now = ref(Date.now());
let timer: ReturnType<typeof setInterval> | undefined;

onMounted(() => (timer = setInterval(() => (now.value = Date.now()), 1000)));
onBeforeUnmount(() => clearInterval(timer));

const remaining = (rental: Rental) => Math.max(0, (rental.endsAt - now.value) / 1000);
const progress = (rental: Rental) => Math.min(100, (remaining(rental) / (rental.hours * 3600)) * 100);

type Status = 'pending' | 'out' | 'missing';

/** pending: rented via phone, not yet picked up at an office | out: vehicle is out | missing: picked up but lost */
const status = (rental: Rental): Status => (!rental.pickedUp ? 'pending' : rental.vehicleExists ? 'out' : 'missing');

const badge: Record<Status, string> = {
    pending: 'bg-accent/15 text-accent',
    out: 'bg-success/15 text-success',
    missing: 'bg-danger/15 text-danger',
};

// A missing vehicle is summoned to the player (only vehicles that were already picked up)
const askRespawn = (rental: Rental) => {
    setPopUp({
        title: rental.label,
        description: store.locale('ui.rentals.respawn_confirm', rental.label, store.money(store.catalog?.respawn.fee ?? 0)),
        buttons: [
            { title: store.locale('ui.cancel') },
            { title: store.locale('ui.rentals.respawn'), color: 'blue', bold: true, cb: () => store.respawn(rental) },
        ],
    });
};
</script>

<template>
    <div class="h-full overflow-y-auto px-6 pb-6">
        <div v-if="!store.rentals.length" class="rise flex h-full flex-col items-center justify-center px-6 pb-12 text-center">
            <div class="grid size-[72px] place-items-center card rounded-lg text-text">
                <AppIcon name="key" class="size-8" />
            </div>
            <div class="mt-4 text-xl font-bold">{{ store.locale('ui.rentals.empty_title') }}</div>
            <p class="mt-1.5 text-[15px] text-muted">{{ store.locale('ui.rentals.empty_text') }}</p>
            <button class="press mt-6 cursor-pointer btn-primary rounded-md px-6 py-3 text-base font-semibold" @click="store.setTab('vehicles')">
                {{ store.locale('ui.rentals.browse') }}
            </button>
        </div>

        <ul v-else class="flex flex-col gap-4">
            <li v-for="(rental, index) in store.rentals" :key="rental.id" class="rise overflow-hidden card rounded-lg" :style="{ animationDelay: `${index * 40}ms` }">
                <div class="relative">
                    <CarImage :src="rental.image" :alt="rental.label" class="h-[150px] w-full p-4" :class="{ 'opacity-50 grayscale': status(rental) === 'missing' }" />
                    <span class="absolute top-3 left-3 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold" :class="badge[status(rental)]">
                        <span class="size-1.5 rounded-full bg-current" />
                        {{ store.locale(`ui.rentals.status_${status(rental)}`) }}
                    </span>
                    <span class="absolute top-3 right-3 rounded-md bg-black/70 px-2 py-0.5 font-mono text-[13px] font-semibold tracking-wider text-white">
                        {{ rental.plate }}
                    </span>
                </div>

                <div class="px-4 pt-3.5 pb-4">
                    <div class="flex items-end justify-between gap-3">
                        <div class="min-w-0">
                            <div class="truncate text-lg leading-tight font-semibold">{{ rental.label }}</div>
                            <div v-if="rental.locationLabel" class="mt-1 flex items-center gap-1 text-sm text-muted">
                                <AppIcon name="pin" class="size-4 shrink-0" />
                                <span class="truncate">{{ rental.locationLabel }}</span>
                            </div>
                        </div>
                        <div class="shrink-0 text-right">
                            <div class="text-[11px] font-medium tracking-wider text-faint uppercase">{{ store.locale('ui.rentals.remaining') }}</div>
                            <div class="text-xl leading-tight font-bold tabular-nums">{{ formatDuration(remaining(rental)) }}</div>
                        </div>
                    </div>

                    <div class="mt-3.5 h-1.5 overflow-hidden rounded-full bg-line">
                        <div class="h-full rounded-full bg-accent" :style="{ width: `${progress(rental)}%` }" />
                    </div>

                    <button
                        v-if="status(rental) === 'pending'"
                        class="press mt-4 flex h-12 w-full cursor-pointer items-center justify-center gap-2 btn-primary rounded-md text-base font-semibold"
                        @click="store.goToOffice()"
                    >
                        <AppIcon name="pin" class="size-5" />
                        {{ store.locale('ui.rentals.nearest_office') }}
                    </button>
                    <button
                        v-else-if="status(rental) === 'out'"
                        class="press mt-4 flex h-12 w-full cursor-pointer items-center justify-center gap-2 btn-secondary rounded-md text-base font-semibold disabled:opacity-40"
                        :disabled="!rental.coords"
                        @click="store.locate(rental)"
                    >
                        <AppIcon name="pin" class="size-5 text-accent" />
                        {{ store.locale('ui.rentals.locate') }}
                    </button>
                    <button
                        v-else-if="store.catalog?.respawn.enabled"
                        class="press mt-4 flex h-12 w-full cursor-pointer items-center justify-center gap-2 btn-primary rounded-md text-base font-semibold disabled:opacity-40"
                        :disabled="store.busy || remaining(rental) <= 60"
                        @click="askRespawn(rental)"
                    >
                        <AppIcon name="refresh" class="size-5" />
                        {{ store.locale('ui.rentals.respawn') }}
                        <span v-if="store.catalog.respawn.fee" class="font-semibold opacity-60 tabular-nums">· {{ store.money(store.catalog.respawn.fee) }}</span>
                    </button>

                    <p class="mt-3 flex items-start gap-1.5 text-[13px] leading-snug text-faint">
                        <AppIcon name="info" class="mt-0.5 size-4 shrink-0" />
                        {{ store.locale(status(rental) === 'pending' ? 'ui.rentals.pending_note' : 'ui.rentals.return_note') }}
                    </p>
                </div>
            </li>
        </ul>
    </div>
</template>
