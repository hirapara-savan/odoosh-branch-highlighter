document.addEventListener('DOMContentLoaded', () => {
    // Load saved colors, using default colors if none exist
    chrome.storage.sync.get({
        prod: '#ff4d4d',
        staging: '#ffc107',
        dev: '#28a745'
    }, (items) => {
        document.getElementById('color-prod').value = items.prod;
        document.getElementById('color-staging').value = items.staging;
        document.getElementById('color-dev').value = items.dev;
    });

    // Save colors when button is clicked
    document.getElementById('save').addEventListener('click', () => {
        const prod = document.getElementById('color-prod').value;
        const staging = document.getElementById('color-staging').value;
        const dev = document.getElementById('color-dev').value;

        chrome.storage.sync.set({
            prod: prod,
            staging: staging,
            dev: dev
        }, () => {
            const status = document.getElementById('status');
            status.style.display = 'block';
            setTimeout(() => {
                status.style.display = 'none';
            }, 3000);
        });
    });
});