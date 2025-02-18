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
        const index = alphabet.indexOf(char.toLowerCase());
        if (index !== -1) {
            const newIndex = (index + (decrypt ? -shift : shift) + alphabetLength) % alphabetLength;
            return alphabet[newIndex];
        }
        return char;
    }).join('');
}

function decryptSubstitutionCipher(cipherText, mapping) {
    return cipherText.split('').map(char => {
        const lowerChar = char.toLowerCase();
        return alphabet.includes(lowerChar) ? mapping[lowerChar] || char : char;
    }).join('');
}

function trySubstitutionCipher(normalizedText, cleanedText) {
    const results = [];
    const mapping = breakSubstitutionCipher(cleanedText);
    const decryptedNormalizedText = decryptSubstitutionCipher(normalizedText, mapping);
    const decryptedCleanedText = cleanText(decryptedNormalizedText);
    const confidence = compareFrequencies(decryptedCleanedText);

    results.push({
        method: 'Подстановки',
        key: JSON.stringify(mapping),
        decryptedText: decryptedNormalizedText,
        confidence: confidence,
    });

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
    let decryptedText = '';
    let keyIndex = 0;
    for (let i = 0; i < cipherText.length; i++) {
        const char = cipherText[i].toLowerCase();
        if (alphabet.includes(char)) {
            const keyChar = key[keyIndex % key.length].toLowerCase();
            const charIndex = alphabet.indexOf(char);
            const keyIndexInAlphabet = alphabet.indexOf(keyChar);
            const decryptedIndex = (charIndex - keyIndexInAlphabet + alphabetLength) % alphabetLength;
            decryptedText += alphabet[decryptedIndex];
            keyIndex++;
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
    for (let i = 0; i < 5; i++) {
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

function altVigenere(normalizedText, cleanedText) {
    let keyLengths = getKeyLength(cleanedText);
    let results = [];
    for (let k of keyLengths) {
        let key = '';
        let blocks = splitBlocks(cleanedText, k);
        for (let bl of blocks) {
            let caesarResults = tryCaesarCipher(bl, bl);
            caesarResults.sort((a, b) => b.confidence - a.confidence);
            const shift = caesarResults[0].key;
            key += alphabet[shift];
        }
        let plain = vigenereDecrypt(normalizedText, key);
        let decryptedCleaned = cleanText(plain);
        let confidence = compareFrequencies(decryptedCleaned);
        results.push({
            method: "Виженер",
            key: key,
            decryptedText: plain,
            confidence: confidence,
        });
    }
    return results;
}

function tryVigenereCipher(normalizedText, cleanedText) {
    let results = [];
    let keyLengths = getKeyLength(cleanedText);

    for (let k of keyLengths) {
        let blocks = splitBlocks(cleanedText, k);
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
            let decryptedNormalizedText = vigenereDecrypt(normalizedText, key);
            let decryptedCleanedText = cleanText(decryptedNormalizedText);
            let confidence = compareFrequencies(decryptedCleanedText);
            results.push({
                method: 'Виженер',
                key: key,
                decryptedText: decryptedNormalizedText,
                confidence: confidence,
            });
        }
    }
    return results;
}

function tryCaesarCipher(normalizedText, cleanedText) {
    let results = [];
    for (let shift = 1; shift <= 32; shift++) {
        let decryptedNormalizedText = caesarCipher(normalizedText, shift, true);
        let decryptedCleanedText = cleanText(decryptedNormalizedText);
        let confidence = compareFrequencies(decryptedCleanedText);
        results.push({
            method: 'Цезарь',
            key: shift,
            decryptedText: decryptedNormalizedText,
            confidence: confidence,
        });
    }
    return results;
}

function breakSubstitutionCipher(text) {
    const freq = getCharacterFrequency(text);
    const sortedFreq = Object.entries(freq).sort((a, b) => b[1] - a[1]);
    const sortedRussian = Object.entries(russianLetterFrequency).sort((a, b) => b[1] - a[1]);

    const mapping = {};
    for (let i = 0; i < sortedFreq.length; i++) {
        const cipherChar = sortedFreq[i][0];
        const plainChar = sortedRussian[i][0];
        mapping[cipherChar] = plainChar;
    }
    return mapping;
}

function analyzeText() {
    document.getElementById('decryptedText').innerHTML = '';
    let encryptedText = document.getElementById('encryptedText').value.trim();
    let normalizedText = encryptedText.toLowerCase();
    let cleanedText = cleanText(normalizedText);

    if (cleanedText.length === 0) {
        alert('Пожалуйста, введите зашифрованный текст.');
        return;
    }

    let caesarResults = tryCaesarCipher(normalizedText, cleanedText);
    let vigenereResults = tryVigenereCipher(normalizedText, cleanedText);
    let substitutionResults = trySubstitutionCipher(normalizedText, cleanedText);
    let altVigenereResults = altVigenere(normalizedText, cleanedText);
    caesarResults.sort((a, b) => b.confidence - a.confidence);
    vigenereResults.sort((a, b) => b.confidence - a.confidence);
    substitutionResults.sort((a, b) => b.confidence - a.confidence);
    altVigenereResults.sort((a, b) => b.confidence - a.confidence);
    const topResults = [
        ...vigenereResults.slice(0, 2),
        ...altVigenereResults.slice(0, 2),
        ...caesarResults.slice(0, 3),
        ...substitutionResults.slice(0, 3)
    ];
    topResults.sort((a, b) => b.confidence - a.confidence);
    console.log(topResults);
    for (let result of topResults) {
        let resultDiv = document.createElement('div');
        resultDiv.className = 'result';
        let methodParagraph = document.createElement('p');
        methodParagraph.innerHTML = `<strong>Метод:</strong> ${result.method}`;
        let keyParagraph = document.createElement('p');
        keyParagraph.innerHTML = `<strong>Ключ:</strong> ${result.key}`;
        let confidenceParagraph = document.createElement('p');
        confidenceParagraph.innerHTML = `<strong>Уверенность:</strong> ${result.confidence.toFixed(4)}`;
        let decryptedTextParagraph = document.createElement('p');
        decryptedTextParagraph.innerHTML = `<strong>Результат:</strong><br>${result.decryptedText}`;
        resultDiv.appendChild(methodParagraph);
        resultDiv.appendChild(keyParagraph);
        resultDiv.appendChild(confidenceParagraph);
        resultDiv.appendChild(decryptedTextParagraph);
        document.getElementById('decryptedText').appendChild(resultDiv);
    }
}