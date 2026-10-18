import dotenv from 'dotenv'
dotenv.config({ path: "../.env" })


import nodemailer from "nodemailer";

const password = process.env.PASSWORD
const email = process.env.EMAIL

const transporter = nodemailer.createTransport({
    host: "smtp.example.com",
    port: 587,
    secure: false, // Start unencrypted, upgrade via STARTTLS
    auth: {
        user: email,
        pass: password,
    },
});


console.log("password: ", password, "email: ", email)
