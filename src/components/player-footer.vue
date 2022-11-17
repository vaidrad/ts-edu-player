<template>
  <div class="player-footer" ref="playerFooter">
      <div id="controlBtnWrapper1">
        <button class="control-btn" id="play" title="Play/Pause"
                :class="{'playing':isPlaying}"
                @click="play"></button>
        <button class="control-btn" id="goToPrev" title="Previous slide"
                :class="{'disabled':isGoToPrevDisabled}" v-if="!onlyPlayer"
                @click.stop="goToSlide({currentSlideIndex: currentSlideIndex - 1})"></button>
        <button class="control-btn" id="goToNext" title="Next slide"
                :class="{'disabled':isGoToNextDisabled}" v-if="!onlyPlayer"
                @click.stop="goToSlide({currentSlideIndex: currentSlideIndex + 1})"></button>
        <button class="control-btn" id="rewindBack" title="Move back"
                :class="{'disabled':!isVideoReady}"
                @click="rewindVideo(0)"></button>
        <button class="control-btn" id="rewindForward" title="Move forward"
                :class="{'disabled':!isVideoReady}"
                @click="rewindVideo(1)"></button>
        <p class="current-time">{{ currentTime || "00:00" }}</p>
      </div>
      <div id="progressBar">
        <input ref="progressBar" type="range" name="progressBarRange" id="progressLine" min="0" v-bind:max="videoDuration" value="0" step="1" v-model="currentVideoTimeInSecs" @mouseup="handleProgressLineClick" @input="handleProgressLineInput">
        <div class="progresLineContainer">
          <div id="progressLineWatched" :style="{ width: progressLineWatched + 'px' }"></div>
          <div id="progressLineBuffered" :style="{ width: progressLineBuffered, left: progressLineWatched + 'px' }"></div>
          <div class="chapterTimeStamp" :style="{ left: timeStamp }" v-for="timeStamp in timeStampPostions" :key="timeStamp"></div>
        </div>
      </div>
      <div id="controlBtnWrapper2">
        <p class="remaing-time">-{{ remainingTime }}</p>
        <div id="playbackRateWrapper" @click.stop>
          <button class="control-btn" id="playbackRate" title="playback rate" @click="togglePlaybackRateShow" @mouseenter="openPlaybackRate">{{ playbackRate }}x</button>
          <div id="playbackRateValues" v-show="isPlaybackRateShow" @mouseleave="closePlaybackRate">
            <button v-for="value in playbackRateValues" :key="value" 
                @click="setPlaybackRate(value)" 
                :class="{'active':value == playbackRate}">
                {{ value == 1 ? 'Normal' : value }}
            </button>
          </div>
        </div>
        <div id="volumeRateWrapper" @click.stop>
          <button class="control-btn" id="volumeRateButton" title="volume rate" @mouseenter="openVolumeRateShow" @click="handleClickVolumeRate"></button>
          <div id="volumeRateValues" v-show="isVolumeRateShow" @mouseleave="closeVolumeRateShow">
            <div class="volume-bg"></div>
            <input type="range" name="volumeRate" id="volumeRate" min="0" max="100" value="100" step="1" v-model="volumeRate">
            <div id="valueLine" :style="{ width: volumeRangeWidth }"></div>
            <div class="volume-bg"></div>
          </div>
        </div>
        <button class="control-btn" id="shareBtn" title="Share slide" @click="share"></button>
        <button class="control-btn" id="toggleModeBtn" title="Change slide layout"
                @click="toggleVideoPosition" :class="{'active':isVideoBig, 'disabled':isSwitchDisabled}"></button>
        <button class="control-btn" id="fullScreenVideoBtn" v-show="showBrightcovePlayer" title="Video Full Screen"
                @click="enterFullScreenVideo"></button>
      </div>
    </div>
</template>

