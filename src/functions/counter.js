function updateCounterValue(value) {
    $('#counterDisplay').text(value);
    Cookies.set('money', value, {expires: 30, path: '/home/'});
}

function updateCountdownValue(value) {
    $('#intervalDisplay').text(value);
    Cookies.set('interval', value, {expires: 30, path: '/home/'});
}

function startCounter() {
    //money counter
    var counterValue = parseInt(Cookies.get('money')) || 0;
    //interval counter
    var intervalValue = parseInt(Cookies.get('interval')) || 5;

    updateCounterValue(counterValue);
    updateCountdownValue(intervalValue);

    setInterval(() => {
        if (intervalValue <= 1) {
            intervalValue = parseInt(Cookies.get('interval')) || 5;
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