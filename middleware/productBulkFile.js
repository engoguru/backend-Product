import multer from "multer";
import path from 'path'

const storage=multer.diskStorage({
    destination:function(req,file,cb){
cb(null,'/uploads')
    },
    filename:function(req,file,cb){
const ext=path.extname(file.originalname);
 cb(null, `${Date.now()}${ext}`);
    }
})

const fileFilter=(req,file,cb)=>{
    const allowedTypes=['.csv','.xlsx'];
    const ext=path.extname(file.originalname);
    if(allowedTypes.includes(ext)){
        cb(null,true)
    }else{
        cb(new Error(""))
    }
}
const uploads=multer({storage,fileFilter})
export default uploads