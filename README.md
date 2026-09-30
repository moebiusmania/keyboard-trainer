# Tasto dopo tasto ⌨️

<p align="center">
  <img src="docs/tastino.svg" width="180" alt="Tastino, la mascotte di Tasto dopo tasto: un tasto giallo e arancione che sorride e saluta">
</p>

Un allenatore di tastiera in italiano per bambine e bambini di 7–9 anni.
Si impara a scrivere con dieci dita giocando, guidati da **Tastino**, il tasto più simpatico del mondo.
È un sito statico costruito con [Deno](https://deno.com), [Lume](https://lume.land) e CSS vanilla: funziona nel browser, senza account e senza server.

> **Come è nato questo progetto.** Tasto dopo tasto è stato sviluppato con l'aiuto di strumenti di intelligenza artificiale, ma è stato ideato e revisionato da due persone: una che sviluppa software, per la parte tecnica, e una che insegna a scuola, per i contenuti, il linguaggio e il percorso didattico.

## Indice

- [Obiettivi](#obiettivi)
- [Le tre aree](#le-tre-aree)
- [Stack](#stack)
- [Requisiti](#requisiti)
- [Comandi](#comandi)
- [Struttura del progetto](#struttura-del-progetto)
- [Dove sono i testi](#dove-sono-i-testi)
- [Scelte tecniche](#scelte-tecniche)
- [Privacy](#privacy)
- [Licenza](#licenza)

## Obiettivi

- **A chi si rivolge**: bambine e bambini della scuola primaria (7–9 anni) che usano per la prima volta una tastiera, a scuola o a casa.
- **Cosa insegna**: la posizione delle dita sulla riga centrale, quale dito usa quale tasto, le righe in alto e in basso, maiuscole, punteggiatura, accenti e numeri della tastiera italiana.
- **Come**: lezioni brevi e guidate, giochi (palloncini, pioggia di parole, cronometro), premi e distintivi.
- **Cosa non è**: non è un test di velocità per adulti e non raccoglie dati. È in italiano, per la tastiera con layout italiano.

## Le tre aree

1. **Storia** (`/storia/`): sei slide sulla nascita della tastiera, dalla scrittura a mano alle tastiere virtuali. Si sfogliano con le frecce ← → della tastiera, con i bottoni sullo schermo o scorrendo col dito.
2. **Allenamento** (`/allenamento/`): nove lezioni guidate, circa 35 minuti in tutto, con la tastiera italiana e le manine colorate che mostrano quale dito usare. Alla fine si vince un distintivo, che si può scaricare in PNG.
3. **Sfida** (`/sfida/`): otto livelli di livello intermedio, con punti, moltiplicatore, stelle e una bacheca dei record.

| Allenamento | Sfida |
| --- | --- |
| 1. Pronti, dita... via! | 1. Riscaldamento |
| 2. La casa della mano sinistra | 2. Frasi da campioni |
| 3. La casa della mano destra | 3. Accenti all'italiana |
| 4. G e H, indici sportivi | 4. Numeri in fila |
| 5. Le vocali volanti | 5. Pioggia di parole |
| 6. In cima alla tastiera | 6. Scioglilingua |
| 7. Giù in cantina | 7. Corsa contro il tempo |
| 8. Maiuscole e puntini | 8. Il campione delle tastiere |
| 9. Il gran finale | |

## Stack

| Parte | Strumento |
| --- | --- |
| Runtime e task | [Deno](https://deno.com) 2 |
| Generatore di siti statici | [Lume](https://lume.land) 3 (template [Vento](https://vento.js.org), `.vto`) |
| Contenuti | Markdown con frontmatter YAML |
| Stili | CSS vanilla moderno, senza preprocessori né framework |
| Interattività | JavaScript con moduli ES nativi, senza bundler e senza dipendenze |
| Grafica | SVG inline (illustrazioni, mascotte, manine), Canvas (coriandoli, distintivo) |
| Suoni | Web Audio API, suoni sintetizzati al momento |
| Font | Fredoka e Andika da [Bunny Fonts](https://fonts.bunny.net) |
| Salvataggi | `localStorage` del browser |

## Requisiti

- Per sviluppare: [Deno](https://deno.com) 2.x. Lume viene scaricato da Deno al primo avvio, non c'è niente da installare.
- Per giocare: un browser recente (Chrome, Edge, Firefox o Safari aggiornati) e una **tastiera fisica con layout italiano**. Su un dispositivo touch compare un avviso.

## Comandi

```sh
deno task serve     # sito in locale su http://localhost:3000 con ricarica automatica
deno task dev:host  # come serve, ma raggiungibile da altri dispositivi in rete (http://<ip-della-macchina>:3000)
deno task build     # genera il sito statico in _site/
deno task icons     # rigenera le icone PNG dell'app da src/icons/*.svg
```

La cartella `_site/` si può pubblicare così com'è su qualsiasi hosting statico (GitHub Pages, Netlify, un server della scuola...). Prima di pubblicare, indica l'indirizzo vero del sito, anche se è in una sottocartella: serve per i link interni e per le anteprime quando il sito viene condiviso sui social o nelle chat.

```sh
deno task build --location https://esempio.it/tastiera/
```

Su GitHub Pages ci pensa il workflow `.github/workflows/pages.yml`: a ogni push su `main` genera il sito con l'indirizzo giusto e lo pubblica.

## Struttura del progetto

```text
.
├── _config.ts            # configurazione di Lume
├── deno.json             # import e task
├── docs/                 # immagini per questo README
├── scripts/icons.ts      # disegna le icone PNG dagli SVG
└── src/
    ├── index.md          # home
    ├── story/            # presentazione e slide (pagina /storia/)
    ├── training/         # trainer e lezioni (pagina /allenamento/)
    ├── challenge/        # trainer e livelli (pagina /sfida/)
    ├── texts/            # testi comuni dell'interfaccia
    ├── icons/            # icone dell'app (SVG di partenza e PNG generati)
    ├── manifest.webmanifest # manifest dell'app installabile
    ├── sw.page.ts        # service worker, generato con l'elenco dei file da salvare
    ├── _includes/
    │   ├── layouts/      # home, story, trainer, base
    │   ├── partials/     # mascotte
    │   └── illustrations/# SVG delle slide e delle icone
    ├── js/
    │   ├── common.js     # codice di tutte le pagine
    │   ├── story.js      # presentazione
    │   ├── trainer/      # motore di allenamento e sfida (input, punteggio)
    │   └── lib/          # tastiera, mani, suoni, coriandoli, distintivo, salvataggi...
    └── styles/           # CSS diviso per livelli (@layer)
```

## Dove sono i testi

Tutti i testi stanno in file Markdown con frontmatter YAML dentro `src/`, così chi insegna può modificarli senza toccare il codice. Il codice sta in `_includes/`, `js/` e `styles/`.

Nomi di file, cartelle, chiavi del frontmatter e codice sono in inglese; i testi che si leggono sul sito restano in italiano. Gli indirizzi delle pagine (`/storia/`, `/allenamento/`, `/sfida/`) sono fissati con `url` nel frontmatter dei rispettivi `index.md`.

| File | Contenuto |
| --- | --- |
| `src/index.md` | Home: titolo, fumetto di Tastino, le tre aree, le regole d'oro |
| `src/texts/interface.md` | Testi comuni: menu, piè di pagina, nomi delle dita, immagine e testo alternativo dell'anteprima social |
| `src/story/index.md` | Descrizione della pagina e testi dei bottoni della presentazione |
| `src/story/slides/*.md` | Una slide per file (`order`, `year`, `illustration`, `color`, `fact` + testo) |
| `src/training/index.md` | Testi del trainer: messaggi, complimenti, distintivo e animali |
| `src/training/lessons/*.md` | Una lezione per file |
| `src/challenge/index.md` | Testi della sfida: punteggi, record, bacheca |
| `src/challenge/levels/*.md` | Un livello per file |

I file dentro `slides/`, `lessons/`, `levels/` e `texts/` non diventano pagine. Hanno `contentOnly: true` (impostato nei `_data.yml`), quindi i layout li leggono con `search` ma Lume non li pubblica.

### Scrivere una lezione o un livello

```yaml
---
title: Il titolo
order: 3             # posizione sulla mappa
emoji: "🏡"
new_keys: K L Ò      # mostrati come tasti sulla mappa
goal: Frase breve per la mappa
stars: [400, 1000, 1800]  # solo sfida, facoltativo: punti per 1, 2 e 3 stelle
steps:
  - type: talk         # Tastino spiega; si continua con SPAZIO/INVIO
    text: "Testo con **grassetto**"
    show: jklò         # facoltativo: tasti da illuminare
  - type: type         # scrivere un testo, tasto per tasto
    instruction: Cosa fare
    text: la sala
    hint: late         # facoltativo: il suggerimento arriva dopo 3 secondi
  - type: balloons     # gioco: scoppia i palloncini con la lettera giusta
    instruction: Scoppia i palloncini!
    letters: asdf
    count: 14
  - type: rain         # (sfida) parole che cadono; duration, lives, speed, words
  - type: stopwatch    # (sfida) più parole possibile in `duration` secondi
---
Il testo qui sotto è la presentazione iniziale di Tastino.
```

Nella sfida, se un livello non ha `stars`, le soglie si calcolano da sole in base al punteggio perfetto possibile.

## Scelte tecniche

- **CSS vanilla moderno**: `@layer`, nesting nativo, colori `oklch()` e `color-mix()`, container queries (anche di dimensione, per il cielo dei giochi), `:has()`, `@property` per animare variabili, `@starting-style`, funzioni trigonometriche `sin()`/`cos()`, animazioni legate allo scroll (`animation-timeline: view()`) e View Transitions, sia tra le pagine (`@view-transition`) sia dentro la pagina (slide e schermate del trainer). Con `prefers-reduced-motion` le animazioni si spengono.
- **JavaScript**: moduli ES nativi, senza bundler e senza dipendenze.
- **SVG** per illustrazioni, mascotte e manine. **Canvas** per coriandoli e distintivo. **Web Audio** per i suoni, sintetizzati, senza file audio.
- **Font** da [Bunny Fonts](https://fonts.bunny.net): Fredoka per i titoli e l'interfaccia, Andika (pensato per chi impara a leggere) per le lettere da scrivere.
- **App installabile (PWA)**: con il manifest e il service worker il sito si può aggiungere alla schermata Home o installare dal browser, e funziona anche senza connessione. Pagine, stili e script arrivano prima dalla rete (così gli aggiornamenti si vedono subito) e, senza connessione, dalla copia salvata; i font dalla cache, rinnovata in background. La versione del service worker è un hash di tutto il sito: quando si pubblica una modifica, l'app installata se ne accorge (all'avvio, quando torna in primo piano o online, e ogni ora), scarica in background la nuova copia per l'uso offline e la usa dalla pagina successiva.
- **Contenuti separati dal codice**: lezioni, livelli e slide sono file Markdown, quindi si aggiungono o si correggono senza programmare.

## Privacy

Progressi, nome e record restano nel browser (`localStorage`). Non c'è nessun server, nessun account, nessun tracciamento: nessun dato lascia il computer. Se il browser blocca il salvataggio (per esempio in navigazione privata) il gioco funziona lo stesso, ma i progressi durano solo per quella visita.

## Licenza

Codice e contenuti sono distribuiti con la licenza [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.it): puoi usare, copiare, ridistribuire e modificare Tasto dopo tasto liberamente, citando gli autori, a patto che il risultato resti gratuito e con la stessa licenza. Non è permesso usarlo per creare prodotti o materiali a pagamento.

Il riassunto in italiano è in [`LICENSE.it.md`](LICENSE.it.md), il testo legale completo in [`LICENSE`](LICENSE).
