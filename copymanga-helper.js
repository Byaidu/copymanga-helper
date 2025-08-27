// ==UserScript==
// @name         ☄️拷贝漫画增强☄️
// @namespace    http://tampermonkey.net/
// @version      12.0
// @description  拷贝漫画去广告🚫、加速访问🚀、并排布局📖、图片高度自适应↕️、辅助翻页↔️、页码显示⏱、侧边目录栏📑、暗夜模式🌙、章节评论💬
// @author       Byaidu
// @match        *://*.copymanga.com/*
// @match        *://*.copymanga.org/*
// @match        *://*.copymanga.net/*
// @match        *://*.copymanga.info/*
// @match        *://*.copymanga.site/*
// @match        *://*.copymanga.tv/*
// @match        *://*.mangacopy.com/*
// @match        *://*.copy20.com/*
// @match        *://*.2025copy.com/*
// @match        *://copymanga.com/*
// @match        *://copymanga.org/*
// @match        *://copymanga.net/*
// @match        *://copymanga.info/*
// @match        *://copymanga.site/*
// @match        *://copymanga.tv/*
// @match        *://mangacopy.com/*
// @match        *://copy20.com/*
// @match        *://2025copy.com/*
// @license      GNU General Public License v3.0 or later
// @resource     element_css https://unpkg.com/element-ui@2.15.13/lib/theme-chalk/index.css
// @resource     animate_css https://unpkg.com/animate.css@4.1.1/animate.min.css
// @require      https://unpkg.com/vue@2.7.14/dist/vue.min.js
// @require      https://unpkg.com/element-ui@2.15.13/lib/index.js
// @require      https://unpkg.com/axios@1.3.6/dist/axios.min.js
// @require      https://unpkg.com/store.js@1.0.4/store.js
// @require      https://unpkg.com/jquery@3.6.4/dist/jquery.min.js
// @require      https://unpkg.com/jszip@3.1.5/dist/jszip.min.js
// @require      https://unpkg.com/file-saver@2.0.5/dist/FileSaver.min.js
// @require      https://unpkg.com/crypto-js@4.1.1/crypto-js.js
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @grant        GM_xmlhttpRequest
// @run-at       document-start
// ==/UserScript==

var largeMode = 1;
var enableDownload = 0;
var getPictureMode = 1;

// retry
axios.interceptors.response.use(undefined, (err) => {
    return new Promise((resolve) => { setTimeout(() => { resolve() }, 1000) }).then(() => axios(err.config));
});

function route() {
    if (document.getElementsByClassName('ban').length) banPage();
    else if (/^\/comic\/.*\/.*$/.test(location.pathname)) comicPage(1);
    else if (/^\/comic\/[^\/]*$/.test(location.pathname)) tablePage(1);
    else if (/^\/$/.test(location.pathname)) homePage();
    else if (/^\/h5\/details\/comic\/[^\/]*$/.test(location.pathname)) tablePage(0);
    else if (/^\/h5\/comicContent\/.*$/.test(location.pathname)) comicPage(0);
}

route();

if (/^\/h5.*$/.test(location.pathname)) {
    let previousUrl = location.href;
    const observer = new MutationObserver(function (mutations) {
        if (location.href !== previousUrl) {
            previousUrl = location.href;
            route();
        }
    });
    const config = { subtree: true, childList: true };
    observer.observe(document, config);
}

async function loadCSS() {
    var element_css, animate_css;
    if (typeof (GM_getResourceText) == 'undefined') {
        await axios.get('https://unpkg.com/element-ui@2.15.0/lib/theme-chalk/index.css')
            .then(function (response) {
                element_css = response.data;
            })
        await axios.get('https://unpkg.com/animate.css@4.1.1/animate.min.css')
            .then(function (response) {
                animate_css = response.data;
            })
    } else {
        element_css = GM_getResourceText("element_css");
        animate_css = GM_getResourceText("animate_css");
    }
    GM_addStyle(element_css);
    GM_addStyle(animate_css);
}

