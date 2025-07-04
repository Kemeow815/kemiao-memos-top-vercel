// Memos Start
const memo = {
    host: 'https://memos.050815.xyz/',
    limit: '10',
    creatorId: '1',
    domId: '#memos',
};

if (typeof memos !== "undefined") {
    Object.assign(memo, memos);
}

const limit = memo.limit;
const memosHost = memo.host.replace(/\/$/, '');
// 修改点1：API路径从 /api/v1/memos 改为 /api/v1/memo
// 修改点2：参数从 parent=users/... 改为 creatorId=...
const memoUrl = `${memosHost}/api/v1/memo?creatorId=${memo.creatorId}&rowStatus=NORMAL&pageSize=${limit}`;

let page = 1;
let nextPageToken = '';
let nextDom = '';
let btnRemove = 0;
const memoDom = document.querySelector(memo.domId);
const loadBtn = '<button class="load-btn button-load">努力加载中……</button>';

let userInfo;

if (memoDom) {
    memoDom.insertAdjacentHTML('afterend', loadBtn);
    fetchUserInfo().then(info => {
        userInfo = info;
        const bannerSubinfo = document.querySelector('.info');
        if (bannerSubinfo) {
            bannerSubinfo.textContent = userInfo.description;
        }
        getFirstList();
    });

    const btn = document.querySelector("button.button-load");
    btn.addEventListener("click", () => {
        btn.textContent = '努力加载中……';
        updateHTML(nextDom, userInfo);
        if (nextDom.length < limit) {
            btn.remove();
            btnRemove = 1;
            return;
        }
        getNextList();
    });
}

function getFirstList() {
    // 修改点3：使用 pageToken 参数替代 page 参数
    fetch(`${memoUrl}&pageToken=${nextPageToken}`)
        .then(res => res.json())
        .then(resdata => {
            // 修改点4：响应字段从 memos 改为 data
            updateHTML(resdata.data, userInfo);
            nextPageToken = resdata.nextPageToken;
            if (resdata.data.length < limit) {
                document.querySelector("button.button-load").remove();
                btnRemove = 1;
                return;
            }
            page++;
            getNextList();
        })
        .catch(error => console.error('Error fetching first list:', error));
}

function getNextList() {
    fetch(`${memoUrl}&pageToken=${nextPageToken}`)
        .then(res => res.json())
        .then(resdata => {
            nextPageToken = resdata.nextPageToken;
            // 修改点5：响应字段从 memos 改为 data
            nextDom = resdata.data;
            page++;
            if (nextDom.length < 1) {
                document.querySelector("button.button-load").remove();
                btnRemove = 1;
                return;
            }
        })
        .catch(error => console.error('Error fetching next list:', error));
}

function fetchUserInfo() {
    // 修改点6：用户API路径从 /api/v1/users/ 改为 /api/v1/user/
    return fetch(`${memosHost}/api/v1/user/${memo.creatorId}`)
        .then(response => response.json())
        .then(userData => {
            return {
                avatarurl: `${memosHost}${userData.avatarUrl}`,
                memoname: userData.nickname,
                userurl: `${memosHost}/u/${memo.creatorId}`,
                description: userData.description,
                memousername: userData.username
            };
        })
        .catch(error => {
            console.error('Error fetching user data:', error);
            return {};
        });
}

function getLocationHtml(location) {
    if (location && location.placeholder) {
        const placeholder = location.placeholder;
        const locationSvg = `  • 
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                <path d="M12 20.8995L16.9497 15.9497C19.6834 13.2161 19.6834 8.78392 16.9497 6.05025C14.2161 3.31658 9.78392 3.31658 7.05025 6.05025C4.31658 8.78392 4.31658 13.2161 7.05025 15.9497L12 20.8995ZM12 23.7279L5.63604 17.364C2.12132 13.8492 2.12132 8.15076 5.63604 4.63604C9.15076 1.12132 14.8492 1.12132 18.364 4.63604C21.8787 8.15076 21.8787 13.8492 18.364 17.364L12 23.7279ZM12 13C13.1046 13 14 12.1046 14 11C14 9.89543 13.1046 9 12 9C10.8954 9 10 9.89543 10 11C10 12.1046 10.8954 13 12 13ZM12 15C9.79086 15 8 13.2091 8 11C8 8.79086 9.79086 7 12 7C14.2091 7 16 8.79086 16 11C16 13.2091 14.2091 15 12 15Z"></path>
            </svg>`;
        return `${locationSvg} ${placeholder}`;
    }
    return '';
}

