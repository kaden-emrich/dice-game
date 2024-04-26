const activeDiceDiv = document.getElementById('active-dice-container');
const scoredDiceDiv = document.getElementById('scored-dice-container');

const scoreDisplay = document.getElementById('score-display');
const valueDisplay = document.getElementById('value-display');

const playButton = document.getElementById('play-button');
playButton.onclick = playDice;
const rollButton = document.getElementById('roll-button');
rollButton.onclick = () => {
    if(!canRoll) {
        errorDisplay.innerText = 'Play at least 1 dice to roll again.';
        return;
    }
    canRoll = false;
    rollButton.classList.add('roll-button-unavailable');

    if(activeValues.length < 1) {
        currentValue += getPlayValue(scoredValues);
        scoredValues = [];
        activeValues = createHand();
    }
    else {
        rollAll(activeValues);
    }

    updateDisplay();
};
const cashoutButton = document.getElementById('cashout-button');
cashoutButton.onclick = () => {
    if(currentValue < 500 || !canRoll) {
        currentValue = 0;
    }
    score += currentValue;
    currentValue = 0;
    resetDice();
    updateDisplay();
}

const errorDisplay = document.getElementById('error-display');

let minStraightSize = 5;

let handSize = 6;
let diceSize = 6;

let score = 0;
let currentValue = 0;

let scoredValues = [];
let activeValues = [];

let selectedValues = [];

let canRoll = false;
rollButton.classList.add('roll-button-unavailable');

function getRandomInt(min, max) {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The max exclusive and min inclusive
}

function rollDice() {
    return getRandomInt(1, diceSize+1);
}

function rollAll(dice) {
    for(let i = 0; i < dice.length; i++) {
        dice[i] = rollDice();
    }
    return dice;
}

function createHand() {
    let randValues = [];
    for(let i = 0; i < handSize; i++) {
        randValues[i] = rollDice();
    }

    return randValues;
}

function fillDice(dice) {
    for(let i = 0; i < dice.length; i++) {
        if(dice[i] == undefined) {
            dice[i] = rollDice();
        }
    }
    
    return dice;
}

function getPlayValue(dice) {
    let amounts = Array(diceSize + 1); // amounts[0] will be used as a stort of override
    amounts.fill(0);
    for(let i = 0; i < dice.length; i++) {
        amounts[dice[i]]++;
    }
    console.log(amounts); // for debugging

    let playValue = 0;

    // find 3+ of a kind and 3double and 2triple moves
    let numPairs = 0;
    let numTriples = 0;
    let straightSize = 0;
    let maxStraightSize = 0;
    let threeOfAKindValue = 0;
    for(let i = 1; i < amounts.length; i++) {
        if(amounts[i] == 1) {
            straightSize++;
        }
        else {
            straightSize = 0;
        }
        maxStraightSize = maxStraightSize < straightSize ? straightSize : maxStraightSize;

        if(amounts[i] == 2) {
            numPairs++;
        }
        else if(amounts[i] == 3) {
            numTriples++;
            if(i == 1) {
                playValue += 300;
                threeOfAKindValue += 300;
            }
            else {
                playValue += 100 * i;
                threeOfAKindValue += 100 * i;
            }
            amounts[i] = 0;
        }
        else if(amounts[i] > 3) {
            playValue += 1000 * (amounts[i] - 3);
            amounts[i] = 0;
        }
    }

    if(numPairs >= 3) {
        return 1500;
    }
    if(numTriples >= 2) {
        return 2500;
    }
    
    if(maxStraightSize >= minStraightSize) {
        return 1500 + 100*(maxStraightSize-minStraightSize);
    }

    // find remaining 5s and 1s
    console.log(amounts); // for debugging
    playValue += (amounts[1] * 100) + (amounts[5] * 50);
    amounts[0] -= amounts[1] + amounts[5];
    amounts[1] = 0;
    amounts[5] = 0;

    // check for remaining dice
    // play does not count if not all dice are used
    console.log(amounts); // for debugging
    for(let i = 0; i < amounts.length; i++) {
        if(amounts[i] > 0) {
            return 0;
        }
    }
    return playValue;
}