<script lang="ts">
import {copyStringToBuffer} from "../utils";
import { computed, defineComponent, ref, watch, getCurrentInstance, onMounted } from 'vue';
import store from '../store/store.ts';
// import type { Ref } from 'vue';
 
export default defineComponent({
  name: 'player-footer',
  props: {
    isVideoReady: {
      type: Boolean,
      default: false
    },
    isPlaying: {
      type: Boolean,
      default: false
    },
    isGoToPrevDisabled: {
      type: Boolean,
      default: false
    },
    isGoToNextDisabled: {
      type: Boolean,
      default: true
    },
    onlyPlayer: {
      type: Boolean,
      default: false
    },
    videoDuration: {
      type: Number,
      default: 0
    },
    isVideoBig: {
      type: Boolean,
      default: false
    },
    showBrightcovePlayer: {
      type: Boolean,
      default: true
    },
    currentSlideIndex: {
      type: Number,
      default: 0
    },
    currentVideoTime: {
      type: Number,
      default: 0
    },
  },
  emits: ['changevolumerate', 'play', 'changeActiveItem', 'rewindVideo', 'progresslineclick', 'setplaybackrate', 'toggleVideoPosition', 'enterFullScreenVideo', 'share'],
  setup(props, { emit }) {
    const currentVideoTimeInSecs = ref(0);
    const progressLineWatched = ref(0);
    const progressLineBuffered = ref('0');
    const timeStampPostions = ref([]);
    const playbackRate = ref(1);
    const isPlaybackRateShow = ref(false);
    const playbackRateValues = ref([0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]);
    const isVolumeRateShow = ref(false);
    const volumeRate = ref(100);
    const volumeRangeWidth = ref('8rem');
    let isRewinded = false;
    const isSwitchDisabled = computed(() => store.getters.getIsSwitchDisabled)

    //Ref<null> | Ref<HTMLElement>
    const progressBar = ref(null);
    const playerFooter = ref(null);
    const instance = getCurrentInstance();

    const currentTime = computed(() => {
      if(props.isVideoReady) {
        if(props.currentVideoTime < 600) {
          return new Date(props.currentVideoTime*1000).toUTCString().split(/ /)[4].slice(4, 8);
        } else if(props.currentVideoTime < 3600) {
          return new Date(props.currentVideoTime*1000).toUTCString().split(/ /)[4].slice(3, 8);
        } else{
          return new Date(props.currentVideoTime*1000).toUTCString().split(/ /)[4];
        }
      }
      return '0:00';
    });

    const remainingTime = computed(() => {
      if(props.isVideoReady) {
        let time = props.videoDuration - props.currentVideoTime;
        if(time < 600) {
          if(props.currentVideoTime > props.videoDuration){
            return '0:00';
          }
          return new Date(time*1000).toUTCString().split(/ /)[4].slice(4, 8);
        } else if(time < 3600) {
          return new Date(time*1000).toUTCString().split(/ /)[4].slice(3, 8);
        } else{
          return new Date(time*1000).toUTCString().split(/ /)[4];
        }
      }
      return '00:00';
    });

    watch(() => volumeRate.value, (value) => {
      emit('changevolumerate', value)
      handleVolumeChange();
    });

    const initBufferingWatcher = () => {
      setInterval(() => {
        // to fix
        let buffered = instance.parent.$refs.brightcoveVideo.brightcovePlayer.bufferedPercent() * 100;
        let timeleft = (1 - props.currentVideoTime / props.videoDuration) * 100;
        progressLineBuffered.value = timeleft > buffered ? buffered + "%" : timeleft + "%";
      }, 600);
      setInterval(() => {
        changeProgressBarLine();
      }, 50);
    };

    const changeProgressBarLine = () => {
      if(progressBar.value){
        progressLineWatched.value = progressBar.value.value / props.videoDuration * progressBar.value.getBoundingClientRect().width;
      }
    };

    const play = () => {
      emit('play');
    };

    const goToSlide = (subSlideIndex) => {
      isVolumeRateShow.value = false;
      isPlaybackRateShow.value = false;
      emit("changeActiveItem", subSlideIndex);
    }

    const rewindVideo = (direction) => {
      emit('rewindVideo', direction);
    }

    const handleProgressLineClick = () => {
      if(currentVideoTimeInSecs.value != props.currentVideoTime) {
        emit('progresslineclick', Number(currentVideoTimeInSecs.value));
      }
    }

    const handleProgressLineInput = () => {
      changeProgressBarLine()
      if(!isRewinded && (currentVideoTimeInSecs.value - props.currentVideoTime > 3 || currentVideoTimeInSecs.value - props.currentVideoTime < 3) ){
        isRewinded = true;
        setTimeout(() => {
          emit('progresslineclick', Number(currentVideoTimeInSecs.value));
          isRewinded = false;
        }, 100);
      }
    }

    const togglePlaybackRateShow = () => {
      isPlaybackRateShow.value = !isPlaybackRateShow.value;
      isVolumeRateShow.value = false;
    }

    const openPlaybackRate = () => {
      isPlaybackRateShow.value = true;
      isVolumeRateShow.value = false;
    }

    const closePlaybackRate = () => {
      isPlaybackRateShow.value = false;
    }

    const setPlaybackRate = (value) => {
      playbackRate.value = value;
      emit('setplaybackrate', value);
    }

    const openVolumeRateShow = () => {
      isPlaybackRateShow.value = false
      isVolumeRateShow.value = true;
    }

    const handleClickVolumeRate = () => {
      volumeRate.value === 0 ? volumeRate.value = 100 : volumeRate.value = 0;
    }

    const closeVolumeRateShow = () => {
      isVolumeRateShow.value = false;
    }

    const toggleVideoPosition = () => {
      emit('toggleVideoPosition');
    }

    const enterFullScreenVideo = () => {
      emit('enterFullScreenVideo');
    }

    const share = () => {
      let url;
      const param = `currentSlideIndex=${props.currentSlideIndex + 1}`;
      if (location.href.includes("currentSlideIndex")) {
        const regex = new RegExp("currentSlideIndex" + '=([^&#]*)');
        url = location.href.replace(regex, param);
      } else {
        url = `${location.href}?${param}`;
      }

      copyStringToBuffer(url, playerFooter.value);

      emit('share');
    }

    const handleVolumeChange = () => {
      volumeRangeWidth.value = volumeRate.value != 0 ? volumeRate.value * 0.08 + 0.8 / (volumeRate.value + 0.0001) + 'rem' : '0rem';
    }

    const calculateTimeStamps = (slides, videoDuration) => {
      if(!props.onlyPlayer){
        timeStampPostions.value = slides.map(slide => slide.time / videoDuration * 100 + '%');
        timeStampPostions.value.shift();
      }
    }

    //todo, проблема в том, что вызывается раньше, чем заполняется videoDuration
    onMounted(() => {
      calculateTimeStamps(store.getters.getSlides, store.getters.getVideoDuration)
    })

    const checkCurrentVideoTime = computed(() => store.getters.getCurrentVideoTime)

    watch(checkCurrentVideoTime, (newValue) => {
      currentVideoTimeInSecs.value = newValue
    });

    return {
      isSwitchDisabled,
      currentVideoTimeInSecs,
      progressLineWatched,
      progressLineBuffered,
      timeStampPostions,
      playbackRate,
      isPlaybackRateShow,
      playbackRateValues,
      isVolumeRateShow,
      volumeRate,
      volumeRangeWidth,
      isRewinded,
      currentTime,
      remainingTime,
      progressBar,
      playerFooter,
      initBufferingWatcher,
      changeProgressBarLine,
      play,
      goToSlide,
      rewindVideo,
      handleProgressLineClick,
      handleProgressLineInput,
      togglePlaybackRateShow,
      openPlaybackRate,
      closePlaybackRate,
      setPlaybackRate,
      openVolumeRateShow,
      handleClickVolumeRate,
      closeVolumeRateShow,
      toggleVideoPosition,
      enterFullScreenVideo,
      share,
      handleVolumeChange,
      calculateTimeStamps,
    }
  },
})
</script>

