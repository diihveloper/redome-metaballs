import {Scene} from './scene';


window.addEventListener("load", () => {
    const wraps = document.querySelectorAll('[data-metaballs]');
    wraps.forEach((wrap) => {
        if ((wrap instanceof HTMLElement)) {
            const backgroundColor = wrap.dataset['backgroundColor'];
            const ballColor = wrap.dataset['ballColor'];
            const ballColorHighlight = wrap.dataset['ballColorHighlight'];
            const radius = parseFloat(wrap.dataset['radius'] || '16');
            const spacing = parseFloat(wrap.dataset['spacing'] || '64');
            const autoRatio = parseFloat(wrap.dataset['autoRatio'] || '');
            const enableRatio = parseFloat(wrap.dataset['enableRatio'] || '');
            const scene = new Scene(wrap, {
                backgroundColor,
                ballColor,
                ballColorHighlight,
                radius,
                spacing,
                autoRatio,
                enableRatio
            });
            scene.init();
        }
    });
});

