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
document.getElementById('download-pdf-btn').addEventListener('click', async function () {
    // 1. Clone the element to avoid modifying the original page
    const element = document.getElementById('cv-to-print').cloneNode(true);
    const lang = docHtml.lang.toUpperCase();

    // 2. Fetch and inline the CSS
    try {
        const response = await fetch('css/style.css');
        const cssText = await response.text();
        const style = document.createElement('style');
        style.type = 'text/css';
        style.appendChild(document.createTextNode(cssText));
        element.prepend(style); // Prepend to ensure it's in the head of the clone
    } catch (error) {
        console.error('Error fetching or inlining CSS:', error);
        // Optionally, handle the error, e.g., by alerting the user
    }
    
    // 3. Find the image and convert it to a Base64 data URL
    const profilePic = element.querySelector('.profile-picture');
    if (profilePic && profilePic.src) {
        try {
            const response = await fetch(profilePic.src);
            const blob = await response.blob();
            const dataUrl = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
            profilePic.src = dataUrl;
        } catch (error) {
            console.error('Error converting image to Base64:', error);
        }
    }
    
    // 4. Set PDF options
    const opt = {
        margin: [0.4, 0, 0.4, 0],
        filename: `Armando_Alves_CV_${lang}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: body.classList.contains('dark') ? '#1f2937' : '#ffffff' },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'], avoid: '.avoid-break' }
    };
    
    // 5. Generate PDF from the modified clone
    html2pdf().from(element).set(opt).save();
});

// --- Set Initial State on Load ---
// Set Theme (Default to Light)
const savedTheme = localStorage.getItem('theme');
setTheme(savedTheme === 'dark');

// Set Language (Default to Portuguese)
const savedLang = localStorage.getItem('language');
setLanguage(savedLang === 'en'); 