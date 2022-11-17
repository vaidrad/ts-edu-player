<template>
  <div id="app" :class="{ 'hidden-slides-viewer': !slidesViewer, 'full-screen-mode': isFullScreen, 'only-player': onlyPlayer }" @click="handleAppClick" @mouseleave="closeRates" ref="root">
    <div id="mainContent" :style="{ height: videoHeight }">
      <transition name="fade">
        <div id="shareMessage" v-if="shareMessage">Copied to the clipboard.</div>
      </transition>
      
      <div id="rightSideBar" :class="{'switched': isVideoBig}">
        <slides-viewer v-show="slidesViewer" id="slidesViewer" ref="slidesViewer"
                     :source="getSource()"></slides-viewer>
        <div id="brightcoveVideoWrapper" @click="play">
          <brightcove-video ref="brightcoveVideo" v-show="showBrightcovePlayer"
                          :accountCode="currentVideo.accountCode"
                          :playerCode="currentVideo.playerCode"
                          :videoID="currentSlide.videoID"
                          :showBrightcovePlayer="showBrightcovePlayer"
                          :time="currentVideoTime"
                          :currentSlideIndex="currentSlideIndex"
                          :slideTime="slideTime"
                          @timeupdate="onTimeUpdate"
                          @ended="onEnded"
                          @canplay="handleVideoCanPlay"
                          @ready="initBufferingWatcher">
          </brightcove-video>
          <div id="playerHover">
            <div class="title">
              <p class="video-title" @click.stop>{{ !onlyPlayer ? title + ' / ' + currentSlide.title : title }}</p>
              <p class="video-length" @click.stop>{{ videoDurationInMins }} Min.</p>
            </div>
            <div id="buttonsHover">
              <button class="control-btn" id="rewindBackHover" title="Move back"
                :class="{'disabled':!isVideoReady}"
                @click.stop="rewindVideo(0)"></button>
              <button class="control-btn" id="playHover" title="Play/Pause"
                :class="{'disabled':!isVideoReady, 'playing':isPlaying}"></button>
              <button class="control-btn" id="rewindForwardHover" title="Move forward"
                :class="{'disabled':!isVideoReady}"
                @click.stop="rewindVideo(1)"></button>
            </div>
          </div>
        </div>
        <slides-list ref="slidesList"
                     :slides="slides"
                     :startSlideIndex="currentSlideIndex"
                     :subSlideIndex="currentSubSlideIndex"
                     :showSubSlides="showSubSlides"
                     :subSlidesActive="subSlidesActive"
                     v-show="!onlyPlayer"
                     @changeActiveItem="goToSlide">
        </slides-list>
      </div>
    </div>
    <player-footer ref="playerFooter"
                    :isVideoReady="!isVideoReady"
                    :isPlaying="isPlaying"
                    :isGoToPrevDisabled="isGoToPrevDisabled"
                    :isGoToNextDisabled="isGoToNextDisabled"
                    :onlyPlayer="onlyPlayer"
                    :videoDuration="videoDuration"
                    :isVideoBig="isVideoBig"
                    :showBrightcovePlayer="showBrightcovePlayer"
                    :currentSlideIndex="currentSlideIndex"
                    :currentVideoTime="currentVideoTime"
                    @play="play"
                    @changeActiveItem="goToSlide"
                    @rewindVideo="rewindVideo"
                    @toggleVideoPosition="toggleVideoPosition"
                    @enterFullScreenVideo="enterFullScreenVideo"
                    @share="share"
                    @changevolumerate="changeVolumeRate"
                    @progresslineclick="handleProgressLineClick"
                    @setplaybackrate="setPlaybackRate">
      </player-footer>
  </div>
</template>

<script lang="ts">
import slidesList from "./components/slides-list.vue";
import slidesViewer from "./components/slides-viewer";
import brightcoveVideo from "./components/brightcove-video";
import playerFooter from "./components/player-footer"
import vueConfig from "../vue.config";
// import {getUrlParameter} from "./utils";
import { computed, defineComponent, onMounted, ref, watch } from "vue";
import store from './store/store.ts';

const configJsonPath = `${vueConfig.publicPath}/config.json`;

