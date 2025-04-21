let encodedData = [];
let currentErrorPos = -1;

function encodeData() {
    const input = document.getElementById('dataBits').value;
    if (!/^[01]{4,16}$/.test(input)) {
        showError("Invalid input! Please enter 4-16 binary digits (0/1)");
        return;
    }
    
    const dataBits = input.split('').map(Number).reverse();
    
    encodedData = hammingEncode(dataBits);
    currentErrorPos = -1;
    visualizeBits(encodedData);
    addStep(`🔢 Original Data: ${input}`);
    addStep(`🔒 Final Encoded Data: ${encodedData.join('').split('').reverse().join('')}`);
}

function introduceError() {
    const pos = parseInt(document.getElementById('errorPos').value) - 1;
    if (pos < 0 || pos >= encodedData.length) {
        showError("Invalid error position!");
        return;
    }
    
    encodedData[pos] ^= 1;
    currentErrorPos = pos;
    visualizeBits(encodedData);
    addStep(`⚠️ Introduced error at position ${pos + 1}`);
}

function calculateSyndrome() {
    let syndrome = 0;
    
    for (let i = 0; i < Math.log2(encodedData.length); i++) {
        const parityPos = Math.pow(2, i);
        let parity = 0;

        for (let j = parityPos - 1; j < encodedData.length; j++) {
            if (Math.floor((j + 1) / parityPos) % 2 === 1) {
                parity ^= encodedData[j];
            }
        } 
        // if parity is 0, no error becuase exor of same numbers is always 0

        if (parity !== 0) {
            syndrome += parityPos;
            addStep(`Parity check P${parityPos} failed - adding ${parityPos} to syndrome`);
        }
    }
    
    addStep(`Final syndrome value: ${syndrome}`);
    return syndrome;
}

function correctError() {
    addStep("Starting error detection...");
    const syndrome = calculateSyndrome();
    
    if (syndrome === 0) {
        addStep("No errors detected!");
        return;
    }
    
    const errorPos = syndrome - 1; 
    addStep(`Error found at position ${syndrome}`);
    
    encodedData[errorPos] ^= 1;
    
    visualizeBits(encodedData);
    highlightCorrectedBit(errorPos);
    currentErrorPos = -1;
}

function hammingEncode(data) {
    const m = data.length;
    let r = 1;
    while (Math.pow(2, r) < m + r + 1) r++;
    
    const encoded = [];
    let dataIndex = 0;
    
    for (let i = 1; i <= m + r; i++) {
        if ((i & (i - 1)) === 0) {
            encoded.push(0); 
        } else {
            encoded.push(data[dataIndex++]); 
        }
    }

    for (let i = 0; i < r; i++) {
        const parityPos = Math.pow(2, i);
        let parity = 0;
        const coverage = [];
        
        for (let j = parityPos - 1; j < encoded.length; j += 2 * parityPos) {
            for (let k = 0; k < parityPos && j + k < encoded.length; k++) {
                if (j + k !== parityPos - 1) {
                    parity ^= encoded[j + k];
                    coverage.push(j + k + 1);
                }
            }
        }
        
        encoded[parityPos - 1] = parity;
        addStep(`🧮 P${parityPos}: Covers positions ${coverage.join(', ')} = ${parity}`);
    }
    
    return encoded;
}

function visualizeBits(bits) {
    const container = document.getElementById('visualization');
    container.innerHTML = '<h3 style="text-align: center; color: #2c3e50;">Encoded Data (MSB to LSB)</h3>';
    const bitsDiv = document.createElement('div');
    bitsDiv.className = 'bits-container';

    const totalBits = bits.length;
    bits.slice().reverse().forEach((bit, displayIndex) => {
        const actualIndex = totalBits - displayIndex - 1;
        const position = actualIndex + 1;
        const isParity = isPowerOfTwo(position);
        const isError = position === (currentErrorPos + 1);
        
        const bitDiv = document.createElement('div');
        bitDiv.className = `bit ${isParity ? 'parity-bit' : 'data-bit'} ${isError ? 'error-bit' : ''}`;
        
        bitDiv.innerHTML = `
            <div>${bit}</div>
            <div class="bit-index">${isParity ? 'P' : 'D'}${position}</div>
        `;
        
        bitsDiv.appendChild(bitDiv);
    });
    
    container.appendChild(bitsDiv);
}

function highlightCorrectedBit(pos) {
    const bits = document.getElementsByClassName('bit');
    const targetIndex = encodedData.length - pos - 1;
    bits[targetIndex].classList.add('highlight');
    setTimeout(() => {
        bits[targetIndex].classList.remove('highlight');
    }, 500);
}

function addStep(message) {
    const stepsDiv = document.getElementById('steps');
    const step = document.createElement('div');
    step.className = 'step';
    step.innerHTML = `⏱️ ${new Date().toLocaleTimeString()}: ${message}`;
    stepsDiv.appendChild(step);
    stepsDiv.scrollTop = stepsDiv.scrollHeight;
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = message;
    document.body.prepend(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
}

function isPowerOfTwo(n) {
    return n !== 0 && (n & (n - 1)) === 0;
}