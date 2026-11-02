# Regole del progetto (sito della Gioielleria D'Amico)

Chiunque lavori qui, persona o agente (anche una sessione cloud di Claude), segue queste regole.

1. **Prima di toccare il codice** leggi `HANDOFF.md`: stato del sito, dati del negozio, cose aperte.
2. **Ramo di lavoro:** `super-redesign-damico`. Si unisce in `main` quando il titolare approva. Prima di cominciare `git pull`, a fine lavoro `git push`.
3. **GitHub e Forgejo restano uguali.** Su una copia nuova si configura il doppio push (comandi in `HANDOFF.md`). Una sessione cloud può inviare solo a GitHub: Forgejo si riallinea dal PC di Kevin. Mai un push forzato su uno solo dei due.
4. **Al termine di ogni intervento** aggiorna `HANDOFF.md`: la sezione "Stato attuale" e una voce datata nel registro.
5. **Verifica nel browser prima di consegnare:** `python -m http.server 8080`, aspetta la fine dell'ingresso, scorri tutte le sezioni anche a 375 px, controlla la console. Nessun errore, nessuno scorrimento orizzontale. Dove c'è Playwright: `node strumenti/verifica.js`.
6. **Solo dati veri del negozio.** Niente lineette lunghe né separatori " · ", niente card, chip o badge decorativi, niente etichette monospace, niente statistiche, anni o slogan inventati. Attenzione agli omonimi di Catania e Villabate.
7. **Dominio e DNS:** ogni modifica solo con la conferma di Kevin. Nessun token o password in chiaro.
8. Si scrive in italiano, con frasi brevi.