export default defineComponent({
  name: "aem-video-slides",
  components: {
    slidesList,
    slidesViewer,
    brightcoveVideo,
    playerFooter
  },
  setup() {

    const isVideoBig = computed(() => store.getters.getIsVideoBig);
    const shareMessage = ref(false);
    const currentSlideIndex = computed(() => store.getters.getCurrentSlideIndex);
    const currentSubSlideIndex = ref(0);
    const slideTime = ref(0);
    const brightcoveVideo = ref(null);
    const slides = computed(() => store.getters.getSlides);
    const slidesViewer = computed(() => store.getters.getSlidesViewer);
    const showSubSlides = computed(() => store.getters.getShowSubSlides);
    const showBrightcovePlayer = computed(() => store.getters.getShowBrightcovePlayer);
    const subSlidesActive = computed(() => store.getters.getSubSlidesActive);
    const onlyPlayer = computed(() => store.getters.getOnlyPlayer);
    const currentVideoTime = computed(() => store.getters.getCurrentVideoTime);
    const currentSlide = computed(() => store.getters.getCurrentSlide);
    const currentVideo = computed(() => store.getters.getCurrentVideo);
    const title = computed(() => store.getters.getTitle);
    //add mutation to create videoDuration
    const videoDuration = computed(() => store.getters.getVideoDuration);
    const videoDurationInMins = ref(0);
    const isVideoReady = ref(false);
    const isPlaying = ref(false);
    const isFullScreen = ref(false);
    const videoHeight = ref(null);
    const root = ref(null);

    const isGoToPrevDisabled = computed(() => {
      return (slides.value.length === 0) || (currentSlideIndex.value === 0);
    });
    
    const isGoToNextDisabled = computed(() => {
      return (slides.value.length === 0) || (currentSlideIndex.value === slides.value.length - 1);
    });

    watch(() => currentSlideIndex.value, (newValue) => {
      if(slides.value){
        currentSlide.value = slides.value[newValue];
      }
    })

    //связь с футером todo
    // watch(() => currentVideoTime.value, () => {
    //   store.commit('setcurrentVideoTime', currentVideoTime.value)
    //   changeProgressBarLine();
    // });

    const getSource = () => {
      let imageUrl = currentSlide.value.imageUrl;
      if (currentSlide.value.subSlides) {
        currentSlide.value.subSlides.forEach((subSlide) => {
          if (currentVideoTime.value >= subSlide.time) {
            imageUrl = subSlide.imageUrl;
          }
        });
      }
      return imageUrl;
    };

    const onTimeUpdate = (currentTime) => {
      if(!onlyPlayer.value){
        let slideIndex = 0;
        let subSlideIndex;

        slides.value.forEach((slide, index) => {
          if (currentTime >= slide.time) slideIndex = index;
        });
        slides.value[slideIndex].subSlides && slides.value[slideIndex].subSlides.forEach((subSlide, index) => {
          if (currentTime >= subSlide.time) subSlideIndex = index;
        });

        currentSlideIndex.value = slideIndex;
        currentSubSlideIndex.value = subSlideIndex;
      }
      
      currentVideoTime.value = currentTime;
    };

    const onEnded = () => {
      if(!onlyPlayer.value){
        (currentSlideIndex.value !== slides.value.length - 1) && goToSlide(++currentSlideIndex.value);
      }
      isPlaying.value = false;
    };

    const goToSlide = (slide) => {
      if (slide.currentSubSlideIndex !== undefined) {
        currentVideoTime.value = slides.value[slide.currentSlideIndex].subSlides[slide.currentSubSlideIndex].time;
      } else {
        currentVideoTime.value = slides.value[slide.currentSlideIndex].time;
      }
      changeProgressBarLine();
      currentSlideIndex.value = slide.currentSlideIndex;
      currentSubSlideIndex.value = undefined;
      // asist?
      slideTime.value = slides.value[slide.currentSlideIndex].time;
    };

    const enterFullScreenVideo = () => {
      if(isFullScreen.value){
        // asist webkit?
        document.exitFullscreen ? document.exitFullscreen() : document.webkitExitFullscreen();
        isFullScreen.value = false;
        videoHeight.value = '';
      } else if(window.innerWidth > 767){
        desktopFullScreen();
      } else{
        mobileFullScreen();
      }
    };

    const desktopFullScreen = () => {
      if(root.value.requestFullscreen){
        root.value.requestFullscreen().then(addExitFullScreenListener);
      } else{
        root.value.webkitRequestFullscreen();
        setTimeout(addExitFullScreenListener, 400);
      }
    };

    const mobileFullScreen = () => {
      window.bcPlayer.controls(true);
      brightcoveVideo.value.querySelector('button.vjs-fullscreen-control.vjs-control.vjs-button').click(); 
      setTimeout(addMobileExitFullScreenListener, 400)
    };

    const addExitFullScreenListener = () => {
      setTimeout(() => {
        isFullScreen.value = true;
        calculateVideoHeight();
        document.addEventListener('fullscreenchange', (event) => {
          if(event.target.classList.contains('full-screen-mode') && this.isFullScreen === true) {
            isFullScreen.value = false;
            videoHeight.value = '';
          }
        }, {once: true})
      }, 100);
    };

    const addMobileExitFullScreenListener = () => {
      setTimeout(() => {
        document.addEventListener('fullscreenchange', () => {
          isFullScreen.value = false;
          window.bcPlayer.controls(false);
        }, {once: true})
      }, 100)
    };

    const toggleVideoPosition = () => {
      isVideoBig.value = !isVideoBig.value;
    };

    const share = () => {
      shareMessage.value = true;
      setTimeout(() => shareMessage.value = false, 2000);
    };

    const handleVideoCanPlay = (duration) => {
      isVideoReady.value = true;
      videoDuration.value = duration;
      videoDurationInMins.value = Math.floor(duration / 60);
      changeProgressBarLine();
      // todo
      //this.$refs.playerFooter.calculateTimeStamps(this.slides, this.videoDuration);
    };

    const handleAppClick = () => {
      //todo
      // isPlaying.value = !this.$refs.brightcoveVideo.brightcovePlayer.paused();
      // this.$refs.playerFooter.isVolumeRateShow = false;
      // this.$refs.playerFooter.isPlaybackRateShow = false;
    };

    const play = () => {
      // if(this.$refs.brightcoveVideo.brightcovePlayer.paused()) {
      //   this.$refs.brightcoveVideo.brightcovePlayer.play();
      // } else{
      //   this.$refs.brightcoveVideo.brightcovePlayer.pause();
      // }
      changeProgressBarLine();
    };

    const rewindVideo = (isForward) => {
      //todo
      if(isForward){
        currentVideoTime.value + 15 < videoDuration.value ? this.$refs.brightcoveVideo.updatePlayerTime(this.currentVideoTime + 15) : this.$refs.brightcoveVideo.updatePlayerTime(videoDuration.value - 1);
      } else{
        currentVideoTime.value > 15 ? this.$refs.brightcoveVideo.updatePlayerTime(currentVideoTime.value - 15) : this.$refs.brightcoveVideo.updatePlayerTime(0);
      }
    };

    const changeProgressBarLine = () => {
      //todo
      // this.$refs.playerFooter.changeProgressBarLine();
    };

    const initBufferingWatcher = () => {
      // this.$refs.playerFooter.initBufferingWatcher();
    };

    const calculateVideoHeight = () => {
      //todo
      if(onlyPlayer.value){
        videoHeight.value = this.$refs.brightcoveVideo.brightcovePlayer.videoHeight() / this.$refs.brightcoveVideo.brightcovePlayer.videoWidth() * 100 + 'vw';
      } else if(window.innerWidth > 767 && this.slidesViewer){
        videoHeight.value = this.$refs.brightcoveVideo.brightcovePlayer.videoHeight() / (this.$refs.brightcoveVideo.brightcovePlayer.videoWidth() / 0.66) * 100 + 'vw';
      } else if(window.innerWidth > 767){
        videoHeight.value = this.$refs.brightcoveVideo.brightcovePlayer.videoHeight() / (this.$refs.brightcoveVideo.brightcovePlayer.videoWidth() / 0.75) * 100 + 'vw';
      } else{
        videoHeight.value = 'calc(' + this.$refs.brightcoveVideo.brightcovePlayer.videoHeight() / this.$refs.brightcoveVideo.brightcovePlayer.videoWidth() * 100 + 'vw + 252px)';
      }
    };

    const changeVolumeRate = (value) => {
      //todo
      this.$refs.brightcoveVideo.setVolumeRate(value/100);
    };

    const handleProgressLineClick = (currentVideoTimeInSecs) => {
      //todo
      this.$refs.brightcoveVideo.updatePlayerTime(currentVideoTimeInSecs);
    };

    const setPlaybackRate = (value) => {
      // todo
      this.$refs.brightcoveVideo.setPlaybackRate(value);
    };

    const closeRates = () => {
      //todo
      this.$refs.playerFooter.closePlaybackRate();
      this.$refs.playerFooter.closeVolumeRateShow();
    };

    onMounted(() => {
      window.addEventListener('resize', changeProgressBarLine);
      window.bcController = {
        togglePlay: () => {
          play();
          handleAppClick();
        },
        toggleFullScreenVideo: () => {
          enterFullScreenVideo();
        },
        setPlaybackRate: (value = 1) => {
          setPlaybackRate(value);
        },
        goToSlide: (slide = 0) => {
          goToSlide({currentSlideIndex: slide, currentSubSlideIndex: undefined});
        },
        rewindVideo: (isForward = true) => {
          rewindVideo(isForward);
        },
        toggleVideoPosition: () => {
          toggleVideoPosition();
        }
      };
    });

    const xhr = new XMLHttpRequest();
    xhr.open("GET", configJsonPath, false);
    xhr.send();
    if (xhr.readyState === 4 && xhr.status === 200) {
      store.commit('initState', JSON.parse(xhr.response));
      // slidesViewer.value = configuration.slidesViewer;
      // showSubSlides.value = configuration.showSubSlides;
      // showBrightcovePlayer.value = configuration.showBrightcovePlayer;
      // subSlidesActive.value = configuration.subSlidesActive;
      // title.value = configuration.title;
      // if(!configuration.slidesViewer){
      //   onlyPlayer.value = configuration.onlyPlayer;
      // }
      // if(!onlyPlayer.value){
      //   store.commit('setSlides', configuration.chapters.reduce((slides, chapter) => {
      //     chapter.slides.forEach(slide => {
      //       slide.active = false;
      //       slide.videoID = chapter.videoID
      //     });
      //     return slides.concat(chapter.slides)
      //   }, []));

      //   const sharedSlideIndex = getUrlParameter("currentSlideIndex");

      //   if (sharedSlideIndex > 0 && sharedSlideIndex < slides.value.length){
      //     currentSlideIndex.value = sharedSlideIndex;
      //   } else{
      //     currentSlideIndex.value = 0;
      //   }
      //   currentSlide.value = slides.value[currentSlideIndex.value];
      //   currentSlide.value.active = true;
      //   currentVideoTime.value = slides.value[currentSlideIndex.value].time;
      //   isVideoBig.value = configuration.isVideoBig;
      //   isSwitchDisabled.value = configuration.isSwitchDisabled;
      // } else{
      //   currentSlide.value.videoID = configuration.chapters[0].videoID;
      //   currentSlide.value.active = true;
      //   currentVideoTime.value = 0;
      // }
      
      
      // currentVideo.value.accountCode = configuration.accountCode;
      // currentVideo.value.playerCode = configuration.playerCode;
    }

    return {
      isVideoBig,
      shareMessage,
      currentSlideIndex,
      currentSubSlideIndex,
      brightcoveVideo,
      slidesViewer,
      showSubSlides,
      showBrightcovePlayer,
      subSlidesActive,
      onlyPlayer,
      currentVideoTime,
      currentSlide,
      currentVideo,
      title,
      slides,
      videoDuration,
      videoDurationInMins,
      isVideoReady,
      isPlaying,
      isFullScreen,
      videoHeight,
      isGoToPrevDisabled,
      isGoToNextDisabled,
      root,
      slideTime,
      getSource,
      onTimeUpdate,
      onEnded,
      goToSlide,
      enterFullScreenVideo,
      desktopFullScreen,
      mobileFullScreen,
      addExitFullScreenListener,
      addMobileExitFullScreenListener,
      toggleVideoPosition,
      share,
      handleVideoCanPlay,
      handleAppClick,
      play,
      rewindVideo,
      changeProgressBarLine,
      initBufferingWatcher,
      calculateVideoHeight,
      changeVolumeRate,
      handleProgressLineClick,
      setPlaybackRate,
      closeRates,
    };
  },
});
</script>

