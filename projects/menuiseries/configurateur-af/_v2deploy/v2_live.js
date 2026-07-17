/* v2_live.js — catalogue réaliste complet : portes + portails + fenêtres, palette 20 RAL.
   Branché sur __MANIFEST__ + __FAISABILITE__ + __PALETTE_20__ (faisabilite_data.js). */
(function(){
  var MAN = window.__MANIFEST__ || [];
  var FAISAB = window.__FAISABILITE__ || {};
  var PAL20 = window.__PALETTE_20__ || null;

  if(!MAN.length){ console.warn("v2_live: manifest vide"); return; }

  // Palette 20 couleurs depuis faisabilite_data.js si disponible, sinon fallback
  var OURCOL = PAL20 || [
    {code:"",         nom:"Anthracite (origine)", hex:"#30363b"},
    {code:"RAL_9016", nom:"Blanc 9016",           hex:"#e9ebe9"},
    {code:"RAL_7016", nom:"Gris anthracite 7016", hex:"#2e3b40"},
    {code:"RAL_9005", nom:"Noir profond 9005",    hex:"#0a0a0a"},
    {code:"RAL_3004", nom:"Rouge pourpre 3004",   hex:"#651f22"},
    {code:"RAL_5011", nom:"Bleu acier 5011",      hex:"#1a2b3c"},
    {code:"RAL_5010", nom:"Bleu gentiane 5010",   hex:"#1a3a5c"},
    {code:"RAL_5003", nom:"Bleu saphir 5003",     hex:"#1f2d42"},
    {code:"RAL_6009", nom:"Vert sapin 6009",      hex:"#1c3327"},
    {code:"RAL_6005", nom:"Vert mousse 6005",     hex:"#23402d"},
    {code:"RAL_1015", nom:"Sable 1015",           hex:"#c9b99a"},
    {code:"RAL_7039", nom:"Gris quartz 7039",     hex:"#6c6960"},
    {code:"RAL_7035", nom:"Gris clair 7035",      hex:"#c5c5bf"},
    {code:"RAL_1013", nom:"Blanc perlé 1013",     hex:"#e3ddd2"},
    {code:"RAL_7040", nom:"Gris fenêtre 7040",    hex:"#9da6ad"},
    {code:"RAL_6021", nom:"Vert pâle 6021",       hex:"#8aac86"},
    {code:"RAL_5014", nom:"Bleu pigeon 5014",     hex:"#6a7fa3"},
    {code:"RAL_8017", nom:"Brun chocolat 8017",   hex:"#3b2219"},
    {code:"RAL_8014", nom:"Brun sépia 8014",      hex:"#4a3020"},
    {code:"RAL_8004", nom:"Brun cuivre 8004",     hex:"#7d3f2d"},
    {code:"AF_2900_SABLE", nom:"Sable A&F 2900",  hex:"#c8b49a"}
  ];

  // Index faisabilité par pid/code pour affichage dimensions
  var faisabIndex = {};
  if(FAISAB.portes && FAISAB.portes.models){
    FAISAB.portes.models.forEach(function(m){ if(m.pid) faisabIndex[m.pid]=m; });
  }
  if(FAISAB.portails && FAISAB.portails.models){
    FAISAB.portails.models.forEach(function(m){
      var k = m.pid || ('portail-'+m.code);
      faisabIndex[k]=m;
    });
  }
  if(FAISAB.fenetres && FAISAB.fenetres.models){
    FAISAB.fenetres.models.forEach(function(m){
      faisabIndex['fenetre-'+m.code]=m;
    });
  }

  var OURMODELS = MAN.map(function(m){
    return {product_id:m.pid, nom:m.nom, gamme:m.gamme, famille:m.type, reel:true, _img:m.img};
  });
  var OURCOLORS = OURCOL.map(function(c){ return {code:c.code, nom:c.nom, hex:c.hex}; });
  var byId = {}; MAN.forEach(function(m){ byId[m.pid]=m; });

  // Grille avec images directes (sans passer par l'API thumb/)
  function ourGrid(ms){
    var grid=document.querySelector("#model-grid"); if(!grid) return;
    var cur=document.querySelector("#model").value;
    grid.innerHTML = ms.map(function(m){
      return '<div class="mcell'+(m.product_id===cur?' on':'')+'" data-pid="'+m.product_id+'" title="'+m.nom+'">'
           + '<img loading="lazy" src="'+m._img+'" onerror="this.style.opacity=.25">'
           + '<span class="bdg reel" title="Photo produit réelle">📷</span>'
           + '<div class="nm">'+m.nom+'</div></div>';
    }).join("");
    grid.querySelectorAll(".mcell").forEach(function(c){
      c.addEventListener("click",function(){ selectModel(c.dataset.pid); });
    });
  }

  function liveShow(){
    var msel=document.querySelector("#model"); if(!msel) return;
    var pid=msel.value; if(!pid||!byId[pid]) return;
    var code=(document.querySelector("#color")||{}).value||"";
    // Fenêtres : pas encore de recolor, montrer l'anthracite paire
    var entry=byId[pid];
    var url;
    if(code && entry.type!=="fenetre"){
      url = "catalogue/recolor/"+pid+"__"+code+".jpg";
    } else {
      url = entry.img;
    }
    var r=document.querySelector("#result"), e=document.querySelector("#empty");
    if(e) e.classList.add("hide");
    if(r){ r.classList.remove("hide"); r.src=url; }
    showFaisabiliteHint(pid);
  }

  // Affiche les infos faisabilité sous la grille modèle
  function showFaisabiliteHint(pid){
    var h=document.querySelector("#model-hint"); if(!h) return;
    var f=faisabIndex[pid];
    if(!f){ h.innerHTML='<span style="color:var(--txt-3)">📷 Photo produit réelle</span>'; return; }
    var parts=[];
    if(f.materiaux) parts.push('Matériaux : '+f.materiaux.join(', '));
    if(f.materiau) parts.push('Matériau : '+f.materiau);
    if(f.dimensions){ var d=f.dimensions; parts.push('Dim. : L'+d.larg_min+'–'+d.larg_max+' × H'+d.haut_min+'–'+d.haut_max+' mm'); }
    if(f.couleurs_disponibles) parts.push(f.couleurs_disponibles+' coloris');
    if(f.options_disponibles && f.options_disponibles.length) parts.push('Options : '+f.options_disponibles.slice(0,3).join(', '));
    if(parts.length){
      h.innerHTML='<span style="color:var(--af-vert)">📷 Photo produit réelle</span>'
                 +'<br><span style="color:var(--txt-3);font-size:11px">'+parts.join(' · ')+'</span>';
    } else {
      h.innerHTML='<span style="color:var(--af-vert)">📷 Photo produit réelle</span>';
    }
  }

  // Ajoute le bouton Fenêtres dans le toggle famille si absent
  function ensureFenetreButton(){
    var fam=document.querySelector("#famille"); if(!fam) return;
    if(fam.querySelector('[data-fam="fenetre"]')) return;
    var btn=document.createElement("button");
    btn.dataset.fam="fenetre"; btn.textContent="Fenêtres";
    fam.appendChild(btn);
    btn.addEventListener("click",function(){
      document.querySelectorAll("#famille button").forEach(function(x){x.classList.remove("on");});
      btn.classList.add("on"); FAM="fenetre";
      var larg=document.querySelector("#larg"), haut=document.querySelector("#haut");
      if(larg) larg.value="1200"; if(haut) haut.value="1350";
      var portailOpts=document.querySelector("#portail-opts"), porteOpts=document.querySelector("#porte-opts");
      if(portailOpts) portailOpts.classList.add("hide");
      if(porteOpts) porteOpts.classList.add("hide");
      fillGammes();
    });
  }

  function enforce(){ MODELES=OURMODELS; COULEURS=OURCOLORS; renderModelGrid=ourGrid; }

  var hooked=false, tries=0;
  (function wait(){
    if(typeof fillGammes==="function" && typeof MODELES!=="undefined" && document.querySelector("#model-grid")){
      var orig=fillGammes;
      fillGammes=function(){ enforce(); return orig.apply(this,arguments); };
      enforce();
      ensureFenetreButton();
      if(!hooked){ hooked=true;
        document.querySelector("#model").addEventListener("change", function(){ setTimeout(liveShow,0); });
        document.querySelector("#color-sw").addEventListener("click", function(){ setTimeout(liveShow,0); });
        var cs=document.querySelector("#color"); if(cs) cs.addEventListener("change", function(){ setTimeout(liveShow,0); });
      }
      fillGammes();
      if(typeof renderColorSwatches==="function") renderColorSwatches();
      setTimeout(liveShow,200);
      console.log("v2_live: "+OURMODELS.length+" modèles ("+OURMODELS.filter(function(m){return m.famille==="portail";}).length+" portails, "+OURMODELS.filter(function(m){return m.famille==="fenetre";}).length+" fenêtres) · palette "+OURCOL.length+" coloris");
    } else if(tries++<80){ setTimeout(wait,100); }
  })();
})();
