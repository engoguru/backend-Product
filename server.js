
import  'dotenv/config'
import express from 'express'
import cors from 'cors';
import connectdb from './db/connectDB.js';
const app=express();
import productRoutes from './routes/productRoutes.js'
import productFeedbackRoutes from './routes/productFeedbackRoutes.js'
const PORT=process.env.PORT || 5002;


app.use(cors())
app.use(express.json());
connectdb();

app.get('/productHealth',(_,res)=>res.json({ok:true,message:"Healthy !"}));

app.use('/productList',productRoutes);
app.use('/productFeedback',productFeedbackRoutes);


app.listen(PORT,()=>{
console.log(`${PORT} is listen`)
})
