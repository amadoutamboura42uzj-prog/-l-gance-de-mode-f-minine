// Configuration publique du projet Supabase. Une clé publishable peut être utilisée côté navigateur.
const SUPABASE_URL = "https://rogucyyhlhxmgqcxveix.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_H0-wG2BDnreaIAXgEvlEIQ_7QiaJoyW";
const WHATSAPP_NUMBER = "22665474185";
let supabaseClient = null;
let products = [];
let cart = [];

const money = value => new Intl.NumberFormat("fr-FR").format(Number(value || 0)) + " FCFA";
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

function initSupabase() {
  if (window.supabase && SUPABASE_PUBLISHABLE_KEY.startsWith("sb_publishable_")) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
    return true;
  }
  return false;
}
function showProducts(list, status) {
  const target = document.getElementById("products");
  document.getElementById("catalogue-status").textContent = status;
  if (!list.length) {
    target.innerHTML = '<div class="empty">Le catalogue est vide pour le moment. Ajoute les produits depuis l’administration ou contacte la boutique sur WhatsApp.</div>';
    return;
  }
  target.innerHTML = list.map(p => `<article class="product-card">
    <div class="product-image">${p.image_url ? `<img src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.remove()">` : "Bonnets en satin"}</div>
    <div class="product-info"><h3>${escapeHtml(p.name)}</h3><p>${escapeHtml(p.description || "Douceur et confort au quotidien.")}</p>
    <div class="price">${money(p.price_fcfa)}</div><button class="button" type="button" onclick="addToCart('${String(p.id).replace(/'/g,"")}')">Ajouter au panier</button></div>
  </article>`).join("");
}
async function loadProducts() {
  if (!initSupabase()) {
    products = [
      {id:"demo-1",name:"Bonnet satin classique",description:"Modèle doux pour accompagner ta routine capillaire.",price_fcfa:2500,image_url:""},
      {id:"demo-2",name:"Bonnet satin ajustable",description:"Un modèle confortable pour le quotidien.",price_fcfa:3000,image_url:""}
    ];
    showProducts(products, "Mode aperçu — connexion à finaliser");
    return;
  }
  const {data, error} = await supabaseClient.from("products").select("id,name,description,price_fcfa,image_url,active,sort_order").eq("active", true).order("sort_order", {ascending:true});
  if (error) {
    showProducts([], "Catalogue indisponible");
    document.getElementById("products").innerHTML = `<div class="empty">Impossible de charger les produits. Vérifie les règles d’accès (RLS) de la table products dans Supabase. Détail : ${escapeHtml(error.message)}</div>`;
    return;
  }
  products = data || [];
  showProducts(products, `${products.length} produit(s)`);
}
function addToCart(id) {
  const product = products.find(p => String(p.id) === String(id));
  if (!product) return;
  const found = cart.find(item => String(item.id) === String(id));
  if (found) found.quantity += 1;
  else cart.push({id:product.id,name:product.name,price:Number(product.price_fcfa),quantity:1});
  renderCart();
}
function removeFromCart(id) {
  const found = cart.find(item => String(item.id) === String(id));
  if (!found) return;
  if (found.quantity > 1) found.quantity -= 1;
  else cart = cart.filter(item => String(item.id) !== String(id));
  renderCart();
}
function renderCart() {
  const target = document.getElementById("cart-items");
  if (!cart.length) target.innerHTML = '<p class="muted">Ton panier est vide.</p>';
  else target.innerHTML = cart.map(item => `<div class="cart-line"><span>${escapeHtml(item.name)} × ${item.quantity}<br><b>${money(item.price*item.quantity)}</b></span><button type="button" aria-label="Retirer un article" onclick="removeFromCart('${String(item.id).replace(/'/g,"")}')">−</button></div>`).join("");
  document.getElementById("cart-total").textContent = money(cart.reduce((sum,item)=>sum+item.price*item.quantity,0));
}
document.getElementById("order-form").addEventListener("submit", async event => {
  event.preventDefault();
  if (!cart.length) { alert("Ajoute d’abord un produit au panier."); return; }
  const name = document.getElementById("customer-name").value.trim();
  const city = document.getElementById("customer-city").value.trim();
  const notes = document.getElementById("customer-notes").value.trim();
  if (!name || !city) { alert("Renseigne ton nom et ta ville/quartier."); return; }
  const total = cart.reduce((sum,item)=>sum+item.price*item.quantity,0);
  const lines = cart.map(item => `• ${item.name} × ${item.quantity} — ${money(item.price*item.quantity)}`).join("\n");
  const message = `Bonjour L’Élégance Féminine ! Je souhaite passer une commande :\n\n${lines}\n\nTotal estimé : ${money(total)}\nNom : ${name}\nVille/quartier : ${city}${notes ? `\nPrécisions : ${notes}` : ""}\n\nMerci de confirmer la disponibilité et le prix final.`;
  // WhatsApp est le canal de confirmation. Cette action ne crée pas de paiement en ligne.
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
});
document.getElementById("year").textContent = new Date().getFullYear();
loadProducts();
