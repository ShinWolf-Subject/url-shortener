class URLShortener {
    constructor() {
        this.baseUrl = window.location.origin;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadURLs();
    }

    bindEvents() {
        document.getElementById('shortenForm').addEventListener('submit', (e) => this.shortenURL(e));
        document.getElementById('copyBtn').addEventListener('click', () => this.copyToClipboard());
        document.getElementById('refreshBtn').addEventListener('click', () => this.loadURLs());
    }

    async shortenURL(e) {
        e.preventDefault();
        
        const longUrl = document.getElementById('longUrl').value;
        const shortenBtn = document.getElementById('shortenBtn');
        
        if (!longUrl) return;

        // Show loading state
        const originalText = shortenBtn.innerHTML;
        shortenBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Shortening...';
        shortenBtn.disabled = true;

        try {
            const response = await fetch('/api/shorten', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ longUrl })
            });

            const data = await response.json();

            if (response.ok) {
                this.showResult(data.shortUrl, longUrl);
                this.loadURLs();
                document.getElementById('longUrl').value = '';
            } else {
                this.showToast(data.error || 'Error shortening URL', 'error');
            }
        } catch (error) {
            this.showToast('Network error. Please try again.', 'error');
            console.error('Error:', error);
        } finally {
            // Reset button
            shortenBtn.innerHTML = originalText;
            shortenBtn.disabled = false;
        }
    }

    showResult(shortUrl, originalUrl) {
        const resultSection = document.getElementById('resultSection');
        const shortUrlInput = document.getElementById('shortUrl');
        const originalUrlElement = document.getElementById('originalUrl');

        shortUrlInput.value = shortUrl;
        originalUrlElement.textContent = originalUrl;
        resultSection.classList.remove('hidden');
        resultSection.classList.add('fade-in');
    }

    async copyToClipboard() {
        const shortUrlInput = document.getElementById('shortUrl');
        
        try {
            await navigator.clipboard.writeText(shortUrlInput.value);
            this.showToast('URL copied to clipboard!', 'success');
            
            // Visual feedback
            const copyBtn = document.getElementById('copyBtn');
            const originalHtml = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fas fa-check mr-1"></i>Copied!';
            copyBtn.classList.remove('bg-green-500', 'hover:bg-green-600');
            copyBtn.classList.add('bg-green-600');
            
            setTimeout(() => {
                copyBtn.innerHTML = originalHtml;
                copyBtn.classList.remove('bg-green-600');
                copyBtn.classList.add('bg-green-500', 'hover:bg-green-600');
            }, 2000);
        } catch (err) {
            this.showToast('Failed to copy URL', 'error');
        }
    }

    async loadURLs() {
        try {
            const response = await fetch('/api/urls');
            const urls = await response.json();
            this.displayURLs(urls);
        } catch (error) {
            console.error('Error loading URLs:', error);
            this.showToast('Error loading URLs', 'error');
        }
    }

    displayURLs(urls) {
        const urlList = document.getElementById('urlList');
        const emptyState = document.getElementById('emptyState');
        
        const urlEntries = Object.entries(urls);
        
        if (urlEntries.length === 0) {
            urlList.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }
        
        emptyState.classList.add('hidden');
        
        urlList.innerHTML = urlEntries.map(([code, longUrl]) => `
            <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 fade-in">
                <div class="flex items-center justify-between flex-wrap gap-3">
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center space-x-2 mb-2">
                            <span class="bg-blue-100 text-blue-800 text-xs font-mono px-2 py-1 rounded">
                                ${code}
                            </span>
                            <span class="text-sm text-gray-500">
                                <i class="fas fa-arrow-right mr-1"></i>
                                ${this.baseUrl}/${code}
                            </span>
                        </div>
                        <p class="text-gray-600 text-sm break-words">
                            <i class="fas fa-external-link-alt mr-2 text-gray-400"></i>
                            ${longUrl}
                        </p>
                    </div>
                    <div class="flex items-center space-x-2">
                        <a 
                            href="${this.baseUrl}/${code}" 
                            target="_blank"
                            class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm transition-colors duration-200"
                        >
                            <i class="fas fa-external-link-alt mr-1"></i>Visit
                        </a>
                        <button 
                            onclick="urlShortener.deleteURL('${code}')"
                            class="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm transition-colors duration-200"
                        >
                            <i class="fas fa-trash mr-1"></i>Delete
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async deleteURL(code) {
        if (!confirm('Are you sure you want to delete this shortened URL?')) {
            return;
        }

        try {
            const response = await fetch(`/api/urls/${code}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.showToast('URL deleted successfully', 'success');
                this.loadURLs();
                
                // Hide result section if it's showing the deleted URL
                const currentShortUrl = document.getElementById('shortUrl').value;
                if (currentShortUrl.includes(code)) {
                    document.getElementById('resultSection').classList.add('hidden');
                }
            } else {
                const data = await response.json();
                this.showToast(data.error || 'Error deleting URL', 'error');
            }
        } catch (error) {
            this.showToast('Network error. Please try again.', 'error');
            console.error('Error:', error);
        }
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        
        // Set background color based on type
        const colors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            info: 'bg-gray-800'
        };
        
        toast.className = `fixed bottom-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg transform translate-y-16 transition-transform duration-300`;
        toastMessage.textContent = message;
        
        // Show toast
        toast.classList.remove('translate-y-16');
        toast.classList.add('-translate-y-2');
        
        // Hide after 3 seconds
        setTimeout(() => {
            toast.classList.remove('-translate-y-2');
            toast.classList.add('translate-y-16');
        }, 3000);
    }
}

// Initialize the application
const urlShortener = new URLShortener();
