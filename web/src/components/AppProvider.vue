<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { devMode } from '../utils';

// lb-phone app screen is ~464x936 px (29rem x 58.5rem in the template). In game the iframe has this size;
// in the browser a frame of the same size is drawn and scaled to fit the screen.
const WIDTH = 464;
const HEIGHT = 936;

const scale = ref(1);
const handleResize = () => {
    scale.value = Math.min((window.innerHeight * 0.94) / HEIGHT, (window.innerWidth * 0.94) / WIDTH);
};

onMounted(() => {
    if (!devMode) return;
    handleResize();
    window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => window.removeEventListener('resize', handleResize));
</script>

<template>
    <div v-if="devMode" class="flex h-screen w-screen items-center justify-center">
        <div
            class="relative shrink-0 rounded-[60px] bg-black shadow-[0_0_0_4px_#050506,0_0_0_7px_hsl(254,30%,85%)]"
            :style="{ width: `${WIDTH}px`, height: `${HEIGHT}px`, transform: `scale(${scale})` }"
        >
            <div class="pointer-events-none absolute top-0 z-10 w-full px-14 py-5 text-base font-medium text-text">09:41</div>
            <div class="absolute top-3 left-1/2 z-10 h-9 w-[30%] -translate-x-1/2 rounded-[25px] bg-black" />
            <div class="absolute inset-x-0 bottom-2 z-10 mx-auto h-[5px] w-36 rounded bg-text/80" />
            <div class="h-full w-full overflow-hidden rounded-[60px]">
                <slot />
            </div>
        </div>
    </div>
    <slot v-else />
</template>
