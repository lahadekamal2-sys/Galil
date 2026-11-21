function parId(id) {
    return document.getElementById(id);
}

const reduireMouvement = typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const intersectionObserverDisponible = typeof window.IntersectionObserver === 'function';
const racine = document.documentElement;
const hero = document.querySelector('.hero');

const heureActuelle = new Date().getHours();
parId('salutation').textContent = (heureActuelle >= 5 && heureActuelle < 18)
    ? '// Bonjour, visiteur !'
    : '// Bonsoir, visiteur !';

const PROMPT = 'galil@portfolio:~$ ';
const scenario = [
    { cmd: 'whoami', sortie: ['galil, étudiant en L3, Linux et sécurité'] },
    { cmd: 'cat stack.txt', sortie: ['bash · linux · postgresql · git'] },
    { cmd: 'ls Projets/', sortie: ['projet.txt'] }
];

function pause(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
}

function creerLigne(parent, classe) {
    const ligne = document.createElement('div');
    if (classe) { ligne.className = classe; }
    parent.appendChild(ligne);
    return ligne;
}

function creerInvite(ligne) {
    const invite = document.createElement('span');
    invite.className = 'invite';
    invite.textContent = PROMPT;
    ligne.appendChild(invite);
    const texte = document.createElement('span');
    ligne.appendChild(texte);
    return texte;
}

async function lancerTerminal() {
    const terminal = parId('terminal');
    terminal.textContent = '';
    const curseur = document.createElement('span');
    curseur.className = 'curseur';

    for (const etape of scenario) {
        const ligne = creerLigne(terminal);
        const texte = creerInvite(ligne);
        ligne.appendChild(curseur);

        for (const lettre of etape.cmd) {
            texte.textContent += lettre;
            if (!reduireMouvement) { await pause(55); }
        }
        if (!reduireMouvement) { await pause(280); }

        for (const sortie of etape.sortie) {
            creerLigne(terminal, 'sortie').textContent = sortie;
        }
        if (!reduireMouvement) { await pause(420); }
    }

    const derniere = creerLigne(terminal);
    creerInvite(derniere);
    derniere.appendChild(curseur);
}

lancerTerminal();

let majCouleurReseau = null;

