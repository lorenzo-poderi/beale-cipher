# Specifiche — Lettura di un ebook locale e estrazione di un campione di righe per ricerca di un testo all'interno di un ebook del Project Gutenberg

## 1. Obiettivo

Realizzare uno script locale in **Node.js** che analizzi file `.txt` di ebook provenienti dal **Project Gutenberg** e individui automaticamente la riga in cui inizia il **testo effettivo dell'opera**, escludendo:

- metadati iniziali;
- autore;
- titolo;
- data di rilascio;
- lingua;
- eventuali informazioni editoriali;
- eventuali url dell'ebook
- eventuali riconoscimenti (credits)
- prefazioni;
- introduzioni;
- indice/table of contents;
- elenchi di capitoli;
- eventuali altre sezioni preliminari.
- titoli dei capitoli;


## 1.1 Esempio reale:

Il testo seguente corrisponde all'ebook:
  - Id: 1
  - Path: "D:\LolloNewPc\Sviluppo\data\txt-files\cache\epub\1\pg1.txt
  - Title: The Declaration of Independence of the United States of America
  - Author: Thomas Jefferson


```text
The Project Gutenberg eBook of The Declaration of Independence of the United States of America
    
This eBook is for the use of anyone anywhere in the United States and
most other parts of the world at no cost and with almost no restrictions
whatsoever. You may copy it, give it away or re-use it under the terms
of the Project Gutenberg License included with this eBook or online
at www.gutenberg.org. If you are not located in the United States,
you will have to check the laws of the country where you are located
before using this eBook.

Title: The Declaration of Independence of the United States of America

Author: Thomas Jefferson


        
Release date: December 1, 1971 [eBook #1]
                Most recently updated: September 2, 2025

Language: English

Other information and formats: www.gutenberg.org/ebooks/1

Credits: This etext was produced by Michael S. Hart.


*** START OF THE PROJECT GUTENBERG EBOOK THE DECLARATION OF INDEPENDENCE OF THE UNITED STATES OF AMERICA ***


The United States Declaration of Independence was the first E-text
released by Project Gutenberg, early in 1971. The title was stored
in an emailed instruction set which required a tape or diskpack be
hand mounted for retrieval.  The disk pack was the size of a large
cake in a cake carrier, cost $1500,  and contained 5 megabytes, of
which this file took 1-2%.  Two tape backups were kept plus one on
paper tape.  The 10,000 files we hope to have online by the end of
2001 should take about 1-2% of a comparably priced drive in 2001.

This file was never copyrighted, Sharewared, etc., and is thus for
all to use and copy in any manner they choose. Please feel free to
make your own edition using this as a base.

In my research for creating this transcription of our first Etext,
I have come across enough discrepancies [even within that official
documentation provided by the United States] to conclude that even
“facsimiles” of the Declaration of Independence are nary identical
to the original, nor of other “facsimiles.” There is a plethora of
variations in capitalizations, punctuation, and where names appear
on the documents [which names I have left out].

The resulting document has several misspellings removed from those
parchment “facsimiles” I used back in 1971, and which I should not
be able to easily find at this time, including “Brittain.”

[JT, Apr 2005: “Brittish” is spelled as in the original.]

[RO, Aug 2025: Dr. Hart’s original fully-justified columns of text
in the plain text version have been restored for the introduction.
Minor text alterations were made to do so.]


***

Transcribers’ Notes

   NOTE: This file contains the original contents of the
   very first eBook in the Project Gutenberg collection,
   the Declaration of Independence. This file previously
   contained a compilation of etexts from #2 to #9. Also
   it contained a duplicate of the Declaration - as part
   of preserving the history of the contents which isn’t
   necessary any longer. The historical variations of #1
   are included in the “old” subdirectory accessed under
   the “More Files” listing in the landing page for this
   file. No edits or changes have been made to them.

   All of the original Project Gutenberg Etexts from the
   1970’s were produced in ALL CAPS, no lower case.  The
   computers we used then didn’t have lower case at all.

***




THE DECLARATION OF INDEPENDENCE OF THE UNITED STATES OF AMERICA


IN CONGRESS, July 4, 1776

The unanimous Declaration of the thirteen united States of America

When in the Course of human events, it becomes necessary for one people
to dissolve the political bands which have connected them with another,
and to assume, among the Powers of the earth, the separate and equal
station to which the Laws of Nature and of Nature’s God entitle them,
a decent respect to the opinions of mankind requires that they should
declare the causes which impel them to the separation.
```


