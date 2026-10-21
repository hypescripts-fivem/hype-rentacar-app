<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from '../store/index';
import AppIcon from './AppIcon.vue';
import CarImage from './CarImage.vue';

const store = useStore();

const vehicle = computed(() => store.vehicle!);
const quote = computed(() => store.quote);
const catalog = computed(() => store.catalog!);

// "invalid" only happens when no office is selected, so disabling the button is enough
const hint = computed(() => (store.blockedReason && store.blockedReason !== 'invalid' ? store.blockedReason : null));
</script>

<template>
    <div class="flex h-full flex-col">
        <div class="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
            <button class="press -ml-1.5 flex cursor-pointer items-center gap-0.5 text-[17px] font-medium text-muted hover:text-text" @click="store.select(null)">
                <AppIcon name="back" class="size-6" />
                {{ store.locale('ui.back') }}
            </button>

            <div class="rise mt-3 overflow-hidden card rounded-lg">
                <CarImage :src="vehicle.image" :alt="vehicle.label" class="h-[190px] w-full p-5" />
                <div class="flex items-end justify-between gap-3 px-4 py-3.5">
                    <div class="min-w-0">
                        <div class="text-xs font-medium tracking-wider text-muted uppercase">{{ store.locale(`ui.categories.${vehicle.category}`) }}</div>
                        <div class="truncate text-[22px] leading-tight font-bold tracking-tight">{{ vehicle.label }}</div>
                    </div>
                    <div class="shrink-0 text-right">
                        <span class="text-xl font-bold tabular-nums">{{ store.money(vehicle.price) }}</span>
                        <span class="ml-1 text-sm text-faint">{{ store.locale('ui.per_hour') }}</span>
                    </div>
                </div>
            </div>

            <div class="mt-4 flex items-start gap-2.5 card rounded-lg px-4 py-3.5 text-sm leading-snug text-muted">
                <AppIcon name="pin" class="mt-0.5 size-4 shrink-0 text-accent" />
                {{ store.locale('ui.details.pickup_note') }}
            </div>

            <div class="section-label">{{ store.locale('ui.details.duration') }}</div>
            <div class="grid gap-2" :style="{ gridTemplateColumns: `repeat(${Math.min(catalog.durations.length, 5)}, minmax(0, 1fr))` }">
                <button
                    v-for="duration in catalog.durations"
                    :key="duration.hours"
                    class="choice press relative flex cursor-pointer flex-col items-center rounded-lg pt-3 pb-2.5"
                    :class="{ 'is-active': store.hours === duration.hours }"
                    @click="store.hours = duration.hours"
                >
                    <span v-if="duration.discount" class="choice-badge absolute -top-2.5 rounded-full px-1.5 text-[11px] leading-[18px] font-semibold tabular-nums">
                        -{{ duration.discount }}%
                    </span>
                    <span class="text-xl leading-none font-bold tabular-nums">{{ duration.hours }}</span>
                    <span class="mt-1 text-[11px] tracking-wider uppercase opacity-70">{{ store.locale('ui.hour_short') }}</span>
                </button>
            </div>

            <div class="section-label">{{ store.locale('ui.details.payment') }}</div>
            <div class="grid grid-cols-2 gap-2">
                <button
                    v-for="account in catalog.accounts"
                    :key="account"
                    class="choice press flex cursor-pointer items-center gap-3 rounded-lg px-3.5 py-3 text-left"
                    :class="{ 'is-active': store.payment === account }"
                    @click="store.payment = account"
                >
                    <AppIcon :name="account === 'bank' ? 'bank' : 'cash'" class="size-5 shrink-0" :class="store.payment === account ? '' : 'text-faint'" />
                    <span class="min-w-0 flex-1">
                        <span class="block text-[15px] leading-tight font-semibold">{{ store.locale(`ui.${account}`) }}</span>
                        <span class="mt-0.5 block truncate text-xs opacity-70 tabular-nums">{{ store.money(store.balance(account)) }}</span>
                    </span>
                </button>
            </div>

            <div class="section-label">{{ store.locale('ui.details.summary') }}</div>
            <div class="flex flex-col gap-2.5 card rounded-lg p-4 text-[15px]">
                <div class="flex justify-between text-muted">
                    <span>{{ store.locale('ui.details.base') }} <span class="text-faint">({{ store.locale('ui.hours', store.hours) }})</span></span>
                    <span class="tabular-nums">{{ store.money(quote.base) }}</span>
                </div>
                <div v-if="quote.discount" class="flex justify-between text-success">
                    <span>{{ store.locale('ui.details.discount') }} ({{ store.duration.discount }}%)</span>
                    <span class="tabular-nums">-{{ store.money(quote.discount) }}</span>
                </div>
                <div v-if="quote.fee" class="flex justify-between text-muted">
                    <span>{{ store.locale('ui.details.service_fee') }}</span>
                    <span class="tabular-nums">{{ store.money(quote.fee) }}</span>
                </div>
                <div class="flex justify-between text-muted">
                    <span class="flex items-center gap-1.5"><AppIcon name="shield" class="size-4" />{{ store.locale('ui.deposit') }}</span>
                    <span class="tabular-nums">{{ store.money(quote.deposit) }}</span>
                </div>
                <p class="text-xs leading-snug text-faint">{{ store.locale('ui.details.deposit_note') }}</p>
            </div>
        </div>

        <footer class="shrink-0 border-t border-divider bg-bg px-6 pt-3.5 pb-[30px]">
            <div v-if="hint" class="mb-3 flex items-center gap-2 text-sm text-danger">
                <AppIcon name="alert" class="size-4 shrink-0" />
                {{ store.locale(`ui.errors.${hint}`) }}
            </div>
            <div class="flex items-center gap-3">
                <div class="min-w-0">
                    <div class="text-xs font-medium tracking-wider text-faint uppercase">{{ store.locale('ui.details.total') }}</div>
                    <div class="truncate text-[26px] leading-tight font-bold tabular-nums">{{ store.money(quote.total) }}</div>
                </div>
                <button
                    class="press ml-auto flex h-[52px] shrink-0 cursor-pointer items-center gap-2 btn-primary rounded-md px-7 text-base font-semibold disabled:cursor-default disabled:opacity-40"
                    :disabled="!!store.blockedReason || store.busy"
                    @click="store.confirmRent()"
                >
                    <AppIcon name="key" class="size-5" />
                    {{ store.locale('ui.details.rent') }}
                </button>
            </div>
        </footer>
    </div>
</template>
