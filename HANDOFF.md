# HANDOFF: sito della Gioielleria D'Amico

Documento per chi riprende il lavoro, persona o agente. Si legge tutto prima di toccare il codice.

## Stato attuale (2 novembre 2026)

- **Repo GitHub:** https://github.com/projectgenesyslabs-bit/damico (privata).
- **Rami:** `main` e `super-redesign-damico` puntano allo stesso commit. Il ramo dedicato serve per Forgejo.
- **Forgejo di Salvatore:** il ramo `super-redesign-damico` è su https://git.salvatoredelmoro.it/gionni/damico, caricato il 2 novembre 2026 dal Mac di Giovanni. Una sessione cloud non raggiunge Forgejo: dopo ogni lavoro fatto nel cloud si riallinea dal Mac con `git pull` e `git push https://git.salvatoredelmoro.it/gionni/damico.git super-redesign-damico`.
- **Sito:** struttura, animazioni e contenuti testuali completi. Verificato a 1440 e a 375 px senza errori in console e senza scorrimento orizzontale.
- **Manca:** le foto del negozio, la conferma degli orari, una prova su un computer vero (mappa compresa), un dominio dove pubblicarlo.

## Il negozio: dati veri raccolti

Instagram e Facebook erano bloccati dalla rete della sessione cloud, quindi i dati vengono da elenchi pubblici.

| Dato | Valore | Fonte |
|---|---|---|
| Nome | Gioielleria D'Amico | Facebook (titolo pagina), Studex |
| Ragione sociale in elenco | D'Amico Grazia | Pagine Bianche, Virgilio |
| Indirizzo | Via Principe di Scalea 34, 93014 Mussomeli (CL) | tutte le fonti |
| Telefono | 0934 951393 | Pagine Bianche, Studex |
| Email | damicogioielleria@gmail.com | Facebook, Studex |
| Attività | gioielleria, orologeria, piercing al lobo con sistema Studex | Virgilio, Studex |
| Prodotti citati | anelli in oro, collane e bracciali in argento | annuario-orari.it |
| Orari | Lun 16:00-20:00. Mar-Sab 9:00-13:00 e 16:00-20:00. Dom chiuso | Pagine Gialle, **da confermare** |
| Instagram | https://www.instagram.com/gioielleriadamico/ | link dato dall'utente |
| Facebook | https://www.facebook.com/damico.gioielleria | link dato dall'utente |

Link delle fonti:
- https://aziende.virgilio.it/gioielleria-e-oreficeria/mussomeli-cl/vamico-grazia-gioielleria-orologeria
- https://www.paginebianche.it/scheda/mussomeli/amico-gioielleria.4557908
- https://www.paginegialle.it/mussomeli-cl/elettrodomestici/amico-gioielleria
- https://www.studex.it/store/gioielleria-damico/
- https://www.annuario-orari.it/orario-societa/Gioielleria-Mussomeli-DAmico-Grazia/650816

Attenzione agli omonimi: esistono "D'Amico Gioielli" a Catania (damicogioielli.it, @damicogioielli) e a Villabate. **Non sono questo negozio.** Non usare i loro dati.

Il nome della titolare non compare nel sito. Si aggiunge solo se lo conferma il negozio.

## Com'è fatto il sito

Sito statico: HTML, CSS e JavaScript. Nessun passo di compilazione. Librerie e font sono copiati in locale, quindi niente CDN.

| File | Contenuto |
|---|---|
| `index.html` | struttura delle sezioni, tag per Google e WhatsApp, dati strutturati del negozio (JSON-LD) |
| `css/style.css` | colori, caratteri, impaginazione, versione mobile sotto 900 px |
| `js/scene.js` | scena 3D: anello in oro, diamante taglio brillante, scintille, bagliore |
| `js/main.js` | ingresso, regia dello scorrimento, menu mobile, orologio, orari, vetrina con lente, cursore |
| `js/foto.js` | elenco delle foto della vetrina (oggi vuoto) |
| `foto/` | cartella per le foto |
| `vendor/` | three.js 0.169, GSAP 3.12.5 con ScrollTrigger, Lenis 1.1.13 |
| `fonts/` | Cormorant Garamond e Manrope (licenza OFL) |
| `strumenti/verifica.js` | prova automatica con Playwright: screenshot, console, scorrimento orizzontale, menu |