<style scoped>
#controlBtnWrapper1 {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 300px;
    min-width: 250px;
}

.only-player #controlBtnWrapper1 {
    min-width: 175px;
}

#controlBtnWrapper2 {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-width: max-content;
}

.control-btn {
    min-width: 23px;
    height: 23px;
    padding: 0;
    outline: none;
    border: none;
    cursor: pointer;

    backface-visibility: hidden;
}

.control-btn.disabled {
    opacity: 0.6;
    pointer-events: none;
}

#play {
    width: 48px;
    min-width: 48px;
    height: 48px;
    margin-left: -3px;
    border-radius: 50%;
    background: #ffffff url('data:image/svg+xml,%3Csvg width=\'22\' height=\'22\' viewBox=\'0 0 22 22\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M19.8673 9.71515C20.8352 10.2983 20.8352 11.7017 19.8673 12.2848L8.46156 19.1563C7.46182 19.7586 6.1875 19.0386 6.1875 17.8714L6.1875 4.12858C6.1875 2.96143 7.46182 2.24144 8.46156 2.84373L19.8673 9.71515Z\' fill=\'black\' /%3E%3C/svg%3E') no-repeat center/26px;
}

#play.playing {
    background: #ffffff url('data:image/svg+xml,%3Csvg width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath fill-rule=\'evenodd\' clip-rule=\'evenodd\' d=\'M6.5 3C5.67157 3 5 3.67157 5 4.5V19.5C5 20.3284 5.67157 21 6.5 21H8.5C9.32843 21 10 20.3284 10 19.5V4.5C10 3.67157 9.32843 3 8.5 3H6.5ZM15.5 3C14.6716 3 14 3.67157 14 4.5V19.5C14 20.3284 14.6716 21 15.5 21H17.5C18.3284 21 19 20.3284 19 19.5V4.5C19 3.67157 18.3284 3 17.5 3H15.5Z\' fill=\'black\'/%3E%3C/svg%3E%0A') no-repeat center/26px;
}

