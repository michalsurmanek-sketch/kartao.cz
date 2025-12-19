// ==========================================
// SUPABASE INIT – Kartao.cz
// ==========================================

(async function () {
  console.log("⏳ Čekám na Supabase SDK...");

  // 1) čekání na SDK
  let attempts = 0;
  while (!window.supabase && attempts < 200) {
    await new Promise(r => setTimeout(r, 50));
    attempts++;
  }

  if (!window.supabase) {
    console.error("❌ Supabase SDK se nepodařilo načíst (10s).");
    console.error("window.supabase:", window.supabase);
    return;
  }

  // 2) čekání na config (POUZE window.supabaseConfig)
  console.log("✅ Supabase SDK loaded, čekám na config...");
  attempts = 0;
  while (!window.supabaseConfig && attempts < 200) {
    await new Promise(r => setTimeout(r, 50));
    attempts++;
  }

  if (!window.supabaseConfig) {
    console.error("❌ window.supabaseConfig není dostupný! (supabase-config.js asi není v globálu)");
    console.error("TIP: v supabase-config.js použij window.supabaseConfig = {...}");
    return;
  }

  // 3) createClient – robustní získání
  const createClient =
    window.supabase?.createClient ||
    window.supabase?.default?.createClient;

  if (typeof createClient !== "function") {
    console.error("❌ createClient není funkce – špatný build/verze SDK.");
    console.error("window.supabase:", window.supabase);
    return;
  }

  try {
    window.supabaseClient = createClient(
      window.supabaseConfig.url,
      window.supabaseConfig.anonKey
    );

    window.sb = window.supabaseClient;
    console.log("🚀 Supabase client inicializován:", window.supabaseConfig.url);

    // Test připojení (bez zbytečných false-positive)
    const { error, count } = await window.sb
      .from("creators")
      .select("*", { count: "exact", head: true });

    if (error) {
      console.warn("⚠️ Supabase test dotaz selhal:", error);
    } else {
      console.log("✅ Supabase připojeno, creators:", (count ?? 0), "záznamů");
    }

    window.dispatchEvent(new CustomEvent("supabase-initialized"));
  } catch (e) {
    console.error("❌ Supabase init crash:", e);
  }
})();
