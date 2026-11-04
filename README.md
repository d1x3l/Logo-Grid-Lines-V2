# Logo Blueprint & Grid Generator per Adobe Illustrator

Uno script avanzato per Adobe Illustrator che estrae automaticamente le linee di costruzione, i cerchi geometrici, i punti di ancoraggio e le maniglie di Bézier dai tuoi tracciati, generando un "blueprint" tecnico e preciso del tuo logo o illustrazione.

Basato sul codice originale di [Studio Gibbous](http://www.studiogibbous.com/)

## Caratteristiche Principali

* **Estrazione Selettiva:** Scegli esattamente cosa generare (linee di struttura, cerchi/tolleranze, punti di ancoraggio, maniglie di Bézier).
* **Interfaccia Moderna:** UI pulita e bilanciata in stile Adobe, con pannelli a schede per le impostazioni avanzate.
* **Controllo Parametri:** Regola la dimensione delle ancore, il raggio delle maniglie, lo spessore dei tratti e la sensibilità di rilevamento delle curve.
* **Selettore Colori:** Personalizza i colori di ogni elemento generato.
* **Gestione Livelli Pulita:** Tutti gli elementi generati vengono inseriti in un livello dedicato ("Logo Grid") organizzato in sotto-livelli chiusi e non distruttivi.

## Installazione

1. Scarica il file `Logo-Blueprint-Generator.jsx` da questo repository.
2. Posiziona il file nella cartella degli script di Illustrator:
   * **Windows:** `C:\Program Files\Adobe\Adobe Illustrator [Versione]\Presets\it_IT\Script`
   * **Mac:** `Applicazioni/Adobe Illustrator [Versione]/Presets/it_IT/Script`
3. Riavvia Illustrator.

*Nota: In alternativa, puoi eseguire lo script senza installarlo andando su **File > Script > Altro script...** e selezionando il file `.jsx` scaricato.*

## Come si usa

1. Apri il tuo documento in Illustrator.
2. Seleziona i tracciati, i loghi o i gruppi di elementi di cui vuoi ricavare la griglia.
3. Vai su **File > Script > Logo-Blueprint-Generator** (o caricalo manualmente).
4. Scegli gli elementi da generare nella finestra principale.
5. (Opzionale) Clicca su **Impostazioni Avanzate** per regolare spessori, tolleranze e colori.
6. Clicca su **Genera**.

> 💡 **Consiglio Pro l'utilizzo:**  
> Per usare e organizzare questo e altri script con un solo clic direttamente da un pannello integrato in Illustrator ti consiglio di installare all'estensione gratuita **[OpenScript Panel](https://github.com/d1x3l/OpenScript-Panel)**.

## Crediti
* Codice originale a cura di Studio Gibbous.
* Estensioni UI, controlli avanzati e color picker implementati in questa repository.
