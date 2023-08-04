function updateIdleTimerValue(value) {
    $('#idleTimeDisplay').text(value);
    basil.set('idleTimeTotal', value);
}

function startIdleTimer() {
    //idleTotal timer
    var idleTimerValue = parseInt(basil.get('idleTimeTotal')) || 0;

    updateIdleTimerValue(idleTimerValue);

    setInterval(() => {
        idleTimerValue++;
        updateIdleTimerValue(idleTimerValue);
    }, 1000); // Update every second
}