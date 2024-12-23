const http = require('http');
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || "mongodb+srv://furkanbabo741:rAF52xfVokkj1JxR@cluster0.djthv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0&tls=true&tlsAllowInvalidCertificates=true";
const client = new MongoClient(uri);

let usersCollection;
let petCollection;
let appointmentCollection;
client.connect().then(() => {
    usersCollection = client.db("PetAppDB").collection("users");
    petCollection = client.db("PetAppDB").collection("pets");
    appointmentCollection = client.db("PetAppDB").collection("AppointmentPets");
    console.log("Connected to MongoDB");
}).catch(error =>
    console.error("Error connecting to MongoDB:", error)
);

const sendResponse = (res, statusCode, data) => {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
};

// Kullanıcı kaydı
const registerUser = async (req, res, body) => {
    const { email, password } = JSON.parse(body);

    // Kullanıcı zaten var mı?
    try{
        const userExists = await usersCollection.findOne({ email });
    if (userExists) return sendResponse(res, 400, { error: "Kullanıcı zaten mevcut" });

    // Kullanıcıyı kaydet
    const result = await usersCollection.insertOne({ email, password });
    sendResponse(res, 201, { message: "Kullanıcı kayıt oldu", userId: result.insertedId });
    }
    catch(e){
        console.error(e,"serviste register error verdi knk");
        sendResponse(res, 500, { error: "Sunucu hatası oluştu" });
    }
    
};

// Kullanıcı girişi
const loginUser = async (req, res, body) => {
    const { email, password } = JSON.parse(body);

    try{
        // Kullanıcıyı kontrol et
    const user = await usersCollection.findOne({ email, password });
    if (!user) {
        return sendResponse(res, 401, { error: "Yanlış eposta veya şifre" });
    }

    // Basit bir oturum anahtarı gibi kullanıcı kimliği döndür
    sendResponse(res, 200, { message: "Giriş başarılı", userId: user._id });
    }
    catch(e){
        console.error(e,"serviste login error verdi knk");
        sendResponse(res, 500, { error: "Sunucu hatası oluştu" });
    }
};

const AddPet = async (req, res, body) =>{
    const {uId, petphoto, petname, petage, petgender, petspecies, petrace, createdAt} = JSON.parse(body);
    try{
    const pet = await petCollection.insertOne({uId, petphoto, petname, petage, petgender, petspecies, petrace, createdAt});
    sendResponse(res, 201, { message: "evcil hayvan eklendi", userId: pet.insertedId });
}
    catch(error){
        console.error("serviste addpet hata verdi knk",error);
        sendResponse(res, 500, { error: "Sunucu hatası oluştu" });
    }
}

const FetchAllPet = async (req, res, body) =>{
    try{
        const { Id }  = body;
        console.log("Sunucuya gelen uId:", Id);
        const pet = await petCollection.find({ Id }).toArray();
        console.log("Sorgu sonucu:", pet);
        if (!pet.length) {
            return sendResponse(res, 404, { message: "Hiç evcil hayvan bulunamadı" });
        }
        sendResponse(res, 201, {pets: pet});
    }
    catch(e){
        console.error(e,"Hayvan çekerken hata oldu knk");
        sendResponse(res, 500, { error: "Sunucu hatası oluştu" });
    }
}

const fetchAppointment = async(req, res, body)=>{
    try{
        const { id } = body;
        console.log("Sunucuya giden uid:",id);
        const appointment = await appointmentCollection.find({ id }).toArray();
        console.log("sorgu sonucu:", appointment);
        if(!appointment){
            return sendResponse(res, 404, { message: "Hiç randevu bulunamadı" });
        }
        sendResponse(res, 201, {AppointmentPets: appointment}); 
    }
    catch(e){
        console.error(e,"Randevu çekerken serviste hata oldu knk");
        sendResponse(res, 500, { error: "Sunucu hatası oluştu" });
    }
}

const GetAppointment = async(req, res, body)=>{
  const { uid, petId, petName, explain, appDate } = JSON.parse(body);
  try{
    const result = await appointmentCollection.insertOne({ uid, petId, petName, explain, appDate });
    sendResponse(res, 201, { message: "Randevu kaydedildi", AppointmenId: result.insertedId });
  }
  catch(e){
    console.error("servis kisminda hata",e);
    sendResponse(res, 500, { error: "Sunucu hatası oluştu" });
  }
}

// Çıkış işlemi
const logoutUser = async (res) => {
    try{
        sendResponse(res, 200, { message: "başarılı" });
        console.log("Logout service kisminda basarili");
    }
    catch(e){
        sendResponse(res, 500, { message: "başarısız" });
        console.error("Logout service kisminda basarisiz");
    }
    
};

// HTTP sunucusu
const server = http.createServer(async (req, res) => {
    let body = '';

    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
        if (req.method === 'POST' && req.url === '/register') {
            await registerUser(req, res, body);
        } else if (req.method === 'POST' && req.url === '/login') {
            await loginUser(req, res, body);
        } else if (req.method === 'POST' && req.url === '/logout') {
            await logoutUser(res);
        }else if(req.method === 'POST' && req.url === '/addPet'){
            await AddPet(req, res, body);
        }
        else if(req.method === 'POST' && req.url === '/FetchAllPet'){
            await FetchAllPet(req, res, body);
        }
        else if(req.method === 'POST' && req.url === '/GetAppointment'){
            await GetAppointment(req, res, body);
        }
        else if(req.method === 'POST' && req.url === '/fetchAppointment'){
            await fetchAppointment(req, res, body);
        }
         else {
            sendResponse(res, 404, { error: "Not found" });
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
