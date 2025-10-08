
import  'dotenv/config'
import express from 'express'
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectdb from './db/connectDB.js';
const app=express();
import productRoutes from './routes/productRoutes.js'
import productFeedbackRoutes from './routes/productFeedbackRoutes.js'
import bannerRoutes from './routes/bannerRoutes.js';
const PORT=process.env.PORT || 5002;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'], // ✅ Frontend URL
  credentials: true                // ✅ Required to send cookies/JWT
}));
app.use(express.json());
app.use(cookieParser());
connectdb();

app.get('/productHealth',(_,res)=>res.json({ok:true,message:"Healthy !"}));

app.use('/productList',productRoutes);
app.use('/productFeedback',productFeedbackRoutes);
app.use('/banner',bannerRoutes);


app.listen(PORT,()=>{
console.log(`${PORT} is listen`)
})