### Le sezioni, dall'alto

1. **Ingresso:** il monogramma "D'A" si disegna in oro e un contatore segue il caricamento vero. Poi il sipario sale e le lettere di "D'Amico" salgono una a una.
2. **Apertura (320 vh):** l'anello ruota dietro il titolo. Scorrendo, la camera si avvicina al diamante ("Guardala da vicino.") e poi si allontana. L'anello finisce a destra per il primo pannello.
3. **Tre mestieri (300 vh, binario orizzontale):**
   - Gioielli: l'anello 3D scivola via insieme al pannello.
   - Orologi: quadrante SVG che segna l'ora vera di Mussomeli (fuso Europe/Rome), con la lancetta dei secondi continua.
   - Piercing: punto luce SVG con faccette e lampi.
4. **In vetrina:** binario di foto che scorre con la pagina. Sul computer una lente da gioielliere ingrandisce la foto sotto il puntatore. **È nascosta finché `js/foto.js` è vuoto**, voce di menu compresa.
5. **Visita:** stato "Aperto ora" o "Chiuso, riapre alle..." calcolato dagli orari, indirizzo, telefono, email, social, tabella orari con oggi evidenziato, mappa Google in toni seppia, bottone "Portami qui".
6. **Piede:** grande "D'Amico" in oro. Il riflesso segue il mouse.

### Punti delicati del codice

- **Colore di fondo del canvas** (`js/scene.js`, `setClearColor`): il composer ripassa il colore nella resa tonale. Il valore `0x1d1b19` linearizzato è stato **misurato a schermo** e torna il nero della pagina `#0b0a09`. Se si cambia la resa tonale o il bagliore, va rimisurato. Altrimenti compare un velo grigio.
- **Due ambienti luminosi:** uno scuro con pannelli per l'oro (`buildEnvScene`), uno chiaro con strisce nere per il diamante (`buildDiamondEnv`). Il secondo dà la scacchiera di bianchi e neri del brillante. Troppa luce rende il diamante un blocco bianco, troppo poca lo fa sembrare un onice.
- **Dispersione** (`iors` nello shader): con valori troppo distanti il diamante si tinge di rosso e sembra un rubino. Ora è mescolata al 55%.
- **Regia dello scorrimento** (`keyframes()` in `js/main.js`): cinque fotogrammi chiave per la camera. Sugli schermi verticali la camera resta più indietro e il diamante sta più in alto.
- **Barra in alto:** ha una transizione CSS sul movimento (si nasconde scendendo). L'ingresso anima i suoi figli, mai la barra stessa: animarla con GSAP la lasciava bloccata fuori schermo.
- **Testo dell'apertura:** l'animazione legata allo scorrimento si crea solo a ingresso finito (`buildHeroText`). Se si crea prima, si contende le lettere con l'ingresso e il testo riappare.
- **Paracadute:** se gli script non partono, per esempio aprendo `index.html` con doppio clic, dopo 7 secondi l'ingresso si toglie da solo e la pagina resta leggibile.
- **Dopo i tre mestieri** la scena 3D si ferma e il canvas sparisce, per non consumare la scheda grafica.

## Cosa resta da fare

### 1. Le foto (la cosa più importante)

Le foto vanno prese da Instagram e Facebook del negozio. Tre strade, dalla migliore:

