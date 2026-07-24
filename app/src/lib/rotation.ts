export interface RotationChannel {
  id: string
  name: string
  tvgId: string
  tvgName: string
  groupTitle: string
  tvgLogo: string
  urls: string[]
}

export interface RotationCategory {
  id: string
  name: string
  channels: RotationChannel[]
}

const rawM3U = `#EXTM3U
#EXTINF:-1 tvg-id="TRT1" tvg-name="TRT 1" group-title="Ulusal" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/trt-1-tr.png",TRT 1
https://tv-trt1.medya.trt.com.tr/master_720.m3u8

#EXTINF:-1 tvg-id="STARTV" tvg-name="STAR TV" group-title="Ulusal" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/star-tv-tr.png",STAR TV
https://dogus.daioncdn.net/startv/startv.m3u8?app=startv_web

#EXTINF:-1 tvg-id="KANALD" tvg-name="KANAL D" group-title="Ulusal" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/kanal-d-tr.png",KANAL D
https://demiroren.daioncdn.net/kanald/kanald.m3u8?app=kanald_web&ce=3

#EXTINF:-1 tvg-id="SHOWTV" tvg-name="SHOW TV" group-title="Ulusal" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/show-tr.png",SHOW TV
https://ciner.daioncdn.net/showtv/showtv_1080p.m3u8?ex=1664766175&st=RBzhSuGauna0OGld-DJUVA&tv=1&sid=7ggzjgei1u7i&app=4bc856ef-4c68-4a94-bc87-37dfaaa66558&ce=3

#EXTINF:-1 tvg-id="ATV" tvg-name="ATV" group-title="Ulusal" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/atv-tr.png",ATV
https://rnttwmjcin.turknet.ercdn.net/lcpmvefbyo/atv/atv_480p.m3u8

#EXTINF:-1 tvg-id="NOWTV" tvg-name="NOW TV" group-title="Ulusal" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/now-tr.png",NOW TV
https://uycyyuuzyh.turknet.ercdn.net/nphindgytw/nowtv/nowtv_480p.m3u8

#EXTINF:-1 tvg-id="TV8" tvg-name="TV8 HD" group-title="Ulusal" tvg-logo="https://img.tv8.com.tr/s/template/v2/img/tv8-logo.png",TV8 HD
http://tv8.daioncdn.net/tv8/tv8_720p.m3u8?app=7ddc255a-ef47-4e81-ab14-c0e5f2949788&ce=3

#EXTINF:-1 tvg-id="TV85" tvg-name="TV8.5" group-title="Ulusal" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/tv85-tr.png",TV8.5
https://tv8.daioncdn.net/tv8bucuk/tv8bucuk.m3u8?app=tv8bucuk_web

#EXTINF:-1 tvg-id="KANAL7" tvg-name="KANAL 7" group-title="Ulusal" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/kanal-7-tr.png",KANAL 7
https://kanal7-live.daioncdn.net/kanal7/kanal7_720p.m3u8

#EXTINF:-1 tvg-id="BEYAZTV" tvg-name="BEYAZ TV" group-title="Ulusal" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/beyaz-tv-tr.png",BEYAZ TV
https://beyaztv-live.daioncdn.net/beyaztv/beyaztv_720p.m3u8

#EXTINF:-1 tvg-id="TRT2" tvg-name="TRT 2" group-title="Ulusal" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/trt-2-tr.png",TRT 2
https://tv-trt2.medya.trt.com.tr/master_720.m3u8

#EXTINF:-1 tvg-id="A2" tvg-name="A2" group-title="Ulusal" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/a2-tr.png",A2
https://rnttwmjcin.turknet.ercdn.net/lcpmvefbyo/a2tv/a2tv.m3u8

#EXTINF:-1 tvg-id="DreamTrkTV" tvg-name="Dream Türk TV" group-title="Ulusal" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/dream-turk-tr.png",Dream Türk TV
https://live.duhnet.tv/S2/HLS_LIVE/dreamturknp/playlist.m3u8

#EXTINF:-1 tvg-id="lkeTV" tvg-name="Ülke TV" group-title="Ulusal" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/ulke-tv-tr.png",Ülke TV
https://livetv.radyotvonline.net/kanal7live/ulketv/chunklist.m3u8

#EXTINF:-1 tvg-id="TRTHaber" tvg-name="TRT Haber" group-title="Haber" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/trt-haber-tr.png",TRT Haber
https://tv-trthaber.medya.trt.com.tr/master.m3u8

#EXTINF:-1 tvg-id="HaberTrk" tvg-name="Haber Türk" group-title="Haber" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/haberturk-tr.png",Haber Türk
https://tv.ensonhaber.com/haberturk/haberturk.m3u8

#EXTINF:-1 tvg-id="CNNTURK" tvg-name="CNN TURK" group-title="Haber" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/cnn-turk-tr.png",CNN TURK
http://dzcvip1.xyz:2095/live/yasar7062/yasar.7062/110239.m3u8

#EXTINF:-1 tvg-id="NTV" tvg-name="NTV" group-title="Haber" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/ntv-tr.png",NTV
https://dogus.daioncdn.net/ntv/ntv.m3u8?app=ntv_web

#EXTINF:-1 tvg-id="HaberGlobal" tvg-name="Haber Global" group-title="Haber" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/haber-global-tr.png",Haber Global
https://tv.ensonhaber.com/haberglobal/haberglobal.m3u8

#EXTINF:-1 tvg-id="HalkTV" tvg-name="Halk TV" group-title="Haber" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/halk-tv-tr.png",Halk TV
https://halktv-live.daioncdn.net/halktv/halktv.m3u8

#EXTINF:-1 tvg-id="24TV" tvg-name="24 TV" group-title="Haber" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/24-tr.png",24 TV
https://tv.ensonhaber.com/tv24/tv24.m3u8

#EXTINF:-1 tvg-id="360TV" tvg-name="360 TV" group-title="Haber" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/360-tr.png",360 TV
https://turkmedya-live.ercdn.net/tv360/tv360.m3u8

#EXTINF:-1 tvg-id="CNBCE" tvg-name="CNBC-E" group-title="Haber" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/cnbc-e-tr.png",CNBC-E
https://hnpsechtsc.turknet.ercdn.net/xpnvudnlsv/cnbc-e/cnbc-e.m3u8

#EXTINF:-1 tvg-id="TBMMTV" tvg-name="TBMM TV" group-title="Haber" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/tbmm-tv-tr.png",TBMM TV
https://meclistv-live.ercdn.net/meclistv/meclistv.m3u8

#EXTINF:-1 tvg-id="DHACanli" tvg-name="DHA Canlı" group-title="Haber" tvg-logo="https://static.dha.com.tr/images/dha/dha-logo.png?v=1",DHA Canlı
https://603c568fccdf5.streamlock.net/live/dhaweb1_C5efC/playlist.m3u8

#EXTINF:-1 tvg-id="FLASHHABER" tvg-name="FLASH HABER" group-title="Haber" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/flash-tv-tr.png",FLASH HABER
https://flashhaber-live.ercdn.net/flashhaber/flashhaber.m3u8

#EXTINF:-1 tvg-id="TGRTHaber" tvg-name="TGRT Haber" group-title="Haber" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/tgrt-haber-tr.png",TGRT Haber
https://tgrthaber-live.daioncdn.net/tgrthaber/tgrthaber_1080p.m3u8

#EXTINF:-1 tvg-id="BloombergHT" tvg-name="Bloomberg HT" group-title="Haber" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/bloomberg-ht-tr.png",Bloomberg HT
https://tatatam.trt1sultanfatihss.workers.dev/https://ciner.daioncdn.net/bloomberght/bloomberght_720p.m3u8?app=201b9556-b11c-4d92-b264-f21fd24e9aaf&ce=3

#EXTINF:-1 tvg-id="TRTBelgesel" tvg-name="TRT Belgesel" group-title="Belgesel" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/trt-belgesel-tr.png",TRT Belgesel
https://tv-trtbelgesel.medya.trt.com.tr/master.m3u8

#EXTINF:-1 tvg-id="TLC" tvg-name="TLC" group-title="Belgesel" tvg-logo="https://graph.facebook.com/TLCTurkiye/picture?type=large",TLC
https://dogus.daioncdn.net/tlc/tlc.m3u8?app=tlc_web

#EXTINF:-1 tvg-id="DMAX" tvg-name="DMAX" group-title="Belgesel" tvg-logo="https://graph.facebook.com/DMAXTR/picture?type=large",DMAX
https://dogus.daioncdn.net/dmax/dmax.m3u8?app=dmax_web

#EXTINF:-1 tvg-id="BelgeselTV" tvg-name="Belgesel TV" group-title="Belgesel" tvg-logo="https://graph.facebook.com/BelgeselTVHD/picture?type=large",Belgesel TV
https://playlist.fasttvcdn.com/pl/rfrk9821hdy9dayo8wfyha/belgesel-tv/playlist/0.m3u8

#EXTINF:-1 tvg-id="YabanTV" tvg-name="Yaban TV" group-title="Belgesel" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/yaban-tr.png",Yaban TV
https://trn03.tulix.tv/gt-yabantv/tracks-v1a1/mono.m3u8?token=0631e8753bcdf25bb2a5015db22ec082

#EXTINF:-1 tvg-id="NATGEO" tvg-name="National Geographic" group-title="Belgesel" tvg-logo="https://graph.facebook.com/natgeomedia/picture?type=large",National Geographic
http://dzcvip1.xyz:2095/live/yasar7062/yasar.7062/101220.m3u8
http://ctn34.xyz:2095/bnym5594tv/bny2710cc00bb/101220
http://ccgbndrby11.xyz:2095/bnym5594tv/bny2710cc00bb/101220
http://dpsmartone.xyz:2095/bnym5594tv/bny2710cc00bb/101220

#EXTINF:-1 tvg-id="NG" tvg-name="Nat Geo Wild" group-title="Belgesel" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/d/d6/Nat_Geo_Wild_logo.png",Nat Geo Wild
http://dzcvip1.xyz:2095/live/yasar7062/yasar.7062/27208.m3u8
http://ctn34.xyz:2095/bnym5594tv/bny2710cc00bb/27208
http://ccgbndrby11.xyz:2095/bnym5594tv/bny2710cc00bb/27208
http://dpsmartone.xyz:2095/bnym5594tv/bny2710cc00bb/27208

#EXTINF:-1 tvg-id="TarihTV" tvg-name="Tarih TV HD" group-title="Belgesel" tvg-logo="https://graph.facebook.com/TarihTV/picture?type=large",Tarih TV HD
http://dzcvip1.xyz:2095/live/yasar7062/yasar.7062/116410.m3u8
http://ctn34.xyz:2095/bnym5594tv/bny2710cc00bb/116410
http://ccgbndrby11.xyz:2095/bnym5594tv/bny2710cc00bb/116410
http://dpsmartone.xyz:2095/bnym5594tv/bny2710cc00bb/116410

#EXTINF:-1 tvg-id="ViasatHistory" tvg-name="Viasat History" group-title="Belgesel" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/6/6f/Viasat_History.png",Viasat History
http://dzcvip1.xyz:2095/live/yasar7062/yasar.7062/89521.m3u8
http://ctn34.xyz:2095/bnym5594tv/bny2710cc00bb/89521
http://ccgbndrby11.xyz:2095/bnym5594tv/bny2710cc00bb/89521
http://dpsmartone.xyz:2095/bnym5594tv/bny2710cc00bb/89521

#EXTINF:-1 tvg-id="S1" tvg-name="beIN Sports 1" group-title="Premium Spor" tvg-logo="https://bootflare.com/wp-content/uploads/2026/01/Bein-Sports-1-Logo.png",beIN Sports 1
http://dzcvip1.xyz:2095/live/yasar7062/yasar.7062/209476.m3u8
http://ctn34.xyz:2095/bnym5594tv/bny2710cc00bb/209476
http://ccgbndrby11.xyz:2095/bnym5594tv/bny2710cc00bb/209476
http://dpsmartone.xyz:2095/bnym5594tv/bny2710cc00bb/209476

#EXTINF:-1 tvg-id="S2" tvg-name="beIN Sports 2" group-title="Premium Spor" tvg-logo="https://bootflare.com/wp-content/uploads/2026/01/Bein-Sports-2-Logo.png",beIN Sports 2
http://dzcvip1.xyz:2095/live/yasar7062/yasar.7062/114123.m3u8
http://ctn34.xyz:2095/bnym5594tv/bny2710cc00bb/114123
http://ccgbndrby11.xyz:2095/bnym5594tv/bny2710cc00bb/114123
http://dpsmartone.xyz:2095/bnym5594tv/bny2710cc00bb/114123

#EXTINF:-1 tvg-id="S3" tvg-name="beIN Sports 3" group-title="Premium Spor" tvg-logo="https://bootflare.com/wp-content/uploads/2026/01/Bein-Sports-3-Logo.png",beIN Sports 3
http://dzcvip1.xyz:2095/live/yasar7062/yasar.7062/104267.m3u8
http://ctn34.xyz:2095/bnym5594tv/bny2710cc00bb/104267
http://ccgbndrby11.xyz:2095/bnym5594tv/bny2710cc00bb/104267
http://dpsmartone.xyz:2095/bnym5594tv/bny2710cc00bb/104267

#EXTINF:-1 tvg-id="S4" tvg-name="beIN Sports 4" group-title="Premium Spor" tvg-logo="https://images.seeklogo.com/logo-png/48/2/bein-sports-logo-png_seeklogo-481582.png",beIN Sports 4
http://dzcvip1.xyz:2095/live/yasar7062/yasar.7062/122537.m3u8
http://ctn34.xyz:2095/bnym5594tv/bny2710cc00bb/122537
http://ccgbndrby11.xyz:2095/bnym5594tv/bny2710cc00bb/122537
http://dpsmartone.xyz:2095/bnym5594tv/bny2710cc00bb/122537

#EXTINF:-1 tvg-id="S5" tvg-name="beIN Sports 5" group-title="Premium Spor" tvg-logo="https://images.seeklogo.com/logo-png/48/2/bein-sports-logo-png_seeklogo-481582.png",beIN Sports 5
http://dzcvip1.xyz:2095/live/yasar7062/yasar.7062/149161.m3u8
http://ctn34.xyz:2095/bnym5594tv/bny2710cc00bb/149161
http://ccgbndrby11.xyz:2095/bnym5594tv/bny2710cc00bb/149161
http://dpsmartone.xyz:2095/bnym5594tv/bny2710cc00bb/149161

#EXTINF:-1 tvg-id="SP1" tvg-name="S Sport Plus 1" group-title="Premium Spor" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/s-sport-plus-tr.png",S Sport Plus 1
http://dzcvip1.xyz:2095/live/yasar7062/yasar.7062/193970.m3u8
http://ctn34.xyz:2095/bnym5594tv/bny2710cc00bb/193970
http://ccgbndrby11.xyz:2095/bnym5594tv/bny2710cc00bb/193970
http://dpsmartone.xyz:2095/bnym5594tv/bny2710cc00bb/193970

#EXTINF:-1 tvg-id="SS1HD" tvg-name="S-SPORT 1 HD" group-title="Premium Spor" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/s-sport-tr.png",S-SPORT 1 HD
http://dzcvip1.xyz:8080/live/yasar7062/yasar.7062/71749.m3u8
http://ctn34.xyz:2095/bnym5594tv/bny2710cc00bb/71749
http://ccgbndrby11.xyz:2095/bnym5594tv/bny2710cc00bb/71749
http://dpsmartone.xyz:2095/bnym5594tv/bny2710cc00bb/71749

#EXTINF:-1 tvg-id="TivibuSpor1" tvg-name="Tivibu Spor 1" group-title="Premium Spor" tvg-logo="https://graph.facebook.com/TivibuSpor/picture?type=large",Tivibu Spor 1
http://dzcvip1.xyz:2095/live/yasar7062/yasar.7062/90373.m3u8
http://ctn34.xyz:2095/bnym5594tv/bny2710cc00bb/90373
http://ccgbndrby11.xyz:2095/bnym5594tv/bny2710cc00bb/90373
http://dpsmartone.xyz:2095/bnym5594tv/bny2710cc00bb/90373

#EXTINF:-1 tvg-id="TivibuSpor2" tvg-name="Tivibu Spor 2" group-title="Premium Spor" tvg-logo="https://graph.facebook.com/TivibuSpor/picture?type=large",Tivibu Spor 2
http://dzcvip1.xyz:2095/live/yasar7062/yasar.7062/44717.m3u8
http://ctn34.xyz:2095/bnym5594tv/bny2710cc00bb/44717
http://ccgbndrby11.xyz:2095/bnym5594tv/bny2710cc00bb/44717
http://dpsmartone.xyz:2095/bnym5594tv/bny2710cc00bb/44717

#EXTINF:-1 tvg-id="TivibuSpor3" tvg-name="Tivibu Spor 3" group-title="Premium Spor" tvg-logo="https://graph.facebook.com/TivibuSpor/picture?type=large",Tivibu Spor 3
http://dzcvip1.xyz:2095/live/yasar7062/yasar.7062/37476.m3u8
http://ctn34.xyz:2095/bnym5594tv/bny2710cc00bb/37476
http://ccgbndrby11.xyz:2095/bnym5594tv/bny2710cc00bb/37476
http://dpsmartone.xyz:2095/bnym5594tv/bny2710cc00bb/37476

#EXTINF:-1 tvg-id="TivibuSpor4" tvg-name="Tivibu Spor 4" group-title="Premium Spor" tvg-logo="https://graph.facebook.com/TivibuSpor/picture?type=large",Tivibu Spor 4
http://dzcvip1.xyz:2095/live/yasar7062/yasar.7062/70739.m3u8
http://ctn34.xyz:2095/bnym5594tv/bny2710cc00bb/70739
http://ccgbndrby11.xyz:2095/bnym5594tv/bny2710cc00bb/70739
http://dpsmartone.xyz:2095/bnym5594tv/bny2710cc00bb/70739

#EXTINF:-1 tvg-id="TS1" tvg-name="Tabii Spor 1 (sadece maç zamanı aktif)" group-title="Premium Spor" tvg-logo="https://latestlogo.com/wp-content/uploads/2024/01/tabii-logo.png",Tabii Spor 1
http://dzcvip1.xyz:2095/live/yasar7062/yasar.7062/208873.m3u8
http://ctn34.xyz:2095/bnym5594tv/bny2710cc00bb/208873
http://ccgbndrby11.xyz:2095/bnym5594tv/bny2710cc00bb/208873
http://dpsmartone.xyz:2095/bnym5594tv/bny2710cc00bb/208873

#EXTINF:-1 tvg-id="TS2" tvg-name="Tabii Spor 2 (sadece maç zamanı aktif)" group-title="Premium Spor" tvg-logo="https://latestlogo.com/wp-content/uploads/2024/01/tabii-logo.png",Tabii Spor 2
http://dzcvip1.xyz:2095/live/yasar7062/yasar.7062/208874.m3u8
http://ctn34.xyz:2095/bnym5594tv/bny2710cc00bb/208874
http://ccgbndrby11.xyz:2095/bnym5594tv/bny2710cc00bb/208874
http://dpsmartone.xyz:2095/bnym5594tv/bny2710cc00bb/208874

#EXTINF:-1 tvg-id="TS3" tvg-name="Tabii Spor 3 (sadece maç zamanı aktif)" group-title="Premium Spor" tvg-logo="https://latestlogo.com/wp-content/uploads/2024/01/tabii-logo.png",Tabii Spor 3
http://dzcvip1.xyz:2095/live/yasar7062/yasar.7062/208875.m3u8
http://ctn34.xyz:2095/bnym5594tv/bny2710cc00bb/208875
http://ccgbndrby11.xyz:2095/bnym5594tv/bny2710cc00bb/208875
http://dpsmartone.xyz:2095/bnym5594tv/bny2710cc00bb/208875

#EXTINF:-1 tvg-id="TS4" tvg-name="Tabii Spor 4 (sadece maç zamanı aktif)" group-title="Premium Spor" tvg-logo="https://latestlogo.com/wp-content/uploads/2024/01/tabii-logo.png",Tabii Spor 4
http://dzcvip1.xyz:2095/live/yasar7062/yasar.7062/208876.m3u8
http://ctn34.xyz:2095/bnym5594tv/bny2710cc00bb/208876
http://ccgbndrby11.xyz:2095/bnym5594tv/bny2710cc00bb/208876
http://dpsmartone.xyz:2095/bnym5594tv/bny2710cc00bb/208876

#EXTINF:-1 tvg-id="TRTSpor" tvg-name="TRT Spor" group-title="TR Spor" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/trt-spor-tr.png",TRT Spor
https://tv-trtspor1.medya.trt.com.tr/master.m3u8

#EXTINF:-1 tvg-id="TRTSporYldz" tvg-name="TRT Spor Yıldız" group-title="TR Spor" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/trt-spor-yildiz-tr.png",TRT Spor Yıldız
https://trt.daioncdn.net/trtspor-yildiz/master_1080p.m3u8?app=web&platform=trtspor

#EXTINF:-1 tvg-id="ASpor" tvg-name="A Spor" group-title="TR Spor" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/a-spor-tr.png",A Spor
https://rnttwmjcin.turknet.ercdn.net/lcpmvefbyo/aspor/aspor.m3u8

#EXTINF:-1 tvg-id="HTSpor" tvg-name="HT Spor" group-title="TR Spor" tvg-logo="https://graph.facebook.com/HTSpor/picture?type=large",HT Spor
https://ciner-live.ercdn.net/htspor/htspor_720p.m3u8

#EXTINF:-1 tvg-id="EkolSports" tvg-name="Ekol Sports" group-title="TR Spor" tvg-logo="https://graph.facebook.com/EkolSpor/picture?type=large",Ekol Sports
https://ekoltv-live.ercdn.net/ekolsport/ekolsport.m3u8

#EXTINF:-1 tvg-id="TJKTV" tvg-name="TJK TV" group-title="TR Spor" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/tjk-tv-tr.png",TJK TV
https://tjktv-live.tjk.org/tjktv.m3u8

#EXTINF:-1 tvg-id="TJKTV2" tvg-name="TJK TV 2" group-title="TR Spor" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/tjk-tv-tr.png",TJK TV 2
https://tjktv-live.tjk.org/tjktv2/tjktv2.m3u8

#EXTINF:-1 tvg-id="TayTV" tvg-name="Tay TV" group-title="TR Spor" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/tay-tv-tr.png",Tay TV
https://duhnet.hipodrom.com/S2/HLS_LIVE/mislitaynp/playlist.m3u8

#EXTINF:-1 tvg-id="M2" tvg-name="Sinema 2" group-title="Sinema & Dizi" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/sinema-tv2-tr.png",Sinema 2
http://dzcvip1.xyz:2095/live/yasar7062/yasar.7062/41626.m3u8

#EXTINF:-1 tvg-id="M9" tvg-name="Sinema Yerli" group-title="Sinema & Dizi" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/sinema-yerli-tr.png",Sinema Yerli
http://dzcvip1.xyz:2095/live/yasar7062/yasar.7062/122557.m3u8

#EXTINF:-1 tvg-id="M11" tvg-name="Sinema Aile 2" group-title="Sinema & Dizi" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/sinema-aile2-tr.png",Sinema Aile 2
http://dzcvip1.xyz:2095/live/yasar7062/yasar.7062/143012.m3u8

#EXTINF:-1 tvg-id="M12" tvg-name="Sinema Komedi 2" group-title="Sinema & Dizi" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/sinema-komedi2-tr.png",Sinema Komedi 2
http://dzcvip1.xyz:2095/live/yasar7062/yasar.7062/43101.m3u8

#EXTINF:-1 tvg-id="M13" tvg-name="Movie Smart Türk" group-title="Sinema & Dizi" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/movie-smart-turk-tr.png",Movie Smart Türk
http://dzcvip1.xyz:2095/live/yasar7062/yasar.7062/89760.m3u8

#EXTINF:-1 tvg-id="BB1" tvg-name="BEIN Box Office 1" group-title="Sinema & Dizi" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/bein-box-office-1-tr.png",BEIN Box Office 1
http://dzcvip1.xyz:2095/live/yasar7062/yasar.7062/29343.m3u8

#EXTINF:-1 tvg-id="BB2" tvg-name="BEIN Box Office 2" group-title="Sinema & Dizi" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/bein-box-office-2-tr.png",BEIN Box Office 2
http://dzcvip1.xyz:2095/live/yasar7062/yasar.7062/148008.m3u8

#EXTINF:-1 tvg-id="BB3" tvg-name="BEIN Box Office 3" group-title="Sinema & Dizi" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/bein-box-office-3-tr.png",BEIN Box Office 3
http://dzcvip1.xyz:2095/live/yasar7062/yasar.7062/149772.m3u8

#EXTINF:-1 tvg-id="FX" tvg-name="FX" group-title="Sinema & Dizi" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/fx-tr.png",FX
http://dzcvip1.xyz:2095/live/yasar7062/yasar.7062/20027.m3u8

#EXTINF:-1 tvg-id="Tabii" tvg-name="Tabii" group-title="Sinema & Dizi" tvg-logo="https://latestlogo.com/wp-content/uploads/2024/01/tabii-logo.png",Tabii
https://ceokzokgtd.erbvr.com/tabiitv/tabiitv.m3u8

#EXTINF:-1 tvg-id="TRTocuk" tvg-name="TRT Çocuk" group-title="Çocuk" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/trt-cocuk-tr.png",TRT Çocuk
https://tv-trtcocuk.medya.trt.com.tr/master_720.m3u8

#EXTINF:-1 tvg-id="TRTDiyanetocuk" tvg-name="TRT Diyanet Çocuk" group-title="Çocuk" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/trt-cocuk-tr.png",TRT Diyanet Çocuk
https://tv-trtdiyanetcocuk.medya.trt.com.tr/master.m3u8

#EXTINF:-1 tvg-id="TRTEBATV" tvg-name="TRT EBA TV" group-title="Çocuk" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/eba-tv-ilkokul-tr.png",TRT EBA TV
https://tv-e-okul01.medya.trt.com.tr/master.m3u8

#EXTINF:-1 tvg-id="BabyTV" tvg-name="Baby TV" group-title="Çocuk" tvg-logo="https://graph.facebook.com/babytvtr/picture?type=large",Baby TV
https://saran-live.ercdn.net/babytv/index.m3u8

#EXTINF:-1 tvg-id="DisneyJunior" tvg-name="Disney Junior" group-title="Çocuk" tvg-logo="https://graph.facebook.com/DisneyJuniorTR/picture?type=large",Disney Junior
https://saran-live.ercdn.net/disneyjunior/index.m3u8

#EXTINF:-1 tvg-id="DiyanetTV" tvg-name="Diyanet TV" group-title="Din" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/diyanet-tv-tr.png",Diyanet TV
https://eustr73.mediatriple.net/videoonlylive/mtikoimxnztxlive/broadcast_5e3bf95a47e07.smil/playlist.m3u8

#EXTINF:-1 tvg-id="SemerkandTV" tvg-name="Semerkand TV" group-title="Din" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/semerkand-tv-tr.png",Semerkand TV
https://b01c02nl.mediatriple.net/videoonlylive/mtisvwurbfcyslive/broadcast_58d915bd40efc.smil/playlist.m3u8

#EXTINF:-1 tvg-id="DostTV" tvg-name="Dost TV" group-title="Din" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/dost-tv-tr.png",Dost TV
https://dost.stream.emsal.im/tv/live.m3u8

#EXTINF:-1 tvg-id="RehberTV" tvg-name="Rehber TV" group-title="Din" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/rehber-tv-tr.png",Rehber TV
https://cdn4.yayin.com.tr/rehbertv/tracks-v1a1/mono.m3u8

#EXTINF:-1 tvg-id="LaleglTV" tvg-name="Lalegül TV" group-title="Din" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/lalegul-tv-tr.png",Lalegül TV
https://lbl.netmedya.net/hls/lalegultv.m3u8

#EXTINF:-1 tvg-id="Sat7Trk" tvg-name="Sat 7 Türk" group-title="Din" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/sat7-turk-tr.png",Sat 7 Türk
https://live.artidijitalmedya.com/artidijital_sat7turk/sat7turk/playlist.m3u8

#EXTINF:-1 tvg-id="eurod" tvg-name="Euro D" group-title="Yurtdışı" tvg-logo="https://eurod.kanald.com.tr/assets/img/logo.v5.png",Euro D
https://live.duhnet.tv/S2/HLS_LIVE/eurodnp/track_4_1000/playlist.m3u8

#EXTINF:-1 tvg-id="kanal7avrupa" tvg-name="Kanal 7 Avrupa" group-title="Yurtdışı" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/kanal-7-tr.png",Kanal 7 Avrupa
https://livetv.radyotvonline.net/kanal7live/kanal7avr/playlist.m3u8

#EXTINF:-1 tvg-id="ard.de" tvg-name="DE: Das Erste (Almanya)" group-title="Yurtdışı" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Das_Erste_Logo_2019.svg/512px-Das_Erste_Logo_2019.svg.png",DE: Das Erste (Almanya)
http://ctn34.xyz:2095/bnym5594tv/bny2710cc00bb/8878

#EXTINF:-1 tvg-id="zdf.de" tvg-name="DE: ZDF (Almanya)" group-title="Yurtdışı" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/ZDF_logo_%282018%29.svg/512px-ZDF_logo_%282018%29.svg.png",DE: ZDF (Almanya)
http://ctn34.xyz:2095/bnym5594tv/bny2710cc00bb/140393

#EXTINF:-1 tvg-id="rtl.de" tvg-name="DE: RTL (Almanya)" group-title="Yurtdışı" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/RTL_Logo_2021.svg/512px-RTL_Logo_2021.svg.png",DE: RTL (Almanya)
http://ctn34.xyz:2095/bnym5594tv/bny2710cc00bb/82762

#EXTINF:-1 tvg-id="sat1.de" tvg-name="DE: SAT.1 (Almanya)" group-title="Yurtdışı" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Sat.1_Logo_2023.svg/512px-Sat.1_Logo_2023.svg.png",DE: SAT.1 (Almanya)
http://ctn34.xyz:2095/bnym5594tv/bny2710cc00bb/106318

#EXTINF:-1 tvg-id="pro7.de" tvg-name="DE: ProSieben (Almanya)" group-title="Yurtdışı" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/ProSieben_Logo_2023.svg/512px-ProSieben_Logo_2023.svg.png",DE: ProSieben (Almanya)
http://ctn34.xyz:2095/bnym5594tv/bny2710cc00bb/139788

#EXTINF:-1 tvg-id="vox.de" tvg-name="DE: VOX (Almanya)" group-title="Yurtdışı" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/VOX_Logo_2023.svg/512px-VOX_Logo_2023.svg.png",DE: VOX (Almanya)
http://ctn34.xyz:2095/bnym5594tv/bny2710cc00bb/84981

#EXTINF:-1 tvg-id="kabel1.de" tvg-name="DE: Kabel 1 (Almanya)" group-title="Yurtdışı" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Kabel_eins_Logo_2023.svg/512px-Kabel_eins_Logo_2023.svg.png",DE: Kabel 1 (Almanya)
http://ctn34.xyz:2095/bnym5594tv/bny2710cc00bb/74278

#EXTINF:-1 tvg-id="rtl2.de" tvg-name="DE: RTL 2 (Almanya)" group-title="Yurtdışı" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/RTLZWEI_Logo_2023.svg/512px-RTLZWEI_Logo_2023.svg.png",DE: RTL 2 (Almanya)
http://ctn34.xyz:2095/bnym5594tv/bny2710cc00bb/149615

#EXTINF:-1 tvg-id="npo1" tvg-name="NL: NPO 1 (Hollanda)" group-title="Yurtdışı" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/NPO_1_logo_2014.svg/512px-NPO_1_logo_2014.svg.png",NL: NPO 1 (Hollanda)
http://ctn34.xyz:2095/bnym5594tv/bny2710cc00bb/60848
http://ccgbndrby11.xyz:2095/bnym5594tv/bny2710cc00bb/60848
http://dpsmartone.xyz:2095/bnym5594tv/bny2710cc00bb/60848

#EXTINF:-1 tvg-id="npo2" tvg-name="NL: NPO 2 (Hollanda)" group-title="Yurtdışı" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/NPO_2_logo_2014.svg/512px-NPO_2_logo_2014.svg.png",NL: NPO 2 (Hollanda)
http://ctn34.xyz:2095/bnym5594tv/bny2710cc00bb/104648
http://ccgbndrby11.xyz:2095/bnym5594tv/bny2710cc00bb/104648
http://dpsmartone.xyz:2095/bnym5594tv/bny2710cc00bb/104648

#EXTINF:-1 tvg-id="rtl4nl" tvg-name="NL: RTL 4 (Hollanda)" group-title="Yurtdışı" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/RTL_4_logo_2023.svg/512px-RTL_4_logo_2023.svg.png",NL: RTL 4 (Hollanda)
http://ctn34.xyz:2095/bnym5594tv/bny2710cc00bb/37353
http://ccgbndrby11.xyz:2095/bnym5594tv/bny2710cc00bb/37353
http://dpsmartone.xyz:2095/bnym5594tv/bny2710cc00bb/37353

#EXTINF:-1 tvg-id="rtl7nl" tvg-name="NL: RTL 7 (Hollanda)" group-title="Yurtdışı" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/RTL_7_logo_2023.svg/512px-RTL_7_logo_2023.svg.png",NL: RTL 7 (Hollanda)
http://ctn34.xyz:2095/bnym5594tv/bny2710cc00bb/87449
http://ccgbndrby11.xyz:2095/bnym5594tv/bny2710cc00bb/87449
http://dpsmartone.xyz:2095/bnym5594tv/bny2710cc00bb/87449

#EXTINF:-1 tvg-id="rtl8nl" tvg-name="NL: RTL 8 (Hollanda)" group-title="Yurtdışı" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/RTL8_2023.svg/512px-RTL8_2023.svg.png",NL: RTL 8 (Hollanda)
http://ctn34.xyz:2095/bnym5594tv/bny2710cc00bb/63836
http://ccgbndrby11.xyz:2095/bnym5594tv/bny2710cc00bb/63836
http://dpsmartone.xyz:2095/bnym5594tv/bny2710cc00bb/63836

#EXTINF:-1 tvg-id="rai1it" tvg-name="IT: RAI 1 (İtalya)" group-title="Yurtdışı" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Rai_1_-_Logo_2025.svg/512px-Rai_1_-_Logo_2025.svg.png",IT: RAI 1 (İtalya)
http://ctn34.xyz:2095/bnym5594tv/bny2710cc00bb/222067

#EXTINF:-1 tvg-id="aztvaz" tvg-name="AZ: AZTV (Azerbaycan)" group-title="Yurtdışı" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/AzTV_logo.png/512px-AzTV_logo.png",AZ: AZTV (Azerbaycan)
http://ctn34.xyz:2095/bnym5594tv/bny2710cc00bb/75138
http://ccgbndrby11.xyz:2095/bnym5594tv/bny2710cc00bb/75138
http://dpsmartone.xyz:2095/bnym5594tv/bny2710cc00bb/75138

#EXTINF:-1 tvg-id="protvro" tvg-name="RO: PRO TV (Romanya)" group-title="Yurtdışı" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Pro_TV_logo_2020.svg/512px-Pro_TV_logo_2020.svg.png",RO: PRO TV (Romanya)
http://ctn34.xyz:2095/bnym5594tv/bny2710cc00bb/168098
http://ccgbndrby11.xyz:2095/bnym5594tv/bny2710cc00bb/168098
http://dpsmartone.xyz:2095/bnym5594tv/bny2710cc00bb/168098

#EXTINF:-1 tvg-id="tvr3ro" tvg-name="RO: TVR 3 (Romanya)" group-title="Yurtdışı" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/TVR_3_Logo_2022.svg/512px-TVR_3_Logo_2022.svg.png",RO: TVR 3 (Romanya)
http://ctn34.xyz:2095/bnym5594tv/bny2710cc00bb/160511
http://ccgbndrby11.xyz:2095/bnym5594tv/bny2710cc00bb/160511
http://dpsmartone.xyz:2095/bnym5594tv/bny2710cc00bb/160511

#EXTINF:-1 tvg-id="dr1dk" tvg-name="DK: DR1 (Danimarka)" group-title="Yurtdışı" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/DR1_logo.svg/512px-DR1_logo.svg.png",DK: DR1 (Danimarka)
http://ctn34.xyz:2095/bnym5594tv/bny2710cc00bb/7608

#EXTINF:-1 tvg-id="dr2dk" tvg-name="DK: DR2 (Danimarka)" group-title="Yurtdışı" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/DR2-Logo_%28D%C3%A4nemark%29.svg/512px-DR2-Logo_%28D%C3%A4nemark%29.svg.png",DK: DR2 (Danimarka)
http://ctn34.xyz:2095/bnym5594tv/bny2710cc00bb/110225

#EXTINF:-1 tvg-id="nba1" tvg-name="NBA League Pass 1" group-title="Yurtdışı" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/National_Basketball_Association_logo.svg/512px-National_Basketball_Association_logo.svg.png",NBA League Pass 1
http://ctn34.xyz:2095/bnym5594tv/bny2710cc00bb/136595

#EXTINF:-1 tvg-id="TRTWorld" tvg-name="TRT World" group-title="Dünya" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/trt-world-tr.png",TRT World
https://tv-trtworld.medya.trt.com.tr/master.m3u8

#EXTINF:-1 tvg-id="TRTArabi" tvg-name="TRT Arabi" group-title="Dünya" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/trt-arabi-tr.png",TRT Arabi
https://tv-trtarabi.medya.trt.com.tr/master.m3u8

#EXTINF:-1 tvg-id="TRTKurdi" tvg-name="TRT Kurdi" group-title="Dünya" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/trt-kurdi-tr.png",TRT Kurdi
https://tv-trtkurdi.medya.trt.com.tr/master.m3u8

#EXTINF:-1 tvg-id="PersianaTrkiye" tvg-name="Persiana Türkiye" group-title="Dünya" tvg-logo="https://static.wikia.nocookie.net/logopedia/images/e/e9/Persiana-turkiye-fr.png",Persiana Türkiye
https://turkhls.persiana.live/hls/stream.m3u8

#EXTINF:-1 tvg-id="SyriaTV" tvg-name="Syria TV" group-title="Dünya" tvg-logo="https://upload.wikimedia.org/wikipedia/en/thumb/d/d2/Syria_TV_logo.svg/250px-Syria_TV_logo.svg.png",Syria TV
https://live.kwikmotion.com/syriatvlive/syriatv.smil/playlist_dvr.m3u8

#EXTINF:-1 tvg-id="BloombergUS" tvg-name="Bloomberg TV US" group-title="Dünya" tvg-logo="https://companieslogo.com/img/orig/bloomberg-505a6be6.png?t=1720244494",Bloomberg TV US
https://bloomberg.com/media-manifest/streams/us.m3u8

#EXTINF:-1 tvg-id="NBCNewsNOW" tvg-name="NBC News NOW" group-title="Dünya" tvg-logo="https://latestlogo.com/wp-content/uploads/2024/12/nbc-news-now.png",NBC News NOW
https://d1bl6tskrpq9ze.cloudfront.net/hls/master.m3u8?ads.xumo_channelId=99984003

#EXTINF:-1 tvg-id="DWEnglish" tvg-name="DW English" group-title="Dünya" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Deutsche_Welle_symbol_2012.svg/512px-Deutsche_Welle_symbol_2012.svg.png",DW English
https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/master.m3u8

#EXTINF:-1 tvg-id="RTNews" tvg-name="RT News" group-title="Dünya" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/RT_%28TV_network%29_logo_2021.svg/512px-RT_%28TV_network%29_logo_2021.svg.png",RT News
https://wisewatchoott.wiseplayout.com/RT/master.m3u8

#EXTINF:-1 tvg-id="France24_FR" tvg-name="France 24 French" group-title="Dünya" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/8/8a/France24.png",France 24 French
https://live.france24.com/hls/live/2037179/F24_FR_HI_HLS/master_5000.m3u8

#EXTINF:-1 tvg-id="TRTMzik" tvg-name="TRT Müzik" group-title="Müzik" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/trt-muzik-tr.png",TRT Müzik
https://tv-trtmuzik.medya.trt.com.tr/master_720.m3u8

#EXTINF:-1 tvg-id="PowerTV" tvg-name="Power TV" group-title="Müzik" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/power-tv-tr.png",Power TV
https://livetv.powerapp.com.tr/powerTV/powerhd.smil/playlist.m3u8

#EXTINF:-1 tvg-id="PowerTrk" tvg-name="Power Türk" group-title="Müzik" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/powerturk-tr.png",Power Türk
https://livetv.powerapp.com.tr/powerturkTV/powerturkhd.smil/playlist.m3u8

#EXTINF:-1 tvg-id="NR1Trk" tvg-name="NR1 Türk" group-title="Müzik" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/nr1-turk-tr.png",NR1 Türk
https://b01c02nl.mediatriple.net/videoonlylive/mtkgeuihrlfwlive/broadcast_5c9e187770143.smil/playlist.m3u8

#EXTINF:-1 tvg-id="Number1TV" tvg-name="Number 1 TV" group-title="Müzik" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/nr1-tr.png",Number 1 TV
https://b01c02nl.mediatriple.net/videoonlylive/mtkgeuihrlfwlive/broadcast_5c9e17cd59e8b.smil/playlist.m3u8

#EXTINF:-1 tvg-id="KralPopTV" tvg-name="Kral Pop TV" group-title="Müzik" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/kral-pop-tr.png",Kral Pop TV
https://dogus.daioncdn.net/kralpoptv/kralpoptv.m3u8?app=kralpoptv_web

#EXTINF:-1 tvg-id="PowerTurkTaptaze" tvg-name="PowerTurk Taptaze" group-title="Müzik" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/powerturk-tr.png",PowerTurk Taptaze
https://livetv.powerapp.com.tr/pturktaptaze/taptaze.smil/playlist.m3u8

#EXTINF:-1 tvg-id="PowerTurkSlow" tvg-name="PowerTurk Slow" group-title="Müzik" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/powerturk-tr.png",PowerTurk Slow
https://livetv.powerapp.com.tr/pturkslow/slow.smil/playlist.m3u8

#EXTINF:-1 tvg-id="PowerTurkAkustik" tvg-name="PowerTurk Akustik" group-title="Müzik" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/powerturk-tr.png",PowerTurk Akustik
https://livetv.powerapp.com.tr/pturkakustik/akustik.smil/playlist.m3u8

#EXTINF:-1 tvg-id="PowerLove" tvg-name="Power Love" group-title="Müzik" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/power-tv-tr.png",Power Love
https://livetv.powerapp.com.tr/plove/love.smil/playlist.m3u8

#EXTINF:-1 tvg-id="PowerDance" tvg-name="Power Dance" group-title="Müzik" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/power-tv-tr.png",Power Dance
https://livetv.powerapp.com.tr/dance/dance.smil/playlist.m3u8

#EXTINF:-1 tvg-id="Number1Dance" tvg-name="Number 1 Dance" group-title="Müzik" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/nr1-dance-tr.png",Number 1 Dance
https://b01c02nl.mediatriple.net/videoonlylive/mtkgeuihrlfwlive/u_stream_5c9e2aa8acf44_1/playlist.m3u8

#EXTINF:-1 tvg-id="Number1Damar" tvg-name="Number 1 Damar" group-title="Müzik" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/nr1-damar-tr.png",Number 1 Damar
https://b01c02nl.mediatriple.net/videoonlylive/mtkgeuihrlfwlive/u_stream_5c9e198784bdc_1/playlist.m3u8

#EXTINF:-1 tvg-id="Number1Ak" tvg-name="Number 1 Aşk" group-title="Müzik" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/nr1-ask-tr.png",Number 1 Aşk
https://b01c02nl.mediatriple.net/videoonlylive/mtkgeuihrlfwlive/u_stream_5c9e18f9cea15_1/playlist.m3u8

#EXTINF:-1 tvg-id="4TrkPop" tvg-name="4 Türk Pop" group-title="Müzik" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/nr1-turk-tr.png",4 Türk Pop
https://cdn-4turkpop.yayin.com.tr/4turkpop/4turkpop/playlist.m3u8

#EXTINF:-1 tvg-id="EzgiTV" tvg-name="Ezgi TV" group-title="Müzik" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/nr1-tr.png",Ezgi TV
https://live.euromediacenter.com/ezgitv/tracks-v1a1/mono.m3u8

#EXTINF:-1 tvg-id="Number1TrkFM" tvg-name="Number 1 Türk FM" group-title="Müzik" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/nr1-turk-tr.png",Number 1 Türk FM
https://eustr75.mediatriple.net/Number1Media/00_Number1_Turk_FM.stream/chunklist_w181741155.m3u8

#EXTINF:-1 tvg-id="MuAzhitTV" tvg-name="Muş Azhit TV" group-title="Müzik" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/nr1-tr.png",Muş Azhit TV
https://cdn4.yayin.com.tr/musicazhit/video.m3u8

#EXTINF:-1 tvg-id="iftiTV" tvg-name="Çiftçi TV" group-title="Diğer" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/ciftci-tv-tr.png",Çiftçi TV
https://live.artidijitalmedya.com/artidijital_ciftcitv/ciftcitv/playlist.m3u8

#EXTINF:-1 tvg-id="Tivi6" tvg-name="Tivi 6" group-title="Diğer" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/tivi6-tr.png",Tivi 6
https://live.artidijitalmedya.com/artidijital_tivi6/tivi6/playlist.m3u8

#EXTINF:-1 tvg-id="MeltemTV" tvg-name="Meltem TV" group-title="Diğer" tvg-logo="https://meltemtv.com.tr/uploads/logo.png",Meltem TV
https://vhxyrsly.rocketcdn.com/meltemtv/playlist.m3u8

#EXTINF:-1 tvg-id="TRTAvaz" tvg-name="TRT Avaz" group-title="Diğer" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/trt-avaz-tr.png",TRT Avaz
https://tv-trtavaz.medya.trt.com.tr/master_720.m3u8

#EXTINF:-1 tvg-id="TRTTrk" tvg-name="TRT Türk" group-title="Diğer" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/trt-turk-tr.png",TRT Türk
https://tv-trtturk.medya.trt.com.tr/master.m3u8

#EXTINF:-1 tvg-id="RizeTrk" tvg-name="Rize Türk" group-title="Diğer" tvg-logo="https://graph.facebook.com/rizeturkrize/picture?type=large",Rize Türk
https://yayin.rizeturk.com:3777/hybrid/play.m3u8

#EXTINF:-1 tvg-id="lkeTV" tvg-name="İlke TV" group-title="Diğer" tvg-logo="https://ilketv.com.tr/wp-content/uploads/2024/06/logo.png",İlke TV
https://stream.ilketv.com.tr/hls/ilkecanli.m3u8

#EXTINF:-1 tvg-id="OlayTrk" tvg-name="Olay Türk" group-title="Diğer" tvg-logo="https://images.seeklogo.com/logo-png/35/1/olay-turk-logo-png_seeklogo-359840.png",Olay Türk
https://live.artidijitalmedya.com/artidijital_olayturk/olayturk/playlist.m3u8

#EXTINF:-1 tvg-id="SlowKaradenizTV" tvg-name="Slow Karadeniz TV" group-title="Diğer" tvg-logo="https://slowkaradeniztv.com/slowkaradeniztv.png",Slow Karadeniz TV
https://yayin.slowkaradeniztv.com:3390/hybrid/play.m3u8

#EXTINF:-1 tvg-id="TempoTV" tvg-name="Tempo TV" group-title="Diğer" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/tempo-tv-tr.png",Tempo TV
https://live.artidijitalmedya.com/artidijital_tempotv/tempotv/chunks.m3u8

#EXTINF:-1 tvg-id="KanalN" tvg-name="Kanal N" group-title="Diğer" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/kanal-n-tr.png",Kanal N
https://cdn4.yayin.com.tr/kntv/video.m3u8

#EXTINF:-1 tvg-id="KralPopTV2link" tvg-name="Kral Pop TV (2. link)" group-title="Diğer" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/kral-pop-tr.png",Kral Pop TV (2. link)
https://dogus.daioncdn.net/kralpoptv/kralpoptv.m3u8?app=f38a38b4-ce55-4040-8676-9826937d6128

#EXTINF:-1 tvg-id="KRALPOP" tvg-name="KRAL POP" group-title="Diğer" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/kral-pop-tr.png",KRAL POP
http://dzcvip1.xyz:2095/live/yasar7062/yasar.7062/76544.m3u8`
function proxyUrl(url: string): string {
  // Only proxy HTTP backends (dzcvip1, ctn34, ccgbndrby11, dpsmartone, tv8.daioncdn.net)
  // HTTPS direct CDN URLs must stay direct — CDNs block proxy IPs
  if (url.startsWith('http://')) {
    const u = new URL(url)
    const base = u.protocol + '//' + u.hostname + ':' + (u.port || 80)
    const b64 = btoa(base).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    // URLs ending with .m3u8 → HLS proxy (redirect + CDN discovery)
    // Other URLs (MPEG-TS streams) → virtual HLS wrapper for hls.js playback
    if (url.endsWith('.m3u8')) return '/p/' + b64 + u.pathname + (u.search || '')
    return '/v/' + b64 + u.pathname + (u.search || '') + '.m3u8'
  }
  return url
}

