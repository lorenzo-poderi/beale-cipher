# Roadmap — Riconoscimento automatico dell'inizio degli ebook Project Gutenberg

## 1. Obiettivo

Realizzare una pipeline locale in **Node.js** che analizzi file `.txt` di ebook provenienti dal **Project Gutenberg** e individui automaticamente la riga in cui inizia il **testo effettivo dell'opera**, escludendo:

- metadati iniziali;
- autore;
- titolo;
- eventuali informazioni editoriali;
- prefazioni;
- introduzioni;
- indice/table of contents;
- elenchi di capitoli;
- eventuali altre sezioni preliminari.

Esempio concettuale:

```text
...
TITLE
THE DIVINE COMEDY
DANTE ALIGHIERI

CONTENTS
...
CANTO I

Nel mezzo del cammin di nostra vita...
```

Il sistema deve individuare la riga contenente:

```text
Nel mezzo del cammin di nostra vita...
```

e restituire il relativo numero di riga.

Il progetto riguarda inizialmente circa **18.000 ebook**.

---

# 2. Decisioni progettuali

## 2.1 Niente agente

Non verrà utilizzato un agente autonomo.

Il programma Node.js effettuerà direttamente chiamate alle **API OpenAI**.

Architettura prevista:

```text
TXT locale
   |
   v
Node.js
   |
   +--> preprocessing locale
   |
   +--> individuazione marker Gutenberg
   |
   +--> rimozione parte iniziale
   |
   +--> analisi delle prime N righe
   |
   +--> OpenAI API
   |
   v
JSON risultato
```

---

## 2.2 Nessun fine-tuning / modello di addestramento

Per il momento NON verrà realizzato alcun modello addestrato/fine-tuned.

Il modello linguistico verrà utilizzato direttamente tramite API.

L'idea di creare un dataset di libri classificati manualmente potrà essere rivalutata in futuro esclusivamente se i risultati automatici non saranno sufficientemente affidabili.

Il dataset di test manuale non è quindi una componente obbligatoria della prima versione.

---

# 3. Input

I file `.txt` saranno già presenti sul PC locale.

Root directory:

```text
txt-files\cache\epub\
```

Struttura prevista:

```text
txt-files\
└── cache\
    └── epub\
        ├── 1\
        │   └── 1.txt
        ├── 2\
        │   └── 2.txt
        ├── 1342\
        │   └── 1342.txt
        └── ...
```

Lo script dovrà essere progettato in modo da poter elaborare:

