let currentColors = {
    prod: '#ff4d4d',
    staging: '#ffc107',
    dev: '#28a745'
};

function hexToRgba(hex, alpha) {
    let r = parseInt(hex.slice(1, 3), 16),
        g = parseInt(hex.slice(3, 5), 16),
        b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function applyDynamicCSS(colors) {
    let styleEl = document.getElementById('odoosh-highlighter-custom-css');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'odoosh-highlighter-custom-css';
        document.head.appendChild(styleEl);
    }
    
    styleEl.textContent = `
        /* Header Highlights */
        .highlight-production {
            background-color: ${hexToRgba(colors.prod, 0.05)} !important;
            border-left: 4px solid ${colors.prod} !important;
            border-radius: 4px;
            transition: all 0.3s ease;
        }
        .highlight-staging {
            background-color: ${hexToRgba(colors.staging, 0.05)} !important;
            border-left: 4px solid ${colors.staging} !important;
            border-radius: 4px;
            transition: all 0.3s ease;
        }
        .highlight-dev {
            background-color: ${hexToRgba(colors.dev, 0.05)} !important;
            border-left: 4px solid ${colors.dev} !important;
            border-radius: 4px;
            transition: all 0.3s ease;
        }

        /* Active Branch Overrides */
        li[data-branch-stage="production"][data-active-branch="true"] {
            background-color: ${hexToRgba(colors.prod, 0.15)} !important;
            border-left: 4px solid ${colors.prod} !important;
        }
        li[data-branch-stage="staging"][data-active-branch="true"] {
            background-color: ${hexToRgba(colors.staging, 0.15)} !important;
            border-left: 4px solid ${colors.staging} !important;
        }
        li[data-branch-stage="dev"][data-active-branch="true"] {
            background-color: ${hexToRgba(colors.dev, 0.15)} !important;
            border-left: 4px solid ${colors.dev} !important;
        }
    `;
}

function highlightBranches() {
    const branchContainers = document.querySelectorAll('.o_stage[data-stage]');
    
    branchContainers.forEach(container => {
        const stage = container.getAttribute('data-stage');
        
        if (stage === 'production') {
            container.classList.add('highlight-production');
            container.classList.remove('pb-2');
            container.classList.add('mb-2');
        } else if (stage === 'staging') {
            container.classList.add('highlight-staging');
        } else if (stage === 'dev') {
            container.classList.add('highlight-dev');
        }

        let nextEl = container.nextElementSibling;
        while (nextEl && !nextEl.classList.contains('o_stage')) {
            if (nextEl.tagName === 'UL') {
                if (nextEl.getAttribute('data-stage-list') !== stage) {
                    nextEl.setAttribute('data-stage-list', stage);
                }
                
                const branches = nextEl.querySelectorAll('li');
                branches.forEach(branch => {
                    if (branch.getAttribute('data-branch-stage') !== stage) {
                        branch.setAttribute('data-branch-stage', stage);
                    }
                    
                    let isActive = false;
                    const link = branch.querySelector('a');
                    if (link && link.href) {
                        const linkPath = new URL(link.href).pathname;
                        const currentPath = window.location.pathname;
                        if (currentPath === linkPath || currentPath.startsWith(linkPath + '/')) {
                            isActive = true;
                        }
                    }
                    
                    if (branch.classList.contains('active') || branch.querySelector('.active')) {
                        isActive = true;
                    }
                    
                    if (isActive) {
                        branch.setAttribute('data-active-branch', 'true');
                    } else {
                        branch.removeAttribute('data-active-branch');
                    }
                });
            }
            nextEl = nextEl.nextElementSibling;
        }
    });
}

// Initial Setup
chrome.storage.sync.get(currentColors, (items) => {
    currentColors = items;
    applyDynamicCSS(currentColors);
    highlightBranches();
});

// Listen for updates from options page
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync') {
        if (changes.prod) currentColors.prod = changes.prod.newValue;
        if (changes.staging) currentColors.staging = changes.staging.newValue;
        if (changes.dev) currentColors.dev = changes.dev.newValue;
        applyDynamicCSS(currentColors);
    }
});

// DOM Observer
let debounceTimer = null;
const observer = new MutationObserver((mutations) => {
    let hasNewNodes = false;
    for (let mutation of mutations) {
        if (mutation.addedNodes.length > 0 || mutation.type === 'attributes') {
            hasNewNodes = true;
            break;
        }
    }
    
    if (hasNewNodes) {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            observer.disconnect();
            highlightBranches();
            observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
        }, 100);
    }
});

observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });

window.addEventListener('popstate', () => {
    setTimeout(highlightBranches, 200);
});
let pushState = history.pushState;
history.pushState = function() {
    pushState.apply(history, arguments);
    setTimeout(highlightBranches, 200);
};