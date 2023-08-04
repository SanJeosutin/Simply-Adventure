$(document).ready(function () {
    startCounter();
    startIdleTimer();
});


$('#resetButton').click(function () {
    if (confirm("Are you sure you want to start over again?")) {
        Cookies.set('money', 0);
        Cookies.set('interval', 5);
        Cookies.set('idleTimeTotal', 0);
        location.reload();
    }
});