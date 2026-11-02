# Gioielleria D'Amico, Mussomeli

Prima di lavorarci leggi `HANDOFF.md`: stato, dati del negozio, cose da fare, istruzioni per Forgejo.

Sito vetrina per la Gioielleria D'Amico, Via Principe di Scalea 34, 93014 Mussomeli (CL).

## Aprirlo in locale

```
python -m http.server 8080
```
poi apri http://localhost:8080 nel browser.

## Cosa c'è
- Ingresso con monogramma disegnato in oro.
- Anello solitario in 3D (three.js) con diamante taglio brillante, guidato dallo scorrimento.
- Tre pannelli orizzontali: Gioielli, Orologi (orologio con l'ora vera di Mussomeli), Piercing (Studex).
- Vetrina con lente da gioielliere: si attiva quando ci sono foto in `js/foto.js`.
- Visita: indirizzo, telefono, email, social, orari con stato "aperto/chiuso" calcolato, mappa.
- Librerie e font sono in locale (`vendor/`, `fonts/`): nessun CDN.

## Da fare
- Foto: vanno prese da Instagram (@gioielleriadamico) e Facebook (damico.gioielleria), messe in `foto/` ed elencate in `js/foto.js`.
- Orari: presi da Pagine Gialle, da confermare con il negozio (`ORARI` in `js/main.js`).
