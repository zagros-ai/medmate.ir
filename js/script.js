// تابع جستجو بین برنامه‌ها
function filterApps() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const cards = document.querySelectorAll('.app-card');

    cards.forEach(card => {
        const appName = card.getAttribute('data-name').toLowerCase();
        if (appName.includes(searchInput)) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

// تابع فیلتر بر اساس دسته‌بندی
function filterCategory(category, button) {
    // تغییر استایل دکمه‌های فیلتر
    document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    const cards = document.querySelectorAll('.app-card');
    cards.forEach(card => {
        const cardCategory = card.getAttribute('data-category');
        if (category === 'all' || cardCategory === category) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

// باز کردن پنجره دانلود و جزئیات
function openModal(title, category, desc, size, version, apkLink, iconUrl) {
    document.getElementById('modalTitle').innerText = title;
    document.getElementById('modalCategory').innerText = category;
    document.getElementById('modalDesc').innerText = desc;
    document.getElementById('modalSize').innerText = 'حجم: ' + size;
    document.getElementById('modalVersion').innerText = 'نسخه: ' + version;
    document.getElementById('modalIcon').src = iconUrl;
    
    const downloadBtn = document.getElementById('modalDownloadBtn');
    downloadBtn.href = apkLink;

    document.getElementById('appModal').classList.add('active');
}

// بستن پنجره جزئیات
function closeModal() {
    document.getElementById('appModal').classList.remove('active');
}

// بستن مدال با کلیک روی فضای بیرونی
window.onclick = function(event) {
    const modal = document.getElementById('appModal');
    if (event.target === modal) {
        closeModal();
    }
}

// ==========================================
// بخش مدیریت Service Worker و آپدیت خودکار (بدون تایید کاربر)
// ==========================================

let refreshing = false;

// وقتی سرویس ورکر جدید جایگزین شد، صفحه را فقط یک‌بار ریلود کن
navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
        window.location.reload();
        refreshing = true;
    }
});

let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => { 
    e.preventDefault(); 
    deferredPrompt = e; 
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(reg => {
            reg.addEventListener('updatefound', () => {
                const newWorker = reg.installing;
                newWorker.addEventListener('statechange', () => {
                    // اگر سرویس ورکر جدید نصب شد و یک سرویس ورکر قدیمی در حال کار است
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // بدون اجازه گرفتن از کاربر، مستقیماً پیام جایگزینی را ارسال کن
                        newWorker.postMessage('skipWaiting');
                    }
                });
            });
        }).catch(error => console.log('Service Worker registration failed:', error));
    });
}