export function parseRotationData(): { channels: RotationChannel[], categories: RotationCategory[] } {
  const lines = rawM3U.split('\n')
  const channels: RotationChannel[] = []
  let currentExtinf: string | null = null

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (trimmed.startsWith('#EXTM3U')) continue
    if (trimmed.startsWith('#EXTINF:')) {
      currentExtinf = trimmed
    } else if (currentExtinf && !trimmed.startsWith('#')) {
      const parsed = parseExtinf(currentExtinf)
      if (parsed) {
        const existing = channels.find(c => c.id === parsed.id)
        if (existing) {
          const u = proxyUrl(trimmed)
          if (!existing.urls.includes(u)) existing.urls.push(u)
        } else {
          channels.push({ ...parsed, urls: [proxyUrl(trimmed)] })
        }
      }
    }
  }

  const groupMap = new Map<string, RotationChannel[]>()
  for (const ch of channels) {
    const group = ch.groupTitle || 'Diğer'
    if (!groupMap.has(group)) groupMap.set(group, [])
    groupMap.get(group)!.push(ch)
  }

  const categories: RotationCategory[] = []
  for (const [name, chs] of groupMap) {
    categories.push({ id: name.toLowerCase().replace(/\s+/g, '-'), name, channels: chs })
  }

  return { channels, categories }
}

function parseExtinf(line: string): RotationChannel | null {
  const match = line.match(/tvg-id="([^"]*)".*tvg-name="([^"]*)".*group-title="([^"]*)".*tvg-logo="([^"]*)".*,(.+)$/)
  if (!match) return null
  const [, tvgId, tvgName, groupTitle, tvgLogo, name] = match
  return { id: tvgId || name, name: name.trim(), tvgId, tvgName, groupTitle, tvgLogo, urls: [] }
}

export function getChannelsByCategory(catId: string): RotationChannel[] {
  const { categories } = parseRotationData()
  return categories.find(c => c.id === catId)?.channels || []
}

export function getChannelById(id: string): RotationChannel | undefined {
  const { channels } = parseRotationData()
  return channels.find(c => c.id === id)
}
