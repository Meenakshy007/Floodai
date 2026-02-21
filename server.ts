import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import Database from "better-sqlite3";

const db = new Database("floodguard_v4.db");

// Initialize DB with synthetic data for Kerala Panchayats
db.exec(`
  CREATE TABLE IF NOT EXISTS panchayats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    district TEXT,
    lat REAL,
    lng REAL,
    base_risk REAL
  );

  CREATE TABLE IF NOT EXISTS rainfall_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    panchayat_id INTEGER,
    date TEXT,
    rainfall_mm REAL,
    river_discharge REAL,
    FOREIGN KEY(panchayat_id) REFERENCES panchayats(id)
  );
`);

const districtMap: Record<string, { name: string, lat: number, lng: number }> = {
  "01": { name: "Thiruvananthapuram", lat: 8.5241, lng: 76.9366 },
  "02": { name: "Kollam", lat: 8.8932, lng: 76.6141 },
  "03": { name: "Pathanamthitta", lat: 9.2648, lng: 76.7870 },
  "04": { name: "Alappuzha", lat: 9.4981, lng: 76.3329 },
  "05": { name: "Kottayam", lat: 9.5916, lng: 76.5221 },
  "06": { name: "Idukki", lat: 9.9189, lng: 77.1025 },
  "07": { name: "Ernakulam", lat: 9.9816, lng: 76.2999 },
  "08": { name: "Thrissur", lat: 10.5276, lng: 76.2144 },
  "09": { name: "Palakkad", lat: 10.7867, lng: 76.6547 },
  "10": { name: "Malappuram", lat: 11.0735, lng: 76.0740 },
  "11": { name: "Kozhikode", lat: 11.2588, lng: 75.7804 },
  "12": { name: "Wayanad", lat: 11.6854, lng: 76.1320 },
  "13": { name: "Kannur", lat: 11.8745, lng: 75.3704 },
  "14": { name: "Kasaragod", lat: 12.5101, lng: 74.9852 }
};

