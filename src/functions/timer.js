function updateIdleTimerValue(value) {
    $('#idleTimeDisplay').text(value);
    Cookies.set('idleTimeTotal', value, {expires: 30, path: '/'});
}

function startIdleTimer() {
    //idleTotal timer
    var idleTimerValue = parseInt(Cookies.get('idleTimeTotal')) || 0;

    updateIdleTimerValue(idleTimerValue);

    setInterval(() => {
        idleTimerValue++;
        updateIdleTimerValue(idleTimerValue);
    }, 1000); // Update every second
}