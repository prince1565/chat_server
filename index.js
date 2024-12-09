const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const multer = require('multer');
const AWS = require('aws-sdk')
const path = require('path');
require('dotenv').config();
const corsOptions ={
    origin:'http://localhost:3000', 
    credentials:true,            //access-control-allow-credentials:true
    optionSuccessStatus:200
}


// Middlewares
const app = express();
app.use(cors());
app.use(cors(corsOptions));
app.use(express.json());



const storage = multer.memoryStorage();  // Store file in memory
const upload = multer({ storage: storage });



// databse conncction 
var db=mysql.createPool({
    host: process.env.Host_Name,
    user: process.env.User_Name,
    password: process.env.Password,
    database: process.env.Database_Name,
});



// Aws COnfiguration 
// AWS S3 configuration
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});



app.get('/',(req,res)=>{
    res.send("app is running");
})


app.get('/api/getMessages/:chatId', function (req, res) {
    const {chatId} = req.params; // Access chatId from URL params
    

    const query = "SELECT text FROM incomingmessages WHERE chatid = ?";
    db.query(query, chatId, function (error, result) {
        if (error) {
            console.error(error);
            res.status(500).send(error); // Use a proper HTTP status code
        } else {
            
            res.status(200).send(result); // Ensure success response
        }
    });
});




// Route to handle image upload from URL
app.post('/aws_upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'File is required' });
    }
  
    try {
      // Generate a unique file name
      const fileName = `${Date.now()}-snowebs-${Math.random().toString(36).substring(7)}${path.extname(req.file.originalname)}`;
  
      // Set up S3 upload parameters
      const uploadParams = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: fileName,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      };
  
      // Upload image to S3
      const s3Result = await s3.upload(uploadParams).promise();
      const publicUrl = s3Result.Location; // URL of the uploaded file
  
      return res.status(200).json({
        message: 'Image uploaded successfully',
        url: publicUrl,
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      return res.status(500).json({ error: 'Failed to upload image' });
    }
  });







app.listen(process.env.Port,(req,res)=>{
    console.log('app is running in port ',process.env.Port);
})

