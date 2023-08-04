startCounter();
startIdleTimer();


$('#resetButton').click(function () {
    if (confirm("Are you sure you want to start over again?")) {
        Cookies.remove();
        location.reload();
    }
});