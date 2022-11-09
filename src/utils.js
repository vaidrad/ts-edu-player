function copyStringToBuffer(value, parentElement) {
    const element = document.createElement('textarea');
    element.value = value;
    element.style.position = 'absolute';
    element.style.left = '-9999px';
    (!!window.MSInputMethodContext && !!document.documentMode) ? document.body.appendChild(element) : parentElement.prepend(element); // workaround for IE11
    element.select();
    
    if (navigator.userAgent.match(/ipad|iphone/i)) {
        element.contentEditable = true;
        element.readOnly = false;
        const range = document.createRange();
        range.selectNodeContents(element);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        element.setSelectionRange(0, 999999);
    }
    
    document.execCommand('copy');
    (!!window.MSInputMethodContext && !!document.documentMode) ? document.body.removeChild(element) : parentElement.removeChild(element); // workaround for IE11
}

function getUrlParameter(name) {
    // eslint-disable-next-line
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return Number(results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '))) - 1;
}

export {
    copyStringToBuffer,
    getUrlParameter
}