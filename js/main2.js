const themeToggle = document.getElementById('theme-toggle');
const langToggle = document.getElementById('lang-toggle');
const body = document.body;
const docHtml = document.documentElement;

// --- Theme Functionality ---
const setTheme = (isDark) => {
    if (isDark) {
        body.classList.add('dark');
        themeToggle.checked = true;
        localStorage.setItem('theme', 'dark');
    } else {
        body.classList.remove('dark');
        themeToggle.checked = false;
        localStorage.setItem('theme', 'light');
    }
};

// --- Language Functionality ---
const setLanguage = (isEnglish) => {
    if (isEnglish) {
        docHtml.lang = 'en';
        langToggle.checked = true;
        localStorage.setItem('language', 'en');
    } else {
        docHtml.lang = 'pt';
        langToggle.checked = false;
        localStorage.setItem('language', 'pt');
    }
};

// --- Event Listeners ---
themeToggle.addEventListener('change', () => setTheme(themeToggle.checked));
langToggle.addEventListener('change', () => setLanguage(langToggle.checked));

// --- PDF Download Functionality ---
document.getElementById('download-pdf-btn').addEventListener('click', function () {
    const element = document.getElementById('cv-to-print');
    const lang = docHtml.lang.toUpperCase();
    const opt = {
        margin: [0.4, 0, 0.4, 0],
        filename: `Armando_Alves_CV_${lang}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: body.classList.contains('dark') ? '#1f2937' : '#ffffff' },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'], avoid: '.avoid-break' }
    };
    html2pdf().from(element).set(opt).save();
});

// --- Set Initial State on Load ---
// Set Theme (Default to Light)
const savedTheme = localStorage.getItem('theme');
setTheme(savedTheme === 'dark');

// Set Language (Default to Portuguese)
const savedLang = localStorage.getItem('language');
setLanguage(savedLang === 'en'); 
