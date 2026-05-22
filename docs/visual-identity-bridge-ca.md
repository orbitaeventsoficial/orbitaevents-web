# Pont d'identitat visual — admin, web pública i mòduls nous

Data: 2026-05-17
Estat: guia operativa
Front: §6.11 UX / Visual / Marca

## Objectiu

Evitar que l'admin, la web pública i els mòduls nous evolucionin com a productes visuals separats. La coherència no vol dir que tot tingui la mateixa composició: vol dir que una persona reconegui Òrbita pel to, la jerarquia, el tipus de decisió i els senyals visuals.

## Principi

La web pública ven confiança. L'admin governa decisions. Els mòduls nous han de respectar totes dues coses:
- si és públic, primer ha de transmetre marca, prova social i acció clara;
- si és admin, primer ha de transmetre estat, risc, prioritat i següent moviment;
- si és un mòdul mixt, ha de dir explícitament quin context governa.

## Senyals compartits

- Superfícies fosques amb contrast real, no decoració sense lectura.
- Badges per estat, risc i prioritat abans de textos llargs.
- CTA principal únic per bloc; accions secundàries separades.
- Copy curt i directe: què passa, què falta, què toca fer.
- Cap mòdul nou comença per taula nua si governa negoci.
- Cap pàgina pública clau amaga portfolio, prova social o contacte.

## Diferències permeses

**Web pública** pot ser més emocional:
- imatges reals o visuals de servei;
- ritme narratiu;
- prova social;
- CTA de contacte.

**Admin** ha de ser més executiu:
- semàfors;
- propietari del pròxim moviment;
- mètrica útil;
- enllaç al workspace que resol.

**Mòduls nous** han de triar:
- si governen negoci, usen patró `OwnerControlStrip` o equivalent;
- si només editen catàleg, han de mostrar estat de sessió i risc de canvi;
- si són suport tècnic, no han de competir amb workspaces sagrats.

## Checklist abans d'afegir o redissenyar

1. Quin eix millora: conversió, execució, cobrament o recurrència?
2. Quin és el CTA principal i quin risc resol?
3. Quins badges o semàfors fan llegible l'estat sense llegir paràgrafs?
4. Quina peça pública/admin comparteix llenguatge amb aquest mòdul?
5. Què queda prohibit duplicar: paleta, CTA, catàleg, estat o narrativa?

## Decisió

La coherència visual d'Òrbita es governa per funció. La marca pública ha de generar confiança i l'admin ha de generar control; qualsevol pantalla nova ha d'explicar a quin costat pertany abans de definir layout.