function oldGetPlayValue(dice) {
    if(dice == 1) {
        return 100;
    }
    if(dice == 5) {
        return 50;
    }

    if(dice.length >= 3) {
        let isSame = true;
        for(let i = 1; i < dice.length; i++) {
            if(dice[i] != dice[i-1]) {
                isSame = false;
                break;
            }
        }
        if(isSame) {
            if(dice.length == 3) {
                if(dice[0] == 1) {
                    return 300;
                }
                return dice[0] * 100;
            }
            if(dice.length == 4) {
                return 1000;
            }
            if(dice.length == 5) {
                return 2000;
            }
            if(dice.length == 6) {
                return 3000;
            }
        }
    }

    let onesAndFivesScore = 0;
    let trimedDice = [];
    for(let i = 0; i < dice.length; i++) {
        if(dice[i] == 1) {
            onesAndFivesScore += 100;
        }
        else if(dice[i] == 5) {
            onesAndFivesScore += 50;
        }
        else {
            trimedDice.push(dice[i]);
        }
    }
    console.log(trimedDice);

    if(trimedDice.length > 0) {
        let trimedValue = getPlayValue(trimedDice);
        if(trimedValue > 0) {
            return trimedValue + onesAndFivesScore;
        }
    }
    else {
        return onesAndFivesScore;
    }

    return 0;
}

function playDice() {
    let playedDice = [];
    for(let i = 0; i < activeValues.length; i++) {
        if(selectedValues[i]) {
            // console.log(`added dice ${activeValues[i]}`); // for debugging
            playedDice.push(activeValues[i]);
        }
    }

    let playValue = getPlayValue(playedDice);
    // console.log(`Value: ${playValue} (${playedDice})`); // for debugging

    if(playValue == 0) {
        errorDisplay.innerText = 'Play is invalid';
        return;
    }

    canRoll = true;
    rollButton.classList.remove('roll-button-unavailable');

    // currentValue += playValue;

    let newActiveValues = [];
    for(let i = 0; i < activeValues.length; i++) {
        if(selectedValues[i]) {
            scoredValues.push(activeValues[i]);
        }
        else {
            newActiveValues.push(activeValues[i]);
        }
    }

    activeValues = newActiveValues;
    updateDisplay();
}

function updateDisplay() {
    errorDisplay.innerText = '';
    scoreDisplay.innerText = score;
    valueDisplay.innerText = currentValue + getPlayValue(scoredValues);
    activeValues = fillDice(activeValues);
    selectedValues = [];

    activeDiceDiv.innerHTML = '';
    for(let i = 0; i < activeValues.length; i++) {
        selectedValues[i] = false;
        let nextDice = document.createElement('div');
        nextDice.classList.add('active-dice');
        nextDice.innerText = activeValues[i];

        nextDice.onclick = () => {
            nextDice.classList.toggle('dice-selected');
            selectedValues[i] = !selectedValues[i];
        }

        activeDiceDiv.appendChild(nextDice);
    }

    scoredDiceDiv.innerHTML = '';
    for(let i = 0; i < scoredValues.length; i++) {
        selectedValues[i] = false;
        let nextDice = document.createElement('div');
        nextDice.classList.add('dice-scored');
        nextDice.innerText = scoredValues[i];

        // nextDice.onclick = () => {
        //     nextDice.classList.toggle('dice-selected');
        //     selectedValues[i] = !selectedValues[i];
        // }

        scoredDiceDiv.appendChild(nextDice);
    }
}

function resetDice() {
    activeValues = createHand();
    scoredValues = [];
    canRoll = false;
}

function init() {
    resetDice();
    updateDisplay();
}
init();
