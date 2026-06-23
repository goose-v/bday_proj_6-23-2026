const final = document.getElementById('finalfinal');
const confirms = document.getElementById('confirms');
const happy = document.getElementById('happy');

function updateBeatBlock(isSelected) {

    if(isSelected){
        confirms.style.display = 'block';
        
        confirms.addEventListener('sliceComplete', () => {
            setTimeout(function() {
                finalCards.style.display = 'none'
                final.style.display = 'block';
            }, 1500);
            

            setTimeout(function() {
                final.style.display = 'none';
                happy.style.display = 'block';
            }, 60000);
        }, {once: true});
    } else {
        confirms.style.display = 'none';
    }

}

class VideoTags extends HTMLElement {
    constructor(){ 
        super(); 
        this.attachShadow({ mode: "open" });
    }
    set tag(tagArray){
        this.render(tagArray);
    }

    render(tagArray) {
        if(!tagArray || !Array.isArray(tagArray)) return;

        const tagsHTML = tagArray.map(tag => `<span class="tag">${tag}</span>`).join('');
        
        this.shadowRoot.innerHTML = `
        <style>
            .tags-container{
                display: flex;
                gap: 3px; 
                flex-wrap: wrap;
                height: 5vh;
            }
            .tag{
                background-image: url('assets/tag-shape.svg');
                background-color: transparent;
                background-size: 100% 100%;
                width: 10vw;
                aspect-ratio: 10 / 3;
                align-content: center;
                border-radius: 4px;
                font-size: 20px;
                font-weight: 200;
                color: #FFF;
                text-align: center;
                font-family: 'Black Ops One';
            }
        </style>
        <div class="tags-container">
            ${tagsHTML}
        </div>
        `;
    }
}
customElements.define('video-tags', VideoTags);

let playlistData = [];
let currentIndex = 0;

const startPage = document.getElementById('start-page');
const mainPlayBtn = document.getElementById('main-play-btn');
const mainVideo = document.getElementById('main-video');
const cardOverlay = document.getElementById('card-overlay');
const finalCards = document.getElementById('final-select');

const videoCard = document.getElementById('videoCard');
const cardFront = document.getElementById('cardFront');
const cardBack = document.getElementById('cardBack');

const cardTitle = document.getElementById('cardTitle');
const cardDesc = document.getElementById('cardDesc');
const cardTags = document.getElementById('cardTags');
const nextBtn = document.getElementById('nextBtn');
const replayBtn = document.getElementById('replayBtn');

fetch('games.json')
    .then(response => response.json())
    .then(data => {
        playlistData = data; 
        displayCard(currentIndex); // Initialize the first layout
    });

function displayCard(index) {
    if(playlistData.length === 0) return;

    const data = playlistData[index];

    cardTitle.textContent = data.title;
    cardDesc.textContent = data.description;

    cardFront.style.background = `url(${data.imageSrc}) lightgray 50% / cover no-repeat`;
    cardBack.style.background = `url(${data.imageSrc}) lightgray 50% / cover no-repeat`;
    
    cardTags.tag = data.tagText;
}

function playCurrentVideo(){
    startPage.style.display = `none`;
    cardOverlay.style.display = `none`;
    finalCards.style.display = 'none';

    mainVideo.style.display = `block`;
    mainVideo.src = playlistData[currentIndex].videoSrc;
    mainVideo.play().catch(error => {
        if (error.name === 'AbortError') {
            // Ignore AbortError since it's just a normal side-effect of switching video tracks
            console.log("Playback safely interrupted for a new video load.");
        } else {
            // Log other genuine playback errors (like bad file paths)
            console.error("Playback failed:", error);
        }
    });
}

mainPlayBtn.addEventListener('click', () => {
    if(playlistData.length > 0){
        playCurrentVideo();
    }else {
        console.log("no video loaded");
    }
});

mainVideo.addEventListener('ended', () => {
    mainVideo.style.display = `none`;
    cardOverlay.style.display = `flex`;
    videoCard.classList.remove('active');
    displayCard(currentIndex);

});

videoCard.addEventListener('click', (event) => {
    if(event.target.tagName === 'BUTTON') return;
    videoCard.classList.toggle('active');
});

nextBtn.addEventListener('click', (event) => {
    event.stopPropagation(); 
    
    currentIndex++;
    if (currentIndex < playlistData.length) {
        playCurrentVideo(); 
    } else {
        cardOverlay.style.display = 'none';
        finalCards.style.display = 'block';
    }
});

replayBtn.addEventListener('click', (event) => {
    event.stopPropagation(); 
    playCurrentVideo();
});


