<template>
  <div id="slidesList" ref="slideList">
    <ol class="list" @click.stop>
      <li v-for="(slide, index) in slides"
          :key="index"
          :class="{'active': slide.active}"
          v-show="!slide.hidden"
          @click="onClick(index)">
        <span v-html="slide.title"></span>
        <ol v-show="showSubSlides" class="sublist">
          <li v-for="(subSlide, subSlideIndex) in slide.subSlides"
              :key="subSlideIndex"
              :class="{'active': subSlide.active}"
              @click.stop="onClick(index, subSlideIndex)">
                        <span>
                            {{ (index + 1) + "." + (subSlideIndex + 1) }}
                        </span>
            <span v-html="subSlide.title"></span>
          </li>
        </ol>
      </li>
    </ol>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, onMounted, onUpdated } from 'vue';

export default defineComponent({
  name: 'slides-list',
  props: {
    slides: {
      type: Array,
      default: () => {
        return [];
      }
    },
    startSlideIndex: {
      type: Number,
      default: 0
    },
    showSubSlides: {
      type: Boolean,
      default: false
    },
    subSlideIndex: {
      type: Number,
      default: undefined
    },
    subSlidesActive: {
      type: Boolean,
      default: false
    }
  },
  emits: ['changeActiveItem'],
  setup(props, { emit }) {

    let listItemHeight = 0;
    let currentSlideIndex = 0;
    let currentSubSlideIndex = undefined;

    const index = ref(null);
    const slideList = ref(null);

    const getLi = (slide) => {
      index.value.innerHTML = slide.title;
      return slide.title;
    };
    
    const onClick = (index, subSlideIndex) => {
      if (props.subSlidesActive || (!subSlideIndex)) {
        emit("changeActiveItem", {
          currentSlideIndex: index,
          currentSubSlideIndex: subSlideIndex
        });
      }
    };

    const scrollToActive = () => {
      listItemHeight = slideList.value.querySelector("li.active");
      if(listItemHeight){
        slideList.value.scrollTop = Math.round(listItemHeight.offsetTop - listItemHeight.parentElement.offsetTop);

        if (props.startSlideIndex !== 0 && props.slides[props.startSlideIndex].hidden) {
          slideList.value.scrollTop = slideList.value.scrollHeight;
        }
      }
    };

    const updateSubSlide = (newValue) => {
      props.slides.forEach((slide, index) => {
        slide.subSlides && slide.subSlides.forEach((subSlide, subIndex) => {
          if (index === this.currentSlideIndex && subIndex === newValue) {
            subSlide.active = true;
          } else {
            subSlide.active = false;
          }
        });
      });
    };

    watch(() => props.startSlideIndex, () => {
      currentSlideIndex = props.startSlideIndex;
    });

    watch(() => currentSlideIndex, (newValue, oldValue) => {
      props.slides[oldValue].active = false;
      props.slides[newValue].active = true;
      updateSubSlide(props.subSlideIndex);
      scrollToActive();
    });

    watch(() => props.subSlideIndex, () => {
      currentSubSlideIndex = props.subSlideIndex;
    });

    watch(() => currentSubSlideIndex, (newValue) => {
      updateSubSlide(newValue);
      scrollToActive();
    });
    
    onMounted(() => {
      currentSlideIndex = props.startSlideIndex;
      scrollToActive();
    });

    onUpdated(() => {
      scrollToActive();
    });

    return {
      listItemHeight,
      currentSlideIndex,
      currentSubSlideIndex,
      index,
      slideList,
      getLi,
      onClick,
      scrollToActive,
      updateSubSlide,
    };
  },
});

// export default {
//   name: 'slides-list',
//   data: function () {
//     return {
//       listItemHeight: 0,
//       currentSlideIndex: 0,
//       currentSubSlideIndex: undefined
//     }
//   },
//   watch: {
//     startSlideIndex() {
//       this.currentSlideIndex = this.startSlideIndex;
//     },
//     currentSlideIndex(newValue, oldValue) {
//       this.slides[oldValue].active = false;
//       this.slides[newValue].active = true;
//       this.updateSubSlide(this.subSlideIndex);
//       this.$forceUpdate();
//     },
//     subSlideIndex() {
//       this.currentSubSlideIndex = this.subSlideIndex;
//     },
//     currentSubSlideIndex(newValue) {
//       this.updateSubSlide(newValue);
//       this.$forceUpdate();
//     },
//   },
//   props: {
//     slides: {
//       type: Array,
//       default: () => {
//         return [];
//       }
//     },
//     startSlideIndex: {
//       type: Number,
//       default: 0
//     },
//     showSubSlides: {
//       type: Boolean,
//       default: false
//     },
//     subSlideIndex: {
//       type: Number,
//       default: undefined
//     },
//     subSlidesActive: {
//       type: Boolean,
//       default: false
//     }
//   },
//   methods: {
//     getLi(slide) {
//       this.$refs.index.innerHTML = slide.title;
//       return slide.title;
//     },
//     onClick(index, subSlideIndex) {
//       if (this.subSlidesActive || (!subSlideIndex)) {
//         this.$emit("changeActiveItem", {
//           currentSlideIndex: index,
//           currentSubSlideIndex: subSlideIndex
//         });
//       }
//     },
//     scrollToActive() {
//       this.listItemHeight = this.$el.querySelector("li.active");
//       if(this.listItemHeight){
//         this.$el.scrollTop = Math.round(this.listItemHeight.offsetTop - this.listItemHeight.parentElement.offsetTop);

