/* v2_live.js — catalogue + faisabilité réelle par modèle (vitrages, poignées, options). */
(function(){
  var MAN    = window.__MANIFEST__    || [];
  var FAISAB = window.__FAISABILITE__ || {};
  var PAL20  = window.__PALETTE_20__  || null;

  if(!MAN.length){ console.warn("v2_live: manifest vide"); return; }

  // --- PALETTE ---
  var OURCOL = PAL20 || [
    {code:"",            nom:"Anthracite (origine)", hex:"#30363b"},
    {code:"RAL_9016",    nom:"Blanc 9016",           hex:"#e9ebe9"},
    {code:"RAL_7016",    nom:"Gris anthracite 7016", hex:"#2e3b40"},
    {code:"RAL_9005",    nom:"Noir profond 9005",    hex:"#0a0a0a"},
    {code:"RAL_3004",    nom:"Rouge pourpre 3004",   hex:"#651f22"},
    {code:"RAL_5011",    nom:"Bleu acier 5011",      hex:"#1a2b3c"},
    {code:"RAL_5010",    nom:"Bleu gentiane 5010",   hex:"#1a3a5c"},
    {code:"RAL_5003",    nom:"Bleu saphir 5003",     hex:"#1f2d42"},
    {code:"RAL_6009",    nom:"Vert sapin 6009",      hex:"#1c3327"},
    {code:"RAL_6005",    nom:"Vert mousse 6005",     hex:"#23402d"},
    {code:"RAL_1015",    nom:"Sable 1015",           hex:"#c9b99a"},
    {code:"RAL_7039",    nom:"Gris quartz 7039",     hex:"#6c6960"},
    {code:"RAL_7035",    nom:"Gris clair 7035",      hex:"#c5c5bf"},
    {code:"RAL_1013",    nom:"Blanc perlé 1013",     hex:"#e3ddd2"},
    {code:"RAL_7040",    nom:"Gris fenêtre 7040",    hex:"#9da6ad"},
    {code:"RAL_6021",    nom:"Vert pâle 6021",       hex:"#8aac86"},
    {code:"RAL_5014",    nom:"Bleu pigeon 5014",     hex:"#6a7fa3"},
    {code:"RAL_8017",    nom:"Brun chocolat 8017",   hex:"#3b2219"},
    {code:"RAL_8014",    nom:"Brun sépia 8014",      hex:"#4a3020"},
    {code:"RAL_8004",    nom:"Brun cuivre 8004",     hex:"#7d3f2d"},
    {code:"AF_2900_SABLE",nom:"Sable A&F 2900",     hex:"#c8b49a"}
  ];

  // --- INDEX FAISABILITÉ (structure correcte) ---
  // portes  : FAISAB.portes.gammes[].produits[].code + gamme slug
  // portails: FAISAB.portails.produits[].code
  var _porteGC = {};  // "cadre-noir/lumio" → produit
  var _porteCd = {};  // "lumio" → produit (fallback sans gamme)
  var _portailCd = {};// "adelaide" → produit

  if(FAISAB.portes && FAISAB.portes.gammes){
    FAISAB.portes.gammes.forEach(function(g){
      g.produits.forEach(function(p){
        _porteGC[g.slug+'/'+p.code] = p;
        if(!_porteCd[p.code]) _porteCd[p.code] = p;
      });
    });
  }
  if(FAISAB.portails && FAISAB.portails.produits){
    FAISAB.portails.produits.forEach(function(p){ _portailCd[p.code] = p; });
  }

  // Trouver l'entrée faisabilité depuis un pid manifest
  function findFaisab(pid){
    if(pid.startsWith('portail-')){
      return _portailCd[pid.slice(8)] || null;
    }
    if(pid.startsWith('porte-')){
      var rest = pid.slice(6);
      var parts = rest.split('-');
      for(var i=1; i<parts.length; i++){
        var key = parts.slice(0,i).join('-')+'/'+parts.slice(i).join('-');
        if(_porteGC[key]) return _porteGC[key];
      }
      // Repli : correspondance sur le code seul (suffixe)
      for(var n=parts.length-1; n>=1; n--){
        var cd = parts.slice(n).join('-');
        if(_porteCd[cd]) return _porteCd[cd];
      }
    }
    return null;
  }

  // --- LABELS LISIBLES POUR LES CODES TECHNIQUES ---
  var _VIT = {
    "delta-mat":"Delta Mat (bronze foncé)", "depoli":"Dépoli", "noir":"Vitrage noir",
    "FO41":"FO41 — clair bronze", "FO98":"FO98 — foncé bronze", "L062":"L062 — blanc laiteux",
    "clair":"Clair", "satine":"Satiné", "poli":"Poli", "transparent":"Transparent"
  };
  var _POI = {
    "linear-noire-carree":"Linear noire carrée", "linear-noire-ronde":"Linear noire ronde",
    "linear-inox-carree":"Linear inox carrée",   "linear-inox-ronde":"Linear inox ronde",
    "chop-noire-carree":"Chop noire carrée",     "chop-noire-ronde":"Chop noire ronde",
    "chop-inox-carree":"Chop inox carrée",       "chop-inox-ronde":"Chop inox ronde",
    "fold-inox-carree":"Fold inox carrée",       "fold-inox-ronde":"Fold inox ronde",
    "fold-noire-carree":"Fold noire carrée",     "fold-noire-ronde":"Fold noire ronde",
    "cuir-noir":"Cuir noir", "barre-inox":"Barre inox", "Poignée Alu":"Poignée Alu"
  };
  function lbl(v, dict){ return dict[v] || (v.charAt(0).toUpperCase()+v.slice(1)); }

  // Peupler un <select> depuis un tableau de codes
  function fillSel2(selId, values, defaultLabel, dict){
    var sel = document.querySelector(selId); if(!sel) return;
    var html = '<option value="">'+defaultLabel+'</option>';
    values.forEach(function(v){
      var lab = lbl(v, dict||{});
      html += '<option value="'+lab+'">'+lab+'</option>';
    });
    sel.innerHTML = html;
  }

  // Agréger les options sur tous les matériaux d'une porte
  function agg(produit){
    var v={}, p={}, ins={}, bar={};
    (produit.materiaux||[]).forEach(function(m){
      var o = m.options||{};
      (o.vitrage||[]).forEach(function(x){v[x]=1;});
      (o.poignee||[]).forEach(function(x){p[x]=1;});
      ((o.insert||[]).concat(o['insert-interieur']||[])).forEach(function(x){ins[x]=1;});
      (o['barre-de-tirage']||[]).forEach(function(x){bar[x]=1;});
    });
    return {v:Object.keys(v), p:Object.keys(p), ins:Object.keys(ins), bar:Object.keys(bar)};
  }

  // Mettre à jour les selects vitrage/poignée + le hint d'options supplémentaires
  function updateOptionsUI(pid){
    var f = findFaisab(pid);
    var isPortail = pid.startsWith('portail-');

    if(isPortail){
      var poignees = (f && f.options && f.options.poignees) || [];
      fillSel2('#handle', poignees, 'Selon modèle', _POI);
      var gsel = document.querySelector('#glaz');
      if(gsel) gsel.innerHTML = '<option value="">Sans objet (portail)</option>';
      _updateExtraHint(null, null);
      return;
    }

    if(!f || !f.materiaux){
      // Pas de faisabilité connue → options génériques
      fillSel2('#glaz',   ['Vitrage dépoli','Vitrage clair','Sans vitrage'], 'Selon modèle', {});
      fillSel2('#handle', ['Barre inox','Béquille noire','Poignée design'],  'Selon modèle', {});
      _updateExtraHint(null, null);
      return;
    }

    var o = agg(f);

    if(o.v.length)  fillSel2('#glaz',   o.v, 'Selon modèle', _VIT);
    else { var gs=document.querySelector('#glaz'); if(gs) gs.innerHTML='<option value="">Sans vitrage</option>'; }

    if(o.p.length)  fillSel2('#handle', o.p, 'Selon modèle', _POI);
    else { var hs=document.querySelector('#handle'); if(hs) hs.innerHTML='<option value="">Selon modèle</option>'; }

    _updateExtraHint(o.ins, o.bar);

    // Dimensions par défaut du 1er matériau
    var m0 = f.materiaux[0];
    if(m0){
      var larg=document.querySelector('#larg'), haut=document.querySelector('#haut');
      if(larg && !larg.dataset.userEdited) larg.value = m0.largeur_min || 900;
      if(haut && !haut.dataset.userEdited) haut.value = m0.hauteur_min || 2150;
    }

    // Infos faisabilité sous la grille
    _updateModelHint(pid, f);
  }

  // Hint options supplémentaires (inserts, barres de tirage)
  function _updateExtraHint(inserts, barres){
    var el = document.querySelector('#faisab-extra');
    if(!el){
      var anchor = document.querySelector('#p-insert') || document.querySelector('#porte-opts');
      if(!anchor) return;
      el = document.createElement('div');
      el.id = 'faisab-extra';
      el.style.cssText = 'font-size:11px;color:var(--txt-3);margin-top:8px;line-height:1.8;padding:8px 10px;background:var(--af-charbon-3);border-radius:8px;border:1px solid rgba(255,255,255,.08)';
      anchor.parentNode.insertBefore(el, anchor.nextSibling);
    }
    if(!inserts && !barres){ el.style.display='none'; el.innerHTML=''; return; }
    var parts = [];
    var nonNul = function(arr){ return arr.filter(function(v){ return !/^(aucun|Aucun)$/.test(v); }); };
    var ins2 = nonNul(inserts||[]), bar2 = nonNul(barres||[]);
    if(ins2.length)  parts.push('<b style="color:var(--txt-2)">Inserts :</b> '+ins2.map(function(v){return lbl(v,{});}).join(' · '));
    if(bar2.length)  parts.push('<b style="color:var(--txt-2)">Barres de tirage :</b> '+bar2.map(function(v){return lbl(v,{});}).join(' · '));
    if(parts.length){ el.innerHTML=parts.join('<br>'); el.style.display='block'; }
    else { el.style.display='none'; el.innerHTML=''; }
  }

  function _updateModelHint(pid, f){
    var h = document.querySelector('#model-hint'); if(!h) return;
    var mat0 = f && f.materiaux && f.materiaux[0];
    var parts = [];
    if(mat0){
      parts.push('L '+mat0.largeur_min+'–'+mat0.largeur_max+' mm');
      parts.push('H '+mat0.hauteur_min+'–'+mat0.hauteur_max+' mm');
      if(f.materiaux.length>1) parts.push(f.materiaux.length+' matériaux');
    }
    var nCouleurs = f && f.couleurs_disponibles;
    if(nCouleurs) parts.push(nCouleurs+' coloris');
    h.innerHTML = '<span style="color:var(--af-vert)">📷 Photo produit réelle</span>'
                + (parts.length ? '<br><span style="color:var(--txt-3);font-size:11px">'+parts.join(' · ')+'</span>' : '');
  }

  // --- CATALOGUE MODÈLES & COULEURS ---
  var OURMODELS = MAN.map(function(m){
    return {product_id:m.pid, nom:m.nom, gamme:m.gamme, famille:m.type, reel:true, _img:m.img};
  });
  var OURCOLORS = OURCOL.map(function(c){ return {code:c.code, nom:c.nom, hex:c.hex}; });
  var byId = {}; MAN.forEach(function(m){ byId[m.pid]=m; });

  // Grille images directes (sans passer par /api/thumb/)
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

  // Tous les codes RAL déployés en recolor (20/20)
  var _RECOLOR_CODES = {
    "AF_2900_SABLE":1,"RAL_1013":1,"RAL_1015":1,"RAL_3004":1,"RAL_5003":1,
    "RAL_5010":1,"RAL_5011":1,"RAL_5014":1,"RAL_6005":1,"RAL_6009":1,
    "RAL_6021":1,"RAL_7016":1,"RAL_7035":1,"RAL_7039":1,"RAL_7040":1,
    "RAL_8004":1,"RAL_8014":1,"RAL_8017":1,"RAL_9005":1,"RAL_9016":1
  };

  // Afficher l'image recolorée dès que modèle ou couleur change
  function liveShow(){
    var msel=document.querySelector("#model"); if(!msel) return;
    var pid=msel.value; if(!pid||!byId[pid]) return;
    var code=(document.querySelector("#color")||{}).value||"";
    var entry=byId[pid];
    var fallback=entry.img;
    var url;
    if(code && entry.type!=="fenetre" && _RECOLOR_CODES[code]){
      url = "catalogue/recolor/"+pid+"__"+code+".jpg";
    } else {
      url = fallback;
    }
    var r=document.querySelector("#result"), e=document.querySelector("#empty");
    if(e) e.classList.add("hide");
    if(r){
      r.classList.remove("hide");
      r.onerror = function(){ this.onerror=null; this.src=fallback; };
      r.src = url;
    }
    updateOptionsUI(pid);
    _syncSwatchAvailability(pid);
  }

  // Griser visuellement les swatches sans recolor pour ce modèle
  function _syncSwatchAvailability(pid){
    var isPortail = pid.startsWith('portail-');
    document.querySelectorAll("#color-sw .sw").forEach(function(s){
      var code = s.dataset.code;
      if(!code){ s.style.opacity=""; s.title=(s.dataset.nom||""); return; } // anthracite = toujours dispo
      var hasRecolor = !isPortail ? !!_RECOLOR_CODES[code] : !!_RECOLOR_CODES[code];
      s.style.opacity = hasRecolor ? "" : "0.35";
      s.title = (s.dataset.nom||code) + (hasRecolor ? "" : " (aperçu — recolor bientôt)");
    });
  }

  // Bouton Fenêtres
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
      var po=document.querySelector("#portail-opts"), pe=document.querySelector("#porte-opts");
      if(po) po.classList.add("hide"); if(pe) pe.classList.add("hide");
      fillGammes();
    });
  }

  // Marquer les champs dimensions comme édités manuellement (pour ne pas les écraser)
  function markUserEdit(){
    ['#larg','#haut'].forEach(function(id){
      var el=document.querySelector(id);
      if(el) el.addEventListener('input',function(){ el.dataset.userEdited='1'; }, {once:true});
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
      markUserEdit();
      if(!hooked){ hooked=true;
        var msel=document.querySelector("#model");
        if(msel) msel.addEventListener("change",function(){ setTimeout(liveShow,0); });
        var csw=document.querySelector("#color-sw");
        if(csw) csw.addEventListener("click",function(){ setTimeout(liveShow,0); });
        var csel=document.querySelector("#color");
        if(csel) csel.addEventListener("change",function(){ setTimeout(liveShow,0); });
      }
      fillGammes();
      if(typeof renderColorSwatches==="function") renderColorSwatches();
      setTimeout(liveShow,200);
      console.log("v2_live: "+OURMODELS.length+" modèles ("+OURMODELS.filter(function(m){return m.famille==="portail";}).length+" portails, "+OURMODELS.filter(function(m){return m.famille==="fenetre";}).length+" fenêtres) · palette "+OURCOL.length+" coloris · faisabilité OK");
    } else if(tries++<80){ setTimeout(wait,100); }
  })();
})();