1. un singolo ebook;
2. una directory;
3. eventualmente tutti gli ebook disponibili sotto `txt-files\cache\epub\`.

Il formato sorgente è UTF-8, salvo gestione esplicita di eventuali file con encoding differente.

---

# 4. Preprocessing locale

Prima di chiamare l'API, Node.js dovrà leggere il file e dividerlo in righe.

Il numero di riga sarà **1-based**:

```text
prima riga = 1
seconda riga = 2
...
```

Questo deve essere mantenuto in modo coerente in tutto il progetto.

---

# 5. Marker Project Gutenberg

Il preprocessing dovrà cercare il marker:

```text
*** START OF THE PROJECT GUTENBERG EBOOK
```

Il testo prima di questo marker non deve essere sottoposto all'analisi AI.

La ricerca dovrà essere sufficientemente robusta da tollerare eventuali variazioni successive al testo `EBOOK`, ad esempio il titolo o l'identificativo dell'ebook.

Non assumere che il marker occupi sempre una posizione identica.

---

# 6. Gestione delle righe eliminate

Le righe precedenti al testo da analizzare verranno escluse dall'analisi AI.

Tuttavia il sistema deve conservare il numero di righe eliminate.

Esempio:

```text
Righe originali:       1 ... 1847 ... 2000
Righe eliminate:       1 ... 847
Analisi AI:                  848 ... 1153
```

Il risultato AI lavorerà quindi su una numerazione locale rispetto al blocco inviato.

Il programma dovrà convertire il risultato nella numerazione **originale del file**.

Nel risultato finale dovrà essere presente un'informazione equivalente a:

```json
{
  "trimmedLines": 847
}
```

`trimmedLines` indica quante righe iniziali del file originale sono state escluse prima dell'analisi.

La regola di conversione dovrà essere chiaramente implementata nel codice:

```text
originalStartLine = trimmedLines + localStartLine
```

Qualora il marker venga trovato alla riga X, bisognerà definire con precisione se la riga del marker stesso viene inclusa o esclusa. La scelta prevista dalla roadmap è:

**escludere anche la riga del marker e iniziare dalla riga immediatamente successiva.**

Pertanto:

```text
trimmedLines = numero della riga del marker
```

e la prima riga disponibile per l'analisi sarà:

```text
markerLine + 1
```

---

# 7. Limite massimo di analisi

Il sistema NON deve analizzare indefinitamente un libro.

Configurazione prevista:

```text
MAX_ANALYSIS_LINES = 1000
```

Il valore dovrà essere configurabile, non hardcoded in più punti del progetto.

Per la prima versione il valore predefinito sarà:

```text
1000
```

L'AI potrà quindi analizzare solamente le prime 1000 righe successive al marker Gutenberg.

---

# 8. Caso oltre il limite

Se l'inizio dell'opera non viene individuato entro le prime 1000 righe, il libro NON deve essere considerato automaticamente corretto.

Dovrà essere marcato:

```json
{
  "status": "manual_review"
}
```

oppure con uno stato equivalente chiaramente documentato.

Il sistema non deve inventare una `startLine` oltre il limite.

In futuro sarà possibile implementare un secondo sistema automatico per questi casi.

---

# 9. Suddivisione del testo inviato all'AI

La prima implementazione dovrà privilegiare semplicità e affidabilità.

L'intervallo massimo disponibile sarà:

```text
1 - 1000
```

righe dopo il marker.

Non è obbligatorio inviare sempre tutte le 1000 righe in un'unica richiesta.

La soluzione dovrà essere progettata in modo da poter utilizzare blocchi, ad esempio:

```text
500 righe
```

o altro valore configurabile.

L'architettura dovrà consentire di modificare successivamente:

```text
CHUNK_SIZE
MAX_ANALYSIS_LINES
```

senza modificare la logica principale.

---

# 10. Strategia AI

L'AI deve ricevere una porzione del testo e determinare se al suo interno è presente l'inizio effettivo dell'opera.

Deve distinguere tra:

### NON inizio dell'opera

Esempi:

- titolo;
- autore;
- prefazione;
- introduzione;
- indice;
- sommario;
- lista dei capitoli;
- intestazioni di capitoli/canti/libri;
- informazioni editoriali;
- note preliminari.

### INIZIO dell'opera

La prima riga che costituisce effettivamente il contenuto dell'opera.

Esempio:

```text
Nel mezzo del cammin di nostra vita...
```

Non è necessario che il testo inizi necessariamente con una frase narrativa. L'algoritmo deve essere applicabile anche a:

- poesia;
- teatro;
- saggi;
- testi filosofici;
- testi religiosi;
- lettere;
- opere in versi;
- opere strutturate in libri/canti;
- altri testi letterari.

---

# 11. Output AI

L'output dovrà essere JSON strutturato.

Campi minimi richiesti:

```json
{
  "startLine": 123,
  "confidence": 0.98,
  "firstText": "Nel mezzo del cammin di nostra vita..."
}
```

## startLine

Numero di riga relativo al testo ricevuto dall'AI.

La numerazione deve essere 1-based.

Il programma Node.js convertirà poi il valore nella numerazione originale del file.

## confidence

Numero compreso tra:

```text
0.0
```

e:

```text
1.0
```

Rappresenta la sicurezza stimata dal modello nell'identificazione dell'inizio.

## firstText

La prima riga effettivamente appartenente all'opera.

Deve essere riportata il più fedelmente possibile, mantenendo il contenuto originale.

NON deve essere una parafrasi.

---

# 12. Output finale del programma

Il risultato completo dovrà contenere almeno:

```json
{
  "ebookId": "1234",
  "file": "txt-files/cache/epub/1234/1234.txt",
  "status": "ok",
  "markerLine": 42,
  "trimmedLines": 42,
  "startLine": 1847,
  "localStartLine": 1805,
  "confidence": 0.98,
  "firstText": "Nel mezzo del cammin di nostra vita..."
}
```

I nomi possono essere modificati durante l'implementazione se emerge una nomenclatura migliore, ma il significato deve rimanere invariato.

### Significato

`markerLine`:
numero di riga originale del marker Gutenberg.

`trimmedLines`:
numero di righe eliminate dall'inizio, compreso il marker.

`localStartLine`:
riga individuata dal modello nel testo successivo al marker.

`startLine`:
riga effettiva nel file originale.

Formula:

```text
startLine = trimmedLines + localStartLine
```

`status`:

possibili valori iniziali:

```text
ok
manual_review
error
```

---

# 13. Verifica automatica dell'output

Il programma Node.js NON deve fidarsi ciecamente della risposta dell'AI.

Dopo aver ricevuto:

```json
{
  "startLine": 1805,
  "firstText": "Nel mezzo del cammin di nostra vita..."
}
```

dovrà verificare che `firstText` corrisponda effettivamente alla riga indicata nel testo.

Se il confronto fallisce:

1. normalizzare eventualmente spazi bianchi;
2. verificare nuovamente;
3. se il problema persiste, classificare il risultato come errore/revisione.

La logica di verifica dovrà essere separata dalla chiamata API.

---

# 14. Gestione della confidence

La confidence non deve essere utilizzata inizialmente per rifiutare automaticamente un risultato, ma deve essere registrata.

Successivamente sarà possibile introdurre soglie, ad esempio:

```text
>= 0.95    risultato affidabile
0.80-0.95  risultato da verificare
< 0.80     manual_review
```

Queste soglie NON sono ancora vincolanti.

La prima versione deve semplicemente conservare il valore.

---

# 15. Gestione degli errori

Lo script dovrà gestire almeno:

- file inesistente;
- file vuoto;
- encoding non valido;
- marker Gutenberg assente;
- API non raggiungibile;
- API che restituisce errore;
- timeout;
- risposta AI non valida;
- JSON AI non parsabile;
- `startLine` non numerico;
- `startLine` fuori dall'intervallo analizzato;
- `firstText` non corrispondente alla riga;
- superamento delle `MAX_ANALYSIS_LINES`.

Gli errori non devono interrompere necessariamente l'elaborazione dell'intero batch.

Un singolo ebook problematico deve poter essere registrato e saltato, consentendo di proseguire con gli altri.

---

# 16. Configurazione

Le impostazioni non dovranno essere hardcoded.

Prevedere un file di configurazione, ad esempio:

```text
config.json
```

con parametri concettualmente equivalenti a:

```json
{
  "inputRoot": "txt-files/cache/epub",
  "maxAnalysisLines": 1000,
  "chunkSize": 500,
  "model": "...",
  "confidenceThreshold": 0.95
}
```

La API key OpenAI NON deve essere inserita nel file di configurazione versionato.

Deve essere letta da una variabile d'ambiente, ad esempio:

```text
OPENAI_API_KEY
```

---

# 17. Sicurezza API key

La chiave API deve essere mantenuta esclusivamente nell'ambiente locale.

Esempio:

```text
OPENAI_API_KEY=...
```

Il codice non deve contenere la chiave.

Il file `.env`, se utilizzato, deve essere escluso da Git tramite `.gitignore`.

---

# 18. Logging

Lo script dovrà produrre log sufficienti per capire cosa è successo a ogni ebook.

Esempio:

```text
[1234] Reading file...
[1234] Gutenberg marker found at line 42
[1234] Sending lines 1-500 to AI...
[1234] Start detected at local line 1805
[1234] Original start line: 1847
[1234] Confidence: 0.98
[1234] Verification: OK
```

In caso di errore:

```text
[5678] ERROR: Gutenberg marker not found
```

I log dovranno essere leggibili e utili anche durante l'elaborazione di migliaia di file.

---

# 19. Risultati batch

Per l'elaborazione dei circa 18.000 ebook, il programma dovrà poter produrre un file complessivo contenente i risultati.

Formato consigliato iniziale:

```text
results.json
```

Struttura:

```json
[
  {
    "ebookId": "1",
    "status": "ok",
    "startLine": 1847,
    "confidence": 0.98,
    "firstText": "..."
  },
  {
    "ebookId": "2",
    "status": "manual_review"
  }
]
```

Sarà possibile aggiungere successivamente CSV o database.

---

# 20. Elaborazione ripetibile

Il sistema dovrà evitare, quando possibile, di richiamare inutilmente l'API per ebook già elaborati.

Prevedere quindi un meccanismo per riconoscere risultati già presenti in `results.json` o in un futuro archivio dei risultati.

Obiettivo:

```text
18.000 ebook
       |
       v
