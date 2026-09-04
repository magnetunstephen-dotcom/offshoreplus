import { Modal } from "./Modal";

interface Props { onClose: () => void; }

export function PrivacyModal({ onClose }: Props) {
  return <Modal onClose={onClose} labelledBy="privacy-title" className="privacy-modal">
    <div className="account-header"><div><span className="eyebrow">Trygg bruk</span><h2 id="privacy-title">Personvern og bruksvilkår</h2></div><button className="calendar-close" onClick={onClose} aria-label="Lukk">×</button></div>
    <section><h3>Hva lagres?</h3><p>OffshorePlus lagrer e-postadressen din og opplysningene du selv registrerer, som turer, turnus, lønnsvalg, tillegg, kurs og CV-data. Passordet håndteres av Supabase og er aldri synlig for OffshorePlus.</p></section>
    <section><h3>Hvorfor lagres det?</h3><p>Opplysningene brukes bare for å gi deg beregninger, oversikter og synkronisering mellom enhetene dine. Data selges ikke og brukes ikke til reklame.</p></section>
    <section><h3>Tilgang og sletting</h3><p>Hver bruker kan bare lese sine egne data. Du kan slette kontoen og alle tilhørende data fra «Min konto». Sletting kan ikke angres.</p></section>
    <section><h3>Beregninger</h3><p>Lønns- og skatteberegninger er veiledende. Kontroller alltid viktige beløp mot lønnsslipp, tariffavtale og Skatteetatens opplysninger.</p></section>
    <section><h3>Kontakt</h3><p>Feil og forbedringsforslag kan sendes gjennom snakkeboblen i OffshorePlus.</p></section>
    <small>Sist oppdatert 4. september 2026</small>
    <button className="primary full-width" onClick={onClose}>Ferdig</button>
  </Modal>;
}
