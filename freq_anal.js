const charFrequency = {
    'о': 0.1097, 'е': .0845, 'а': .0801, 'и': .0735, 'н': .067,
    'т': .0626, 'с': .0547, 'р': .0473, 'в': .0454, 'л': .044,
    'к': .0349, 'м': .0321, 'д': .0298, 'п': .0281, 'у': .0262,
    'я': .0201, 'ы': .019, 'ь': .0174, 'г': .017, 'з': .0165,
    'б': .0159, 'ч': .0144, 'й': .0121, 'х': .0097, 'ж': .0094,
    'ш': .0073, 'ю': .0064, 'ц': .0048, 'щ': .0036, 'э': .0032,
    'ф': .0026, 'ъ': .0004, 'ё': .0004,
};

function getKeyByValue(obj, value) {
    return Object.keys(obj).find(key => obj[key] === value);
}

function getFrequency(ciphertext) {
    let ctCharFrequency = {};
    let textLength = ciphertext.length;

    for (let char of ciphertext) {
        if (!ctCharFrequency.hasOwnProperty(char) && charFrequency.hasOwnProperty(char)) {
            ctCharFrequency[char] = ciphertext.split(char).length - 1 / textLength;
        }
    }

    return Object.fromEntries(
        Object.entries(ctCharFrequency).sort((a, b) => b[1] - a[1])
    );
}

function decryptByChars(ciphertext) {
    ciphertext = ciphertext.toLowerCase();
    let ctCharFreq = getFrequency(ciphertext);
    let plainGuess = '';

    for (let char of ciphertext) {
        if (charFrequency.hasOwnProperty(char)) {
            let iFreq = ctCharFreq[char];
            let idx = Object.values(ctCharFreq).indexOf(iFreq);
            plainGuess += Object.keys(charFrequency)[idx];
        } else {
            plainGuess += char;
        }
    }

    return plainGuess;
}


async function checkWord(word){
    let data = {text: word};
    let url = `https://speller.yandex.net/services/spellservice.json/checkText?text=${word}`;
    let resp = await fetch(url);
    let body = await resp.json();
    return body[0]['s'];
}


async function countExistingWords(plainGuess){
    let words = plainGuess.split(' ');
    let count = 0;
    for(let w of words){
        if (await checkWord(w)){
            count++;
        }
    }
    return count;
}


let decrypted = 'синхрлфазптрон';

let validWordCount = await countExistingWords(decrypted);
console.log('Valid Words Count:', validWordCount);