elaborazione
       |
       v
risultati salvati
       |
       v
interruzione
       |
       v
riavvio
       |
       v
riprende dai libri non ancora elaborati
```

Questo è importante perché l'elaborazione batch può essere interrotta da errori di rete, riavvio del PC o raggiungimento di limiti API.

---

# 21. Controllo manuale

I libri con:

```text
status = manual_review
```

dovranno essere facilmente individuabili.

In futuro potrà essere sviluppato uno script/interfaccia che mostri:

- ID ebook;
- titolo;
- autore;
- prime righe dopo il marker;
- righe candidate;
- confidence;
- eventuale risultato AI.

Per ora non è necessario implementare l'interfaccia.

---

# 22. Ottimizzazione futura

Dopo aver implementato la prima versione sarà possibile ottimizzare:

1. dimensione dei chunk;
2. numero di chiamate API per ebook;
3. modello utilizzato;
4. caching;
5. parallelizzazione;
6. gestione dei retry;
7. soglia confidence;
8. euristiche locali;
9. secondo passaggio automatico per `manual_review`.

NON implementare prematuramente queste ottimizzazioni se rendono il primo prototipo più complesso.

---

# 23. Possibile strategia a due livelli

Una futura versione potrà utilizzare:

```text
             TXT
              |
              v
       regole locali Node
              |
       materiale sicuramente
           preliminare
              |
              v
         zona ambigua
              |
              v
          OpenAI API
              |
              v
          risultato
