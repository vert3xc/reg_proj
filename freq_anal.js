const russianLetterFrequency = {
    'а': 0.0801,    'б': 0.0159,    'в': 0.0454,    'г': 0.0170,    'д': 0.0298,    'е': 0.0845,    'ё': 0.0004,
    'ж': 0.0094,    'з': 0.0165,    'и': 0.0735,    'й': 0.0121,    'к': 0.0349,    'л': 0.0440,    'м': 0.0321,
    'н': 0.0670,    'о': 0.1097,    'п': 0.0281,    'р': 0.0473,    'с': 0.0547,    'т': 0.0626,    'у': 0.0262,
    'ф': 0.0026,    'х': 0.0097,    'ц': 0.0048,    'ч': 0.0144,    'ш': 0.0073,    'щ': 0.0036,    'ъ': 0.0004,
    'ы': 0.0190,    'ь': 0.0174,    'э': 0.0032,    'ю': 0.0064,    'я': 0.0201
};

const russian_conicidence_index = 0.0557;
const random_conicidence_index = 0.0312;
const alphabet = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя';

function IndCo(text){
    let n = text.length;
    let freq = getCharacterFrequency(text);
    let sum = 0;
    for (let i in freq){
        sum += freq[i] * (freq[i] - 1);
    }
    return sum / (n * (n - 1));
}

function MutIndCo(text1, text2){
    let n = text1.length;
    let m = text2.length;
    let freq1 = getCharacterFrequency(text1);
    let freq2 = getCharacterFrequency(text2);
    let sum = 0;
    for (let i = 0; i < 32; i++){
        if (alphabet[i] in freq1 && alphabet[i] in freq2){
            sum += freq1[alphabet[i]] * freq2[alphabet[i]];
        }
    }
    return sum / (n * m);
}

function getKeyLength(text){
    let n = text.length;
    let key_lens = {};
    for (let i = 1; i <= 10; i++){
        let sum = 0;
        for (let j = 0; j < i; j++){
            let new_text = '';
            for (let k = j; k < n; k += i){
                new_text += text[k];
            }
            sum += IndCo(new_text);
        }
        let diff = Math.abs(sum / i - russian_conicidence_index);
        key_lens[i] = diff;
    }
    let keyLengthArray = Object.entries(key_lens);
    keyLengthArray.sort((a, b) => a[1] - b[1]);
    let key_len = keyLengthArray.slice(0, 3).map(x => x[0]);
    for (let i = 0; i < key_len.length; i++){
        key_len[i] = parseInt(key_len[i]);
    }
    return key_len;
}

function cleanText(text) {
    return text.replace(/[^а-яё]/gi, '').toLowerCase();
}

function getCharacterFrequency(text) {
    const freq = {};
    for (let char of text) {
        freq[char] = (freq[char] || 0) + 1;
    }
    return freq;
}

function getBigramFrequency(text) {
    const bigrams = {};
    for (let i = 0; i < text.length - 1; i++) {
        let bigram = text.slice(i, i + 2);
        bigrams[bigram] = (bigrams[bigram] || 0) + 1;
    }
    return bigrams;
}

function decryptCaesarCipher(text, shift) {
    return text.split('').map(char => {
        const charCode = char.charCodeAt(0);
        if (charCode >= 1072 && charCode <= 1103) {
            return String.fromCharCode(((charCode - 1072 + shift) % 32) + 1072);
        }
        return char;
    }).join('');
}

function caesarEncrypt(text, shift){
    return text.split('').map(char => {
        const charCode = char.charCodeAt(0);
        if (charCode >= 1072 && charCode <= 1103) {
            return String.fromCharCode(((charCode - 1072 + shift) % 32) + 1072);
        }
        return char;
    }).join('');
}

function analyzeText() {
    document.getElementById('decryptedText').innerHTML = ''; 
    const encryptedText = document.getElementById('encryptedText').value.trim();
    const cleanedText = cleanText(encryptedText);
    console.log(getKeyLength(encryptedText));
    const charFrequency = getCharacterFrequency(cleanedText);
    const bigramFrequency = getBigramFrequency(cleanedText);
    let bestDecryptedText = '';
    let bestShift = 0;
    let maxMatch = 0;
    for (let shift = 1; shift <= 32; shift++) {
        const decryptedText = decryptCaesarCipher(cleanedText, shift);
        const charMatch = compareFrequencies(decryptedText);
        if (charMatch > maxMatch) {
            maxMatch = charMatch;
            bestDecryptedText = decryptedText;
            bestShift = shift;
        }
    }

    document.getElementById('decryptedText').innerText = `Best Shift: ${bestShift}\nDecrypted Text:\n${bestDecryptedText}`;
}
function compareFrequencies(decryptedText) {
    const freq = getCharacterFrequency(decryptedText);
    let matchScore = 0;

    for (let letter in freq) {
        if (russianLetterFrequency[letter]) {
            const expectedFreq = russianLetterFrequency[letter];
            const observedFreq = freq[letter] / decryptedText.length;
            matchScore += Math.abs(expectedFreq - observedFreq);
        }
    }

    return 1 - matchScore;
}