const rawPanchayatData = `
D04001001,Aroor,
D04001002,Poochackal,
D04001003,Pallippuram,
D04001004,Kanjikkuzhy,
D04001005,Aryad,
D04001006,Veliyanad,
D04001007,Champakkulam,
D04001008,PALLIPPAD,
D04001009,CHENNITHALA,
D04001010,Mannar,
D04001011,Mulakkuzha,
D04001012,Venmony,
D04001013,Noornad,
D04001014,Bharanikkavu,
D04001015,Krishnapuram,
D04001016,Pathiyoor,
D04001017,Muthukulam,
D04001018,Karuvatta,
D04001019,Ambalappuzha,
D04001020,Punnapra,
D04001021,Mararikkulam,
D04001022,Vayalar,
D04001023,Manakkodam,
D08001001,VADAKKEKADU,
D08001002,KATTAKAMBAL,
D08001003,ERUMAPETTY,
D08001004,VALLATHOLE NAGAR,
D08001005,THIRUVILLAMALA,
D08001006,CHELAKKARA,
D08001007,VAZHANI,
D08001008,AVANUR,
D08001009,PEECHI,
D08001010,PUTHUR,
D08001011,AMBALLUR,
D08001012,PUTHUKKAD,
D08001013,ATHIRAPPILLY,
D08001014,KORATTY,
D08001015,MALA,
D08001016,ALOOR,
D08001017,PARAPPOOKKARA,
D08001018,ERIYAD,
D08001019,KAIPAMANGALAM,
D08001020,TRIPRAYAR,
D08001021,KATTOOR,
D08001022,CHERPU,
D08001023,AMMADAM,
D08001024,ANTHIKKAD,
D08001025,THALIKKULAM,
D08001026,KADAPPURAM,
D08001027,MULLASSERY,
D08001028,ADAT,
D08001029,CHOONDAL,
D06001001,ADIMALI,
D06001002,MUNNAR,
D06001003,DEVIKULAM,
D06001004,RAJAKKAD,
D06001005,MURICKASSERY,
D06001006,NEDUMKANDOM,
D06001007,PAMPADUMPARA,
D06001008,VANDANMEDU,
D06001009,VANDIPERIYAR,
D06001010,VAGAMON,
D06001011,UPPUTHARA,
D06001012,MOOLAMATTAM,
D06001013,KARIMKUNNAM,
D06001014,KARIMANNOOR,
D06001015,PAINAVU,
D06001016,MULLARINGADU,
D11001001,AZHIYUR,
D11001002,EDACHERI,
D11001003,NADAPURAM ,
D11001004,MOKERI,
D11001005,KUTTIADI,
D11001006,PERAMBRA,
D11001007,KATTIPARA,
D11001008,BALUSSERY,
D11001009,EANGAPUZHA ,
D11001010,KODENCHERY,
D11001011,THIRUVAMBADI,
D11001012,OMASSERY,
D11001013,CHATHAMANGALAM,
D11001014,PANTHEERANKAVU,
D11001015,KADALUNDY,
D11001016,KUNNAMANGALAM,
D11001017,KAKKODI,
D11001018,MADAVOOR,
D11001019,NARIKKUNI,
D11001020,NANMANDA,
D11001021,ATHOLI,
D11001022,ULLYERI,
D11001023,ARIKKULAM,
D11001024,MEPPAYUR,
D11001025,PAYYOLI ANGADI,
D11001026,MANIYUR,
D11001027,CHORODE ,
D07001001,CHERAI,
D07001002,MOOTHAKUNNAM,
D07001003,KARUKUTTY,
D07001004,MALAYATTOOR,
D07001005,KALADY,
D07001006,KODANAD,
D07001007,PULLUVAZHI,
D07001008,BHOOTHATHANKETTU,
D07001009,NERYAMANGALAM,
D07001010,VARAPPETTY,
D07001011,AVOLY,
D07001012,VALAKAM,
D07001013,PAMBAKKUDA,
D07001014,UDAYAMPEROOR,
D13001001,Karivellur,
D13001002,Alakkode,
D13001003,Naduvil,
D13001004,Payyavoor,
D13001005,Ulikkal,
D13001006,Peravoor,
D13001007,Thillankeri,
D13001008,Kolayad,
D13001009,Pattyam,
D13001010,Kolavallur,
D13001011,Pannyannur,
D13001012,Kadirur,
D13001013,Pinarayi,
D13001014,Vengad,
D13001015,Chembilode,
D13001016,Koodali,
D13001017,Mayyil,
D13001018,Kolacheri,
D13001019,Azhikkode,
D13001020,Kalliasseri,
D13001021,Cherukunnu,
D13001022,Kunhimangalam,
D13001023,Pariyaram,
D13001024,Kadannapalli,
D03001001,Pulikkeezhu,
D03001002,Mallappally,
D03001003,Anicadu,
D03001004,Angadi,
D03001005,Ranni,
D03001006,Chittar,
D03001007,Malayalappuzha,
D03001008,Konni,
D03001009,Pramadom,
D03001010,Kodumon,
D03001011,Enathu,
D03001012,Pallickal,
D03001013,Kulanada,
D03001014,Elanthoor,
D03001015,Kozhencherry,
D03001016,Koipuram,
D07001015,MULANTHURUTHY,
D07001016,KUMBALANGI,
D07001017,PUTHENKURIZ,
D07001018,KOLENCHERRY,
D07001019,VENGOLA,
D07001020,EDATHALA,
D07001021,KEEZHMAD,
D07001022,NEDUMBASSERY,
D07001023,ALANGAD,
D07001024,KADUNGALLOOR,
D07001025,KOTTUVALLY,
D07001026,VALLARPADAM,
D05001001,Vaikom,
D05001002,Velloor,
D05001003,Kaduthuruthy,
D05001004,Uzhavoor,
D05001005,Kuravilangad,
D05001006,Bharananganam,
D05001008,Mundakayam,
D05001007,Poonjar,
D05001020,Athirampuzha,
D05001019,Kumarakom,
D05001018,Kurichy,
D05001017,Thrikodithanam,
D05001016,Vakathanam,
D05001015,Puthuppally,
D05001014,Ayarkunnam,
D05001013,Pampady,
D05001012,Kangazha,
D05001011,Ponkunnam,
D05001010,Kanjirappally,
D05001009,Erumeli,
D10001001,Vazhikkadavu,
D10001002,Chokkad,
D10001003,Karuvarakkundu,
D10001004,Wandoor,
D10001005,Pandikkad,
D10001006,Elamkulam,
D10001007,Angadippuram,
D10001008,Anakkayam,
D10001009,Makkaraparamba,
D10001010,Edayur,
D10001011,Athavanad,
D10001012,Edappal,
D10001013,Changaramkulam,
D10001014,Maranchery,
D10001015,Mangalam,
D10001016,Thirunavaya,
D10001017,Niramarathur,
D10001018,Randathani,
D10001019,Ponmundam,
D10001020,Nannambra,
D10001021,Edarikkode,
D10001022,Othukkungal,
D10001023,Pookkottur,
D10001024,Vengara,
D10001025,Velimukku,
D10001026,Thenjippalam,
D10001027,Karippoor,
D10001028,Vazhakkad,
D10001029,Areacode,
D10001030,Edavanna,
D10001031,Thrikkalangode,
D10001032,Chungathara,
D09001001,Sreekrishnapuram,
D09001002,Kadambazhipuram,
D09001003,ALANALLUR,
D09001004,Thenkara,
D09001005, ATTAPPADY,
D09001006,KANJIRAPPUZHA,
D09001007,KONGAD,
D09001008,Parali,
D09001009,Puduppariyaram,
D09001010,Malampuzha,
D09001011,Pudussery,
D09001012,Kozhinjampara,
D09001013,Meenakshipuram,
D09001014,Koduvayur,
D09001015,Kollengode,
D09001016,Nenmara,
D09001017,Pallassana,
D09001018,Kizhakkanchery,
D09001019,Alathur,
D09001020,Tharur,
D09001021,Kodunthirappully,
D09001022,Kottayi,
D09001024,Vaniyamkulam,
D09001025,Perumudiyur,
D09001026,Chalissery,
D09001027,Nagalassery,
D09001028,Thiruvegappura,
D09001029,Kulukkallur,
D09001023,Lakkidi,
D01001001,Chemmaruthy,
D01001002,Navaikulam ,
D01001003,Kilimanoor,
D01001004,Kallara,
D01001005,Venjaramoodu,
D01001006,Anad,
D01001007,Palode,
D01001008,Aryanadu,
D01001009,Vellanadu,
D01001010,Poovachal,
D01001011,Vellarada,
D01001012,Kunnathukal ,
D01001013,Parassala,
D01001014,Maryapuram,
D01001015,Kanjiramkulam,
D01001016,Balaramapuram,
D01001017,Venganoor,
D01001018,Pallichal,
D01001019,Malayinkeezh,
D01001020,Karakulam,
D01001021,Mudakkal,
D01001022,Kaniyapuram,
D01001023,Murukkumpuzha ,
D01001024,Kizhuvilam ,
D01001025,Chirayinkeezh,
D01001026,Manamboor ,
D14001001,VORKADY,
D14001002,PUTHIGE,
D14001003,EDANEER,
D14001004,DELAMPADY,
D14001005,BEDAKAM,
D14001006,KALLAR,
D14001007,CHITTARIKKAL,
D14001008,KARINDALAM,
D14001009,PILICODE,
D14001010,CHERUVATHUR ,
D14001011,MADIKAI,
D14001012,PERIYE,
D14001013,UDMA,
D14001014,CHENGALA,
D14001015,CIVIL STATION,
D02001001,Kulasekharapuram,
D02001002,Oachira,
D02001003,Thodiyoor,
D02001004,Sooranad,
D02001005,Kunnathur,
D02001006,Neduvathur,
D02001007,Kalayapuram,
D02001008,Thalavoor,
D02001009,Pathanapuram,
D02001010,Vettikkavala,
D02001011,Karavaloor,
D02001012,Anchal,
D02001013,Kulathupuzha,
D02001014,Chithara,
D02001015,Chadayamangalam,
D02001016,Velinalloor,
D02001017,Veliyam,
D02001018,Nedumpana,
D02001019,Ithikkara,
D02001020,Kalluvathukkal,
D02001021,Mukhathala,
D02001022,Kottamkara,
D02001023,Kundara,
D02001024,Perinadu,
D02001025,Chavara,
D02001026,Thevalakkara,
D12001001,THAVINHAL,
D12001002,THIRUNELLY,
D12001003,PANANMARAM,
D12001004,MULLANKOLLY,
D12001005,PULPPALLY,
D12001006,KANIYAMPATTA,
D12001007,MEENANGADI,
D12001008,CHEERAL,
D12001009,THOMATTUCHAL,
D12001010,AMBALAVAYAL,
D12001011,MUTTIL,
D12001012,MEPPADI,
D12001013,POZHUTHANA,
D12001014,PADINHARATHARA,
D12001015,VELLAMUNDA,
D12001016,EDAVAKA,
D05001021,Kidangoor,
D05001022,Thalayazham,
D14001016,KUMBLA,
D14001017,MANJESHWAR,
D07001027,VYPPIN,
D09001030,Chalavara,
`;

