// Memos Start
var memo = {
    host: 'https://memos.050815.xyz/',
    limit: '10',
    creatorId: '1',
    domId: '#memos',
    username: 'kemiao',
    name: '克喵爱吃卤面',
    APIVersion: 'legacy',  // 明确指定使用legacy API
    language: 'zh-CN',
    doubanAPI: ''          // 豆瓣API留空（如需解析豆瓣需自行配置）
};

if (typeof memos !== "undefined") {
    Object.assign(memo, memos);  // 合并自定义配置
}

var limit = memo.limit;
var memosHost = memo.host.replace(/\/$/, '');
var memoUrl = `${memosHost}/api/v1/memo?creatorId=${memo.creatorId}&rowStatus=NORMAL`;  // Legacy API端点

let page = 1, offset = 0, nextLength = 0, nextDom = '';
var tag = '';
var btnRemove = 0;
const memoDom = document.querySelector(memo.domId);
const loadBtn = '<button class="load-btn button-load">努力加载中……</button>';

if (memoDom) {
    memoDom.insertAdjacentHTML('afterend', loadBtn);
    getFirstList();

    const btn = document.querySelector("button.button-load");
    btn.addEventListener("click", () => {
        btn.textContent = '努力加载中……';
        updateHTML(nextDom);
        if (nextLength < limit) {
            btn.remove();
            btnRemove = 1;
            return;
        }
        getNextList();
    });
}

// 标签筛选功能（Legacy特有）
document.addEventListener('click', (event) => {
    const target = event.target;
    if (target.tagName === 'A' && target.href.startsWith('#')) {
        event.preventDefault();
        tag = target.href.substring(1);
        if (btnRemove) {
            btnRemove = 0;
            memoDom.insertAdjacentHTML('afterend', loadBtn);
            document.querySelector("button.button-load").addEventListener("click", loadHandler);
        }
        getTagFirstList();
    }
});

function getFirstList() {
    const url = `${memoUrl}&limit=${limit}`;  // Legacy分页参数
    fetch(url)
        .then(res => res.json())
        .then(resdata => {
            updateHTML(resdata);
            if (resdata.length < limit) {
                document.querySelector("button.button-load").remove();
                btnRemove = 1;
                return;
            }
            page++;
            offset = limit * (page - 1);  // Legacy分页计算
            getNextList();
        });
}

function getNextList() {
    const url = tag 
        ? `${memoUrl}&limit=${limit}&offset=${offset}&tag=${tag}` 
        : `${memoUrl}&limit=${limit}&offset=${offset}`;
    
    fetch(url)
        .then(res => res.json())
        .then(resdata => {
            nextDom = resdata;
            nextLength = nextDom.length;
            page++;
            offset = limit * (page - 1);
            if (nextLength < 1) {
                document.querySelector("button.button-load").remove();
                btnRemove = 1;
            }
        });
}

function getTagFirstList() {
    page = 1; offset = 0;
    memoDom.innerHTML = "";
    fetch(`${memoUrl}&limit=${limit}&tag=${tag}`)
        .then(res => res.json())
        .then(resdata => {
            updateHTML(resdata);
            if (resdata.length >= limit) {
                page++;
                offset = limit * (page - 1);
                getNextList();
            }
        });
}

