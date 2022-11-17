<template>
    <div id="videoWrapper" @click.stop>
        <video ref="videoRef"
               :data-video-id="videoID"
               :data-account="accountCode"
               :data-player="playerCode"
               :data-setup="setupPlayer"
               data-application-id
               data-embed="default"
               class="video-js"
               id="video"
               controls>
        </video>
    </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, watch, ref, computed } from 'vue';
export default defineComponent({
    name: "brightcove-video",
    props: {
        accountCode: {
            type: String,
            default: ""
        },
        playerCode: {
            type: String,
            default: ""
        },
        videoID: {
            type: String,
            default: ""
        },
        time: {
            type: Number,
            default: 0
        },
        currentSlideIndex: {
            type: Number,
            default: 0
        },
        showBrightcovePlayer: {
            type: Boolean,
            default: true
        },
        slideTime: {
            type: Number,
            default: 0
        }
    },
    emits: ['ended', 'timeupdate', 'canplay', 'ready'],
    setup(props, { emit }) {
        let startPlaying = false;
        let brightcovePlayer = null;
        let changedCurrentSlideIndex = false;
        const videoRef = ref(null);

        const setupPlayer = computed(() => props.showBrightcovePlayer ? "" : '{"ga": {"eventsToTrack": "none"}}')


        const play = () => {
            setTimeout(() => brightcovePlayer.play().then(() => setTimeout(() => {
                    setCurrentTime();
                }))
            );
        }

        const setCurrentTime = () => {
            if (Math.abs(props.time - brightcovePlayer.currentTime()) > 3) {
                brightcovePlayer.currentTime(props.time);
            }
        }

        const updatePlayerTime = (currentTime) => {
            if (Math.floor(brightcovePlayer.currentTime()) !== currentTime) {
                brightcovePlayer.currentTime(currentTime);
            }
        }

        const setPlaybackRate = (value) => {
            brightcovePlayer.playbackRate(value);
        }

        const setVolumeRate = (value) => {
            brightcovePlayer.volume(value);
        }

        watch(() => props.slideTime, (newValue) => {
            updatePlayerTime(newValue);
        })
        
        watch(() => props.videoID, (value) => {
            brightcovePlayer.autoplay(true); // workaround for play video on iOS mobile
            brightcovePlayer.catalog.getVideo(value, (error, video) => {
                brightcovePlayer.catalog.load(video);
                play();
                !!window.MSInputMethodContext && !!document.documentMode && videoRef.value.addEventListener("canplay", () => play(), {once: true});  // workaround for IE11
            });
        })

        watch(() => props.time, () => {
            setCurrentTime();
        })

        watch(() => props.currentSlideIndex, () => {
             // workaround for iOS mobile + IE11
             changedCurrentSlideIndex = true;
            setTimeout(() => changedCurrentSlideIndex = false, 1000);
        })

        onMounted(() => {
            const script = document.createElement("script");
            script.onload = () => {
                brightcovePlayer = window.bc("video");
                brightcovePlayer.controls(false);
                updatePlayerTime(props.time); // fix for IE (share slide)
                brightcovePlayer.on('ended', () => emit("ended"));
                brightcovePlayer.on('playing', () => {
                    // workaround for iOS
                    startPlaying && play();
                    startPlaying = true;
                });
                brightcovePlayer.on('timeupdate', () => {
                    if (!changedCurrentSlideIndex) emit("timeupdate", Math.round(brightcovePlayer.currentTime()));
                });
                brightcovePlayer.on('canplay', () => emit("canplay", Math.floor(brightcovePlayer.duration())));
                brightcovePlayer.on('ready', () => emit("ready"));

                brightcovePlayer.on('ready', () => window.bcPlayer = brightcovePlayer);
            };
            script.setAttribute("src", `https://players.brightcove.net/${props.accountCode}/${props.playerCode}_default/index.min.js`);
            document.head.appendChild(script);

            
        })

        return {
            play,
            setCurrentTime,
            updatePlayerTime,
            setPlaybackRate,
            setVolumeRate,
            videoRef,
            setupPlayer,
        }
    },
})
</script>

<style scoped>
    #video {
        width: 100%;
        height: 100%;
    }
</style>
