// Kreditní systém – základní logika
class CreditsSystem {
    constructor() {
        this.db = firebase.firestore();
        this.auth = firebase.auth();
    }

    init() {
        this.auth.onAuthStateChanged((user) => {
            if (!user) {
                window.location.href = "login.html";
                return;
            }
            this.loadUserData(user.uid);
        });
    }

    async loadUserData(uid) {
        try {
            const userRef = this.db.collection("users").doc(uid);
            const userSnap = await userRef.get();

            let userData = userSnap.exists ? userSnap.data() : null;

            // Pokud uživatel nemá dokument → vytvoříme základ
            if (!userData) {
                userData = {
                    credits: 0,
                    level: 1,
                    xp: 0,
                    createdAt: Date.now()
                };
                await userRef.set(userData);
            }

            this.renderDashboard(userData);

        } catch (error) {
            console.error("Chyba při načítání uživatele:", error);
        }
    }

    renderDashboard(data) {
        const container = document.getElementById("recommendation-content");

        container.innerHTML = `
            <div class="space-y-10 py-10">

                <!-- Hlavní info panel -->
                <div class="text-center">
                    <h2 class="text-3xl font-bold mb-2">Tvé Kredity</h2>
                    <p class="text-sky-400 text-6xl font-bold">${data.credits}</p>
                    <p class="text-gray-400 mt-2">Aktuální stav účtu</p>
                </div>

                <!-- Level systém -->
                <div class="bg-white/5 rounded-2xl p-6 border border-white/10">
                    <h3 class="text-xl font-semibold mb-3">Level & XP</h3>

                    <p class="text-gray-300 mb-1">Level: <span class="text-sky-400">${data.level}</span></p>

                    <div class="w-full bg-gray-700 rounded-full h-3 overflow-hidden mb-1">
                        <div class="bg-sky-400 h-3" style="width: ${data.xp}%"></div>
                    </div>

                    <p class="text-gray-400 text-sm">XP: ${data.xp}/100</p>
                </div>

                <!-- Mise -->
                <div class="bg-white/5 rounded-2xl p-6 border border-white/10">
                    <h3 class="text-xl font-semibold mb-3">Dostupné Mise</h3>

                    <div class="space-y-3">

                        <!-- Ukázková mise 1 -->
                        <div class="flex items-center justify-between bg-white/5 px-4 py-3 rounded-xl border border-white/10">
                            <span>Podívej se na 3 kampaně</span>
                            <span class="text-sky-400 font-bold">+10</span>
                        </div>

                        <!-- Ukázková mise 2 -->
                        <div class="flex items-center justify-between bg-white/5 px-4 py-3 rounded-xl border border-white/10">
                            <span>Odpověz na nabídku</span>
                            <span class="text-sky-400 font-bold">+20</span>
                        </div>

                        <!-- Ukázková mise 3 -->
                        <div class="flex items-center justify-between bg-white/5 px-4 py-3 rounded-xl border border-white/10">
                            <span>Aktivita na webu 5 minut</span>
                            <span class="text-sky-400 font-bold">+5</span>
                        </div>

                    </div>
                </div>

            </div>
        `;
    }
}

// Spuštění systému po načtení stránky
document.addEventListener("DOMContentLoaded", () => {
    if (typeof firebase !== "undefined") {
        window.creditsSystem = new CreditsSystem();
        window.creditsSystem.init();
    } else {
        console.error("Firebase není načteno!");
    }
});
