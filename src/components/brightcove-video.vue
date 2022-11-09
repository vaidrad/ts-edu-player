<template>
    <div id="videoWrapper" @click.stop>
        <video ref="video"
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

<script>
    export default {
        name: "brightcove-video",
        data: function () {
            return {
                startPlaying: false,
                brightcovePlayer: null,
                changedCurrentSlideIndex: false,
            }
        },
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
            }
        },
        watch: {
            videoID(newValue) {
                this.brightcovePlayer.autoplay(true); // workaround for play video on iOS mobile
                this.brightcovePlayer.catalog.getVideo(newValue, (error, video) => {
                    this.brightcovePlayer.catalog.load(video);
                    this.play();
                    !!window.MSInputMethodContext && !!document.documentMode && this.$refs.video.addEventListener("canplay", () => this.play(), {once: true});  // workaround for IE11
                });
            },
            time() {
               this.setCurrentTime();
            },
            currentSlideIndex() {
                // workaround for iOS mobile + IE11
                this.changedCurrentSlideIndex = true;
                setTimeout(() => this.changedCurrentSlideIndex = false, 1000);
            }
        },
        methods: {
            play() {
                // workaround for iOS mobile + IE11
                setTimeout(() => this.brightcovePlayer.play().then(() => setTimeout(() => {
                        this.setCurrentTime();
                    }))
                );
            },
            setCurrentTime(){
                if (Math.abs(this.time - this.brightcovePlayer.currentTime()) > 3) {
                    this.brightcovePlayer.currentTime(this.time);
                }
            },
            updatePlayerTime(currentTime) {
                if (Math.floor(this.brightcovePlayer.currentTime()) !== currentTime) {
                    this.brightcovePlayer.currentTime(currentTime);
                    //setTimeout(this.updatePlayerTime, 100, currentTime);
                }
            },
            setPlaybackRate(value){
                this.brightcovePlayer.playbackRate(value);
            },
            setVolumeRate(value) {
                this.brightcovePlayer.volume(value);
            }
        },
        computed: {
            setupPlayer() {
                return this.showBrightcovePlayer ? "" : '{"ga": {"eventsToTrack": "none"}}';
            }
        },
        created() {
            const script = document.createElement("script");
            script.onload = () => {
                this.brightcovePlayer = window.bc("video");
                this.brightcovePlayer.controls(false);
                this.updatePlayerTime(this.time); // fix for IE (share slide)
                this.brightcovePlayer.on('ended', () => this.$emit("ended"));
                this.brightcovePlayer.on('playing', () => {
                    // workaround for iOS
                    !this.startPlaying && this.play();
                    this.startPlaying = true;
                });
                this.brightcovePlayer.on('timeupdate', () => {
                    if (!this.changedCurrentSlideIndex) this.$emit("timeupdate", Math.round(this.brightcovePlayer.currentTime()));
                });
                this.brightcovePlayer.on('canplay', () => this.$emit("canplay", Math.floor(this.brightcovePlayer.duration())));
                this.brightcovePlayer.on('ready', () => this.$emit("ready"));

                this.brightcovePlayer.on('ready', () => window.bcPlayer = this.brightcovePlayer);
            };
            script.setAttribute("src", `https://players.brightcove.net/${this.accountCode}/${this.playerCode}_default/index.min.js`);
            document.head.appendChild(script);
        }
    }
</script>

<style scoped>
    #video {
        width: 100%;
        height: 100%;
    }
</style>
