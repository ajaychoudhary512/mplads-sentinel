export const STATE_COORDINATES: Record<string, [number, number]> = {
  "andhra pradesh": [15.9129, 79.7400],
  "arunachal pradesh": [28.2180, 94.7278],
  "assam": [26.2006, 92.9376],
  "bihar": [25.0961, 85.3131],
  "chhattisgarh": [21.2787, 81.8661],
  "goa": [15.2993, 74.1240],
  "gujarat": [22.2587, 71.1924],
  "haryana": [29.0588, 76.0856],
  "himachal pradesh": [31.1048, 77.1734],
  "jharkhand": [23.6102, 85.2799],
  "karnataka": [15.3173, 75.7139],
  "kerala": [10.8505, 76.2711],
  "madhya pradesh": [22.9734, 78.6569],
  "maharashtra": [19.7515, 75.7139],
  "manipur": [24.6637, 93.9063],
  "meghalaya": [25.4670, 91.3662],
  "mizoram": [23.1645, 92.9376],
  "nagaland": [26.1584, 94.5624],
  "odisha": [20.9517, 85.0985],
  "punjab": [31.1471, 75.3412],
  "rajasthan": [27.0238, 74.2179],
  "sikkim": [27.5330, 88.5122],
  "tamil nadu": [11.1271, 78.6569],
  "telangana": [18.1124, 79.0193],
  "tripura": [23.9408, 91.9882],
  "uttar pradesh": [26.8467, 80.9462],
  "uttarakhand": [30.0668, 79.0193],
  "west bengal": [22.9868, 87.8550],
  "andaman and nicobar islands": [11.7401, 92.6586],
  "chandigarh": [30.7333, 76.7794],
  "dadra and nagar haveli and daman and diu": [20.1809, 73.0169],
  "lakshadweep": [10.5667, 72.6417],
  "delhi": [28.7041, 77.1025],
  "puducherry": [11.9416, 79.8083],
  "ladakh": [34.1526, 77.5771],
  "jammu and kashmir": [33.7782, 76.5762]
};

