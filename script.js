// Mini ERP JavaScript Functionality
class MiniERP {
    constructor() {
        this.inventoryService = new InventoryService();
        this.currentCategory = 'semen';
        this.selectedProduct = 'semen-rajawali';
        
        this.init();
    }
    
    async init() {
        this.bindEvents();
        await this.loadInventory();
        this.initializeCart();
    }
    
    bindEvents() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        
        searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        searchBtn.addEventListener('click', () => this.handleSearch(searchInput.value));
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch(e.target.value);
            }
        });
        
        // Category selection
        const categoryItems = document.querySelectorAll('.category-item');
        categoryItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const category = e.currentTarget.dataset.category;
                this.selectCategory(category);
            });
        });
        
        // Checkout button
        const checkoutBtn = document.getElementById('checkoutBtn');
        checkoutBtn.addEventListener('click', () => this.handleCheckout());
        
        // Pagination
        const pageBtns = document.querySelectorAll('.page-btn');
        pageBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                this.handlePagination(page);
            });
        });
    }
    
    async loadInventory() {
        try {
            const products = await this.inventoryService.getInventory();
            this.inventoryService.renderProducts(products);
            console.log('Inventory loaded:', products);
        } catch (error) {
            console.error('Failed to load inventory:', error);
        }
    }
    
    handleSearch(query) {
        this.inventoryService.searchProducts(query);
    }
    
    selectCategory(category) {
        this.currentCategory = category;
        
        // Update category selection UI
        document.querySelectorAll('.category-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.category === category) {
                item.classList.add('active');
            }
        });
        
        // Filter products by category using inventory service
        this.inventoryService.filterByCategory(category);
    }
    
    selectProduct(productId) {
        this.selectedProduct = productId;
        this.inventoryService.selectProduct(productId);
    }
    
    async handleCheckout() {
        const cart = this.inventoryService.getCart();
        if (cart.length === 0) {
            alert('Keranjang kosong! Silakan pilih produk terlebih dahulu.');
            return;
        }

        // Pull total from the UI and show modal
        const totalText = document.querySelector('.summary-value.total-amount')?.textContent || 'Rp 0';
        const paymentTotal = document.getElementById('paymentTotal');
        if (paymentTotal) paymentTotal.textContent = totalText;
        openPaymentModal();
    }
    
    handlePagination(page) {
        // This is a placeholder for pagination functionality
        // In a real application, this would make API calls to fetch different pages
        console.log(`Navigating to page: ${page}`);
        
        // Update pagination UI
        document.querySelectorAll('.page-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.page === page) {
                btn.classList.add('active');
            }
        });
    }
    
    initializeCart() {
        // Initialize with Semen Rajawali in cart (as shown in the UI)
        this.inventoryService.addToCart('semen-rajawali');
    }
    
    formatPrice(price) {
        return new Intl.NumberFormat('id-ID').format(price);
    }
}

// Additional utility functions
function showLoading(element) {
    if (element) {
        element.classList.add('loading');
        element.disabled = true;
    }
}

