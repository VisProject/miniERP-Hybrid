/**
 * Inventory Service - Handles inventory data fetching and cart operations
 * Integrates with Google Sheets API and Apps Script WebApp
 */

class InventoryService {
    constructor() {
        this.config = null;
        this.inventory = [];
        this.cart = [];
        this.taxRate = 0.11; // 11% PPN
        
        this.loadConfig();
    }

    /**
     * Load configuration from config.json
     */
    async loadConfig() {
        try {
            const response = await fetch('config.json');
            this.config = await response.json();
            console.log('Configuration loaded:', this.config);
        } catch (error) {
            console.error('Failed to load configuration:', error);
            // Fallback to default config
            this.config = {
                INVENTORY_SHEET_ID: '',
                FINANCE_SHEET_ID: '',
                APPS_SCRIPT_URL: '',
                SECRET_KEY: ''
            };
        }
    }

    /**
     * Fetch inventory data from Google Sheets or CSV
     * @returns {Promise<Array>} Array of product objects
     */
    async getInventory() {
        try {
            // If Google Sheets API is configured, use it
            if (this.config.INVENTORY_SHEET_ID && this.config.APPS_SCRIPT_URL) {
                return await this.fetchFromGoogleSheets();
            } else {
                // Fallback to CSV or static data
                return await this.fetchFromCSV();
            }
        } catch (error) {
            console.error('Failed to fetch inventory:', error);
            // Return fallback data
            return this.getFallbackInventory();
        }
    }

