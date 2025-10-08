// A simple object to hold the current cart state
let cart = [];

// --- UTILITY FUNCTIONS ---

// Function to simulate a GA4 Data Layer Push
function pushToDataLayer(event, data = {}) {
    // This is the core function for GTM/GA4 practice!
    // It pushes an event object into the global 'dataLayer' array.
    console.log(`dataLayer.push event: ${event}`, data);
    if (window.dataLayer) {
        window.dataLayer.push({
            'event': event,
            ...data
        });
    }
}

// Function to handle page switching and data layer 'page_view'
function navigateTo(pageId, pageTitle, triggerPageView = true) {
    // Hide all pages
    document.querySelectorAll('.page-view').forEach(page => {
        page.classList.add('hidden');
    });

    // Show the requested page
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.remove('hidden');
    }

    // Update document title for clearer tracking
    document.title = pageTitle;

    // IMPORTANT for GA4/GTM: Track the virtual page view
    if (triggerPageView) {
        pushToDataLayer('virtual_page_view', {
            'page_path': '/' + pageId,
            'page_title': pageTitle,
        });
    }

    // Special action for cart page
    if (pageId === 'cart-page') {
        renderCart();
    }
}

// --- CART LOGIC ---

function addToCart(product) {
    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    // 1. Update Cart UI Count
    updateCartCount();

    // 2. Show '+1 Added' notification
    showNotification();

    // 3. IMPORTANT for GA4/GTM: Track the 'add_to_cart' event
    pushToDataLayer('add_to_cart', {
        ecommerce: {
            currency: "USD",
            items: [{
                item_id: product.id,
                item_name: product.name,
                price: product.price,
                quantity: 1,
            }]
        }
    });
}

function updateCartCount() {
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cart-count').textContent = totalCount;
}

function showNotification() {
    const notification = document.getElementById('add-to-cart-notification');
    notification.classList.remove('hidden');
    notification.style.opacity = 1;

    setTimeout(() => {
        notification.style.opacity = 0;
        // Wait for the fade out to finish before hiding
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 500);
    }, 500);
}

function renderCart() {
    const cartItemsDiv = document.getElementById('cart-items');
    const emptyMessage = document.getElementById('empty-cart-message');
    const cartSummary = document.getElementById('cart-summary');

    cartItemsDiv.innerHTML = ''; // Clear previous items

    if (cart.length === 0) {
        emptyMessage.classList.remove('hidden');
        cartSummary.classList.add('hidden');
        return;
    }

    emptyMessage.classList.add('hidden');
    cartSummary.classList.remove('hidden');

    let total = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        const itemDiv = document.createElement('div');
        itemDiv.classList.add('cart-item');
        itemDiv.innerHTML = `
            <span>${item.name} (x${item.quantity})</span>
            <span>$${itemTotal.toFixed(2)}</span>
        `;
        cartItemsDiv.appendChild(itemDiv);
    });

    document.getElementById('cart-total').textContent = `$${total.toFixed(2)}`;
}


function checkout() {
    // Generate a unique transaction ID
    const transactionId = 'T-' + Date.now();
    document.getElementById('order-id').textContent = transactionId;

    // Calculate total revenue and prepare items for the data layer
    let totalRevenue = 0;
    const itemsForGTM = cart.map(item => {
        totalRevenue += item.price * item.quantity;
        return {
            item_id: item.id,
            item_name: item.name,
            price: item.price,
            quantity: item.quantity,
        };
    });

    // 1. IMPORTANT for GA4/GTM: Track the 'purchase' event
    pushToDataLayer('purchase', {
        ecommerce: {
            transaction_id: transactionId,
            value: totalRevenue.toFixed(2), // Total value of the transaction
            currency: "USD",
            items: itemsForGTM
        }
    });

    // 2. Clear the cart and navigate to the Thank You page
    cart = [];
    updateCartCount();
    navigateTo('thankyou-page', 'Thank You - Order Complete', false); // No virtual_page_view here, as the purchase event should cover the conversion
}

// --- EVENT LISTENERS (Initial Setup) ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. Home and Cart Navigation
    document.getElementById('home-link').addEventListener('click', () => {
        navigateTo('home-page', 'Avengers Gear Store - Home');
    });

    document.getElementById('cart-link').addEventListener('click', () => {
        navigateTo('cart-page', 'Avengers Gear Store - Cart');
    });
    
    // 2. 'Add to Cart' Button Handlers
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const card = e.target.closest('.product-card');
            const product = {
                id: card.dataset.productId,
                name: card.dataset.name,
                price: parseFloat(card.dataset.price),
            };
            addToCart(product);
        });
    });

    // 3. Checkout Button Handler (Crucial for Conversion Tracking)
    document.getElementById('checkout-btn').addEventListener('click', checkout);

    // 4. Shop More Button on Thank You Page
    document.getElementById('shop-more-btn').addEventListener('click', () => {
        navigateTo('home-page', 'Avengers Gear Store - Home');
    });
    
    // Initial page load Data Layer push (First 'page_view')
    pushToDataLayer('virtual_page_view', {
        'page_path': '/home-page',
        'page_title': 'Avengers Gear Store - Home',
    });
});
