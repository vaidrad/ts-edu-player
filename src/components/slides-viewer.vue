<template>
    <div class="slides-viewer">
        <img :src="source" alt="">
        <div id="fullScreenViewer" ref="fullScreenViewer" :class="{'portrait': portraitMode}" v-show="enableFullScreen">
            <img :src="source" ref="fullScreenImage" alt="">
            <button id="exitBtn" v-show="enableFullScreen" @click="exitFullScreen"></button>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue';
export default defineComponent({
    name: "slides-viewer",
    props: {
        source: {
            type: String,
            default: ""
        }
    },
    setup() {
        const enableFullScreen = ref(false);
        const portraitMode = ref(false);

        const fullScreenViewer = ref(null);
        const fullScreenImage = ref(null);

        const enterFullScreen = () => {
            portraitMode.value = (fullScreenImage.width / fullScreenImage.height < 1.7);
            enableFullScreen.value = true;
        }

        const exitFullScreen = () => {
            enableFullScreen.value = false;
        }
        
        onMounted(() => {
            document.body.appendChild(fullScreenViewer.value); // AEM workaround for layer mapping
        })



        return {
            enterFullScreen,
            exitFullScreen,
            enableFullScreen,
            portraitMode,
            fullScreenViewer,
            fullScreenImage
        }
    }
});
</script>

<style scoped>
.slides-viewer {
    position: relative;
}

.slides-viewer img,
#fullScreenViewer img {
    max-width: 100%;
    height: auto !important; /* AEM fix */
    max-height: 100%;
    object-fit: contain;
}

#fullScreenViewer img {
    height: 100% !important;
}

#fullScreenViewer.portrait img {
    width: auto;
    height: 100% !important; /* AEM fix */
}

#fullScreenViewer {
    position: fixed;
    z-index: 10000;
    top: 0;
    left: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    width: 100vw !important;
    height: 100vh !important;
    background-color: #000000;
}

#exitBtn {
    position: absolute;
    top: 2%;
    right: 2%;
    width: 36px;
    height: 36px;
    outline: 0;
    border: 0;
    border-radius: 50%;
    background-color: #2573ba;
    cursor: pointer;
}

#exitBtn::before,
#exitBtn::after {
    content: '';
    position: absolute;
    top: 16px;
    left: 8px;
    width: 20px;
    height: 4px;
    background-color: #ffffff;
}

#exitBtn::before {
    transform: rotate(45deg);
}

#exitBtn::after {
    transform: rotate(-45deg);
}

@media (max-width: 767px) {
    #slidesViewer {
        justify-content: center;
    }

    .slides-viewer img {
        justify-content: center;
        height: 285px !important;
        max-height: 285px;
    }
}

@media (orientation: portrait) {
    #fullScreenViewer img,
    #fullScreenViewer.portrait img {
        width: 100%;
        height: auto !important; /* AEM fix */
    }
}

</style>
