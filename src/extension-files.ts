export const manifestJson = `{
  "manifest_version": 3,
  "name": "Scroll Print Area",
  "version": "1.3",
  "description": "Select an area, scroll to stretch, and release to copy a long screenshot to your clipboard.",
  "permissions": ["activeTab", "scripting", "clipboardWrite"],
  "host_permissions": ["<all_urls>"],
  "background": {
    "service_worker": "background.js"
  },
  "action": {
    "default_title": "Capture Area"
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
#scroll-print-tooltip {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: #2d3436;
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  font-family: sans-serif;
  font-size: 14px;
  font-weight: bold;
  z-index: 1000002;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  pointer-events: none;
}`;

export const contentJs = `let overlay, selectionBox;
let scrollContainer = null;
let startClientX, startClientY;
let startScrollX, startScrollY;
let currentClientX, currentClientY;
let isDrawing = false;
let scrollInterval = null;
let originalOverflow = null;

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
    const tt = document.getElementById('scroll-print-tooltip');
    if (tt) tt.remove();
    if (scrollInterval) clearInterval(scrollInterval);
    
    // Restore overflow if it was changed
    if (scrollContainer && originalOverflow !== null) {
        scrollContainer.style.overflow = originalOverflow;
    }
    
    overlay = selectionBox = null;
    scrollInterval = null;
    scrollContainer = null;
    originalOverflow = null;
    isDrawing = false;
    
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    window.removeEventListener('scroll', onScroll, true);
}

function showTooltip(text) {
    let tt = document.getElementById('scroll-print-tooltip');
    if (!tt) {
        tt = document.createElement('div');
        tt.id = 'scroll-print-tooltip';
        document.body.appendChild(tt);
    }
    tt.innerText = text;
    tt.style.display = 'block';
}

function onMouseDown(e) {
    if (selectionBox) selectionBox.remove();

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
    if (!isDrawing) return;
    currentClientX = e.clientX;
    currentClientY = e.clientY;
    
    updateSelection();
    checkAutoScroll(e.clientX, e.clientY);
}

function onScroll(e) {
    if ((isDrawing || selectionBox) && scrollContainer) {
        if (e.target === scrollContainer || (scrollContainer === document.scrollingElement && (e.target === document || e.target === window))) {
            updateSelection();
        }
    }
}

function updateSelection() {
    if (!selectionBox || !scrollContainer) return;
    
    const currentScrollX = getScrollLeft(scrollContainer);
    const currentScrollY = getScrollTop(scrollContainer);
    
    const originScreenX = startClientX - (currentScrollX - startScrollX);
    const originScreenY = startClientY - (currentScrollY - startScrollY);
    
    let endScreenX = currentClientX;
    let endScreenY = currentClientY;

    const left = Math.min(originScreenX, endScreenX);
    const top = Math.min(originScreenY, endScreenY);
    const width = Math.abs(originScreenX - endScreenX);
    const height = Math.abs(originScreenY - endScreenY);

    selectionBox.style.left = left + 'px';
    selectionBox.style.top = top + 'px';
    selectionBox.style.width = width + 'px';
    selectionBox.style.height = height + 'px';
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
    if (isDrawing) {
        isDrawing = false;
        if (scrollInterval) {
            clearInterval(scrollInterval);
            scrollInterval = null;
        }
        
        if (selectionBox && parseFloat(selectionBox.style.width) > 10 && parseFloat(selectionBox.style.height) > 10) {
            captureArea().catch(err => {
                console.error("Capture failed:", err);
                showTooltip("Error during capture.");
                setTimeout(cleanup, 2000);
            });
        } else {
            cleanup();
        }
    }
}

async function captureArea() {
    if (!scrollContainer) return;
    
    showTooltip("Capturing...");
    
    overlay.style.display = 'none';
    selectionBox.style.display = 'none';
    
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
    
    // Save original overflow and hide scrollbars during capture
    originalOverflow = scrollContainer.style.overflow;
    scrollContainer.style.overflow = 'hidden';
    
    try {
        let captureCount = 0;
        const MAX_CAPTURES = 40; // Prevent infinite loops or massive memory usage
        
        while (currentY < bottom && captureCount < MAX_CAPTURES) {
            captureCount++;
            setScrollTop(scrollContainer, currentY);
            await new Promise(r => setTimeout(r, 500)); // Wait for scroll and render
            
            const dataUrl = await new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({ action: 'take_screenshot' }, (response) => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve(response);
                    }
                });
            });
            
            if (!dataUrl) throw new Error("Failed to capture screenshot");
            
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
        
        // Restore scrollbar immediately after capturing
        scrollContainer.style.overflow = originalOverflow;
        originalOverflow = null;
        
        showTooltip("Stitching image...");
        
        // Calculate scale to prevent canvas/clipboard limits
        let scale = window.devicePixelRatio || 1;
        const MAX_CANVAS_DIMENSION = 12000; // Safe limit for clipboard and canvas
        
        if (height * scale > MAX_CANVAS_DIMENSION) {
            scale = MAX_CANVAS_DIMENSION / height;
        }
        if (width * scale > MAX_CANVAS_DIMENSION) {
            scale = Math.min(scale, MAX_CANVAS_DIMENSION / width);
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext('2d');
        
        const originalDpr = window.devicePixelRatio || 1;
        
        for (let i = 0; i < images.length; i++) {
            const imgData = images[i];
            const img = new Image();
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = imgData.dataUrl;
            });

            const sx = imgData.crop.x * originalDpr;
            const sy = imgData.crop.y * originalDpr;
            const sWidth = imgData.crop.width * originalDpr;
            const sHeight = imgData.crop.height * originalDpr;

            const dx = 0;
            const dy = imgData.yPos * scale;
            const dWidth = imgData.crop.width * scale;
            const dHeight = imgData.crop.height * scale;

            ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
        }
        
        canvas.toBlob(async (blob) => {
            if (!blob) {
                showTooltip("Image too large! Try a smaller area.");
                setTimeout(cleanup, 4000);
                return;
            }
            try {
                await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                showTooltip("Copied to clipboard!");
                setTimeout(cleanup, 2000);
            } catch (err) {
                console.error("Clipboard write failed", err);
                showTooltip("Image too large for clipboard.");
                setTimeout(cleanup, 4000);
            }
        }, 'image/png');

    } catch (error) {
        console.error("Error during capture process:", error);
        showTooltip("Error during capture.");
        setTimeout(cleanup, 3000);
    }
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
        }).catch(err => {
            console.error("Capture error:", err);
            sendResponse(null);
        });
        return true;
    }
});`;