<style scoped>
#app {
    overflow: hidden;
    width: 100%;
    height: 577px;
    margin-bottom: 1rem;
}

#app.full-screen-mode {
    display: flex;
    flex-direction: column;
    justify-content: center;
    height: 100%;
}

#app.full-screen-mode.only-player #videoWrapper {
    height: 100%;
}

#app.full-screen-mode.only-player #brightcoveVideoWrapper {
    height: 100%;
}

#app.full-screen-mode.only-player.hidden-slides-viewer #brightcoveVideoWrapper,
#app.full-screen-mode.only-player #rightSideBar {
    height: 100%;
}

#app.full-screen-mode #mainContent {
    height: 100%;
}

#app.only-player #brightcoveVideoWrapper {
    width: 100%;
}

#app.only-player #slidesList {
    display: none;
}

#mainContent {
    position: relative;
    display: flex;
    width: 100%;
    height: 501px;
}

#videoWrapper {
    width: 100%;
    height: 100%;
}

#app::v-deep #slidesViewer {
    display: flex;
    align-items: center;
    width: max-content;
    max-width: 66%;
    height: 100%;
}

#rightSideBar {
    display: flex;
    overflow: hidden;
    align-content: space-between;
    flex-direction: column;
    flex-wrap: wrap;
    width: 100%;
    height: 100%;
    border-radius: 1rem;
    background: #151b17;
}

