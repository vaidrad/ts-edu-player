import Vue from 'vue';
import Vuex from 'vuex';
import {getUrlParameter} from "../utils";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    currentVideoTime: 0,
    slides: [],
    slidesViewer: false,
    showSubSlides: false,
    showBrightcovePlayer: true,
    subSlidesActive: false,
    title: '',
    onlyPlayer: false,
    currentSlideIndex: 0,
    currentSlide: {
      title: "",
      videoID: "",
      imageUrl: "",
      time: 0,
      subSlides: [],
      active: false,
    },
    isVideoBig: true,
    isSwitchDisabled: false,
    currentVideo: {
      accountCode: "",
      playerCode: ""
    },
    videoDuration: 0
  },
  mutations: {
    initState(state, configuration) {
      state.slidesViewer = configuration.slidesViewer;
      state.showSubSlides = configuration.showSubSlides;
      state.showBrightcovePlayer = configuration.showBrightcovePlayer;
      state.subSlidesActive = configuration.subSlidesActive;
      state.title = configuration.title;
      if(!configuration.slidesViewer){
        state.onlyPlayer = configuration.onlyPlayer;
      }
      if(!state.onlyPlayer){
        state.slides =  configuration.chapters.reduce((slides, chapter) => {
          chapter.slides.forEach(slide => {
            slide.active = false;
            slide.videoID = chapter.videoID
          });
          return slides.concat(chapter.slides)
        }, []);

        const sharedSlideIndex = getUrlParameter("currentSlideIndex");

        if (sharedSlideIndex > 0 && sharedSlideIndex < state.slides.length){
          state.currentSlideIndex = sharedSlideIndex;
        } else{
          state.currentSlideIndex = 0;
        }
        state.currentSlide = state.slides[state.currentSlideIndex];
        state.currentSlide.active = true;
        state.currentVideoTime = state.slides[state.currentSlideIndex].time;
        state.isVideoBig = configuration.isVideoBig;
        state.isSwitchDisabled = configuration.isSwitchDisabled;
      } else{
        state.currentSlide.videoID = configuration.chapters[0].videoID;
        state.currentSlide.active = true;
        state.currentVideoTime = 0;
      }
      
      
      state.currentVideo.accountCode = configuration.accountCode;
      state.currentVideo.playerCode = configuration.playerCode;
    },
    setcurrentVideoTime(state, value) {
      state.currentVideoTime = value;
    },
    setSlides(state, value) {
      state.slides = value;
    }
  },
  getters: {
    getCurrentVideoTime(state) {
      return state.currentVideoTime;
    },
    getSlides(state) {
      return state.slides;
    },
    getIsVideoBig(state) {
      return state.isVideoBig;
    },
    getCurrentSlideIndex(state) {
      return state.currentSlideIndex;
    },
    getSlidesViewer(state) {
      return state.slidesViewer;
    },
    getShowSubSlides(state) {
      return state.showSubSlides;
    },
    getShowBrightcovePlayer(state) {
      return state.showBrightcovePlayer;
    },
    getSubSlidesActive(state) {
      return state.subSlidesActive;
    },
    getOnlyPlayer(state) {
      return state.onlyPlayer;
    },
    getCurrentSlide(state) {
      return state.currentSlide;
    },
    getCurrentVideo(state) {
      return state.currentVideo;
    },
    getTitle(state) {
      return state.title;
    },
    getVideoDuration(state) {
      return state.videoDuration;
    },
    getIsSwitchDisabled(state) {
      return state.isSwitchDisabled;
    }
  },
});