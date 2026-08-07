import axios, { AxiosError } from "axios";
import {expect , it, describe , mock } from "bun:test";

const USER_EMAIL = `Harkirat${Math.random()}@gmail.com`;
const BACKEND_URL ="http://localhost:3000"

describe("authorization", () =>{
    it("signup doesn't work if email is not provided",async()=>{
        try{
            const response= await axios.post(`${BACKEND_URL}/api/v1/signup`, {
                password:"123123"
            })
            expect().fail();
        }catch(e){
            if(e instanceof AxiosError){
                expect(e.response?.status).toBe(400);
            }else{
                expect().fail()
            }
        }
    })

    it("signup doesn't work if password is not provided", async ()=> {
        try{
            const response = await axios.post(`${BACKEND_URL}/api/v1/signup`,{
                email:USER_EMAIL
            })
            expect().fail();
        }catch(e){
            if (e instanceof AxiosError){
                expect(e.response?.status).toBe(400);
            }else{
                expect().fail()
            }
        }
    })

    it("signup doesn't work if email already exsists in the databse", async () =>{
        try{
            const response = await axios.post(`${BACKEND_URL}/api/v1/signup`,{
                email:"harkiratSingh@gmail.com",
                password:"123123",
                profile:"jasdas.png",
                description:"backend developer"

            })
            mockPrisma.user.findUnique.mockResolvedValue({
                email: "harkiratSingh@gmail.com",
   
            });
         expect().fail();

        }
    })


})