#goToPrev {
    margin-left: 10px;
    background: transparent url('data:image/svg+xml,%3Csvg width=\'24\' height=\'20\' viewBox=\'0 0 24 20\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath fill-rule=\'evenodd\' clip-rule=\'evenodd\' d=\'M23.25 1.629V18.371C23.25 18.6495 23.0957 18.9052 22.8491 19.0348C22.6026 19.1645 22.3045 19.1468 22.075 18.989L9.9 10.618C9.69608 10.4784 9.57417 10.2471 9.57417 10C9.57417 9.75286 9.69608 9.52163 9.9 9.382L22.075 1.011C22.3045 0.853155 22.6026 0.835509 22.8491 0.965174C23.0957 1.09484 23.25 1.35045 23.25 1.629Z\' fill=\'white\'/%3E%3Cpath fill-rule=\'evenodd\' clip-rule=\'evenodd\' d=\'M0.75 1.75C0.75 0.921573 1.42157 0.25 2.25 0.25H3.75C4.57843 0.25 5.25 0.921573 5.25 1.75V18.25C5.25 19.0784 4.57843 19.75 3.75 19.75H2.25C1.42157 19.75 0.75 19.0784 0.75 18.25V1.75Z\' fill=\'white\'/%3E%3C/svg%3E%0A') no-repeat center/contain;
}

