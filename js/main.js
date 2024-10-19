import { wordList } from './wordList.js';
import { itemData, triggerKeys } from './itemData.js';

let masterCount = 0;
let autoKpm = 0;
let rawKpm = 0;
let typedKeysCount = 0;
let typeText = '';
let order = [];
let shuffledOrder = [];
let itemBelongings = Array(itemData.length).fill(0);
let isSave = true;
let validGolden = false;
let setGolden = false;

for (let i = 0; i < itemData.length; i++) {
    const itemList = generateItemDom(i + 1);
    document.getElementById('item-list').appendChild(itemList);
}

const typingArea = document.getElementById('typing_area');
const itemButtons = document.getElementsByClassName('items');
const canvas = document.getElementById('keyboard-area');

for (let i = 0; i < itemButtons.length; i++) {
    itemButtons[i].addEventListener('click', () => {
        buyItem(i);
    });
}

setWordEnglish(1000, typingArea);
loadData();
setItemName();
setItemBelongings();
setNextGolden();
renderItems();

const update = () => {
    autoKpm = calculateAutoKpm();
    masterCount += autoKpm / 10;
    const formattedCount = getNumberUnit(masterCount, 0);
    document.getElementById('typed_count').innerText = formattedCount;
    const kps = (autoKpm + rawKpm).toFixed(1);
    const formattedKps = getNumberUnit(kps, 1);
    document.getElementById('kps').innerText = formattedKps;
    saveData();
}

setInterval(() => {
    update();
}, 100);
setInterval(() => {
    createFallingKeyboard();
}, 300);
setInterval(() => {
    updateRawKpm();
}, 1000);

function setNextGolden() {
    setTimeout(() => {
        setGolden = true;
        setNextGolden();
    }, determineNextGolden());
}

function enterGolden() {
    validGolden = true;
    setGolden = false;
    canvas.classList.add('gold');

    setTimeout(() => {
        validGolden = false;
        canvas.classList.remove('gold');
    }, 20000);
}

function determineNextGolden() {
    const next = Math.floor(Math.random() * 10000) + 60000;
    return next; //ms
}

window.onload = adjustCanvasSize;
window.onresize = adjustCanvasSize;


const legacyButton = document.getElementById('legacy');
legacyButton.addEventListener('click', () => {
    resetData();
});

const ctx = document.getElementById('myChart');

const chart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'raw-kps',
            data: [],
            backgroundColor: "#FF69B4",
            borderColor: "#FF69B4",
            borderWidth: 1,
            tension: 0.3
        }]
    },
    options: {
        scales: {
            y: {
                beginAtZero: false
            }
        }
    }
});

setInterval(() => {
    const rawKps = Math.floor(rawKpm);
    chart.data.datasets[0].data.push(rawKps);
    chart.data.labels.push('');
    if (chart.data.datasets[0].data.length > 20) {
        chart.data.datasets[0].data.shift();
        chart.data.labels.shift();
    }
    chart.update();
}, 1000);

function saveData() {
    if (!isSave) return;
    const data = {
        c: Math.floor(masterCount),
        b: itemBelongings
    };
    localStorage.setItem('cookeyData', JSON.stringify(data));
}

function loadData() {
    const data = JSON.parse(localStorage.getItem('cookeyData'));
    if (!data) return;
    if (data.c) masterCount = data.c;
    if (data.b) {
        itemBelongings = data.b;
        if (itemBelongings.length < itemData.length) {
            itemBelongings = Array(itemData.length).fill(0);
        }
    }
}

function resetData() {
    isSave = false;
    localStorage.removeItem('cookeyData');
    if (! localStorage.getItem('cookeyData')) location.reload();
}

