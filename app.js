// إعدادات Firebase (ضعي أكوادك هنا لاحقاً عند إنشاء مشروع جديد للزبونة)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const WHATSAPP_NUMBER = "963944123456"; // رقم الواتساب
const ADMIN_PASSWORD = "123456"; // كلمة المرور

let clickCount = 0;
let clickTimer = null;
const logo = document.getElementById('logo');

logo.addEventListener('click', () => {
    clickCount++;
    clearTimeout(clickTimer);
    if (clickCount === 5) {
        document.getElementById('admin-panel').style.display = 'block';
        clickCount = 0;
    } else {
        clickTimer = setTimeout(() => { clickCount = 0; }, 2000);
    }
});

function closeAdmin() { document.getElementById('admin-panel').style.display = 'none'; }

function login() {
    const pass = document.getElementById('admin-password').value;
    if (pass === ADMIN_PASSWORD) {
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('control-section').style.display = 'block';
        loadAdminProducts();
    } else { alert("كلمة المرور خاطئة!"); }
}

// متغير لتخزين الفئة الحالية المختارة
let currentCategory = 'all';

function filterCategory(category) {
    currentCategory = category;
    // تحديث الأزرار
    const buttons = document.getElementsByClassName('category-btn');
    for(let btn of buttons) {
        btn.classList.remove('active');
        if(btn.innerText === 'الكل' && category === 'all') btn.classList.add('active');
        else if(btn.innerText.includes(category) && category !== 'all') btn.classList.add('active');
    }
}

// إضافة منتج (مع الفئة)
function addProduct() {
    const name = document.getElementById('new-name').value;
    const price = document.getElementById('new-price').value;
    const category = document.getElementById('new-category').value; // أخذ الفئة المختارة
    const img = document.getElementById('new-img').value;
    
    if(name && price && img) {
        db.collection("products").add({
            name: name,
            price: price,
            img: img,
            category: category // حفظ الفئة في قاعدة البيانات
        }).then(() => {
            alert("تمت الإضافة بنجاح!");
            document.getElementById('new-name').value = '';
            document.getElementById('new-price').value = '';
            document.getElementById('new-img').value = '';
            loadAdminProducts(); 
        }).catch((error) => {
            alert("حدث خطأ: " + error.message);
        });
    } else {
        alert("الرجاء ملء جميع الحقول");
    }
}

// عرض المنتجات مع الفلترة
const productsContainer = document.getElementById('products-container');
db.collection("products").onSnapshot((snapshot) => {
    productsContainer.innerHTML = ''; 
    snapshot.forEach((doc) => {
        const product = doc.data();
        const productId = doc.id;
        
        // فلترة المنتجات حسب الفئة المختارة
        if(currentCategory !== 'all' && product.category !== currentCategory) return;

        const card = document.createElement('div');
        card.className = 'product-card';
        const msg = `مرحباً، أرغب بالاستفسار عن: ${product.name} - السعر: ${product.price} ل.س`;
        const waLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
        card.innerHTML = `
            <img src="${product.img}" alt="${product.name}" onclick="openLightbox('${product.img}')">
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="price">${product.price} ل.س</p>
                <a href="${waLink}" target="_blank" class="whatsapp-btn">تواصل عبر واتساب 📱</a>
            </div>`;
        productsContainer.appendChild(card);
    });
});

// لوحة التحكم
function loadAdminProducts() {
    const adminList = document.getElementById('admin-products-list');
    adminList.innerHTML = '';
    db.collection("products").get().then((snapshot) => {
        snapshot.forEach((doc) => {
            const product = doc.data();
            const productId = doc.id;
            adminList.innerHTML += `
                <div class="admin-item">
                    <img src="${product.img}" alt="img">
                    <input type="text" value="${product.name}" id="name-${productId}" style="width: 150px;">
                    <input type="text" value="${product.price}" id="price-${productId}" style="width: 100px;">
                    <select id="category-${productId}" style="width: 120px;">
                        <option value="محجبات" ${product.category === 'محجبات' ? 'selected' : ''}>محجبات</option>
                        <option value="سهرة" ${product.category === 'سهرة' ? 'selected' : ''}>سهرة</option>
                        <option value="أعراس" ${product.category === 'أعراس' ? 'selected' : ''}>أعراس</option>
                    </select>
                    <button onclick="updateProduct('${productId}')">حفظ</button>
                    <button onclick="deleteProduct('${productId}')" style="background: red;">حذف</button>
                </div>`;
        });
    });
}

function updateProduct(id) {
    const newName = document.getElementById(`name-${id}`).value;
    const newPrice = document.getElementById(`price-${id}`).value;
    const newCategory = document.getElementById(`category-${id}`).value;
    const newImg = document.getElementById(`img-${id}`).value;
    db.collection("products").doc(id).update({
        name: newName, price: newPrice, category: newCategory, img: newImg
    }).then(() => { alert("تم تحديث المنتج! (سيظهر للزبائن فوراً)"); });
}

function deleteProduct(id) {
    if(confirm("هل أنت متأكد من الحذف؟")) {
        db.collection("products").doc(id).delete().then(() => {
            alert("تم حذف المنتج.");
            loadAdminProducts();
        });
    }
}

// دوال معاينة الصورة
let currentZoom = 1;
function openLightbox(imgUrl) {
    document.getElementById('lightbox-img').src = imgUrl;
    document.getElementById('lightbox-modal').style.display = 'block';
    currentZoom = 1;
    document.getElementById('lightbox-img').style.transform = 'scale(1)';
}
function closeLightbox(event) {
    if (event.target.id === 'lightbox-modal' || event.target.id === 'lightbox-close') {
        document.getElementById('lightbox-modal').style.display = 'none';
    }
}
function zoomImage(step, event) {
    event.stopPropagation();
    currentZoom += step;
    if (currentZoom < 0.5) currentZoom = 0.5;
    if (currentZoom > 3) currentZoom = 3;
    document.getElementById('lightbox-img').style.transform = `scale(${currentZoom})`;
}