function banPage() {
    window.stop();

    document.querySelectorAll('main')[0].innerHTML = `
<p class="ban"><img class="banIcon" src="https://hi.est152.com/static/websitefree/jpg/logo.png" alt=""></p>
<p class="textItem">来自 ☄️拷贝漫画增强☄️ 的消息：</p>
<p class="textItem">请安装 <a href="https://chrome.google.com/webstore/detail/user-agent-switcher-and-m/bhchdcejhohfmigjafbampogmaanbfkg">User-Agent Switcher and Manager</a> 插件并切换浏览器 UA</p>
`
}

function homePage() {
    GM_addStyle('.header-jum {display:none;}');
}

function makeRequest(options) {
    const {url, isPC, headers, params} = options;
    if (isPC) {
        // axios
        return axios.get(url, {headers, params});
    } else {
        const urlParams = new URLSearchParams(params);
        const fullUrl = `${url}?${urlParams.toString()}`;
        // gm绕过ua
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                url: fullUrl,
                headers: headers,
                responseType:'json',
                onload: function(response) {
                    if (response.response === undefined){
                        resolve({data:response.responseText});
                    } else {
                       resolve({data:response.response});
                    }
                },
                onerror: function(error) {
                    reject(error);
                }
            });
        });
    }
}

async function getAesName(url, isPC, fileName) {
    let aesKeyName;
    const request = {
        url: url,
        isPC: isPC
    };
    const regexName = /\[.*?\]\['parse'\]\((.*?)\)/;
    const response = await makeRequest(request);
    const parser = new DOMParser();
    const doc = parser.parseFromString(response.data, "text/html");
    const scripts = doc.querySelectorAll('script');
    if (fileName !== undefined){
        for (const script of scripts) {
            if (script.src.includes(fileName)) {
                const request = {
                    url: script.src,
                    isPC: isPC
                };
                const response = await makeRequest(request);
                const scriptText = response.responseText;
                const evalRegex = /^\s*eval\(\s*(.+)\s*\)\s*$/s;
                const match = scriptText.match(evalRegex);
                const innerCode = match[1];
                const executeCode = new Function('return ' + innerCode);
                const result = executeCode();
                const matchName = result.match(regexName);
                if (matchName && matchName[1]) {
                    aesKeyName = matchName[1];
                    break;
                }
            }
        }
    }
    return [aesKeyName,doc];
}

async function getAesKey(url, isPC, defaultName, fileName) {
    const result = await getAesName(url, isPC, fileName);
    let aesKeyValue = [];
    let aesKeyName = result[0];
    const doc = result[1];
    const scripts = doc.querySelectorAll('script');
    for (let i = 0; i < defaultName.length; i++) {
        if (result[0] === undefined){
            aesKeyName = defaultName[i];
        }
        for (const script of scripts) {
            if (script.textContent.includes(aesKeyName)) {
                const regexValue = new RegExp(`var\\s+${aesKeyName}\\s*=\\s*['"]?([^'";\\s]+)['"]?`);
                const matchValue = script.textContent.match(regexValue);
                if (matchValue && matchValue[1]) {
                    aesKeyValue.push(matchValue[1]);
                    break;
                }
            }
        }
    }
    return [aesKeyValue, doc];
}

