import  Express, {Request,Response}  from "express";

const app = Express();

const port = 3000;

app.get("/", (req:Request,res:Response) =>{
    res.send("hei fra backend");
});

app.listen(port, () => {
    console.log(`Exspress kjører på http://localhost:${port}`)
});