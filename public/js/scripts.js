/* Toggle header pin status */
var last_known_scroll_position = 0;
var ticking = false;

function doSomething(scroll_pos) {
    // do something with the scroll position
    console.log(window.scrollY);
}

window.addEventListener('scroll', function(e) {
    if (last_known_scroll_position != 0 && window.scrollY == 0) {
        document.getElementById('header').classList.remove('header-nottop');
    } else if (last_known_scroll_position == 0 && window.scrollY != 0) {
        document.getElementById('header').classList.add('header-nottop');
    }

    last_known_scroll_position = window.scrollY;
});
