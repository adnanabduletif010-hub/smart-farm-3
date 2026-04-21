export type CropGuide = {
  id: string;
  emoji: string;
  name: { en: string; om: string; am: string };
  zone: { en: string; om: string; am: string };
  spacing: { en: string; om: string; am: string };
  soil: { en: string; om: string; am: string };
  fertilizer: { en: string; om: string; am: string };
  water: { en: string; om: string; am: string };
  pests: { en: string; om: string; am: string };
  harvest: { en: string; om: string; am: string };
};

export const CROP_GUIDES: CropGuide[] = [
  {
    id: "teff",
    emoji: "🌾",
    name: { en: "Teff", om: "Xaafii", am: "ጤፍ" },
    zone: {
      en: "Mid to highland (1500–2800 m). Best with 700–1100 mm rainfall.",
      om: "Bakka giddu-galeessaa hanga ol-aanaa (1500–2800 m). Roobni 700–1100 mm gaarii.",
      am: "መካከለኛ እስከ ከፍተኛ ቦታ (1500–2800 ሜ)። 700–1100 ሚሜ ዝናብ የተሻለ።",
    },
    spacing: {
      en: "Broadcast 25–35 kg/ha seed. Drill rows 20 cm apart for cleaner weeding.",
      om: "Sanyii 25–35 kg/ha facaasi. Sararaan 20 cm gidduutti facaasuun aramaa salphisa.",
      am: "ዘር 25–35 ኪ.ግ/ሄ. በመበተን። በ20 ሴ.ሜ ርቀት መስመር መዝራት አረም ለማረም ይረዳል።",
    },
    soil: {
      en: "Well-drained loam, pH 6.0–7.5. Plough twice and harrow before sowing.",
      om: "Biyyee gaarii, pH 6.0–7.5. Si’a lama qotii biyyee xixiqqeessi.",
      am: "በደንብ የሚያስወጣ አፈር፣ pH 6.0–7.5። ሁለት ጊዜ አርሰው ከመዝራት በፊት ስስ ያድርጉ።",
    },
    fertilizer: {
      en: "100 kg/ha NPS at sowing + 50 kg/ha urea at tillering. Or 8–10 t/ha compost.",
      om: "Facaasaatti 100 kg/ha NPS + 50 kg/ha uriyaa yeroo dameen baasu. Yookin 8–10 t/ha komposti.",
      am: "በዘራ ጊዜ 100 ኪ.ግ/ሄ NPS + በማዳበር ጊዜ 50 ኪ.ግ/ሄ ዩሪያ። ወይም 8–10 ቶ/ሄ ኮምፖስት።",
    },
    water: {
      en: "Rainfed. Avoid waterlogging — teff dislikes standing water.",
      om: "Bishaan roobaa. Bishaan dhaabbachuu hin barbaadu.",
      am: "በዝናብ ይበቅላል። የቆመ ውሃ ጥሩ አይደለም።",
    },
    pests: {
      en: "Watch for shoot fly and rust. Rotate with legumes (faba bean) every 2 years.",
      om: "Tisiisaa fi rifaatuu eegi. Bara lama lamaan boqolloo/baaqelaatti naannessi.",
      am: "የተኩስ ዝንብና ዝገት ይከታተሉ። በየ2 ዓመቱ ከባቄላ ጋር ይቀያይሩ።",
    },
    harvest: {
      en: "Harvest at 80–110 days when stems turn straw-yellow. Dry in stooks 1 week.",
      om: "Guyyaa 80–110 keessatti, yommuu seerri keelloo ta’u haammadhu. Torbee tokko qorsii.",
      am: "በ80–110 ቀናት፣ ግንዱ ቢጫ ሲሆን ይቁረጡ። ለ1 ሳምንት ያስደርቁ።",
    },
  },
  {
    id: "maize",
    emoji: "🌽",
    name: { en: "Maize", om: "Boqqolloo", am: "በቆሎ" },
    zone: {
      en: "Lowland to mid-altitude (500–2200 m). Needs 500–800 mm rain.",
      om: "Bakka gad-aanaa hanga giddu-galeessaa (500–2200 m). Roobni 500–800 mm.",
      am: "ዝቅተኛ እስከ መካከለኛ ቦታ (500–2200 ሜ)። 500–800 ሚሜ ዝናብ ያስፈልጋል።",
    },
    spacing: {
      en: "75 cm between rows × 25–30 cm between plants. ~53,000 plants/ha.",
      om: "Saraaroota gidduu 75 cm × biqiltuu gidduu 25–30 cm. Biqiltuu 53,000/ha.",
      am: "በመስመሮች መካከል 75 ሴ.ሜ × በተክሎች መካከል 25–30 ሴ.ሜ።",
    },
    soil: {
      en: "Deep, well-drained loam, pH 5.8–7.0. Plough deeply (25 cm).",
      om: "Biyyee gad-fagoo, pH 5.8–7.0. Gad-fagoo (25 cm) qoti.",
      am: "ጥልቅ አፈር፣ pH 5.8–7.0። በ25 ሴ.ሜ ጥልቀት ያርሱ።",
    },
    fertilizer: {
      en: "150 kg/ha NPS at planting + 100 kg/ha urea split (knee-high & tasseling).",
      om: "Facaasaatti 150 kg/ha NPS + 100 kg/ha uriyaa lama qoodi.",
      am: "በዘራ ጊዜ 150 ኪ.ግ/ሄ NPS + 100 ኪ.ግ/ሄ ዩሪያ በሁለት ጊዜ።",
    },
    water: {
      en: "Critical at flowering & grain-fill. Mulch to retain moisture in dry spells.",
      om: "Yeroo daraaraa fi ija guuttachuu murteessaa. Mulch goonaan jiidhinsa qaba.",
      am: "በአበባና በፍሬ ጊዜ ወሳኝ። ሙልች በማድረግ እርጥበት ያስቀምጡ።",
    },
    pests: {
      en: "Fall armyworm: scout weekly, hand-pick, neem extract spray. Stalk borer: rotate.",
      om: "Raammoo waraanaa: torbeen ilaali, harkaan funaani, biiftuu niimii fayyadami.",
      am: "የበልግ ትል: በሳምንት ይከታተሉ፣ በእጅ ይነቅሉ፣ የኒም ስፕሬይ ይጠቀሙ።",
    },
    harvest: {
      en: "Harvest at 110–140 days when husks dry & kernels are hard. Dry to 13% moisture.",
      om: "Guyyaa 110–140, yommuu qollooo gogu fi ijji jabaatu haammadhu.",
      am: "በ110–140 ቀናት፣ ቅርፊቱ ሲደርቅና ፍሬው ሲጠነክር ይቁረጡ።",
    },
  },
  {
    id: "coffee",
    emoji: "☕",
    name: { en: "Coffee (Arabica)", om: "Buna (Arabikaa)", am: "ቡና (አረቢካ)" },
    zone: {
      en: "1300–2200 m, 1500–2500 mm rain. Needs shade trees.",
      om: "1300–2200 m, roobni 1500–2500 mm. Mukkeen gaaddisaa barbaada.",
      am: "1300–2200 ሜ፣ 1500–2500 ሚሜ ዝናብ። የጥላ ዛፎች ያስፈልጉታል።",
    },
    spacing: {
      en: "2 m × 2 m (2,500 trees/ha). Plant in pits 60×60×60 cm filled with compost.",
      om: "2 m × 2 m (mukkeen 2,500/ha). Boollii 60×60×60 cm komposti guuti.",
      am: "2 ሜ × 2 ሜ (2,500 ዛፎች/ሄ)። በ60×60×60 ሴ.ሜ ጉድጓድ ኮምፖስት ሞልተው ይትከሉ።",
    },
    soil: {
      en: "Deep volcanic loam, pH 5.5–6.5, rich in organic matter.",
      om: "Biyyee voolkaanoo gad-fagoo, pH 5.5–6.5, dhibbeentaa orgaanikii guddaa.",
      am: "ጥልቅ የእሳተ ገሞራ አፈር፣ pH 5.5–6.5፣ ኦርጋኒክ የበዛበት።",
    },
    fertilizer: {
      en: "100 g NPS + 50 g urea per tree/year split. Mulch with coffee pulp.",
      om: "Tokkoo tokkoof waggaatti 100 g NPS + 50 g uriyaa qoodi. Mulch albuudaan godhi.",
      am: "በአንድ ዛፍ በዓመት 100 ግ NPS + 50 ግ ዩሪያ በከፊል። በቡና ቆዳ ሙልች ያድርጉ።",
    },
    water: {
      en: "Drought-sensitive. Irrigate during dry season if possible.",
      om: "Hongee dadhabaa. Yeroo gogiinsaa bishaan obaasi.",
      am: "ድርቅን አይታገስም። በደረቅ ወቅት ካለ መጠጣት ይስጡት።",
    },
    pests: {
      en: "Coffee berry disease (CBD): spray copper. Coffee wilt: uproot & burn affected trees.",
      om: "Dhukkuba ija bunaa (CBD): koppariin biifsi. Wilt: ciri fi gubi.",
      am: "የቡና ፍሬ በሽታ (CBD): መዳብ ስፕሬይ። ዊልት: የተጠቁ ዛፎች ይነቀሉና ይቃጠሉ።",
    },
    harvest: {
      en: "Pick only red, ripe cherries (Oct–Dec). Pulp & ferment within 12 hours.",
      om: "Ija diimaa qofa funaani (Onkoloolessa–Muddee). Saa’aa 12 keessatti qulqulleessi.",
      am: "ቀይ ብቻ ይምረጡ (ጥቅ–ታህ)። በ12 ሰዓት ውስጥ ያጠቡና ያኩሉ።",
    },
  },
  {
    id: "wheat",
    emoji: "🌾",
    name: { en: "Wheat", om: "Qamadii", am: "ስንዴ" },
    zone: {
      en: "Highland 1900–2700 m, 600–1200 mm rain. Cool nights help grain fill.",
      om: "Ol-aanaa 1900–2700 m, 600–1200 mm. Halkan qabbanaaʼaan ija guutuu fooyyessa.",
      am: "ከፍተኛ ቦታ 1900–2700 ሜ፣ 600–1200 ሚሜ። ቀዝቃዛ ምሽቶች ለፍሬ ጥሩ።",
    },
    spacing: {
      en: "150 kg/ha seed. Row planting 20 cm apart preferred.",
      om: "Sanyii 150 kg/ha. Sararaa 20 cm filatamaa.",
      am: "ዘር 150 ኪ.ግ/ሄ። መስመር መዝራት 20 ሴ.ሜ ርቀት ጥሩ።",
    },
    soil: {
      en: "Loam to clay, pH 6.0–7.5. Good drainage essential.",
      om: "Biyyee laafaa hanga supheessaa, pH 6.0–7.5. Bishaan baasuu qaba.",
      am: "ለም አፈር እስከ ሸክላ፣ pH 6.0–7.5። ፍሳሽ አስፈላጊ።",
    },
    fertilizer: {
      en: "150 kg/ha NPS at sowing + 100 kg/ha urea at tillering.",
      om: "Facaasaatti 150 kg/ha NPS + 100 kg/ha uriyaa damee baasaa.",
      am: "በዘራ ጊዜ 150 ኪ.ግ/ሄ NPS + በማዳበር ጊዜ 100 ኪ.ግ/ሄ ዩሪያ።",
    },
    water: {
      en: "Mostly rainfed. Booting & flowering are critical stages.",
      om: "Bishaan roobaa. Yeroo damee fi daraaraa murteessaa.",
      am: "በዝናብ። የሰብል ዘር መውጣት ጊዜ ወሳኝ።",
    },
    pests: {
      en: "Yellow rust: use resistant varieties (Kakaba, Danda’a). Aphids: ladybird control.",
      om: "Rifaatuu keelloo: gosoota dandeʼan fayyadami. Tafsii: dhalaadhaan to’adhu.",
      am: "ቢጫ ዝገት: ተቋቋሚ ዝርያዎች ይጠቀሙ። አፊድ: በተፈጥሮ ጠላት ይቆጣጠሩ።",
    },
    harvest: {
      en: "Harvest at 110–135 days when grains are hard. Thresh promptly.",
      om: "Guyyaa 110–135, yommuu ijji jabaatu haammadhu.",
      am: "በ110–135 ቀናት፣ ፍሬው ሲጠነክር ይቁረጡ።",
    },
  },
  {
    id: "tomato",
    emoji: "🍅",
    name: { en: "Tomato", om: "Timaatima", am: "ቲማቲም" },
    zone: {
      en: "700–2000 m, warm days 20–27°C. Avoid heavy rain at flowering.",
      om: "700–2000 m, ho’a 20–27°C. Yeroo daraaraa rooba cimaa hin barbaadu.",
      am: "700–2000 ሜ፣ ሞቃት ቀናት 20–27°ሴ።",
    },
    spacing: {
      en: "Transplant 40 cm × 60 cm. Stake plants for better airflow.",
      om: "Naqannoo 40 cm × 60 cm. Daraqaadhaan deeggari.",
      am: "በ40 ሴ.ሜ × 60 ሴ.ሜ ይተክሉ። በዱላ ይደግፉ።",
    },
    soil: {
      en: "Well-drained sandy loam, pH 6.0–6.8. Add 20 t/ha compost.",
      om: "Biyyee bishaan baasu, pH 6.0–6.8. Komposti 20 t/ha dabali.",
      am: "በደንብ የሚያስወጣ አሸዋማ አፈር፣ pH 6.0–6.8። 20 ቶ/ሄ ኮምፖስት።",
    },
    fertilizer: {
      en: "200 kg/ha NPS + 100 kg/ha urea split. Foliar K boost during fruiting.",
      om: "200 kg/ha NPS + 100 kg/ha uriyaa qoodi. Yeroo iji baasu K fayyadami.",
      am: "200 ኪ.ግ/ሄ NPS + 100 ኪ.ግ/ሄ ዩሪያ።",
    },
    water: {
      en: "Drip or furrow every 3–5 days. Never wet leaves at evening.",
      om: "Guyyaa 3–5 keessatti obaasi. Galgala baala hin tuqin.",
      am: "በየ3–5 ቀን ውሃ ይስጡ። ምሽት ላይ ቅጠል አያርጥቡ።",
    },
    pests: {
      en: "Late blight: copper/baking-soda spray. Whitefly: yellow sticky traps + neem.",
      om: "Dhukkuba laata: koppariin biifsi. Hooseessaa adii: kiyyoo keelloo + niimii.",
      am: "ዘግይቶ ብላይት: መዳብ ስፕሬይ። ነጭ ዝንብ: ቢጫ ሙጫ ወጥመድ።",
    },
    harvest: {
      en: "Pick when 70% red. Yields 25–40 t/ha with good practice.",
      om: "Yommuu 70% diimaa ta’u funaani.",
      am: "70% ቀይ ሲሆን ይምረጡ።",
    },
  },
  {
    id: "potato",
    emoji: "🥔",
    name: { en: "Potato", om: "Dinnicha", am: "ድንች" },
    zone: {
      en: "Highland 1800–2800 m. Cool nights essential for tuber bulking.",
      om: "Ol-aanaa 1800–2800 m. Halkan qabbanaaʼaan murteessaa.",
      am: "ከፍተኛ ቦታ 1800–2800 ሜ።",
    },
    spacing: {
      en: "Ridges 75 cm × 30 cm between tubers. 2,000 kg/ha seed tubers.",
      om: "Sararaa 75 cm × 30 cm. Sanyii dinnichaa 2,000 kg/ha.",
      am: "በ75 ሴ.ሜ × 30 ሴ.ሜ። የዘር ድንች 2,000 ኪ.ግ/ሄ።",
    },
    soil: {
      en: "Loose sandy loam, pH 5.0–6.5. Avoid waterlogged fields.",
      om: "Biyyee laafaa, pH 5.0–6.5. Bishaan kuusu hin barbaadu.",
      am: "ላላ አሸዋማ አፈር፣ pH 5.0–6.5።",
    },
    fertilizer: {
      en: "200 kg/ha NPS + 150 kg/ha urea + 25 t/ha compost.",
      om: "200 kg/ha NPS + 150 kg/ha uriyaa + 25 t/ha komposti.",
      am: "200 ኪ.ግ/ሄ NPS + 150 ኪ.ግ/ሄ ዩሪያ + 25 ቶ/ሄ ኮምፖስት።",
    },
    water: {
      en: "Critical at tuber initiation. Hill ridges to keep tubers from light.",
      om: "Yeroo dinnichi jalqabu murteessaa. Sararaa ol kaasi.",
      am: "ድንች መፈጠር ሲጀምር ወሳኝ።",
    },
    pests: {
      en: "Late blight: spray every 7 days in wet weather. Bacterial wilt: rotate 4 years.",
      om: "Dhukkuba laata: yeroo jiidhaa torbee tokko biifsi. Wilt: waggaa 4 naannessi.",
      am: "ዘግይቶ ብላይት: በዝናብ ጊዜ በየ7 ቀኑ ይስፕሩ።",
    },
    harvest: {
      en: "Dig at 90–120 days when haulm yellows. Cure 10 days in shade.",
      om: "Guyyaa 90–120 keessatti baqaqsi. Guyyaa 10 gaaddisa keessa boqochiisi.",
      am: "በ90–120 ቀናት ይቆፍሩ።",
    },
  },
  {
    id: "barley",
    emoji: "🌾",
    name: { en: "Barley", om: "Garbuu", am: "ገብስ" },
    zone: {
      en: "Highland 2000–3000 m, 500–1000 mm rain.",
      om: "Ol-aanaa 2000–3000 m, 500–1000 mm.",
      am: "ከፍተኛ ቦታ 2000–3000 ሜ።",
    },
    spacing: {
      en: "120–150 kg/ha seed broadcast or drill 20 cm rows.",
      om: "120–150 kg/ha facaasi ykn 20 cm sararaa.",
      am: "120–150 ኪ.ግ/ሄ ዘር።",
    },
    soil: {
      en: "Tolerant of poor soils, pH 6.0–7.8. Tolerates mild alkalinity.",
      om: "Biyyee dadhabaadhaaf obsa, pH 6.0–7.8.",
      am: "ደካማ አፈር ይታገሳል፣ pH 6.0–7.8።",
    },
    fertilizer: {
      en: "100 kg/ha NPS + 50 kg/ha urea.",
      om: "100 kg/ha NPS + 50 kg/ha uriyaa.",
      am: "100 ኪ.ግ/ሄ NPS + 50 ኪ.ግ/ሄ ዩሪያ።",
    },
    water: {
      en: "Mostly rainfed. Drought-tolerant compared to wheat.",
      om: "Bishaan roobaa. Qamadii caalaa hongee dandaʼa.",
      am: "በዝናብ። ከስንዴ የበለጠ ድርቅ ይታገሳል።",
    },
    pests: {
      en: "Net blotch & scald: rotate with legumes; resistant varieties (HB-1307).",
      om: "Net blotch: baaqelaa wajjin naannessi.",
      am: "ኔት ብሎች: ከባቄላ ጋር ይቀያይሩ።",
    },
    harvest: {
      en: "Harvest at 90–110 days when grains are hard.",
      om: "Guyyaa 90–110 keessatti haammadhu.",
      am: "በ90–110 ቀናት።",
    },
  },
  {
    id: "onion",
    emoji: "🧅",
    name: { en: "Onion", om: "Qullubbii", am: "ሽንኩርት" },
    zone: {
      en: "700–2000 m. Best in cool dry season under irrigation.",
      om: "700–2000 m. Yeroo gogaa qabbanaaʼaa wajjin obaasaa filatamaa.",
      am: "700–2000 ሜ።",
    },
    spacing: {
      en: "Transplant 20 cm × 10 cm. ~500,000 plants/ha.",
      om: "Naqannoo 20 cm × 10 cm.",
      am: "በ20 ሴ.ሜ × 10 ሴ.ሜ ይተክሉ።",
    },
    soil: {
      en: "Sandy loam, pH 6.0–7.0. Avoid heavy clay.",
      om: "Biyyee cirrachaa, pH 6.0–7.0.",
      am: "አሸዋማ ለም አፈር፣ pH 6.0–7.0።",
    },
    fertilizer: {
      en: "200 kg/ha NPS + 100 kg/ha urea split.",
      om: "200 kg/ha NPS + 100 kg/ha uriyaa qoodi.",
      am: "200 ኪ.ግ/ሄ NPS + 100 ኪ.ግ/ሄ ዩሪያ።",
    },
    water: {
      en: "Drip or furrow every 4–6 days. Stop water 2 weeks before harvest.",
      om: "Guyyaa 4–6 obaasi. Torbee 2 dura bishaan dhaabi.",
      am: "በየ4–6 ቀን። ከመቆረጡ 2 ሳምንት በፊት ውሃ ያቁሙ።",
    },
    pests: {
      en: "Thrips: blue sticky traps + soap spray. Purple blotch: copper.",
      om: "Tiriipsii: kiyyoo cuquliisaa + saamunaa biifsi.",
      am: "ትሪፕስ: ሰማያዊ ሙጫ + ሳሙና።",
    },
    harvest: {
      en: "Pull when tops fall over (90–120 d). Cure in shade 7–10 days.",
      om: "Guyyaa 90–120 keessatti, yommuu mataan kufu buqqisi.",
      am: "በ90–120 ቀናት።",
    },
  },
];
