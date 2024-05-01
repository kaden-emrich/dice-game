const activeDiceDiv = document.getElementById('active-dice-container');
const scoredDiceDiv = document.getElementById('scored-dice-container');

const scoreDisplay = document.getElementById('score-display');
const valueDisplay = document.getElementById('value-display');
const multiplierDisplay = document.getElementById('multiplier-display');
const typeDisplay = document.getElementById('type-display');

const playButton = document.getElementById('play-button');
playButton.onclick = () => {
    if(!animating) {
        playDice();
    }
};
const rollButton = document.getElementById('roll-button');
rollButton.onclick = () => {
    if(!animating) {
        if(!canRoll) {
            errorDisplay.innerText = 'Play at least 1 dice to roll again.';
            return;
        }
        canRoll = false;
        rollButton.classList.add('roll-button-unavailable');

        if(activeValues.length < 1) {
            currentValue += getPlayValue(scoredValues).points;
            multiplier += multiplierIncrement;
            scoredValues = [];
            updateDisplay();
            activeValues = createHand();
            animateRoll(updateDisplay);
        }
        else {
            // rollAll(activeValues);
            animateRoll(updateDisplay);
        }

    }
};
const cashoutButton = document.getElementById('cashout-button');
cashoutButton.onclick = () => {
    if(!animating) {
        currentValue += getPlayValue(scoredValues).points;
        if(currentValue < 500 || !canRoll) {
            currentValue = 0;
        }
        score += currentValue * multiplier;
        multiplier = 1;
        currentValue = 0;
        resetDice();
        updateDisplay();
        animateRoll(updateDisplay);
    }
}

const errorDisplay = document.getElementById('error-display');

const numberWords = [
    "Zero", 
    "One", 
    "Two", 
    "Three", 
    "Four", 
    "Five", 
    "Six",
    "Seven",
    "Eight",
    "Nine"
];

const pluralNumberWords = [
    "Zeros", 
    "Ones", 
    "Twos", 
    "Threes", 
    "Fours", 
    "Fives", 
    "Sixes",
    "Sevens",
    "Eights",
    "Nines"
];

const multiplierWords = [
    'No',
    'Single',
    'Double',
    'Triple',
    'Quadruple',
    'Quintuple',
    'Sextuple',
    'Septuple',
    'Noncuple',
    'Dectuple'
];

let animationDelay = 100;

let animating = false;

let minStraightSize = 5;

let handSize = 6;
let diceSize = 6;

let score = 0;
let currentValue = 0;

let multiplier = 1;
let multiplierIncrement = 1;

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

function getSelectedDice() {
    let output = [];
    for(let i = 0; i < selectedValues.length; i++) {
        if(selectedValues[i]) {
            output.push(activeValues[i]);
        }
    }
    return output;
}

function getPlayValue(dice) {
    let output = {
        points: 0,
        type: ''
    };

    let amounts = Array(diceSize + 1); // amounts[0] will be used as a stort of override
    amounts.fill(0);
    for(let i = 0; i < dice.length; i++) {
        amounts[dice[i]]++;
    }
    // console.log(amounts); // for debugging

    // straights
    let straightSize = 0;
    let straightStart = 0;
    let maxStraightStart = 0;
    let maxStraightSize = 0;
    for(let i = 1; i < amounts.length; i++) {
        if(amounts[i] > 0) {
            if(straightSize < 1) {
                straightStart = i;
            }
            straightSize++;
        }
        else {
            straightSize = 0;
        }
        
        if(straightSize >= maxStraightSize) {
            maxStraightSize = straightSize;
            maxStraightStart = straightStart;
        }
    }
    // console.log(`straight length: ${maxStraightSize}, starts at: ${maxStraightStart}`); // for debugging

    // find 3+ of a kind and 3double and 2triple moves
    // also remove straight parts if neccissary
    let numDoubles = 0;
    let doubles = [];
    let numTriples = 0;
    let triples = [];
    let numQuads = 0;
    let quads = [];
    let threeOfAKindValue = 0;
    for(let i = 1; i < amounts.length; i++) {
        if(
            amounts[i] > 0 &&
            maxStraightSize >= minStraightSize && 
            i >= maxStraightStart &&
            i < maxStraightStart + maxStraightSize
        ) {
            amounts[i]--;
        }

        if(amounts[i] == 2) {
            numDoubles++;
            doubles.push(i);
        }
        if(amounts[i] == 3) {
            numTriples++;
            if(i == 1) {
                output.points += 300;
                threeOfAKindValue += 300;
            }
            else {
                output.points += 100 * i;
                threeOfAKindValue += 100 * i;
            }
            output.type = `${multiplierWords[3]} ${pluralNumberWords[i]}`;
            amounts[i] = 0;
            triples.push(i);
        }
        else if(amounts[i] > 3) {
            numQuads++;
            output.points += 1000 * (amounts[i] - 3);
            output.type = `${multiplierWords[amounts[i]]} ${pluralNumberWords[i]}`;
            if(amounts[i] == 4) {
                quads.push(i);
            }
            amounts[i] = 0;
        }
    }
    // console.log(amounts); // for debugging
    // console.log(`${numDoubles}, ${numTriples}, ${numQuads}`); // for debugging

    if(numQuads == 1 && numDoubles == 1) {
        let quadNum = quads[0];
        let doubNum = doubles[0];
        output.points = 1500;
        output.type = `Quadouble: ${pluralNumberWords[quadNum]} and ${pluralNumberWords[doubNum]}`;
        return output;
    }

    if(numDoubles >= 3) {
        output.points = 1500;
        output.type = `Triple-Doubles: ${pluralNumberWords[doubles[0]]}, ${pluralNumberWords[doubles[1]]}, and ${pluralNumberWords[doubles[2]]}`;
        return output;
    }
    if(numTriples >= 2) {
        output.points = 2500;
        output.type = `Double-Triples: ${pluralNumberWords[triples[0]]} and ${pluralNumberWords[triples[1]]}`;
        return output;
    }
    
    if(maxStraightSize >= minStraightSize) {
        output.points = 1500 + 100*(maxStraightSize-minStraightSize);
        output.type = `Straight-${numberWords[maxStraightSize]}`;
    }

    if(numTriples == 1 && numDoubles == 1) {
        output.points += 300;
        output.type = `Full-House: ${pluralNumberWords[triples[0]]} and ${pluralNumberWords[doubles[0]]}`;
        amounts[doubles[0]] -= 2;
    }

    // find remaining 5s and 1s
    let extraPoints = (amounts[1] * 100) + (amounts[5] * 50);
    output.points += extraPoints;
    amounts[0] -= amounts[1] + amounts[5];
    output.type += extraPoints > 0 ? ` +${extraPoints}` : '';
    amounts[1] = 0;
    amounts[5] = 0;

    // check for remaining dice
    // play does not count if not all dice are used
    // console.log(amounts); // for debugging
    for(let i = 0; i < amounts.length; i++) {
        if(amounts[i] > 0) {
            output.points = 0;
            output.type = '';
            return output;
        }
    }
    return output;
}

