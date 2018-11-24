/* Toggle header pin status */
var last_known_scroll_position = 0;

window.addEventListener('scroll', function(e) {
    if (last_known_scroll_position != 0 && window.scrollY == 0) {
        document
            .getElementById('header')
            .classList.remove('header-top-of-page');
    } else if (last_known_scroll_position == 0 && window.scrollY != 0) {
        document.getElementById('header').classList.add('header-top-of-page');
    }

    last_known_scroll_position = window.scrollY;
});