const insertPanchayat = db.prepare("INSERT INTO panchayats (name, district, lat, lng, base_risk) VALUES (?, ?, ?, ?, ?)");
const existingCount = db.prepare("SELECT COUNT(*) as count FROM panchayats").get() as { count: number };

if (existingCount.count === 0) {
  const lines = rawPanchayatData.trim().split('\n');
  lines.forEach(line => {
    const parts = line.split(',');
    if (parts.length >= 2) {
      const code = parts[0].trim();
      const name = parts[1].trim();
      const distCode = code.substring(1, 3);
      const districtInfo = districtMap[distCode];
      
      if (districtInfo) {
        // Distribute panchayats around district center
        const lat = districtInfo.lat + (Math.random() - 0.5) * 0.4;
        const lng = districtInfo.lng + (Math.random() - 0.5) * 0.4;
        const baseRisk = Math.random() * 0.8 + 0.2;
        insertPanchayat.run(name, districtInfo.name, lat, lng, baseRisk);
      }
    }
  });
}

// Generate synthetic historical data (last 7 days)
const insertRainfall = db.prepare("INSERT INTO rainfall_data (panchayat_id, date, rainfall_mm, river_discharge) VALUES (?, ?, ?, ?)");
const checkData = db.prepare("SELECT COUNT(*) as count FROM rainfall_data").get() as { count: number };