1. **Esportazione ufficiale, fatta dal titolare.** Su Instagram: Impostazioni, Centro gestione account, Le tue informazioni e autorizzazioni, Scarica le tue informazioni. Si scelgono solo i "Contenuti" in formato JSON e qualità alta. Arriva un archivio con tutte le foto alla risoluzione originale. Su Facebook la voce è simile.
2. **Salvarle a mano** dal browser: si apre ogni post e si salva l'immagine. Va bene per 10-20 foto.
3. **Sessione cloud con la rete aperta:** nelle impostazioni dell'ambiente (menu nella barra del titolo della sessione, poi Edit, poi Network access) si aggiungono `instagram.com`, `facebook.com`, `cdninstagram.com` e `fbcdn.net`. Anche così, senza login Instagram e Facebook mostrano poco.

Poi:
- si scelgono 8-14 foto belle, meglio verticali 4:5;
- si riducono a circa 1600 px sul lato lungo, in JPG di qualità 80 o in WebP;
- si mettono in `foto/` con nomi semplici, per esempio `foto/solitario-oro-bianco.jpg`;
- si elencano in `js/foto.js`:

```js
window.FOTO = [
  { src: "foto/solitario-oro-bianco.jpg", alt: "Anello solitario in oro bianco", caption: "Solitario" },
  { src: "foto/bracciale-tennis.jpg", alt: "Bracciale tennis in argento", caption: "Tennis" },
];
```

La vetrina e la voce di menu compaiono da sole. Le didascalie devono descrivere solo quello che si vede davvero nella foto.

Se qualche foto mostra la vetrina o l'insegna del negozio, si può usare anche nell'apertura o nella sezione Visita.

### 2. Orari

Vanno confermati con il negozio. Si cambiano in due punti che devono restare uguali:
- `ORARI` in `js/main.js` (tabella e stato aperto/chiuso);
- `openingHoursSpecification` nel blocco JSON-LD di `index.html`.

### 3. Prova su un computer vero

La verifica è stata fatta in un browser senza scheda grafica, a scatti. Su Brave o Chrome va controllato:
- che l'anello giri fluido e lo zoom sul diamante sia morbido;
- che la mappa si carichi (nella sessione cloud Google era bloccato);
- il menu mobile, su un telefono vero;
- la lente della vetrina, appena ci sono le foto.

### 4. Pubblicazione