function hideLoading(element) {
    if (element) {
        element.classList.remove('loading');
        element.disabled = false;
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MiniERP();

    // Payment modal interactions
    const overlay = document.getElementById('paymentOverlay');
    const modal = document.getElementById('paymentModal');
    const closeBtn = document.getElementById('paymentCloseBtn');
    const saveBtn = document.getElementById('paymentSaveBtn');
    const methodButtons = document.querySelectorAll('.method-btn');
    const methodViews = {
        cash: document.getElementById('methodViewCash'),
        qris: document.getElementById('methodViewQris'),
        edc: document.getElementById('methodViewEdc')
    };
    const contentView = document.getElementById('paymentContentView');
    const confirmView = document.getElementById('paymentConfirmView');
    const trxNumberEl = document.getElementById('trxNumber');

    // Expose helpers globally
    window.openPaymentModal = function openPaymentModal() {
        if (overlay) overlay.style.display = 'block';
        if (modal) modal.style.display = 'block';
        // default to cash
        setActiveMethod('cash');
        updateChange();
        switchToEntryView();
    };

    function closePaymentModal() {
        if (overlay) overlay.style.display = 'none';
        if (modal) modal.style.display = 'none';
        resetEntryState();
    }

    function setActiveMethod(method) {
        methodButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.method === method);
        });
        Object.keys(methodViews).forEach(key => {
            if (methodViews[key]) methodViews[key].style.display = key === method ? 'block' : 'none';
        });
    }

    function parseRupiah(text) {
        const digits = (text || '').toString().replace(/[^0-9]/g, '');
        return Number(digits || 0);
    }

    function formatRupiahNumberOnly(num) {
        return new Intl.NumberFormat('id-ID').format(Math.max(0, Math.floor(num)));
    }

    function formatRupiahWithPrefix(num) {
        return 'Rp ' + formatRupiahNumberOnly(num);
    }

    function updateChange() {
        const totalText = document.querySelector('.summary-value.total-amount')?.textContent || 'Rp 0';
        const total = parseRupiah(totalText);
        const paid = parseRupiah(document.getElementById('cashPaidInput')?.value || '0');
        const changeEl = document.getElementById('cashChangeOutput');
        if (changeEl) changeEl.textContent = formatRupiahWithPrefix(paid - total);
    }

    // Transaction number generator with session counter
    let trxCounter = 0;
    function generateTrxNumber() {
        trxCounter += 1;
        const now = new Date();
        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const yyyy = String(now.getFullYear());
        const seq = String(trxCounter).padStart(5, '0');
        return `TRX-${dd}${mm}${yyyy}${seq}`;
    }

    function switchToEntryView() {
        if (!contentView || !confirmView) return;
        confirmView.style.display = 'none';
        contentView.style.display = 'block';
        if (saveBtn) saveBtn.textContent = 'Simpan';
    }

    function switchToConfirmView() {
        if (!contentView || !confirmView) return;
        contentView.style.display = 'none';
        confirmView.style.display = 'block';
        if (saveBtn) saveBtn.textContent = 'Tutup';
        if (trxNumberEl) trxNumberEl.textContent = generateTrxNumber();
    }

    function resetEntryState() {
        const cashInput = document.getElementById('cashPaidInput');
        if (cashInput) cashInput.value = '';
        const changeEl = document.getElementById('cashChangeOutput');
        if (changeEl) changeEl.textContent = 'Rp 0';
        setActiveMethod('cash');
        switchToEntryView();
    }

    // Events
    if (overlay) overlay.addEventListener('click', closePaymentModal);
    if (closeBtn) closeBtn.addEventListener('click', closePaymentModal);
    if (saveBtn) saveBtn.addEventListener('click', () => {
        // Toggle between entry and confirmation
        if (confirmView && confirmView.style.display === 'block') {
            closePaymentModal();
        } else {
            switchToConfirmView();
        }
    });

    methodButtons.forEach(btn => {
        btn.addEventListener('click', () => setActiveMethod(btn.dataset.method));
    });

    const cashInput = document.getElementById('cashPaidInput');
    if (cashInput) {
        // Initialize with prefix
        if (!cashInput.value) cashInput.value = 'Rp 0';

        function setCursorToEnd(el) {
            requestAnimationFrame(() => {
                const len = el.value.length;
                el.setSelectionRange(len, len);
            });
        }

        cashInput.addEventListener('focus', () => {
            if (!/^Rp\s/.test(cashInput.value)) {
                cashInput.value = 'Rp 0';
                setCursorToEnd(cashInput);
            }
        });

        cashInput.addEventListener('keydown', (e) => {
            const prefix = 'Rp ';
            const value = cashInput.value;
            const selectionStart = cashInput.selectionStart || 0;
            // Prevent backspace/delete from removing the prefix
            if ((e.key === 'Backspace' && selectionStart <= prefix.length) ||
                (e.key === 'Delete' && selectionStart < prefix.length)) {
                e.preventDefault();
                setCursorToEnd(cashInput);
            }
            // Block non-numeric keys except control/navigation keys
            const allowed = ['Backspace','Delete','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','Tab'];
            if (e.ctrlKey || e.metaKey || e.altKey) return; // allow combos
            if (allowed.includes(e.key)) return;
            if (!/^[0-9]$/.test(e.key)) {
                e.preventDefault();
            }
        });

        cashInput.addEventListener('input', () => {
            const raw = parseRupiah(cashInput.value);
            cashInput.value = 'Rp ' + (raw === 0 ? '0' : formatRupiahNumberOnly(raw));
            setCursorToEnd(cashInput);
            updateChange();
        });
    }
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MiniERP;
}