#goToNext {
    margin-left: 15px;
    background: transparent url('data:image/svg+xml,%3Csvg width=\'24\' height=\'20\' viewBox=\'0 0 24 20\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath fill-rule=\'evenodd\' clip-rule=\'evenodd\' d=\'M0.75 1.629V18.371C0.749985 18.6495 0.904347 18.9052 1.15088 19.0348C1.39741 19.1645 1.69549 19.1468 1.925 18.989L14.1 10.618C14.3039 10.4784 14.4258 10.2471 14.4258 10C14.4258 9.75286 14.3039 9.52163 14.1 9.382L1.925 1.011C1.69549 0.853155 1.39741 0.835509 1.15088 0.965174C0.904347 1.09484 0.749985 1.35045 0.75 1.629Z\' fill=\'white\'/%3E%3Cpath fill-rule=\'evenodd\' clip-rule=\'evenodd\' d=\'M18.75 1.75C18.75 0.921573 19.4216 0.25 20.25 0.25H21.75C22.5784 0.25 23.25 0.921573 23.25 1.75V18.25C23.25 19.0784 22.5784 19.75 21.75 19.75H20.25C19.4216 19.75 18.75 19.0784 18.75 18.25V1.75Z\' fill=\'white\'/%3E%3C/svg%3E%0A') no-repeat center/contain;
}

#rewindBack {
    width: 24px;
    height: 28px;
    margin-left: 15px;
    background: transparent url('data:image/svg+xml,%3Csvg width=\'26\' height=\'30\' viewBox=\'0 0 26 30\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M14 9L10 5M10 5L14 1M10 5H13C16.1826 5 19.2349 6.26428 21.4853 8.51472C23.7357 10.7652 25 13.8174 25 17C25 20.1826 23.7357 23.2348 21.4853 25.4853C19.2349 27.7357 16.1826 29 13 29C12.6667 29 12.3293 28.9853 12 28.9587M1.04134 16C1.01467 16.3293 1.00001 16.6667 1.00001 17C0.998843 18.012 1.12608 19.02 1.37867 20M3.80801 9.28667C3.15644 10.061 2.60582 10.915 2.16934 11.828M3.83734 24.7493C4.05067 25.0018 4.27645 25.2471 4.51467 25.4853C5.22959 26.2016 6.03243 26.8244 6.90401 27.3387M14 20.3333H16.3333C16.5522 20.3333 16.7689 20.2902 16.9712 20.2065C17.1734 20.1227 17.3571 19.9999 17.5119 19.8452C17.6666 19.6904 17.7894 19.5067 17.8731 19.3045C17.9569 19.1023 18 18.8855 18 18.6667C18 15.704 14 18.296 14 15.3333V13.6667H18M9.66668 20.3289V14.3324C9.66635 14.2088 9.63168 14.0876 9.56652 13.9825C9.50136 13.8774 9.40828 13.7925 9.29767 13.7371C9.18705 13.6818 9.06325 13.6583 8.94006 13.6693C8.81688 13.6802 8.69915 13.7252 8.60002 13.7991L7.00002 14.9991M8.33335 20.3289H11\' stroke=\'white\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E%0A') no-repeat center/24px;
}

