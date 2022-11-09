<template>
  <div id="slidesList">
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
export default {
  name: 'slides-list',
  data: function () {
    return {
      listItemHeight: 0,
      currentSlideIndex: 0,
      currentSubSlideIndex: undefined
    }
  },
  watch: {
    startSlideIndex() {
      this.currentSlideIndex = this.startSlideIndex;
    },
    currentSlideIndex(newValue, oldValue) {
      this.slides[oldValue].active = false;
      this.slides[newValue].active = true;
      this.updateSubSlide(this.subSlideIndex);
      this.$forceUpdate();
    },
    subSlideIndex() {
      this.currentSubSlideIndex = this.subSlideIndex;
    },
    currentSubSlideIndex(newValue) {
      this.updateSubSlide(newValue);
      this.$forceUpdate();
    },
  },
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
  methods: {
    getLi(slide) {
      this.$refs.index.innerHTML = slide.title;
      return slide.title;
    },
    onClick(index, subSlideIndex) {
      if (this.subSlidesActive || (!subSlideIndex)) {
        this.$emit("changeActiveItem", {
          currentSlideIndex: index,
          currentSubSlideIndex: subSlideIndex
        });
      }
    },
    scrollToActive() {
      this.listItemHeight = this.$el.querySelector("li.active");
      if(this.listItemHeight){
        this.$el.scrollTop = Math.round(this.listItemHeight.offsetTop - this.listItemHeight.parentElement.offsetTop);

        if (this.startSlideIndex !== 0 && this.slides[this.startSlideIndex].hidden) {
          this.$el.scrollTop = this.$el.scrollHeight;
        }
      }
      
    },
    updateSubSlide(newValue) {
      this.slides.forEach((slide, index) => {
        slide.subSlides && slide.subSlides.forEach((subSlide, subIndex) => {
          if (index === this.currentSlideIndex && subIndex === newValue) {
            subSlide.active = true;
          } else {
            subSlide.active = false;
          }
        });
      });
    }
  },
  updated() {
    this.scrollToActive();
  },
  mounted() {
    this.currentSlideIndex = this.startSlideIndex;
    this.scrollToActive();
  }
}
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