#rightSideBar.switched #brightcoveVideoWrapper {
    order: -1;
    width: 66%;
    max-width: 66%;
    height: 100%;;
}

#rightSideBar.switched #slidesViewer {
    justify-content: center;
    width: 34%;
    height: 196px;
}

.hidden-slides-viewer #brightcoveVideoWrapper {
    width: 100%;
}

#brightcoveVideoWrapper {
    position: relative;
    width: auto;
    height: 196px;
}

#brightcoveVideoWrapper:hover #playerHover {
    opacity: 1;
}

#playerHover {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background-color: rgba(18, 32, 53, 0.6);
    opacity: 0;
    transition: 0.3s ease-in-out;
}

#playerHover .title {
    position: absolute;
    top: 10px;
    left: 10px;
}

#playerHover .video-title,
#playerHover .video-length {
    color: #ffffff;
}

#playerHover .video-title {
    margin: 0;
    font-size: 20px;
    line-height: 30px;
}

#playerHover .video-length {
    font-size: 16px;
    line-height: 24px;
}

#buttonsHover {
    position: absolute;
    top: 50%;
    left: 50%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 200px;
    transform: translate(-50%, -50%);
}

#buttonsHover .control-btn {
    margin: 0;
}

#buttonsHover > button {
    position: relative;
    box-shadow: 0 0 70px 0 #000000;
}