if (checkData.count === 0) {
  const panchayatRows = db.prepare("SELECT * FROM panchayats").all() as any[];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    panchayatRows.forEach(p => {
      // Simulate monsoon patterns with local variance
      const rainfall = Math.random() * 180 * p.base_risk;
      const discharge = rainfall * (1.1 + Math.random() * 0.6);
      insertRainfall.run(p.id, dateStr, rainfall, discharge);
    });
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // API Routes
  // Database schema updates
  db.exec(`
    CREATE TABLE IF NOT EXISTS alert_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      panchayat_id INTEGER,
      email TEXT NOT NULL,
      risk_threshold TEXT DEFAULT 'High',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(panchayat_id) REFERENCES panchayats(id)
    )
  `);

  app.post("/api/alerts/subscribe", (req, res) => {
    const { panchayat_id, email, risk_threshold } = req.body;
    if (!email || !panchayat_id) {
      return res.status(400).json({ error: "Email and Panchayat ID are required" });
    }
    try {
      db.prepare("INSERT INTO alert_subscriptions (panchayat_id, email, risk_threshold) VALUES (?, ?, ?)").run(panchayat_id, email, risk_threshold || 'High');
      res.json({ status: "ok", message: "Successfully subscribed to alerts" });
    } catch (err) {
      res.status(500).json({ error: "Subscription failed" });
    }
  });

  app.get("/api/panchayats", (req, res) => {
    const district = req.query.district;
    let query = `
      SELECT p.*, 
             r.rainfall_mm as latest_rainfall,
             r.river_discharge as latest_discharge
      FROM panchayats p
      JOIN rainfall_data r ON p.id = r.panchayat_id
      WHERE r.date = (SELECT MAX(date) FROM rainfall_data)
    `;
    
    let data;
    if (district) {
      query += ` AND p.district = ? ORDER BY p.name`;
      data = db.prepare(query).all(district);
    } else {
      query += ` ORDER BY p.district, p.name`;
      data = db.prepare(query).all();
    }
    res.json(data);
  });

  app.get("/api/district-summaries", (req, res) => {
    const data = db.prepare(`
      SELECT 
        district as name,
        AVG(lat) as lat,
        AVG(lng) as lng,
        AVG(r.rainfall_mm) as avg_rainfall,
        AVG(r.river_discharge) as avg_discharge
      FROM panchayats p
      JOIN rainfall_data r ON p.id = r.panchayat_id
      WHERE r.date = (SELECT MAX(date) FROM rainfall_data)
      GROUP BY district
      ORDER BY district
    `).all();
    res.json(data);
  });

  app.get("/api/districts", (req, res) => {
    const data = db.prepare("SELECT DISTINCT district FROM panchayats ORDER BY district").all();
    res.json(data.map((d: any) => d.district));
  });

  app.get("/api/history/:panchayatId", (req, res) => {
    const data = db.prepare(`
      SELECT * FROM rainfall_data 
      WHERE panchayat_id = ? 
      ORDER BY date ASC
    `).all(req.params.panchayatId);
    res.json(data);
  });

  app.post("/api/analyze", async (req, res) => {
    try {
      const { panchayatData } = req.body;
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze this flood risk data for Kerala Panchayats and provide a granular summary of high-risk local areas and specific community-level actions. Data: ${JSON.stringify(panchayatData)}`,
        config: {
          systemInstruction: "You are FloodGuard AI, an expert hydrologist specializing in Kerala's local geography and Panchayat-level disaster management. Provide hyper-local, actionable insights."
        }
      });
      res.json({ analysis: response.text });
    } catch (error) {
      res.status(500).json({ error: "AI Analysis failed" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