```

Esempi di elementi riconoscibili localmente:

```text
CONTENTS
TABLE OF CONTENTS
PREFACE
PREFATORY NOTE
INTRODUCTION
FOREWORD
INDEX
CHAPTER
CANTO
BOOK
```

Questa ottimizzazione NON è obbligatoria nella prima versione.

---

# 24. Costi API

Il costo dipenderà dal modello scelto, dal numero di token inviati e dal numero di chiamate.

La roadmap non deve assumere un costo fisso.

Durante l'implementazione dovrà essere possibile registrare almeno:

- token input;
- token output;
- numero di richieste;
- eventuali retry.

In questo modo sarà possibile calcolare il costo reale dei primi test e proiettarlo sui circa 18.000 ebook.

---

# 25. Test iniziale

Prima del batch completo:

### Fase A

Utilizzare circa 10 ebook molto diversi tra loro.

Comprendere:

- romanzo;
- poesia;
- teatro;
- saggio;
- testo con prefazione;
- testo con indice;
- testo con struttura a capitoli;
- testo con struttura a canti/libri.

### Fase B

Portare il test a circa 100 ebook.

Analizzare:

- percentuale di risultati validati;
- confidence media;
- numero di `manual_review`;
- errori di parsing;
- errori di verifica;
- consumo token;
- costo API.

### Fase C

Solo dopo la validazione:

```text
batch completo ~18.000 ebook
```

---

# 26. Cosa NON fare nella prima versione

Non implementare inizialmente:

- agenti;
- fine-tuning;
- database;
- interfaccia web;
- classificatori addestrati localmente;
- sistemi complessi di retry;
- pipeline distribuite;
- elaborazione parallela aggressiva;
- secondo modello AI;
- euristiche molto complesse.

L'obiettivo della prima versione è ottenere una pipeline semplice e verificabile:

```text
TXT
 ↓