#buttonsHover > button:after {
    content: '';
    position: absolute;
    top: -14px;
    left: 0;
    width: 24px;
    height: 28px;
}

#buttonsHover > button:first-child,
#buttonsHover > button:last-child {
    box-shadow: 0 0 70px 10px #000000;
}

#buttonsHover > button:first-child:after {
    background: transparent url('data:image/svg+xml,%3Csvg width=\'26\' height=\'30\' viewBox=\'0 0 26 30\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M14 9L10 5M10 5L14 1M10 5H13C16.1826 5 19.2349 6.26428 21.4853 8.51472C23.7357 10.7652 25 13.8174 25 17C25 20.1826 23.7357 23.2348 21.4853 25.4853C19.2349 27.7357 16.1826 29 13 29C12.6667 29 12.3293 28.9853 12 28.9587M1.04134 16C1.01467 16.3293 1.00001 16.6667 1.00001 17C0.998843 18.012 1.12608 19.02 1.37867 20M3.80801 9.28667C3.15644 10.061 2.60582 10.915 2.16934 11.828M3.83734 24.7493C4.05067 25.0018 4.27645 25.2471 4.51467 25.4853C5.22959 26.2016 6.03243 26.8244 6.90401 27.3387M14 20.3333H16.3333C16.5522 20.3333 16.7689 20.2902 16.9712 20.2065C17.1734 20.1227 17.3571 19.9999 17.5119 19.8452C17.6666 19.6904 17.7894 19.5067 17.8731 19.3045C17.9569 19.1023 18 18.8855 18 18.6667C18 15.704 14 18.296 14 15.3333V13.6667H18M9.66668 20.3289V14.3324C9.66635 14.2088 9.63168 14.0876 9.56652 13.9825C9.50136 13.8774 9.40828 13.7925 9.29767 13.7371C9.18705 13.6818 9.06325 13.6583 8.94006 13.6693C8.81688 13.6802 8.69915 13.7252 8.60002 13.7991L7.00002 14.9991M8.33335 20.3289H11\' stroke=\'white\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E%0A') no-repeat center/contain;
}