function updateHTML(data) {
    let memoResult = "";
    const TAG_REG = /#([^\s#]+?)\s/g;

    for (const item of data) {
        let content = item.content.replace(TAG_REG, `<span class='tag-span'><a href='#$1'>#$1</a></span>`);
        content = marked.parse(content);

        // 处理资源文件 (Legacy格式)
        if (item.resourceList?.length > 0) {
            let imgHtml = "", resHtml = "";
            item.resourceList.forEach(res => {
                const resLink = res.externalLink || `${memosHost}/o/r/${res.id}/${res.filename}`;
                if (res.type.startsWith('image')) {
                    imgHtml += `<div class="resimg"><img loading="lazy" src="${resLink}"/></div>`;
                } else {
                    resHtml += `<a target="_blank" href="${resLink}">${res.filename}</a>`;
                }
            });
            if (imgHtml) content += `<div class="resource-wrapper"><div class="images-wrapper">${imgHtml}</div></div>`;
            if (resHtml) content += `<div class="resource-wrapper"><p>${resHtml}</p></div>`;
        }

        // 时间格式化 (Legacy时间戳)
        const createTime = new Date(item.createdTs * 1000);
        const relativeTime = new Intl.RelativeTimeFormat(memo.language, { 
            numeric: "auto", 
            style: 'short' 
        }).format(Math.floor((Date.now() - createTime)/(86400*1000)), 'day');

        memoResult += `
            <li class="timeline">
                <div class="memos__content">
                    <div class="memos__text">
                        <div class="memos__userinfo">
                            <div>${memo.name}</div>
                            <div class="memos__id">@${memo.username}</div>
                        </div>
                        <p>${content}</p>
                    </div>
                    <div class="memos__meta">
                        <small>${relativeTime} • From「<a href="${memo.host}m/${item.id}" target="_blank">Memos</a>」</small>
                    </div>
                </div>
            </li>
        `;
    }

    memoDom.insertAdjacentHTML('beforeend', `<ul>${memoResult}</ul>`);
    document.querySelector('button.button-load').textContent = '加载更多';

    //DB
    fetchDB();

    // Images lightbox
    window.ViewImage && ViewImage.init('.container img');
    
}
// Memos End

// Relative Time Start
function getRelativeTime(date) {
    const rtf = new Intl.RelativeTimeFormat(memo.language, { numeric: "auto", style: 'short' });
    const now = new Date();
    const diff = now - date;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (years > 0) {
        return rtf.format(-years, 'year');
    } else if (months > 0) {
        return rtf.format(-months, 'month');
    } else if (days > 0) {
        return rtf.format(-days, 'day');
    } else if (hours > 0) {
        return rtf.format(-hours, 'hour');
    } else if (minutes > 0) {
        return rtf.format(-minutes, 'minute');
    } else {
        return rtf.format(-seconds, 'second');
    }
}
// Relative Time End

// Toggle Darkmode
const localTheme = window.localStorage && window.localStorage.getItem("theme");
const themeToggle = document.querySelector(".theme-toggle");

if (localTheme) {
    document.body.classList.remove("light-theme", "dark-theme");
    document.body.classList.add(localTheme);
}

themeToggle.addEventListener("click", () => {
    const themeUndefined = !new RegExp("(dark|light)-theme").test(document.body.className);
    const isOSDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (themeUndefined) {
        if (isOSDark) {
            document.body.classList.add("light-theme");
        } else {
            document.body.classList.add("dark-theme");
        }
    } else {
        document.body.classList.toggle("light-theme");
        document.body.classList.toggle("dark-theme");
    }

    window.localStorage &&
        window.localStorage.setItem(
            "theme",
            document.body.classList.contains("dark-theme") ? "dark-theme" : "light-theme",
        );
});
// Darkmode End

// Memos Total Start
function getTotal() {
//使用一个无穷大的数字来获取全部memos
    fetch(`${memosHost}/api/v1/memos?pageSize=999999999&parent=users/${memo.creatorId}`)
        .then(res => res.json())
        .then(resdata => {
            if (resdata && resdata.memos) {
                var memosCount = document.getElementById('total');
                if (memosCount) {
                    memosCount.innerHTML = resdata.memos.length;
                }
            }
        })
        .catch(err => {
            console.error('Error fetching memos:', err);
        });
}

window.onload = getTotal;
// Memos Total End

