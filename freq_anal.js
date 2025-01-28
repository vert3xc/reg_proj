const russianLetterFrequency = {
    'а': 0.0801, 'б': 0.0159, 'в': 0.0454, 'г': 0.0170, 'д': 0.0298, 'е': 0.0845, 'ё': 0.0004,
    'ж': 0.0094, 'з': 0.0165, 'и': 0.0735, 'й': 0.0121, 'к': 0.0349, 'л': 0.0440, 'м': 0.0321,
    'н': 0.0670, 'о': 0.1097, 'п': 0.0281, 'р': 0.0473, 'с': 0.0547, 'т': 0.0626, 'у': 0.0262,
    'ф': 0.0026, 'х': 0.0097, 'ц': 0.0048, 'ч': 0.0144, 'ш': 0.0073, 'щ': 0.0036, 'ъ': 0.0004,
    'ы': 0.0190, 'ь': 0.0174, 'э': 0.0032, 'ю': 0.0064, 'я': 0.0201
};

const russianCoincidenceIndex = 0.0557;
const randomCoincidenceIndex = 0.0312;
const alphabet = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя';

function indexOfCoincidence(text) {
    const n = text.length;
    const freq = getCharacterFrequency(text);
    let sum = 0;
    for (let char in freq) {
        sum += freq[char] * (freq[char] - 1);
    }
    return sum / (n * (n - 1));
}

function mutualIndexOfCoincidence(text1, text2) {
    const n = text1.length;
    const m = text2.length;
    const freq1 = getCharacterFrequency(text1);
    const freq2 = getCharacterFrequency(text2);
    let sum = 0;
    for (let char of alphabet) {
        if (freq1[char] && freq2[char]) {
            sum += freq1[char] * freq2[char];
        }
    }
    return sum / (n * m);
}

function getKeyLength(text) {
    const n = text.length;
    const keyLengths = {};
    for (let i = 1; i <= 12; i++) {
        let sum = 0;
        for (let j = 0; j < i; j++) {
            let newText = '';
            for (let k = j; k < n; k += i) {
                newText += text[k];
            }
            sum += indexOfCoincidence(newText);
        }
        const diff = Math.abs(sum / i - russianCoincidenceIndex);
        keyLengths[i] = diff;
    }
    const keyLengthArray = Object.entries(keyLengths).sort((a, b) => a[1] - b[1]);
    return keyLengthArray.slice(0, 3).map(x => parseInt(x[0]));
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

function caesarCipher(text, shift, decrypt = false) {
    const alphabetLength = alphabet.length;
    return text.split('').map(char => {
        const index = alphabet.indexOf(char);
        if (index !== -1) {
            const newIndex = (index + (decrypt ? -shift : shift) + alphabetLength) % alphabetLength;
            return alphabet[newIndex];
        }
        return char;
    }).join('');
}

function decryptSubstitutionCipher(cipherText, mapping) {
    return cipherText.split('').map(char => {
        return mapping[char] || char;
    }).join('');
}

function trySubstitutionCipher(text) {
    const results = [];
    const mapping = breakSubstitutionCipher(text);
    const decryptedText = decryptSubstitutionCipher(text, mapping);
    const confidence = compareFrequencies(decryptedText);

    results.push({
        method: 'Подстановки',
        key: JSON.stringify(mapping),
        decryptedText: decryptedText,
        confidence: confidence,
    });

    return results;
}

function tryCaesarCipher(text) {
    let results = [];
    for (let shift = 1; shift <= 32; shift++) {
        let decryptedText = caesarCipher(text, shift, true);
        let confidence = compareFrequencies(decryptedText);
        results.push({
            method: 'Цезарь',
            key: shift,
            decryptedText: decryptedText,
            confidence: confidence,
        });
    }
    return results;
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
        let char = cipherText[i].toLowerCase();
        if (alphabet.includes(char)) {
            let charIndex = alphabet.indexOf(char);
            let keyIndex = alphabet.indexOf(normalizedKey[i]);
            let decryptedIndex = (charIndex - keyIndex + alphabetLength) % alphabetLength;
            decryptedText += alphabet[decryptedIndex];
        } else {
            decryptedText += char;
        }
    }
    return decryptedText;
}

function splitBlocks(text, keyLength) {
    const blocks = Array.from({ length: keyLength }, () => '');
    for (let i = 0; i < text.length; i++) {
        blocks[i % keyLength] += text[i];
    }
    return blocks;
}

function solveSystem(indices, k) {
    const shifts = { 0: 0 };
    const knownValues = [0];
    for (let i = 0; i < 3; i++) {
        for (let index of indices) {
            if (knownValues.includes(index[1]) && !knownValues.includes(index[2])) {
                shifts[index[2]] = shifts[index[1]] + index[3];
                knownValues.push(index[2]);
            }
        }
    }
    const finalShifts = {};
    for (let i = 0; i < k; i++) {
        finalShifts[i] = shifts[i] !== undefined ? 32 - shifts[i] : -1;
    }
    return finalShifts;
}

function constructKeys(shifts, k) {
    const keys = [];
    for (let char of alphabet) {
        let key = char;
        for (let j = 1; j < k; j++) {
            if (shifts[j] !== -1) {
                key += caesarCipher(char, shifts[j]);
            } else {
                continue;
            }
        }
        keys.push(key);
    }
    return [keys, k - Object.values(shifts).filter(x => x === -1).length];
}


function tryVigenereCipher(text) {
    let results = [];
    let keyLengths = getKeyLength(text);

    for (let k of keyLengths) {
        let blocks = splitBlocks(text, k);
        let indices = [];
        for (let i = 0; i < blocks.length; i++) {
            for (let j = 0; j < blocks.length; j++) {
                if (i !== j) {
                    for (let shift = 0; shift < 32; shift++) {
                        let index = mutualIndexOfCoincidence(blocks[i], caesarCipher(blocks[j], shift));
                        if (index > 0.05) {
                            indices.push([index, i, j, shift]);
                        }
                    }
                }
            }
        }
        let shifts = solveSystem(indices, k);
        let [keys] = constructKeys(shifts, k);

        for (let key of keys) {
            let decryptedText = vigenereDecrypt(text, key);
            let confidence = compareFrequencies(decryptedText);
            results.push({
                method: 'Виженер',
                key: key,
                decryptedText: decryptedText,
                confidence: confidence,
            });
        }
    }
    return results;
}

function analyzeText() {
    document.getElementById('decryptedText').innerHTML = '';
    let encryptedText = document.getElementById('encryptedText').value.trim();
    let cleanedText = cleanText(encryptedText);
    let results = [];
    let caesarResults = tryCaesarCipher(cleanedText);
    results.push(...caesarResults);
    let vigenereResults = tryVigenereCipher(cleanedText);
    results.push(...vigenereResults);
    results.sort((a, b) => b.confidence - a.confidence);
    for (let result of results) {
        let resultDiv = document.createElement('div');
        let methodParagraph = document.createElement('p');
        methodParagraph.innerText = `Метод: ${result.method}`;
        let keyParagraph = document.createElement('p');
        keyParagraph.innerText = `Ключ: ${result.key}`;
        let decryptedTextParagraph = document.createElement('p');
        decryptedTextParagraph.innerText = `Расшифрованный текст:\n${result.decryptedText}`;
        resultDiv.appendChild(methodParagraph);
        resultDiv.appendChild(keyParagraph);
        resultDiv.appendChild(decryptedTextParagraph);
        document.getElementById('decryptedText').appendChild(resultDiv);
    }
}
