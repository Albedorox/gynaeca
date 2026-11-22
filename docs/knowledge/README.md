> Spiegel der Claude-Doc-Wissensbasis (Stand 22.11.2026, Revision 43). Die gepflegte Fassung ist das Doc: https://claude.ai/artifact/LGzBPUmMuBU2sCei2kKBA8
> Kennzeichen: [Literatur], [Praxis bestätigt], [Praxis abweichend], [Offen]. Code-Umsetzung: src/lib/knowledge.ts, src/lib/nfp.ts, src/lib/alerts.ts.

# Gynaeca Wissensbasis: Klinische Kriterien

Stand: 22.11.2026

## Zweck und Legende

Diese Wissensbasis legt fest, nach welchen klinischen Kriterien die App Blutung, Schmerz, Endometriose-Symptome, NFP und Medikation erfasst und deutet. Grundlage sind etablierte Standards aus der Literatur, die eine praktizierende Gynäkologin prüft, korrigiert und um ihr Praxisvorgehen ergänzt.

| Kennzeichen | Bedeutung |
| --- | --- |
| \[Literatur\] | Aus publizierten Standards oder Leitlinien übernommen, noch nicht praxisgeprüft |
| \[Praxis bestätigt\] | Von der Gynäkologin bestätigt oder so formuliert |
| \[Praxis abweichend\] | Die Gynäkologin geht in der Praxis anders vor; ihre Variante gilt für die App |
| \[Offen\] | Frage an die Gynäkologin, noch nicht beantwortet |

Arbeitsweise: Die Fragen werden im Projekt-Thread gestellt, wenige auf einmal. Die Antworten werden hier eingetragen und markiert. Bestätigte Kriterien werden danach ins Repository übernommen (docs/knowledge) und sind dann die Grundlage der App-Logik.

Hinweis: Die App ist ein Dokumentationswerkzeug und stellt keine Diagnosen.

## Blutungsstärke

Der verbreitetste halbquantitative Standard ist der PBAC-Score (Pictorial Blood Loss Assessment Chart, Higham 1990): Ein Zyklus mit mehr als 100 Punkten entspricht etwa mehr als 80 ml Blutverlust und gilt als starke Regelblutung. \[Literatur\]

### PBAC-Punkte pro Produkt \[Literatur\]

| Produkt | Leicht verfärbt | Mittel durchtränkt | Vollständig durchtränkt |
| --- | --- | --- | --- |
| Binde | 1 | 5 | 20 |
| Tampon | 1 | 5 | 10 |
| Koagel klein (ca. 1-Cent-Stück) | 1 |  |  |
| Koagel groß (ca. 50-Cent-Stück) | 5 |  |  |
| Überlaufen (Flooding) | 5 |  |  |

Menstruationstasse und Periodenunterwäsche kommen im Original-PBAC nicht vor. Für die Tasse wird in Studien die gemessene Menge in ml genutzt (randvolle Tasse meist 20 bis 30 ml). \[Literatur\]

### Referenzwerte eines normalen Zyklus (FIGO 2018) \[Literatur\]

| Merkmal | Normal |
| --- | --- |
| Zykluslänge | 24 bis 38 Tage |
| Blutungsdauer | bis 8 Tage |
| Schwankung der Zykluslänge | bis 7 bis 9 Tage (altersabhängig) |
| Blutverlust | ca. 5 bis 80 ml pro Zyklus |

In der Praxis definieren NICE und FIGO starke Blutung heute über die Belastung der Frau, nicht über ml: Blutung, die körperliche, soziale oder emotionale Lebensqualität einschränkt. \[Literatur\]

### Vorschlag: Bedeutung der App-Stufen 0 bis 5 \[Offen\]

Die App erfasst die Blutung pro Tag auf einer Skala von 0 bis 5 in 0,5er-Schritten. Ein Vorschlag für feste Kriterien je Stufe, angelehnt an Produktwechsel und PBAC:

| Stufe | Bezeichnung | Volle Tampons pro Tag | Weitere Kriterien | Status |
| --- | --- | --- | --- | --- |
| 0 | Keine | 0 | keine Blutung | \[Praxis bestätigt\] |
| 0,5 | Schmierblutung | 0 | nur Slipeinlage nötig, keine Binde und kein Tampon | \[Praxis bestätigt\] |
| 1 | Sehr leicht | 1 bis 2 | Tampon hält fast einen Tag, kaum Wechsel nötig | \[Praxis bestätigt\] |
| 2 | Leicht | 2 bis 3 |  | \[Praxis bestätigt\] |
| 3 | Periodenstark (normal) | 3 bis 4 | obere Grenze einer normalen Periode | \[Praxis bestätigt\] |
| 4 | Hypermenorrhoe | ab 5 | oder kleine Koagel | \[Praxis bestätigt\] |
| 5 | Hypermenorrhoe, Hb-relevant | deutlich mehr, z. B. jede halbe Stunde eine Vorlage | oder große Koagel; senkt den Hämoglobinwert | \[Praxis bestätigt\] |

Gezählt werden volle Tampons, Teilfüllungen anteilig (siehe Zählweise unten). Die Mengen sind ein Bauchgefühl-Richtwert der Gynäkologin. \[Praxis bestätigt\]

Ab Stufe 4 liegt eine Hypermenorrhoe vor; ab Stufe 5 ist sie Hb-relevant. \[Praxis bestätigt\]

### Zählweise: volle Tampons statt Wechsel \[Praxis bestätigt\]

Entscheidend ist nicht, wie oft gewechselt wird, sondern wie viele volle Tampons sich am Tag zusammenrechnen. Teilweise durchtränkte Tampons werden anteilig gezählt: zwei halb volle ergeben einen vollen.

Grund: Frauen wechseln oft, sobald das Bändchen durchtränkt ist und Blut auf der Slipeinlage erscheint. Beim Herausziehen ist der Tampon dann häufig nur am Ende verfärbt, weil Restblut beim Einführen ans Bändchen gelangt ist. Die Wechselhäufigkeit allein überschätzt deshalb die Blutung.

### Saugstärke von Tampons \[Literatur, noch zu prüfen\]

Die Saugstärke ist genormt (Syngina-Test, in Europa als Tropfen-Symbole auf der Packung). Gemessen wird mit Testflüssigkeit; Blut wird in der Praxis eher etwas weniger aufgenommen.

| Größe | Tropfen | Saugstärke |
| --- | --- | --- |
| Mini / Light | 1 | bis 6 g |
| Normal / Regular | 2 | 6 bis 9 g |
| Super | 3 | 9 bis 12 g |
| Super Plus | 4 | 12 bis 15 g |
| Ultra | 5 | 15 bis 18 g |

Daraus folgt grob: 5 volle große Tampons (Super Plus) pro Tag entsprechen etwa 60 bis 75 ml, also schon fast der Menge, die für einen ganzen normalen Zyklus gilt (bis 80 ml).

Idee für die App: Die Frau gibt Tampongröße und Füllgrad je Wechsel an (ein Viertel, halb, voll); die App rechnet daraus die vollen Tampons pro Tag und die geschätzte Menge in ml. \[Vorschlag\]

Schmierblutung heißt: Es reicht eine Slipeinlage. Von Blutung spricht man erst, wenn eine Vorlage, Binde oder ein Tampon nötig ist. \[Praxis bestätigt\]

### So fragt die Gynäkologin in der Praxis \[Praxis bestätigt\]

- Es gibt kein festes Schema. Wie genau gefragt wird, hängt davon ab, wie gut die Frau ihren Körper kennt, vom Bildungsstand und von Sprachbarrieren.
- Erste Frage, ganz einfach: Ist das eine normale Blutung, so wie Sie sie von der Periode kennen?
- Die Stärke wird nur genauer erfragt, wenn die Frau von starker Blutung oder einem Problem mit der Blutung berichtet.
- Dann: Welche Tampongröße? Wie viele Binden oder Tampons pro Tag? Wie stark durchtränkt?
- Daraus bildet sie im Kopf einen angepassten PBAC-Score. Das deckt sich inhaltlich mit dem PBAC.
- Grobes Maß: 5 durchtränkte große Tampons pro Tag sind zu viel, also über periodenstark.

Folgerung für die App: Die Erfassung sollte einfach starten (normal oder stärker als sonst) und Details wie Produktgröße und Wechselanzahl nur bei starker Blutung abfragen. \[Vorschlag\]

### Fragen an die Gynäkologin

- [ ] Wie erfragen Sie die Blutungsstärke in der Sprechstunde konkret: PBAC, Produktwechsel, Koagel, nächtliches Wechseln oder freie Selbsteinschätzung?
- [ ] Passt die vorgeschlagene Einteilung 0 bis 5? Welche Kriterien würden Sie je Stufe streichen, ändern oder ergänzen?
- [ ] Wie sollen Tasse, Periodenunterwäsche und Super-Plus-Tampons gewertet werden?
- [ ] Ab wann sprechen Sie von Schmierblutung statt Blutung, und ab wann ist eine Zwischenblutung abklärungsbedürftig?
- [ ] Welche Angaben zur Blutung wollen Sie im Arztbericht sehen (z. B. PBAC-Summe pro Zyklus, Tage mit Stufe 4 und höher, Koagel)?

