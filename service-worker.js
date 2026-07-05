/**
 * ==========================================================================
 * SmartRevision - SERVICE WORKER (service-worker.js)
 * Nécessaire pour que le navigateur propose "Installer l'appli".
 * Met en cache les fichiers de l'appli pour un chargement rapide et un
 * fonctionnement hors-ligne basique.
 * ==========================================================================
 */

// 🔧 Change ce numéro (v1 -> v2 -> v3...) à chaque mise à jour de tes fichiers
// pour forcer les téléphones à récupérer la nouvelle version au lieu de
// garder l'ancienne en cache.
const CACHE_NAME = "smartrevision-v1";

const APP_SHELL = [
    "./",
    "./index.html",
    "./style.css",
    "./student.js",
    "./editor.js",
    "./lock.js",
    "./manifest.json",
    "./icon-192.png",
    "./icon-512.png",
    "./icon-maskable-512.png"
];

// --- Installation : on met en cache les fichiers de base de l'appli ---
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
    );
    self.skipWaiting();
});

// --- Activation : on supprime les anciens caches (anciennes versions) ---
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

// --- Récupération des fichiers ---
self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);

    // Les appels au backend Google Apps Script (vérification du code) ne
    // doivent JAMAIS être mis en cache : toujours interroger le réseau.
    if (url.hostname.includes("script.google.com")) {
        event.respondWith(fetch(event.request));
        return;
    }

    // Pour le reste (fichiers de l'appli) : cache d'abord, réseau en secours
    event.respondWith(
        caches.match(event.request).then((cached) => {
            return (
                cached ||
                fetch(event.request).then((response) => {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                    return response;
                })
            );
        })
    );
});
