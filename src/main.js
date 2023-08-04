basil = new window.Basil({storages: ['local'], expireDays: 31});


/*FUNCTIONS*/
$.ajax({
    url: 'src/functions/timer.js',
    dataType: "script",
});

$.ajax({
    url: 'src/functions/counter.js',
    dataType: "script",
});

/*COMPONENTS*/
$.ajax({
    url: 'src/components/display.js',
    dataType: "script",
});