class FinalCardDisplay extends HTMLElement {
    constructor(){ 
        super(); 
        this.attachShadow({ mode: "open" });
    }
    render(data) {
        this.shadowRoot.innerHTML = `
        <style>
            .final-card {
                position: relative;
                width: 25vw;
                height: 50vh;
                border-radius: 10px;
                cursor: pointer;
                background: linear-gradient(0deg, rgba(0, 0, 0, 0.80) 0%, rgba(0, 0, 0, 0.20) 100%), url(${data.imageSrc}) lightgray 50% / cover no-repeat;
                box-shadow: 3px 4px 4px 0 rgba(255, 255, 255, 0.25); 
                z-index: 0;
            }
            :host(.active) .final-card {
                background: none;
                box-shadow: none;
            }
            
            .svg-bg {
                display: none;
                position: absolute;
                inset: 0;
                max-height: 50vh;
                min-height: 50vh;
                z-index: -1;
                overflow: hidden;
            }

            
            :host(.active) .svg-bg {
                display:block;
                width: 100%;
                height: 100%;
            }

            .final-card-title{
                display: flex;
                width: 100%;
                color: #FFF;
                margin: 0;
                flex-direction: column;
                justify-content: center;
                position: absolute;
                inset: 55% 30% 33% 10%;
                font-family: "Tilt Neon";
                font-size: 2em;
                font-style: normal;
                font-weight: 400;
                line-height: normal;
            }
            .final-card-disc{
                position: absolute;
                inset: 59% 8% 23% 10%;
                width: 100%;
                font-size: 1em;
                color: #FFF;
                font-family: "Tilt Neon";
                display: flex;
                flex-direction: column;
                justify-content: center;
            }
            .final-card-tag{
                min-width: 45px;
                position: absolute;
                inset: 75% 58% 20% 10%;
                border-radius: 10px;
                background: #D9D9D9;
                border:none;
                color: #000;
                text-align: center;
                font-family: "Tilt Neon";
                font-style: normal;
                font-weight: 400;
                line-height: normal;
                display: flex;
                height: 3vh;
                font-size: 1em;
                flex-direction: column;
                justify-content: center;
            }
        </style>

        <div class="final-card">
            <div class="svg-bg">
                <svg viewBox="0 0 100 250" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                    <g filter="url(#filter0_g_23_42)">
                        <rect x="5" y="5" width="100" height="250" rx="10" fill="url(#pattern0_23_42)" fill-opacity="0.2"/>
                        <rect x="5" y="5" width="100" height="250" rx="10" fill="black" fill-opacity="0.2"/>
                        <rect x="5" y="5" width="100" height="250" rx="9.5" stroke="black"/>
                    </g>
                    <defs>
                        <filter id="filter0_g_23_42" x="0" y="0" width="100" height="250" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                            <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                            <feTurbulence type="fractalNoise" baseFrequency="0.55555558204650879 0.55555558204650879" numOctaves="3" seed="1558" />
                            <feDisplacementMap in="shape" scale="30.399999618530273" xChannelSelector="R" yChannelSelector="G" result="displacedImage" width="100" height="250" />
                            <feMerge result="effect1_texture_23_42">
                            <feMergeNode in="displacedImage"/>
                            </feMerge>
                        </filter>
                        <pattern id="pattern0_23_42" patternContentUnits="objectBoundingBox" width="1" height="1">
                            <use xlink:href="#image0_23_42" transform="matrix(0.000491159 0 0 0.000405544 0 -0.234035)"/>
                        </pattern>
                        <image id="image0_23_42" width="2036" height="3620" preserveAspectRatio="none" href="${data.imageSrc}"/>
                    </defs>
                </svg>
            </div>

            <p class="final-card-title">${data.title}</p>
            <p class="final-card-disc">${data.tagText[1]} &middot ${data.tagText[2]}</p>
            <button class="final-card-tag">${data.tagText[0]}</button>
        </div>
        `;

        this.shadowRoot.querySelector('.final-card').addEventListener('click', () => {

            const currentActive =
                document.querySelector('final-card.active');

            if (currentActive) {
                currentActive.classList.remove('active');
                updateBeatBlock(false);
            }

            if(currentActive != this){
                this.classList.add('active');
                updateBeatBlock(true);
            }

        });
    }
}
customElements.define('final-card', FinalCardDisplay);

class FinalCardManager extends HTMLElement {
    constructor() {
        super();
        this.rawData = [];
    }

    async connectedCallback() {
        const dataSource = this.getAttribute('src');
        try{
            const response = await fetch("games.json");
            const gameData = await response.json();

            this.rawData = gameData;

            this.switchMode('2d');
        }catch(error){
            this.innerHTML = `<p style="color: red;">Error loading data: ${error.message}</p>`;
        }
    }

    switchMode(modeType){
        this.innerHTML = '';
        const filteredData = this.rawData.filter(item => item.screen === modeType);
        const limit = (modeType === '2d') ? 3 : 2;
        const visibleCards = filteredData.slice(0, limit);

        visibleCards.forEach(item => {
            const card = document.createElement('final-card');
            card.render(item);
            this.appendChild(card);
        });
    }
}
customElements.define('final-card-manager', FinalCardManager);

const container = document.getElementById('toggle-container');
const btn2d = document.getElementById('slider-2d');
const btn3d = document.getElementById('slider-3d');

btn2d.addEventListener('click', () => {
    container.classList.remove('active-3d');
    btn2d.classList.add('active-text');
    btn3d.classList.remove('active-text');
});

btn3d.addEventListener('click', () => {
    container.classList.add('active-3d');
    btn3d.classList.add('active-text');
    btn2d.classList.remove('active-text');
});

const manager = document.getElementById('queue-manager');

document.getElementById('slider-2d').addEventListener('click', () => {
    manager.switchMode('2d');
    updateBeatBlock(false);
});

document.getElementById('slider-3d').addEventListener('click', () => {
    manager.switchMode('3d');
    updateBeatBlock(false);
});


