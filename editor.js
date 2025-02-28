// Track undo/redo history
let undoStack = [];
let redoStack = [];

// Global state
let isInsertMode = true;
let currentFileName = 'No File';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Save initial state
    saveCurrentState();
    
    const editor = document.getElementById('editor');
    
    // Set up keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Update line numbers and cursor position
    editor.addEventListener('input', () => {
        saveCurrentState();
        updateLineNumbers();
        updateStatusBar();
    });
    
    editor.addEventListener('keyup', updateStatusBar);
    editor.addEventListener('click', updateStatusBar);
    editor.addEventListener('scroll', syncLineNumbers);
    
    // Initial setup
    updateLineNumbers();
    updateStatusBar();
});

// Handle WordStar-style keyboard shortcuts
function handleKeyboardShortcuts(e) {
    if (e.ctrlKey) {
        switch(e.key.toLowerCase()) {
            case 'k': // Block operations
                e.preventDefault();
                showBlockCommands();
                break;
            case 'o': // Onscreen commands
                e.preventDefault();
                showOnscreenCommands();
                break;
            case 'q': // Quick commands
                e.preventDefault();
                showQuickCommands();
                break;
            case 'f': // Find
                e.preventDefault();
                document.getElementById('searchInput').focus();
                break;
            case 'l': // Find and Replace
                e.preventDefault();
                document.getElementById('replaceInput').focus();
                break;
            case 'z': // Undo/Redo
                e.preventDefault();
                if (e.shiftKey) {
                    redo();
                } else {
                    undo();
                }
                break;
            case 'v': // Toggle Insert/Overwrite mode
                e.preventDefault();
                toggleInsertMode();
                break;
        }
    }
}

// Update line numbers
function updateLineNumbers() {
    const editor = document.getElementById('editor');
    const lineNumbers = document.querySelector('.line-numbers');
    const lines = editor.innerText.split('\n');
    
    lineNumbers.innerHTML = lines.map((_, i) => 
        `<div>${i + 1}</div>`
    ).join('');
}

// Sync line numbers with editor scroll
function syncLineNumbers() {
    const editor = document.getElementById('editor');
    const lineNumbers = document.querySelector('.line-numbers');
    lineNumbers.scrollTop = editor.scrollTop;
}

// Update status bar
function updateStatusBar() {
    const editor = document.getElementById('editor');
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const text = editor.innerText;
    
    // Calculate line and column
    const textBeforeCaret = text.substring(0, range.startOffset);
    const lines = textBeforeCaret.split('\n');
    const currentLine = lines.length;
    const currentColumn = lines[lines.length - 1].length + 1;
    
    // Update status bar elements
    document.querySelector('.position').textContent = 
        `Line: ${currentLine} Col: ${currentColumn}`;
    document.querySelector('.file-info').textContent = currentFileName;
    document.querySelector('.mode').textContent = isInsertMode ? 'INSERT' : 'OVERWRITE';
}

// Toggle insert/overwrite mode
function toggleInsertMode() {
    isInsertMode = !isInsertMode;
    updateStatusBar();
}

// Show command menus (placeholder functions)
function showBlockCommands() {
    console.log('Block commands menu');
}

function showOnscreenCommands() {
    console.log('Onscreen commands menu');
}

function showQuickCommands() {
    console.log('Quick commands menu');
}

// Basic text formatting
function formatText(command) {
    document.execCommand(command, false, null);
    document.querySelector(`button[onclick="formatText('${command}')"]`).classList.toggle('active');
}

// Heading formatting
function formatHeading(tag) {
    if (tag) {
        document.execCommand('formatBlock', false, `<${tag}>`);
    } else {
        document.execCommand('formatBlock', false, '<p>');
    }
}

// Font size
function setFontSize(size) {
    document.execCommand('fontSize', false, '7');
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const span = selection.getRangeAt(0).commonAncestorContainer;
    if (span.nodeType === 3) {
        const parent = span.parentElement;
        parent.style.fontSize = `${size}px`;
    }
}

// Font color
function setFontColor(color) {
    document.execCommand('foreColor', false, color);
}

