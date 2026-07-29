import { describe, expect, it } from 'vitest';
import { extractLeadDataFromText } from '@/lib/services/leadTextExtractionService';

describe('extractLeadDataFromText', () => {
  it('extreu dades clau d’un WhatsApp copiat quan la IA no respon', () => {
    const result = extractLeadDataFromText(`
      WhatsApp 10:42
      Bon dia, sóc l'Adrià de l'Associació de Veïns de Rubí.
      Volem fer una festa privada el 15 de setembre de 2026 a Rubí.
      Serem unes 80 persones i començaríem a les 22:00.
      El pressupost és 1.500€.
      Em podeu escriure a adria@example.com o trucar al 699 123 456.
    `);

    expect(result.name).toBe('Adrià');
    expect(result.email).toBe('adria@example.com');
    expect(result.phone).toBe('699123456');
    expect(result.eventType).toBe('PRIVATE_PARTY');
    expect(result.eventDate).toBe('2026-09-15');
    expect(result.eventTime).toBe('22:00');
    expect(result.eventLocation).toBe('Rubí');
    expect(result.guestCount).toBe('80');
    expect(result.budget).toBe('1.500€');
    expect(result.source).toBe('WHATSAPP');
    expect(result.message).toContain('Associació de Veïns de Rubí');
  });

  it('extreu camps etiquetats de text lliure', () => {
    const result = extractLeadDataFromText(`
      Nom: Maria no està etiquetat, però me llamo Maria Lopez.
      Teléfono: 0034 612 345 678
      DNI: 12345678A
      Dirección: Carrer Major 10, Terrassa
      Lugar: Masia Can Roda, Girona
      Fecha: 20/06/2026
      Horari: 20:00 a 03:00
      Seremos 120 personas.
      Presupuesto: entre 1500 y 2000 euros
      boda
    `);

    expect(result.name).toBe('Maria Lopez');
    expect(result.phone).toBe('+34612345678');
    expect(result.dni).toBe('12345678A');
    expect(result.address).toBe('Carrer Major 10, Terrassa');
    expect(result.eventLocation).toBe('Masia Can Roda, Girona');
    expect(result.eventDate).toBe('2026-06-20');
    expect(result.eventTime).toBe('20:00');
    expect(result.eventEndTime).toBe('03:00');
    expect(result.guestCount).toBe('120');
    expect(result.budget).toContain('1500');
    expect(result.eventType).toBe('WEDDING');
  });

  it('extreu hora final de rang en text de WhatsApp', () => {
    const result = extractLeadDataFromText(`
      Hola, soc la Cristina.
      Necessitem DJ el 11/07/2026 de 18:00 a 20:00 a Arenys de Munt per 150 persones.
    `);

    expect(result.eventTime).toBe('18:00');
    expect(result.eventEndTime).toBe('20:00');
  });

  it('ignora timestamps de WhatsApp i prioritza la data real del client', () => {
    const result = extractLeadDataFromText(`
      [18:03, 2/7/2026] Òrbita events: Hola Estel
      [18:03, 2/7/2026] Estel Giralt Canyamars: Hola, soc Estel Giralt
      [18:03, 2/7/2026] Òrbita events: Passam si pots ubi, data, horari i el que parlàvem no? 2h de Dj. Et passaré dossier amb les possibilitats i preus
      [18:03, 2/7/2026] Estel Giralt Canyamars: El mail es estel.giralt@gmail.com
      [18:04, 2/7/2026] Estel Giralt Canyamars: Data 25/7/2026. Lloc Canyamars-Dosrius. Horari 9 a 11
      [18:05, 2/7/2026] Estel Giralt Canyamars: Del vespre
    `);

    expect(result.name).toBe('Estel Giralt');
    expect(result.email).toBe('estel.giralt@gmail.com');
    expect(result.eventDate).toBe('2026-07-25');
    expect(result.eventLocation).toBe('Canyamars-Dosrius');
    expect(result.eventTime).toBe('21:00');
    expect(result.eventEndTime).toBe('23:00');
  });

  it('recupera contacte i ubicacio en un WhatsApp multi-bolo sense inventar data parcial', () => {
    const result = extractLeadDataFromText(`
      [11:50, 1/7/2026] +376 339 491: Aiiii m'encanta el video del Bingo musical
      [11:53, 1/7/2026] Òrbita events: Alba + cognom
      [11:54, 1/7/2026] +376 339 491: Alba Orna - albaop@gmail.com
      [11:54, 1/7/2026] +376 339 491: perdo... 17h es l'Eglesia però el show hauria de començar despres del sopar
      [11:55, 1/7/2026] +376 339 491: Si, el dia 5 hauria de ser el bingo musical... sera una celebració d'unes 30 persones
      [11:56, 1/7/2026] +376 339 491: I la boda de mes fiestuki que som 80 és el 26
      [12:12, 1/7/2026] +376 339 491: La ubicació del dia 5 és restaurant Calma a l'Aldosa
      [12:12, 1/7/2026] +376 339 491: La ubicació del dia 26 és Mas d'en Roqueta - Aravell (La Seu d'Urgell)
    `);

    expect(result.name).toBe('Alba Orna');
    expect(result.email).toBe('albaop@gmail.com');
    expect(result.phone).toBe('+376339491');
    expect(result.eventType).toBe('OTHER');
    expect(result.eventDate).toBe('');
    expect(result.eventLocation).toBe("restaurant Calma a l'Aldosa");
    expect(result.guestCount).toBe('30');
  });

  it('sintetitza una conversa WhatsApp de casal sense copiar-la sencera a notes', () => {
    const result = extractLeadDataFromText(`
      [14:24, 7/7/2026] +34 673 04 83 68: Bon dia, Albert,

      Em poso en contacte amb vostè perquè estem organitzant una vesprada de casal a una escola de Cornellà i ens agradaria saber si té disponibilitat i ens pot fer arribar un pressupost.

      Vesprada de casal

      📅 Divendres 17 de juliol
      🕣 Horari: de 20.30 a 21.30 h (aprox.)
      👧👦 Uns 100 infants

      Ens agradaria saber quines activitats o espectacles ens podria oferir per fer una hora de festa.

      Si ens pot confirmar la disponibilitat i fer-nos arribar una proposta amb les diferents opcions i el pressupost, li ho agrairem.

      Moltes gràcies i quedem pendents de la seva resposta.

      Salutacions,
      [14:28, 7/7/2026] Òrbita events: Bon dia! I tant, la mainada quina edat té? Us preparo un dossier i us ho faig arribar.
      [14:28, 7/7/2026] +34 673 04 83 68: de 3 a 12 anys
      [14:30, 7/7/2026] Òrbita events: Dacord, ho preparo, et confirmo disponibilitat per aquell dia i seguim parlant.
      [14:30, 7/7/2026] +34 673 04 83 68: Seria una activitat d'una hora aproximadament, dins de la vesprada del casal, al pati d'una escola. Els infants tenen entre 3 i 12 anys. Aquest any la temàtica del casal és un DJ que ha perdut la inspiració i viatja pel món a través de la música.
      [14:30, 7/7/2026] +34 673 04 83 68: A vosaltres
      [14:33, 7/7/2026] Òrbita events: Necessitaria el seu nom i cognom i un correu electronic sisplaiu, aixi us incoprporo a la base de dades
      [14:36, 7/7/2026] +34 673 04 83 68: Albert Aujas
      [14:36, 7/7/2026] +34 673 04 83 68: casals@controlplay.cat
    `);

    expect(result.name).toBe('Albert Aujas');
    expect(result.email).toBe('casals@controlplay.cat');
    expect(result.phone).toBe('+34673048368');
    expect(result.eventDate.endsWith('-07-17')).toBe(true);
    expect(result.eventTime).toBe('20:30');
    expect(result.eventEndTime).toBe('21:30');
    expect(result.eventLocation).toBe('Cornellà');
    expect(result.guestCount).toBe('100');
    expect(result.source).toBe('WHATSAPP');
    expect(result.message).toContain('vesprada de casal');
    expect(result.message).toContain("activitat d'una hora");
    expect(result.message).toContain("al pati d'una escola");
    expect(result.message).toContain('infants de 3 a 12 anys');
    expect(result.message).toContain('temàtica: un DJ que ha perdut la inspiració');
    expect(result.message).not.toContain('[14:24');
    expect(result.message.length).toBeLessThan(280);
  });
});
