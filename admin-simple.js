// Simple version without file operations during save
document.addEventListener('DOMContentLoaded', function() {
    const productForm = document.getElementById('productForm');
    
    if (productForm) {
        productForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Simple form submission');
            
            // Get form data
            const productName = document.getElementById('productName').value.trim();
            const productPrice = document.getElementById('productPrice').value;
            const productDescription = document.getElementById('productDescription').value.trim();
            const productCategory = document.getElementById('productCategory').value;
            const productStock = document.getElementById('productStock').value;
            
            if (!productName || !productPrice || !productDescription || !productCategory) {
                alert('Please fill in all required fields.');
                return;
            }
            
            // Create simple product data without images for now
            const productData = {
                id: Date.now().toString(),
                name: productName,
                price: parseFloat(productPrice),
                description: productDescription,
                category: productCategory,
                stock: parseInt(productStock) || 0,
                createdAt: new Date().toISOString()
            };
            
            try {
                // Get existing products
                let products = [];
                const localProducts = localStorage.getItem('mercurial_products');
                if (localProducts) {
                    products = JSON.parse(localProducts);
                }
                
                // Add new product
                products.push(productData);
                
                // Save to localStorage
                localStorage.setItem('mercurial_products', JSON.stringify(products));
                
                alert('Product saved successfully!');
                console.log('Product saved:', productData);
                
                // Reset form
                productForm.reset();
                
            } catch (error) {
                console.error('Error saving product:', error);
                alert('Error saving product: ' + error.message);
            }
        });
    }
});