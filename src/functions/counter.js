function updateCounterValue(value) {
    $('#counterDisplay').text(value);
    basil.set('money', value);
}

function updateCountdownValue(value) {
    $('#intervalDisplay').text(value);
    basil.set('interval', value);
}

function startCounter() {
    //money counter
    var counterValue = parseInt(basil.get('money')) || 0;
    //interval counter
    var intervalValue = parseInt(basil.get('interval')) || 5;

    updateCounterValue(counterValue);
    updateCountdownValue(intervalValue);

    setInterval(() => {
        if (intervalValue < 0) {
            intervalValue = parseInt(basil.get('interval')) || 5;
        } else {
            intervalValue--;
        }
        updateCountdownValue(intervalValue);

    }, 1000);

    setInterval(() => {
        counterValue++;
        updateCounterValue(counterValue);
    }, 5000);
}