## 1.2 Risultato dell'esempio:

Il sistema deve individuare la riga contenente:

```text
When in the Course of human events, it becomes necessary for one people
```
che si trova alla riga numero 92.

Nota bene: la prima riga sarà sempre la riga numero 0.


---

# 2. Decisioni progettuali

Architettura prevista dello script chiamato "search-single-ebook.js" per Node.js:

- Chiamata script con valori seguenti (input):
  - id dell'ebook (valori da 1 a 80.000)
  - percorso in cui si trova l'ebook
- Lettura del file di testo
- Individuazione del numero di riga in cui compare la stringa seguente (Gutenberg marker):
 - *** START OF THE PROJECT GUTENBERG EBOOK
 - Memorizzazione del numero di riga in cui compare la stringa ricorrente (Gutenberg marker)
- Estrazione delle prime 500 righe (seguenti la stringa ricorrente (Gutenberg marker))
- Chiamata allo script "search-by-ai.js" (che chiamerà le api di OpenAI) con:
  - 500 righe estratte dal libro
- Analisi risultato e ritorno del risultato in formato JSON tramite lo script

---

# 3. Input
 - id dell'ebook (valori da 1 a 80.000)
 - percorso in cui si trova l'ebook (es. "D:\LolloNewPc\Sviluppo\data\txt-files\cache\epub\1\pg1.txt")

I file (ebook) `.txt` saranno già presenti sul PC locale al percorso seguente:
- D:\LolloNewPc\Sviluppo\data

Tutti i possibili ebook, si troveranno al percorso relativo seguente:

```text
.\txt-files\cache\epub\
```

Struttura prevista di qualsiasi ebook:

```text
txt-files\
└── cache\
    └── epub\
        ├── 1\
        │   └── pg1.txt
        ├── 2\
        │   └── pg2.txt
        ├── 1342\
        │   └── pg1342.txt
        └── ...
```

Lo script dovrà essere progettato in modo da poter elaborare solamente un singolo ebook identificato dal suo id numerico. Tale id sarà un valore compreso tra 1 e 80.000.

Dovendo, ad esempio elaborare l'ebook con id = 1 lo script riceverà anche il percorso dell'ebook.

Il percorso sarò costruito esternamente allo script ma corrisponde alla struttura seguente:
- Base path: "D:\LolloNewPc\Sviluppo\data" (configurato dentro una costante)
- Percorso relativo: "\txt-files\cache\epub\"
- Percorso ebook : "1\pg1.txt"

Ottenendo dunque il percorso completo del file:
 - "D:\LolloNewPc\Sviluppo\data\txt-files\cache\epub\1\pg1.txt"

Più in generale: 
 - "D:\LolloNewPc\Sviluppo\data\txt-files\cache\epub\{id}\pg{id}.txt"


Il formato dell'ebook sorgente è UTF-8, salvo gestione esplicita di eventuali file con encoding differente.

---

# 4 Output

Lo script ritornerà un json con il risultato dell'elaborazione.

Il risultato seguirà questo schema:

```json
{
  "id": 1,
  "status": "Done" | "Not found" | "Error",
  "trimmedLines": 26,
  "firstSentenceLine": 69,
  "confidence": 0.99 (valore che indica l'indice di sicurezza del valore trovato),
  "firstSentence": "When in the Course of human events, it becomes necessary for one people"
}
```

---

# 5 Elaborazione

Il sistema dunque come prima cosa effettuerà una lettura locale del libro.

Successivamente andrà alla ricerca della stringa ricorrente (Gutenberg marker), la quale inizia sempre cosi:
 - *** START OF THE PROJECT GUTENBERG EBOOK

 Ad esempio per l'ebook con id = 1 è la seguente:
 ```text
*** START OF THE PROJECT GUTENBERG EBOOK THE DECLARATION OF INDEPENDENCE OF THE UNITED STATES OF AMERICA ***
```
 