// 解析豆瓣 Start
function fetchDB() {
    var dbAPI = 'https://api.loliko.cn/';
    var dbA = document.querySelectorAll(".timeline a[href*='douban.com/subject/']:not([rel='noreferrer'])") || '';
    if (dbA) {
                const promises = [];
        for (var i = 0; i < dbA.length; i++) {
            _this = dbA[i];
            var dbHref = _this.href;
            var db_reg = /^https\:\/\/(movie|book)\.douban\.com\/subject\/([0-9]+)\/?/;
            var db_type = dbHref.replace(db_reg, "$1");
            var db_id = dbHref.replace(db_reg, "$2").toString();
            if (db_type == 'movie') {
                var this_item = 'movie' + db_id;
                var url = dbAPI + "movies/" + db_id;
                if (localStorage.getItem(this_item) == null) {
                    promises.push(fetch(url).then(res => res.json()).then(data => {
                        let fetch_item = 'movies' + data.sid;
                        let fetch_href = "https://movie.douban.com/subject/" + data.sid + "/";
                        localStorage.setItem(fetch_item, JSON.stringify(data));
                        movieShow(fetch_href, fetch_item);
                    }).catch(error => {
                        console.error('Error fetching movie data:', error);
                    }));
                } else {
                    movieShow(dbHref, this_item);
                }
            } else if (db_type == 'book') {
                var this_item = 'book' + db_id;
                var url = dbAPI + "v2/book/id/" + db_id;
                if (localStorage.getItem(this_item) == null) {
                    promises.push(fetch(url).then(res => res.json()).then(data => {
                        let fetch_item = 'book' + data.id;
                        let fetch_href = "https://book.douban.com/subject/" + data.id + "/";
                        localStorage.setItem(fetch_item, JSON.stringify(data));
                        bookShow(fetch_href, fetch_item);
                    }).catch(error => {
                        console.error('Error fetching book data:', error);
                    }));
                } else {
                    bookShow(dbHref, this_item);
                }
            }
        }// for end
        Promise.all(promises).then(() => {
            console.log('All fetch operations completed');
        });
    }
}

function movieShow(fetch_href, fetch_item) {
    var storage = localStorage.getItem(fetch_item);
    var data = JSON.parse(storage);
    var db_star = Math.ceil(data.rating);
    var db_html = "<div class='post-preview'><div class='post-preview--meta'><div class='post-preview--middle'><h4 class='post-preview--title'><a target='_blank' rel='noreferrer' href='" + fetch_href + "'>《" + data.name + "》</a></h4><div class='rating'><div class='rating-star allstar" + db_star + "'></div><div class='rating-average'>" + data.rating + "</div></div><time class='post-preview--date'>导演：" + data.director + " / 类型：" + data.genre + " / " + data.year + "</time><section class='post-preview--excerpt'>" + data.intro.replace(/\s*/g, "") + "</section></div></div><img referrer-policy='no-referrer' loading='lazy' class='post-preview--image' src=" + data.img + "></div>";
    var db_div = document.createElement("div");
    var qs_href = ".timeline a[href='" + fetch_href + "']";
    var qs_dom = document.querySelector(qs_href);
    if (qs_dom) {
        qs_dom.parentNode.replaceChild(db_div, qs_dom);
        db_div.innerHTML = db_html;
    }
}

function bookShow(fetch_href, fetch_item) {
    var storage = localStorage.getItem(fetch_item);
    var data = JSON.parse(storage);
    var db_star = Math.ceil(data.rating.average);
    var db_html = "<div class='post-preview'><div class='post-preview--meta'><div class='post-preview--middle'><h4 class='post-preview--title'><a target='_blank' rel='noreferrer' href='" + fetch_href + "'>《" + data.title + "》</a></h4><div class='rating'><div class='rating-star allstar" + db_star + "'></div><div class='rating-average'>" + data.rating.average + "</div></div><time class='post-preview--date'>作者：" + data.author + " </time><section class='post-preview--excerpt'>" + data.summary.replace(/\s*/g, "") + "</section></div></div><img referrer-policy='no-referrer' loading='lazy' class='post-preview--image' src=" + data.images.medium + "></div>";
    var db_div = document.createElement("div");
    var qs_href = ".timeline a[href='" + fetch_href + "']";
    var qs_dom = document.querySelector(qs_href);
    if (qs_dom) {
        qs_dom.parentNode.replaceChild(db_div, qs_dom);
        db_div.innerHTML = db_html;
    }
}
// 解析豆瓣 End
