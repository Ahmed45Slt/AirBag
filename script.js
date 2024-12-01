// استيراد الوظائف المطلوبة من Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";

// تهيئة Firebase باستخدام إعدادات التطبيق
const firebaseConfig = {
    apiKey: "AIzaSyAuqQr3oodOicEhxn9Wc5-I91De-DFbyEk",
    authDomain: "airbag-e975f.firebaseapp.com",
    databaseURL: "https://airbag-e975f-default-rtdb.firebaseio.com",
    projectId: "airbag-e975f",
    storageBucket: "airbag-e975f.firebasestorage.app",
    messagingSenderId: "332045808065",
    appId: "1:332045808065:web:5bc8c6b4849723c775bf40"
};

// تهيئة التطبيق
const app = initializeApp(firebaseConfig);
const db = getDatabase(app); // الحصول على مرجع قاعدة البيانات

// دالة للتحقق من VIN وتخزينه في Firebase
window.checkVIN = function () {
    const vin = document.getElementById('vinInput').value.trim().toUpperCase();
    const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/;

    if (!vinRegex.test(vin)) {
        Swal.fire({
            title: 'خطأ',
            text: 'الرجاء إدخال رقم VIN المكون من 17 حرفًا وأرقام فقط.',
            icon: 'error',
            confirmButtonText: 'حسناً'
        });
        return;
    }

    const vinRef = ref(db, 'vins/' + vin);
    get(vinRef).then((snapshot) => {
        if (snapshot.exists()) {
            Swal.fire({
                title: 'معلومات',
                text: 'هذه سيارة تتوفر على شهادة AirBag.',
                icon: 'info',
                confirmButtonText: 'حسناً'
            });
        } else {
            fetch('dangerous_vins.json')
                .then(response => response.json())
                .then(dangerousVINs => {
                    if (dangerousVINs.includes(vin)) {
                        Swal.fire({
    title: 'تحذير',
    text: 'هذه السيارة تشكل خطراً!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'لديه شهادة',
    cancelButtonText: 'إغلاق'
}).then((result) => {
    if (result.isConfirmed) {
        Swal.fire({
            title: 'تأكيد',
            text: 'هل أنت متأكد أنك تريد إضافة شهادة لهذه السيارة؟',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'نعم، أضف الشهادة',
            cancelButtonText: 'لا'
        }).then((confirmResult) => {
            if (confirmResult.isConfirmed) {
                Swal.fire('تم التحقق!', 'تمت إضافة شهادة AirBag بنجاح.', 'success');
                set(vinRef, {
                    certificate: 'true',
                    checkedAt: new Date().toISOString()
                });
            }
        });
    }
});
                    } else {
                        Swal.fire({
                            title: 'ممتاز',
                            text: 'السيارة لا تشكل خطراً.',
                            icon: 'success',
                            confirmButtonText: 'حسناً'
                        });
                    }
                })
                .catch(error => {
                    Swal.fire('خطأ', 'حدث خطأ أثناء تحميل البيانات.', 'error');
                    console.error(error);
                });
        }
    }).catch(error => {
        Swal.fire('خطأ', 'حدث خطأ أثناء قراءة البيانات من Firebase.', 'error');
        console.error("Error reading from Firebase:", error);
    });
};

// دالة مساعدة لتبديل الرؤية
window.toggleVisibility = function (selector, isVisible) {
    document.querySelector(selector).style.display = isVisible ? 'block' : 'none';
};
window.generatePDF = function () {
    const vin = document.getElementById('vinInput').value.trim().toUpperCase();
    if (!vin) {
        Swal.fire('Erreur', 'Veuillez entrer le VIN d\'abord.', 'error');
        return;
    }

    const { jsPDF } = window.jspdf;
    const now = new Date();
    const doc = new jsPDF();

    doc.text('Rapport de vérification du VIN', 50, 43);

    const formattedDate = now.toLocaleDateString('fr-FR');

    const vinRef = ref(db, 'vinData/' + vin);
    get(vinRef).then((snapshot) => {
        const certificateStatus = snapshot.exists()
            ? 'Cette voiture possède un certificat AirBag.'
            : 'Cette voiture ne possède pas de certificat AirBag.';

        const tableData = [
            ['Désignation', 'Valeur'],
            ['VIN', vin],
            ['Statut', 'Vérification réussie'],
            ['Date du rapport', formattedDate],
            ['Certificat AirBag', certificateStatus],
        ];

        // تعديل الجدول مع خطوط الأعمدة وألوان النصوص
        doc.autoTable({
            head: [tableData[0]],
            body: tableData.slice(1),
            startY: 50,
            styles: {
                fontSize: 14,   // حجم الخط
                cellPadding: 5, // مسافة الخلايا
                valign: 'middle', // محاذاة النص داخل الخلايا
                halign: 'center', // محاذاة النص أفقياً
                lineColor: [0, 0, 0], // لون الخطوط (أسود)
                lineWidth: 0.5,  // سمك الخطوط
                fillColor: [240, 240, 240], // لون خلفية الخلايا
                textColor: [0, 0, 0],  // لون النص داخل الخلايا (أسود)
            },
            headStyles: {
                fillColor: [0, 0, 128], // لون خلفية العناوين (أزرق)
                textColor: [255, 255, 0], // لون النص للعناوين (أبيض)
                fontStyle: 'bold',
            },
            alternateRowStyles: {
                fillColor: [204, 204, 255], // لون خلفية الأسطر المتناوبة (لافندر فاتح)
            },
            columnStyles: {
                0: { cellWidth: 'auto' }, // عرض العمود الأول
                1: { cellWidth: 'auto' }, // عرض العمود الثاني
            },
            margin: { top: 20, left: 10 }, // مسافة الجدول من الأعلى واليسار
        });

        // تصدير التقرير
        doc.save('Rapport_VIN_Table.pdf');
    }).catch((error) => {
        Swal.fire('Erreur', 'Une erreur est survenue lors de la vérification.', 'error');
        console.error("Erreur Firebase:", error);
    });
};

// تحديث التاريخ والوقت
window.updateDateTime = function () {
    const now = new Date();
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const dayName = days[now.getDay()];
    const day = now.getDate();
    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const month = monthNames[now.getMonth()];
    const year = now.getFullYear();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const formattedDateTime = `${dayName} ${day} ${month} ${year} ${hours}:${minutes}:${seconds}`;
    document.getElementById('datetime').innerText = formattedDateTime;
};

// تحديث الوقت كل ثانية
setInterval(window.updateDateTime, 1000);
window.updateDateTime();