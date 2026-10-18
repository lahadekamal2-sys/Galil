function parId(id) {
    return document.getElementById(id);
}

const salutation = parId('salutation');
const heureActuelle = new Date().getHours();

salutation.textContent = (heureActuelle >= 5 && heureActuelle < 18)
    ? 'Bonjour, visiteur !'
    : 'Bonsoir, visiteur !';

const sousTitre = parId('sous-titre');
const texteComplet = sousTitre.textContent.trim();
const VITESSE = 45;
let position = 0;

function ecrireLettre() {
    if (position < texteComplet.length) {
        position++;
        sousTitre.textContent = texteComplet.slice(0, position);
        setTimeout(ecrireLettre, VITESSE);
    }
}

sousTitre.textContent = '';
setTimeout(ecrireLettre, 300);

const sections = document.querySelectorAll('section');
const liensNav = document.querySelectorAll('.nav-header nav a');
const liensNavParId = {};

document.body.classList.add('js-actif');

liensNav.forEach(function (lien) {
    const cible = lien.getAttribute('href');
    if (cible && cible.startsWith('#')) {
        liensNavParId[cible.slice(1)] = lien;
    }
    lien.addEventListener('click', function () {
        liensNav.forEach(function (l) { l.classList.remove('actif'); });
        lien.classList.add('actif');
    });
});

function mettreAJourAuScroll() {
    const h = window.innerHeight;
    sections.forEach(function (section) {
        const rect = section.getBoundingClientRect();
        if (rect.top < h * 0.85) {
            section.classList.add('visible');
        }
        const lien = liensNavParId[section.id];
        if (lien) {
            const actif = rect.top < h * 0.5 && rect.bottom > h * 0.3;
            lien.classList.toggle('actif', actif);
        }
    });
}

window.addEventListener('scroll', mettreAJourAuScroll, { passive: true });
mettreAJourAuScroll();

const boutonTheme = parId('bouton-theme');
const CLE_THEME = 'portfolio-theme';

function lireTheme() {
    try { return localStorage.getItem(CLE_THEME); } catch (e) { return null; }
}

function sauverTheme(valeur) {
    try {
        localStorage.setItem(CLE_THEME, valeur);
    } catch {}
}

if (lireTheme() === 'clair') {
    document.body.classList.add('theme-clair');
    boutonTheme.textContent = '🌙';
} else {
    boutonTheme.textContent = '☀️';
}

boutonTheme.addEventListener('click', function () {
    const clair = document.body.classList.toggle('theme-clair');
    boutonTheme.textContent = clair ? '🌙' : '☀️';
    sauverTheme(clair ? 'clair' : 'sombre');
});

const formulaire = document.querySelector('.formulaire');
const statutForm = parId('statut-form');

function afficherStatut(texte, ok) {
    statutForm.textContent = texte;
    statutForm.className = 'statut-form ' + (ok === null ? '' : (ok ? 'ok' : 'erreur'));
}

if (formulaire && statutForm) {
    formulaire.addEventListener('submit', function (e) {
        e.preventDefault();
        const bouton = formulaire.querySelector('button[type="submit"]');
        bouton.disabled = true;
        afficherStatut('Envoi en cours…', null);

        fetch(formulaire.action, {
            method: 'POST',
            body: new FormData(formulaire),
            headers: { 'Accept': 'application/json' }
        })
            .then(function (reponse) {
                return reponse.json()
                    .catch(function () { return {}; })
                    .then(function (data) {
                        if (reponse.ok) {
                            formulaire.reset();
                            afficherStatut('✓ Message envoyé, merci !', true);
                        } else {
                            const erreurs = (data && data.errors) ? data.errors : [];
                            const detail = erreurs.length
                                ? erreurs.map(function (er) { return er.message; }).join(' ')
                                : 'erreur ' + reponse.status;
                            afficherStatut('Échec de l\'envoi : ' + detail, false);
                        }
                    });
            })
            .catch(function () {
                afficherStatut('Serveur injoignable. Vérifie ta connexion ou réessaie plus tard.', false);
            })
            .finally(function () {
                bouton.disabled = false;
            });
    });
}

const projetsTitre = parId('titre-projets');

if (projetsTitre) {
    let nbPoints = 0;
    setInterval(function () {
        nbPoints = (nbPoints % 3) + 1;
        projetsTitre.textContent = 'SOON' + '.'.repeat(nbPoints);
    }, 600);
}

const titreOriginal = document.title;

document.addEventListener('visibilitychange', function () {
    document.title = document.hidden ? 'Thanks !' : titreOriginal;
});

parId('annee').textContent = new Date().getFullYear();