#rewindForward {
    width: 24px;
    height: 28px;
    margin-left: 10px;
    background: transparent url('data:image/svg+xml,%3Csvg width=\'26\' height=\'30\' viewBox=\'0 0 26 30\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M12 9L16 5M16 5L12 1M16 5H13C9.8174 5 6.76516 6.26428 4.51472 8.51472C2.26428 10.7652 1 13.8174 1 17C1 20.1826 2.26428 23.2348 4.51472 25.4853C6.76516 27.7357 9.8174 29 13 29C13.3333 29 13.6707 28.9853 14 28.9587M24.9587 16C24.9853 16.3293 25 16.6667 25 17C25.0012 18.012 24.8739 19.02 24.6213 20M22.192 9.28667C22.8436 10.061 23.3942 10.915 23.8307 11.828M22.1627 24.7493C21.9493 25.0018 21.7236 25.2471 21.4853 25.4853C20.7704 26.2016 19.9676 26.8244 19.096 27.3387M14.6667 20.3333H17C17.2189 20.3333 17.4356 20.2902 17.6378 20.2065C17.84 20.1227 18.0237 19.9999 18.1785 19.8452C18.3333 19.6904 18.456 19.5067 18.5398 19.3045C18.6236 19.1023 18.6667 18.8855 18.6667 18.6667C18.6667 15.704 14.6667 18.296 14.6667 15.3333V13.6667H18.6667M10.3333 20.3289V14.3324C10.333 14.2088 10.2983 14.0876 10.2332 13.9825C10.168 13.8774 10.0749 13.7925 9.96432 13.7371C9.8537 13.6818 9.7299 13.6583 9.60671 13.6693C9.48353 13.6802 9.3658 13.7252 9.26667 13.7991L7.66667 14.9991M9 20.3289H11.6667\' stroke=\'white\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E%0A') no-repeat center/24px;
}

#goToNext,
#goToPrev {
    height: 19px;
}

.current-time,
.remaing-time {
    margin: 0 0 0 10px;
    color: #ffffff;
    font-size: 16px;
    line-height: 23px;
}

#playbackRate {
    min-width: 15px;
    background: transparent;
    color: #ffffff;
    font-size: 16px;
    line-height: 23px;
}

#playbackRateWrapper {
    position: relative;
    margin: 0 10px 0;
}

#playbackRateValues {
    position: absolute;
    top: -330px;
    left: -150%;
}

#playbackRateValues button {
    width: 100%;
    padding: 0.5rem 1rem;
    border: none;
    background-color: #122035;
    color: #ffffff;
    text-align: center;
    font-weight: 400;
    font-size: 0.875rem;
    cursor: pointer;
}

#playbackRateValues button:hover {
    background-color: #40536e;
}

#playbackRateValues button.active {
    color: #1f49e0;
}

#volumeRateWrapper {
    position: relative;
    height: 17px;
    margin: 0 10px 0 0;
}

#volumeRateValues {
    position: absolute;
    top: -70px;
    left: -155px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-sizing: content-box;
    width: 12.5rem;
    padding: 0.75rem 1rem;
    background-color: #1f252e;
}

#volumeRate {
    width: 8rem;
    background: transparent;
    cursor: pointer;

    -webkit-appearance: none;
    appearance: none;
}

#valueLine {
    position: absolute;
    left: 52px;
    max-width: 8rem;
    height: 0.5rem;
    border-radius: 5px;
    background: #0075fe;
    pointer-events: none;
}

#volumeRateValues input[type='range']::-moz-range-track {
    height: 0.5rem;
    border-radius: 10px;
    background: #ffffff;
}

#volumeRateValues input[type='range']::-webkit-slider-runnable-track {
    height: 0.5rem;
    border-radius: 10px;
    background: #ffffff;
}

#volumeRateValues input[type='range']::-webkit-slider-thumb {
    width: 1rem;
    height: 1rem;
    margin-top: -0.25rem;
    border-radius: 1rem;
    background-color: #0075fe;
    pointer-events: none;

    -webkit-appearance: none;
    appearance: none;
}

#volumeRateValues input[type='range']::-moz-range-thumb {
    width: 1rem;
    height: 1rem;
    border: none;
    border-radius: 1rem;
    background-color: #0075fe ;
    pointer-events: none;
}

#volumeRateValues input[type='range']:focus {
    outline: none;
}

