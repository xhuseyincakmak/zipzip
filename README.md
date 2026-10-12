# Zıpzıp Macera

Tarayıcıda çalışan, klasik yandan kaydırmalı platform oyunu. Phaser 3 + TypeScript + Vite.
Grafik ve sesler: [Kenney New Platformer Pack](https://kenney.nl/assets/new-platformer-pack) (CC0).

## Çalıştırma

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/ klasörüne statik site üretir
```

## Kontroller

| Klavye | Gamepad | İşlev |
|---|---|---|
| ← → / A D | sol çubuk / yön tuşları | hareket |
| Space / Z / ↑ / W | A (✕) | zıpla (basılı tutunca daha yükseğe) |
| Shift / X | X (□) veya B (○) | koş; ateş formunda ateş topu at |
| ↓ / S | aşağı | eğil |
| Esc / P | Start | duraklatma menüsü (devam, yeniden başlat, harita, müzik, ses efektleri) |
| M (başlık ekranında) | | müziği aç/kapat |
| F2 | | çarpışma kutularını göster |

## Ses

- Ses efektleri Kenney paketinden; Safari için `.m4a` kopyaları da var (`afconvert` ile üretildi).
- Müzikler dosya değil: `src/systems/Music.ts` içindeki nota dizileri Web Audio ile çalınır.
  Yeni parça eklemek için `TRACKS` nesnesine bir giriş ekle.

## Bölümler (kolaydan zora)

| # | Bölüm | # | Bölüm |
|---|---|---|---|
| 1 | Yeşil Başlangıç | 11 | Sarkıt Geçidi |
| 2 | Çöl Kapısı | 12 | Diken Tüneli |
| 3 | Orman Patikası | 13 | Kum Fırtınası |
| 4 | Karlı Zirve | 14 | Buz Mağarası |
| 5 | Taş Kale | 15 | Mor Orman |
| 6 | Mor Mağara | 16 | Ateş Ormanı |
| 7 | Yıldız Kulesi | 17 | Testere Salonu |
| 8 | Mantar Tepeleri | 18 | Erimiş Köprüler |
| 9 | Lav Kapısı | 19 | Rüzgâr Köprüleri |
| 10 | Bulut Yolu | 20 | Dev Slime'ın Kalesi (boss) |

Haritada dörder bölümlük beş kademe var: Kolay Patika, Orta Yol, Zorlu Geçit, Usta Yolu, Son Sınav.
Sıra `src/levels/worlds.ts` içinde. Usta Yolu bölümleri `python3 tools/worlds5.py` ile üretilir.

## Bölüm editörü

Başlık ekranında **E** tuşu editörü açar.

| İşlem | Nasıl |
|---|---|
| Araç seç | Üstteki paletten tıkla ya da karakterin tuşuna bas (`#`, `B`, `E`, `o`...; boşluk = silgi) |
| Çiz / sil | Sol tık (sürükleyerek de olur) / sağ tık |
| Kaydır | ← → ↑ ↓ veya fare tekerleği |
| Geri al | Ctrl/Cmd + Z |
| Test et | Enter ya da "Test et" — can düşmez; Esc menüsünden "Haritaya dön" editöre döner |
| Kontrol et | Başlangıçtan bitişe ulaşılabiliyor mu, S/F sayısı doğru mu |
| Dışa aktar | "Kopyala" ya da ".txt indir"; dosyayı `src/levels/` içine koy ve `worlds.ts`'e ekle |
| İçe aktar | "Dosyadan aç", "Panodan yapıştır" ya da "Bölüm aç…" (sıra numarası ya da adı, ör. `11` veya `Sarkıt Geçidi`) |

Taslak tarayıcıda otomatik saklanır; sayfayı kapatıp açınca kaldığın yerden devam edersin.

## Yeni bölüm ekleme

1. `src/levels/` içine `.txt` dosyası koy; dosya adı bölüm kimliği olur (ör. `buzlu-magara.txt`).
2. Bölümü `src/levels/worlds.ts` içindeki dünya listesine ekle (harita sırası ve kilit açma buradan).
3. Doğrudan denemek için: `http://localhost:5173/?level=buzlu-magara`

Bölümler elle yazılabilir ya da `tools/` altındaki Python betikleriyle üretilebilir.
`python3 tools/world1.py` ve `python3 tools/worlds234.py` hazır 16 bölümü yeniden yazar ve her bölümün başlangıçtan bitişe
zıplayarak geçilebildiğini kontrol eder (geçilemiyorsa hata verir).

```
name: Buzlu Mağara
theme: grass          # grass | dirt | sand | snow | stone | purple
background: hills     # hills | trees | desert | mushrooms | cave
time: 300
---
                ?
          ?   BB?BB
 S     b               XX
###########   ###########
```

| Karakter | Anlamı |
|---|---|
| `#` | zemin (kenarlar otomatik seçilir) |
| `B` | tuğla |
| `?` | soru bloğu (coin) |
| `M` | soru bloğu (güç: küçükken kalp, büyükken kırmızı mücevher) |
| `*` | soru bloğu (yıldız) |
| `C` | checkpoint bayrağı |
| `F` | bitiş direği (direğin dibi; kapı 4 karo sağına otomatik konur) |
| `X` | sert blok |
| `S` | oyuncu başlangıcı |
| `o` | coin |
| `E` | slime (üstüne basınca ezilir) |
| `K` | salyangoz (basınca kabuğa girer, kabuk tekmelenir) |
| `A` | arı (yerinde yukarı-aşağı uçar) |
| `Y` | sinek (yatayda gidip gelir) |
| `W` | testere (ezilemez, ateşten etkilenmez) |
| `L` | lav (dokunan ölür) |
| `^` | diken (hasar verir) |
| `=` | yatay hareketli platform (3 karo, sol ucu) |
| `\|` | dikey hareketli platform (3 karo, sol ucu) |
| `Z` | boss (Dev Blok Slime) |
| `G` | boss kapısı (boss yenilince açılır) |
| `b` `m` | çalı, mantar (dekor) |

Ekran 20 × 12 karo. 12 satırlık bir bölüm ekranı tam doldurur; en alttaki iki satır genelde zemindir.

## Yapı

```
src/
  config.ts          ekran boyutu, fizik ayarları
  scenes/            BootScene (yükleme), GameScene (oyun)
  entities/Player.ts hareket, zıplama, animasyon
  levels/            Level.ts (ayrıştırıcı), buildLevel.ts (haritaya çevirme), *.txt bölümler
  systems/           klavye, ses
public/assets/kenney Kenney grafik ve sesleri
```