Non esiste ancora un indirizzo pubblico. Siti statici come questo vanno bene su Cloudflare Pages, Netlify o GitHub Pages. Quando c'è un dominio:
- si aggiunge `og:image` con un indirizzo **assoluto** (per esempio uno screenshot dell'apertura), così l'anteprima su WhatsApp mostra l'immagine;
- si aggiunge `og:url` e `url` nel JSON-LD.

Ogni modifica a DNS o dominio si fa solo con la conferma di Kevin.

### 5. MotionSites

L'utente aveva chiesto di usare MotionSites (motionsites.ai, libreria di sezioni animate e prompt). Il sito era bloccato dalla rete della sessione cloud, quindi non è stato usato. Gli effetti sono fatti a mano con three.js, GSAP e Lenis. Se si vuole integrare qualcosa da MotionSites, serve aprire `motionsites.ai` nella rete dell'ambiente oppure incollare in chat i prompt dei modelli scelti.

## Portare il progetto su Forgejo

Una sessione cloud non può inviare a git.salvatoredelmoro.it. Si fa dal PC di Kevin.

**Prima volta.** Su Forgejo, con l'account `gionni`, si crea una repo vuota chiamata `damico`: niente README, niente licenza. Poi da terminale:

```
git clone https://github.com/projectgenesyslabs-bit/damico.git
cd damico
git checkout super-redesign-damico
git push https://git.salvatoredelmoro.it/gionni/damico.git super-redesign-damico
```

**Doppio push, come per il sito della Chiaramontana.** Così ogni `git push` va su GitHub e su Forgejo insieme:

```
git remote set-url --add --push origin https://github.com/projectgenesyslabs-bit/damico.git
git remote set-url --add --push origin https://git.salvatoredelmoro.it/gionni/damico.git
git remote -v
```

`git remote -v` deve mostrare un fetch e due push. Da lì in poi `git push origin super-redesign-damico` aggiorna entrambi.

**Controllo che siano uguali:**

```
git ls-remote https://github.com/projectgenesyslabs-bit/damico.git super-redesign-damico
git ls-remote https://git.salvatoredelmoro.it/gionni/damico.git super-redesign-damico
```

I due comandi devono dare lo stesso commit.

La repo va sotto l'account `gionni`, non sotto `kqppa` (quello del sito della Chiaramontana). Indicazione dell'utente.

## Come lavorare e verificare

1. Si legge questo file.
2. `git pull`, poi si lavora sul ramo `super-redesign-damico`. Quando il titolare approva, si unisce in `main`.
3. Si serve la cartella: `python -m http.server 8080`, poi http://localhost:8080. Il doppio clic su `index.html` non basta: i moduli JavaScript lo bloccano.
4. Si aspetta la fine dell'ingresso, si scorrono tutte le sezioni anche a 375 px di larghezza, si controlla la console.
5. Prova automatica, dove Playwright è installato (nelle sessioni cloud c'è già):

```
python -m http.server 8090 &
node strumenti/verifica.js http://localhost:8090 ./screenshot
```

Stampa errori di console e scorrimento orizzontale, e salva gli screenshot delle sezioni a 1440 e 375 px, menu mobile compreso.

6. Alla fine si aggiorna questo file: si aggiorna "Stato attuale" e si aggiunge una voce datata nel diario in fondo.

### Regole di stile (le stesse del sito della Chiaramontana)

- Solo dati veri del negozio. Niente statistiche, anni di fondazione o slogan inventati.
- Niente lineette lunghe né separatori " · " nel testo. Niente card, chip o badge decorativi. Niente etichette monospace.
- Si scrive in italiano, con frasi brevi.

## Diario della chat

Ricostruzione della conversazione da cui è nato il progetto, 1 e 2 novembre 2026. I messaggi dell'utente sono riportati come sono stati scritti.

1. **"creami una nuova repo chiamata damico perfavore sullo stesso github"**
   La sessione non poteva creare repository: l'accesso GitHub era limitato alla repo della Chiaramontana. Sono state date le istruzioni per crearla da github.com/new o con `gh repo create`.
2. **"rendila repo privata"**
   La repo non esisteva ancora. Sono state date le istruzioni per crearla privata, o per cambiarne la visibilità.
3. **"l'ho creata io"**
   La repo `projectgenesyslabs-bit/damico` è stata collegata alla sessione e clonata. Era vuota.
4. **"qui adesso utilizzaimo quei crediti a consumo di 250$?"**
   Dalla sessione non si vede la fatturazione. Spiegato che con un abbonamento claude.ai si consumano i limiti del piano, e i crediti a consumo solo con l'uso extra attivo o con una chiave API della Console. Si controlla su claude.ai, in Impostazioni, e su console.anthropic.com, in Billing.
5. **"sei collegato all'ambiente di lavoro sul git sulla repository damico giusto? quindi si"**
   Sì: collegata, con permesso di scrittura.
6. **"ok è una repository a parte giusto non intaccato gli altri progetti su github?"**
   Sì: repo separata. Verificato che la repo della Chiaramontana non aveva modifiche.
7. **"vabene, adesso voglio che ti prendi tutti i dati possibili foto, informazioni, qualsiasi informazione da questa gioielleria ecco i link, devi prenderli da entrambi: [Facebook e Instagram] e mi crei un sito web per questa gioielleria che dobbiamo mostrargli e fargli, voglio che utilizzi al massimo solo motionsites, creandomi qualcosa di supremo e mai visto prima. il titolare della gioielleria mi ha detto che vuole rimanere a bocca aperta, che crei qualcosa di magnifico super complesso figo a tema gioielleria ovviamente non mettee elementi a caso, mi raccomando confido in te"**
   Instagram, Facebook, i siti specchio e motionsites.ai erano bloccati dalla rete della sessione cloud: errore 403 dal proxy, sia con curl sia con il lettore web. I dati sono stati presi da elenchi pubblici, con la ricerca web. Si è scoperto che il negozio è a Mussomeli. È stato costruito il sito descritto sopra.
8. **"se ti serve raccogliere tutti i dati apriti un browser qui per prendere tutto"**
   Provato Chromium nel container: stesso blocco di rete. Nessun computer dell'utente era collegato alla sessione.
9. **"anche perchè DEVI PRENDERE TUTTO DA QUEI DUE LINK"**
   Confermato che senza rete aperta le foto non si possono prendere. Il sito è stato preparato con la vetrina pronta ad accoglierle.
10. **"me lo riesci ad aprire nel mentre qui sul browser integrato?"**
    Nella sessione non c'era un browser integrato, e il container non è raggiungibile dal computer dell'utente.
11. **"al massimo dammi il local host da aprire su brave"**
    Il localhost del container non si apre da fuori. Il sito è stato pubblicato su GitHub (`main`) con i comandi per avviarlo sul PC.
12. **"non smettere di lavorare su quello che stavi facendo eh, non perdere il focus"**
    Proseguite le rifiniture: fondo grigio corretto (doppia conversione del colore, misurata), diamante con ambiente dedicato, inquadratura mobile, bug del testo che riappariva, alone del punto luce centrato, vetrina provata con foto finte e corretto lo scorrimento orizzontale.
13. **"appena hai terminato tutto quanto, carica questo lavoro sul git di salvatore su un branch dedicato chiamato super redesign damico a parte"**
    Forgejo bloccato dalla rete. Creato il ramo `super-redesign-damico` su GitHub (i nomi dei rami non hanno spazi), con le istruzioni per copiarlo su Forgejo.
14. **"hai finito? parla solo italiano"**
    Riepilogo di cosa è fatto e cosa manca.
15. **"tutto il sito quindi è finito?"**
    No: il codice è completo, ma mancano foto, conferma degli orari e una prova su un computer vero.
16. **"sicuro che non c'è altro da continua re finire o rifinire?"**
    Trovate e corrette altre quattro cose: paracadute per l'ingresso se gli script non partono, menu a tutto schermo per il mobile, tag per Google e WhatsApp con i dati strutturati del negozio, contorno oro per chi naviga con la tastiera. Provando il menu è emerso un bug vero: la barra in alto non compariva mai, nemmeno su desktop. Corretto.
17. **"ok allora dimmi come spostare il progetto sul git di salvatore su un branch dedicato prima e mi crei un handoff completo anche con tutta la chat e le istruzioni per continuare sulle cose che mancano, le foto ecc..."**
    Scritto questo file, aggiunti `AGENTS.md` e lo strumento di verifica, pubblicato tutto su `main` e `super-redesign-damico`.
18. **"no con l'account gionni"**
    Su Forgejo la repo va sotto l'account `gionni`: `https://git.salvatoredelmoro.it/gionni/damico`. Istruzioni aggiornate.
19. **Clonazione sul Mac: "Repository not found"**
    La repo GitHub era privata e git sul Mac non aveva l'accesso. L'utente l'ha resa pubblica dal sito di GitHub.
20. **Push su Forgejo riuscito**
    Dal Mac di Giovanni: `* [new branch] super-redesign-damico -> super-redesign-damico` su `gionni/damico`.

## Registro degli interventi

### 2 novembre 2026
- **Cambiato:** prima versione completa del sito, poi rifiniture della scena 3D, menu mobile, paracadute dell'ingresso, tag per Google e WhatsApp, dati strutturati, contorno per la tastiera, handoff, regole del progetto, strumento di verifica.
- **Verificato:** `strumenti/verifica.js` dà "Tutto a posto": screenshot a 1440 e 375 px di tutte le sezioni, console senza errori, nessuno scorrimento orizzontale, menu mobile che si apre e si chiude. Aprendo `index.html` con doppio clic, dopo 7 secondi la pagina si vede. Vetrina e lente provate con immagini finte iniettate solo nel browser di prova. Fondo del canvas misurato al pixel.
- **Aperto:** foto, conferma orari, prova su un computer vero, mappa, pubblicazione su un dominio. La repo GitHub è pubblica: si può rimettere privata.
