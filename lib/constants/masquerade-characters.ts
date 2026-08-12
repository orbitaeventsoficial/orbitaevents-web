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

/** Un producte que va amb personatges: llavors la tria té sentit. */
export function isCharacterProduct(nom: string): boolean {
  return /personatge|blood and vampires|vampir/i.test(nom);
}
