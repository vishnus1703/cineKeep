/* ==========================================================================
   CINEKEEP FULL-STACK PREMIUM LOGIN LOGIC SESSION CONTROLLER
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    if (!loginForm) {
        console.warn("Login form wrapper node missing from current viewport context layout.");
        return;
    }

    // --- 1. PASSWORD INTERACTIVE EYE TOGGLE CONTROLLER ---
    const togglePasswordBtn = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password'); // Targets your layout's id="password"
    const eyeIcon = document.getElementById('eyeIcon');

    if (togglePasswordBtn && passwordInput && eyeIcon) {
        togglePasswordBtn.addEventListener('click', () => {
            const isPassword = passwordInput.getAttribute('type') === 'password';
            passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
            
            // Adjust vector class styles dynamically for an active glow accent
            eyeIcon.className = isPassword 
                ? "fa-regular fa-eye-slash text-lg text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.4)]" 
                : "fa-regular fa-eye text-lg text-slate-500 hover:text-slate-300";
        });
    }

    // --- 2. BACKEND AUTHENTICATION API CONNECTION HANDSHAKE ---
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Targets the inputs exactly as configured inside your premium login.html
        const emailInput = document.getElementById('email'); 
        const submitButton = loginForm.querySelector('button[type="submit"]');

        const inputIdentifier = emailInput ? emailInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value : '';

        // --- Core Validation Gates ---
        if (!inputIdentifier || !password) {
            alert("Please input valid tracking credentials to unlock session clearance vectors.");
            return;
        }

        // --- Dynamic Button Micro-Interaction Triggers ---
        const originalButtonHTML = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i> Authorizing Session...`;

        try {
            // Forward credentials payload packet downstream to your LoginRequest Record map
            // CRITICAL SYNC: We pass inputIdentifier as "username" to satisfy the Spring Boot constraints!
            const response = await fetch('http://localhost:8081/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    username: inputIdentifier,
                    password: password
                })
            });

            const textData = await response.text();
            let authData;
            try {
                authData = JSON.parse(textData);
            } catch (e) {
                authData = textData;
            }

            if (response.ok) {
                // 1. Commit primary identity verification token streams to browser storage maps
                localStorage.setItem('cinekeep_auth_token', authData.token);
                localStorage.setItem('cinekeep_user_name', authData.username);

                // 2. Query your new MediaController data engine to pull down saved lists
                try {
                    const collectionResponse = await fetch('http://localhost:8081/api/media/user-data', {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${authData.token}`
                        }
                    });

                    if (collectionResponse.ok) {
                        const userData = await collectionResponse.json();
                        // Sync existing movie IDs down to your dashboard tracking arrays
                        localStorage.setItem('cinekeep_local_favs', JSON.stringify(userData.favorites || []));
                        localStorage.setItem('cinekeep_local_watchlist', JSON.stringify(userData.watchlist || []));
                    }
                } catch (collectionError) {
                    console.error("Failed to run collection pre-sync routine wrapper:", collectionError);
                    // Fallback baseline initialization so dashboard view doesn't crash on empty queries
                    localStorage.setItem('cinekeep_local_favs', JSON.stringify([]));
                    localStorage.setItem('cinekeep_local_watchlist', JSON.stringify([]));
                }

                // Push authenticated explorer into the updated dashboard system loop layout frame
                window.location.href = 'dashboard.html';
            } else {
                // Catch 401 Unauthorized exceptions fired from authenticateUser() logic loops
                alert(`Access Denied: ${authData || "Invalid security signature credentials verified."}`);
                if (passwordInput) {
                    passwordInput.value = ''; // Safely clear out bad passwords
                    passwordInput.focus();
                }
            }

        } catch (error) {
            console.error("Critical communication failure on validation channel routing:", error);
            alert("Network Error: Verification system hub unreachable. Check terminal logs on your Spring Boot environment configuration.");
        } finally {
            // --- Reset Button Interactivity State ---
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonHTML;
            }
        }
    });
});