function vigenereDecrypt(cipherText, key) {
    const alphabetLength = alphabet.length;

    let normalizedKey = '';
    for (let i = 0, j = 0; i < cipherText.length; i++) {
        if (alphabet.includes(cipherText[i].toLowerCase())) {
            normalizedKey += key[j % key.length].toLowerCase();
            j++;
        } else {
            normalizedKey += cipherText[i];
        }
    }

    let decryptedText = '';
    for (let i = 0; i < cipherText.length; i++) {
        const char = cipherText[i].toLowerCase();
        if (alphabet.includes(char)) {
            const charIndex = alphabet.indexOf(char);
            const keyIndex = alphabet.indexOf(normalizedKey[i]);
            const decryptedIndex = (charIndex - keyIndex + alphabetLength) % alphabetLength;
            decryptedText += alphabet[decryptedIndex];
        } else {
            decryptedText += char;
        }
    }

    return decryptedText;
}

function splitBlocks(text, key_len){
    let blocks = [];
    for (let i = 0; i < key_len; i++){
        let block = '';
        for (let j = i; j < text.length; j += key_len){
            block += text[j];
        }
        blocks.push(block);
    }
    return blocks;
}

function solveSystem(indeces, k){
    let shifts = {0: 0,};
    let known_values = [0];
    for(let i = 0; i < 3; i++){
        for (let index of indeces){
            if (known_values.includes(parseInt(index[1])) && !known_values.includes(parseInt(index[2]))){
                shifts[parseInt(index[2])] = parseInt(shifts[index[1]]) + parseInt(index[3]);
                known_values.push(parseInt(index[2]));
            }
        }
    }
    let final_shifts = {};
    for (let i = 0; i < k; i++){
        if (Object.keys(shifts).includes(i.toString())){
            final_shifts[i] = 32 - shifts[i];
        }else{
            final_shifts[i] = -1;
        }
    }
    return final_shifts;
}

function constructKeys(shifts, k){
    let keys = [];
    for (let i of alphabet) {
        let key = '';
        key += i;
        for (let j = 1; j < k; j++) { 
            if (Object.keys(shifts).includes(j.toString())) {
                let shift = parseInt(shifts[j]);
                key += caesarEncrypt(i, shift);
            } else {
                continue;
            }
        }
        keys.push(key);
    }
    return [keys, k - (Object.values(shifts).filter(x => x === -1).length)];
}

function breakVigenere() {
    document.getElementById('decryptedText').innerHTML = ''; 
    const encryptedText = document.getElementById('encryptedText').value.trim();
    const ct = cleanText(encryptedText);
    let key_lens = getKeyLength(ct);
    console.log('Key lengths:', key_lens);
    let n = ct.length;
    for (let k of key_lens) {
        let blocks = splitBlocks(ct, k);
        let indeces = [];
        console.log(`Проверяю длину ключа: ${k}`);
        for (let i = 0; i < blocks.length; ++i) {
            for (let j = 0; j < blocks.length; ++j) {
                if ((blocks[i] !== undefined && blocks[j] !== undefined) && i !== j) {
                    for (let shift = 0; shift < 32; ++shift) {
                        let index = MutIndCo(blocks[i], caesarEncrypt(blocks[j], shift));
                        if (index > 0.05){
                            indeces.push([index, i, j, shift]);
                        }
                    }
                }
            }
        }
        console.log(solveSystem(indeces, k));
        let keys = constructKeys(solveSystem(indeces, k), k);
        console.log('Ключи:', keys);
        for (let key of keys[0]) {
            let resultDiv = document.createElement('div');
            let keyParagraph = document.createElement('p');
            keyParagraph.innerText = `Ключ: ${key}`;
            let decryptedTextParagraph = document.createElement('p');
            decryptedTextParagraph.innerText = `Расшифрованный текст:\n${vigenereDecrypt(encryptedText, key)}`;
            resultDiv.appendChild(keyParagraph);
            resultDiv.appendChild(decryptedTextParagraph);
            document.getElementById('decryptedText').appendChild(resultDiv);
        }
    }
}