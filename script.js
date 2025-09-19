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
        
        const subTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const taxAmount = Math.round(subTotal * 0.11);
        const finalTotal = subTotal + taxAmount;
        
        const orderSummary = cart.map(item => 
            `${item.name} x${item.quantity} = Rp ${this.formatPrice(item.price * item.quantity)}`
        ).join('\n');
        
        const confirmation = confirm(
            `Konfirmasi Pembayaran:\n\n${orderSummary}\n\nSub Total: Rp ${this.formatPrice(subTotal)}\nPPN (11%): Rp ${this.formatPrice(taxAmount)}\nTotal: Rp ${this.formatPrice(finalTotal)}\n\nLanjutkan pembayaran?`
        );
        
        if (confirmation) {
            try {
                showLoading(document.getElementById('checkoutBtn'));
                const result = await this.inventoryService.checkout(cart);
                alert('Pembayaran berhasil! Terima kasih atas pembelian Anda.');
                console.log('Checkout successful:', result);
            } catch (error) {
                alert('Pembayaran gagal: ' + error.message);
                console.error('Checkout failed:', error);
            } finally {
                hideLoading(document.getElementById('checkoutBtn'));
            }
        }
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
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MiniERP;
}