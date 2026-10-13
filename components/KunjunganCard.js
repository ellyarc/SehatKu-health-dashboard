import { tglIndo } from '@/lib/format'
import { Badge } from '@/components/ui'

// Query lengkap satu kunjungan beserta resep, lab, dokter
export const SELECT_KUNJUNGAN =
  '*, poli(nama_poli), faskes(nama), dokter:profiles(nama), resep(id, status, resep_item(*)), lab_hasil(*)'

export default function KunjunganCard({ k }) {
  // resep berelasi satu-ke-satu, jadi bisa berupa objek atau larik
  const resep = Array.isArray(k.resep) ? k.resep[0] : k.resep
  const items = resep?.resep_item ?? []

  return (
    <article className="card kunjungan">
      <div className="row">
        <h3>{tglIndo(k.tanggal)} · {k.poli?.nama_poli}</h3>
        <span className="muted">{k.faskes?.nama}</span>
      </div>
      <p className="muted">Dokter: {k.dokter?.nama || '-'}</p>
      {k.keluhan && <p><b>Keluhan:</b> {k.keluhan}</p>}
      {k.diagnosa && <p><b>Diagnosa:</b> {k.diagnosa}</p>}
      {k.tindakan && <p><b>Tindakan:</b> {k.tindakan}</p>}

      {(k.instruksi || k.pantangan || k.tgl_kontrol || k.tanda_bahaya) && (
        <div className="tugas">
          <h4>Tugas untuk kamu setelah berobat</h4>
          {k.instruksi && <p><b>Perawatan di rumah:</b> {k.instruksi}</p>}
          {k.pantangan && <p><b>Pantangan:</b> {k.pantangan}</p>}
          {k.tgl_kontrol && <p><b>Kontrol berikutnya:</b> {tglIndo(k.tgl_kontrol)}</p>}
          {k.tanda_bahaya && <p className="bahaya"><b>Segera ke fasilitas kesehatan jika:</b> {k.tanda_bahaya}</p>}
        </div>
      )}

      {items.length > 0 && (
        <>
          <h4>Obat {resep?.status === 'diserahkan' ? <Badge tone="ok">sudah diserahkan</Badge> : <Badge tone="warn">menunggu apotek</Badge>}</h4>
          <ul className="plain">
            {items.map((i) => (
              <li key={i.id}>
                <b>{i.nama_obat}</b> ({i.jumlah}) — {i.aturan_pakai || `${i.frekuensi_per_hari}x sehari, ${i.durasi_hari} hari`}
                {i.resep_luar && <> <Badge tone="muted">beli di apotek luar</Badge></>}
              </li>
            ))}
          </ul>
        </>
      )}

      {k.lab_hasil?.length > 0 && (
        <>
          <h4>Hasil laboratorium</h4>
          <ul className="plain">
            {k.lab_hasil.map((l) => (
              <li key={l.id}>{l.nama_tes}: <b>{l.hasil}</b> {l.satuan}</li>
            ))}
          </ul>
        </>
      )}
    </article>
  )
}