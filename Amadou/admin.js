const SUPABASE_URL = "https://rogucyyhlhxmgqcxveix.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_H0-wG2BDnreaIAXgEvlEIQ_7QiaJoyW";
const statusBox = document.getElementById("admin-status");
const loginForm = document.getElementById("login-form");
const logoutButton = document.getElementById("logout");
const adminContent = document.getElementById("admin-content");
let client = null;
const safe = v => String(v ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money = v => new Intl.NumberFormat("fr-FR").format(Number(v||0))+" FCFA";
function showStatus(msg){statusBox.textContent=msg;}
async function checkAdmin(){
  const {data:{user}} = await client.auth.getUser();
  if(!user){showStatus("Connecte-toi avec ton compte administrateur."); loginForm.hidden=false; logoutButton.hidden=true; adminContent.hidden=true; return;}
  const {data,error} = await client.from("admins").select("user_id").eq("user_id",user.id).maybeSingle();
  if(error || !data){showStatus("Compte connecté, mais administrateur non confirmé. Vérifie la table admins et ses politiques RLS."); loginForm.hidden=true; logoutButton.hidden=false; adminContent.hidden=true; return;}
  showStatus("Accès administrateur confirmé.");
  loginForm.hidden=true; logoutButton.hidden=false; adminContent.hidden=false;
  const result = await client.from("products").select("name,price_fcfa,active").order("sort_order",{ascending:true});
  if(result.error) document.getElementById("admin-products").textContent="Lecture des produits refusée par les règles de sécurité : "+result.error.message;
  else document.getElementById("admin-products").innerHTML=(result.data||[]).map(p=>`<div class="cart-line"><span>${safe(p.name)}<br><small>${money(p.price_fcfa)} · ${p.active?"Actif":"Masqué"}</small></span></div>`).join("")||"Aucun produit.";
}
if(window.supabase && SUPABASE_PUBLISHABLE_KEY.startsWith("sb_publishable_")){
  client=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
  client.auth.onAuthStateChange(()=>{setTimeout(checkAdmin,0)});
  checkAdmin();
}else showStatus("Configuration incomplète : remplace la clé d’exemple dans assets/admin.js par ta clé sb_publishable.");
loginForm.addEventListener("submit",async e=>{e.preventDefault(); if(!client)return; showStatus("Connexion…"); const {error}=await client.auth.signInWithPassword({email:document.getElementById("email").value.trim(),password:document.getElementById("password").value}); if(error)showStatus("Connexion refusée : "+error.message); else await checkAdmin();});
logoutButton.addEventListener("click",async()=>{if(client)await client.auth.signOut();});