## Schmerz

Standard für die Schmerzstärke ist die Numerische Rating-Skala NRS 0 bis 10 (0 = kein Schmerz, 10 = stärkster vorstellbarer Schmerz); die App nutzt sie bereits. \[Literatur\]

### Übliche Einteilung der NRS \[Literatur\]

| NRS | Einordnung | WHO-Stufenschema | Bedeutung für die App |
| --- | --- | --- | --- |
| 0 | kein Schmerz | keine Therapie |  |
| 1 bis 3 | leicht | in der Regel keine Medikamente nötig | Medikament optional |
| 4 bis 6 | mittel | ab hier Schmerzmittel; Stufe 1 (Nicht-Opioide: NSAR wie Ibuprofen oder Naproxen, Paracetamol, Metamizol), bei Bedarf Stufe 2 | ab NRS 4 Medikamente vorsehen |
| 7 bis 10 | stark | Stufe 2 (schwache Opioide plus Nicht-Opioid) bis Stufe 3 (starke Opioide) | ab NRS 4 Medikamente vorsehen |

Die Skala bleibt unverändert NRS 0 bis 10 mit der üblichen Einteilung leicht, mittel, stark. \[Praxis bestätigt\]

Ab NRS 4 sollten Medikamente ins Spiel kommen. \[Praxis bestätigt\]

Das WHO-Stufenschema (1986, ursprünglich für Tumorschmerz) beschreibt die Behandlung, nicht die Schmerzstärke selbst. Die Zuordnung leicht, mittel, stark zu den Stufen ist die übliche Lesart. \[Literatur\]

### Schmerzarten in der Gynäkologie \[Literatur\]

In der Endometriose-Diagnostik werden die Schmerzen getrennt nach Situation erfasst, jeweils mit eigener NRS (z. B. im Biberoglu-Behrman-Score und in Studien nach IMMPACT-Empfehlung):

| Begriff | Bedeutung |
| --- | --- |
| Dysmenorrhoe | Regelschmerz, während oder kurz vor der Periode |
| Unterbauchschmerz außerhalb der Periode | chronischer Beckenschmerz, zyklusunabhängig |
| Dyspareunie | Schmerz beim Geschlechtsverkehr, besonders tief |
| Dyschezie | Schmerz beim Stuhlgang |
| Dysurie | Schmerz beim Wasserlassen |
| Ovulationsschmerz (Mittelschmerz) | einseitig, um den Eisprung |

Die Schmerzarten oben sind bestätigt. Zusätzlich soll die App Rückenschmerzen gesondert erfassen, mit genauer Lage. \[Praxis bestätigt\]

### Rückenschmerz: Lage in Patientensprache \[Praxis bestätigt; oberer und mittlerer Rücken nicht nötig\]

| Auswahl in der App (Patientin) | Fachbegriff | Seite wählbar |
| --- | --- | --- |
| Unterer Rücken, mittig (Kreuz) | Lendenwirbelsäule (LWS) | nein |
| Neben dem Kreuzbein, über dem Po (bei den Grübchen) | Iliosakralgelenk (ISG) | links, rechts, beide |
| Ganz unten, über der Po-Falte | Steißbein | nein |
| Strahlt ins Bein oder in die Leiste aus | ausstrahlender Schmerz | links, rechts, beide |

Idee für die App: eine kleine Rückenansicht zum Antippen statt nur Text, damit klar ist, was gemeint ist. \[Vorschlag\]

Zusätzlich üblich: Funktionseinschränkung (z. B. Fehltage in Schule oder Arbeit, Bettlägerigkeit) und Wirkung der Schmerzmittel. \[Literatur\]

### Fragen an die Gynäkologin

- [ ] Erfassen Sie Schmerz mit NRS oder mit einer anderen Skala (VAS, verbale Stufen)?
- [ ] Welche Schmerzarten aus der Tabelle soll die App getrennt erfassen, und welche reichen als Symptom ohne Stärke?
- [ ] Ist der höchste Tageswert ausreichend, oder brauchen Sie Verlauf über den Tag (z. B. morgens, abends)?
- [ ] Wie wichtig sind Fehltage und Einschränkung im Alltag für Ihre Einschätzung?

## Endometriose-Symptome

Die deutschsprachige Leitlinie (AWMF S2k Diagnostik und Therapie der Endometriose, 2020) nennt als Leitsymptome die sechs D: Dysmenorrhoe, Dyspareunie, Dyschezie, Dysurie, Infertilität (Kinderwunsch) und chronischen Unterbauchschmerz. Diagnostisch ist ein Symptomtagebuch über mehrere Zyklen hilfreich, weil der zyklische Bezug der Beschwerden auffällt. \[Literatur\]

### Was die App dokumentieren sollte (Vorschlag) \[Offen\]

- Schmerzarten aus dem Abschnitt Schmerz, jeweils mit NRS
- Zeitpunkt im Zyklus (vor, während, nach der Periode, Zyklusmitte)
- Darm- und Blasenbeschwerden: Blähungen, Durchfall, Verstopfung, Blut im Stuhl oder Urin
- Erschöpfung (Fatigue)
- Starke Blutung und Zwischenblutungen (siehe Blutungsstärke)
- Schmerzmittelbedarf und Wirkung
- Ausfälle in Alltag, Schule, Arbeit

### Was die Gynäkologin bei Endometriose erfragt \[Praxis bestätigt\]

Endometriose-Schmerz ist mehr als Regelschmerz. Für die Erfassung gibt es etablierte Schmerzfragebögen; die App sollte folgende Punkte abdecken:

| Bereich | Was erfasst wird |
| --- | --- |
| Schmerzarten | immer Dysmenorrhoe, Dyspareunie, Dyschezie und Dysurie zusammen abfragen |
| Stärke | NRS 0 bis 10 je Schmerzart |
| Beeinträchtigung | wie stark der Schmerz den Alltag einschränkt; Krankschreibung; Absagen sozialer Verabredungen |
| Schmerzmittel | Menge und Häufigkeit, um einen Schmerzmittelübergebrauch zu erkennen |
| Zeitpunkt im Zyklus | typisch: Beginn einige Tage vor der Blutung, Höhepunkt mit Einsetzen der Blutung |
| Dauerschmerz | zyklusunabhängiger Schmerz spricht für Chronifizierung bzw. zentralisierten Schmerz |
| Schmerzcharakter | viszeral und krampfartig (wie Regelschmerz) oder neuropathisch: brennend, dauerhaft, Hinweis auf Sensibilisierung oder Nervenbeteiligung |
| Psyche und Stress | aktuelles Stresslevel (Arbeit, Familie, Freundeskreis); ob Schmerzen in entspannten Phasen, z. B. im Urlaub, geringer sind |
| Bewegung | regelmäßiger Sport, vor allem Ausdauer; mindestens moderate Bewegung wie Gehen an 3 bis 5 Tagen pro Woche für 30 Minuten |
| Entspannung und Beckenboden | Yoga (v. a. Entspannungs- oder Yin-Yoga), Beckenboden-Entspannungsübungen, Beckenboden-Physiotherapie |

Begründung: Stress und Cortisol wirken direkt auf das Schmerzerleben; Bewegung und Entspannung des Beckenbodens senken die Schmerzwahrnehmung. \[Praxis bestätigt\]

Tipp für Patientinnen, den die App direkt geben kann: mindestens 3 bis 5 Tage pro Woche je 30 Minuten moderate Bewegung, z. B. Gehen. \[Praxis bestätigt\]

Idee für die App: Neben Schmerz täglich kurz Stress (z. B. 0 bis 10), Bewegung (ja/nein oder Minuten) und Entspannung (Yoga, Beckenboden) erfassen, damit der Zusammenhang mit dem Schmerz im Bericht sichtbar wird. \[Vorschlag\]

Dauer der Dokumentation: Für die Basis-Anamnese reicht die letzte Periode und der Bericht der Patientin. Für ein genaues Verständnis braucht es 3 bis 6 Monate genaue Zyklusaufzeichnungen; besser ist ein ganzes Jahr. Je länger die Aufzeichnung, desto besser. \[Praxis bestätigt\]

Idee für die App: Der Arztbericht fasst standardmäßig die letzten 3 bis 6 Zyklen zusammen, wahlweise bis zu 12 Monate und zeigt die letzte Periode im Detail. \[Vorschlag\]

### Standard-Fragebogen für die App: AGEM-Basis-Fragebogen \[Praxis bestätigt\]

Die Gynäkologin nutzt keinen festen Fragebogen, wünscht sich aber einen als hinterlegten Standard in der App, abgeglichen mit den Arbeiten von Prof. Sylvia Mechsner (Endometriosezentrum Charité). \[Praxis bestätigt\]

Vorschlag: Die App richtet sich nach dem Basis-Fragebogen der Arbeitsgemeinschaft Endometriose (AGEM e.V., Version 2021/07). Mechsner kündigte 2021 an, dass die Arbeitsgemeinschaft einen endometriosespezifischen Schmerzfragebogen entwickelt; dieser Basis-Fragebogen wird heute u. a. an der Uniklinik Heidelberg eingesetzt. \[Literatur\]