marker Gutenberg
 ↓
prime MAX_ANALYSIS_LINES
 ↓
OpenAI API
 ↓
JSON
 ↓
verifica
 ↓
risultato
```

---

# 27. Ordine di implementazione

## Step 1 — Lettura TXT

Creare uno script Node.js che:

- riceva un ID ebook;
- costruisca il percorso sotto `txt-files/cache/epub/[id]`;
- individui il file `.txt`;
- legga il file;
- lo divida in righe numerate.

## Step 2 — Individuazione marker

Aggiungere:

```text
*** START OF THE PROJECT GUTENBERG EBOOK
```

e produrre:

```text
markerLine
trimmedLines
```

## Step 3 — Limite 1000 righe

Estrarre:

```text
markerLine + 1
...
markerLine + MAX_ANALYSIS_LINES
```

## Step 4 — Chiamata OpenAI

Implementare la prima chiamata API con prompt dedicato e output JSON strutturato.

## Step 5 — Parsing del JSON

Validare:

```text
startLine
confidence
firstText
```

## Step 6 — Conversione numerazione

Calcolare:

```text
startLine = trimmedLines + localStartLine
```

## Step 7 — Verifica

Confrontare `firstText` con la riga individuata.

## Step 8 — Status

Implementare:

```text
ok
manual_review
error
```

## Step 9 — Risultato persistente

Scrivere `results.json`.

## Step 10 — Batch

Estendere lo script a tutti gli ebook presenti in:

```text
txt-files/cache/epub/
```

## Step 11 — Resume

Evitare di rielaborare ebook già completati.

## Step 12 — Analisi costi/accuratezza

Dopo i primi 100 ebook valutare:

- accuratezza;
- confidence;
- consumo token;
- costo;
- numero di manual review.

Solo successivamente decidere se introdurre ottimizzazioni.

---

# 28. Specifiche per gli script futuri

Quando verrà richiesto di implementare uno degli step di questa roadmap, il codice dovrà:

- essere compatibile con Node.js moderno;
- utilizzare JavaScript/Node.js, salvo diversa richiesta;
- essere modulare;
- utilizzare `async/await`;
- gestire correttamente gli errori;
- non contenere API key;
- utilizzare variabili di configurazione;
- produrre output facilmente leggibile;
- essere predisposto per l'elaborazione batch;
- non bloccare l'elaborazione dell'intero batch per un singolo ebook problematico;
- mantenere la numerazione delle righe 1-based;
- distinguere sempre tra numerazione locale e numerazione originale;
- evitare dipendenze non necessarie.

Quando si introdurranno dipendenze NPM, indicare sempre:

```text
npm install ...
```

e spiegare brevemente a cosa serve ciascuna dipendenza.

---

# 29. Primo obiettivo operativo

Il primo script da implementare sarà volutamente semplice.

Input:

```text
ebook ID
```

Output:

```text
marker trovato
numero righe eliminate
prime MAX_ANALYSIS_LINES righe disponibili
```

Senza ancora chiamare OpenAI.

Una volta verificata questa parte, si passerà alla chiamata API.

Questo permette di costruire il progetto progressivamente e di verificare ogni componente prima di aggiungere la successiva.

---

# 30. Stato della roadmap

Stato iniziale:

```text
[ ] Step 1 — Lettura TXT
[ ] Step 2 — Individuazione marker
[ ] Step 3 — Limite massimo righe
[ ] Step 4 — Chiamata OpenAI
[ ] Step 5 — Parsing JSON
[ ] Step 6 — Conversione numerazione
[ ] Step 7 — Verifica firstText
[ ] Step 8 — Status
[ ] Step 9 — results.json
[ ] Step 10 — Elaborazione batch
[ ] Step 11 — Resume
[ ] Step 12 — Analisi costi/accuratezza
[ ] Step 13 — Eventuali ottimizzazioni
```

La roadmap deve essere considerata il documento di riferimento per le successive implementazioni del progetto.