function updateHTML(data, userInfo) {
    const TAG_REG = /#([^\s#]+?) /g;
    const BILIBILI_REG = /<a\shref="https:\/\/www\.bilibili\.com\/video\/((av[\d]{1,10})|(BV([\w]{10})))\/?">.*<\/a>/g;
    const NETEASE_MUSIC_REG = /<a\shref="https:\/\/music\.163\.com\/.*id=([0-9]+)".*?>.*<\/a>/g;
    const QQMUSIC_REG = /<a\shref="https\:\/\/y\.qq\.com\/.*(\/[0-9a-zA-Z]+)(\.html)?".*?>.*?<\/a>/g;
    const QQVIDEO_REG = /<a\shref="https:\/\/v\.qq\.com\/.*\/([a-z|A-Z|0-9]+)\.html".*?>.*<\/a>/g;
    const SPOTIFY_REG = /<a\shref="https:\/\/open\.spotify\.com\/(track|album)\/([\s\S]+)".*?>.*<\/a>/g;
    const YOUKU_REG = /<a\shref="https:\/\/v\.youku\.com\/.*\/id_([a-z|A-Z|0-9|==]+)\.html".*?>.*<\/a>/g;
    const YOUTUBE_REG = /<a\shref="https:\/\/www\.youtube\.com\/watch\?v\=([a-z|A-Z|0-9]{11})\".*?>.*<\/a>/g;

    let memoResult = '';
    for (const item of data) {
        let memoContREG = item.content
            .replace(TAG_REG, "<span class='tag-span'><a rel='noopener noreferrer' href='#$1'>#$1</a></span>");
        
        const locationHtml = getLocationHtml(item.location);
        
        memoContREG = marked.parse(memoContREG)
            .replace(BILIBILI_REG, "<div class='video-wrapper'><iframe src='//www.bilibili.com/blackboard/html5mobileplayer.html?bvid=$1&as_wide=1&high_quality=1&danmaku=0' scrolling='no' border='0' frameborder='no' framespacing='0' allowfullscreen='true' style='position:absolute;height:100%;width:100%;'></iframe></div>")
            .replace(YOUTUBE_REG, "<div class='video-wrapper'><iframe src='https://www.youtube.com/embed/$1' title='YouTube video player' frameborder='0' allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture' allowfullscreen title='YouTube Video'></iframe></div>")
            .replace(NETEASE_MUSIC_REG, "<meting-js auto='https://music.163.com/#/song?id=$1'></meting-js>")
            .replace(QQMUSIC_REG, "<meting-js auto='https://y.qq.com/n/yqq/song$1.html'></meting-js>")
            .replace(QQVIDEO_REG, "<div class='video-wrapper'><iframe src='//v.qq.com/iframe/player.html?vid=$1' allowFullScreen='true' frameborder='no'></iframe></div>")
            .replace(SPOTIFY_REG, "<div class='spotify-wrapper'><iframe style='border-radius:12px' src='https://open.spotify.com/embed/$1/$2?utm_source=generator&theme=0' width='100%' frameBorder='0' allowfullscreen='' allow='autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture' loading='lazy'></iframe></div>")
            .replace(YOUKU_REG, "<div class='video-wrapper'><iframe src='https://player.youku.com/embed/$1' frameborder=0 'allowfullscreen'></iframe></div>");

        if (item.resourceList && item.resourceList.length > 0) {
            const resourceList = item.resourceList;
            let imgUrl = '<div class="resource-wrapper"><div class="images-wrapper">';
            let resUrl = '';

            for (const res of resourceList) {
                const resType = res.type.slice(0, 5);
                const resexlink = res.externalLink;
                // 修改点7：资源路径从 /file/ 改为 /o/r/
                const resLink = resexlink ? resexlink : `${memosHost}/o/r/${res.id}/${res.filename}`;

                if (resType === 'image') {
                    imgUrl += `<div class="resimg">
                        <img loading="lazy" src="${resLink}"/>
                    </div>`;
                } else {
                    resUrl += `<a target="_blank" rel="noreferrer" href="${resLink}">${res.filename}</a>`;
                }
            }

            imgUrl += '</div></div>';

            if (imgUrl) {
                memoContREG += imgUrl;
            }
            if (resUrl) {
                memoContREG += `<div class="resource-wrapper"><p class="datasource">${resUrl}</p></div>`;
            }
        }

        const relativeTime = getRelativeTime(new Date(item.createdTs * 1000)); // 修改点8：时间戳改为 createdTs

        // 修改点9：memo详情页路径从 /memo-name 改为 /m/${item.id}
        memoResult += `<li class="timeline"><div class="memos__content" style="--avatar-url: url(${userInfo.avatarurl})"><div class="memos__text"><div class="memos__userinfo"><a href=${userInfo.userurl} target="_blank" ><div>${userInfo.memoname}</div></a><div><svg viewBox="0 0 24 24" aria-label="认证账号" class="memos__verify"><g><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z"></path></g></svg></div><div class="memos__id">@${userInfo.memousername}</div></div><p>${memoContREG}</p></div><div class="memos__meta"><small class="memos__date">${relativeTime} • From「<a href="${memosHost}/m/${item.id}" target="_blank">Memos</a>」${locationHtml}</small></div></div></li>`;
    }

    const resultAll = `<ul>${memoResult}</ul>`;
    memoDom.insertAdjacentHTML('beforeend', resultAll);
    document.querySelector('button.button-load').textContent = '加载更多';

    //DB
    fetchDB();

    // Images lightbox
    window.ViewImage && ViewImage.init('.container img');
    
}
// Memos End

// ... 其他函数保持不变（getRelativeTime, toggle Darkmode）...

// Memos Total Start
function getTotal() {
    // 修改点10：获取总数的API路径和参数
    fetch(`${memosHost}/api/v1/memo?creatorId=${memo.creatorId}&rowStatus=NORMAL&pageSize=999999999`)
        .then(res => res.json())
        .then(resdata => {
            if (resdata && resdata.data) {
                var memosCount = document.getElementById('total');
                if (memosCount) {
                    memosCount.innerHTML = resdata.data.length;
                }
            }
        })
        .catch(err => {
            console.error('Error fetching memos:', err);
        });
}

window.onload = getTotal;
// Memos Total End

// ... 豆瓣解析函数保持不变 ...