export const DISTRICT_COORDINATES: Record<string, [number, number]> = {
  // Rajasthan
  "alwar": [27.5530, 76.6346],
  "bikaner": [28.0229, 73.3119],
  "barmer": [25.7532, 71.3967],
  "jaipur": [26.9124, 75.7873],
  "jodhpur": [26.2389, 73.0243],
  "udaipur": [24.5854, 73.7125],
  "kota": [25.2138, 75.8648],
  "ajmer": [26.4499, 74.6399],
  "bhilwara": [25.3407, 74.6313],
  "sikar": [27.6094, 75.1399],
  "churu": [28.2900, 74.9600],
  "jhunjhunu": [28.1289, 75.3995],
  "nagaur": [27.2070, 73.7423],
  "pali": [25.7711, 73.3234],
  "bharatpur": [27.2152, 77.5030],

  // Uttar Pradesh
  "lucknow": [26.8467, 80.9462],
  "varanasi": [25.3176, 82.9739],
  "jaunpur": [25.7335, 82.6837],
  "bijnor": [29.3724, 78.1358],
  "bhadohi": [25.3957, 82.5694],
  "kaushambi": [25.5312, 81.3813],
  "kheri": [27.9472, 80.7787],
  "agra": [27.1767, 78.0081],
  "aligarh": [27.8974, 78.0880],
  "ayodhya": [26.7922, 82.1998],
  "gorakhpur": [26.7606, 83.3732],
  "kanpur": [26.4499, 80.3319],
  "kanpur nagar": [26.4499, 80.3319],
  "meerut": [28.9845, 77.7064],
  "prayagraj": [25.4358, 81.8463],
  "ghaziabad": [28.6692, 77.4538],
  "gautam buddha nagar": [28.5355, 77.3910],
  "moradabad": [28.8386, 78.7733],
  "bareilly": [28.3670, 79.4304],
  "jhansi": [25.4484, 78.5685],
  "pratapgarh": [25.8975, 81.9467],
  "machhlishahr": [25.6881, 82.4173],
  "robertsganj": [24.6858, 83.0673],
  "firozabad": [27.1591, 78.3957],
  "etawah": [26.7855, 79.0154],
  "farrukhabad": [27.3826, 79.5802],

  // Maharashtra
  "mumbai": [18.9220, 72.8347],
  "mumbai city": [18.9220, 72.8347],
  "mumbai suburban": [19.0760, 72.8777],
  "pune": [18.5204, 73.8567],
  "nagpur": [21.1458, 79.0882],
  "thane": [19.2183, 72.9781],
  "nashik": [19.9975, 73.7898],
  "chhatrapati sambhajinagar": [19.8762, 75.3433],
  "solapur": [17.6599, 75.9064],
  "amravati": [20.9320, 77.7523],
  "kolhapur": [16.7050, 74.2433],
  "nanded": [19.1383, 77.3210],

  // Gujarat
  "ahmedabad": [23.0225, 72.5714],
  "surat": [21.1702, 72.8311],
  "vadodara": [22.3072, 73.1812],
  "rajkot": [22.3039, 70.8022],
  "navsari": [20.9467, 72.9520],
  "bhavnagar": [21.7645, 72.1519],
  "jamnagar": [22.4707, 70.0577],
  "gandhinagar": [23.2156, 72.6369],
  "kutch": [23.7337, 69.8597],

  // Bihar
  "patna": [25.5941, 85.1376],
  "gaya": [24.7914, 85.0002],
  "bhagalpur": [25.2425, 86.9842],
  "muzaffarpur": [26.1209, 85.3647],
  "darbhanga": [26.1542, 85.8918],
  "purnia": [25.7771, 87.4753],
  "nalanda": [25.1982, 85.5149],

  // West Bengal
  "kolkata": [22.5726, 88.3639],
  "south 24 parganas": [22.1352, 88.5414],
  "north 24 parganas": [22.7210, 88.4816],
  "howrah": [22.5958, 88.2636],
  "hooghly": [22.9034, 88.3966],
  "murshidabad": [24.1759, 88.2802],
  "purba bardhaman": [23.2324, 87.8615],
  "darjeeling": [27.0410, 88.2663],

  // Tamil Nadu
  "chennai": [13.0827, 80.2707],
  "coimbatore": [11.0168, 76.9558],
  "madurai": [9.9252, 78.1198],
  "tiruchirappalli": [10.7905, 78.7047],
  "salem": [11.6643, 78.1460],
  "tiruvannamalai": [12.2253, 79.0747],
  "viluppuram": [11.9401, 79.4861],
  "tirunelveli": [8.7139, 77.7567],

  // Telangana & Andhra Pradesh
  "hyderabad": [17.3850, 78.4867],
  "nizamabad": [18.6725, 78.0941],
  "bhongir": [17.5108, 78.8899],
  "warangal": [17.9689, 79.5941],
  "karimnagar": [18.4386, 79.1288],
  "visakhapatnam": [17.6868, 83.2185],
  "vijayawada": [16.5062, 80.6480],
  "guntur": [16.3067, 80.4365],
  "tirupati": [13.6288, 79.4192],

  // Punjab & Haryana
  "amritsar": [31.6340, 74.8723],
  "ludhiana": [30.9010, 75.8573],
  "jalandhar": [31.3260, 75.5762],
  "firozpur": [30.9237, 74.6065],
  "patiala": [30.3398, 76.3869],
  "gurugram": [28.4595, 77.0266],
  "faridabad": [28.4089, 77.3178],
  "panipat": [29.3909, 76.9635],
  "karnal": [29.6857, 76.9905],

  // Madhya Pradesh
  "bhopal": [23.2599, 77.4126],
  "indore": [22.7196, 75.8577],
  "gwalior": [26.2183, 78.1828],
  "jabalpur": [23.1815, 79.9864],
  "ujjain": [23.1765, 75.7885],
  "sagar": [23.8388, 78.7378],
  "rewa": [24.5362, 81.3037],

  // Karnataka & Kerala
  "bengaluru urban": [12.9716, 77.5946],
  "bengaluru rural": [13.2257, 77.5750],
  "mysuru": [12.2958, 76.6394],
  "mangaluru": [12.9141, 74.8560],
  "belagavi": [15.8497, 74.4977],
  "thiruvananthapuram": [8.5241, 76.9366],
  "kochi": [9.9312, 76.2673],
  "ernakulam": [9.9816, 76.2999],
  "kozhikode": [11.2588, 75.7804],
  "thrissur": [10.5276, 76.2144],

  // Odisha, Jharkhand & Chhattisgarh
  "bhubaneswar": [20.2961, 85.8245],
  "cuttack": [20.4625, 85.8828],
  "puri": [19.8135, 85.8312],
  "sambalpur": [21.4669, 83.9812],
  "ranchi": [23.3441, 85.3096],
  "jamshedpur": [22.8046, 86.2029],
  "dhanbad": [23.7957, 86.4304],
  "bokaro": [23.6693, 86.1511],
  "giridih": [24.1904, 86.3021],
  "raipur": [21.2514, 81.6296],
  "bilaspur": [22.0797, 82.1409],
  "durg": [21.1904, 81.2849],

  // Delhi & UTs
  "delhi": [28.7041, 77.1025],
  "new delhi": [28.6139, 77.2090],
  "chandigarh": [30.7333, 76.7794],
  "srinagar": [34.0837, 74.7973],
  "jammu": [32.7266, 74.8570],
  "leh": [34.1526, 77.5771],
  "guwahati": [26.1445, 91.7362]
};

export function getCoordinates(state: string, districtOrConstituency: string): [number, number] {
  const normName = (districtOrConstituency || "").toLowerCase().trim();
  
  // 1. Direct match in DISTRICT_COORDINATES
  if (DISTRICT_COORDINATES[normName]) {
    return DISTRICT_COORDINATES[normName];
  }

  // 2. Substring match in DISTRICT_COORDINATES
  for (const [key, coords] of Object.entries(DISTRICT_COORDINATES)) {
    if (normName.includes(key) || key.includes(normName)) {
      return coords;
    }
  }

  // 3. Fallback to state coordinates with deterministic pseudo-random jitter
  const normState = (state || "").toLowerCase().trim();
  let stateCoords = STATE_COORDINATES[normState];
  
  if (!stateCoords) {
    for (const [sKey, coords] of Object.entries(STATE_COORDINATES)) {
      if (normState.includes(sKey) || sKey.includes(normState)) {
        stateCoords = coords;
        break;
      }
    }
  }

  const baseCoords = stateCoords || [22.5937, 78.9629];

  // Deterministic jitter for visual distinction on map
  let hash = 0;
  for (let i = 0; i < normName.length; i++) {
    hash = (hash << 5) - hash + normName.charCodeAt(i);
    hash |= 0;
  }

  const latJitter = (Math.sin(hash) * 0.8);
  const lngJitter = (Math.cos(hash) * 0.8);

  return [baseCoords[0] + latJitter, baseCoords[1] + lngJitter];
}