async function apiChapters(comic,isPC) {
    const aesKeyName = 'ccz';
    const headers = {'dnts': '1'};
    const request = {
        url: window.location.origin + '/comicdetail/' + comic + '/chapters',
        isPC: isPC,
        headers:headers
    };
    const results = await Promise.all([
        getAesKey(
            window.location.origin + '/comic/' + comic,
            isPC,
            [aesKeyName]
            ),
        makeRequest(request)
    ]);
    let iv = results[1].data.results.substring(0, 16),
                cipher = results[1].data.results.substring(16),
                result = JSON.parse(CryptoJS.AES.decrypt(
                    CryptoJS.enc.Base64.stringify(
                        CryptoJS.enc.Hex.parse(cipher)
                    ),
                    CryptoJS.enc.Utf8.parse(results[0][0]),
                    {
                        'iv': CryptoJS.enc.Utf8.parse(iv),
                        'mode': CryptoJS.mode.CBC,
                        'padding': CryptoJS.pad.Pkcs7
                    }
                ).toString(CryptoJS.enc.Utf8));
            let type_map = new Map();
            result.build.type.forEach((v, index) => {
                type_map.set(v.id, v.name);
            });
            result.groups.default.chapters.forEach((v, index) => {
                v.index = index;
                let type_name = type_map.get(v.type);
                v.name = "【" + type_name + "】" + v.name;
                v.type_name = type_name;
            });
            return result;
}

function tablePage(isPC) {
    loadCSS();
    var collect, save,
        comic,
        content_comic = [],
        app;
    if (isPC)
        comic = window.location.pathname.split('/')[2];
    else
        comic = window.location.pathname.split('/')[4];
    $(() => {
        if (enableDownload) {
          GM_addStyle('.comicParticulars-botton:nth-of-type(4) {background: lightskyblue;}');
          if (isPC)
              collect = document.getElementsByClassName('collect')[0];
          else
              collect = document.getElementsByTagName('button')[2];
          save = collect.cloneNode();
          save.innerHTML = '批量下载';
          save.onclick = saveComic;
          collect.after(save);
          var app_html = document.createElement("div");
          app_html.innerHTML = `
  <div id="app_save">
    下载范围：
    <el-select v-model="begin" placeholder="起始话" size="mini" style="width:150px;">
      <el-option
        v-for="item in content_comic"
        :key="item.index"
        :label="item.name"
        :value="item.index">
      </el-option>
    </el-select>
    至
    <el-select v-model="end" placeholder="终止话" size="mini" style="width:150px;margin-right:20px;">
      <el-option
        v-for="item in content_comic"
        :key="item.index"
        :label="item.name"
        :value="item.index">
      </el-option>
    </el-select>
  </div>
  `
          collect.after(app_html);
          if (isPC)
              document.getElementById('app_save').setAttribute('style', 'margin-top:18px;');
          else
              document.getElementsByClassName('detailsTextContentItem')[0].setAttribute('style', 'flex-wrap:wrap;');
          app = new Vue({
              el: '#app_save',
              data: {
                  content_comic: [],
                  begin: '',
                  end: '',
              },
          })
          GM_addStyle('.el-input__suffix {display:none !important;}');
          apiChapters(comic,isPC)
              .then(function (response) {
                  content_comic = response.groups.default.chapters;
                  app.content_comic = content_comic;
                  app.begin = content_comic.at(0).index;
                  app.end = content_comic.at(-1).index;
              }).catch(function (error) {
                  save.innerHTML = '下载失败';
              })
        }
        cookieStore.get('token')
            .then(function (token) {
                if (token) {
                    axios.get('https://api.mangacopy.com/api/v3/comic2/query/' + comic, {
                        headers: {
                            'authorization': 'Token ' + token.value
                        }
                    }).then(function (response) {
                        if (response.data.results.browse != null) {
                            var read = document.getElementsByClassName('comicParticulars-botton')[0];
                            read.innerHTML = response.data.results.browse.chapter_name;
                            read.href = window.location.origin + '/comic/' + comic + '/chapter/' + response.data.results.browse.chapter_uuid;
                            GM_addStyle('.comicParticulars-botton {max-width:80px; overflow: hidden;text-overflow: ellipsis; white-space: nowrap;}');
                        }
                    });
                }
            })
    })
    let sleep = function (time) {
        return new Promise((resolve) => {
            setTimeout(resolve, time)
        })
    }
    async function saveComic() {
        let zip = new JSZip();
        let task_cnt = 0;
        let date_created_chapter_map = new Map();
        let comic_name = null;
        for (let idx = app.begin; idx <= app.end; idx++) {
            let c = content_comic[idx];
            task_cnt++;
            save.innerHTML = task_cnt + '/' + (app.end - app.begin + 1);
            await axios.get('https://api.mangacopy.com/api/v3/comic/' + comic + '/chapter/' + c.id)
                .then(async function (response) {
                    let task_chapter = [];
                    var chpt_index = Number(response.data.results.chapter.index) + 1
                    let dir_chpt_name = response.data.results.chapter.name
                    if (c.type_name !== undefined) {
                        dir_chpt_name = "【" + chpt_index + "】【" + c.type_name + "】" + dir_chpt_name;
                    }
                    let dir_comic = zip.folder(response.data.results.comic.name)
                    let content = response.data.results.chapter.contents,
                        size = content.length,
                        dict = {};
                    comic_name = response.data.results.comic.name;
                    let date_created_chapter = new Date(response.data.results.chapter.datetime_created);
                    if (idx != app.begin && date_created_chapter.getTime() <= date_created_chapter_map.get(idx - 1).getTime()) {
                        date_created_chapter = new Date(date_created_chapter_map.get(idx - 1).getTime() + 2000);
                    }
                    date_created_chapter_map.set(idx, date_created_chapter);
                    dir_comic.file(dir_chpt_name, null, {
                        dir: true,
                        date: date_created_chapter,
                    });
                    let dir_chpt = dir_comic.folder(dir_chpt_name);
                    for (let i = 0; i < size; i++) {
                        (() => {
                            let self = i;
                            let img_url = content[i].url;
                            if (largeMode) img_url = img_url.replace('c800x.jpg', 'c1500x.jpg');
                            task_chapter.push(axios.get(img_url, { responseType: 'arraybuffer' })
                                .then(function (response) {
                                    let date_created_file = new Date(date_created_chapter.getTime() + 2000 * self);
                                    dir_chpt.file((self + 1) + '.jpg', response.data, { date: date_created_file });
                                }).catch(function (error) {
                                    save.innerHTML = '下载失败';
                                }))
                        })()
                    }
                    await axios.all(task_chapter);
                }).catch(function (error) {
                    save.innerHTML = '下载失败';
                })
            await sleep(1000);
        }
        zip.generateAsync({ type: "blob" }, function (metadata) {
            save.innerHTML = metadata.percent.toFixed(0) + '%';
        }).then(function (blob) {
            saveAs(blob, comic_name + ".zip");
            save.innerHTML = '下载完成';
        })
    }
}

