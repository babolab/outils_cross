// TNAV -> Seamis : application développée et déployée à part (dépôt babolab/tnav2Seamis),
// affichée ici en iframe. Même origine (babolab.github.io) : la copie dans le presse-papiers fonctionne.
const TNAV_URL = 'https://babolab.github.io/tnav2Seamis/'

export default function TnavModule() {
  return (
    <iframe
      src={TNAV_URL}
      className="w-full h-full border-none"
      title="TNAV → Seamis"
      allow="clipboard-write"
    />
  )
}
