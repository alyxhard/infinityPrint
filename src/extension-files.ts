export const manifestJson = `{
  "manifest_version": 3,
  "name": "Scroll Print Area",
  "version": "1.1",
  "description": "Selecione uma área, faça scroll para esticar e tire um print longo de qualquer container.",
  "permissions": ["activeTab", "scripting", "storage"],
  "host_permissions": ["<all_urls>"],
  "background": {
    "service_worker": "background.js"
  },
  "action": {
    "default_title": "Capturar Área"
  }
}`;

export const contentCss = `#scroll-print-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.3);
  z-index: 999999;
  cursor: crosshair;
}
#scroll-print-selection {
  position: fixed;
  border: 2px dashed #00a8ff;
  background: rgba(0, 168, 255, 0.1);
  z-index: 1000000;
  pointer-events: none;
}
.resize-handle {
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 10px;
  background: #00a8ff;
  border-radius: 5px;
  cursor: ns-resize;
  pointer-events: auto;
}
#scroll-print-capture-btn {
  position: fixed;
  z-index: 1000001;
  background: #00a8ff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-family: sans-serif;
  font-weight: bold;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}
#scroll-print-capture-btn:hover {
  background: #0097e6;
}`;

export const contentJs = `let overlay, selectionBox, captureBtn;
let scrollContainer = null;
let startClientX, startClientY;
let startScrollX, startScrollY;
let currentClientX, currentClientY;
let isDrawing = false;
let isResizing = false;
let scrollInterval = null;

function getScrollTop(el) { return el === document.scrollingElement ? window.scrollY : el.scrollTop; }
function getScrollLeft(el) { return el === document.scrollingElement ? window.scrollX : el.scrollLeft; }
function setScrollTop(el, val) { if (el === document.scrollingElement) window.scrollTo(window.scrollX, val); else el.scrollTop = val; }

function getScrollableParent(element) {
    if (!element || element === document.body || element === document.documentElement) {
        return document.scrollingElement;
    }
    const style = window.getComputedStyle(element);
    const overflowY = style.getPropertyValue('overflow-y');
    const isScrollable = overflowY === 'auto' || overflowY === 'scroll';
    if (isScrollable && element.scrollHeight > element.clientHeight) {
        return element;
    }
    return getScrollableParent(element.parentElement);
}

function init() {
    if (document.getElementById('scroll-print-overlay')) {
        cleanup();
        return;
    }
    
    overlay = document.createElement('div');
    overlay.id = 'scroll-print-overlay';
    document.body.appendChild(overlay);

    overlay.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('scroll', onScroll, true);
}

function cleanup() {
    if (overlay) overlay.remove();
    if (selectionBox) selectionBox.remove();
    if (captureBtn) captureBtn.remove();
    if (scrollInterval) clearInterval(scrollInterval);
    overlay = selectionBox = captureBtn = null;
    scrollInterval = null;
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    window.removeEventListener('scroll', onScroll, true);
}

function onMouseDown(e) {
    if (e.target.classList && e.target.classList.contains('resize-handle')) {
        isResizing = true;
        return;
    }
    if (selectionBox) selectionBox.remove();
    if (captureBtn) captureBtn.remove();

    // Encontra o container com scroll correto (ex: chat)
    overlay.style.display = 'none';
    const target = document.elementFromPoint(e.clientX, e.clientY);
    scrollContainer = getScrollableParent(target);
    overlay.style.display = 'block';

    isDrawing = true;
    startClientX = e.clientX;
    startClientY = e.clientY;
    currentClientX = e.clientX;
    currentClientY = e.clientY;
    
    startScrollX = getScrollLeft(scrollContainer);
    startScrollY = getScrollTop(scrollContainer);

    selectionBox = document.createElement('div');
    selectionBox.id = 'scroll-print-selection';
    document.body.appendChild(selectionBox);
    
    updateSelection();
}

function onMouseMove(e) {
    if (!isDrawing && !isResizing) return;
    currentClientX = e.clientX;
    currentClientY = e.clientY;
    
    updateSelection();
    checkAutoScroll(e.clientX, e.clientY);
}

function onScroll(e) {
    if ((isDrawing || isResizing || selectionBox) && scrollContainer) {
        if (e.target === scrollContainer || (scrollContainer === document.scrollingElement && (e.target === document || e.target === window))) {
            updateSelection();
        }
    }
}

function updateSelection() {
    if (!selectionBox || !scrollContainer) return;
    
    const currentScrollX = getScrollLeft(scrollContainer);
    const currentScrollY = getScrollTop(scrollContainer);
    
    // A origem acompanha o scroll do container
    const originScreenX = startClientX - (currentScrollX - startScrollX);
    const originScreenY = startClientY - (currentScrollY - startScrollY);
    
    let endScreenX = currentClientX;
    let endScreenY = currentClientY;
    
    if (isResizing) {
        endScreenX = originScreenX + parseFloat(selectionBox.dataset.origWidth || 0);
    } else {
        selectionBox.dataset.origWidth = Math.abs(originScreenX - endScreenX);
    }

    const left = Math.min(originScreenX, endScreenX);
    const top = Math.min(originScreenY, endScreenY);
    const width = Math.abs(originScreenX - endScreenX);
    const height = Math.abs(originScreenY - endScreenY);

    selectionBox.style.left = left + 'px';
    selectionBox.style.top = top + 'px';
    selectionBox.style.width = width + 'px';
    selectionBox.style.height = height + 'px';
    
    if (captureBtn) {
        captureBtn.style.left = (left + 10) + 'px';
        captureBtn.style.top = (top + height + 10) + 'px';
    }
}

function checkAutoScroll(clientX, clientY) {
    if (!scrollContainer) return;
    
    const rect = scrollContainer === document.scrollingElement 
        ? { top: 0, bottom: window.innerHeight, left: 0, right: window.innerWidth }
        : scrollContainer.getBoundingClientRect();
        
    const threshold = 50;
    let scrollDy = 0;
    
    if (clientY > rect.bottom - threshold) scrollDy = 30;
    else if (clientY < rect.top + threshold) scrollDy = -30;
    
    if (scrollDy !== 0) {
        if (!scrollInterval) {
            scrollInterval = setInterval(() => {
                if (scrollContainer === document.scrollingElement) {
                    window.scrollBy(0, scrollDy);
                } else {
                    scrollContainer.scrollTop += scrollDy;
                }
            }, 30);
        }
    } else {
        if (scrollInterval) {
            clearInterval(scrollInterval);
            scrollInterval = null;
        }
    }
}

function onMouseUp(e) {
    if (isDrawing || isResizing) {
        isDrawing = false;
        isResizing = false;
        if (scrollInterval) {
            clearInterval(scrollInterval);
            scrollInterval = null;
        }
        addHandlesAndButton();
    }
}

function addHandlesAndButton() {
    if (!selectionBox) return;
    
    const oldHandle = selectionBox.querySelector('.resize-handle');
    if (oldHandle) oldHandle.remove();

    const handle = document.createElement('div');
    handle.className = 'resize-handle';
    handle.addEventListener('mousedown', (e) => {
        isResizing = true;
        e.stopPropagation();
    });
    selectionBox.appendChild(handle);

    if (!captureBtn) {
        captureBtn = document.createElement('button');
        captureBtn.id = 'scroll-print-capture-btn';
        captureBtn.innerText = '📸 Capturar Área';
        captureBtn.onclick = captureArea;
        document.body.appendChild(captureBtn);
    }
    updateSelection();
}

async function captureArea() {
    if (!scrollContainer) return;
    
    overlay.style.display = 'none';
    selectionBox.style.display = 'none';
    captureBtn.style.display = 'none';
    
    const currentScrollX = getScrollLeft(scrollContainer);
    const currentScrollY = getScrollTop(scrollContainer);
    
    const rect = scrollContainer === document.scrollingElement 
        ? { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight }
        : scrollContainer.getBoundingClientRect();
        
    const contentStartY = startClientY - rect.top + startScrollY;
    const contentEndY = currentClientY - rect.top + currentScrollY;
    const contentStartX = startClientX - rect.left + startScrollX;
    const contentEndX = currentClientX - rect.left + currentScrollX;
    
    const top = Math.min(contentStartY, contentEndY);
    const bottom = Math.max(contentStartY, contentEndY);
    const left = Math.min(contentStartX, contentEndX);
    const right = Math.max(contentStartX, contentEndX);
    const width = right - left;
    const height = bottom - top;
    
    const images = [];
    let currentY = top;
    const viewHeight = scrollContainer === document.scrollingElement ? window.innerHeight : scrollContainer.clientHeight;
    
    const originalOverflow = scrollContainer.style.overflow;
    scrollContainer.style.overflow = 'hidden';
    
    while (currentY < bottom) {
        setScrollTop(scrollContainer, currentY);
        await new Promise(r => setTimeout(r, 400));
        
        const dataUrl = await new Promise(resolve => {
            chrome.runtime.sendMessage({ action: 'take_screenshot' }, resolve);
        });
        
        const actualScrollY = getScrollTop(scrollContainer);
        const actualScrollX = getScrollLeft(scrollContainer);
        
        const currentRect = scrollContainer === document.scrollingElement 
            ? { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight }
            : scrollContainer.getBoundingClientRect();
            
        const captureHeight = Math.min(viewHeight, bottom - currentY);
        const screenX = currentRect.left + (left - actualScrollX);
        const screenY = currentRect.top + (currentY - actualScrollY);
        
        images.push({
            dataUrl,
            crop: {
                x: screenX,
                y: screenY,
                width: width,
                height: captureHeight
            },
            yPos: currentY - top
        });
        
        currentY += viewHeight;
    }
    
    scrollContainer.style.overflow = originalOverflow;
    cleanup();
    
    chrome.runtime.sendMessage({
        action: 'open_result',
        data: {
            images,
            bounds: { width, height },
            dpr: window.devicePixelRatio
        }
    });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'init') {
        init();
        sendResponse({status: 'ok'});
    }
});`;