.volume-bg {
    width: 20px;
    height: 20px;
    background: transparent url('data:image/svg+xml,%3Csvg width=\'24\' height=\'20\' viewBox=\'0 0 24 20\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M21.463 13.55C22.1402 12.4898 22.5 11.258 22.5 10C22.5 8.74199 22.1402 7.51022 21.463 6.45001M18.562 12.241C19.0669 11.619 19.3424 10.8422 19.3424 10.041C19.3424 9.23985 19.0669 8.46306 18.562 7.84101M6.571 7.00001H2.25C2.05109 7.00001 1.86032 7.07903 1.71967 7.21968C1.57902 7.36033 1.5 7.5511 1.5 7.75001V12.25C1.5 12.4489 1.57902 12.6397 1.71967 12.7803C1.86032 12.921 2.05109 13 2.25 13H6.571C7.12356 14.4148 8.05581 15.6498 9.26512 16.5688C10.4744 17.4879 11.9139 18.0555 13.425 18.209C13.5292 18.2193 13.6345 18.2077 13.734 18.175C13.8335 18.1422 13.925 18.089 14.0027 18.0187C14.0804 17.9484 14.1425 17.8627 14.1851 17.767C14.2277 17.6713 14.2498 17.5678 14.25 17.463V2.53701C14.25 2.43221 14.228 2.32859 14.1854 2.23281C14.1429 2.13704 14.0808 2.05124 14.003 1.98095C13.9253 1.91067 13.8337 1.85745 13.7341 1.82474C13.6346 1.79202 13.5293 1.78053 13.425 1.79101C11.9139 1.94457 10.4744 2.51212 9.26512 3.43118C8.05581 4.35024 7.12356 5.58517 6.571 7.00001Z\' stroke=\'white\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E%0A') no-repeat center/contain;
}

#volumeRateButton {
    width: 21px;
    height: 17px;
    background: transparent url('data:image/svg+xml,%3Csvg width=\'24\' height=\'20\' viewBox=\'0 0 24 20\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M21.463 13.55C22.1402 12.4898 22.5 11.258 22.5 10C22.5 8.74199 22.1402 7.51022 21.463 6.45001M18.562 12.241C19.0669 11.619 19.3424 10.8422 19.3424 10.041C19.3424 9.23985 19.0669 8.46306 18.562 7.84101M6.571 7.00001H2.25C2.05109 7.00001 1.86032 7.07903 1.71967 7.21968C1.57902 7.36033 1.5 7.5511 1.5 7.75001V12.25C1.5 12.4489 1.57902 12.6397 1.71967 12.7803C1.86032 12.921 2.05109 13 2.25 13H6.571C7.12356 14.4148 8.05581 15.6498 9.26512 16.5688C10.4744 17.4879 11.9139 18.0555 13.425 18.209C13.5292 18.2193 13.6345 18.2077 13.734 18.175C13.8335 18.1422 13.925 18.089 14.0027 18.0187C14.0804 17.9484 14.1425 17.8627 14.1851 17.767C14.2277 17.6713 14.2498 17.5678 14.25 17.463V2.53701C14.25 2.43221 14.228 2.32859 14.1854 2.23281C14.1429 2.13704 14.0808 2.05124 14.003 1.98095C13.9253 1.91067 13.8337 1.85745 13.7341 1.82474C13.6346 1.79202 13.5293 1.78053 13.425 1.79101C11.9139 1.94457 10.4744 2.51212 9.26512 3.43118C8.05581 4.35024 7.12356 5.58517 6.571 7.00001Z\' stroke=\'white\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E%0A') no-repeat center/contain;
}

#shareBtn {
    margin: 0 10px 0 0;
    background: transparent url('../assets/share-btn.png') no-repeat center/contain;
}

#toggleModeBtn {
    margin-right: 10px;
    background: transparent url('../assets/toggle-mode-btn.png') no-repeat center/contain;
}

#toggleModeBtn.active {
    background: transparent url('../assets/toggle-mode-btn.png') no-repeat center/contain;
}

