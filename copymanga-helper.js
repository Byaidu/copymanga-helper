// ==UserScript==
// @name         ☄️拷贝漫画增强☄️
// @namespace    http://tampermonkey.net/
// @version      6.9
// @description  拷贝漫画去广告🚫、加速访问🚀、并排布局📖、图片高度自适应↕️、辅助翻页↔️、页码显示⏱、侧边目录栏📑、暗夜模式🌙
// @author       Byaidu
// @match        *://*.copymanga.com/*
// @match        *://*.copymanga.org/*
// @license      GNU General Public License v3.0 or later
// @resource     element_css https://unpkg.com/element-ui@2.15.0/lib/theme-chalk/index.css
// @resource     animate_css https://unpkg.com/animate.css@4.1.1/animate.min.css
// @require      https://unpkg.com/vue@2.6.12/dist/vue.min.js
// @require      https://unpkg.com/element-ui@2.15.0/lib/index.js
// @require      https://unpkg.com/axios/dist/axios.min.js
// @require      https://unpkg.com/store.js@1.0.4/store.js
// @require      https://unpkg.com/jquery@3.5.1/dist/jquery.min.js
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @grant        GM_xmlhttpRequest
// @run-at       document-start
// ==/UserScript==

if (/^\/comic\/.*\/.*$/.test(location.pathname)) comicPage();
if (/^\/$/.test(location.pathname)) homePage();

function homePage() {
    GM_addStyle('.header-jum {display:none;}');
}

