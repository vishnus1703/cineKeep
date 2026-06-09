/* ==========================================================================
   CINEKEEP FULL-STACK PREMIUM REGISTRATION CORE ENGINE CONTROLLER
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. CORE ELEMENT ANCHORS ---
    const registerForm = document.getElementById('registerForm');
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const termsCheckbox = document.getElementById('terms');
    const submitButton = registerForm ? registerForm.querySelector('button[type="submit"]') : null;

    // --- 2. PASSWORD INTERACTIVE EYE TOGGLE MACRO ---
    const togglePasswordBtn = document.getElementById('togglePassword');
    const eyeIcon = document.getElementById('eyeIcon');

    if (togglePasswordBtn && passwordInput && eyeIcon) {
        togglePasswordBtn.addEventListener('click', () => {
            // Toggle type property matrix between safe dots and clear text
            const isPassword = passwordInput.getAttribute('type') === 'password';
            passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
            
            // Adjust vector class styles dynamically
            eyeIcon.className = isPassword 
                ? "fa-regular fa-eye-slash text-lg text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.4)]" 
                : "fa-regular fa-eye text-lg text-slate-500 hover:text-slate-300";
        });
    }

    // --- 3. PREMIUM TERMS MODAL CONTROL LAYER ---
    const termsModal = document.getElementById('termsModal');
    const modalCard = document.getElementById('modalCard');
    const openTermsBtn = document.getElementById('openTermsBtn');
    const closeTermsHeaderBtn = document.getElementById('closeTermsHeaderBtn');
    const closeTermsFooterBtn = document.getElementById('closeTermsFooterBtn');
    const acceptTermsBtn = document.getElementById('acceptTermsBtn');

    function openModal() {
        if (!termsModal || !modalCard) return;
        termsModal.classList.remove('hidden', 'pointer-events-none');
        // Delayed paint ensures smooth opacity transition activation
        setTimeout(() => {
            termsModal.classList.remove('opacity-0');
            modalCard.classList.remove('scale-95');
            modalCard.classList.add('scale-100');
        }, 10);
    }

    function closeModal() {
        if (!termsModal || !modalCard) return;
        termsModal.classList.add('opacity-0');
        modalCard.classList.remove('scale-100');
        modalCard.classList.add('scale-95');
        setTimeout(() => {
            termsModal.classList.add('hidden', 'pointer-events-none');
        }, 300); // Wait for transit window timeline matrix to finish clearing
    }

    if (openTermsBtn) openTermsBtn.addEventListener('click', openModal);
    if (closeTermsHeaderBtn) closeTermsHeaderBtn.addEventListener('click', closeModal);
    if (closeTermsFooterBtn) closeTermsFooterBtn.addEventListener('click', closeModal);
    
    if (acceptTermsBtn && termsCheckbox) {
        acceptTermsBtn.addEventListener('click', () => {
            termsCheckbox.checked = true;
            closeModal();
        });
    }

    // Close modal if user clicks outside on the background layout mask frame
    if (termsModal) {
        termsModal.addEventListener('click', (e) => {
            if (e.target === termsModal) closeModal();
        });
    }

    // --- 4. BACKEND INTEGRATION ROUTING PIPELINE ---
    if (!registerForm) return;

    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Structural defensive verification checks
        const username = usernameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!username || !email || !password) {
            alert("Please accurately fill all account validation fields.");
            return;
        }

        if (password.length < 4) {
            alert("Security Risk: Inbound password choice must be at least 4 characters.");
            return;
        }

        if (!termsCheckbox.checked) {
            alert("You must review and accept the Terms of Service to establish a profile channel.");
            return;
        }

        // Trigger loading state layout animations on our submit element button
        const originalButtonHTML = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i> Initializing Sanctuary...`;

        try {
            // Deliver JSON payload structure directly over your local port 8081 mapping
            const response = await fetch('http://localhost:8081/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });

            const textData = await response.text();
            let parsedData;
            try {
                parsedData = JSON.parse(textData);
            } catch (e) {
                parsedData = textData;
            }

            if (response.ok) {
                // Initialize core tracking indicators inside local session cache scopes
                localStorage.setItem('cinekeep_auth_token', parsedData.token);
                localStorage.setItem('cinekeep_user_name', parsedData.username);
                localStorage.setItem('cinekeep_local_favs', JSON.stringify([]));
                localStorage.setItem('cinekeep_local_watchlist', JSON.stringify([]));

                alert(`Welcome to CineKeep, ${parsedData.username}! Your sanctuary is ready.`);
                window.location.href = 'dashboard.html';
            } else {
                const errorMessage = (typeof parsedData === 'object' && parsedData.message) ? parsedData.message : parsedData;
                alert(`Registration Declined: ${errorMessage || "Invalid parameters setup."}`);
            }

        } catch (error) {
            console.error("Critical communication failure on registration runtime handler:", error);
            alert("Network Error: Core security hub server unreachable. Ensure your Spring Boot application is alive on port 8081.");
        } finally {
            // Reset button tracking status fields back to baseline operational structures
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonHTML;
        }
    });
});