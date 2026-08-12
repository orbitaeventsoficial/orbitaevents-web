/**
 * Els personatges de Masquerade, amb la seva foto.
 *
 * Els noms són els que el propietari va escriure ell mateix quan va classificar
 * el material el 2026-08-11; aquí només s'han posat en majúscula. No se n'ha
 * inventat cap ni se n'ha traduït cap: si un dia en canvia un, es canvia aquí.
 *
 * Serveixen per a una cosa concreta: quan un dossier porta animació amb
 * personatge, poder dir **quins** personatges hi van i que el client els vegi.
 * No són portfoli ni catàleg públic.
 */
export type MasqueradeCharacter = {
  id: string;
  nom: string;
  foto: string;
};

export const MASQUERADE_CHARACTERS: readonly MasqueradeCharacter[] = [
  { id: 'jack-skelleton', nom: 'Jack Skelleton', foto: '/img/personatges/jack-skelleton.jpg' },
  { id: 'doctor-jack', nom: 'Doctor Jack', foto: '/img/personatges/doctor-jack.jpg' },
  { id: 'vampiro-de-epoca', nom: 'Vampiro de época', foto: '/img/personatges/vampiro-de-epoca.jpg' },
  { id: 'tenebris', nom: 'Tenebris', foto: '/img/personatges/tenebris.jpg' },
  { id: 'miguelito-coco', nom: 'Miguelito Coco', foto: '/img/personatges/miguelito-coco.jpg' },
  { id: 'blood-and-vampires', nom: 'Blood and Vampires', foto: '/img/personatges/blood-and-vampires.jpg' },
  { id: 'bruja-salem', nom: 'Bruja Salem', foto: '/img/personatges/bruja-salem.jpg' },
  { id: 'elfo', nom: 'Elfo', foto: '/img/personatges/elfo.jpg' },
  { id: 'willy-wonka', nom: 'Willy Wonka', foto: '/img/personatges/willy-wonka.jpg' },
  { id: 'jinu-k-pop', nom: 'Jinu K-pop', foto: '/img/personatges/jinu-k-pop.jpg' },
  { id: 'karys-cantant', nom: 'Karys · cantant', foto: '/img/personatges/karys-cantant.jpg' },
];

export function masqueradeCharacter(id: string): MasqueradeCharacter | undefined {
  return MASQUERADE_CHARACTERS.find((c) => c.id === id);
}

/**
 * Un producte que va amb personatges: llavors la tria té sentit.
 *
 * «Blood and Vampires» no hi entra encara que en porti: és un espectacle amb
 * la seva pròpia foto, i posar-li a sota un mostrari per triar cara seria
 * oferir el que no s'ofereix. Només els serveis d'animació amb personatge
 * deixen triar qui ve.
 */
export function isCharacterProduct(nom: string): boolean {
  // El personatge addicional no obre cap tria: és una unitat més d'una
  // animació ja triada, i tornar a demanar cara seria preguntar dues vegades
  // el mateix.
  if (/addicional|adicional|extra/i.test(nom)) return false;
  return /personatge|personaje|tem[àáa]tica/i.test(nom);
}

/**
 * Un espectacle amb imatge pròpia, que va gran i a dalt de la fitxa.
 *
 * «Blood and Vampires» té el seu cartell: no es tria personatge i no s'ensenya
 * una miniatura al costat del text, sinó la seva imatge sencera presidint la
 * fitxa. De moment només ell.
 */
export function fotoPropiaDe(nom: string): string | undefined {
  return /blood\s*and\s*vampires/i.test(nom) ? '/img/personatges/blood-and-vampires.jpg' : undefined;
}

export function teFotoPropia(nom: string): boolean {
  return Boolean(fotoPropiaDe(nom));
}
