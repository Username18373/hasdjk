document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const fileInput = document.getElementById('fileInput');
    const dropArea = document.getElementById('dropArea');
    const browseBtn = document.getElementById('browseBtn');
    const searchQueryInput = document.getElementById('searchQuery');
    const searchQueryBtn = document.getElementById('searchQueryBtn');
    const searchAllBtn = document.getElementById('searchAllBtn');
    const resultsContainer = document.getElementById('results');

    // State
    let files = [];
    let fileContents = [];

    // Liquid button effect
    document.querySelectorAll('.glass-btn').forEach(button => {
        button.addEventListener('mousemove', (e) => {
            const rect = button.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            button.style.setProperty('--x', `${x}px`);
            button.style.setProperty('--y', `${y}px`);
        });
    });

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    // Highlight drop area when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });

    // Handle dropped files
    dropArea.addEventListener('drop', handleDrop, false);

    // Handle file selection via button
    browseBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFiles);

    // Search all files for user:pass patterns
    searchAllBtn.addEventListener('click', searchAllFiles);

    // Search for specific query
    searchQueryBtn.addEventListener('click', searchQuery);

    // Functions
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight() {
        dropArea.style.borderColor = 'var(--primary-color)';
    }

    function unhighlight() {
        dropArea.style.borderColor = 'var(--glass-border)';
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const droppedFiles = dt.files;
        handleFiles({ target: { files: droppedFiles } });
    }

    function handleFiles(e) {
        const selectedFiles = e.target.files;
        files = Array.from(selectedFiles);
        fileContents = [];

        if (files.length === 0) {
            showEmptyState();
            return;
        }

        showLoadingState();

        // Read all files
        let filesRead = 0;
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                fileContents.push({
                    name: file.name,
                    content: event.target.result
                });

                filesRead++;
                if (filesRead === files.length) {
                    showResultsHeader(`Loaded ${files.length} file(s)`);
                }
            };
            reader.readAsText(file);
        });
    }

    function searchAllFiles() {
        if (fileContents.length === 0) {
            showEmptyState('No files loaded');
            return;
        }

        showLoadingState('Scanning all files...');

        setTimeout(() => {
            const userPassRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+):([a-zA-Z0-9!@#$%^&*()_+]+)/g;
            let resultsFound = false;

            resultsContainer.innerHTML = '';

            fileContents.forEach(file => {
                const matches = file.content.match(userPassRegex);

                if (matches && matches.length > 0) {
                    resultsFound = true;
                    const fileResult = document.createElement('div');
                    fileResult.className = 'result-item';

                    const fileHeader = document.createElement('h3');
                    fileHeader.textContent = `File: ${file.name}`;
                    fileResult.appendChild(fileHeader);

                    const matchesList = document.createElement('pre');
                    matchesList.textContent = matches.join('\n');
                    fileResult.appendChild(matchesList);

                    resultsContainer.appendChild(fileResult);
                }
            });

            if (!resultsFound) {
                showEmptyState('No user:pass patterns found');
            }
        }, 500);
    }

    function searchQuery() {
        const query = searchQueryInput.value.trim();

        if (!query) {
            showEmptyState('Enter a search query');
            return;
        }

        if (fileContents.length === 0) {
            showEmptyState('No files loaded');
            return;
        }

        showLoadingState(`Searching for "${query}"...`);

        setTimeout(() => {
            let resultsFound = false;
            resultsContainer.innerHTML = '';

            fileContents.forEach(file => {
                if (file.content.includes(query)) {
                    resultsFound = true;
                    const fileResult = document.createElement('div');
                    fileResult.className = 'result-item';

                    const fileHeader = document.createElement('h3');
                    fileHeader.textContent = `File: ${file.name}`;
                    fileResult.appendChild(fileHeader);

                    const lines = file.content.split('\n');
                    const matchesContainer = document.createElement('pre');

                    lines.forEach(line => {
                        if (line.includes(query)) {
                            const highlightedLine = line.replace(
                                new RegExp(escapeRegExp(query), 'g'),
                                `<span class="highlight">${query}</span>`
                            );
                            matchesContainer.innerHTML += `${highlightedLine}\n`;
                        }
                    });

                    fileResult.appendChild(matchesContainer);
                    resultsContainer.appendChild(fileResult);
                }
            });

            if (!resultsFound) {
                showEmptyState(`No matches found for "${query}"`);
            }
        }, 500);
    }

    function showEmptyState(message = 'Upload files to begin') {
        resultsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-database"></i>
                <p>${message}</p>
            </div>
        `;
    }

    function showLoadingState(message = 'Processing...') {
        resultsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-spinner fa-spin"></i>
                <p>${message}</p>
            </div>
        `;
    }

    function showResultsHeader(message) {
        const header = document.createElement('div');
        header.className = 'results-header';
        header.innerHTML = `
            <p><i class="fas fa-info-circle"></i> ${message}</p>
        `;
        resultsContainer.innerHTML = '';
        resultsContainer.appendChild(header);
    }

    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
});