Tale riga, nell'esempio sopra citato è presente al numero di riga 26 (partendo a contare dalla riga 0)

Questo numero di riga sarà quello indicato nel risultato alla voce:
 - "trimmedLines": 26

Successivamente verranno estratte 500 righe successive alla stringa ricorrente (Gutenberg marker).

Con tali 500 righe verrà effettuata la chiamata allo script chiamato:
 - "search-by-ai.js", uno script per node.js con chiamate a OpenAI
 
Tale script riceverà:
  - id dell'ebook del progetto Gutenberg
  - 500 righe estratte dal libro 

E tornerà una struttura JSON simile a questa:
```json
{
  "id": 1,
  "status": "Done" | "Not found" | "Error",
  "firstSentenceLine": 63,
  "firstSentence": "When in the Course of human events, it becomes necessary for one people",
  "confidence": 0.99,
}
```
 - Le regole di come individuare il testo ricercato sono contenute nello script "search-by-ai.js"

 Qualora questa chiamata vada a buon fine lo script attuale ritornerà un risultato come il seguente::
 {
  "id": 1,
  "status": "Done",
  "trimmedLines": 26,
  "firstSentenceLine": 69,
  "confidence": 0.99,
  "firstSentence": "When in the Course of human events, it becomes necessary for one people"
}


 Qualora questa chiamata non vada a buon fine lo script potrebbe ritornare il risultato seguente:
 {
  "id": 1,
  "status": "Not found",
  "trimmedLines": 26,
  "firstSentenceLine": null,
  "confidence": null,
  "firstSentence": null
}

 Qualora questa chiamata non in errore lo script potrebbe ritornare il risultato seguente:
 {
  "id": 1,
  "status": "Error",
  "trimmedLines": 26,
  "firstSentenceLine": null,
  "confidence": null,
  "firstSentence": null
}


---

# 6. Limite massimo di analisi

Qualora, dopo la prima elaborazione, la chiamata allo script "search-by-ai.js" ritorni come risultato:
 - "status": "Not found"

Lo script può richiamare nuovamente lo script "search-by-ai.js" passando questa volta 1000 righe di testo estratte.

Se ancora non riceve un risultato valido la procedura termina comunque.
In questo caso di provvederà ad una ricerca manuale piuttosto che basata su ai.


# 7. Configurazione dello script

Questi parametri, numero di righe estratte per ogni tentativo (500), e numero di tentativi (2) potrebbero essere dei parametri definiti nello script tramite le costanti:


---

# 8. Note finali

Il sistema non deve mai inventare una `firstSentenceLine` se il risultato non viene trovato.


# 9. Logging

Lo script dovrà produrre log ad ogni azione compiuta per capire cosa è successo a ogni ebook.
Il file di log dovrà contenere l'id dell'ebook analizzato.

Esempio:
 - log-1.txt


Esempio di cosa fare log:

```text
[2026.08.25 - 10:00:00] Reading file...
[2026.08.25 - 10:01:00] Gutenberg marker found at line 42
[2026.08.25 - 10:02:00] Sending lines 1-500 to AI...
[2026.08.25 - 10:03:00] Start detected at local line 1805
[2026.08.25 - 10:04:00] Original start line: 1847
[2026.08.25 - 10:05:00] Confidence: 0.98
[2026.08.25 - 10:06:00] Verification: OK
```

Verranno loggati anche tutti quanti gli errori.

Qualora un file di log sia già presente, questo viene aperto nuovamente e il testo accodato.

# 10. Specifiche per gli script creati

Quando verrà richiesto di implementare uno degli step di questa roadmap, il codice dovrà:

- essere compatibile con Node.js (versione 16);
- utilizzare JavaScript/Node.js, salvo diversa richiesta;
- essere modulare;
- utilizzare `async/await`;
- gestire correttamente gli errori;
- non contenere API key;
- utilizzare variabili di configurazione;
- produrre output facilmente leggibile;
- non bloccare l'elaborazione dell'intero batch per un singolo ebook problematico;
- mantenere la numerazione delle righe 0-based;