#fullScreenVideoBtn {
    background: transparent url('data:image/svg+xml,%3Csvg width=\'24\' height=\'25\' viewBox=\'0 0 24 25\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M9.75 15.248L0.75 24.248M0.75 24.248V17.498M0.75 24.248H7.5M23.25 8.49805V1.74805M23.25 1.74805H16.5M23.25 1.74805L14.25 10.748M14.25 15.248L23.25 24.248M23.25 24.248V17.498M23.25 24.248H16.5M0.75 8.49805V1.74805M0.75 1.74805H7.5M0.75 1.74805L9.75 10.748\' stroke=\'%23ffffff\' stroke-width=\'1.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E%0A') no-repeat center/contain;
}

.full-screen-mode #fullScreenVideoBtn {
    background: transparent url('data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\'%3E%3Cpath fill=\'white\' stroke=\'%23fff\' stroke-width=\'2\' d=\'M2,14 L10,14 L10,22 M1,23 L10,14 M23,1 L14,10 M22,10 L14,10 L14,2\'/%3E%3C/svg%3E%0A') no-repeat center/contain;
}

#fullScreenSlideBtn {
    background: transparent url('../assets/full-screen-slide-btn.png') no-repeat center/contain;
}

.hidden-slides-viewer #fullScreenSlideBtn,
.hidden-slides-viewer #toggleModeBtn,
#app #toggleModeBtn.disabled {
    display: none;
}

#progressBar {
    position: relative;
    flex-basis: 4000px;
    height: 7px;
    margin: 0 0 0 20px;
}

#progressLine {
    position: absolute;
    z-index: 6;
    top: 0;
    left: 0;
    width: 100%;
    height: 7px;
    margin: 0;
    padding: 0;
    background: transparent;
    cursor: pointer;

    -webkit-appearance: none;
    appearance: none;
}

#progressLineWatched {
    position: absolute;
    top: 0;
    left: 0;
    height: 7px;
    border-radius: 5px;
    background: #1f49e0;
    pointer-events: none;
}

#progressLineBuffered {
    position: absolute;
    top: 0;
    left: 0;
    height: 7px;
    border-radius: 5px;
    background: #5b6c8a;
    pointer-events: none;
}

.chapterTimeStamp {
    position: absolute;
    top: 0;
    width: 2px;
    height: 7px;
    background: #1f252e;
    pointer-events: none;
}

.progresLineContainer {
    position: relative;
    z-index: 5;
    height: 7px;
    border-radius: 5px;
    background: #40536e;
    pointer-events: none;
}

#progressBar input[type='range']::-moz-range-track {
    height: 7px;
    border-radius: 10px;
    background: transparent;
}

#progressBar input[type='range']::-webkit-slider-runnable-track {
    height: 7px;
    border-radius: 10px;
    background: transparent;
}

#progressBar input[type='range']::-webkit-slider-thumb {
    position: relative;
    z-index: 5;
    width: 28px;
    height: 28px;
    margin-top: -10px;
    border-radius: 14px;
    background-color: #ffffff;
    pointer-events: none;

    -webkit-appearance: none;
    appearance: none;
}

#progressBar input[type='range']::-moz-range-thumb {
    position: relative;
    z-index: 5;
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 14px;
    background-color: #ffffff;
}

#progressBar input[type='range']:focus {
    outline: none;
}

@media screen and (max-width: 767px) {
    #app.hidden-slides-viewer #controlBtnWrapper2 {
        width: 90px;
        min-width: max-content;
    }

    #rewindForward,
    #rewindBack,
    #goToNext,
    #goToPrev {
        display: none;
    }

    #controlBtnWrapper1 {
        min-width: max-content;
    }

    .only-player #controlBtnWrapper1 {
        min-width: max-content;
    }

    .current-time {
        text-align: center;
    }
}

@media(max-width: 600px) {
    #volumeRateWrapper {
        display: none;
    }

    #shareBtn {
        display: none;
    }

    .current-time {
        margin-right: 10px;
    }

    #progressBar {
        margin: 0;
    }
}

/* @media(max-width: 430px) {
    #play {
        display: none;
    }

    #play.show {
        display: block;
    }
} */

</style>
