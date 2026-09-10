/**
 * 车言槽 - 公共脚本库 v2
 * 数据来源: https://carapi.12315car.com (详见 swagger-ui/index.html)
 * 所有接口均为 POST JSON, 响应结构 {code, message, data}, code==0 表示成功
 * 分页结构 {data[], index, pageSize, totalPage, totalRecord, offset, skipSize}
 */
(function (global) {
    'use strict';

    var API_BASE = 'https://carapi.12315car.com';

    /* ---------------- 基础工具 ---------------- */

    // 当前页面相对站点根目录的前缀(用于子目录页面引用资源与链接)
    var BASE_PREFIX = (function () {
        var parts = location.pathname.replace(/\/+$/, '').split('/');
        var depth = Math.max(parts.length - 2, 0); // 末段为文件名, 其余为目录深度
        return new Array(depth + 1).join('../');
    })();

    // 读取 url 查询参数
    function qs(name) {
        var reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i');
        var r = location.search.substr(1).match(reg);
        return r != null ? decodeURIComponent(r[2]) : null;
    }

    // HTML 转义, 防止用户内容注入
    function esc(str) {
        if (str == null) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // 时间戳(ms) -> yyyy-MM-dd HH:mm:ss 或 yyyy-MM-dd
    function pad(n) { return n < 10 ? '0' + n : '' + n; }
    function fmtDate(ts, short) {
        if (ts == null || ts === '') return '';
        var d = new Date(Number(ts));
        if (isNaN(d.getTime())) return '';
        var s = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
        if (!short) s += ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
        return s;
    }

    /* ---------------- 接口请求 ---------------- */

    function request(api, data) {
        return fetch(API_BASE + api, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data || {})
        }).then(function (res) { return res.json(); }).then(function (result) {
            if (result && result.code === 0) return result.data;
            return Promise.reject(new Error((result && result.message) || '接口返回异常'));
        });
    }

    /* ---------------- 页头 / 页脚 ---------------- */

    var NAV_ITEMS = [
        { key: 'home', name: '首页', href: 'index.html' },
        { key: 'app', name: '下载中心', href: 'download/index.html' },
        { key: 'cms', name: '新闻', href: 'cms/index.html' },
        { key: 'complaint', name: '投诉', href: 'complaint/index.html' },
        { key: 'topic', name: '吐槽', href: 'topic/index.html' },
        { key: 'ranking', name: '能耗榜', href: 'ranking/index.html' }
    ];

    function header(active) {
        var html = '<header class="site-header"><div class="header-inner">' +
            '<a class="brand" href="' + BASE_PREFIX + 'index.html">' +
            '<span class="brand-icon"><i class="fa fa-car"></i></span>' +
            '<span class="brand-text"><b>车言槽</b><small>汽车消费维权平台</small></span>' +
            '</a><nav class="site-nav">';
        for (var i = 0; i < NAV_ITEMS.length; i++) {
            var it = NAV_ITEMS[i];
            var href = it.external ? it.href : (BASE_PREFIX + it.href);
            html += '<a class="nav-btn ' + (it.key === active ? 'active' : '') + '" href="' + href + '"' +
                (it.external ? ' target="_blank"' : '') + '>' + it.name + '</a>';
        }
        html += '</nav></div></header>';
        var mount = document.querySelector('[data-header]');
        if (mount) mount.outerHTML = html;
        return html;
    }

    function footer() {
        var html = '<footer class="site-footer"><div class="footer-inner">' +
            '<div class="footer-brand">车言槽 <small>· 汽车消费维权平台</small></div>' +
            '<div>版权所有&copy;2026-2027 禁止未经授权拷贝和转发</div>' +
            '<div>' +
            '<span><a href="https://beian.miit.gov.cn" target="_blank">备案号：湘ICP备2025152135号-1</a></span>' +
            ' · <span>技术支持：138xxxxxx</span> · <span>商务合作：138xxxxxx</span>' +
            '</div></div></footer>';
        var mount = document.querySelector('[data-footer]');
        if (mount) mount.outerHTML = html;
        return html;
    }

    // 面包屑: items = [{name, href?}, ...]
    function breadcrumb(items) {
        var html = '<nav aria-label="breadcrumb"><ol class="breadcrumb">';
        for (var i = 0; i < items.length; i++) {
            var it = items[i];
            if (i === items.length - 1) {
                html += '<li class="breadcrumb-item active" aria-current="page">' + esc(it.name) + '</li>';
            } else {
                html += '<li class="breadcrumb-item"><a href="' + (BASE_PREFIX + it.href) + '">' + esc(it.name) + '</a></li>';
            }
        }
        return html + '</ol></nav>';
    }

    // 分区标题: iconCls(co-blue等), icon(fa类), title, subtitle, moreHref, moreText
    function sectionHead(o) {
        return '<div class="sec-head">' +
            '<span class="sec-icon ' + esc(o.iconCls || 'co-blue') + '"><i class="fa ' + esc(o.icon) + '"></i></span>' +
            '<div class="sec-titles"><h2>' + esc(o.title) + '</h2>' +
            (o.subtitle ? '<p>' + esc(o.subtitle) + '</p>' : '') +
            '</div><div class="flex-fill"></div>' +
            (o.moreHref ? '<a class="more-link" href="' + BASE_PREFIX + esc(o.moreHref) + '">' +
                esc(o.moreText || '更多') + ' <i class="fa fa-angle-right"></i></a>' : '') +
            '</div>';
    }

    /* ---------------- 加载 / 空态 ---------------- */

    function loading(text) {
        return '<div class="loading"><div><i class="fa fa-refresh fa-spin"></i> ' + (text || '正在加载数据') + '</div></div>';
    }

    function empty(text) {
        return '<div class="loading"><div><i class="fa fa-inbox"></i> ' + esc(text || '当前无信息') + '</div></div>';
    }

    /* ---------------- 分页(数字页码) ---------------- */

    // 生成页码序列: 1 ... 4 5 [6] 7 8 ... 20
    function pageSeq(idx, total) {
        var seq = [];
        var s = Math.max(1, idx - 2), e = Math.min(total, idx + 2);
        if (s > 1) { seq.push(1); if (s > 2) seq.push('...'); }
        for (var i = s; i <= e; i++) seq.push(i);
        if (e < total) { if (e < total - 1) seq.push('...'); seq.push(total); }
        return seq;
    }

    function pagerInfo(pi) {
        var total = pi.totalRecord != null ? pi.totalRecord : 0;
        return '<span class="pg-info">共 ' + total + ' 条 · 第 ' + (pi.index || 1) + '/' + (pi.totalPage || 1) + ' 页</span>';
    }

    /**
     * 链接式分页(整页跳转, 数字页码)
     * @param pageInfo 分页数据
     * @param urlBuilder function(index) -> url
     */
    function paginationLinks(pageInfo, urlBuilder) {
        if (!pageInfo || !pageInfo.data || !pageInfo.data.length) return '';
        var idx = pageInfo.index || 1, total = pageInfo.totalPage || 1;
        var html = '<div class="pager">' + pagerInfo(pageInfo);
        html += idx > 1
            ? '<a class="pg-btn" href="' + urlBuilder(idx - 1) + '"><i class="fa fa-angle-left"></i> 上一页</a>'
            : '<span class="pg-btn disabled"><i class="fa fa-angle-left"></i> 上一页</span>';
        pageSeq(idx, total).forEach(function (p) {
            if (p === '...') html += '<span class="pg-dots">…</span>';
            else if (p === idx) html += '<span class="pg-btn current">' + p + '</span>';
            else html += '<a class="pg-btn" href="' + urlBuilder(p) + '">' + p + '</a>';
        });
        html += idx < total
            ? '<a class="pg-btn" href="' + urlBuilder(idx + 1) + '">下一页 <i class="fa fa-angle-right"></i></a>'
            : '<span class="pg-btn disabled">下一页 <i class="fa fa-angle-right"></i></span>';
        return html + '</div>';
    }

    /**
     * AJAX 式分页(局部刷新, 数字页码)
     * @param pageInfo 分页数据
     * @param onPage function(index) 翻页回调
     */
    function paginationAjax(pageInfo, onPage) {
        if (!pageInfo || !pageInfo.data || !pageInfo.data.length) return null;
        var idx = pageInfo.index || 1, total = pageInfo.totalPage || 1;
        var html = '<div class="pager">' + pagerInfo(pageInfo);
        html += idx > 1
            ? '<span class="pg-btn action" data-index="' + (idx - 1) + '"><i class="fa fa-angle-left"></i> 上一页</span>'
            : '<span class="pg-btn disabled"><i class="fa fa-angle-left"></i> 上一页</span>';
        pageSeq(idx, total).forEach(function (p) {
            if (p === '...') html += '<span class="pg-dots">…</span>';
            else if (p === idx) html += '<span class="pg-btn current">' + p + '</span>';
            else html += '<span class="pg-btn action" data-index="' + p + '">' + p + '</span>';
        });
        html += idx < total
            ? '<span class="pg-btn action" data-index="' + (idx + 1) + '">下一页 <i class="fa fa-angle-right"></i></span>'
            : '<span class="pg-btn disabled">下一页 <i class="fa fa-angle-right"></i></span>';
        html += '</div>';
        return {
            html: html,
            bind: function (container) {
                container.addEventListener('click', function (e) {
                    var el = e.target.closest ? e.target.closest('.pg-btn.action') : null;
                    if (!el) return;
                    onPage(Number(el.getAttribute('data-index')));
                });
            }
        };
    }

    /* ---------------- 投诉状态 ---------------- */

    // state: 0=已解决 2=已答复(平台已回复) 其他(1)=待答复, 与原站一致
    function stateBadge(state) {
        switch (state) {
            case 0: return '<span class="pill st-done">已解决</span>';
            case 2: return '<span class="pill st-reply">已答复</span>';
            default: return '<span class="pill st-wait">待答复</span>';
        }
    }

    /* ---------------- 图片兜底 ---------------- */

    var IMG = {
        avatar: BASE_PREFIX + 'assets/img/default-avatar.svg',
        cms: BASE_PREFIX + 'assets/img/cms-default.svg',
        car: BASE_PREFIX + 'assets/img/car-default.svg'
    };

    function avatarUrl(user) {
        return (user && user.avatar) ? user.avatar : IMG.avatar;
    }
    // 无头像时生成彩色首字头像: 按用户ID稳定取暖色系背景
    var AVATAR_PALETTE = ['#f08200', '#e06c3d', '#d4a017', '#c97d10', '#e63946', '#b35400', '#dd8b62', '#c98514'];
    function avatarColor(user) {
        var s = ((user && user.userId) || '') + ((user && user.nickname) || '');
        var h = 0;
        for (var i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) >>> 0; }
        return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
    }
    /**
     * 头像HTML: 有头像用图片(失败回退占位), 无头像渲染彩色首字块
     * @param user {nickname, avatar, userId}
     * @param cls 头像尺寸类名(tc-avatar / avatar / cm-avatar)
     */
    function avatarHtml(user, cls) {
        if (user && user.avatar) {
            return '<img class="' + cls + '" loading="lazy" src="' + esc(user.avatar) + '" data-fallback="' + esc(IMG.avatar) + '">';
        }
        var name = (user && user.nickname) || '匿名';
        return '<span class="' + cls + ' avatar-letter" style="background:' + avatarColor(user) + '">' +
            esc(name.charAt(0)) + '</span>';
    }
    function cmsIcon(item) {
        return item && item.icon ? item.icon : IMG.cms;
    }
    function serialIcon(serial) {
        return serial && serial.icon ? serial.icon : IMG.car;
    }
    // 图片加载失败时替换为占位图
    document.addEventListener('error', function (e) {
        var img = e.target;
        if (img && img.tagName === 'IMG' && !img.dataset.fallbackDone) {
            img.dataset.fallbackDone = '1';
            img.src = img.dataset.fallback || IMG.cms;
        }
    }, true);

    /* ---------------- 轻量轮播 ---------------- */

    /**
     * 轮播组件(自动播放 + 圆点 + 循环)
     * @param mount 挂载元素
     * @param items [{icon: 图片url, ...}]
     */
    function carousel(mount, items) {
        if (!mount) return;
        if (!items || items.length === 0) {
            if (mount.parentNode) mount.parentNode.style.display = 'none';
            return;
        }
        if (mount.parentNode) mount.parentNode.style.display = '';
        var html = '<div class="carousel" data-carousel>';
        for (var i = 0; i < items.length; i++) {
            html += '<div class="carousel-slide"' +
                (i === 0 ? '' : ' style="display:none"') +
                '><img src="' + esc(items[i].icon || items[i]) + '" alt=""></div>';
        }
        html += '</div><div class="carousel-dots">';
        for (var j = 0; j < items.length; j++) {
            html += '<span class="carousel-dot' + (j === 0 ? ' active' : '') + '"></span>';
        }
        html += '</div>';
        mount.innerHTML = html;

        var current = 0, count = items.length;
        var slides = mount.querySelectorAll('.carousel-slide');
        var dots = mount.querySelectorAll('.carousel-dot');
        function go(n) {
            slides[current].style.display = 'none';
            dots[current].classList.remove('active');
            current = (n + count) % count;
            slides[current].style.display = '';
            dots[current].classList.add('active');
        }
        var timer = setInterval(function () { go(current + 1); }, 3000);
        mount.addEventListener('click', function (e) {
            var dot = e.target.closest ? e.target.closest('.carousel-dot') : null;
            if (dot) {
                clearInterval(timer);
                go(Array.prototype.indexOf.call(dots, dot));
                timer = setInterval(function () { go(current + 1); }, 3000);
            }
        });
    }

    /* ---------------- 轻量灯箱 ---------------- */

    (function initLightbox() {
        var overlay = null;
        function close() {
            if (overlay) { overlay.remove(); overlay = null; }
        }
        document.addEventListener('click', function (e) {
            var link = e.target.closest ? e.target.closest('a[data-lightbox]') : null;
            if (link) {
                e.preventDefault();
                // 同组图片支持上一张/下一张
                var group = link.getAttribute('data-lightbox');
                var links = Array.prototype.slice.call(document.querySelectorAll('a[data-lightbox="' + group + '"]'));
                var pos = links.indexOf(link);
                function render(p) {
                    pos = (p + links.length) % links.length;
                    overlay.querySelector('img').src = links[pos].getAttribute('href');
                }
                overlay = document.createElement('div');
                overlay.className = 'lightbox-overlay';
                overlay.innerHTML =
                    '<span class="lightbox-btn lightbox-prev"><i class="fa fa-angle-left"></i></span>' +
                    '<img src="' + link.getAttribute('href') + '" alt="">' +
                    '<span class="lightbox-btn lightbox-next"><i class="fa fa-angle-right"></i></span>' +
                    '<span class="lightbox-close"><i class="fa fa-close"></i></span>';
                document.body.appendChild(overlay);
                overlay.addEventListener('click', function (ev) {
                    if (ev.target === overlay || ev.target.closest('.lightbox-close')) close();
                    else if (ev.target.closest('.lightbox-prev')) render(pos - 1);
                    else if (ev.target.closest('.lightbox-next')) render(pos + 1);
                });
            }
        });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    })();

    /* ---------------- 返回顶部 ---------------- */

    (function initBackTop() {
        var btn = document.createElement('button');
        btn.className = 'back-top';
        btn.type = 'button';
        btn.title = '回到顶部';
        btn.innerHTML = '<i class="fa fa-arrow-up"></i>';
        document.body.appendChild(btn);
        window.addEventListener('scroll', function () {
            btn.classList.toggle('show', window.scrollY > 300);
        }, { passive: true });
        btn.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    })();

    /* ---------------- 评论列表组件(投诉/吐槽详情共用) ---------------- */

    /**
     * 评论列表 + AJAX 分页(数字页码)
     * @param container 评论容器元素
     * @param api 评论列表接口(/api/complaint/comment/list 或 /api/topic/comment/list)
     * @param params 接口参数 {complaintId|topicId}
     */
    function comments(container, api, params) {
        function updateCount(pi) {
            var block = container.closest ? container.closest('.block') : null;
            var cnt = block ? block.querySelector('.comment-count') : null;
            if (cnt) cnt.textContent = pi.totalRecord != null ? '(' + pi.totalRecord + ')' : '';
        }
        function renderList(pi) {
            updateCount(pi);
            var html = '';
            if (pi.data && pi.data.length) {
                for (var i = 0; i < pi.data.length; i++) {
                    var c = pi.data[i];
                    html += '<div class="comment-item">' +
                        '<div class="userinfo">' +
                        avatarHtml(c.userinfo, 'cm-avatar') +
                        '<span>' + esc(c.userinfo && c.userinfo.nickname) + '</span>' +
                        '<span class="flex-fill"></span>' +
                        '<span>' + fmtDate(c.created) + '</span>' +
                        '</div>' +
                        '<div class="comment-content">' + esc(c.content) + '</div>' +
                        '</div>';
                }
            } else {
                html = empty('当前无评论信息');
            }
            var pager = paginationAjax(pi, load);
            if (pager) {
                container.innerHTML = html + pager.html;
                pager.bind(container);
            } else {
                container.innerHTML = html;
            }
        }
        function load(index) {
            container.innerHTML = loading('正在加载评论信息');
            var p = {};
            for (var k in params) p[k] = params[k];
            p.index = index || 1;
            p.pageSize = 10;
            request(api, p).then(renderList).catch(function (err) {
                container.innerHTML = empty('评论加载失败：' + err.message);
            });
        }
        load(1);
    }

    /* ---------------- 列表条目渲染(首页/列表页共用) ---------------- */

    // 投诉条目
    function complaintItem(item, linkPrefix) {
        var types = '';
        if (item.detailTypes) {
            for (var i = 0; i < item.detailTypes.length; i++) {
                var dt = item.detailTypes[i];
                types += '<span class="tag"><span>' + esc(dt.type && dt.type.name) + '</span>' +
                    '<span class="info">' + esc(dt.name) + '</span></span>';
            }
        }
        return '<a class="card-item" href="' + linkPrefix + 'complaint/show.html?id=' + encodeURIComponent(item.complaintId) + '">' +
            '<span class="ci-state">' + stateBadge(item.state) + '</span>' +
            '<div class="ci-car">' +
            '<img loading="lazy" src="' + esc(serialIcon(item.serial)) + '" data-fallback="' + esc(IMG.car) + '">' +
            '<div class="ci-car-name">' + esc(item.brand && item.brand.name) + ' / ' + esc(item.serial && item.serial.name) + '</div>' +
            '<div class="ci-cat">' + esc(item.catalog && item.catalog.name) + '</div>' +
            '</div>' +
            '<div class="ci-body">' +
            '<p class="ci-remark">' + esc(item.remark) + '</p>' +
            (types ? '<div class="ci-tags">' + types + '</div>' : '') +
            '<div class="ci-meta">' +
            '<span>投诉者：' + esc(item.userinfo && item.userinfo.nickname) + '</span>' +
            '<span>' + fmtDate(item.created) + '</span>' +
            '<span>关注 ' + (item.likes || 0) + ' · 点赞 ' + (item.sayGood || 0) + ' · 评论 ' + (item.comments || 0) + '</span>' +
            '</div>' +
            '</div>' +
            '</a>';
    }

    // 吐槽条目
    function topicItem(item, linkPrefix) {
        return '<a class="card-item" href="' + linkPrefix + 'topic/show.html?id=' + encodeURIComponent(item.topicId) + '">' +
            avatarHtml(item.userinfo, 'tc-avatar') +
            '<div class="tc-body">' +
            '<div class="tc-title">' + esc(item.title) + '</div>' +
            '<div class="tc-meta">' +
            '<span>吐槽者：' + esc(item.userinfo && item.userinfo.nickname) + '</span>' +
            '<span>' + fmtDate(item.created) + '</span>' +
            '<span><i class="fa fa-commenting-o"></i> 评论 ' + (item.cnt || 0) + '</span>' +
            '</div>' +
            '</div>' +
            '</a>';
    }

    // 新闻条目(compact=true 用于侧栏紧凑展示)
    function cmsItem(item, linkPrefix, compact) {
        return '<a class="news-item' + (compact ? ' compact' : '') + '" href="' + linkPrefix + 'cms/show.html?id=' + encodeURIComponent(item.postId) + '">' +
            '<div class="ni-img"><img loading="lazy" src="' + esc(cmsIcon(item)) + '" data-fallback="' + esc(IMG.cms) + '"></div>' +
            '<div class="ni-body">' +
            '<div class="ni-title">' + esc(item.title) + '</div>' +
            '<div class="ni-meta">' +
            '<span><i class="fa fa-user-o"></i> ' + esc(item.author || '车言槽') + '</span>' +
            '<span><i class="fa fa-clock-o"></i> ' + fmtDate(item.created, true) + '</span>' +
            '</div>' +
            '</div>' +
            '</a>';
    }

    global.App = {
        API_BASE: API_BASE,
        base: BASE_PREFIX,
        qs: qs,
        esc: esc,
        fmtDate: fmtDate,
        request: request,
        header: header,
        footer: footer,
        breadcrumb: breadcrumb,
        sectionHead: sectionHead,
        loading: loading,
        empty: empty,
        paginationLinks: paginationLinks,
        paginationAjax: paginationAjax,
        stateBadge: stateBadge,
        IMG: IMG,
        avatarUrl: avatarUrl,
        avatarHtml: avatarHtml,
        cmsIcon: cmsIcon,
        serialIcon: serialIcon,
        carousel: carousel,
        comments: comments,
        complaintItem: complaintItem,
        topicItem: topicItem,
        cmsItem: cmsItem
    };
})(window);