| Bereich im AGEM-Basis-Fragebogen | In der App heute | Abdeckung |
| --- | --- | --- |
| Menstruation: Regelmäßigkeit, Stärke, Dauer, Hormone, Schmerzmittel | Blutung 0 bis 5, Verhütung, Medikation | vorhanden |
| Schmerzen je 0 bis 10: Regelschmerz, zyklisch außerhalb der Periode, azyklisch, Wasserlassen, Stuhlgang, Geschlechtsverkehr; jeweils Wirkung von Hormonen oder Schmerzmitteln | Schmerz 0 bis 10 plus Medikament | teilweise: Schmerzarten getrennt fehlen |
| Blut im Urin, Darmbeschwerden | Symptome | teilweise |
| Beeinträchtigung von Alltag, Lebensqualität, Sexualität, Stimmung (niemals bis immer) |  | fehlt |
| Komplementäre Verfahren mit Wirkung: Sport, Yoga, Physiotherapie, Osteopathie, Ernährung, Psychotherapie u. a. | Bewegung, Entspannung, Hilfsmittel, Ernährungstagebuch, Vergleich mit Schmerz | teilweise: Osteopathie und Psychotherapie fehlen |
| Modul Selbstwirksamkeit (FESS, 10 Aussagen, 0 bis 6) |  | fehlt |
| Kinderwunsch, Voroperationen, Vorerkrankungen |  | fehlt (einmalig, nicht täglich) |

Abgleich mit Mechsner (Übersicht 2024): Neben dem nozizeptiven Schmerz kommt es häufig zu zentraler Sensibilisierung (noziplastischer Schmerz). Dann treten zusätzlich azyklische Unterbauchschmerzen, ausstrahlende Schmerzen, unspezifische Blasen- und Darmbeschwerden und Depression auf. Sie empfiehlt eine multimodale Therapie mit Schmerztherapie, Psychologie, Physiotherapie und Osteopathie. Das deckt sich mit den Angaben der Gynäkologin. \[Literatur\]

Zusätzlich nach Mechsner: auf vegetative Begleiterscheinungen bei starken Schmerzen achten (Durchfall, Erbrechen, Kopfschmerzen). \[Literatur\]

Der Beckenboden kommt im AGEM-Fragebogen nicht vor; er sollte nach Angabe der Gynäkologin ergänzt werden. \[Praxis bestätigt\]

### Selbstfürsorge und Ernährung bei Endometriose \[Projektvorgabe 2026-11-22; Bestätigung durch die Gynäkologin offen\]

Ernährung, Bewegung, Entspannung und Wärme sind keine Therapie der Endometriose, beeinflussen aber Entzündung, Stress und Schmerzerleben. Die App erfasst sie deshalb täglich, an jedem Tag und nicht nur während der Periode, und stellt sie dem Schmerz gegenüber.

**Ernährung.** Empfohlen wird eine angepasste mediterrane Ernährung:

| Mehr davon | Eher meiden |
| --- | --- |
| viel frisches Gemüse und Obst | rotes Fleisch und Wurst |
| Vollkorn, Hülsenfrüchte | Zucker, Kuchen, Süßigkeiten |
| Fisch (Omega-3-Fettsäuren) | Fertigessen, Fast Food, Weißmehl |
| Olivenöl, Nüsse und Samen | Alkohol, viel Kaffee |
| Kräutertee, ausreichend trinken (ca. 1,5 l) | individuell: Milchprodukte, scharfe Speisen, Gluten |

Entzündungshemmend wirken als Ergänzung: Omega-3, Vitamin D3, Kurkuma, Ingwer und Bromelain (aus Ananas). Dosierung und Einnahme bitte mit der Praxis absprechen, vor allem bei Gerinnungshemmern (Omega-3, Kurkuma, Ingwer, Bromelain) und bei Vitamin D3 (Spiegel bestimmen lassen). \[Literatur: Hinweis zu Wechselwirkungen\]

Die Wirkung einzelner Lebensmittel ist bei Endometriose nur begrenzt durch Studien belegt; ein Ernährungstagebuch hilft, persönliche Auslöser zu erkennen, z. B. Blähbauch (Endo-Belly) oder mehr Schmerz nach einem „Cheat Day“. \[Literatur\]

**Bewegung.** Mindestens 3 bis 5 Tage pro Woche je 30 Minuten moderate Bewegung (siehe oben). \[Praxis bestätigt\]

**Entspannung und Achtsamkeit.** Atemübungen, Meditation, progressive Muskelentspannung, Bodyscan und Achtsamkeitsübungen senken Stress und das Stresshormon Cortisol und damit das Schmerzerleben. \[Praxis bestätigt: Stress und Cortisol wirken auf das Schmerzerleben\]

**Hilfsmittel.** Wärme (Wärmepflaster, Wärmflasche, Körnerkissen, warmes Bad) entspannt die Beckenmuskulatur und lindert krampfartige Schmerzen; dazu TENS-Gerät und Massage. Viele nutzen Wärme auch außerhalb der Periode. \[Literatur\]

Umsetzung in der App (Endometriose-Modul):

- Tagesansicht: Bewegung in Minuten mit Wochenziel, Bewegungsart, Entspannungsübungen, Stress 0 bis 10, Hilfsmittel, Ernährung (günstig / eher meiden), Ergänzungsmittel, Getrunkenes, Mahlzeiten als Freitext, Verträglichkeit und ein Schalter „Cheat Day“.
- Kurze geführte Übungen: Atmen (4 s ein, 6 s aus) und 5-4-3-2-1-Achtsamkeit; nach Abschluss automatisch eingetragen.
- Endometriose-Tagebuch: Monatskalender je Bereich mit Schmerz und Blutung, Ernährungstagebuch, Vergleich des Schmerzes an Tagen mit und ohne Faktor (Cheat Day bzw. ungünstige Ernährung zählt auch für den Folgetag). Der Vergleich erscheint erst ab je 3 Tagen und ist als Hinweis, nicht als Beweis gekennzeichnet.
- Arztbericht und CSV enthalten Zusammenfassung und Tageswerte.

### Fragen an die Gynäkologin

- [ ] Welche Symptome fragen Sie bei Verdacht auf Endometriose standardmäßig ab, und welche fehlen in der Liste?
- [ ] Nutzen Sie einen festen Fragebogen (z. B. Endometriose-Fragebogen der Stiftung Endometriose-Forschung, EHP-30)?
- [ ] Wie viele Zyklen Dokumentation sind für Sie aussagekräftig?
- [ ] Welche Kombinationen von Symptomen sind für Sie ein deutlicher Hinweis, den die App hervorheben sollte?
- [ ] Stimmen die Listen „mehr davon / eher meiden“ und die Ergänzungsmittel? Sollen Dosierungen hinterlegt werden?

## NFP nach Sensiplan

Sensiplan (Arbeitsgruppe NFP, Malteser) ist im deutschsprachigen Raum der Standard der symptothermalen Methode: Die unfruchtbare Zeit nach dem Eisprung beginnt erst, wenn Temperatur und Zervixschleim beide ausgewertet sind (doppelte Kontrolle). \[Literatur\]

### Auswerteregeln \[Literatur\]

| Zeichen | Regel |
| --- | --- |
| Temperatur | Erste höhere Messung ist ausgewertet, wenn 3 aufeinanderfolgende Werte höher liegen als die 6 Werte davor und der dritte mindestens 0,2 °C über dem höchsten der 6 tieferen liegt. Ausnahmeregeln: 1. erlaubt einen vierten Wert, wenn der dritte die 0,2 °C nicht erreicht; 2. erlaubt, dass einer der drei Werte auf oder unter die Hilfslinie fällt. |
| Zervixschleim | Höhepunkt ist der letzte Tag mit der besten Schleimqualität (S+, glasig, spinnbar). Ausgewertet am Abend des dritten Tages nach dem Höhepunkt. |
| Ende fruchtbare Zeit | am Abend des Tages, an dem beide Zeichen ausgewertet sind (das spätere zählt) |
| Beginn fruchtbare Zeit | 5-Tage-Regel (erste 5 Zyklustage unfruchtbar, wenn keine Schleimbeobachtung) oder Minus-8-Regel (frühester Temperaturanstieg der letzten 12 Zyklen minus 8) |
| Störfaktoren | Werte nach Krankheit, Alkohol, kurzer Nacht, abweichender Messzeit werden ausgeklammert |

LH-Tests sind kein Teil von Sensiplan. Sie zeigen den LH-Anstieg 24 bis 36 Stunden vor dem Eisprung und können ergänzend dokumentiert werden. \[Literatur\]

### Vorgaben der Gynäkologin für NFP in der App \[Praxis bestätigt\]

