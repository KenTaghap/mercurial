// products.js - Handles product display and management

// Function to fetch products from localStorage or products.json
async function fetchProducts() {
    try {
        // First try to get products from localStorage
        const localProducts = localStorage.getItem('mercurial_products');
        if (localProducts) {
            return JSON.parse(localProducts);
        }
        
        // If no local products, try to fetch from products.json
        const response = await fetch('data/products.json');
        if (!response.ok) {
            throw new Error('Failed to fetch products');
        }
        return await response.json();
    } catch (error) {
        console.error('Error loading products:', error);
        return [];
    }
}

// Function to display products on the index page
async function displayProducts() {
    const products = await fetchProducts();
    const productGrid = document.querySelector('.product-grid');
    
    if (!productGrid || !products.length) return;
    
    // Clear existing products
    productGrid.innerHTML = '';
    
    // Display only the first 4 products
    const maxProducts = 4;
    const displayedProducts = products.slice(0, maxProducts);
    
    displayedProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        
        // Create the product image container with link
        const productImageLink = document.createElement('a');
        productImageLink.href = `product-details.html?id=${product.id}`;
        productImageLink.className = 'product-image-link';
        
        const productImage = document.createElement('div');
        productImage.className = 'product-image';
        productImage.style.backgroundImage = `url('${product.images[0] || 'https://via.placeholder.com/300x400'}')`;
        
        // Create the overlay
        const overlay = document.createElement('div');
        overlay.className = 'product-overlay';
        
        // Create the view details button
        const viewDetailsBtn = document.createElement('span');
        viewDetailsBtn.className = 'quick-view';
        viewDetailsBtn.textContent = 'View Details';
        
        // Append elements
        overlay.appendChild(viewDetailsBtn);
        productImage.appendChild(overlay);
        productImageLink.appendChild(productImage);
        
        // Create product info
        const productName = document.createElement('h3');
        productName.textContent = product.name;
        
        const productPrice = document.createElement('p');
        productPrice.className = 'price';
        productPrice.textContent = `₱${product.price.toFixed(2)}`;
        
        // Append all elements to product card
        productCard.appendChild(productImageLink);
        productCard.appendChild(productName);
        productCard.appendChild(productPrice);
        
        // Add to grid
        productGrid.appendChild(productCard);
    });
    
    // Add View All button if there are more products
    if (products.length > maxProducts) {
        // Check if the button already exists
        if (!document.querySelector('.view-all-container')) {
            const viewAllContainer = document.createElement('div');
            viewAllContainer.className = 'view-all-container';
            viewAllContainer.style.textAlign = 'center';
            viewAllContainer.style.marginTop = '3rem';
            viewAllContainer.style.width = '100%';
            
            const viewAllButton = document.createElement('a');
            viewAllButton.href = 'shop.html';
            viewAllButton.className = 'cta-button';
            viewAllButton.textContent = 'View All Products';
            viewAllButton.style.display = 'inline-block';
            viewAllButton.style.padding = '12px 30px';
            viewAllButton.style.fontSize = '1rem';
            viewAllButton.style.marginTop = '1rem';
            
            viewAllContainer.appendChild(viewAllButton);
            
            // Insert after the product grid
            const productsSection = productGrid.closest('section');
            if (productsSection) {
                productsSection.appendChild(viewAllContainer);
            }
        }
    }
}

// Function to display a single product on the product details page
async function displayProductDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (!productId) return;
    
    const products = await fetchProducts();
    const product = products.find(p => p.id === productId);
    
    if (!product) {
        window.location.href = 'index.html';
        return;
    }
    
    // Update the product details
    document.title = `${product.name} - Mercurial`;
    
    // Main product details
    const mainImage = document.querySelector('.main-image img');
    const productTitle = document.querySelector('.product-header h1');
    const productPrice = document.querySelector('.product-header .price');
    const productDescription = document.querySelector('.product-info .description p');
    
    if (mainImage) mainImage.src = product.images[0] || 'https://via.placeholder.com/800x1000';
    if (productTitle) productTitle.textContent = product.name;
    if (productPrice) productPrice.textContent = `₱${product.price.toFixed(2)}`;
    if (productDescription) productDescription.textContent = product.description;
    
    // Update thumbnails
    const thumbnailContainer = document.querySelector('.thumbnail-container');
    if (thumbnailContainer) {
        thumbnailContainer.innerHTML = ''; // Clear existing thumbnails
        
        product.images.forEach((image, index) => {
            const thumbnail = document.createElement('div');
            thumbnail.className = `thumbnail ${index === 0 ? 'active' : ''}`;
            thumbnail.dataset.image = image;
            thumbnail.innerHTML = `<img src="${image}" alt="Thumbnail ${index + 1}">`;
            
            // Add click event to change main image
            thumbnail.addEventListener('click', () => {
                if (mainImage) mainImage.src = image;
                document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
                thumbnail.classList.add('active');
            });
            
            thumbnailContainer.appendChild(thumbnail);
        });
    }
    
    // Update related products
    const relatedProducts = products.filter(p => p.id !== productId).slice(0, 3);
    const relatedContainer = document.querySelector('.products-grid');
    
    if (relatedContainer && relatedProducts.length) {
        relatedContainer.innerHTML = ''; // Clear existing related products
        
        relatedProducts.forEach(relatedProduct => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <div class="product-image">
                    <img src="${relatedProduct.images[0] || 'https://via.placeholder.com/500x600'}" alt="${relatedProduct.name}">
                    <div class="product-overlay">
                        <a href="product-details.html?id=${relatedProduct.id}" class="quick-view">View Details</a>
                    </div>
                </div>
                <div class="product-info">
                    <h3>${relatedProduct.name}</h3>
                    <div class="price">₱${relatedProduct.price.toFixed(2)}</div>
                    <button class="add-to-cart" data-product-id="${relatedProduct.id}">Add to Cart</button>
                </div>
            `;
            relatedContainer.appendChild(productCard);
        });
    }
}

// Initialize the appropriate function based on the current page
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.product-details')) {
        displayProductDetails();
    } else if (document.querySelector('.product-grid')) {
        displayProducts();
    }
});
