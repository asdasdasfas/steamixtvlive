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
#EXTINF:-1 tvg-id="NATGEO" tvg-name="National Geographic" group-title="Belgesel" tvg-logo="https://graph.facebook.com/natgeomedia/picture?type=large",National Geographic
http://dzcvip1.xyz:2095/live/yasar7062/yasar.7062/101220.m3u8
#EXTINF:-1 tvg-id="NG" tvg-name="Nat Geo Wild" group-title="Belgesel" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/d/d6/Nat_Geo_Wild_logo.png",Nat Geo Wild
http://dzcvip1.xyz:2095/live/yasar7062/yasar.7062/27208.m3u8
#EXTINF:-1 tvg-id="TarihTV" tvg-name="Tarih TV HD" group-title="Belgesel" tvg-logo="https://graph.facebook.com/TarihTV/picture?type=large",Tarih TV HD
http://dzcvip1.xyz:2095/live/yasar7062/yasar.7062/116410.m3u8
#EXTINF:-1 tvg-id="ViasatHistory" tvg-name="Viasat History" group-title="Belgesel" tvg-logo="https://upload.wikimedia.org/wikipedia/commons/6/6f/Viasat_History.png",Viasat History
http://dzcvip1.xyz:2095/live/yasar7062/yasar.7062/89521.m3u8
#EXTINF:-1 tvg-id="S1" tvg-name="beIN Sports 1" group-title="Premium Spor" tvg-logo="https://bootflare.com/wp-content/uploads/2026/01/Bein-Sports-1-Logo.png",beIN Sports 1
http://dzcvip1.xyz:2095/live/yasar7062/yasar.7062/209476.m3u8
#EXTINF:-1 tvg-id="S2" tvg-name="beIN Sports 2" group-title="Premium Spor" tvg-logo="https://bootflare.com/wp-content/uploads/2026/01/Bein-Sports-2-Logo.png",beIN Sports 2
http://dzcvip1.xyz:2095/live/yasar7062/yasar.7062/114123.m3u8
#EXTINF:-1 tvg-id="S3" tvg-name="beIN Sports 3" group-title="Premium Spor" tvg-logo="https://bootflare.com/wp-content/uploads/2026/01/Bein-Sports-3-Logo.png",beIN Sports 3
http://dzcvip1.xyz:2095/live/yasar7062/yasar.7062/104267.m3u8
#EXTINF:-1 tvg-id="S4" tvg-name="beIN Sports 4" group-title="Premium Spor" tvg-logo="https://images.seeklogo.com/logo-png/48/2/bein-sports-logo-png_seeklogo-481582.png",beIN Sports 4
http://dzcvip1.xyz:2095/live/yasar7062/yasar.7062/122537.m3u8
#EXTINF:-1 tvg-id="S5" tvg-name="beIN Sports 5" group-title="Premium Spor" tvg-logo="https://images.seeklogo.com/logo-png/48/2/bein-sports-logo-png_seeklogo-481582.png",beIN Sports 5
http://dzcvip1.xyz:2095/live/yasar7062/yasar.7062/149161.m3u8
#EXTINF:-1 tvg-id="SP1" tvg-name="S Sport Plus 1" group-title="Premium Spor" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/s-sport-plus-tr.png",S Sport Plus 1
http://dzcvip1.xyz:2095/live/yasar7062/yasar.7062/193970.m3u8
#EXTINF:-1 tvg-id="SS1HD" tvg-name="S-SPORT 1 HD" group-title="Premium Spor" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/s-sport-tr.png",S-SPORT 1 HD
http://dzcvip1.xyz:8080/live/yasar7062/yasar.7062/71749.m3u8
#EXTINF:-1 tvg-id="TivibuSpor1" tvg-name="Tivibu Spor 1" group-title="Premium Spor" tvg-logo="https://graph.facebook.com/TivibuSpor/picture?type=large",Tivibu Spor 1
http://dzcvip1.xyz:2095/live/yasar7062/yasar.7062/90373.m3u8
#EXTINF:-1 tvg-id="TivibuSpor2" tvg-name="Tivibu Spor 2" group-title="Premium Spor" tvg-logo="https://graph.facebook.com/TivibuSpor/picture?type=large",Tivibu Spor 2
http://dzcvip1.xyz:2095/live/yasar7062/yasar.7062/44717.m3u8
#EXTINF:-1 tvg-id="TivibuSpor3" tvg-name="Tivibu Spor 3" group-title="Premium Spor" tvg-logo="https://graph.facebook.com/TivibuSpor/picture?type=large",Tivibu Spor 3
http://dzcvip1.xyz:2095/live/yasar7062/yasar.7062/37476.m3u8
#EXTINF:-1 tvg-id="TivibuSpor4" tvg-name="Tivibu Spor 4" group-title="Premium Spor" tvg-logo="https://graph.facebook.com/TivibuSpor/picture?type=large",Tivibu Spor 4
http://dzcvip1.xyz:2095/live/yasar7062/yasar.7062/70739.m3u8
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
#EXTINF:-1 tvg-id="TRTWorld" tvg-name="TRT World" group-title="Dünya" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/trt-world-tr.png",TRT World
https://tv-trtworld.medya.trt.com.tr/master.m3u8
#EXTINF:-1 tvg-id="TRTArabi" tvg-name="TRT Arabi" group-title="Dünya" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/trt-arabi-tr.png",TRT Arabi
https://tv-trtarabi.medya.trt.com.tr/master.m3u8
#EXTINF:-1 tvg-id="TRTKurdi" tvg-name="TRT Kurdi" group-title="Dünya" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/trt-kurdi-tr.png",TRT Kurdi
https://tv-trtkurdi.medya.trt.com.tr/master.m3u8
#EXTINF:-1 tvg-id="PersianaTrkiye" tvg-name="Persiana Türkiye" group-title="Dünya" tvg-logo="https://static.wikia.nocookie.net/logopedia/images/e/e9/Persiana-turkiye-fr.png",Persiana Türkiye
https://turkhls.persiana.live/hls/stream.m3u8
#EXTINF:-1 tvg-id="TRTMzik" tvg-name="TRT Müzik" group-title="Müzik" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/trt-muzik-tr.png",TRT Müzik
https://tv-trtmuzik.medya.trt.com.tr/master_720.m3u8
#EXTINF:-1 tvg-id="PowerTV" tvg-name="Power TV" group-title="Müzik" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/power-tv-tr.png",Power TV
https://livetv.powerapp.com.tr/powerTV/powerhd.smil/playlist.m3u8
#EXTINF:-1 tvg-id="KralPopTV" tvg-name="Kral Pop TV" group-title="Müzik" tvg-logo="https://raw.githubusercontent.com/tv-logo/tv-logos/main/countries/turkey/kral-pop-tr.png",Kral Pop TV
https://dogus.daioncdn.net/kralpoptv/kralpoptv.m3u8?app=kralpoptv_web`
function proxyUrl(url: string): string {
  if (url.startsWith('http://dzcvip1.xyz:2095/')) return url.replace('http://dzcvip1.xyz:2095', '/p2095')
  if (url.startsWith('http://dzcvip1.xyz:8080/')) return url.replace('http://dzcvip1.xyz:8080', '/p8080')
  if (url.startsWith('http://tv8.daioncdn.net/')) return url.replace('http://tv8.daioncdn.net', '/tv8daion')
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
      currentExtinf = null
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