- Die Sensiplan-Regeln werden vollständig umgesetzt. Die Stärke liegt in der Kombination: Temperatur, Zervixschleim, Kalenderregel, Muttermund und, wenn vorhanden, LH-Test.
- Muttermund ergänzen: Stellung und Öffnung (und Festigkeit), wenn die Frau ihn ertasten kann.
- In den Einstellungen wählbar, welche Zeichen in die Berechnung der fruchtbaren und unfruchtbaren Tage eingehen.
- Deutlicher Disclaimer: Anwendung in eigener Verantwortung, keine sichere Verhütungsmethode ohne eigene Studie.
- Ziel: Die App soll einen eigenen Pearl-Index bei Befolgung aller Regeln bekommen; dafür ist eine Studie nötig.
- Das Zyklusblatt soll wie die Sensiplan-Datenblätter zum Ausdrucken und Selbstausfüllen verfügbar sein, damit die Frau selbst nachrechnen kann.
- LH-Test: Anleitung in der App (siehe Anwendung von LH-Tests unten). Bei Kinderwunsch und unregelmäßigem Zyklus sehr wichtig.
- Optional Foto vom LH-Test, dann aber mit Beispielfotos positiver und negativer Tests; die Bewertung bleibt bei der Frau.

### Methode der App: Kombination und fruchtbares Fenster \[Praxis bestätigt\]

Die App kombiniert Temperatur, Zervixschleim, Kalenderregel, Muttermund (optional) und LH-Test (optional). Ergebnis ist ein möglichst genaues fruchtbares Fenster, das drei Zwecken dient:

- Kinderwunsch planen und umsetzen: Geschlechtsverkehr gezielt in die fruchtbaren Tage legen
- Natürliche Verhütung: in den fruchtbaren Tagen Kondom oder andere Barrieremethode oder Enthaltsamkeit
- Außerhalb des Fensters: unfruchtbare Tage, wenn alle gewählten Zeichen ausgewertet sind

### Zervixschleim richtig beobachten

