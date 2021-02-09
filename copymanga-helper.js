// ==UserScript==
// @name         ☄️拷贝漫画增强☄️
// @namespace    http://tampermonkey.net/
// @version      3.8
// @description  拷贝漫画去广告🚫，对日漫版漫画页进行增强：并排布局📖、图片高度自适应↕️、辅助翻页↔️、页码显示⏱、侧边目录栏📑、暗夜模式🌙，请设置即时注入模式以避免页面闪烁⚠️
// @author       Byaidu
// @match        *://copymanga.com/*
// @license      GNU General Public License v3.0 or later
// @resource     animate_css https://cdn.jsdelivr.net/npm/animate.css@4.1.1/animate.min.css
// @resource     element_css https://unpkg.com/element-ui@2.15.0/lib/theme-chalk/index.css
// @require      https://cdn.jsdelivr.net/npm/vue@2.6.12/dist/vue.min.js
// @require      https://cdn.jsdelivr.net/npm/jquery@3.5.1/dist/jquery.min.js
// @require      https://cdn.jsdelivr.net/npm/jquery.cookie@1.4.1/jquery.cookie.js
// @require      https://unpkg.com/element-ui@2.15.0/lib/index.js
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @grant        GM_xmlhttpRequest
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';
    //去广告
    GM_addStyle('*[style*="position: relative;"]{display:none !important;}')
    GM_addStyle('.header-jum{display:none !important;}')
    //漫画页检测
    if(location.href.indexOf("chapter")>=0){
        //固定header
        GM_addStyle('.header{position:unset !important;}')
        //去除footer
        GM_addStyle('.footer{display:none !important;}')
        //文字居中
        GM_addStyle('body{text-align:center !important;font-size:12px !important;line-height: normal !important;}')
        //图片居中
        GM_addStyle('ul{padding:0px !important;}')
        //body全屏
        GM_addStyle('body{height:unset !important;}')
        //修改滚动条样式
        GM_addStyle('::-webkit-scrollbar {width: 4px;height: 0px;}')
        GM_addStyle('::-webkit-scrollbar-thumb {background-color: rgb(48,48,48);border-radius: 2px;}')
        //修改element-ui样式
        GM_addStyle('.el-menu{border-right:0px !important;}')
        GM_addStyle('.el-drawer__wrapper{width:20%;}')
        GM_addStyle('.el-drawer{background:transparent !important;}')
        GM_addStyle('.el-drawer__body{background:rgba(0,0,0,.8) !important;overflow-y: auto}')
        //漫画单页排布
        GM_addStyle('.comicContent{margin-top:20px;user-select: none;}')
        GM_addStyle('.comicContent img{height:150vh;margin-bottom: 50px;!important;width:unset !important;}')
        //漫画双页排布
        GM_addStyle('.page_double .comicContent ul{justify-content:center;flex-direction: row-reverse;display: flex;flex-wrap: wrap;}')
        GM_addStyle('.page_double .comicContent img{height:100vh !important;}')
        //引入css
        const animate_css = GM_getResourceText("animate_css");
        const element_css = GM_getResourceText("element_css");
        GM_addStyle(animate_css);
        GM_addStyle(element_css);
        GM_addStyle(':root{--animate-duration:500ms;}')
        //更改跨页
        GM_addStyle('.skip{display:none !important;}')
        //日间模式
        GM_addStyle("body{background:#edecea !important;}")
        //夜间模式
        GM_addStyle("html{background:transparent !important;}")
        GM_addStyle(".dark_mode body{background:#212121 !important;}")
        //读取cookie
        if ($.cookie('dark_mode') === undefined) { $.cookie('dark_mode',true,{expires:999999,path:'/'}); }
        if ($.cookie('page_double') === undefined) { $.cookie('page_double',true,{expires:999999,path:'/'}); }
        var dark_mode = $.cookie('dark_mode')=='true';
        var page_double = $.cookie('page_double')=='true';
        //暗夜模式
        if (dark_mode){
            $('html').addClass('dark_mode');
        }else{
            $('html').removeClass('dark_mode');
        }
        //双页显示
        if (page_double){
            $('html').addClass('page_double');
        }else{
            $('html').removeClass('page_double');
        }
        //延迟加载
        $(function delay(){
            let img_id=0;
            let middle=0;
            let ch_id=0;
            //计算页数
            if (typeof(g_max_pic_count)=='undefined'){
                window.el = $( '<iframe src="'+$('.list a').attr('href')+'" style="display:none;"></iframe>' );
                $('body').append(el);
                setTimeout(function(){
                    window.g_max_pic_count=$('.comicContent ul img').length;
                    delay();
                },300)
                return;
            }
            //去除憨批类
            $('.comicContent-image-all').removeClass('comicContent-image-all');
            $('.container').removeClass('container');
            $('.comicContent-image-1').removeClass('comicContent-image-1');
            $('.comicContent-image-2').removeClass('comicContent-image-2');
            $('.comicContent-image-3').removeClass('comicContent-image-3');
            //添加图片id
            let $img=$('.comicContent ul img');
            $.each($img,function(index){
                this.setAttribute('id','img_'+(index+1));
            })
            //预加载图片
            $('.comicContent img').addClass('lazypreload');
            //去除原来的jquery事件
            jQuery = unsafeWindow['jQuery'];
            jQuery("body").off("keydown");
            jQuery(".inner_img a").off("click");
            //上下方向键滚动页面，左右方向键切换章节
            function scrollUp(){
                if (middle==0||img_id==g_max_pic_count+1){
                    if (img_id>=1){
                        if ($("#img_"+img_id).length>0&&$("#img_"+(img_id-1)).length>0&&$("#img_"+img_id).offset().top==$("#img_"+(img_id-1)).offset().top){
                            img_id-=2;
                        }else{
                            img_id-=1;
                        }
                    }
                }
                middle=0;
                info_app.img_id=img_id;
                if (img_id!=0) $("html").stop()
                $("html").animate({scrollTop: $("#img_"+img_id).offset().top}, 500);

            }
            function scrollDown(){
                if (img_id<=g_max_pic_count){
                    if ($("#img_"+img_id).length>0&&$("#img_"+(img_id+1)).length>0&&$("#img_"+img_id).offset().top==$("#img_"+(img_id+1)).offset().top){
                        img_id+=2;
                    }else{
                        img_id+=1;
                    }
                }
                middle=0;
                info_app.img_id=img_id;
                if (img_id!=g_max_pic_count+1) $("html").stop()
                $("html").animate({scrollTop: $("#img_"+img_id).offset().top}, 500);
            }
            $(".comicContent").click(function(event){
                if (event.clientY>$(window).height()/2){
                    scrollDown();
                }else{
                    scrollUp();
                }
            })
            $("body").keydown(function(event) {
                if (event.keyCode == 38) {
                    scrollUp();
                } else if (event.keyCode == 40) {
                    scrollDown();
                } else if (event.keyCode == 37) {
                    let location_new = $('.footer>div:nth-child(2) a').attr("href");
                    if(location_new.indexOf("chapter")>=0)
                        location.href = location_new;
                } else if (event.keyCode == 39) {
                    let location_new = $('.footer>div:nth-child(4) a').attr("href");
                    if(location_new.indexOf("chapter")>=0)
                        location.href = location_new;
                }
            })
            //resize事件触发图片和浏览器对齐
            $(window).resize(function() {
                $("html").animate({scrollTop: $("#img_"+img_id).offset().top}, 0);
            })
            window.addEventListener('mousewheel', function (){
                middle=1;
                setTimeout(function(){
                    for (var i = 0; i < 2; i++) {
                        if ((img_id==g_max_pic_count+1&&pageYOffset<$("#img_"+g_max_pic_count).offset().top+$("#img_"+g_max_pic_count).height())||
                            ($("#img_"+img_id).length>0&&pageYOffset<$("#img_"+img_id).offset().top))
                            img_id-=1;
                        if ((img_id==g_max_pic_count&&pageYOffset>$("#img_"+g_max_pic_count).offset().top+$("#img_"+g_max_pic_count).height())||
                            ($("#img_"+(img_id+1)).length>0&&pageYOffset>$("#img_"+(img_id+1)).offset().top))
                            img_id+=1;
                        info_app.img_id=img_id;
                    }
                },100);
            })
            //添加右下角菜单
            let info = `
<div id="info" @mouseover="show=1" @mouseleave="show=0">
<transition name="custom-classes-transition" enter-active-class="animate__animated animate__fadeIn" leave-active-class="animate__animated animate__fadeOut">
<template v-if="show"><div id="info_page" class="info_item" @click="switch_page" style="cursor:pointer;">{{message_page}}</div></template></transition>
<transition name="custom-classes-transition" enter-active-class="animate__animated animate__fadeIn" leave-active-class="animate__animated animate__fadeOut">
<template v-if="show"><div id="info_skip" class="info_item" @click="switch_skip" style="cursor:pointer;">{{message_skip}}</div></template></transition>
<transition name="custom-classes-transition" enter-active-class="animate__animated animate__fadeIn" leave-active-class="animate__animated animate__fadeOut">
<template v-if="show"><div id="info_switch" class="info_item" @click="switch_night" style="cursor:pointer;">{{message_switch}}</div></template></transition>
<template><div id="info_count" class="info_item">{{message_count}}</div></template>
</div>`;
            let $info = $(info);
            $("body").append($info);
            let info_style = `
#info {
bottom: 2%;
right: 2%;
padding: 5px 5px;
background: rgba(48,48,48,.7) !important;
position: fixed;
color: rgba(255,255,255,.7);
border-radius: 3px;
}
.info_item{
padding:5px 0px;
width:120px;
}`;
            GM_addStyle(info_style);
            //vue绑定右下角菜单
            var info_app = new Vue({
                el: '#info',
                data: {
                    dark:dark_mode,
                    page:page_double,
                    show:0,
                    img_id:0,
                    skip:0,
                },
                computed: {
                    message_switch:  function () {
                        return this.dark?'☀️日间模式':'🌙夜间模式'
                    },
                    message_page:  function () {
                        return this.page?'1️⃣单页排布':'2️⃣双页排布'
                    },
                    message_skip:  function () {
                        return '📖更改跨页'
                    },
                    message_count:  function () {
                        return this.img_id+'/'+g_max_pic_count
                    }
                },
                methods:{
                    switch_night: function(){
                        this.dark=!this.dark
                        $.cookie('dark_mode',this.dark,{expires:999999,path:'/'});
                        if (this.dark){
                            $('html').addClass('dark_mode');
                        }else{
                            $('html').removeClass('dark_mode');
                        }
                    },
                    switch_skip: function(){
                        this.skip=!this.skip
                        if (this.skip){
                            $(".comicContent li:first-child").addClass('skip');
                        }else{
                            $(".comicContent li:first-child").removeClass('skip');
                        }
                    },
                    switch_page: function(){
                        this.page=!this.page
                        $.cookie('page_double',this.page,{expires:999999,path:'/'});
                        if (this.page){
                            $('html').addClass('page_double');
                        }else{
                            $('html').removeClass('page_double');
                        }
                        $("html").animate({scrollTop: $("#img_"+img_id).offset().top}, 0);
                    },
                }
            })
            //添加侧边目录栏
            let sidebar=`
<div id="sidebar" @mouseleave="drawer=false">
<div id="toggle" @mouseover="drawer=true" style="top:0px;left:0px;height:100vh;width:10vw;position: fixed;"></div>
<el-drawer
title="我是标题"
:size="size"
:modal="modal"
:visible="drawer"
:with-header="false"
:direction="direction"
@open="handleOpen">
<el-menu background-color="transparent"
text-color="#fff"
active-text-color="#ffd04b"
@select="handleSelect">
<template v-for="(item, index) in items">
<el-menu-item v-bind:index="index">{{item.title}}</el-menu-item>
</template>
</el-menu>
</el-drawer>
</div>`
            let $sidebar = $(sidebar);
            $("body").append($sidebar);
            //vue绑定侧边目录栏
            var sidebar_app = new Vue({
                el: '#sidebar',
                data: {
                    drawer: false,
                    size:'100%',
                    modal:false,
                    direction: 'ltr',
                    items: [],
                },
                methods:{
                    handleSelect(key) {
                        location.href=this.items[key].href;
                    },
                    handleOpen() {
                        setTimeout(function(){
                            $('.el-drawer__body').animate({scrollTop:0}, 0);
                            $('.el-drawer__body').animate({scrollTop:$('.el-menu>li:nth-child('+(ch_id-1)+')').offset().top-$('.el-drawer__body').offset().top}, 0);
                        },0)
                    },
                }
            })
            //加载目录
            function menu(){
                let $border=$('#default全部 .table-all a', el.contents());
                if ($border.length==0){
                    setTimeout(menu,100);
                    return;
                }
                $.each($border,function(index){
                    if (location.href.indexOf(this.href)>=0){
                        ch_id=index;
                        GM_addStyle('.el-menu>li:nth-child('+(ch_id+1)+'){background:rgba(255,165,0,.5) !important}')
                    }
                    sidebar_app.items.push({
                        title:this.text,
                        href:this.href,
                    })
                })
            }
            menu();
            })
    }
})();
