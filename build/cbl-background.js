class MessageHandler {
}
const init = () => {
    console.log('ready');
};
if (document.readyState == 'complete') {
    init();
}
else {
    const load = () => {
        document.removeEventListener('DOMContentLoaded', load);
        init();
    };
    document.addEventListener('DOMContentLoaded', load);
}
