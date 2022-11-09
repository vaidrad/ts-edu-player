# Aem video slides

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles for production
```
npm run build
```

> В файле `vue.config.js` в свойстве `publicPath` можно указать путь относительно домена сайта к рессурсам компонента.<br>

<b>Структура файлов которые использует компонент выглядит так:</b> 
   
    ├───publicPath
    │   ├───js 
    │   ├───config.json   
    
> В файле `config.json`  настройки <b>brightcove</b> плеера, путей к картинкам слайдов, и время переключения слайдов.

> Для деплоя на сайт - файлы из папки `dist` залить согласно структуре выше и в <b>HTML component</b> вставить код из `index.html`

## config.json

<b>example:</b>
```javascript
{
    "accountCode": "5662516403001", //сhannel ID on the brightcove
    "playerCode": "0hVpNUYdY",  // player id
    "slidesViewer": true, // is slidesViewer active?
    "isVideoBig": true, // if true, by defauld video will be big - only if slidesViewer is active
    "isSwitchDisabled": false, // if true, user cant change the video and presentation positions - only if slidesViewer is active
    "showBrightcovePlayer": true, // property to display Brightcove Player and block pushing video events to dataLayer
    "onlyPlayer": false, // if true, chapter's and slides will be hidden - only if slidesViewer is not active
    "title": "Title", // input the title name, will be displayed in top left corner of the video 
    "chapters": [ 
        {
            "videoID": "6039289680001", // video id
            "slides": [  //list item 
                {
                    "title": "About SMA", //list name
                    "imageUrl": "https://storage.googleapis.com/intl_static_files/img/sma_nordics_webinar_slides/Slde%20deck%20Webinar_Page_02.png", //presentation image
                    "time": 139 //time when the presentation image will be display
                    "subSlides": [
                        {
                            "title": "Introduction to DMF in MS",
                            "imageUrl": "https://storage.googleapis.com/intl_static_files/img/sma_nordics_webinar_slides/Slde%20deck%20Webinar_Page_04.png", //presentation image for subslide
                            "time": 175 //time when presentation subslide image will be dislay
                        }
                    ]
                },
                {
                    "title": "About SMA", 
                    "imageUrl": "https://storage.googleapis.com/intl_static_files/img/sma_nordics_webinar_slides/Slde%20deck%20Webinar_Page_02.png",
                    "time": 139 
                }
            ]
        }
    ]
}
```