function comicPage() {
    // 停止加载原生网页
    window.stop();

    // 解析 URL
    var comic = window['location']['pathname']['split']('/')[0x2],
        chapter = window['location']['pathname']['split']('/')[0x4];

    // 加载 HTML
    document.querySelectorAll('html')[0].innerHTML = `
<head></head>
<body>
  <div id="app">
    <div @mouseleave="drawer=false">
      <div @mouseover="drawer=true" style="top:0px;left:0px;height:100vh;width:20vw;position: fixed;"></div>
      <el-drawer
        id="sidebar"
        :size="size"
        :modal="modal"
        :visible="drawer"
        :with-header="false"
        :direction="direction"
        @open="handleOpen">
        <el-menu
          background-color="transparent"
          text-color="#fff"
          active-text-color="#ffd04b"
          @select="handleSelect">
          <template v-for="(item, index) in sidebar_data">
            <el-menu-item v-bind:index="index">{{item.title}}</el-menu-item>
          </template>
        </el-menu>
      </el-drawer>
    </div>
    <div id="matrix">
      <template v-for="(item, index) in comic_data">
        <img class="inner_img" v-bind:src="item.url">
      </template>
    </div>
    <div id="info" @mouseover="show=1" @mouseleave="show=0">
      <transition name="custom-classes-transition" enter-active-class="animate__animated animate__fadeIn" leave-active-class="animate__animated animate__fadeOut">
      <template v-if="show"><div id="info_page" class="info_item" @click="switch_page" style="cursor:pointer;">{{message_page}}</div></template></transition>
      <transition name="custom-classes-transition" enter-active-class="animate__animated animate__fadeIn" leave-active-class="animate__animated animate__fadeOut">
      <template v-if="show"><div id="info_skip" class="info_item" @click="switch_skip" style="cursor:pointer;">{{message_skip}}</div></template></transition>
      <transition name="custom-classes-transition" enter-active-class="animate__animated animate__fadeIn" leave-active-class="animate__animated animate__fadeOut">
      <template v-if="show"><div id="info_switch" class="info_item" @click="switch_night" style="cursor:pointer;">{{message_switch}}</div></template></transition>
      <transition name="custom-classes-transition" enter-active-class="animate__animated animate__fadeIn" leave-active-class="animate__animated animate__fadeOut">
      <template v-if="show"><div id="info_full" class="info_item" @click="switch_full" style="cursor:pointer;">{{message_full}}</div></template></transition>
      <transition name="custom-classes-transition" enter-active-class="animate__animated animate__fadeIn" leave-active-class="animate__animated animate__fadeOut">
      <template v-if="show"><div id="info_home" class="info_item" @click="switch_home" style="cursor:pointer;">{{message_home}}</div></template></transition>
      <template><div id="info_count" class="info_item">{{message_count}}</div></template>
    </div>
  </div>
  <style>
    body {
      text-align: center;
      font-size: 12px;
      line-height: normal;
      background: #edecea;
      margin: unset !important;
    }
    body.dark {
      background: #212121;
    }
    ::-webkit-scrollbar {
      width: 4px;height: 0px;
    }
    ::-webkit-scrollbar-thumb {
      background-color: rgb(48,48,48);
      border-radius: 2px;
    }
    #matrix {
      display: grid;
      justify-items: center;
      justify-content: center;
      overflow-x: hidden;
      user-select: none;
    }
    .page #matrix {
      display: flex;
      flex-direction: row-reverse;
      flex-wrap: wrap;
    }
    .page .inner_img {
      height: 100vh;
    }
    .inner_img {
      max-width: 100%;
    }
    .el-menu {
      border-right: 0px;
    }
    .el-drawer__wrapper {
      width: 20%;
    }
    .el-drawer {
      background: transparent;
    }
    .el-drawer__body {
      background: rgba(0,0,0,.8);
      overflow-y: auto
    }
    #info {
        bottom: 2%;
        right: 2%;
        padding: 5px 5px;
        background: rgba(48,48,48,.7);
        position: fixed;
        color: rgba(255,255,255,.7);
        border-radius: 3px;
    }
    .info_item {
        padding:5px 0px;
        width:120px;
    }
    .skip .blank{
      display:none;
    }
  </style>
</body>
`;

    // 加载 LocalStorage
    let dark = store.get('dark') == true;
    let skip = store.get('skip') == true;
    let page = store.get('page') == true;
    if (dark) {
        document.body.classList.add('dark');
    }
    if (skip) {
        document.body.classList.add('skip');
    }
    if (page) {
        document.body.classList.add('page');
    }

    // 加载 Vue
    var app = new Vue({
        el: '#app',
        data: {
            drawer: false,
            size: '100%',
            modal: false,
            direction: 'ltr',
            sidebar_data: [], // 章节数据源
            comic_data: [],   // 图片数据源
            cur_lock: 0,
            cur_id: 0,
            cur_ch: 0,
            dark: dark,
            page: page,
            skip: skip,
            show: 0,
            full: 0,
        },
        computed: {
            message_home: function () {
                return '⬅️返回目录'
            },
            message_full: function () {
                return this.full ? '↩️退出全屏' : '↕️进入全屏'
            },
            message_switch: function () {
                return this.dark ? '☀️日间模式' : '🌙夜间模式'
            },
            message_page: function () {
                return this.page ? '1️⃣单页排布' : '2️⃣双页排布'
            },
            message_skip: function () {
                return this.skip ? '📑添加空页' : '📄移除空页'
            },
            message_count: function () {
                return (this.skip ? (this.cur_id <= 1 ? this.cur_id : this.cur_id - 1) : this.cur_id) + '/' + (this.comic_data.length + 1 - this.skip)
            }
        },
        methods: {
            handleSelect(key) {
                location.href = this.sidebar_data[key].href;
            },
            handleOpen() {
                setTimeout(() => {
                    let sidebar = document.getElementsByClassName('el-drawer__body')[0],
                        ch_list = sidebar.children[0].children;
                    sidebar.scrollTop = ch_list[Math.max(app.cur_ch - 2, 0)].offsetTop;
                }, 0);
            },
            switch_home: function () {
                location.href = 'https://copymanga.org/comic/' + comic;
            },
            switch_full: function () {
                this.full = !this.full
                if (this.full) {
                    document.documentElement.requestFullscreen()
                } else {
                    document.exitFullscreen();
                }
            },
            switch_night: function () {
                this.dark = !this.dark
                store.set('dark', this.dark);
                document.body.classList.toggle('dark');
            },
            switch_skip: function () {
                this.skip = !this.skip
                store.set('skip', this.skip);
                document.body.classList.toggle('skip');
            },
            switch_page: function () {
                this.page = !this.page
                store.set('page', this.page);
                document.body.classList.toggle('page');
            },
        }
    });

    // 加载 CSS
    const element_css = GM_getResourceText("element_css");
    const animate_css = GM_getResourceText("animate_css");
    GM_addStyle(element_css);
    GM_addStyle(animate_css);

    // 加载图片
    axios.get('https://api.copymanga.org/api/v3/comic/' + comic + '/chapter2/' + chapter, {
        params: { 'timeout': 0x2710 }
    }).then(function (response) {
        document.title=response.data.results.comic.name+' - '+response.data.results.chapter.name;
        var content = response.data.results.chapter.contents,
            matrix = document.getElementById('matrix'),
            words = response.data.results.chapter.words,
            size = response.data.results.chapter.size,
            dict = {};
        for (var i = 0; i < size; i++) dict[words[i]] = i;
        for (var i = 0; i < size; i++) {
            app.comic_data.push({
                url: content[dict[i]].url
            })
        }
        // TODO
        setTimeout(() => {
            let $blank = $('.inner_img:eq(0)').clone();
            $blank.addClass('blank');
            $blank.css('filter', 'brightness(0) invert(1)');
            $('#matrix').prepend($blank);
        }, 0);
    })

    // 加载章节
    axios.get('https://api.copymanga.org/api/v3/comic/' + comic + '/group/default/chapters?limit=0', {
        params: { 'timeout': 0x2710 }
    }).then(function (response) {
        var content = response.data.results.list;
        content.forEach((i) => {
            if (location.href.indexOf(i.uuid) >= 0) {
                app.cur_ch = i.index;
                GM_addStyle('.el-menu>li:nth-child(' + (i.index + 1) + '){background:rgba(255,165,0,.5) !important}');
            }
            app.sidebar_data.push({
                title: i.name,
                href: 'https://copymanga.org/comic/' + comic + '/chapter/' + i.uuid
            })
        })
    })

    //上下方向键滚动页面，左右方向键切换章节
    function scrollUp() {
        let img_list = document.querySelectorAll('.inner_img'),
            first_img = img_list[app.skip ? 1 : 0],
            last_img = img_list[img_list.length - 1];
        if (app.cur_id == 0) return;
        var id = img_list.length + 1;
        for (var i = (app.skip ? 1 : 0) + 1; i <= Math.min(app.cur_id, img_list.length); i++) {
            if (((app.cur_lock && app.cur_id >= 1 && app.cur_id <= img_list.length) ? img_list[app.cur_id - 1].offsetTop : pageYOffset) < img_list[i - 1].offsetTop + img_list[i - 1].offsetHeight + 5) {
                id = i;
                break;
            }
        }
        if (((app.cur_lock && app.cur_id >= 1 && app.cur_id <= img_list.length) ? img_list[app.cur_id - 1].offsetTop : pageYOffset) < first_img.offsetTop + 5) {
            id = 0;
        }
        app.cur_lock++;
        app.cur_id = id;
        setTimeout(function () { app.cur_lock--; }, 500);
        // TODO
        $("html").stop();
        if (id == 0) {
            $("html").animate({ scrollTop: 0 }, 500);
        } else {
            $("html").animate({ scrollTop: img_list[id - 1].offsetTop }, 500);
        }
    }
    function scrollDown() {
        let img_list = document.querySelectorAll('.inner_img'),
            first_img = img_list[app.skip ? 1 : 0],
            last_img = img_list[img_list.length - 1];
        if (app.cur_id == img_list.length + 1) return;
        var id = img_list.length + 1;
        for (var i = Math.max(app.cur_id, (app.skip ? 1 : 0) + 1); i <= img_list.length; i++) {
            if (((app.cur_lock && app.cur_id >= 1 && app.cur_id <= img_list.length) ? img_list[app.cur_id - 1].offsetTop : pageYOffset) < img_list[i - 1].offsetTop - 5) {
                id = i;
                break;
            }
        }
        app.cur_lock++;
        app.cur_id = id;
        setTimeout(function () { app.cur_lock--; }, 500);
        // TODO
        $("html").stop();
        if (id == img_list.length + 1) {
            $("html").animate({ scrollTop: last_img.offsetTop + last_img.offsetHeight }, 500);
        } else {
            $("html").animate({ scrollTop: img_list[id - 1].offsetTop }, 500);
        }
    }
    document.getElementById('matrix').onclick = function (event) {
        if (event.clientY > $(window).height() / 2) {
            if (app.page) scrollDown();
        } else {
            if (app.page) scrollUp();
        }
    }
    document.body.onkeydown = function (event) {
        if (event.keyCode == 38) {
            if (app.page) scrollUp();
        } else if (event.keyCode == 40) {
            if (app.page) scrollDown();
        } else if (event.keyCode == 37) {
            location.href = app.sidebar_data[app.cur_ch - 1].href;
        } else if (event.keyCode == 39) {
            location.href = app.sidebar_data[app.cur_ch + 1].href;
        } else if (event.keyCode == 13) {
            app.switch_full();
        } else if (event.keyCode == 8) {
            location.href = 'https://copymanga.org/comic/' + comic;
        }
    }

    // 加载当前页码
    function getID() {
        let cur_id = 0,
            img_list = document.querySelectorAll('.inner_img'),
            first_img = img_list[app.skip ? 1 : 0],
            last_img = img_list[img_list.length - 1];
        if (img_list.length > 0) {
            img_list.forEach((i, index) => {
                if (pageYOffset > i.offsetTop - 5 && pageYOffset < i.offsetTop + i.offsetHeight - 5 && cur_id == 0) {
                    cur_id = index + 1;
                }
            });
            if (pageYOffset > last_img.offsetTop + last_img.offsetHeight - 5)
                cur_id = img_list.length + 1;
            if (app.cur_lock == 0) app.cur_id = cur_id;
        }
    }
    setInterval(getID, 100);
    window.addEventListener('mousewheel', getID);
}