async function comicPage(isPC) {
    // 停止加载原生网页
    window.stop();

    // 解析 URL
    if (isPC) {
        comic = window.location.pathname.split('/')[2];
        chapter = window.location.pathname.split('/')[4];
    } else {
        comic = window.location.pathname.split('/')[3];
        chapter = window.location.pathname.split('/')[4];
    }

    // 加载 HTML
    document.querySelectorAll('html')[0].innerHTML = `
<head></head>
<body>
  <div id="app">
    <div @mouseleave="drawer=false; isClickable=false">
      <div @mouseover="drawer=true" style="top:0px;left:0px;height:100vh;width:10vw;position: fixed;"></div>
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
            <el-menu-item v-bind:index="index" :disabled="!isClickable">{{item.title}}</el-menu-item>
          </template>
        </el-menu>
      </el-drawer>
    </div>
    <div id="matrix">
      <template v-for="(item, index) in comic_data">
        <img class="inner_img" v-bind:src="item.url">
      </template>
    </div>
    <ul style="margin-top:20px;">
      <template v-for="(item, index) in comment_data">
        <li style="display:inline-block;">
          <p class="comment" v-bind:index="index">{{item.user_name}} : {{item.comment}}</p>
        </li>
      </template>
    <ul>
    <el-input v-model="comment_input" placeholder="吐槽" style="width:300px;margin:20px;" @keyup.enter.native="send_comment" @focus="is_input=1" @blur="is_input=0">
      <el-button slot="append" type="primary" @click="send_comment">发表</el-button>
    </el-input>
    <ul style="margin-bottom:20px;">
      <el-button type="primary" @click="prev_chapter">上一章</el-button>
      <el-button type="primary" @click="next_chapter">下一章</el-button>
    </ul>
    <div id="info" @mouseover="show=1" @mouseleave="show=0">
      <transition name="custom-classes-transition" enter-active-class="animate__animated animate__fadeIn" leave-active-class="animate__animated animate__fadeOut">
      <template v-if="show"><div id="info_scroll" class="info_item" @click="switch_scroll" style="cursor:pointer;">{{message_scroll}}</div></template></transition>
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
      margin: 0 auto;
      max-width: 190vh;
    }
    .page #matrix {
      display: flex;
      flex-direction: row-reverse;
      flex-wrap: wrap;
    }
    .scroll #matrix {
      display: flex;
      flex-direction: row-reverse;
      flex-wrap: wrap;
      justify-content: unset;
      flex-wrap: unset;
      overflow-x: scroll;
    }
    .scroll .inner_img {
      height: 100vh;
      object-fit: contain;
    }
    .page .inner_img {
      height: 100vh;
      object-fit: contain;
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
    .skip .blank {
      display:none;
    }
    .dark .comment {
        color: rgba(255,255,255,.7);
    }
    .dark .el-input__inner {
        background-color:rgba(255,255,255,.05);
        color: rgba(255,255,255,.7);
    }
    .dark .el-input-group__append {
        background-color:rgba(255,255,255,.2);
        color: rgba(255,255,255,.7);
    }
    .dark .el-button {
        background-color:rgba(255,255,255,.2);
        color: rgba(255,255,255,.7);
        border: 1px solid #DCDFE6;
    }
    .comment {
      padding: 10px 13px;
      margin:5px 5px;
      font-size:14px;
      background-color:rgb(127,127,127,.15);
    }
    ul {
      margin: 5px;
      padding: unset;
    }
  </style>
</body>
`;

    loadCSS();

    // 加载 LocalStorage
    let dark = store.get('dark');
    let skip = store.get('skip');
    let page = store.get('page');
    let scroll = store.get('scroll');
    if (dark == undefined)
        dark = true;
    if (skip == undefined)
        skip = true;
    if (page == undefined)
        page = true;
    if (scroll == undefined)
        scroll = false;
    if (dark) {
        document.body.classList.add('dark');
    }
    if (skip) {
        document.body.classList.add('skip');
    }
    if (page) {
        document.body.classList.add('page');
    }
    if (scroll) {
        document.body.classList.add('scroll');
    }

    // 加载 Vue
    var app = new Vue({
        el: '#app',
        data: {
            drawer: false,
            isClickable: false,
            size: '100%',
            modal: false,
            direction: 'ltr',
            sidebar_data: [], // 章节数据源
            comic_data: [],   // 图片数据源
            comment_data: [], // 评论数据源
            comment_input: '',
            is_input: 0,
            cur_lock: 0,
            cur_id: 0,
            cur_ch: 0,
            dark: dark,
            page: page,
            skip: skip,
            scroll: scroll,
            show: 0,
            full: 0,
        },
        computed: {
            message_home: function () {
                return '⬅️返回目录';
            },
            message_full: function () {
                return this.full ? '↩️退出全屏' : '↕️进入全屏';
            },
            message_switch: function () {
                return this.dark ? '☀️日间模式' : '🌙夜间模式';
            },
            message_page: function () {
                return this.page ? '1️⃣单页排布' : '2️⃣双页排布';
            },
            message_skip: function () {
                return this.skip ? '📑添加空页' : '📄移除空页';
            },
            message_scroll: function () {
                return this.scroll ? '⏬纵向滚动' : '⏪横向滚动';
            },
            message_count: function () {
                return (this.skip ? (this.cur_id <= 1 ? this.cur_id : this.cur_id - 1) : this.cur_id) + '/' + (this.comic_data.length + 1 - this.skip);
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
                setTimeout(() => {
                    this.isClickable = true;
                }, 10);
            },
            switch_home: function () {
                location.href = window.location.origin + '/comic/' + comic;
            },
            switch_full: function () {
                this.full = !this.full;
                if (this.full) {
                    document.documentElement.requestFullscreen();
                } else {
                    document.exitFullscreen();
                }
            },
            switch_night: function () {
                this.dark = !this.dark;
                store.set('dark', this.dark);
                document.body.classList.toggle('dark');
            },
            switch_skip: function () {
                this.skip = !this.skip;
                store.set('skip', this.skip);
                document.body.classList.toggle('skip');
            },
            switch_page: function () {
                this.page = !this.page;
                store.set('page', this.page);
                document.body.classList.toggle('page');
            },
            switch_scroll: function () {
                this.scroll = !this.scroll;
                store.set('scroll', this.scroll);
                document.body.classList.toggle('scroll');
            },
            send_comment: async function () {
                let token = await cookieStore.get('token');
                await axios.post('https://api.mangacopy.com/api/v3/member/roast', 'chapter_id=' + chapter + '&roast=' + this.comment_input + '&_update=true', {
                    headers: {
                        'authorization': 'Token ' + token.value
                    }
                }).then(function (response) {
                    app.comment_input = response.data.message;
                });
                await this.load_comment();
            },
            load_comment: async function () {
                await axios.get('https://api.mangacopy.com/api/v3/roasts?chapter_id=' + chapter + '&limit=100&offset=0&_update=true')
                    .then(function (response) {
                        app.comment_data = response.data.results.list;
                    })
            },
            prev_chapter: function () {
                location.href = app.sidebar_data[app.cur_ch - 1].href;
            },
            next_chapter: function () {
                location.href = app.sidebar_data[app.cur_ch + 1].href;
            },
        }
    });

    // 加载图片
    //通过图片List
    if (getPictureMode){
        const request = {
            url: 'https://api.2025copy.com/api/v3/comic/' + comic + '/chapter/' + chapter,
            isPC: isPC
        };
        const response = await makeRequest(request);
        document.title = response.data.results.comic.name + ' - ' + response.data.results.chapter.name;
        var content = response.data.results.chapter.contents;
    } else {
        //通过加密数据
        const contentName = 'contentKey';
        const aesKeyName = 'cct';
        const results = await getAesKey(
            window.location.origin + '/comic/' + comic + '/chapter/' + chapter,
            isPC,
            [contentName, aesKeyName]
            );
        const doc = results[1];
        const scripts = doc.querySelectorAll('script');
        const parts = doc.title.split(" - ")
        document.title = parts[0] + ' - ' + parts[1];
        const contentValue = results[0][0];
        const aesKeyValue = results[0][1];
        let iv = contentValue.substring(0, 16),
            cipher = contentValue.substring(16);
        content = JSON.parse(CryptoJS.AES.decrypt(
                CryptoJS.enc.Base64.stringify(
                    CryptoJS.enc.Hex.parse(cipher)
                ),
                CryptoJS.enc.Utf8.parse(aesKeyValue),
                {
                    'iv': CryptoJS.enc.Utf8.parse(iv),
                    'mode': CryptoJS.mode.CBC,
                    'padding': CryptoJS.pad.Pkcs7
                }
            ).toString(CryptoJS.enc.Utf8));
    }
    const matrix = document.getElementById('matrix'),
          size = content.length,
          dict = {};
    for (let i = 0; i < size; i++) {
        let img_url = content[i].url;
        if (largeMode) img_url = img_url.replace('c800x.jpg', 'c1500x.jpg');
        app.comic_data.push({
            url: img_url
        })
    }
    // TODO
    setTimeout(() => {
        let $blank = $('.inner_img:eq(0)').clone();
        $blank.addClass('blank');
        $blank.css('filter', 'brightness(0) invert(1)');
        $('#matrix').prepend($blank);
    }, 0);

    // 加载章节
    apiChapters(comic,isPC)
        .then(function (response) {
            // var content = response.groups.default.chapters;
            var content = Object.values(response.groups).flatMap(obj => obj.chapters);
            content.forEach((i,index) => {
                if (location.href.indexOf(i.id) >= 0) {
                    app.cur_ch = index;
                    GM_addStyle('.el-menu>li:nth-child(' + (index + 1) + '){background:rgba(255,165,0,.5) !important}');
                }
                app.sidebar_data.push({
                    title: i.name,
                    href: window.location.origin + '/comic/' + comic + '/chapter/' + i.id
                })
            })
        })

    // 加载评论
    app.load_comment();

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
        if (!app.is_input) {
            if (app.scroll) {
                switch(event.keyCode) {
                case 38:
                    app.prev_chapter();
                    break;
                case 40:
                    app.next_chapter();
                    break;
                }
            } else {
                switch(event.keyCode) {
                case 38:
                    if (app.page) scrollUp();
                    break;
                case 40:
                    if (app.page) scrollDown();
                    break;
                case 37:
                    app.prev_chapter();
                    break;
                case 39:
                    app.next_chapter();
                    break;
                }
            }
            if (event.keyCode == 13) {
                app.switch_full();
            } else if (event.keyCode == 8) {
                location.href = window.location.origin + '/comic/' + comic;
            }
        }
    }

    // 加载当前页码
    function getID() {
        let cur_id = 0,
            img_list = document.querySelectorAll('.inner_img'),
            first_img = img_list[app.skip ? 1 : 0],
            last_img = img_list[img_list.length - 1];
        if (img_list.length > 0) {
            if (app.scroll) {
                let progress = matrix.scrollLeft / (matrix.scrollWidth - matrix.clientWidth);
                progress = Math.max(0, Math.min(1, Math.abs(progress)));
                let referenceX = matrix.clientWidth - matrix.clientWidth * progress + matrix.offsetLeft;
                referenceX = Math.round(referenceX);
                for (let i = 0; i < img_list.length; i++) {
                    const imgOffsetLeft = Math.round(img_list[i].getBoundingClientRect().left);
                    const imgPosition = [imgOffsetLeft - 1, imgOffsetLeft + img_list[i].clientWidth +1];
                    if (imgPosition[1] > referenceX && referenceX > imgPosition[0]) {
                        cur_id = i + 1;
                        break;
                    }
                }
            } else {
                for (let i = 0; i < img_list.length; i++) {
                    if (pageYOffset > img_list[i].offsetTop - 5 && pageYOffset < img_list[i].offsetTop + img_list[i].offsetHeight - 5 && cur_id == 0) {
                        cur_id = i + 1;
                        break;
                    }
                }
                if (pageYOffset > last_img.offsetTop + last_img.offsetHeight - 5)
                    cur_id = img_list.length + 1;
            }
            if (app.cur_lock == 0) app.cur_id = cur_id;
        }
    }
    setInterval(getID, 100);
    window.addEventListener('mousewheel', getID);
    window.addEventListener('error', event => {
        let target = event.target || event.srcElement;
        let isElementTarget = target instanceof HTMLImageElement;
        if (!isElementTarget) return false;
        let url = target.src;
        setTimeout(() => {
            target.src = url;
        }, Math.floor(Math.random() * 2000) + 1);
    }, true);
}