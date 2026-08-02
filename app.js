import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, onValue, remove, push } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// ⚠️ ضع رموز Firebase الخاصة بك هنا
const firebaseConfig = {
    apiKey: "AIzaSyBJ5H5z17_gJt_8Nop8RfxmmsRFX4SDbYI",
    authDomain: "sabaya-store.firebaseapp.com",
    databaseURL: "https://sabaya-store-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "sabaya-store",
    storageBucket: "sabaya-store.firebasestorage.app",
    messagingSenderId: "76152488551",
    appId: "1:76152488551:web:6cb3ff8ba85b25bc9b0ac2"
    
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// رقم واتساب صاحبة المتجر (ضع الرقم مع رمز الدولة بدون +)
const WHATSAPP_NUMBER = "963991234567"; 

// تحميل الفئات
function loadCategories() {
    onValue(ref(db, 'categories/'), (snapshot) => {
        const data = snapshot.val();
        const nav = document.getElementById("categoriesNav");
        const adminSelect = document.getElementById("dressCat");
        
        let navHTML = `<button class="cat-btn active" onclick="filterCategory('all', event)">الكل</button>`;
        let selectHTML = "";
        
        if (data) {
            Object.keys(data).forEach(key => {
                navHTML += `<button class="cat-btn" onclick="filterCategory('${key}', event)">${data[key].name}</button>`;
                selectHTML += `<option value="${key}">${data[key].name}</option>`;
            });
        }
        nav.innerHTML = navHTML;
        adminSelect.innerHTML = selectHTML || `<option value="">لا توجد فئات</option>`;
    });
}

// تحميل الفساتين
function loadDresses() {
    onValue(ref(db, 'dresses/'), (snapshot) => {
        const data = snapshot.val();
        const grid = document.getElementById("dressesGrid");
        const adminList = document.getElementById("adminDressList");
        
        let gridHTML = "";
        let adminHTML = "";

        if (data) {
            Object.keys(data).forEach(key => {
                const d = data[key];
                gridHTML += `
                    <div class="card" data-cat="${d.category}">
                        <img src="${d.image}" onclick="previewImage('${d.image}')">
                        <div class="card-body">
                            <div class="card-title">${d.name}</div>
                            <div class="card-desc">${d.description}</div>
                            <div class="card-price">${d.price} ل.س</div>
                            <a href="https://wa.me/${WHATSAPP_NUMBER}?text=استفسار عن الفستان: ${d.name}" target="_blank" class="whatsapp-btn">
                                <i class="fab fa-whatsapp"></i> اطلب عبر واتساب
                            </a>
                        </div>
                    </div>
                `;
                adminHTML += `
                    <div class="admin-item">
                        <span>${d.name} - ${d.price} ل.س</span>
                        <button class="delete-btn" onclick="deleteDress('${key}')">حذف</button>
                    </div>
                `;
            });
        } else {
            gridHTML = `<p style="grid-column: 1/-1; text-align: center; color: #666;">لا توجد فساتين حالياً.</p>`;
        }
        grid.innerHTML = gridHTML;
        adminList.innerHTML = adminHTML;
    });
}

// إتاحة الدوال للاستخدام في HTML
window.previewImage = function(src) {
    document.getElementById("previewSrc").src = src;
    document.getElementById("imgPreview").style.display = "flex";
}

window.filterCategory = function(cat, e) {
    const buttons = document.querySelectorAll('.cat-btn');
    buttons.forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');

    const cards = document.querySelectorAll('#dressesGrid .card');
    cards.forEach(c => {
        c.style.display = (cat === 'all' || c.dataset.cat === cat) ? "block" : "none";
    });
}

window.addCategory = function() {
    const name = document.getElementById("newCatName").value;
    if(!name) return alert("أدخل اسم الفئة");
    const newRef = push(ref(db, 'categories/'));
    set(newRef, { name: name });
    document.getElementById("newCatName").value = "";
}

window.deleteDress = function(id) {
    if(confirm("حذف الفستان؟")) remove(ref(db, 'dresses/' + id));
}

// ضغط الصورة قبل الحفظ
window.compressImage = function(file, callback) {
    const reader = new FileReader();
    reader.onload = e => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const MAX_W = 600;
            let w = img.width, h = img.height;
            if (w > MAX_W) { h *= MAX_W / w; w = MAX_W; }
            canvas.width = w; canvas.height = h;
            ctx.drawImage(img, 0, 0, w, h);
            callback(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

window.addDress = function() {
    const name = document.getElementById("dressName").value;
    const cat = document.getElementById("dressCat").value;
    const price = document.getElementById("dressPrice").value;
    const desc = document.getElementById("dressDesc").value;
    const imgFile = document.getElementById("dressImg").files[0];

    if(!name || !cat || !price || !imgFile) return alert("يرجى ملء جميع الحقول وإدراج صورة");

    compressImage(imgFile, (base64Image) => {
        const newRef = push(ref(db, 'dresses/'));
        set(newRef, {
            name: name, category: cat, price: price,
            description: desc, image: base64Image
        }).then(() => {
            alert("تم إضافة الفستان بنجاح!");
            document.getElementById("dressName").value = "";
            document.getElementById("dressPrice").value = "";
            document.getElementById("dressDesc").value = "";
            document.getElementById("dressImg").value = "";
        });
    });
}

window.adminLogin = function() {
    const pass = document.getElementById("adminPass").value;
    const email = "sabaya@store.com"; // الإيميل الذي ستنشئه في Firebase
    if (pass === "sabaya2024") { // كلمة المرور
        signInWithEmailAndPassword(auth, email, pass)
        .then(() => {
            closeModal('loginModal');
            document.getElementById("adminModal").style.display = "flex";
        }).catch(err => alert("خطأ في الاتصال: " + err.message));
    } else {
        alert("كلمة المرور غير صحيحة!");
    }
}

window.closeModal = function(id) {
    document.getElementById(id).style.display = "none";
}

// فتح لوحة التحكم بالضغط 6 مرات على اللوغو
let clickCount = 0; let clickTimer;
document.getElementById("logoBtn").addEventListener('click', () => {
    clickCount++;
    clearTimeout(clickTimer);
    if(clickCount === 6) {
        document.getElementById("loginModal").style.display = "flex";
        clickCount = 0;
    }
    clickTimer = setTimeout(() => { clickCount = 0; }, 2000);
});

// بدء تحميل البيانات عند فتح الموقع
loadCategories();
loadDresses();