-- Jalankan SETELAH mendaftarkan 4 akun lewat halaman /login.
-- Email boleh diganti sesuai akun yang kamu buat.
update profiles p set role = x.role, faskes_id = '11111111-1111-1111-1111-111111111111'
from (
  select u.id, v.role
  from auth.users u
  join (values
    ('petugas@contoh.com',  'petugas'),
    ('dokter@contoh.com',   'dokter'),
    ('apoteker@contoh.com', 'apoteker'),
    ('kader@contoh.com',    'kader')
  ) as v(email, role) on u.email = v.email
) x
where p.id = x.id;