#buttonsHover > button:last-child:after {
    background: transparent url('data:image/svg+xml,%3Csvg width=\'26\' height=\'30\' viewBox=\'0 0 26 30\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M12 9L16 5M16 5L12 1M16 5H13C9.8174 5 6.76516 6.26428 4.51472 8.51472C2.26428 10.7652 1 13.8174 1 17C1 20.1826 2.26428 23.2348 4.51472 25.4853C6.76516 27.7357 9.8174 29 13 29C13.3333 29 13.6707 28.9853 14 28.9587M24.9587 16C24.9853 16.3293 25 16.6667 25 17C25.0012 18.012 24.8739 19.02 24.6213 20M22.192 9.28667C22.8436 10.061 23.3942 10.915 23.8307 11.828M22.1627 24.7493C21.9493 25.0018 21.7236 25.2471 21.4853 25.4853C20.7704 26.2016 19.9676 26.8244 19.096 27.3387M14.6667 20.3333H17C17.2189 20.3333 17.4356 20.2902 17.6378 20.2065C17.84 20.1227 18.0237 19.9999 18.1785 19.8452C18.3333 19.6904 18.456 19.5067 18.5398 19.3045C18.6236 19.1023 18.6667 18.8855 18.6667 18.6667C18.6667 15.704 14.6667 18.296 14.6667 15.3333V13.6667H18.6667M10.3333 20.3289V14.3324C10.333 14.2088 10.2983 14.0876 10.2332 13.9825C10.168 13.8774 10.0749 13.7925 9.96432 13.7371C9.8537 13.6818 9.7299 13.6583 9.60671 13.6693C9.48353 13.6802 9.3658 13.7252 9.26667 13.7991L7.66667 14.9991M9 20.3289H11.6667\' stroke=\'white\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E%0A') no-repeat center/contain;
}

#buttonsHover #rewindBackHover,
#buttonsHover #rewindForwardHover {
    width: 0;
    height: 0;
}

#buttonsHover #playHover {
    width: 48px;
    height: 48px;
    border-radius: 50%;
}

#slidesList {
    overflow: auto;
    max-width: 34%;
    height: inherit;
    height: calc(100% - 196px);
}

#slidesList::-webkit-scrollbar {
    width: 6px;
    background: #122035;
}

#slidesList::-webkit-scrollbar-thumb {
    border-radius: 3px;
    background: #57667e;
}

#slidesList::-webkit-scrollbar-track {
    background: #122035;
}

#app .player-footer {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-sizing: border-box;
    height: 64px;
    min-height: 64px;
    margin-top: 12px;
    padding: 0 20px 0 10px;
    border-radius: 32px;
    background: #1f252e;
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

#playHover {
    background: #1f49e0 url('data:image/svg+xml,%3Csvg width=\'22\' height=\'22\' viewBox=\'0 0 22 22\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M19.8673 9.71515C20.8352 10.2983 20.8352 11.7017 19.8673 12.2848L8.46156 19.1563C7.46182 19.7586 6.1875 19.0386 6.1875 17.8714L6.1875 4.12858C6.1875 2.96143 7.46182 2.24144 8.46156 2.84373L19.8673 9.71515Z\' fill=\'white\' /%3E%3C/svg%3E') no-repeat center/contain;
    background-size: 27px 26px;
}