//         if (this.startSlideIndex !== 0 && this.slides[this.startSlideIndex].hidden) {
//           this.$el.scrollTop = this.$el.scrollHeight;
//         }
//       }
      
//     },
//     updateSubSlide(newValue) {
//       this.slides.forEach((slide, index) => {
//         slide.subSlides && slide.subSlides.forEach((subSlide, subIndex) => {
//           if (index === this.currentSlideIndex && subIndex === newValue) {
//             subSlide.active = true;
//           } else {
//             subSlide.active = false;
//           }
//         });
//       });
//     }
//   },
//   updated() {
//     this.scrollToActive();
//   },
//   mounted() {
//     this.currentSlideIndex = this.startSlideIndex;
//     this.scrollToActive();
//   }
// }
</script>

<style scoped>
ol {
    margin: 0;
    padding: 0;
    list-style: none;
    counter-reset: item;
}

li {
    margin: 0;
    padding: 10px 7px 10px 10px;
    background: #122035;
    color: #ffffff;
    counter-increment: item;
    font-weight: 300;
    font-size: 1rem;
    cursor: pointer;
}

ol > li.active {
    background: #1f49e0;
}

/* ol > li:nth-child(even) {
  background: #122035;
} */

ol li ul li {
    background-color: rgba(240, 255, 255, 0.23);
}

ol > li span::before {
    content: counter(item);
    position: absolute;
    left: -5px;
    min-width: 35px;
    padding: 0 12px;
    border: 1px solid #ffffff;
    border-radius: 3px;
    color: #ffffff;
    text-indent: 0;
    font-weight: 500;
}

ol.list > li:nth-child(n+10) span {
    padding-left: 50px;
}

ol > li:nth-child(n+10) span::before {
    min-width: 45px;
    text-align: center;
}

.list > li,
.list .sublist > li {
    font-weight: 300;
}

ol.sublist > li span::before {
    content: '';
    display: none;
}

ol.sublist li {
    display: flex;
}

.active > .sublist li {
    font-weight: 500;
}

ol.sublist li > span[data-v-f534bf6e] {
    text-indent: 0;
}

li.active span::before,
li.active {
    font-weight: 500;
    /* color: #0087cd; */
}

ol.sublist li.active {
    color: #0087cd;
    font-weight: 500;
}

ol.list li > span {
    position: relative;
    display: block;
    padding: 0 20px 0 40px;
    text-indent: 0;
}

/* ol.list li:nth-child(n+10) > span {
  padding: 10px 10px 0 10px;
}

ol.list li:nth-child(n+10) > span:before {
  left: -20px;
} */

ol.list li:nth-child(n+100) > span {
    padding: 0 0 0 12px;
    text-indent: 41px;
}

ol.list li:nth-child(n+100) > span:before {
    left: -27px;
}

.hidden-slides-viewer ol.list ol > li::before {
    content: '';
    display: none;
}

.hidden-slides-viewer ol li {
    padding: 1rem;
}

#app ol li::after {
    content: '';
    position: absolute;
    top: calc(50% - 10px);
    right: 10px;
    width: 9px;
    height: 17px;
    background-image: url('../assets/chapter-arrow.png');
    background-size: contain;
    background-repeat: no-repeat;
}

#app ol li.active::after {
    top: calc(50% - 7px);
    width: 14px;
    height: 14px;
    background-image: url('../assets/current-chapter-arrow.png');
}

/* .hidden-slides-viewer ol.list ol li {
    background-color: #dce0e7;
  } */

.hidden-slides-viewer ol.list ol li:nth-child(odd) {
    background: #f0f2f5;
}

#app ol.list > li {
    position: relative;
    border-bottom: 1px solid #40536e;
    line-height: 40px;
}

ol.list li > span {
    font-size: 14px;
    line-height: 1.5;
}

.hidden-slides-viewer ol.sublist > li {
    padding: 10px 20px 10px 30px;
    line-height: 1.5;
}

</style>