// Text alignment
function setAlignment(align) {
    document.execCommand(`justify${align.charAt(0).toUpperCase() + align.slice(1)}`, false, null);
    
    // Update active state of alignment buttons
    document.querySelectorAll('[onclick^="setAlignment"]').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[onclick="setAlignment('${align}')"]`).classList.add('active');
}

// List handling
function formatList(type) {
    if (type === 'ordered') {
        document.execCommand('insertOrderedList', false, null);
    } else {
        document.execCommand('insertUnorderedList', false, null);
    }
}

// Link insertion
function insertLink() {
    const url = prompt('Enter URL:');
    if (url) {
        document.execCommand('createLink', false, url);
    }
}

// Image handling
function insertImage(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.maxWidth = '100%';
            
            // Make image resizable
            img.style.cursor = 'se-resize';
            img.addEventListener('mousedown', initResize);
            
            const selection = window.getSelection();
            if (selection.rangeCount) {
                const range = selection.getRangeAt(0);
                range.insertNode(img);
                range.collapse(false);
            }
        };
        reader.readAsDataURL(file);
    }
}

// Image resizing
let isResizing = false;
let currentImage = null;
let startX, startY, startWidth, startHeight;

function initResize(e) {
    if (e.target.tagName === 'IMG') {
        isResizing = true;
        currentImage = e.target;
        startX = e.clientX;
        startY = e.clientY;
        startWidth = currentImage.clientWidth;
        startHeight = currentImage.clientHeight;
        
        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', stopResize);
        e.preventDefault();
    }
}

function resize(e) {
    if (isResizing) {
        const width = startWidth + (e.clientX - startX);
        const height = startHeight + (e.clientY - startY);
        currentImage.style.width = `${width}px`;
        currentImage.style.height = `${height}px`;
    }
}

function stopResize() {
    isResizing = false;
    document.removeEventListener('mousemove', resize);
    document.removeEventListener('mouseup', stopResize);
}

// Search and replace functionality
function findText() {
    const searchText = document.getElementById('searchInput').value;
    if (!searchText) return;
    
    const editor = document.getElementById('editor');
    const content = editor.innerHTML;
    const regex = new RegExp(searchText, 'gi');
    
    editor.innerHTML = content.replace(regex, match => `<mark>${match}</mark>`);
}

function replaceText() {
    const searchText = document.getElementById('searchInput').value;
    const replaceText = document.getElementById('replaceInput').value;
    if (!searchText) return;
    
    const editor = document.getElementById('editor');
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    const mark = range.commonAncestorContainer.parentElement;
    
    if (mark.tagName === 'MARK') {
        mark.outerHTML = replaceText;
    }
}

function replaceAllText() {
    const searchText = document.getElementById('searchInput').value;
    const replaceText = document.getElementById('replaceInput').value;
    if (!searchText) return;
    
    const editor = document.getElementById('editor');
    const regex = new RegExp(searchText, 'gi');
    editor.innerHTML = editor.innerHTML.replace(regex, replaceText);
}

// HTML view toggle
function toggleView() {
    const editor = document.getElementById('editor');
    const htmlView = document.getElementById('htmlView');
    
    if (editor.style.display !== 'none') {
        htmlView.value = editor.innerHTML;
        editor.style.display = 'none';
        htmlView.style.display = 'block';
        
        // Apply syntax highlighting
        Prism.highlightElement(htmlView);
    } else {
        editor.innerHTML = htmlView.value;
        editor.style.display = 'block';
        htmlView.style.display = 'none';
    }
}

// Undo/Redo functionality
function saveCurrentState() {
    const editor = document.getElementById('editor');
    undoStack.push(editor.innerHTML);
    redoStack = []; // Clear redo stack when new changes are made
    
    // Limit stack size
    if (undoStack.length > 100) {
        undoStack.shift();
    }
}

function undo() {
    if (undoStack.length > 1) { // Keep at least one state
        const editor = document.getElementById('editor');
        redoStack.push(undoStack.pop());
        editor.innerHTML = undoStack[undoStack.length - 1];
    }
}

function redo() {
    if (redoStack.length > 0) {
        const editor = document.getElementById('editor');
        const state = redoStack.pop();
        undoStack.push(state);
        editor.innerHTML = state;
    }
}

// Modified file handling functions
function loadFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.html';
    
    input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = e => {
            const content = e.target.result;
            const editor = document.getElementById('editor');
            
            // If it's an HTML file, load it as-is, otherwise escape it
            if (file.name.endsWith('.html')) {
                editor.innerHTML = content;
            } else {
                editor.textContent = content;
            }
            
            // Update file name and status
            currentFileName = file.name;
            updateStatusBar();
            updateLineNumbers();
            
            // Save initial state for undo
            saveCurrentState();
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

function saveFile() {
    const editor = document.getElementById('editor');
    let content;
    let filename;
    
    // Determine content and filename based on current view
    if (document.getElementById('htmlView').style.display === 'block') {
        content = document.getElementById('htmlView').value;
        filename = 'document.html';
    } else {
        content = editor.innerHTML;
        filename = 'document.html';
    }
    
    // Create blob and download link
    const blob = new Blob([content], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    
    // Cleanup
    window.URL.revokeObjectURL(url);
}

// Spell check is handled by the browser's built-in spellcheck feature
// Code syntax highlighting is handled by Prism.js library