#playHover.playing {
    background: #1f49e0 url('data:image/svg+xml,%3Csvg width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath fill-rule=\'evenodd\' clip-rule=\'evenodd\' d=\'M6.5 3C5.67157 3 5 3.67157 5 4.5V19.5C5 20.3284 5.67157 21 6.5 21H8.5C9.32843 21 10 20.3284 10 19.5V4.5C10 3.67157 9.32843 3 8.5 3H6.5ZM15.5 3C14.6716 3 14 3.67157 14 4.5V19.5C14 20.3284 14.6716 21 15.5 21H17.5C18.3284 21 19 20.3284 19 19.5V4.5C19 3.67157 18.3284 3 17.5 3H15.5Z\' fill=\'white\'/%3E%3C/svg%3E%0A') no-repeat center/contain;
    background-size: 27px 26px;
}

#shareMessage {
    position: absolute;
    z-index: 10;
    top: 20px;
    left: 20px;
    box-sizing: border-box;
    width: 250px;
    height: 48px;
    padding: 16px 24px;
    border-radius: 2px;
    background-color: #1f252e;
    box-shadow: 0 4px 60px rgba(100, 133, 157, 0.15);
    color: #f0f2f5;
    text-align: center;
    font-size: 14px;
    cursor: default;
} 

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.5s;
}

.fade-enter {
    opacity: 0;
}

.hidden-slides-viewer #rightSideBar {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    width: 100%;
}

.hidden-slides-viewer #brightcoveVideoWrapper {
    width: 75%;
    height: 100%;
}

.hidden-slides-viewer #slidesList {
    height: 100%;
    background: #122035;
}

@media screen and (max-width: 991px) {
    #app.hidden-slides-viewer ::v-deep ol li {
        padding: 0.5rem;
    }
}

@media screen and (max-width: 767px) {
    #mainContent {
        flex-direction: column;
    }

    #app #slidesViewer,
    #app #rightSideBar,
    #app #brightcoveVideoWrapper {
        width: auto;
        max-width: 100%;
        height: auto;
        max-height: 90vh;
    }

    #app.full-screen-mode #rightSideBar {
        height: 100%;
    }

    #app.full-screen-mode #rightSideBar.switched #brightcoveVideoWrapper {
        height: calc(100% - 252px);
    }

    #app.full-screen-mode ::v-deep #slidesViewer {
        height: calc(100% - 252px);
        max-height: 100%;
    }

    #app.full-screen-mode ::v-deep .slides-viewer img {
        height: auto !important;
        max-height: 100%;
    }

    #app #mainContent,
    #app {
        height: auto;
    }

    #app #slidesList {
        width: 100%;
        max-width: 100%;
        height: 252px;
    }

    #app #shareMessage {
        top: auto;
        bottom: 0;
    }

    #app.hidden-slides-viewer #rightSideBar,
    #app.hidden-slides-viewer #brightcoveVideoWrapper {
        flex-direction: column;
        width: 100%;
    }

    #app #slidesViewer {
        max-height: 285px;
    }

    #app #rightSideBar.switched #brightcoveVideoWrapper {
        order: -1;
        width: 100%;
        max-width: 100%;
        height: 285px;
    }

    #app #rightSideBar.switched #slidesViewer {
        justify-content: center;
        width: 0;
        height: 0;
    }

    .hidden-slides-viewer #playerHover,
    .switched #playerHover {
        display: block;
    }

    #playerHover {
        display: none;
    }

    #app.hidden-slides-viewer #videoWrapper {
        width: 100%;
        height: 285px;
    }

    #app.hidden-slides-viewer.full-screen-mode #videoWrapper {
        height: 100%;
    }

    #app.hidden-slides-viewer.full-screen-mode #brightcoveVideoWrapper {
        height: calc(100% - 252px);
    }

    #app.hidden-slides-viewer.full-screen-mode #rightSideBar {
        height: 100%;
    }

    #app.hidden-slides-viewer #slidesList {
        width: 100%;
    }
}


</style>