(function () {
    const canvas = parId('reseau');
    if (!canvas || !hero || typeof canvas.getContext !== 'function') { return; }

    const ctx = canvas.getContext('2d');
    if (!ctx) { return; }

    let points = [];
    let largeur = 0;
    let hauteur = 0;
    let distanceMax = 130;
    let rgb = '201,169,106';
    let enCours = false;
    let heroVisible = intersectionObserverDisponible;
    let idAnimation = 0;
    let minuterie = 0;

    function lireCouleur() {
        const hex = getComputedStyle(racine).getPropertyValue('--gold').trim();
        const m = /^#([0-9a-f]{6})$/i.exec(hex);
        if (m) {
            const n = parseInt(m[1], 16);
            rgb = ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255);
        }
    }

    function dessiner() {
        ctx.clearRect(0, 0, largeur, hauteur);

        for (let i = 0; i < points.length; i++) {
            const a = points[i];
            for (let j = i + 1; j < points.length; j++) {
                const b = points[j];
                const dx = a.x - b.x;
                const dy = a.y - b.y;
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d < distanceMax) {
                    ctx.strokeStyle = 'rgba(' + rgb + ',' + ((1 - d / distanceMax) * 0.35).toFixed(3) + ')';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.stroke();
                }
            }
        }

        ctx.fillStyle = 'rgba(' + rgb + ',0.8)';
        points.forEach(function (point) {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 1.6, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    function avancer() {
        points.forEach(function (point) {
            point.x += point.vx;
            point.y += point.vy;
            if (point.x < 0 || point.x > largeur) { point.vx *= -1; }
            if (point.y < 0 || point.y > hauteur) { point.vy *= -1; }
        });
    }

    function boucle() {
        if (!enCours) { return; }
        avancer();
        dessiner();
        idAnimation = requestAnimationFrame(boucle);
    }

    function demarrer() {
        if (reduireMouvement || enCours || !heroVisible || document.hidden) { return; }
        enCours = true;
        boucle();
    }

    function arreter() {
        enCours = false;
        cancelAnimationFrame(idAnimation);
    }

    function dimensionner() {
        largeur = hero.clientWidth;
        hauteur = hero.clientHeight;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(largeur * dpr);
        canvas.height = Math.round(hauteur * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        distanceMax = largeur < 640 ? 95 : 130;
        const nombre = Math.max(16, Math.min(70, Math.round(largeur * hauteur / 17000)));
        points = [];
        for (let i = 0; i < nombre; i++) {
            points.push({
                x: Math.random() * largeur,
                y: Math.random() * hauteur,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4
            });
        }
        dessiner();
    }

    majCouleurReseau = function () {
        lireCouleur();
        dessiner();
    };

    if (intersectionObserverDisponible) {
        new IntersectionObserver(function (entrees) {
            heroVisible = entrees[0].isIntersecting;
            if (heroVisible) { demarrer(); } else { arreter(); }
        }).observe(hero);
    }

    document.addEventListener('visibilitychange', function () {
        if (document.hidden) { arreter(); } else { demarrer(); }
    });

    function redimensionner() {
        clearTimeout(minuterie);
        minuterie = setTimeout(function () {
            if (hero.clientWidth !== largeur || hero.clientHeight !== hauteur) {
                dimensionner();
            }
        }, 150);
    }

    if (typeof window.ResizeObserver === 'function') {
        new ResizeObserver(redimensionner).observe(hero);
    } else {
        window.addEventListener('resize', redimensionner, { passive: true });
    }

    lireCouleur();
    dimensionner();
    demarrer();
})();

const liensNav = document.querySelectorAll('.barre nav a');
const liensNavParId = {};

liensNav.forEach(function (lien) {
    const cible = lien.getAttribute('href');
    if (cible && cible.startsWith('#')) {
        liensNavParId[cible.slice(1)] = lien;
    }
});

if (intersectionObserverDisponible) {
    const observateurApparition = new IntersectionObserver(function (entrees) {
        entrees.forEach(function (entree) {
            if (entree.isIntersecting) {
                entree.target.classList.add('visible');
                observateurApparition.unobserve(entree.target);
            }
        });
    }, { threshold: 0.12 });

    document.querySelectorAll('.reveal').forEach(function (el) {
        observateurApparition.observe(el);
    });

    const observateurNav = new IntersectionObserver(function (entrees) {
        entrees.forEach(function (entree) {
            const lien = liensNavParId[entree.target.id];
            if (lien) {
                lien.classList.toggle('actif', entree.isIntersecting);
            }
        });
    }, { rootMargin: '-45% 0px -45% 0px' });

    document.querySelectorAll('main section').forEach(function (section) {
        observateurNav.observe(section);
    });

    document.body.classList.add('js-actif');
}

const boutonTheme = parId('bouton-theme');
const CLE_THEME = 'portfolio-theme';

function lireTheme() {
    try {
        return localStorage.getItem(CLE_THEME);
    } catch (e) {
        console.warn('Le thème enregistré ne peut pas être lu.', e);
        return null;
    }
}

function sauverTheme(valeur) {
    try {
        localStorage.setItem(CLE_THEME, valeur);
    } catch (e) {
        console.warn('Le thème ne peut pas être enregistré.', e);
    }
}

function appliquerTheme(clair) {
    racine.classList.toggle('theme-clair', clair);
    boutonTheme.setAttribute('aria-label', clair ? 'Passer au thème sombre' : 'Passer au thème clair');
    if (majCouleurReseau) { majCouleurReseau(); }
}

const themeEnregistre = lireTheme();
appliquerTheme(themeEnregistre === null
    ? (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches)
    : themeEnregistre === 'clair');

if (window.matchMedia) {
    const preferenceCouleur = window.matchMedia('(prefers-color-scheme: light)');
    const suivrePreference = function (evenement) {
        if (lireTheme() === null) { appliquerTheme(evenement.matches); }
    };
    if (typeof preferenceCouleur.addEventListener === 'function') {
        preferenceCouleur.addEventListener('change', suivrePreference);
    } else if (typeof preferenceCouleur.addListener === 'function') {
        preferenceCouleur.addListener(suivrePreference);
    }
}

boutonTheme.addEventListener('click', function () {
    const clair = !racine.classList.contains('theme-clair');
    appliquerTheme(clair);
    sauverTheme(clair ? 'clair' : 'sombre');
});

const formulaire = document.querySelector('.formulaire');
const statutForm = parId('statut-form');
let dernierEnvoi = 0;

function afficherStatut(texte, ok) {
    statutForm.textContent = texte;
    statutForm.className = 'statut-form ' + (ok === null ? '' : (ok ? 'ok' : 'erreur'));
}

if (formulaire && statutForm) {
    formulaire.addEventListener('submit', function (e) {
        e.preventDefault();
        if (Date.now() - dernierEnvoi < 20000) {
            afficherStatut('Patiente quelques secondes avant de renvoyer un message.', false);
            return;
        }
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
                            dernierEnvoi = Date.now();
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

if (projetsTitre && !reduireMouvement) {
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