import { tglIndo } from '@/lib/format'
import { Badge } from '@/components/ui'
import Icon from '@/components/Icons'

// Query lengkap satu kunjungan beserta resep, lab, dokter
export const SELECT_KUNJUNGAN =
  '*, poli(nama_poli), faskes(nama), dokter:profiles(nama), resep(id, status, resep_item(*)), lab_hasil(*)'

// Ketersediaan obat sudah dicek dokter saat menulis resep:
// resep_luar = tidak diambil di apotek faskes, harus dibeli di apotek lain.
function StatusObat({ item }) {
  return item.resep_luar
    ? <Badge tone="warn">Tidak tersedia di faskes, beli di apotek luar</Badge>
    : <Badge tone="ok">Tersedia di apotek faskes</Badge>
}

export default function KunjunganCard({ k }) {
  // resep berelasi satu-ke-satu, jadi bisa berupa objek atau larik
  const resep = Array.isArray(k.resep) ? k.resep[0] : k.resep
  const items = resep?.resep_item ?? []
  const adaAnjuran = k.instruksi || k.pantangan || k.tgl_kontrol || k.tanda_bahaya

  return (
    <article className="card kunjungan">
      <div className="row">
        <h3>{tglIndo(k.tanggal)} · {k.poli?.nama_poli}</h3>
        <span className="muted">{k.faskes?.nama}</span>
      </div>
      <p className="muted">Dokter: {k.dokter?.nama || '-'}</p>

      <div className="bagian">
        <h4><Icon name="pulse" size={16} /> Hasil pemeriksaan</h4>
        {k.keluhan && <p><b>Keluhan:</b> {k.keluhan}</p>}
        {k.diagnosa && <p><b>Diagnosa:</b> {k.diagnosa}</p>}
        {k.tindakan && <p><b>Tindakan:</b> {k.tindakan}</p>}
        {!k.keluhan && !k.diagnosa && !k.tindakan && <p className="muted">Belum ada catatan pemeriksaan.</p>}
      </div>

      {adaAnjuran && (
        <div className="tugas">
          <h4><Icon name="clipboard" size={16} /> Anjuran dokter</h4>
          {k.instruksi && <p><b>Perawatan di rumah:</b> {k.instruksi}</p>}
          {k.pantangan && <p><b>Pantangan:</b> {k.pantangan}</p>}
          {k.tgl_kontrol && <p><b>Kontrol berikutnya:</b> {tglIndo(k.tgl_kontrol)}</p>}
          {k.tanda_bahaya && <p className="bahaya"><b>Segera ke fasilitas kesehatan jika:</b> {k.tanda_bahaya}</p>}
        </div>
      )}

      {items.length > 0 && (
        <div className="bagian">
          <h4>
            <Icon name="pill" size={16} /> Obat{' '}
            {resep?.status === 'diserahkan' ? <Badge tone="ok">sudah diserahkan</Badge> : <Badge tone="warn">menunggu apotek</Badge>}
          </h4>
          <div>
            {items.map((i) => (
              <div key={i.id} className="obat-item">
                <div className="baris">
                  <span><b>{i.nama_obat}</b> ({i.jumlah})</span>
                  <StatusObat item={i} />
                </div>
                <span className="muted">{i.aturan_pakai || `${i.frekuensi_per_hari}x sehari, ${i.durasi_hari} hari`}</span>
              </div>
            ))}
          </div>
          <p className="muted">Ketersediaan obat dicek dokter saat resep ditulis.</p>
        </div>
      )}

      {k.lab_hasil?.length > 0 && (
        <div className="bagian">
          <h4><Icon name="history" size={16} /> Hasil laboratorium</h4>
          <ul className="plain">
            {k.lab_hasil.map((l) => (
              <li key={l.id}>{l.nama_tes}: <b>{l.hasil}</b> {l.satuan}</li>
            ))}
          </ul>
        </div>
      )}
    </article>
  )
}