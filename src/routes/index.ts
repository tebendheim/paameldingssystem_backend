// src/routes/index.ts
import { Router, Request, Response } from "express";
import usersRouter from "./users";
import authRouter from "./auth"
import bcrypt from "bcrypt";
import eventRoutes from "./events"
import registrationRoutes from "./registration"
import fieldRoutes from "./registrationfields"


const router = Router();


router.get("/", async (req:Request, res:Response) =>{
    res.json("dette er routes.index")
})
router.use("/auth", authRouter)
router.use("/users", usersRouter);
router.use("/events", eventRoutes);
router.use("/registration", registrationRoutes);
router.use("/fields", fieldRoutes)

router.post("/",async (req:Request, res:Response) => {
    console.log(req.body)
    const {password} = req.body
    const hashed = await bcrypt.hash(password, 10);
    
    res.send({ hashed }); // eller res.json({ hashed });
} );

//router.use("/auth", authRouter); // optional, just an example

export default router;