    /**
     * Fetch inventory from Google Sheets via Apps Script WebApp
     */
    async fetchFromGoogleSheets() {
        const url = `${this.config.APPS_SCRIPT_URL}?action=getInventory&sheetId=${this.config.INVENTORY_SHEET_ID}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.SECRET_KEY}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.products || [];
    }

    /**
     * Fetch inventory from CSV file or Google Sheets
     */
    async fetchFromCSV() {
        try {
            // Try Google Sheets first
            const googleSheetsUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQeQzTtU6TzJRvBH3hy2kyedHOa4-sl6LkuEgLSr3qx3awtYZm1_rbzuB5BXJg3h9Oa-ZwWODhkKxfI/pub?gid=0&single=true&output=csv';
            const response = await fetch(googleSheetsUrl);
            const csvText = await response.text();
            return this.parseCSV(csvText);
        } catch (error) {
            console.warn('Google Sheets CSV not accessible, trying local CSV');
            try {
                const response = await fetch('assets/data/inventory.csv');
                const csvText = await response.text();
                return this.parseCSV(csvText);
            } catch (localError) {
                console.warn('Local CSV file not found, using fallback data');
                return this.getFallbackInventory();
            }
        }
    }

    /**
     * Parse CSV data into product objects
     */
    parseCSV(csvText) {
        const lines = csvText.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const products = [];

        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
                const values = lines[i].split(',').map(v => v.trim());
                const product = {};
                
                headers.forEach((header, index) => {
                    const value = values[index] || '';
                    switch (header.toLowerCase()) {
                        case 'sku':
                        case 'id':
                            product.id = value;
                            break;
                        case 'nama_item':
                        case 'name':
                        case 'product_name':
                            product.name = value;
                            break;
                        case 'harga_jual':
                        case 'price':
                            product.price = parseFloat(value) || 0;
                            break;
                        case 'kategori':
                        case 'category':
                            product.category = value;
                            break;
                        case 'satuan':
                        case 'weight':
                        case 'unit':
                            product.weight = value;
                            break;
                        case 'image':
                        case 'image_url':
                            product.image = value;
                            break;
                        case 'jumlah':
                        case 'stock':
                        case 'quantity':
                            product.stock = parseInt(value) || 0;
                            break;
                        case 'harga_beli':
                            product.costPrice = parseFloat(value) || 0;
                            break;
                        case 'nama_vendor':
                            product.vendor = value;
                            break;
                        default:
                            product[header.toLowerCase()] = value;
                    }
                });
                
                if (product.id && product.name) {
                    // Set default image if not provided
                    if (!product.image) {
                        product.image = `Asset/assets/img/products/${product.id}.png`;
                    }
                    products.push(product);
                }
            }
        }

        return products;
    }

    /**
     * Fallback inventory data when external sources fail
     */
    getFallbackInventory() {
        return [
            {
                id: 'semen-padang',
                name: 'Semen Padang',
                price: 165000,
                category: 'semen',
                weight: '55Kg / 1 Karung',
                image: 'Asset/assets/img/products/semen-padang.png',
                stock: 50
            },
            {
                id: 'semen-tiga-roda',
                name: 'Semen Tiga Roda',
                price: 135000,
                category: 'semen',
                weight: '55Kg / 1 Karung',
                image: 'Asset/assets/img/products/semen-tiga-roda.png',
                stock: 30
            },
            {
                id: 'semen-baturaja',
                name: 'Semen Baturaja',
                price: 115000,
                category: 'semen',
                weight: '55Kg / 1 Karung',
                image: 'Asset/assets/img/products/semen-baturaja.png',
                stock: 25
            },
            {
                id: 'semen-rajawali',
                name: 'Semen Rajawali',
                price: 105000,
                category: 'semen',
                weight: '55Kg / 1 Karung',
                image: 'Asset/assets/img/products/semen-rajawali.png',
                stock: 40
            },
            {
                id: 'semen-gresik',
                name: 'Semen Gresik',
                price: 125000,
                category: 'semen',
                weight: '55Kg / 1 Karung',
                image: 'Asset/assets/img/products/semen-gresik.png',
                stock: 35
            },
            {
                id: 'semen-holcim',
                name: 'Semen Holcim',
                price: 145000,
                category: 'semen',
                weight: '55Kg / 1 Karung',
                image: 'Asset/assets/img/products/semen-holcim.png',
                stock: 20
            },
            {
                id: 'semen-indocement',
                name: 'Semen Indocement',
                price: 155000,
                category: 'semen',
                weight: '55Kg / 1 Karung',
                image: 'Asset/assets/img/products/semen-indocement.png',
                stock: 15
            },
            {
                id: 'batu-bata-merah',
                name: 'Batu Bata Merah',
                price: 2500,
                category: 'batu-bata',
                weight: '1 Pcs',
                image: 'Asset/assets/img/products/batu-bata-merah.png',
                stock: 1000
            },
            {
                id: 'genteng-beton',
                name: 'Genteng Beton',
                price: 15000,
                category: 'genteng',
                weight: '1 Pcs',
                image: 'Asset/assets/img/products/genteng-beton.png',
                stock: 200
            },
            {
                id: 'pintu-kayu',
                name: 'Pintu Kayu',
                price: 450000,
                category: 'pintu',
                weight: '1 Unit',
                image: 'Asset/assets/img/products/pintu-kayu.png',
                stock: 10
            }
        ];
    }

    /**
     * Render products in the DOM
     * @param {Array} productList - Array of product objects
     */
    renderProducts(productList) {
        const productsGrid = document.getElementById('productsGrid');
        if (!productsGrid) {
            console.error('Products grid element not found');
            return;
        }

        this.inventory = productList;
        
        productsGrid.innerHTML = productList.map(product => `
            <div class="product-card" data-product="${product.id}">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                    <div class="image-placeholder" style="display: none;">
                        <div class="placeholder-text">${product.name}<br>Image</div>
                    </div>
                </div>
                <div class="product-info">
                    <h4 class="product-name">${product.name}</h4>
                    <div class="product-price">Rp ${this.formatPrice(product.price)}</div>
                    <div class="product-weight">${product.weight}</div>
                    ${product.stock !== undefined ? `<div class="product-stock">Stok: ${product.stock}</div>` : ''}
                </div>
            </div>
        `).join('');

        // Bind click events for product selection
        productsGrid.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const productId = e.currentTarget.dataset.product;
                this.selectProduct(productId);
            });
        });
    }

    /**
     * Add product to cart
     * @param {string} sku - Product SKU/ID
     */
    addToCart(sku) {
        const product = this.inventory.find(p => p.id === sku);
        if (!product) {
            console.error('Product not found:', sku);
            return false;
        }

        // Check if product is already in cart
        const existingItem = this.cart.find(item => item.id === sku);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cart.push({
                ...product,
                quantity: 1
            });
        }

        this.updateCartDisplay();
        return true;
    }

    /**
     * Select product (adds to cart automatically)
     * @param {string} productId - Product ID
     */
    selectProduct(productId) {
        // Update visual selection
        document.querySelectorAll('.product-card').forEach(card => {
            card.classList.remove('selected');
            if (card.dataset.product === productId) {
                card.classList.add('selected');
            }
        });

        // Add to cart
        this.addToCart(productId);
    }

    /**
     * Update cart display in the DOM
     */
    updateCartDisplay() {
        const cartContent = document.getElementById('cartContent');
        const cartBadge = document.getElementById('cartBadge');
        
        if (!cartContent || !cartBadge) {
            console.error('Cart elements not found');
            return;
        }

        // Update cart badge
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        cartBadge.textContent = totalItems;

        // Update cart content
        if (this.cart.length === 0) {
            cartContent.innerHTML = '<div class="empty-cart">Keranjang kosong</div>';
        } else {
            cartContent.innerHTML = this.cart.map(item => `
                <div class="cart-item" data-product="${item.id}">
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">Rp ${this.formatPrice(item.price)}</div>
                        <div class="cart-item-unit">/ ${(() => {
                            const weightText = item.weight || '';
                            if (weightText.includes(' / ')) {
                                return weightText.split(' / ')[1];
                            }
                            return weightText || 'Unit';
                        })()}</div>
                    </div>
                    <div class="cart-item-controls">
                        <button class="quantity-btn" data-action="decrease" data-sku="${item.id}">-</button>
                        <span class="quantity-display">${item.quantity}</span>
                        <button class="quantity-btn" data-action="increase" data-sku="${item.id}">+</button>
                    </div>
                </div>
            `).join('');

            // Bind quantity control events
            cartContent.querySelectorAll('.quantity-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const action = e.currentTarget.dataset.action;
                    const sku = e.currentTarget.dataset.sku;
                    this.updateQuantity(sku, action);
                });
            });
        }

        // Update order summary
        this.updateOrderSummary();
    }

    /**
     * Update product quantity in cart
     * @param {string} sku - Product SKU
     * @param {string} action - 'increase' or 'decrease'
     */
    updateQuantity(sku, action) {
        const cartItem = this.cart.find(item => item.id === sku);
        if (!cartItem) return;

        if (action === 'increase') {
            cartItem.quantity += 1;
        } else if (action === 'decrease') {
            cartItem.quantity -= 1;
            if (cartItem.quantity <= 0) {
                this.cart = this.cart.filter(item => item.id !== sku);
            }
        }

        this.updateCartDisplay();
    }

    /**
     * Update order summary display
     */
    updateOrderSummary() {
        const subTotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const taxAmount = Math.round(subTotal * 0.11); // 11% PPN
        const total = subTotal + taxAmount;
        const itemCount = this.cart.reduce((sum, item) => sum + item.quantity, 0);

        // Update DOM elements
        const subTotalEl = document.getElementById('subTotal');
        const taxAmountEl = document.getElementById('taxAmount');
        const totalAmountEl = document.getElementById('totalAmount');
        const itemCountEl = document.getElementById('itemCount');

        if (subTotalEl) subTotalEl.textContent = `Rp ${this.formatPrice(subTotal)}`;
        if (taxAmountEl) taxAmountEl.textContent = `Rp ${this.formatPrice(taxAmount)}`;
        if (totalAmountEl) totalAmountEl.textContent = `Rp ${this.formatPrice(total)}`;
        if (itemCountEl) itemCountEl.textContent = `${itemCount} Item`;
    }

    /**
     * Process checkout and save transaction via Apps Script WebApp
     * @param {Array} cart - Cart items array
     */
    async checkout(cart) {
        if (!cart || cart.length === 0) {
            throw new Error('Cart is empty');
        }

        if (!this.config.APPS_SCRIPT_URL) {
            throw new Error('Apps Script URL not configured');
        }

        const transaction = {
            timestamp: new Date().toISOString(),
            items: cart.map(item => ({
                sku: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                total: item.price * item.quantity
            })),
            subtotal: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            tax: Math.round(cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) * this.taxRate),
            total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) + Math.round(cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) * this.taxRate),
            status: 'pending'
        };

        try {
            const response = await fetch(this.config.APPS_SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.SECRET_KEY}`
                },
                body: JSON.stringify({
                    action: 'saveTransaction',
                    data: transaction,
                    sheetId: this.config.FINANCE_SHEET_ID
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success) {
                // Clear cart after successful checkout
                this.cart = [];
                this.updateCartDisplay();
                return result;
            } else {
                throw new Error(result.error || 'Checkout failed');
            }

        } catch (error) {
            console.error('Checkout failed:', error);
            throw error;
        }
    }

    /**
     * Format price with Indonesian number format
     * @param {number} price - Price to format
     * @returns {string} Formatted price string
     */
    formatPrice(price) {
        return new Intl.NumberFormat('id-ID').format(price);
    }

    /**
     * Filter products by category
     * @param {string} category - Category to filter by
     */
    filterByCategory(category) {
        const filteredProducts = this.inventory.filter(product => 
            product.category === category
        );
        this.renderProducts(filteredProducts);
    }

    /**
     * Search products by name or category
     * @param {string} query - Search query
     */
    searchProducts(query) {
        const filteredProducts = this.inventory.filter(product => 
            product.name.toLowerCase().includes(query.toLowerCase()) ||
            product.category.toLowerCase().includes(query.toLowerCase())
        );
        this.renderProducts(filteredProducts);
    }

    /**
     * Get cart items
     * @returns {Array} Cart items array
     */
    getCart() {
        return this.cart;
    }

    /**
     * Clear cart
     */
    clearCart() {
        this.cart = [];
        this.updateCartDisplay();
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InventoryService;
}

// Global instance for direct usage
window.InventoryService = InventoryService;