| Punkt | Inhalt | Status |
| --- | --- | --- |
| Standard in der App | Zervixschleim direkt mit zwei Fingern am Muttermund abnehmen. Die Abnahme am Scheideneingang ist laut BVF und DGGG unsicher ([Frauenärzte im Netz](https://www.frauenaerzte-im-netz.de/familienplanung-verhuetung/natuerliche-familienplanung/wie-messe-ich-den-zervixschleim/)). | \[Praxis bestätigt\] und \[Literatur\] |
| Grund | Am Scheideneingang mischt sich Vaginalsekret bei. Bei sexueller Erregung entsteht mehr Vaginalsekret, das einen Eisprung vortäuschen kann. | \[Praxis bestätigt\] |
| Vereinfachte Beobachtung | Empfinden am Scheideneingang und Aussehen beim Abwischen oder in der Unterhose; ohne Slipeinlage. Möglich, aber weniger sicher. So beschreiben es das Gesundheitsportal Österreich und die Billings-Methode. | \[Praxis bestätigt, als Zusatz\] |
| Verlauf | nach der Periode trocken; dann gelblich, fest, klebrig oder krümelig; zum Eisprung mehr, glasig, durchsichtig, spinnbar bis Fingerlänge; nach dem Eisprung wieder fest, gelblich, klebrig und weniger | \[Literatur\] und \[Praxis bestätigt\] |
| Unfruchtbar | ab dem 4. Tag nach dem Schleimhöhepunkt, wenn auch die Temperatur ausgewertet ist | \[Literatur\] |
| Muttermund tasten | Finger an der vorderen Scheidenwand einführen; rundliche Struktur mit Grübchen. Nach der Periode geschlossen und fest; zum Eisprung weicher, Grübchen fast kleinfingerweit offen; danach wieder fest und kaum tastbar ([Frauenärzte im Netz](https://www.frauenaerzte-im-netz.de/familienplanung-verhuetung/natuerliche-familienplanung/wie-kann-ich-die-festigkeit-des-muttermundes-feststellen/)) | \[Literatur\] |

Temperatur messen laut BVF ([Frauenärzte im Netz](https://www.frauenaerzte-im-netz.de/familienplanung-verhuetung/natuerliche-familienplanung/wie-messe-ich-meine-koerpertemperatur/)): direkt nach dem Aufwachen vor dem Aufstehen, nach mindestens 1 Stunde Ruhe; rektal am wenigsten störanfällig, oral oder vaginal möglich, nicht unter dem Arm oder im Ohr; Thermometer mit 0,05 °C Auflösung und CE-Zeichen; immer am selben Ort. Störfaktoren: spät ins Bett, Alkohol, Sport am Abend, Infekt, Stress, Reisen, Schichtdienst. \[Literatur\]

Hinweise für den Disclaimer laut BVF: kein Schutz vor sexuell übertragbaren Krankheiten; sicher nur ohne ungeschützten Verkehr in der fruchtbaren Phase; Deuten der Zeichen dauert meist mehrere Zyklen; bei Mädchen bis etwa 18 Jahre ist die Temperaturmessung nicht zuverlässig genug. \[Literatur\]

Kalendermethoden allein (z. B. Knaus-Ogino) zählen laut BVF „nicht mehr zu den seriösen Verfahren“ ([Methodenübersicht](https://www.frauenaerzte-im-netz.de/familienplanung-verhuetung/natuerliche-familienplanung/fruchtbare-tage-selbst-bestimmen-methoden/)). In der App dient eine Kalenderregel deshalb nur zur Absicherung des Beginns der fruchtbaren Zeit, nie allein. \[Literatur\]

### Kalenderregel: 5-Tage- und Minus-8-Regel \[Praxis bestätigt\]

Die App nutzt die Kalenderregeln der deutschen NFP, wie sie auch myNFP umsetzt; Knaus-Ogino wird nicht verwendet. Zweck: Die Regeln legen fest, wie viele Tage am Zyklusanfang ohne Schleimbeobachtung als unfruchtbar gelten, damit die Frau nicht an allen Tagen beobachten muss. \[Praxis bestätigt\]

| Regel | Wann | Letzter unfruchtbarer Tag am Zyklusanfang |
| --- | --- | --- |
| Erster Zyklus mit NFP | immer | keiner: fruchtbar ab Zyklustag 1 |
| 5-Tage-Regel | Einsteigerin, wenn im Vorzyklus eine erste höhere Messung ausgewertet wurde | Zyklustag 5 |
| Minus-8 (Verkürzung) | sobald in einem Zyklus die erste höhere Messung vor Zyklustag 13 lag | früheste erste höhere Messung minus 8; gilt dauerhaft, auch vor 12 Zyklen |
| Minus-8 (Verlängerung) | ab 12 ausgewerteten Zyklen | früheste erste höhere Messung aller Zyklen minus 8 |
| Minus-20 | nur mit Menstruationskalender der letzten 12 Zyklen ohne hormonelle Verhütung; nur bedingt empfehlenswert | kürzester Zyklus minus 20 |
| Doppelte Kontrolle | gilt immer | Bei Schleim f, S oder S+ beginnt die fruchtbare Zeit sofort, auch wenn eine Kalenderregel noch Unfruchtbarkeit ergibt |

Quelle: [myNFP: Unfruchtbarkeit am Zyklusanfang](https://www.mynfp.de/unfruchtbarkeit-am-zyklusanfang). \[Literatur\]

### Temperaturauswertung im Detail \[Literatur\]

- Regulär: 6 zusammenhängende niedrige Werte, dann die erste höhere Messung, dann 3 Werte über der Hilfslinie (höchster der 6 Werte); der 3. Wert mindestens 0,2 °C darüber.
- Ausnahmeregel 1 (flacher Anstieg): Erreicht der 3. Wert die 0,2 °C nicht, wird ein 4. Wert abgewartet, der nur über der Hilfslinie liegen muss.
- Ausnahmeregel 2 (Absacker): Fällt der 2. oder 3. Wert auf oder unter die Hilfslinie, bleibt er unberücksichtigt; ein zusätzlicher Wert muss 0,2 °C darüber liegen.
- Die beiden Ausnahmeregeln dürfen nicht kombiniert werden.
- Werte auf 0,05 °C runden. Ausklammern nur nach oben gestörter Werte und nur in der Tieflage.
- Nach Absetzen der Pille gilt eine strengere Auswertung (ein zusätzlicher Wert).
- Unfruchtbar ab dem Abend des Tages, an dem Temperatur und Schleim beide ausgewertet sind.

Quellen: [myNFP: Temperatur auswerten](https://www.mynfp.de/temperatur-auswerten) mit 14 Beispielzyklen, [Temperatur und Zervixschleim kombinieren](https://www.mynfp.de/temperatur-und-zervixschleim-kombinieren) mit 4 Beispielen.

Beispielzyklen und Zyklusblätter: Die App bekommt eigene Lernbeispiele zu denselben Fällen (regulär, Lücken, Ausnahmeregel 1 und 2, unzulässige Kombination, Krankheit, instabile Kurve, unklarer Anstieg, Kombination mit Schleim, nach der Pille) und ein eigenes druckbares Zyklusblatt. Die Bilder und Blätter von myNFP sind urheberrechtlich geschützt (© myNFP GmbH, keine freie Lizenz gefunden) und werden nicht kopiert, sondern in abgewandelter Form neu erstellt. \[Praxis bestätigt\]

myNFP kostet 14,99 € für 3 Monate, 39,99 € im Jahr oder einmalig 129 € ([Preise](https://www.mynfp.de/preise)).

Weitere Vorgaben aus der myNFP-Gebrauchsanleitung (Ausgabe 22.0, Oktober 2026) \[Literatur\]:

- Thermometer mit zwei Nachkommastellen und mindestens 0,05 °C Auflösung
- Messort, Messdauer und Messverfahren nur zu Beginn eines neuen Zyklus wechseln, nie innerhalb eines Zyklus
- Ausgeklammerte Temperaturwerte werden im Zyklusblatt grau dargestellt
- Strenge Auswertung: vom möglichen Schleimhöhepunkt bis zum Ende der Temperaturauswertung an jedem Tag ein Eintrag; laxe Auswertung: ein fehlender Tag zählt wie die schlechteste Schleimqualität
- Unfruchtbar nach dem Eisprung erst, wenn auch die Temperaturauswertung abgeschlossen ist
- Hinweis an die Nutzerin, wenn der Schleimhöhepunkt mehr als 5 Tage vor oder mehr als 3 Tage nach der ersten höheren Messung liegt
- Nicht anwendbar bei hormoneller Verhütung oder hormonell wirkenden Medikamenten; Aufzeichnung erst nach Absetzen beginnen
- Zielgruppe: Frauen von 18 bis 45 Jahren mit natürlichem Zyklus
- Ausgewertete Zyklen muss die Anwenderin selbst auf Plausibilität prüfen

Die genauen Regeltexte stehen nicht in der myNFP-Anleitung, sondern im Praxisbuch „Natürlich & Sicher“ (TRIAS). Vor der Umsetzung sollten die mit „Fachwissen“ markierten Zeilen dort geprüft werden. \[Offen\]

Leitlinie: Die deutschsprachige Leitlinie zur nicht hormonellen Empfängnisverhütung (AWMF 015-095) empfiehlt nur symptothermale Methoden mit hoher Effektivität; Methodensicherheit 0,4, Gebrauchssicherheit 1,8 bis 2,3 ([Pharmazeutische Zeitung 2024](https://www.pharmazeutische-zeitung.de/sicher-verhueten-ohne-hormone-145371/seite/alle/?cHash=980138d18314265f2f7f653651d070c3)). \[Literatur\]

#### Kalenderregeln im Überblick \[Literatur\]

| Regel | Formel | Verwendet in |
| --- | --- | --- |
| Knaus-Ogino | Eisprung etwa 14 Tage vor der nächsten Periode; fruchtbar ca. Zyklustag 12 bis 16 (28-Tage-Zyklus) | reine Kalendermethode, 1920er |
| Minus-18 / Minus-11 | erster fruchtbarer Tag = kürzester Zyklus minus 18; letzter = längster Zyklus minus 11 | Rhythmusmethode |
| Minus-20 / Minus-21 | letzter unfruchtbarer Tag am Zyklusanfang = kürzester Zyklus minus 20 bzw. 21 | symptothermale Schulen, z. B. ältere NFP-Zyklusblätter |
| Döring-Regel | früheste erste höhere Messung der bisherigen Zyklen minus 7 | Temperaturmethode (Döring 1967) |
| Minus-8-Regel | früheste erste höhere Messung der letzten 12 Zyklen minus 8 | deutsche NFP / Sensiplan |
| 5-Tage-Regel | die ersten 5 Zyklustage gelten als unfruchtbar | deutsche NFP / Sensiplan (Einstieg) |
| Standard Days Method | Tag 8 bis 19 fruchtbar; nur für Zyklen von 26 bis 32 Tagen | CycleBeads, Georgetown University |

Quellen: [AAFP 2012](https://www.aafp.org/pubs/afp/issues/2012/1115/p924.html), [DocCheck Zeitwahlmethode](https://flexikon.doccheck.com/de/Zeitwahlmethode), [Wikipedia Rhythm Method](https://en.wikipedia.org/wiki/Rhythm_Method), [Wikipedia Fertility awareness](https://wikiwand.com/en/Fertility_awareness). Minus-20, Minus-8 und 5-Tage-Regel sind dort nicht beschrieben, sondern aus Fachwissen ergänzt; die Döring-Zuordnung ist aus der Literaturliste erschlossen.

#### Sicherheit der NFP-Methoden \[Literatur\]

Nicht nur Sensiplan hat Daten. Für mehrere Methoden gibt es Studien; angegeben ist der Anteil Frauen mit ungewollter Schwangerschaft im ersten Jahr ([AAFP 2012](https://www.aafp.org/pubs/afp/issues/2012/1115/p924.html)):

| Methode | Perfekte Anwendung | Typische Anwendung |
| --- | --- | --- |
| Symptothermal (u. a. Sensiplan) | unter 1 % (Sensiplan: Pearl 0,4) | 2 bis 8 % |
| Creighton (nur Schleim, standardisiert) | 1 % oder weniger | 2 bis 5 % |
| Marquette (Hormonmonitor) | 1 bis 2 % | 11 bis 14 % |
| Billings (nur Schleim) | 3 % | 3 bis 22 % |
| TwoDay (nur Schleim) | 4 % | 14 % |
| Standard Days (Kalender) | 5 % | 8 bis 25 % |
| Kalendermethode |  | ca. 24 bis 25 % |

Sensiplan hat die beste Datenlage, weil die deutsche Arbeitsgruppe seit den 1980er Jahren eine eigene Kohortenstudie führt (Frank-Herrmann 1991 und 2007).

#### Geschichte der deutschen NFP \[Literatur\]

- 1981 gegründet als Arbeitsgruppe NFP (Natürliche Familienplanung) auf Beschluss der Deutschen Bischofskonferenz; 1984 bis 1991 Modellprojekt mit Prof. Günter Freundl
- seit 1991 bei den Maltesern, seit 2021 unter dem Dach der Malteser Werke gGmbH
- Praxisbuch „Natürlich und sicher“; Website www.nfp-online.de (erste Homepage 1997)
- Die Methode hieß zunächst einfach NFP und trägt heute den Markennamen Sensiplan; nfp-online.de und sensiplan.de sollten 2021/2022 zusammengelegt werden

Quelle: [40 Jahre Arbeitsgruppe NFP](https://sensiplan.profilschmiede.de/storage/media/documents/199/211220-40-jahre-nfp.pdf), Festschrift 2021. Die Website, die die Gynäkologin vor etwa 10 Jahren genutzt hat, war vermutlich nfp-online.de, also dieselbe Methode unter dem alten Namen.

### Anwendung von LH-Tests \[Literatur, Packungsbeilagen; Praxis bestätigt\]

Die meisten Packungsbeilagen werten einen Test als positiv, wenn die Testlinie gleich dunkel oder dunkler als die Kontrolllinie ist. Einzelne Hersteller verlangen eine dunklere Linie; maßgeblich ist immer die Beilage des verwendeten Tests.

| Punkt | Angabe | Quelle |
| --- | --- | --- |
| Positiv | Testlinie gleich dunkel oder dunkler als Kontrolllinie | [mö-screen](https://www.onlineapo.at/uploads/leaflets/4891390_moe-screen-LH-Ovulationstest.pdf), [Mediherz](https://www.mediherz-shop.de/images/products/mediherz/beipackzettel/19109225.pdf), [ZuhauseTEST](https://cdn.shopify.com/s/files/1/1705/8705/files/ZuhauseTEST_Ovulation_PB_DE.pdf) |
| Positiv (strenger) | nur, wenn die Testlinie dunkler ist | [ACON Distinct FAQ](https://www.aconlabs.com/wp-content/uploads/2021/07/2210031801-Distinct-CE-Ovulation-LH-Test-FAQ.pdf) |
| Negativ | Testlinie heller als Kontrolllinie oder fehlt | alle Beilagen |
| Ungültig | keine Kontrolllinie | alle Beilagen |
| Uhrzeit | täglich zur gleichen Zeit; nicht der erste Morgenurin; mö-screen: zwischen 10 und 20 Uhr, am besten nach 12 Uhr | mö-screen, ACON, Mediherz |
| Trinken | etwa 2 Stunden vorher wenig trinken | mö-screen, ZuhauseTEST, ACON |
| Ablesen | nach 5 Minuten, nicht mehr nach 10 Minuten | mö-screen, ZuhauseTEST, ACON |
| Testbeginn | nach Zykluslänge laut Tabelle der Beilage, z. B. bei 28 Tagen ab Zyklustag 11 bis 13 | ZuhauseTEST, mö-screen |
| Eisprung nach positivem Test | meist innerhalb von 24 bis 36 Stunden, teils bis 48 Stunden | alle Beilagen |
| Einschränkungen | nicht zur Verhütung; unzuverlässig bei Schwangerschaft, Menopause, hormoneller Verhütung und Hormonbehandlung mit hCG oder LH | alle Beilagen |

Die Empfehlung der Gynäkologin, mittags zu testen, deckt sich mit den Beilagen. \[Praxis bestätigt\]

Für die App: Beispielfotos für positiv, negativ und ungültig zeigen und darauf hinweisen, dass die Beilage des eigenen Tests gilt. \[Vorschlag\]

### Abgleich mit den Sensiplan-Regeln \[Literatur, Teile noch zu prüfen\]

| Punkt | Stand |
| --- | --- |
| Kalenderanteil | In Sensiplan ist die Kalenderkomponente die 5-Tage- bzw. Minus-8-Regel für den Beginn der fruchtbaren Zeit, nicht die Knaus-Ogino-Methode. Flexikon beschreibt Sensiplan als Weiterentwicklung von Billings- und Temperaturmethode. |
| Zahl der Zyklen | Minus-8-Regel nach meinem Kenntnisstand ab 12 dokumentierten Zyklen, davor 5-Tage-Regel. Im Original noch zu prüfen. |
| Regelmäßiger Zyklus | Nach meinem Kenntnisstand ist Sensiplan gerade auch für unregelmäßige Zyklen geeignet, weil jeder Zyklus einzeln ausgewertet wird. Noch zu prüfen. |
| Temperaturanstieg | Auswerteschwelle ist 0,2 °C (dritte höhere Messung gegenüber den 6 tieferen); der tatsächliche Anstieg liegt meist bei 0,2 bis 0,6 °C. |
| Muttermund | Im Sensiplan-Zyklusblatt mit den Zeilen Lage und Öffnung sowie Festigkeit vorgesehen. Ob er den Schleim in der doppelten Kontrolle ersetzen darf: noch zu prüfen. |
| Zyklusblatt | Die offiziellen Zyklusblätter vertreibt die Arbeitsgruppe NFP (Malteser); ein freier Download wurde nicht gefunden. |

### Zulassung und Pearl-Index \[Literatur\]

- Eine App, die als Verhütungsmittel beworben wird, ist nach EU-Medizinprodukteverordnung (MDR, Regel 15) in der Regel ein Medizinprodukt der Klasse IIb. Das heißt benannte Stelle, klinische Bewertung, Qualitätsmanagement, CE-Kennzeichnung und Marktüberwachung.
- Die Sensiplan-App myNFP ist nur Klasse I und schreibt ausdrücklich, sie sei kein Verhütungsmittel.
- Referenzwert Sensiplan: Pearl-Index 0,4 bei strikter Anwendung der Regeln (Frank-Herrmann et al., Hum Reprod 2007).
- Name und Regeln: siehe Abschnitt Benennung und Schutzrechte.

### Benennung und Schutzrechte

Die App nennt die Methode „natürliche Familienplanung (symptothermale Methode)“, nicht Sensiplan. \[Praxis bestätigt\]

- Marke: Sensiplan gehört den Malteser Werken (MW Malteser Werke gGmbH, Köln). In den USA lief eine Eintragung von 2016 für Druckwerke und Beratung; 2025 wurde eine neue Anmeldung eingereicht, die ausdrücklich auch Apps und Lernsoftware zur natürlichen Verhütung umfasst ([US-Anmeldung](https://markinton.com/trademark/sensiplan-79439718), [US-Eintragung 2016](https://trademarkdir.com/trademark/sensiplan-79175017)). Eine internationale Anmeldung setzt eine Heimatmarke voraus; der Stand in Deutschland und der EU (DPMA, EUIPO) ist noch nicht geprüft. Den Namen deshalb nicht verwenden. \[Literatur\]
- Regeln: Nach allgemeinem Grundsatz des Urheberrechts sind Methoden, Ideen und Regeln selbst nicht geschützt, nur ihre konkrete Darstellung (Texte, Grafiken, Zyklusblatt-Layout). Das konnte ich nicht an einer Quelle belegen; vor dem Start rechtlich prüfen lassen. Die App formuliert die Regeln deshalb in eigenen Worten und nutzt ein eigenes Zyklusblatt-Design. \[Offen\]

### Pearl-Index im Vergleich \[Literatur\]

| Methode | Pearl-Index | Quelle |
| --- | --- | --- |
| Symptothermale Methode, strikte Anwendung | 0,4 | Frank-Herrmann 2007 (über [Flexikon](https://flexikon.doccheck.com/de/Symptothermale_Methode)) |
| Minipille je nach Wirkstoff | 0,4 bis 4,1 | [Apotheken Umschau](https://www.apotheken-umschau.de/gesund-bleiben/sex/verhuetung-die-pille-707733.html), 2026 |
| Minipille mit Desogestrel | 0,41 (korrekt angewendet 0,14) | [Gesundheitslexikon](https://www.gesundheits-lexikon.com/Frauengesundheit/Empfaengnisverhuetung/Sicherheit-der-Kontrazeptionsmethoden-Pearl-Index), 2024 |
| Mikropille (Kombinationspille) | 0,1 bis 0,9 | Apotheken Umschau |
| Hormonspirale | 0,2 | Gesundheitslexikon |
| Kondom (Mann) | 2 bis 15 | Gesundheitslexikon |
| Kalendermethode (Knaus-Ogino) | 10 bis 40 | Gesundheitslexikon |

Bei strikter Anwendung ist die symptothermale Methode so sicher wie die beste Minipille und sicherer als klassische Minipillen. \[Literatur\]

### Vergleich: Datenblatt, Zykluscomputer, Wearables, Gynaeca \[Literatur\]

Die belastbarste Zahl gibt es für die selbst ausgewertete symptothermale Methode (Pearl-Index 0,4 bei strikter Anwendung). Geräte und Wearables messen meist nur ein Zeichen (Temperatur, teils Puls) und stützen sich auf Herstellerstudien mit kleinen Gruppen.

| Lösung | Misst | Zweck laut Hersteller | Zulassung | Sicherheit laut Quelle | Schwächen |
| --- | --- | --- | --- | --- | --- |
| Sensiplan-Datenblatt (selbst ausgefüllt) | Temperatur, Schleim, Muttermund, Kalenderregel | Verhütung und Kinderwunsch | keine nötig | Pearl-Index 0,4 bei strikter Anwendung | Lernaufwand, Kurs empfohlen |
| [Daysy](https://www.presseportal.ch/de/download/document/5aaa1d7444000095b0c40f01-daysy-studie-kurz-de.pdf) (Zykluscomputer) | Aufwachtemperatur im Mund | Verhütung und Kinderwunsch | CE (Klasse nicht geprüft) | Pearl-Index praktisch 1,3 (Herstellerstudie) | nur Temperatur; Befragung mit 13 % Rücklauf, 125 Frauen, 2 Schwangerschaften |
| Lady-Comp (Zykluscomputer) | Aufwachtemperatur | Verhütung | CE (Klasse nicht geprüft) | Pearl-Index praktisch 3,8 (zitiert in der Daysy-Studie) | nur Temperatur |
| [Ava-Armband](https://prnewswire.com/news-releases/ava-announces-fda-clearance-for-ava-fertility-tracker-301224882.html) | Hauttemperatur, Puls, Atmung, Schlaf | nur Kinderwunsch, ausdrücklich keine Verhütung | FDA 510(k) 2021 | ca. 90 % für das fruchtbare Fenster (Herstellerangabe) | nicht zur Verhütung |
| [Natural Cycles mit Oura-Ring](https://www.engadget.com/natural-cycles-fda-wearable-clearance-232422042.html) | Hauttemperatur (Ring) | Verhütung | FDA 2021 | 93 % typisch, 98 % perfekt (Hersteller) | Validierung mit 40 Frauen; Hauttemperatur ist nicht Körperkerntemperatur ([Scientific American](https://www.scientificamerican.com/article/should-smart-rings-be-used-as-birth-control/)) |
| Gynaeca (geplant) | alle Sensiplan-Zeichen plus LH, Schmerz, Blutung, Endometriose | Dokumentation; Verhütung erst nach eigener Studie | keine (Klasse IIb nötig für Verhütungsanspruch) | noch keine | Studie und Zulassung offen |

Ein systematischer Review zu Wearables ([JMIR 2024](https://www.jmir.org/2024/1/e45139)) fand 13 meist kleine Pilotstudien ohne randomisierte Studien; die Genauigkeit lag je nach Gerät bei 62 bis 92 % und war bei unregelmäßigen Zyklen schlechter.

Was Gynaeca anders macht: alle Zeichen kombiniert statt nur Temperatur, kein Gerätekauf, Auswertung nachvollziehbar wie auf dem Papier, dazu Schmerz-, Blutungs- und Endometriose-Dokumentation für den Arztbericht.

Die Einschätzung der Gynäkologin: Selbst ausgefüllte Datenblätter sind genauer und mindestens so sicher wie gekaufte Geräte. Die Quellen stützen das, soweit Zahlen vorliegen. \[Praxis bestätigt\]

### Fragen an die Gynäkologin

- [ ] Soll die App die Sensiplan-Regeln automatisch auswerten oder nur die Kurve zeigen? Haftungs- und Sicherheitsfrage, wenn die App zur Verhütung genutzt wird.
- [ ] Welche Schleimkategorien nutzen Sie in der Beratung (Sensiplan: t, Ø, f, S, S+)?
- [ ] Wie bewerten Sie LH-Tests im Vergleich zur Temperatur, etwa bei Kinderwunsch oder unregelmäßigen Zyklen?
- [ ] Welche Angaben zur Zyklusmitte (Temperaturanstieg, Lutealphasenlänge) wollen Sie im Arztbericht sehen?

## Medikation und Verhütung

Für die Auswertung zählen bei Schmerzmitteln Wirkstoff, Dosis, Zeitpunkt und Wirkung; bei Verhütung die Methode und ihr typischer Einfluss auf die Blutung. \[Literatur\]

### Schmerzmittel dokumentieren (Vorschlag) \[Offen\]

| Feld | Beispiel |
| --- | --- |
| Wirkstoff | Ibuprofen, Naproxen, Paracetamol, Metamizol, Butylscopolamin |
| Dosis pro Einnahme | 400 mg |
| Uhrzeit | 08:30 |
| Wirkung | NRS vorher und etwa 1 bis 2 Stunden danach |

NSAR (Ibuprofen, Naproxen) sind Mittel der ersten Wahl bei primärer Dysmenorrhoe und senken zusätzlich den Blutverlust. \[Literatur\]

### Verhütung und Blutungsmuster \[Literatur\]

| Methode | Typischer Einfluss auf die Blutung |
| --- | --- |
| Kombinierte Pille, Ring, Pflaster | schwächere Abbruchblutung in der Pause, im Langzyklus Durchbruchblutungen möglich |
| Gestagen-Pille, Implantat, Dreimonatsspritze | unregelmäßige Blutungen oder Amenorrhoe |
| Hormonspirale (Levonorgestrel) | anfangs Schmierblutungen, später oft sehr schwach oder keine Blutung |
| Kupferspirale | oft stärkere und längere Blutung, mehr Regelschmerz |
| Ohne Hormone (NFP, Kondom) | natürlicher Zyklus |

Unter hormoneller Verhütung ist die Blutung keine echte Menstruation, und NFP-Auswertung ist nicht möglich. \[Literatur\]

### Regelmäßige gynäkologische Medikamente \[Projektvorgabe 2026-11-22\]

Mittel, die über Wochen genommen werden, erfasst die App wie die Verhütung als Einnahmezeitraum (Beginn, Ende, Dosis frei), aber mehrere gleichzeitig. Beispiele: Agnus castus (Mönchspfeffer, z. B. Agnucaston) zur Zyklusregulierung, Dienogest, Progesteron, Eisen. Sie beeinflussen die NFP-Auswertung nicht automatisch; Gestagene wie Dienogest unterdrücken aber meist den Eisprung, die Auswertung ist dann nicht aussagekräftig. \[Literatur\]

### Geschlechtsverkehr \[Projektvorgabe 2026-11-22\]

Für Verhütung und Kinderwunsch erfasst die App Geschlechtsverkehr pro Tag: ungeschützt, mit Kondom oder ausdrücklich keiner. An laut NFP möglicherweise fruchtbaren Tagen weist die App bei ungeschütztem GV darauf hin. Schmerz beim GV (Dyspareunie) bleibt eine eigene Schmerzart. Im Bericht erscheinen die Anzahl der Tage und die ungeschützten Tage.

### Fragen an die Gynäkologin

- [ ] Welche Medikamentenangaben brauchen Sie wirklich, und reicht eine Auswahlliste mit freiem Feld?
- [ ] Sollen weitere Medikamente erfasst werden (z. B. Dienogest, GnRH-Analoga, Tranexamsäure, Eisen)?
- [ ] Soll die App Zyklen unter hormoneller Verhütung anders zählen oder kennzeichnen?

## App-Konzept: modular und transparent

Grundfunktion der App ist das Erfassen der Periode; alles andere ist zuschaltbar. \[Praxis bestätigt\]

| Modul | Standard | Inhalt |
| --- | --- | --- |
| Periode | immer an | Blutung 0 bis 5, Schmierblutung |
| Schmerz | aus, zuschaltbar | NRS, Schmerzarten, Rücken, Medikamente |
| Endometriose | aus, zuschaltbar | AGEM-Abfragepunkte, Stress, Bewegung, Beckenboden |
| Fruchtbarkeit (NFP) | aus, zuschaltbar | Temperatur, Schleim, Muttermund, LH; Zeichen einzeln wählbar |

Anzeige der Fruchtbarkeit: Standard ist eine einfache Ansicht mit sicher unfruchtbaren Tagen, möglicherweise fruchtbaren Tagen und, wenn ausgewertet, der Zeit des Eisprungs. Die Temperaturkurve und das Zyklusblatt sind auf Wunsch einsehbar, damit jede Auswertung nachvollziehbar bleibt und kein undurchsichtiger Algorithmus entscheidet. \[Praxis bestätigt\]

### Abgrenzung zu Kalender-Apps wie Flo \[Literatur\]

- Flo berechnet das fruchtbare Fenster aus den eingetragenen Periodendaten und einem eigenen KI-Algorithmus, optional mit Temperatur aus Wearables; LH und Zervixschleim werden auf der Seite nicht als Eingabe genannt. Flo schreibt selbst, die Vorhersagen seien nicht zur Verhütung oder Familienplanung gedacht ([Flo](https://flo.health/flo-accuracy)).
- Ein Test von 10 Zyklus-Apps (darunter Flo) fand: Nur 8 % der Eisprung-Vorhersagen lagen am richtigen Tag, 67 % waren 2 bis 9 Tage zu früh; das fruchtbare Fenster war meist pauschal 7 Tage lang ([Worsfold et al., Women's Health 2021](https://pmc.ncbi.nlm.nih.gov/articles/PMC8504278)). 54 % von 90 Fruchtbarkeits-Apps nutzen nur Kalenderdaten.
- Nur 13 bis 16 % der Frauen haben einen 28-Tage-Zyklus, nur 13 % einen Eisprung an Tag 14 ([University of Sydney 2024](https://www.sydney.edu.au/news-opinion/news/2024/10/02/can-you-trust-your-period-tracking-app-.html)).

Vorteil von Gynaeca: Der Eisprung wird aus Körperzeichen ausgewertet (Temperatur, Schleim, optional LH), nicht aus dem Kalender geschätzt, und die Auswertung ist offen einsehbar.

## Warnzeichen und Abklärung

Die App kann bei bestimmten Mustern einen neutralen Hinweis zeigen, ärztlich abklären zu lassen. Die Schwellen unten sind Vorschläge aus der Literatur und müssen bestätigt werden. \[Offen\]

| Muster | Vorschlag Schwelle |
| --- | --- |
| Starke Blutung | PBAC über 100 pro Zyklus oder mehrere Tage Stufe 5 |
| Lange Blutung | über 8 Tage |
| Zykluslänge | unter 24 oder über 38 Tage, wiederholt |
| Zwischenblutungen | in mehreren Zyklen hintereinander, oder nach dem Geschlechtsverkehr |
| Blutung nach der Menopause | jede Blutung |
| Schmerz | NRS 7 oder höher trotz Schmerzmittel, oder Fehltage |
| Ausbleibende Periode | über 90 Tage ohne hormonelle Verhütung |

Akut (sofort ärztlich): plötzlicher starker Unterbauchschmerz, Blutung mit Schwindel oder Kreislaufproblemen, Blutung in der Schwangerschaft. \[Literatur\]

### Zyklus nach Lebensphase und Hinweise an die Frau \[Praxis bestätigt\]

Die App wertet Zykluslängen altersabhängig aus und schickt bei Auffälligkeiten eine Benachrichtigung mit der Empfehlung, sich bei der Frauenärztin vorzustellen. Ziel: undiagnostiziertes PCOS, eine vorzeitige Ovarialinsuffizienz (POI) oder eine frühe Perimenopause nicht zu übersehen, damit bei Kinderwunsch keine wichtigen Jahre verloren gehen. \[Praxis bestätigt\]

| Lebensphase | Normal | Hinweis an die Frau, wenn | Quelle |
| --- | --- | --- | --- |
| Erstes Jahr nach der Menarche | unregelmäßige Zyklen sind normal | ein Zyklus länger als 90 Tage | PCOS-Leitlinie |
| 1 bis 3 Jahre nach der Menarche | 21 bis 45 Tage | wiederholt unter 21 oder über 45 Tage; ein Zyklus über 90 Tage | PCOS-Leitlinie |
| Ab 3 Jahre nach der Menarche | 21 bis 35 Tage | wiederholt unter 21 oder über 35 Tage, weniger als 8 Zyklen im Jahr, ein Zyklus über 90 Tage | PCOS-Leitlinie |
| Keine Menarche |  | bis 15 Jahre oder mehr als 3 Jahre nach Beginn der Brustentwicklung keine Periode | PCOS-Leitlinie |
| Unter 40 Jahre, ausbleibende oder unregelmäßige Periode |  | 4 Monate oder länger unregelmäßig oder keine Blutung bei negativem Schwangerschaftstest; Verdacht auf POI (Diagnose: zusätzlich FSH über 25 IU/l) | ESHRE-Leitlinie POI 2024 |
| Ausbleibende Periode allgemein |  | angeglichen an ESHRE: 4 Monate oder länger unregelmäßige Zyklen oder keine Blutung bei negativem Schwangerschaftstest | \[Praxis bestätigt\] |
| Frühe Wechseljahre (Stufe −2) |  | dauerhaft 7 Tage oder mehr Unterschied zwischen aufeinanderfolgenden Zyklen, erneut innerhalb von 10 Zyklen | STRAW+10 |
| Späte Wechseljahre (Stufe −1) |  | 60 Tage oder länger keine Blutung; häufig Zyklen ohne Eisprung | STRAW+10 |
| Ab 35 Jahre mit Kinderwunsch |  | Hinweis, früher ärztliche Beratung zu suchen; zusätzlich bei Anzeichen einer beginnenden Perimenopause | \[Praxis bestätigt\] |

Quellen: [PCOS-Leitlinie, Jugendliche (BMC Medicine)](https://bmcmedicine.biomedcentral.com/articles/10.1186/s12916-020-01516-x/tables/4); [ESHRE/ASRM-Leitlinie POI, Panay et al., Hum Reprod Open 2024](https://pmc.ncbi.nlm.nih.gov/articles/11631070): POI betrifft etwa 3,5 % der Frauen, ein einzelner FSH-Wert über 25 IU/l reicht; [STRAW+10, Harlow et al., Climacteric 2012](https://pmc.ncbi.nlm.nih.gov/articles/PMC3580996). Im gelesenen STRAW-Manuskript steht „≤7 Tage“; üblich zitiert wird „7 Tage oder mehr“, noch gegen die Originalfassung zu prüfen. Die Altersgrenze 35 ist Praxiserfahrung der Gynäkologin, eine Leitlinienquelle steht noch aus.

Folgen für die NFP-Auswertung: Bis etwa 18 Jahre (bei später Menarche auch länger) und in der Perimenopause sind Zyklen ohne Eisprung oder unregelmäßige Zyklen häufig. Die App soll in diesen Phasen auf die geringere Verlässlichkeit hinweisen. Der BVF hält die Temperaturmessung bei Mädchen bis etwa 18 Jahre für nicht zuverlässig genug. \[Praxis bestätigt\] und \[Literatur\]

### Mehrfacher Eisprung \[Literatur, Offen\]

- Die Gynäkologin sieht eine Schwäche darin, dass NFP von Standardzyklen ausgeht; ein zweites S+ in der Hochlage wird bei myNFP nicht mehr gewertet. \[Praxis bestätigt\]
- Natural Cycles schreibt, bei Mehrfach-Eisprung würden beide Eizellen innerhalb von 24 Stunden freigesetzt; daraus können zweieiige Zwillinge entstehen ([Natural Cycles](https://help.naturalcycles.com/hc/en-us/articles/360003338434-What-is-multiple-ovulation), ohne Quellenangabe).
- Die deutschen NFP-Forscher (Frank-Herrmann, Freundl, Stanford, Mikolajczyk, Fertil Steril 2004) fanden in über 30.000 NFP-Zyklen keine Schwangerschaft durch Verkehr in der Phase nach dem Eisprung. Sie halten einen späten Eisprung für die wahrscheinlichere Erklärung als einen zweiten ([Zusammenfassung RRM Academy](https://rrmacademy.org/library/more-than-one-fertile-ovulation-per-cycle-recxq0ipn7se9mk2i/)).
- Der Pearl-Index von 0,4 geht damit nach bisheriger Datenlage nicht auf einen zweiten Eisprung zurück. Woher die Versager kommen, ist noch zu prüfen.
- Idee für die App: siehe „Zweites S+“ unten. \[Vorschlag\]

#### Zweites S+: wie myNFP damit umgeht \[Literatur\]

| Zeitpunkt | Regel | Begründung laut Quelle |
| --- | --- | --- |
| Vor Abschluss der Auswertung | Ein neues S+ macht den bisherigen Höhepunkt ungültig; die Suche beginnt neu. Bei zwei möglichen Höhepunkten entscheidet die Temperatur. | Der Höhepunkt ist der letzte Tag mit der besten Qualität, gefolgt von 3 schlechteren Tagen ([Zervixschleim beobachten](https://www.mynfp.de/zervixschleim-beobachten), [Beispiel 4](https://www.mynfp.de/temperatur-und-zervixschleim-kombinieren)) |
| Nach Abschluss der Auswertung (Hochlage) | S oder S+ wird nicht mehr gewertet; die unfruchtbare zweite Zyklushälfte wird nicht wieder fruchtbar. | „weil das Östrogen nach dem Eisprung nicht linear abfällt“ ([Beispiel 3](https://www.mynfp.de/temperatur-und-zervixschleim-kombinieren)) |

Ergänzend aus Fachwissen, noch zu belegen: Nach dem Eisprung unterdrückt das Progesteron des Gelbkörpers einen erneuten LH-Anstieg. Follikel aus späteren Follikelwellen (Baerwald 2003) reifen deshalb in der Regel nicht zum Eisprung. Die NFP-Forschung fand in über 30.000 Zyklen keine Schwangerschaft durch Verkehr in der ausgewerteten Hochlage.

Für die App: Ein zweites S+ vor Abschluss der Auswertung verschiebt die Auswertung wie bei myNFP. Ein S+ in der Hochlage ändert die Auswertung nicht, wird aber sichtbar markiert, damit die Frau und die Ärztin es sehen. \[Vorschlag, mit der Gynäkologin zu klären\]

### Fragen an die Gynäkologin

- [ ] Welche dieser Schwellen würden Sie so übernehmen, welche ändern?
- [ ] Soll die App solche Hinweise überhaupt zeigen, und wie sollen sie formuliert sein, damit sie nicht verunsichern?

## Quellen

Die Angaben stammen aus Fachwissen zu diesen Standardwerken; die Links und Zahlen sind noch nicht einzeln gegen die Originale geprüft und gelten bis zur Bestätigung als ungefähr.

- Higham JM, O'Brien PM, Shaw RW. Assessment of menstrual blood loss using a pictorial chart. BJOG 1990 ([DOI](https://doi.org/10.1111/j.1471-0528.1990.tb16211.x))
- Munro MG et al. The two FIGO systems for normal and abnormal uterine bleeding symptoms (PALM-COEIN), 2018 ([DOI](https://doi.org/10.1002/ijgo.12666))
- NICE NG88: Heavy menstrual bleeding, assessment and management ([Leitlinie](https://www.nice.org.uk/guidance/ng88))
- AWMF S2k-Leitlinie Diagnostik und Therapie der Endometriose, Registernummer 015-045 ([AWMF](https://register.awmf.org/de/leitlinien/detail/015-045))
- Arbeitsgruppe NFP: Natürlich und sicher, Sensiplan-Handbuch ([NFP online](https://www.nfp-online.de))
- Belsey EM, Farley TM. WHO-Definitionen für Blutungstagebücher (bleeding/spotting), 1987

Geprüfte Quellen zur Endometriose (gelesen am 22.11.2026):

- Mechsner S. [Schmerztherapie bei Patientinnen mit Endometriose](https://link.springer.com/article/10.1007/s00129-023-05194-7). Die Gynäkologie 2024; 57: 154–161 (nur Abstract gelesen)
- [Interview mit Sylvia Mechsner](https://www.aerzteblatt.de/news/rubriken/5-fragen-an/es-waere-wichtig-die-endometriosebehandlung-staerker-multimodal-aufzustellen-47d7a362-e528-4310-8e2e-85fc7dd7e9bb), Deutsches Ärzteblatt, 19.05.2021
- [Anamnesefragebogen Endometriose](https://klinikum.uni-heidelberg.de/fileadmin/frauenklinik/Gyn_Endokrinologie/Anamnesefragebogen_Endometriose.pdf) (AGEM-Basis-Fragebogen 2021/07 mit Modulen, Uniklinik Heidelberg, Version 2024)
- [Pain Sensitivity Questionnaire in endometriosis](https://pubmed.ncbi.nlm.nih.gov/40049377/), J Pain 2025: PSQ ist kein guter Ersatz für die Messung zentraler Sensibilisierung

Geprüfte Quellen zu NFP und Zulassung (gelesen am 22.11.2026):

- [myNFP Gebrauchsanleitung](https://www.mynfp.de/gebrauchsanleitung.pdf), Ausgabe 22.0
- [Sensiplan Übungsheft](https://sensiplan.profilschmiede.de/storage/media/documents/45/sensiplan-uebungsheft-web.pdf), 3. Aufl. 2018 (enthält Übungen, nicht das Regelwerk)
- [Symptothermale Methode](https://flexikon.doccheck.com/de/Symptothermale_Methode), DocCheck Flexikon
- [Women's Health: Noch Lifestyle-Tool oder schon Medizinprodukt?](https://cms.law/de/deu/legal-updates/women-s-health-noch-lifestyle-tool-oder-schon-medizinprodukt), CMS, Oktober 2026
- Frank-Herrmann P et al. Hum Reprod 2007; 22: 1310–1319 ([PubMed](https://pubmed.ncbi.nlm.nih.gov/17314078/), Seite nicht lesbar, Angabe aus Sekundärquelle)
