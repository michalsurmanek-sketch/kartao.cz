// Demo Authentication System
class DemoAuth {
    constructor() {
        this.currentUser = null;
        this.initialize();
    }

    initialize() {
        // Check for stored demo user
        const storedUser = localStorage.getItem('demoUser');
        const storedRole = localStorage.getItem('userRole');
        
        if (storedUser && storedRole) {
            this.currentUser = {
                ...JSON.parse(storedUser),
                role: storedRole
            };
            this.updateUI();
        }
    }

    isLoggedIn() {
        return this.currentUser !== null;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    getUserRole() {
        return this.currentUser?.role || null;
    }

    updateUI() {
        // Update desktop auth section
        const desktopNotLoggedIn = document.getElementById('desktop-not-logged-in');
        const desktopLoggedIn = document.getElementById('desktop-logged-in');
        const desktopUserName = document.getElementById('desktop-user-name');
        const desktopUserEmail = document.getElementById('desktop-user-email');

        if (this.isLoggedIn()) {
            if (desktopNotLoggedIn) desktopNotLoggedIn.classList.add('hidden');
            if (desktopLoggedIn) desktopLoggedIn.classList.remove('hidden');
            if (desktopUserName) desktopUserName.textContent = this.currentUser.displayName;
            if (desktopUserEmail) desktopUserEmail.textContent = this.currentUser.email;
        } else {
            if (desktopNotLoggedIn) desktopNotLoggedIn.classList.remove('hidden');
            if (desktopLoggedIn) desktopLoggedIn.classList.add('hidden');
        }

        // Update mobile menu if exists
        this.updateMobileMenu();
        
        // Update role-specific elements
        this.updateRoleElements();
    }

    updateMobileMenu() {
        // Hide/show mobile menu items based on auth state
        const loginLink = document.querySelector('a[href="login.html"]');
        const accountLink = document.querySelector('a[href="kartao-muj-ucet.html"]');
        
        if (this.isLoggedIn()) {
            if (loginLink) {
                loginLink.textContent = `${this.currentUser.displayName} (${this.getUserRole() === 'tvurce' ? 'Tvůrce' : 'Firma'})`;
                loginLink.href = '#';
                loginLink.onclick = () => this.logout();
            }
        }
    }

    updateRoleElements() {
        // Show/hide elements based on user role
        const role = this.getUserRole();
        
        // Update dashboard links visibility
        if (role === 'tvurce') {
            // Show creator-specific features
            this.showCreatorFeatures();
        } else if (role === 'firma') {
            // Show company-specific features  
            this.showCompanyFeatures();
        }
    }

    showCreatorFeatures() {
        // Add creator-specific styling or functionality
        console.log('👤 Zobrazuji funkce pro tvůrce');
    }

    showCompanyFeatures() {
        // Add company-specific styling or functionality
        console.log('🏢 Zobrazuji funkce pro firmu');
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('demoUser');
        localStorage.removeItem('userRole');
        this.updateUI();
        
        // Redirect to home or show toast
        window.location.href = 'index.html';
    }

    // Simulate different login states for testing
    simulateLogin(userType = 'creator') {
        if (userType === 'creator') {
            this.currentUser = {
                uid: 'demo_creator_1',
                email: 'anna.lifestyle@demo.cz',
                displayName: 'Anna Lifestyle',
                role: 'tvurce'
            };
        } else {
            this.currentUser = {
                uid: 'demo_company_1', 
                email: 'marketing@technovation.cz',
                displayName: 'TechNovation s.r.o.',
                role: 'firma'
            };
        }
        
        localStorage.setItem('demoUser', JSON.stringify(this.currentUser));
        localStorage.setItem('userRole', this.currentUser.role);
        this.updateUI();
    }
}

// Initialize demo auth when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (typeof window.demoAuth === 'undefined') {
        window.demoAuth = new DemoAuth();
        
        // Setup logout button if exists
        const logoutBtn = document.getElementById('desktop-logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                window.demoAuth.logout();
            });
        }
    }
});

// Global export
window.DemoAuth = DemoAuth;