function playDice() {
    let playedDice = [];
    for(let i = 0; i < activeValues.length; i++) {
        if(selectedValues[i]) {
            // console.log(`added dice ${activeValues[i]}`); // for debugging
            playedDice.push(activeValues[i]);
        }
    }
    if(playedDice.length < 1) {
        errorDisplay.innerText = 'Play is invalid';
        return;
    }
    playedDice = playedDice.concat(scoredValues);


    let playValue = getPlayValue(playedDice).points;
    // console.log(`Value: ${playValue} (${playedDice})`); // for debugging

    if(playValue == 0) {
        errorDisplay.innerText = 'Play is invalid';
        return;
    }

    animating = true;
    canRoll = true;
    rollButton.classList.remove('roll-button-unavailable');

    // currentValue += playValue;

    let newActiveValues = [];
    let newScoredValues = [];
    for(let i = 0; i < activeValues.length; i++) {
        if(selectedValues[i]) {
            newScoredValues.push(activeValues[i]);
        }
        else {
            newActiveValues.push(activeValues[i]);
        }
    }

    newScoredValues.sort();
    activeValues = newActiveValues;
    for(let i = 0; i < newScoredValues.length; i++) {
        setTimeout(() => {
            scoredValues.push(newScoredValues[i]);
            scoredValues.sort();

            updateDisplay();
        }, animationDelay*i);
    }
    setTimeout(() => {
        updateDisplay();
        animating = false;
    }, animationDelay*newScoredValues.length);
}

function animateRoll(callback) {
    animating = true;
    rollAll(activeValues);
    activeDiceDiv.innerHTML = '';
    for(let i = 0; i < activeValues.length; i++) {
        selectedValues[i] = false;
        let nextDice = document.createElement('div');
        nextDice.classList.add('active-dice');
        nextDice.innerText = activeValues[i];

        setTimeout(() => {
            activeDiceDiv.appendChild(nextDice);
        }, animationDelay*i);
    }

    setTimeout(() => {
        callback();
        animating = false;
    }, animationDelay*activeValues.length);
}

function updateDisplay() {
    let dicePlay = getPlayValue(scoredValues);
    errorDisplay.innerText = '';
    scoreDisplay.innerText = score;
    valueDisplay.innerText = currentValue + dicePlay.points;
    if(dicePlay.points > 0) {
        typeDisplay.innerText = `${dicePlay.type} (${dicePlay.points})`;
    }
    else {
        typeDisplay.innerText = `${dicePlay.type}`;
    }
    multiplierDisplay.innerText = multiplier;
    activeValues = fillDice(activeValues);
    selectedValues = [];

    // activeValues.sort();
    activeDiceDiv.innerHTML = '';
    for(let i = 0; i < activeValues.length; i++) {
        selectedValues[i] = false;
        let nextDice = document.createElement('div');
        nextDice.classList.add('active-dice');
        nextDice.innerText = activeValues[i];

        nextDice.onclick = () => {
            nextDice.classList.toggle('dice-selected');
            selectedValues[i] = !selectedValues[i];
            
            let tempVals = scoredValues.concat(getSelectedDice());
            // console.log(tempVals); // for debugging
            let tempPlay = getPlayValue(tempVals);
            if(tempPlay.points > 0) {
                typeDisplay.innerText = `${tempPlay.type} (${tempPlay.points})`;
            }
            else {
                typeDisplay.innerText = `${tempPlay.type}`;
            }
        }

        activeDiceDiv.appendChild(nextDice);
    }

    scoredValues.sort();
    scoredDiceDiv.innerHTML = '';
    for(let i = 0; i < scoredValues.length; i++) {
        selectedValues[i] = false;
        let nextDice = document.createElement('div');
        nextDice.classList.add('dice-scored');
        nextDice.innerText = scoredValues[i];
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