export const backgroundJs = `chrome.action.onClicked.addListener((tab) => {
    chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ['content.css']
    });
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
    }, () => {
        chrome.tabs.sendMessage(tab.id, { action: 'init' });
    });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'take_screenshot') {
        chrome.tabs.captureVisibleTab(null, { format: 'png' }).then(dataUrl => {
            sendResponse(dataUrl);
        });
        return true;
    } else if (request.action === 'open_result') {
        chrome.storage.local.set({ captureData: request.data }, () => {
            chrome.tabs.create({ url: 'result.html' });
        });
    }
});`;

export const resultHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Resultado da Captura</title>
    <style>
        body { background: #1e1e1e; color: white; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; padding: 20px; margin: 0; }
        canvas { max-width: 100%; border: 1px solid #333; box-shadow: 0 4px 12px rgba(0,0,0,0.5); margin-top: 20px; }
        .header { display: flex; gap: 10px; margin-bottom: 20px; align-items: center; }
        button { background: #00a8ff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-size: 16px; font-weight: bold; }
        button:hover { background: #0097e6; }
    </style>
</head>
<body>
    <div class="header">
        <h2>Captura Concluída</h2>
        <button id="downloadBtn">Baixar Imagem</button>
    </div>
    <canvas id="resultCanvas"></canvas>
    <script src="result.js"></script>
</body>
</html>`;

export const resultJs = `chrome.storage.local.get(['captureData'], async (result) => {
    if (!result.captureData) return;
    
    const { images, bounds, dpr } = result.captureData;
    const canvas = document.getElementById('resultCanvas');
    const ctx = canvas.getContext('2d');

    canvas.width = bounds.width * dpr;
    canvas.height = bounds.height * dpr;

    for (let i = 0; i < images.length; i++) {
        const imgData = images[i];
        const img = new Image();
        
        await new Promise((resolve) => {
            img.onload = resolve;
            img.src = imgData.dataUrl;
        });

        const sx = imgData.crop.x * dpr;
        const sy = imgData.crop.y * dpr;
        const sWidth = imgData.crop.width * dpr;
        const sHeight = imgData.crop.height * dpr;

        const dx = 0;
        const dy = imgData.yPos * dpr;
        const dWidth = imgData.crop.width * dpr;
        const dHeight = imgData.crop.height * dpr;

        ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
    }

    document.getElementById('downloadBtn').addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = 'scroll-capture-' + Date.now() + '.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
});`;