function generateItemDom(num) {
    const item = document.createElement('div');
    item.className = 'items py-2 px-4 mb-2 bg-secondary text-white d-flex justify-content-between align-items-center rounded-3';

    const wrapper = document.createElement('div');
    wrapper.className = 'd-flex flex-column text-center mx-3';

    const name = document.createElement('h3');
    name.className = 'fs-4 item-name';

    const info = document.createElement('span');
    info.className = 'item-info';
    info.style.whiteSpace = 'nowrap';

    const price = document.createElement('span');
    price.className = 'item-price';
    
    const cnt = document.createElement('span');
    cnt.id = `item-cnt-${num}`;
    cnt.className = 'fs-3 item-cnt';
    cnt.innerText = '0';

    info.appendChild(price);
    wrapper.appendChild(name);
    wrapper.appendChild(info);
    item.appendChild(wrapper);
    item.appendChild(cnt);

    return item;
}

function updateRawKpm() {
    rawKpm = typedKeysCount;
    const rawKps = typedKeysCount;
    const formattedRawKps = getNumberUnit(rawKps, 1);
    document.getElementById('raw-kps').innerText = formattedRawKps;
    typedKeysCount = 0;
}

function drawGlowEffect() {
    const canvas = document.getElementById('glowCanvas');
    const ctx = canvas.getContext('2d');

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(canvas.width, canvas.height) / 2;

    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function adjustCanvasSize() {
    const img = document.getElementById('keyboard');
    const canvas = document.getElementById('glowCanvas');

    canvas.width = img.width + 300;
    canvas.height = img.height + 300;

    drawGlowEffect();
}

function renderItems() {
    const itemCounts = document.getElementsByClassName('item-cnt');
    const itemPrices = document.getElementsByClassName('item-price');

    for (let i = 0; i < itemCounts.length; i++) {
        const cnt = itemBelongings[i];
        const itemPrice = calcPrice(itemData[i].price, cnt);
        const formattedItemPrice = getNumberUnit(itemPrice, 0);
        if (i === 0 || itemBelongings[i-1] > 0) {
            itemPrices[i].innerText = formattedItemPrice + ' keys[' + itemData[i].trigger + ']';
            const pow = addBonus(itemData[i].power, cnt);
            itemPrices[i].innerText += ' (' + pow + ' kps)';
        }
    }
    setItemName();
}

function createFallingKeyboard() {
    const keyboardImg = document.createElement('img');
    keyboardImg.src = 'images/keyboard.png';
    keyboardImg.className = 'falling';
    if (setGolden) {
        keyboardImg.classList.add('golden');
        setGolden = false;
    }

    const header = document.querySelector('header');
    header.appendChild(keyboardImg);

    const randomX = Math.random() * window.innerWidth;
    keyboardImg.style.left = `${randomX}px`;

    setTimeout(() => {
        keyboardImg.remove();
    }, 6000);
}

function calculateAutoKpm() {
    let newKpm = 0;
    for (let i = 0; i < itemData.length; i++) {
        const itemCount = itemBelongings[i];
        const basePower = itemData[i].power * itemCount;
        newKpm += addBonus(basePower, itemCount);
    }
    return newKpm;
}

function setWordEnglish(keysCount, typingArea) {
    let shuffledWordList;
    shuffledWordList = fisherYatesShuffle(wordList);
    typeText = shuffledWordList.join(' ');
    typingArea.value = typeText.slice(0, keysCount);

    order = [];
    shuffledOrder = [];

    for (let i = 0; i < (keysCount * 2); i++) order.push(i);
    shuffledOrder = reorder(fisherYatesShuffle(order), keysCount);

    window.addEventListener('keydown', judgeKeys, false);

    return;
}

function judgeKeys(e) {
    e.preventDefault();
    let typedKey = e.key;
    let nextKey = typeText[0];

    if (typedKey === nextKey) {
        correctType(typedKey);
    } else {
        if (triggerKeys.includes(typedKey)) {
            buyItem(typedKey);
        } else {
            incorrectType(typedKey);
        }
    }
}

function buyItem(typedKey) {
    const idx = triggerKeys.indexOf(typedKey);
    const baseItemPrice = itemData[Number(idx)].price;

    const itemCounts = document.getElementsByClassName('item-cnt');
    
    const itemIndex = Number(typedKey) - 1;
    const currentCount = itemBelongings[itemIndex];

    const itemPrice = calcPrice(baseItemPrice, currentCount);

    if (masterCount >= itemPrice) {
        masterCount -= itemPrice;
        itemCounts[itemIndex].innerText = currentCount + 1;
        itemBelongings[itemIndex] += 1;
        renderItems();
    }
}

function calcPrice(basePrice, currentCount) {
    return Math.floor(basePrice * (1.15 ** currentCount));
}

function setItemName() {
    const itemNames = document.getElementsByClassName('item-name');
    for (let i = 0; i < itemNames.length; i++) {
        const name = i === 0 || itemBelongings[i-1] > 0 ? itemData[i].name : '???';
        itemNames[i].innerText = name;
    }
}
function setItemBelongings() {
    const itemCounts = document.getElementsByClassName('item-cnt');
    for (let i = 0; i < itemCounts.length; i++) {
        itemCounts[i].innerText = itemBelongings[i];
    }
}

function addBonus(pow, cnt) {
    const bonus = Math.floor(cnt / 25) + 1;
    return pow * bonus;
}

function correctType(key) {
    typeText = typeText.slice(1);
    typingArea.value = typeText;
    const baseKps = autoKpm;
    let addCount = Math.max(1, Math.floor(baseKps));
    if (validGolden) addCount *= 77;
    typedKeysCount += addCount;
    masterCount += addCount;
    renderPlusAnimation(addCount);
    if (typeText.length === 0) {
        setWordEnglish(1000, typingArea);
    }
}

function incorrectType(key) {
    const golden = document.getElementsByClassName('golden')[0];
    if (golden && key === 'Enter') {
        enterGolden();
        golden.remove();
        return;
    }

    typingArea?.classList.add('missed');
    setTimeout(() => {
        typingArea?.classList.remove('missed');
    }, 1000);
}

function renderPlusAnimation(addCount) {
    const plus = document.createElement('h3');
    plus.className = 'plus text-white fs-3 position-absolute fade-animation';
    plus.innerText = `+${addCount}`;

    const keyboardImg = document.getElementById('keyboard');
    const rect = keyboardImg.getBoundingClientRect();

    const parentRect = canvas.getBoundingClientRect();
    const randomXOffset = Math.random() * rect.width - rect.width / 2;
    const randomYOffset = Math.random() * rect.height - rect.height / 2;

    plus.style.left = `${rect.left - parentRect.left + rect.width / 2 + randomXOffset}px`;
    plus.style.top = `${rect.top - parentRect.top + rect.height / 2 + randomYOffset}px`;

    plus.style.zIndex = '100'; 

    canvas.appendChild(plus);

    setTimeout(() => {
        plus.remove();
    }, 1000);
}


function fisherYatesShuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function reorder(array, cnt) {
    let result = [...array];
    let cnt2 = cnt * 2;
    for (let i = 0; i < array.length; i++) {
        let a = array[i];
        let b = (a + cnt) % cnt2;
        let aIndex = i;
        let bIndex = array.indexOf(b);
        if (a < b && aIndex > bIndex) {
            [result[aIndex], result[bIndex]] = [result[bIndex], result[aIndex]];
        }
    }
    return result;
}

function getNumberUnit(num, round = 1) {
    num = Number(num);
    const unit = Math.floor(Math.round(num / 1.0e+1).toLocaleString().replaceAll(',', '').length),
        wunit = ["Thousand","Million","Billion","Trillion","Quadrillion","Quintillion","Sextillion","Septillion","Octillion","Nonillion","Decillion","Undecillion","Duodecillion","Tredecillion","Quattuordecillion","Quindecillion","Sexdecillion","Septemdecillion","Octodecillion","Novemdecillion","Vigintillion","Unvigintillion","Duovigintillion","Trevigintillion","Quattuorvigintillion","Quinvigintillion","Sexvigintillion","Septvigintillion","Octovigintillion","Nonvigintillion","Trigintillion","Untrigintillion","Duotrigintillion"][Math.floor(unit / 3) - 1],
        funit = Math.abs(Number(num))/Number('1.0e+'+(unit-unit%3));
    return wunit ? funit.toFixed(round).toLocaleString() + ' ' + wunit : num.toFixed(round).toString();
}