<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import { closeDialog, dialog, type DialogButton } from '../utils/phone';

const props = withDefaults(defineProps<{ cancel?: string; confirm?: string }>(), { cancel: 'Cancel', confirm: 'OK' });

const input = ref<HTMLInputElement>();

watch(() => dialog.kind, async (kind) => {
    if (kind !== 'input') return;
    await nextTick();
    input.value?.focus();
});

const tone = (button: DialogButton) => [
    button.color === 'red' ? 'text-danger' : 'text-accent',
    button.bold ? 'font-semibold' : 'font-normal',
    button.disabled ? 'opacity-40' : 'cursor-pointer',
];

const confirmInput = () => closeDialog({ title: dialog.input.confirm ?? props.confirm });
</script>

<template>
    <Transition name="phone-dialog">
        <div v-if="dialog.kind" class="absolute inset-0 z-[3000] flex bg-black/45" :class="dialog.kind === 'menu' ? 'items-end' : 'items-center justify-center px-9'" @click.self="closeDialog()">
            <div v-if="dialog.kind === 'menu'" class="phone-dialog-sheet w-full space-y-2 px-3 pb-8">
                <div class="overflow-hidden rounded-2xl bg-surface text-text">
                    <div v-if="dialog.title" class="border-b border-line px-4 py-3 text-center text-[13px] text-muted">{{ dialog.title }}</div>
                    <button
                        v-for="(button, index) in dialog.buttons"
                        :key="index"
                        type="button"
                        class="block w-full border-line px-4 py-3.5 text-center text-[17px] transition-colors hover:bg-black/5"
                        :class="[tone(button), index ? 'border-t' : '']"
                        :disabled="button.disabled"
                        @click="closeDialog(button)"
                    >
                        {{ button.title }}
                    </button>
                </div>
                <button type="button" class="block w-full cursor-pointer rounded-2xl bg-surface px-4 py-3.5 text-center text-[17px] font-semibold text-accent" @click="closeDialog()">
                    {{ props.cancel }}
                </button>
            </div>

            <div v-else class="phone-dialog-card w-full overflow-hidden rounded-[18px] bg-surface text-center text-text shadow-2xl">
                <div class="px-5 pt-5 pb-4">
                    <div class="text-[17px] font-semibold">{{ dialog.title }}</div>
                    <p v-if="dialog.description" class="mt-1 text-[14px] leading-snug whitespace-pre-line text-muted">{{ dialog.description }}</p>
                    <img v-if="dialog.image" :src="dialog.image" alt="" class="mx-auto mt-3 max-h-40 rounded-lg object-contain" />
                    <input
                        v-if="dialog.kind === 'input'"
                        ref="input"
                        v-model="dialog.input.value"
                        type="text"
                        class="mt-3 w-full rounded-lg border border-line bg-bg px-3 py-2 text-left text-[14px] text-text outline-none focus:border-accent"
                        :placeholder="dialog.input.placeholder"
                        @keydown.enter.prevent="confirmInput"
                        @keydown.esc.prevent="closeDialog()"
                    />
                </div>

                <div v-if="dialog.kind === 'input'" class="grid grid-cols-2 border-t border-line">
                    <button type="button" class="cursor-pointer py-3 text-[17px] text-accent" @click="closeDialog()">{{ dialog.input.cancel ?? props.cancel }}</button>
                    <button type="button" class="cursor-pointer border-l border-line py-3 text-[17px] font-semibold text-accent" @click="confirmInput">
                        {{ dialog.input.confirm ?? props.confirm }}
                    </button>
                </div>

                <div v-else class="grid border-t border-line" :class="dialog.buttons.length === 2 ? 'grid-cols-2' : 'grid-cols-1'">
                    <button
                        v-for="(button, index) in dialog.buttons"
                        :key="index"
                        type="button"
                        class="border-line py-3 text-[17px]"
                        :class="[tone(button), index ? (dialog.buttons.length === 2 ? 'border-l' : 'border-t') : '']"
                        :disabled="button.disabled"
                        @click="closeDialog(button)"
                    >
                        {{ button.title }}
                    </button>
                    <button v-if="!dialog.buttons.length" type="button" class="cursor-pointer py-3 text-[17px] font-semibold text-accent" @click="closeDialog()">{{ props.confirm }}</button>
                </div>
            </div>
        </div>
    </Transition>
</template>

<style scoped>
.phone-dialog-enter-active,
.phone-dialog-leave-active {
    transition: opacity 0.18s ease;
}
.phone-dialog-enter-active .phone-dialog-card,
.phone-dialog-leave-active .phone-dialog-card {
    transition: transform 0.18s ease;
}
.phone-dialog-enter-active .phone-dialog-sheet,
.phone-dialog-leave-active .phone-dialog-sheet {
    transition: transform 0.22s ease;
}
.phone-dialog-enter-from,
.phone-dialog-leave-to {
    opacity: 0;
}
.phone-dialog-enter-from .phone-dialog-card,
.phone-dialog-leave-to .phone-dialog-card {
    transform: scale(1.08);
}
.phone-dialog-enter-from .phone-dialog-sheet,
.phone-dialog-leave-to .phone-dialog-sheet {
    transform: translateY(100%);
}
</style>
